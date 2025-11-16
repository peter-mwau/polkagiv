// components/TokenConverter.tsx
"use client";

import React from "react";
import { useTokenPrices } from "../hooks/useTokenPrices";

interface TokenConverterProps {
  fromToken: string;
  toToken: string;
  amount: string;
}

const TOKEN_MAPPING: { [key: string]: string } = {
  USDC: "usd-coin",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
};

export default function TokenConverter({
  fromToken,
  toToken,
  amount,
}: TokenConverterProps) {
  const tokenIds = ["usd-coin", "weth", "wrapped-bitcoin"];
  const { prices, loading, error } = useTokenPrices(tokenIds);

  const calculateConversion = () => {
    if (!prices[TOKEN_MAPPING[fromToken]] || !prices[TOKEN_MAPPING[toToken]]) {
      return { converted: "0", rate: 0 };
    }

    const fromPrice = prices[TOKEN_MAPPING[fromToken]].usd;
    const toPrice = prices[TOKEN_MAPPING[toToken]].usd;
    const rate = fromPrice / toPrice;
    const converted = (parseFloat(amount) * rate).toFixed(6);

    return { converted, rate };
  };

  const { converted, rate } = calculateConversion();

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between text-sm text-blue-800 dark:text-blue-300 mb-2">
        <span>💱 Real-time Conversion</span>
        {prices[TOKEN_MAPPING[fromToken]] && (
          <span className="text-xs">
            {prices[TOKEN_MAPPING[fromToken]].usd_24h_change >= 0 ? "📈" : "📉"}
            {Math.abs(prices[TOKEN_MAPPING[fromToken]].usd_24h_change).toFixed(
              2
            )}
            %
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-blue-700 dark:text-blue-400">
          {amount} {fromToken} =
        </span>
        <span className="font-semibold text-blue-900 dark:text-blue-300">
          {converted} {toToken}
        </span>
      </div>

      <div className="text-xs text-blue-600 dark:text-blue-400">
        1 {fromToken} = {rate.toFixed(6)} {toToken}
      </div>

      {error && (
        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
          Using cached prices - {error}
        </div>
      )}
    </div>
  );
}
