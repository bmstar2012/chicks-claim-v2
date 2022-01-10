/* eslint-disable consistent-return */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography } from '@material-ui/core';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';

import { ChainId, CHAIN_ID_SOLANA } from '../lib/consts';
import { SOLANA_HOST } from '../utils/consts';
import { signSendAndConfirm } from '../utils/solanaHelper';
import ButtonWithLoader from './ButtonWithLoader';
import { SOLCHICK_TOKEN_MINT_ON_SOL } from '../utils/solchickConsts';

export function useAssociatedAccountExistsState(targetChain: ChainId) {
  const [associatedAccountExists, setAssociatedAccountExists] = useState(true);
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  useEffect(() => {
    setAssociatedAccountExists(true);
    if (targetChain !== CHAIN_ID_SOLANA || !solPK) {
      return;
    }
    let cancelled = false;
    (async () => {
      const connection = new Connection(SOLANA_HOST, 'confirmed');
      const mintPublicKey = new PublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
      const payerPublicKey = new PublicKey(solPK); // currently assumes the wallet is the owner
      const associatedAddress = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintPublicKey,
        payerPublicKey,
      );

      const associatedAddressInfo = await connection.getAccountInfo(
        associatedAddress,
      );
      if (!associatedAddressInfo) {
        if (!cancelled) {
          setAssociatedAccountExists(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetChain, solPK]);
  return useMemo(
    () => ({ associatedAccountExists, setAssociatedAccountExists }),
    [associatedAccountExists],
  );
}

export default function SolanaCreateAssociatedAddress({
  associatedAccountExists,
  setAssociatedAccountExists,
}: {
  associatedAccountExists: boolean;
  setAssociatedAccountExists: (associatedAccountExists: boolean) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const solanaWallet = useSolanaWallet();
  const solanaPublicKey = solanaWallet?.publicKey;
  const handleClick = useCallback(() => {
    if (associatedAccountExists || !solanaPublicKey) return;
    (async () => {
      const connection = new Connection(SOLANA_HOST, 'confirmed');
      const mintPublicKey = new PublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
      const payerPublicKey = new PublicKey(solanaPublicKey);
      const associatedAddress = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintPublicKey,
        payerPublicKey,
      );
      const associatedAddressInfo = await connection.getAccountInfo(
        associatedAddress,
      );
      if (!associatedAddressInfo) {
        setIsCreating(true);
        const transaction = new Transaction().add(
          await Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPublicKey,
            associatedAddress,
            payerPublicKey,
            payerPublicKey,
          ),
        );
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(payerPublicKey);
        await signSendAndConfirm(solanaWallet, connection, transaction);
        setIsCreating(false);
        setAssociatedAccountExists(true);
      } else {
      }
    })();
  }, [
    associatedAccountExists,
    setAssociatedAccountExists,
    solanaPublicKey,
    solanaWallet,
  ]);
  if (associatedAccountExists) {
    return null;
  }
  return (
    <>
      <Typography
        color="error"
        variant="body2"
        style={{ paddingBottom: '10px' }}
      >
        This associated token account does not exist.
      </Typography>
      <ButtonWithLoader
        disabled={!solanaPublicKey || isCreating}
        onClick={handleClick}
        showLoader={isCreating}
      >
        Create Associated Token Account
      </ButtonWithLoader>
    </>
  );
}
