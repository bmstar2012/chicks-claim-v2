import { PublicKey } from '@solana/web3.js';
import { formatUnits } from '@ethersproject/units';
import { CHAIN_ID_SOLANA, ChainId } from '../lib/consts';
import { isEVMChain } from '../lib/array';
import { getAssociatedTokenAddress } from './solanaHelper';
import {
  SOLCHICK_TOKEN_MINT_ON_SOL,
  SOLCHICK_DECIMALS_ON_SOL
} from './solchickConsts';

export const getSolChicksAssociatedAddress = async (
  address: string | PublicKey,
): Promise<PublicKey> =>
  getAssociatedTokenAddress(SOLCHICK_TOKEN_MINT_ON_SOL, address);

export const toBalanceString = (
  balance: bigint | undefined,
  chainId: ChainId,
) => {
  if (!chainId || balance === undefined) {
    return '';
  }
  if (isEVMChain(chainId)) {
    return formatUnits(balance, 18); // wei decimals
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return formatUnits(balance, 9); // lamports to sol decimals
  }
  return '';
};

export const toTokenBalanceString = (
  balance: bigint | undefined,
  chainId: ChainId,
) => {
  if (!chainId || balance === undefined) {
    return '';
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return formatUnits(balance, SOLCHICK_DECIMALS_ON_SOL);
  }
  return '';
};
