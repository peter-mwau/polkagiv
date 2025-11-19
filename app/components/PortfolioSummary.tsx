// components/PortfolioSummary.tsx
"use client";

import React from "react";
import { CampaignPortfolio } from "../hooks/useTokenConversion";
import PieChart from "./PieChart";

interface PortfolioSummaryProps {
  portfolio: CampaignPortfolio;
  daysLeft: number;
}

export default function PortfolioSummary({
  portfolio,
  daysLeft,
}: PortfolioSummaryProps) {
  const pieData = portfolio.tokenBalances.map((token, index) => {
    const percentage =
      portfolio.totalUSDValue > 0
        ? (token.usdValue / portfolio.totalUSDValue) * 100
        : 0;

    const colors = [
      "#3B82F6", // blue-500
      "#10B981", // green-500
      "#8B5CF6", // purple-500
      "#F59E0B", // amber-500
      "#EF4444", // red-500
      "#06B6D4", // cyan-500
    ];

    return {
      symbol: token.symbol,
      value: token.usdValue,
      color: colors[index % colors.length],
      percentage,
      usdValue: token.usdValue,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pie Chart Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Asset Distribution
        </h4>

        <div className="flex flex-col items-center">
          <PieChart data={pieData} size={220} />

          {/* Legend */}
          <div className="mt-6 space-y-3 w-full max-w-xs">
            {portfolio.tokenBalances.map((token, index) => {
              const percentage =
                portfolio.totalUSDValue > 0
                  ? (token.usdValue / portfolio.totalUSDValue) * 100
                  : 0;

              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-amber-500",
                "bg-red-500",
                "bg-cyan-500",
              ];

              return (
                <div
                  key={token.tokenAddress}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        colors[index % colors.length]
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${token.usdValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Details */}
      <div className="lg:col-span-2 space-y-4">
        {portfolio.tokenBalances.map((token, index) => {
          const percentage =
            portfolio.totalUSDValue > 0
              ? (token.usdValue / portfolio.totalUSDValue) * 100
              : 0;

          return (
            <div
              key={token.tokenAddress}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      token.symbol === "USDC"
                        ? "bg-blue-500"
                        : token.symbol === "WETH"
                        ? "bg-green-500"
                        : token.symbol === "WBTC"
                        ? "bg-amber-500"
                        : "bg-purple-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {token.tokenAddress.slice(0, 8)}...
                      {token.tokenAddress.slice(-6)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${token.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {percentage.toFixed(1)}% of portfolio
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Balance:
                  </div>
                  <div className="font-mono text-gray-900 dark:text-white">
                    {parseFloat(token.balanceFormatted).toFixed(6)}{" "}
                    {token.symbol}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600 dark:text-gray-400">
                    USDC Value:
                  </div>
                  <div className="font-mono text-green-600 dark:text-green-400">
                    {token.usdEquivalent} USDC
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
