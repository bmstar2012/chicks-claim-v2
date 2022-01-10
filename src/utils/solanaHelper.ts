import { PublicKey, Connection, Signer, Transaction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== 'string') {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export async function signSendAndConfirm(
  wallet: WalletContextState,
  connection: Connection,
  transaction: Transaction,
) {
  if (!wallet.signTransaction) {
    throw new Error('wallet.signTransaction is undefined');
  }
  const signed = await wallet.signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txid);
  return txid;
}

export const validatePublicKey = (key: string | PublicKey): boolean => {
  try {
    return PublicKey.isOnCurve(toPublicKey(key).toBuffer());
  } catch (e) {
    return false;
  }
};

export const isAddress = validatePublicKey;

export const pubkeyToString = (key: PublicKey | null | string = '') =>
  typeof key === 'string' ? key : key?.toBase58() || '';

export const getAssociatedTokenAddress = (
  mintKey: PublicKey | string,
  ownerKey: PublicKey | string,
): Promise<PublicKey> =>
  Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    toPublicKey(mintKey),
    toPublicKey(ownerKey),
  );

export const getTokenObj = (
  connection: Connection,
  mintKey: PublicKey | string,
  payer: Signer,
) => new Token(connection, toPublicKey(mintKey), TOKEN_PROGRAM_ID, payer);
