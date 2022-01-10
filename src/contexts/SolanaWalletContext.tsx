import React, {
  JSXElementConstructor,
  ReactChildren,
  ReactElement,
  useMemo,
} from 'react';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getMathWallet,
} from '@solana/wallet-adapter-wallets';

export const SolanaWalletProvider = ({
  children,
}: {
  children: ReactElement<
    ReactChildren,
    string | JSXElementConstructor<unknown>
  >;
}) => {
  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you want to instantiate here will be compiled into your application
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getMathWallet(),
      getSolletWallet(),
    ],
    [],
  );

  return (
    <WalletProvider wallets={wallets}>
      <WalletDialogProvider>{children}</WalletDialogProvider>
    </WalletProvider>
  );
};

export const useSolanaWallet = useWallet;
