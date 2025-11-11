// app/manage/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useContract } from "../hooks/useContract";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";

export default function Manage() {
  const { setTokenAllowed, hasRole } = useContract();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<
    "tokens" | "permissions" | "admin"
  >("tokens");
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Token Management State
  const [tokenAddress, setTokenAddress] = useState("");
  const [allowed, setAllowed] = useState(true);

  // Check if user has admin role
  useEffect(() => {
    const checkRole = async () => {
      if (isConnected && address) {
        try {
          setIsCheckingRole(true);
          const isAdmin = await hasRole("DEFAULT_ADMIN_ROLE");
          const isTokenManager = await hasRole("TOKEN_MANAGER_ROLE");
          setHasAdminRole(isAdmin || isTokenManager);
        } catch (error) {
          console.error("Error checking role:", error);
          setHasAdminRole(false);
        } finally {
          setIsCheckingRole(false);
        }
      } else {
        setIsCheckingRole(false);
        setHasAdminRole(false);
      }
    };

    checkRole();
  }, [isConnected, address, hasRole]);

  const handleSetTokenAllowed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setTokenAllowed(tokenAddress, allowed);
      toast.success(
        `Token ${allowed ? "allowed" : "disallowed"} successfully!`
      );
      setTokenAddress("");
    } catch (error) {
      toast.error("Failed to update token permission.");
      console.error("Error setting token allowed:", error);
    }
  };

  // Show loading while checking role
  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have role
  if (!hasAdminRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don&apos;t have permission to access the management dashboard.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only administrators and token managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black pt-[100px] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Management Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage token permissions, user roles, and platform settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { key: "tokens", label: "Token Management", icon: "🪙" },
                { key: "permissions", label: "Permissions", icon: "🔐" },
                { key: "admin", label: "Admin Tools", icon: "⚙️" },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === key
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "tokens" && (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Token Permissions
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Allow or disallow tokens to be used for donations in
                  campaigns.
                </p>

                {/* Quick Add Test Tokens */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Add Test Tokens
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {[
                      {
                        name: "USDC (Test)",
                        address: "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9",
                        symbol: "USDC",
                      },
                      {
                        name: "USDT (Test)",
                        address: "0x8e70cD5B4Ff3f62659049e74b6649c6603A0E594",
                        symbol: "USDT",
                      },
                      {
                        name: "DAI (Test)",
                        address: "0x4B0b4b2c56E4E56a6978c13cE44Eec5F8e56b6b9",
                        symbol: "DAI",
                      },
                      {
                        name: "WETH (Test)",
                        address: "0x1436aE0dF0A8663F18c0Ec51d7e2E46591730715",
                        symbol: "WETH",
                      },
                      {
                        name: "DEV Token",
                        address: "0x0000000000000000000000000000000000000802",
                        symbol: "DEV",
                      },
                    ].map((token) => (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => {
                          setTokenAddress(token.address);
                          setAllowed(true);
                          toast.info(`Added ${token.symbol} to form`);
                        }}
                        className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200 text-left"
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {token.name}
                        </div>
                        <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                          Click to add
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSetTokenAllowed} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Token Address
                    </label>
                    <input
                      type="text"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                      required
                    />
                    {tokenAddress && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Current: {tokenAddress}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowed"
                      checked={allowed}
                      onChange={(e) => setAllowed(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="allowed"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Allow this token for donations
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {allowed ? "Allow Token" : "Disallow Token"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTokenAddress("");
                        setAllowed(true);
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Clear Form
                    </button>
                  </div>
                </form>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        Test Token Information
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                        For testing on Moonbase Alpha, you can use the
                        pre-configured test tokens above. These are standard
                        ERC-20 tokens deployed on the testnet.
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                        <li>
                          <strong>USDC/USDT/DAI:</strong> Stablecoin test tokens
                        </li>
                        <li>
                          <strong>WETH:</strong> Wrapped Ether test token
                        </li>
                        <li>
                          <strong>DEV:</strong> Native Moonbase Alpha token
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "permissions" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Role Permissions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      DEFAULT_ADMIN_ROLE
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Full administrative access to all contract functions and
                      settings.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      TOKEN_MANAGER_ROLE
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Can manage token permissions and allowed tokens for
                      donations.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      CAMPAIGN_CREATOR_ROLE
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Automatically granted to users who create campaigns.
                      Allows withdrawal of funds.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "admin" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Admin Tools
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      🚧 Advanced admin tools and platform analytics will be
                      available here soon.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Platform Analytics
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View platform statistics and performance metrics
                      </p>
                    </button>
                    <button className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        User Management
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage user roles and permissions
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
