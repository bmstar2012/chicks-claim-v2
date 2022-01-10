import { PublicKey } from '@solana/web3.js';
import { hexValue, hexZeroPad, stripZeros } from 'ethers/lib/utils';
import { arrayify, zeroPad } from '@ethersproject/bytes';

import {
  ChainId,
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  CHAIN_ID_POLYGON,
  CHAIN_ID_ETHEREUM_ROPSTEN,
  CHAIN_ID_AVAX,
} from './consts';

export const isEVMChain = (chainId: ChainId) =>
  chainId === CHAIN_ID_ETH ||
  chainId === CHAIN_ID_BSC ||
  chainId === CHAIN_ID_ETHEREUM_ROPSTEN ||
  chainId === CHAIN_ID_AVAX ||
  chainId === CHAIN_ID_POLYGON;

export const isHexNativeTerra = (h: string) => h.startsWith('01');
export const nativeTerraHexToDenom = (h: string) =>
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  Buffer.from(stripZeros(hexToUint8Array(h.substr(2)))).toString('ascii');
export const uint8ArrayToHex = (a: Uint8Array) =>
  Buffer.from(a).toString('hex');
export const hexToUint8Array = (h: string) =>
  new Uint8Array(Buffer.from(h, 'hex'));
export const hexToNativeString = (h: string | undefined, c: ChainId) => {
  try {
    // eslint-disable-next-line no-nested-ternary
    return !h
      ? undefined
      : // eslint-disable-next-line no-nested-ternary
      c === CHAIN_ID_SOLANA
      ? new PublicKey(hexToUint8Array(h)).toString()
      : // eslint-disable-next-line no-nested-ternary
      isEVMChain(c)
      ? hexZeroPad(hexValue(hexToUint8Array(h)), 20)
      : // eslint-disable-next-line no-nested-ternary
      c === CHAIN_ID_TERRA
      ? isHexNativeTerra(h)
        ? nativeTerraHexToDenom(h)
        : '' // humanAddress(hexToUint8Array(h.substr(24))) // terra expects 20 bytes, not 32
      : h;
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return undefined;
};

export const nativeToHexString = (
  address: string | undefined,
  chain: ChainId,
) => {
  if (!address || !chain) {
    return null;
  }

  if (isEVMChain(chain)) {
    return uint8ArrayToHex(zeroPad(arrayify(address), 32));
  }
  if (chain === CHAIN_ID_SOLANA) {
    return uint8ArrayToHex(zeroPad(new PublicKey(address).toBytes(), 32));
  }
  return null;
};

export const uint8ArrayToNative = (a: Uint8Array, chainId: ChainId) =>
  hexToNativeString(uint8ArrayToHex(a), chainId);
