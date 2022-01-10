import { useState, useMemo } from 'react';
import {
  ConfirmOptions, Connection as RPCConnection,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import BN from 'bn.js';
import bs58 from 'bs58';
import { sha256 } from "js-sha256";
import {AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {CHAIN_ID_NONE, ChainId} from '../lib/consts';
import ConsoleHelper from '../helpers/ConsoleHelper';
import {GUMDROP_DISTRIBUTOR_ID, SOLANA_HOST} from "../utils/consts";
import {pubkeyToString, toPublicKey} from "../utils/solanaHelper";
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { MerkleTree } from "../utils/merkleTree";
import { coder } from "../utils/merkleDistributor";
import {
  sendSignedTransaction,
} from "../utils/transactions";

export enum ClaimStatusCode {
  NONE = 0,
  START,
  RECEIVING,
  SUCCESS,
  FAILED = 101,
}

export enum ClaimErrorCode {
  NO_ERROR,
  INVALID_TARGET_ADDRESS,
  TOKEN_AMOUNT_NOT_ENOUGH,
  CLAIM_FAILED,
}

interface IClaimStatus {
  claim(params: IClaimParams): void;

  isProcessing: boolean;
  statusCode: ClaimStatusCode;
  errorCode: ClaimErrorCode;
  lastError: string | null;
  targetChain: ChainId;
  targetTxId: string;
}

export interface IClaimParams {
  distributor: string | PublicKey,
  amount: string,
  handle: string,
  proof: string,
  index: string,
  tokenAcc: string | PublicKey
}

const createRedeemStatus = (
  claim: (params: IClaimParams) => void,
  isProcessing: boolean,
  statusCode = ClaimStatusCode.NONE,
  errorCode: ClaimErrorCode,
  lastError: string | null,
  targetChain: ChainId,
  targetTxId: string
) => ({
  claim,
  isProcessing,
  statusCode,
  errorCode,
  lastError,
  targetChain,
  targetTxId
});

function useClaim(): IClaimStatus {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusCode, setStatusCode] = useState(ClaimStatusCode.NONE);
  const [targetTxId, setTargetTxId] = useState('');
  const [targetChain, setTargetChain] = useState(CHAIN_ID_NONE);
  const [errorCode, setErrorCode] = useState(ClaimErrorCode.NO_ERROR);
  const [lastError, setLastError] = useState('');
  const walletSolana = useSolanaWallet();
  const solanaConnection = useMemo(() => new Connection(SOLANA_HOST, 'confirmed'), []);

  // async function getAnchorProvider() {
  //   const opts = {
  //     preflightCommitment: 'confirmed',
  //   };
  //   if (!solanaConnection || !walletSolana) {
  //     return null;
  //   }
  //   return new AnchorProvider(
  //     solanaConnection,
  //     walletSolana as unknown as AnchorWallet,
  //     opts.preflightCommitment as unknown as ConfirmOptions,
  //   );
  // }

  const setError = (error: ClaimErrorCode) => {
    setStatusCode(ClaimStatusCode.FAILED);
    setErrorCode(error);
    setIsProcessing(false);
  };

  const walletKeyOrPda = async (
    walletKey : PublicKey,
    handle : string,
    seed : PublicKey,
  ) : Promise<[PublicKey, Array<Buffer>]> => {
      try {
        const key = new PublicKey(handle);
        if (!key.equals(walletKey)) {
          throw new Error("Claimant wallet handle does not match connected wallet");
        }
        return [key, []];
      } catch (err) {
        throw new Error(`Invalid claimant wallet handle ${err}`);
      }
  }

  const fetchDistributor = async (
    connection : RPCConnection,
    distributorStr : string,
  ) => {
    let key;
    try {
      key = new PublicKey(distributorStr);
    } catch (err) {
      throw new Error(`Invalid distributor key ${err}`);
    }
    const account = await connection.getAccountInfo(key);
    if (account === null) {
      throw new Error(`Could not fetch distributor ${distributorStr}`);
    }
    if (!account.owner.equals(GUMDROP_DISTRIBUTOR_ID)) {
      const ownerStr = account.owner.toBase58();
      throw new Error(`Invalid distributor owner ${ownerStr}`);
    }
    const info = coder.accounts.decode("MerkleDistributor", account.data);
    return [key, info];
  };

  const buildMintClaim = async(params: IClaimParams) => {
    const { publicKey: walletPublicKey } = walletSolana;
    if (!solanaConnection || !walletPublicKey) {
      throw new Error(`Not ready`);
    }
    const distTokenAccount = await solanaConnection.getAccountInfo(toPublicKey(params.tokenAcc));
    if (distTokenAccount === null) {
      throw new Error(`Could not fetch distributor token account`);
    }
    const tokenAccountInfo = AccountLayout.decode(distTokenAccount.data);
    const mint = new PublicKey(tokenAccountInfo.mint);
    ConsoleHelper("ChickToken", pubkeyToString(mint));

    const [secret, pdaSeeds] = await walletKeyOrPda(walletPublicKey, params.handle, mint);
    const leaf = Buffer.from(
      [...new BN(params.index).toArray("le", 8),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...secret.toBuffer(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...mint.toBuffer(),
        ...new BN(params.amount).toArray("le", 8),
      ]
    );

    const proof = params.proof === "" ? [] : params.proof.split(",").map(b => {
      const ret = Buffer.from(bs58.decode(b))
      if (ret.length !== 32)
        throw new Error(`Invalid proof hash length`);
      return ret;
    });

    const [distributorKey, distributorInfo] =
      await fetchDistributor(solanaConnection, pubkeyToString(params.distributor));

    const matches = MerkleTree.verifyClaim(
      leaf, proof, Buffer.from(distributorInfo.root)
    );

    if (!matches) {
      throw new Error("Gumdrop merkle proof does not match");
    }

    const [claimStatus, cbump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("ClaimStatus"),
        Buffer.from(new BN(params.index).toArray("le", 8)),
        distributorKey.toBuffer(),
      ],
      GUMDROP_DISTRIBUTOR_ID
    );

    // check association token account.
    const [walletTokenKey, ] = await PublicKey.findProgramAddress(
      [
        walletPublicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const setup : Array<TransactionInstruction> = [];
    if (await solanaConnection.getAccountInfo(walletTokenKey) === null) {
      setup.push(Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        walletTokenKey,
        walletPublicKey,
        walletPublicKey
      ));
    }

    const temporalSigner = distributorInfo.temporal.equals(PublicKey.default) || secret.equals(walletPublicKey)
      ? walletPublicKey : distributorInfo.temporal;

    const claimAirdrop = new TransactionInstruction({
      programId: GUMDROP_DISTRIBUTOR_ID,
      keys: [
        { pubkey: toPublicKey(params.distributor)          , isSigner: false , isWritable: true  } ,
        { pubkey: claimStatus             , isSigner: false , isWritable: true  } ,
        { pubkey: toPublicKey(params.tokenAcc)             , isSigner: false , isWritable: true  } ,
        { pubkey: walletTokenKey          , isSigner: false , isWritable: true  } ,
        { pubkey: temporalSigner          , isSigner: true  , isWritable: false } ,
        { pubkey: walletPublicKey               , isSigner: true  , isWritable: false } ,  // payer
        { pubkey: SystemProgram.programId , isSigner: false , isWritable: false } ,
        { pubkey: TOKEN_PROGRAM_ID        , isSigner: false , isWritable: false } ,
      ],
      data: Buffer.from([
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...Buffer.from(sha256.digest("global:claim")).slice(0, 8),
        ...new BN(cbump).toArray("le", 1),
        ...new BN(params.index).toArray("le", 8),
        ...new BN(params.amount).toArray("le", 8),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...secret.toBuffer(),
        ...new BN(proof.length).toArray("le", 4),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...Buffer.concat(proof),
      ])
    })
    return [[...setup, claimAirdrop], pdaSeeds, []];
  }

  const processClaim = async (params: IClaimParams) => {
    const { publicKey: walletPublicKey, sendTransaction } = walletSolana;
    if (!solanaConnection || !walletPublicKey ) {
      throw new Error(`Wallet not connected`);
    }

    const [instructions, pdaSeeds, extraSigners] = await buildMintClaim(params);
    const transaction = new Transaction({
      feePayer: walletPublicKey,
      recentBlockhash: (await solanaConnection.getRecentBlockhash("singleGossip")).blockhash,
    });

    // const signers = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const instr of instructions) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transaction.add(instr);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-restricted-syntax
      // for (const key of instr.keys) {
      //   if (key.isSigner) {
      //     signers.push(key);
      //   }
      // }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // ConsoleHelper(`Expecting the following signers: ${[...signers].map(s => s.toBase58())}`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // transaction.setSigners(...signers);

    try {
      const signature = await sendTransaction(transaction, solanaConnection);
      await solanaConnection.confirmTransaction(signature, 'processed');

      ConsoleHelper("claimResult", signature)
    } catch(e) {
      ConsoleHelper("error", e);
    }
  };

  const claim = async (params: IClaimParams) => {
    await processClaim(params);
  };

  return createRedeemStatus(
    claim,
    isProcessing,
    statusCode,
    errorCode,
    lastError,
    targetChain,
    targetTxId
  );
}

export default useClaim;
