"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { privateKeyToAccount } from "viem/accounts";

type WalletContextType = {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Check and listen for account changes
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
            await getChainId();
            await getBalance(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    const getChainId = async () => {
      try {
        const chainId = await (window as any).ethereum.request({
          method: "eth_chainId",
        });
        setChainId(chainId);
      } catch (error) {
        console.error("Error getting chain ID:", error);
      }
    };

    const getBalance = async (accountAddress: string) => {
      try {
        const balance = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [accountAddress, "latest"],
        });
        // Convert from wei to DEV (assuming 18 decimals)
        const balanceInDev = (parseInt(balance) / 1e18).toFixed(4);
        setBalance(balanceInDev);
      } catch (error) {
        console.error("Error getting balance:", error);
      }
    };

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected all accounts
        disconnect();
      } else {
        // User switched accounts
        setAddress(accounts[0]);
        setIsConnected(true);
        getBalance(accounts[0]);
      }
    };

    // Listen for chain changes
    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
      if (address) {
        getBalance(address);
      }
    };

    checkBrowserWalletConnection();

    // Add event listeners
    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }

    // Cleanup event listeners
    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        (window as any).ethereum.removeListener(
          "chainChanged",
          handleChainChanged
        );
      }
    };
  }, [address]);

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

          // Get chain ID and balance
          const chainId = await (window as any).ethereum.request({
            method: "eth_chainId",
          });
          setChainId(chainId);

          await getBalance(accounts[0]);
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
          setChainId("0x507"); // Moonbase Alpha chainId
          setBalance("0.0000"); // Default balance for private key
          return;
        } catch (error) {
          console.error("Invalid private key:", error);
        }
      }

      throw new Error(
        "No EVM provider detected. Install MetaMask or set a valid NEXT_PUBLIC_PRIVATE_KEY."
      );
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Connection error:", errMsg);
      // rethrow the original error value
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const getBalance = async (accountAddress: string) => {
    try {
      const balance = await (window as any).ethereum.request({
        method: "eth_getBalance",
        params: [accountAddress, "latest"],
      });
      // Convert from wei to DEV (assuming 18 decimals)
      const balanceInDev = (parseInt(balance) / 1e18).toFixed(4);
      setBalance(balanceInDev);
    } catch (error) {
      console.error("Error getting balance:", error);
      setBalance("0.0000");
    }
  };

  const refreshBalance = async () => {
    if (address) {
      await getBalance(address);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setBalance(null);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        chainId,
        balance,
        connect,
        disconnect,
        refreshBalance,
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
