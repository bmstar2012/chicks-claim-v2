import React from 'react';
import { ChainId, CHAIN_ID_SOLANA } from '../lib/consts';
import SolanaWalletKey from './SolanaWalletKey';

function KeyAndBalance({ chainId }: { chainId: ChainId }) {
  if (chainId === CHAIN_ID_SOLANA) {
    return (
      <>
        <SolanaWalletKey />
      </>
    );
  }
  return null;
}

export default KeyAndBalance;
