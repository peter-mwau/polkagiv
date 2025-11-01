"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { privateKeyToAccount } from "viem/accounts";

type WalletContextType = {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  // Check if we're connected to a browser wallet on mount
  useEffect(() => {
    const checkBrowserWalletConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkBrowserWalletConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Priority 1: Browser wallet (MetaMask, etc.)
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          return;
        }
      }

      // Priority 2: Private key fallback
      if (privateKey) {
        try {
          const key = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
          const acc = privateKeyToAccount(key as `0x${string}`);
          setAddress(acc.address);
          setIsConnected(true);
          return;
        } catch (error) {
          console.error("Invalid private key:", error);
        }
      }

      throw new Error(
        "No EVM provider detected. Install MetaMask or set a valid NEXT_PUBLIC_PRIVATE_KEY."
      );
    } catch (error: any) {
      console.error("Connection error:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
