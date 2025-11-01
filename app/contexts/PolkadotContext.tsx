"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";

export interface PolkadotAccount {
  address: string;
  meta: {
    name: string;
    source: string;
  };
}

export interface PolkadotContextType {
  accounts: PolkadotAccount[];
  selectedAccount: PolkadotAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  api: ApiPromise | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (account: PolkadotAccount) => void;
  error: string | null;
  // EVM / MetaMask fallback (optional)
  evmAddress?: string | null;
  isEVMConnected?: boolean;
  connectEVM?: () => Promise<void>;
}

export const PolkadotContext = createContext<PolkadotContextType | undefined>(
  undefined
);

// Custom hook to use the context
export const usePolkadot = () => {
  const context = useContext(PolkadotContext);
  if (context === undefined) {
    throw new Error("usePolkadot must be used within a PolkadotProvider");
  }
  return context;
};
