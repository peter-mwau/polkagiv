"use client";

import React, { ReactNode, useEffect, useState } from "react";
import {
  PolkadotContext,
  PolkadotContextType,
  PolkadotAccount,
} from "../contexts/PolkadotContext";
import { ApiPromise, WsProvider } from "@polkadot/api";

// Use Moonbeam testnet or mainnet RPC
const WS_PROVIDER = "wss://wss.api.moonbase.moonbeam.network"; // Moonbase Alpha
// const WS_PROVIDER = 'wss://wss.api.moonbeam.network'; // Moonbeam Mainnet

interface PolkadotProviderProps {
  children: ReactNode;
  appName: string;
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({
  children,
  appName = "PolkaGiv Donation Platform",
}) => {
  const [accounts, setAccounts] = useState<PolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<PolkadotAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [isEVMConnected, setIsEVMConnected] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: "success" | "error"; message: string }>
  >([]);

  const logDebug = (msg: unknown) => {
    const s = typeof msg === "string" ? msg : JSON.stringify(msg);
    console.debug("PolkadotProvider debug:", s);
    setDebugLogs((d) => [s, ...d].slice(0, 50));
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [{ id, type, message }, ...t].slice(0, 5));
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  };

  type EthProvider =
    | {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      }
    | undefined;

  // EVM / MetaMask fallback connect
  const connectEVM = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (typeof window === "undefined") {
        throw new Error("EVM provider not available (server-side).");
      }

      const ethProvider = (window as unknown as { ethereum?: EthProvider })
        .ethereum;
      if (!ethProvider) {
        throw new Error(
          "No EVM provider detected. Install MetaMask or another wallet."
        );
      }

      // Request accounts
      const accounts = (await ethProvider.request({
        method: "eth_requestAccounts",
      })) as string[];
      logDebug({ event: "eth_requestAccounts", value: accounts });
      if (!accounts || accounts.length === 0) {
        throw new Error("No EVM accounts found after request.");
      }

      setEvmAddress(accounts[0]);
      setIsEVMConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "EVM connection failed");
      setIsEVMConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Initialize API connection
  useEffect(() => {
    let apiInstance: ApiPromise | null = null;
    const initApi = async () => {
      try {
        const provider = new WsProvider(WS_PROVIDER);
        apiInstance = await ApiPromise.create({ provider });
        setApi(apiInstance);

        // Check if we have existing connection
        const savedAccount = localStorage.getItem("polkadot-selected-account");
        if (savedAccount) {
          const account = JSON.parse(savedAccount);
          setSelectedAccount(account);
          setIsConnected(true);
        }
      } catch (err) {
        setError("Failed to connect to blockchain");
        console.error("API initialization error:", err);
      }
    };

    initApi();

    return () => {
      if (apiInstance) {
        apiInstance.disconnect();
      }
    };
  }, []);

  // Connect to Polkadot.js extension
  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Dynamically import extension helpers to avoid SSR issues
      if (typeof window === "undefined") {
        throw new Error("Polkadot.js extension not available (server-side).");
      }

      const extensionDapp = await import("@polkadot/extension-dapp");

      // Enable extension (this will prompt the user to authorize)
      const extensions = await extensionDapp.web3Enable(appName);
      logDebug({ event: "web3Enable", value: extensions });
      if (extensions.length === 0) {
        throw new Error(
          "No extension authorized. Please approve the connection."
        );
      }

      // Get accounts and map to our PolkadotAccount shape
      const injectedAccounts = await extensionDapp.web3Accounts();
      logDebug({ event: "web3Accounts", value: injectedAccounts });
      type InjAcc = {
        address: string;
        meta?: { name?: string; source?: string };
      };
      const mapped: PolkadotAccount[] = injectedAccounts.map((acc: InjAcc) => ({
        address: acc.address,
        meta: {
          name: acc.meta?.name ?? "",
          source: acc.meta?.source ?? "",
        },
      }));
      setAccounts(mapped);

      // If no accounts yet, subscribe for updates (useful if extension is locked or not yet authorized)
      if (!mapped || mapped.length === 0) {
        logDebug(
          "No accounts found immediately — subscribing for account updates..."
        );
        setIsSubscribing(true);

        // set up a timeout to abort subscription if nothing shows up
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
          timedOut = true;
          setError(
            "No accounts discovered. Make sure your polkadot-js extension is unlocked and has allowed this site."
          );
          setIsConnecting(false);
          setIsSubscribing(false);
          showToast(
            "No accounts discovered. Unlock your Polkadot{.js} extension and approve this site.",
            "error"
          );
        }, 12_000);

        const unsubscribe = await extensionDapp.web3AccountsSubscribe(
          (accounts: InjAcc[]) => {
            logDebug({ event: "web3AccountsSubscribe", value: accounts });
            if (accounts && accounts.length > 0 && !timedOut) {
              const mappedAccounts: PolkadotAccount[] = accounts.map(
                (a: InjAcc) => ({
                  address: a.address,
                  meta: {
                    name: a.meta?.name ?? "",
                    source: a.meta?.source ?? "",
                  },
                })
              );
              setAccounts(mappedAccounts);
              setIsConnected(true);
              setIsSubscribing(false);
              showToast("Connected to polkadot-js", "success");

              // auto-select previously saved account or first available
              const savedAccount = localStorage.getItem(
                "polkadot-selected-account"
              );
              if (savedAccount) {
                const account = JSON.parse(savedAccount);
                const found = mappedAccounts.find(
                  (acc) => acc.address === account.address
                );
                if (found) setSelectedAccount(found);
              } else {
                setSelectedAccount(mappedAccounts[0]);
              }

              clearTimeout(timeoutId);
              unsubscribe().catch(() => {});
            }
          }
        );

        // return early — subscription will set state when accounts arrive
        return;
      }

      // We have accounts immediately
      setIsConnected(true);
      showToast("Connected to polkadot-js", "success");

      // Auto-select first account or previously selected
      const savedAccount = localStorage.getItem("polkadot-selected-account");
      if (savedAccount) {
        const account = JSON.parse(savedAccount);
        const foundAccount = mapped.find(
          (acc) => acc.address === account.address
        );
        if (foundAccount) {
          setSelectedAccount(foundAccount);
        }
      } else if (mapped.length > 0) {
        setSelectedAccount(mapped[0]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
      setIsConnected(false);
      showToast(msg, "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccounts([]);
    setSelectedAccount(null);
    setIsConnected(false);
    localStorage.removeItem("polkadot-selected-account");
  };

  const selectAccount = (account: PolkadotAccount) => {
    setSelectedAccount(account);
    localStorage.setItem("polkadot-selected-account", JSON.stringify(account));
  };

  const value: PolkadotContextType = {
    accounts,
    selectedAccount,
    isConnected,
    isConnecting,
    api,
    connect,
    disconnect,
    selectAccount,
    error,
    evmAddress,
    isEVMConnected,
    connectEVM,
  };

  return (
    <PolkadotContext.Provider value={value}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <>
          <div
            style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999 }}
          >
            <div
              style={{
                background: "#0b1226",
                color: "#e6eef8",
                padding: 10,
                borderRadius: 8,
                width: 320,
                boxShadow: "0 4px 24px rgba(2,6,23,0.6)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Polkadot Debug
              </div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                Connected: {String(isConnected)} · Connecting:{" "}
                {String(isConnecting)} · EVM: {String(isEVMConnected)}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => connect()} style={{ flex: 1 }}>
                  Connect
                </button>
                <button onClick={() => connectEVM()} style={{ flex: 1 }}>
                  Connect EVM
                </button>
                <button
                  onClick={() => {
                    setDebugLogs([]);
                    setError(null);
                    setEvmAddress(null);
                    setIsEVMConnected(false);
                  }}
                  style={{ flex: 1 }}
                >
                  Clear
                </button>
              </div>
              <div
                style={{
                  maxHeight: 200,
                  overflow: "auto",
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                {error && (
                  <div style={{ color: "#ffb4b4" }}>Error: {error}</div>
                )}
                {evmAddress && (
                  <div style={{ color: "#bfe8c9" }}>EVM: {evmAddress}</div>
                )}
                {debugLogs.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      borderTop: i
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                      paddingTop: 6,
                      marginTop: 6,
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subscribe help banner */}
          {isSubscribing && (
            <div
              style={{ position: "fixed", left: 12, bottom: 12, zIndex: 9999 }}
            >
              <div
                style={{
                  background: "#073642",
                  color: "#e6eef8",
                  padding: 10,
                  borderRadius: 8,
                  width: 420,
                  boxShadow: "0 6px 30px rgba(2,6,23,0.6)",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Waiting for polkadot-js approval
                </div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  Please unlock your Polkadot{".js"} extension and approve the
                  connection. If you already approved, give it a moment.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => connect()} style={{ flex: 1 }}>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toasts */}
          <div style={{ position: "fixed", right: 12, top: 12, zIndex: 10000 }}>
            {toasts.map((t) => (
              <div key={t.id} style={{ marginBottom: 8, minWidth: 220 }}>
                <div
                  style={{
                    background: t.type === "success" ? "#083c12" : "#4c1212",
                    color: "#fff",
                    padding: 10,
                    borderRadius: 6,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {t.type === "success" ? "Success" : "Error"}
                  </div>
                  <div style={{ fontSize: 13 }}>{t.message}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PolkadotContext.Provider>
  );
};
