import { clusterApiUrl } from '@solana/web3.js';
import {
  ChainId,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_ETHEREUM_ROPSTEN,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
} from '../lib/consts';
// import {getAddress} from "ethers/lib/utils";
// import avaxIcon from "../icons/avax.svg";
import bscIcon from '../icons/bsc.svg';
import ethIcon from '../icons/eth.svg';
// import oasisIcon from "../icons/oasis-network-rose-logo.svg";
// import polygonIcon from "../icons/polygon.svg";
import solanaIcon from '../icons/solana.svg';
// import terraIcon from "../icons/terra.svg";
// import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import { isEVMChain } from '../lib/array';

// It's difficult to project how many fees the user will accrue during the
// workflow, as a variable number of transactions can be sent, and different
// execution paths can be hit in the smart contracts, altering gas used.
// As such, for the moment it is best to just check for a reasonable 'low balance' threshold.
// Still it would be good to calculate a reasonable value at runtime based off current gas prices,
// rather than a hardcoded value.
const SOLANA_THRESHOLD_LAMPORTS = BigInt(300000);
const ETHEREUM_THRESHOLD_WEI = BigInt(35000000000000000);
const TERRA_THRESHOLD_ULUNA = BigInt(500000);

export const isSufficientBalance = (
  chainId: ChainId,
  balance: bigint | undefined,
) => {
  if (balance === undefined || !chainId) {
    return false;
  }
  if (CHAIN_ID_SOLANA === chainId) {
    return balance > SOLANA_THRESHOLD_LAMPORTS;
  }
  if (isEVMChain(chainId)) {
    return balance > ETHEREUM_THRESHOLD_WEI;
  }
  if (CHAIN_ID_TERRA === chainId) {
    return balance > TERRA_THRESHOLD_ULUNA;
  }

  return false;
};

export const getDefaultNativeCurrencySymbol = (chainId: ChainId): string => {
  let symbol = '';
  switch (chainId) {
    case CHAIN_ID_SOLANA:
      symbol = 'SOL';
      break;
    case CHAIN_ID_ETH:
    case CHAIN_ID_ETHEREUM_ROPSTEN:
      symbol = 'ETH';
      break;
    case CHAIN_ID_BSC:
      symbol = 'BNB';
      break;
    case CHAIN_ID_TERRA:
      symbol = 'LUNA';
      break;
    case CHAIN_ID_POLYGON:
      symbol = 'MATIC';
      break;
    case CHAIN_ID_AVAX:
      symbol = 'AVAX';
      break;
    default:
      symbol = '';
      break;
  }
  return symbol;
};

export type Cluster = 'devnet' | 'testnet' | 'mainnet';
export const CLUSTER: Cluster =
  // eslint-disable-next-line no-nested-ternary
  process.env.REACT_APP_CLUSTER === 'mainnet'
    ? 'mainnet'
    : process.env.REACT_APP_CLUSTER === 'testnet'
    ? 'testnet'
    : 'devnet';

export interface ChainInfo {
  id: ChainId;
  name: string;
  logo: string;
}

export const CHAINS =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet'
    ? [
        {
          id: CHAIN_ID_BSC,
          name: 'Binance Smart Chain',
          logo: bscIcon,
        },
        {
          id: CHAIN_ID_ETH,
          name: 'Ethereum',
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: 'Solana',
          logo: solanaIcon,
        },
      ]
    : CLUSTER === 'testnet'
    ? [
        {
          id: CHAIN_ID_BSC,
          name: 'Binance Smart Chain',
          logo: bscIcon,
        },
        {
          id: CHAIN_ID_ETH,
          name: 'Ethereum (Ropsten)',
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: 'Solana',
          logo: solanaIcon,
        },
      ]
    : [
        {
          id: CHAIN_ID_BSC,
          name: 'Binance Smart Chain',
          logo: bscIcon,
        },
        {
          id: CHAIN_ID_ETH,
          name: 'Ethereum',
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: 'Solana',
          logo: solanaIcon,
        },
      ];

export const BETA_CHAINS: ChainId[] =
  CLUSTER === 'mainnet' ? [CHAIN_ID_AVAX] : [];

export const CHAINS_WITH_NFT_SUPPORT = CHAINS.filter(
  ({ id }) =>
    id === CHAIN_ID_AVAX ||
    id === CHAIN_ID_BSC ||
    id === CHAIN_ID_ETH ||
    id === CHAIN_ID_ETHEREUM_ROPSTEN ||
    id === CHAIN_ID_POLYGON ||
    id === CHAIN_ID_SOLANA,
);
export type ChainsById = { [key in ChainId]: ChainInfo };

export const ETH_NETWORK_CHAIN_ID =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet' ? 1 : CLUSTER === 'testnet' ? 3 : 1337; // customized
// CLUSTER === "mainnet" ? 1 : CLUSTER === "testnet" ? 5 : 1337;

export const ROPSTEN_ETH_NETWORK_CHAIN_ID =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet' ? 1 : CLUSTER === 'testnet' ? 3 : 1337;

export const BSC_NETWORK_CHAIN_ID =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet' ? 56 : CLUSTER === 'testnet' ? 97 : 1397;

export const POLYGON_NETWORK_CHAIN_ID =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet' ? 137 : CLUSTER === 'testnet' ? 80001 : 1381;

export const AVAX_NETWORK_CHAIN_ID =
  // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet' ? 43114 : CLUSTER === 'testnet' ? 43113 : 1381;

export const getEvmChainId = (chainId: ChainId) =>
  // eslint-disable-next-line no-nested-ternary
  chainId === CHAIN_ID_ETH
    ? ETH_NETWORK_CHAIN_ID
    : // eslint-disable-next-line no-nested-ternary
    chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_ETH_NETWORK_CHAIN_ID
    : // eslint-disable-next-line no-nested-ternary
    chainId === CHAIN_ID_BSC
    ? BSC_NETWORK_CHAIN_ID
    : // eslint-disable-next-line no-nested-ternary
    chainId === CHAIN_ID_POLYGON
    ? POLYGON_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_AVAX
    ? AVAX_NETWORK_CHAIN_ID
    : undefined;

// eslint-disable-next-line no-nested-ternary
export const SOLANA_HOST = process.env.REACT_APP_SOLANA_API_URL
  ? process.env.REACT_APP_SOLANA_API_URL
  : // eslint-disable-next-line no-nested-ternary
  CLUSTER === 'mainnet'
  ? clusterApiUrl('mainnet-beta')
  : CLUSTER === 'testnet'
  ? clusterApiUrl('devnet')
  : 'http://localhost:8899';

export const getExplorerName = (chainId: ChainId) =>
  // eslint-disable-next-line no-nested-ternary
  chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? "Etherscan"
    // eslint-disable-next-line no-nested-ternary
    : chainId === CHAIN_ID_BSC
      ? "BscScan"
      : "Explorer";

export const getExplorerAddress = (chainId: ChainId, txId: string) => {
  if (chainId === CHAIN_ID_ETH) {
    return `https://${CLUSTER === "testnet" ? "ropsten." : ""}etherscan.io/tx/${txId}`
  }
  if (chainId === CHAIN_ID_BSC) {
    return `https://${CLUSTER === "testnet" ? "testnet." : ""}bscscan.com/tx/${txId}`
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return `https://explorer.solana.com/tx/${txId}${
      CLUSTER === "testnet"
        ? "?cluster=devnet"
        : ""
    }`
  }
  return "";
}
