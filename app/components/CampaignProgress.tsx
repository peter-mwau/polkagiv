// components/CampaignProgress.tsx - UPDATED WITH FALLBACK
"use client";

import React from "react";
import { ethers } from "ethers";
import { useTokenConversion } from "../hooks/useTokenConversion";
import { useContract } from "../hooks/useContract";

interface CampaignProgressProps {
  campaign: {
    id: number;
    goalAmount: bigint;
    totalDonated: bigint;
    deadline?: bigint;
  };
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
  showTokenBreakdown?: boolean;
}

export default function CampaignProgress({
  campaign,
  className = "",
  showDetails = true,
  compact = false,
  showTokenBreakdown = false,
}: CampaignProgressProps) {
  const [portfolio, setPortfolio] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const { calculatePortfolioValue } = useTokenConversion();
  const { getCampaignTokenBalances } = useContract();

  React.useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      try {
        const portfolioData = await calculatePortfolioValue(
          campaign.id,
          campaign.goalAmount.toString(),
          getCampaignTokenBalances
        );
        setPortfolio(portfolioData);
        console.log("Loaded portfolio data:", portfolioData);
      } catch (error) {
        console.error("Error loading portfolio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [campaign.id, campaign.goalAmount]);

  // Calculate progress using on-chain USDC data as fallback
  // Heuristic: detect likely decimals for stored on-chain amounts (some campaigns were stored using 18 decimals)
  const detectDecimals = (goal: bigint, donated: bigint) => {
    const candidates = [6, 8, 18];
    const scores: {
      dec: number;
      score: number;
      goalVal: number;
      donatedVal: number;
    }[] = [];

    for (const dec of candidates) {
      try {
        const g = parseFloat(ethers.formatUnits(goal, dec));
        const d = parseFloat(ethers.formatUnits(donated, dec));
        let score = 0;
        if (isFinite(g) && g > 0 && g < 1e7) score++;
        if (isFinite(d) && d >= 0 && d < 1e9) score++;
        // Prefer decimals where donated is not greater than a huge multiple of goal
        if (g > 0 && d / Math.max(g, 1) < 1000) score++;
        scores.push({ dec, score, goalVal: g, donatedVal: d });
      } catch {
        scores.push({ dec, score: 0, goalVal: 0, donatedVal: 0 });
      }
    }

    // choose best score, tie-breaker prefer 6 (USDC)
    scores.sort((a, b) => {
      if (b.score === a.score)
        return a.dec - b.dec === 0
          ? 0
          : a.dec === 6
          ? -1
          : b.dec === 6
          ? 1
          : a.dec - b.dec;
      return b.score - a.score;
    });
    return scores[0] || { dec: 6, score: 0, goalVal: 0, donatedVal: 0 };
  };

  const detected = detectDecimals(campaign.goalAmount, campaign.totalDonated);
  const detectedDecimals = detected.dec;
  const fallbackGoalValue = detected.goalVal;
  const fallbackRaisedValue = detected.donatedVal;

  const fallbackProgress =
    fallbackGoalValue > 0
      ? Math.min((fallbackRaisedValue / fallbackGoalValue) * 100, 100)
      : 0;

  // For display: if decimals detected is 6 (USDC), show as USD; otherwise show numeric value and indicate units
  const fallbackRaisedUSD =
    detectedDecimals === 6 ? fallbackRaisedValue : fallbackRaisedValue; // numeric fallback
  const fallbackGoalUSD =
    detectedDecimals === 6 ? fallbackGoalValue : fallbackGoalValue;

  // Use portfolio data if available and valid, otherwise use fallback
  const progress =
    portfolio && portfolio.totalUSDValue > 0
      ? portfolio.progress
      : fallbackProgress;
  const raisedUSD =
    portfolio && portfolio.totalUSDValue > 0
      ? portfolio.raisedUSD
      : fallbackRaisedUSD;
  const goalUSD =
    portfolio && portfolio.totalUSDValue > 0
      ? portfolio.goalUSD
      : fallbackGoalUSD;

  const daysLeft = campaign.deadline
    ? Math.max(
        0,
        Math.ceil(
          (Number(campaign.deadline) * 1000 - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  if (loading && !compact) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${
          compact ? "h-16" : "h-24"
        } ${className}`}
      ></div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {progress.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        {showDetails && (
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>${raisedUSD.toFixed(0)}</span>
            <span>${goalUSD.toFixed(0)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Funding Progress
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {campaign.deadline && daysLeft > 0
              ? `${daysLeft} days remaining`
              : "Total in USD Equivalent"}
          </p>
          {portfolio && portfolio.totalUSDValue === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Using on-chain USDC data for progress calculation
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {progress.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            of goal reached
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${raisedUSD.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Raised (USD)
          </div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${goalUSD.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Goal (USD)
          </div>
        </div>
      </div>

      {showTokenBreakdown &&
        portfolio &&
        portfolio.tokenBalances.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Includes:{" "}
              {portfolio.tokenBalances
                .map(
                  (token) =>
                    `${parseFloat(token.balanceFormatted).toFixed(4)} ${
                      token.symbol
                    }`
                )
                .join(", ")}
            </div>
            {portfolio.totalUSDValue === 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Note: Multi-token USD conversion temporarily unavailable
              </div>
            )}
          </div>
        )}
    </div>
  );
}
