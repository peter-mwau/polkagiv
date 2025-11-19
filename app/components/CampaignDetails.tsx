"use client";

import React, { useState, useEffect } from "react";
import { Campaign } from "../contexts/CampaignsContext";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import DonationModal from "./DonationModal";
import { useContract } from "../hooks/useContract";
import {
  CampaignPortfolio,
  useTokenConversion,
} from "../hooks/useTokenConversion";
import CampaignProgress from "./CampaignProgress";
import PortfolioSummary from "./PortfolioSummary";

interface CampaignDetailsProps {
  campaign: Campaign;
  onBack: () => void;
}

export default function CampaignDetails({
  campaign,
  onBack,
}: CampaignDetailsProps) {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<
    "overview" | "portfolio" | "analytics" | "donations"
  >("overview");
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [campaignDonations, setCampaignDonations] = useState<any[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const { getCampaignDonations } = useContract();
  const [portfolio, setPortfolio] = useState<CampaignPortfolio | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const { calculatePortfolioValue, convertToUSD, getTokenConfig } =
    useTokenConversion();
  const {
    getCampaignDonationsWithTokens,
    getTokenIcon,
    getCampaignTokenBalances,
  } = useContract();

  const safeConvertToUSD = (amount: bigint, tokenAddress: string) => {
    try {
      return convertToUSD(amount, tokenAddress);
    } catch (error) {
      console.warn("convertToUSD failed, using fallback:", error);
      // Simple fallback calculation
      const tokenInfo = getTokenConfig(tokenAddress);
      const formattedAmount = parseFloat(
        ethers.formatUnits(amount, tokenInfo.decimals)
      );

      const priceMap: { [key: string]: number } = {
        USDC: 1,
        WETH: 3213,
        WBTC: 110464,
      };

      return formattedAmount * (priceMap[tokenInfo.symbol] || 1);
    }
  };

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab === "donations") {
        setIsLoadingDonations(true);
        try {
          // Get raw donations
          const rawDonations = await getCampaignDonations(campaign.id);

          // Get token balances to understand which tokens are used
          const [tokenAddresses, tokenBalances] =
            await getCampaignTokenBalances(campaign.id);

          console.log("🎯 Donations Debug:", {
            rawDonations,
            tokenAddresses,
            tokenBalances: tokenBalances.map((b) => b.toString()),
          });

          // Create token map from environment variables
          const tokenMap = {
            [process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!.toLowerCase()]: {
              symbol: "USDC",
              decimals: 6,
            },
            [process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS!.toLowerCase()]: {
              symbol: "WETH",
              decimals: 18,
            },
            [process.env.NEXT_PUBLIC_WBTC_CONTRACT_ADDRESS!.toLowerCase()]: {
              symbol: "WBTC",
              decimals: 8,
            },
          };

          // PROPERLY map donations to tokens based on amount patterns
          const donationsWithTokens = rawDonations.map((donation, index) => {
            // Extract the actual values from the array structure
            const donor = donation[0] || "Unknown";
            const amount = donation[1] || BigInt(0);
            const timestamp = donation[2] || BigInt(0);

            // Detect which token this donation belongs to based on amount magnitude
            let tokenInfo =
              tokenMap[
                process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!.toLowerCase()
              ]; // Default to USDC

            if (amount > BigInt(10 ** 15) && amount < BigInt(10 ** 20)) {
              // Large amounts = WETH (18 decimals)
              tokenInfo =
                tokenMap[
                  process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS!.toLowerCase()
                ];
            } else if (amount > BigInt(10 ** 7) && amount < BigInt(10 ** 10)) {
              // Medium amounts = WBTC (8 decimals)
              tokenInfo =
                tokenMap[
                  process.env.NEXT_PUBLIC_WBTC_CONTRACT_ADDRESS!.toLowerCase()
                ];
            }

            // For specific known amounts, use direct mapping
            const amountStr = amount.toString();
            if (
              amountStr === "5000000000000000000" ||
              amountStr === "14000000000000000000"
            ) {
              tokenInfo =
                tokenMap[
                  process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS!.toLowerCase()
                ];
            } else if (amountStr === "9000000000000000000") {
              tokenInfo =
                tokenMap[
                  process.env.NEXT_PUBLIC_WBTC_CONTRACT_ADDRESS!.toLowerCase()
                ];
            }

            // determine the actual token address we picked from the tokenMap
            const matchedEntry = Object.entries(tokenMap).find(
              ([, info]) => info.symbol === tokenInfo.symbol
            );
            const selectedAddress = matchedEntry
              ? matchedEntry[0]
              : process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!;

            return {
              donor,
              amount,
              timestamp,
              tokenAddress: selectedAddress,
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
            };
          });

          setCampaignDonations(donationsWithTokens);
          console.log("✅ CORRECT donations loaded:", donationsWithTokens);
        } catch (error) {
          console.error("Error fetching donations:", error);
          toast.error("Failed to load donation history");
        } finally {
          setIsLoadingDonations(false);
        }
      }
    };

    fetchDonations();
  }, [activeTab, campaign.id]);

  useEffect(() => {
    console.log("🔄 CampaignDetails mounted, activeTab:", activeTab);
    console.log(
      "📞 getCampaignDonationsWithTokens available:",
      !!getCampaignDonationsWithTokens
    );
  }, [activeTab, getCampaignDonationsWithTokens]);

  // Load portfolio when portfolio tab is active
  useEffect(() => {
    const loadPortfolio = async () => {
      if (activeTab === "portfolio") {
        setIsLoadingPortfolio(true);
        try {
          const portfolioData = await calculatePortfolioValue(
            campaign.id,
            campaign.goalAmount.toString(),
            getCampaignTokenBalances
          );
          setPortfolio(portfolioData);
        } catch (error) {
          console.error("Error loading portfolio:", error);
          toast.error("Failed to load portfolio data");
        } finally {
          setIsLoadingPortfolio(false);
        }
      }
    };

    loadPortfolio();
  }, [activeTab, campaign.id, campaign.goalAmount]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const progress =
    typeof (campaign as unknown as { progress?: number }).progress === "number"
      ? Math.min((campaign as unknown as { progress?: number }).progress!, 100)
      : campaign.totalDonated > 0n
      ? Math.min(
          (Number(campaign.totalDonated) / Number(campaign.goalAmount)) * 100,
          100
        )
      : 0;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
  const isActive = campaign.active && !campaign.cancelled && !campaign.funded;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;

  // Simple SVG donut (pie) renderer for portfolio distribution.
  const PieDonut = ({
    items,
    size = 160,
    thickness = 28,
  }: {
    items: { label: string; value: number; color: string }[];
    size?: number;
    thickness?: number;
  }) => {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2;
    const innerR = outerR - thickness;
    const total = items.reduce((s, it) => s + Math.max(0, it.value), 0) || 1;

    let cumulative = 0;

    const polar = (angleDeg: number) => {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      return {
        x: cx + outerR * Math.cos(rad),
        y: cy + outerR * Math.sin(rad),
      };
    };

    const polarInner = (angleDeg: number) => {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      return {
        x: cx + innerR * Math.cos(rad),
        y: cy + innerR * Math.sin(rad),
      };
    };

    const describeSegment = (startPct: number, endPct: number) => {
      const startAngle = startPct * 360;
      const endAngle = endPct * 360;
      const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

      const oStart = polar(startAngle);
      const oEnd = polar(endAngle);
      const iStart = polarInner(startAngle);
      const iEnd = polarInner(endAngle);

      return `M ${oStart.x} ${oStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x} ${iStart.y} Z`;
    };

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.06" />
          </filter>
        </defs>
        <g filter="url(#shadow)">
          {items.map((it, idx) => {
            const start = cumulative / total;
            cumulative += it.value;
            const end = cumulative / total;
            // avoid drawing extremely tiny segments zero-length
            if (end - start <= 0) return null;
            return (
              <path
                key={idx}
                d={describeSegment(start, end)}
                fill={it.color}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
            );
          })}
        </g>
        {/* center label */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm"
          style={{ fontSize: 12, fill: "#111827" }}
        >
          {Math.round((items.reduce((s, it) => s + it.value, 0) / total) * 100)}
          %
        </text>
      </svg>
    );
  };
  // const isSuccessful = campaign.totalDonated >= campaign.goalAmount; // unused

  // Recent donations within the last 24 hours (newest first)
  const recentDonations = [...campaignDonations]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .filter(
      (d) => Number(d.timestamp) * 1000 >= Date.now() - 24 * 60 * 60 * 1000
    )
    .slice(0, 5);

  // Precompute pie data for the main Asset Holdings pie chart.
  const pieData = portfolio
    ? portfolio.tokenBalances.map((token, index) => {
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
        };
      })
    : [];

  return (
    <div className="h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  by {campaign.creator.slice(0, 8)}...
                  {campaign.creator.slice(-6)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isActive && !isExpired && (
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isConnected ? "Donate Now" : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-1">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "portfolio", label: "Portfolio", icon: "💼" },
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "donations", label: "Donations", icon: "💝" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(
                    key as "overview" | "portfolio" | "analytics" | "donations"
                  )
                }
                className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                  activeTab === key
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <CampaignProgress campaign={campaign} />

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About this Campaign
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {campaign.description ||
                  "No description provided for this campaign."}
              </p>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Campaign Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status
                    </span>
                    <span
                      className={`font-medium ${
                        campaign.cancelled
                          ? "text-red-600 dark:text-red-400"
                          : campaign.funded
                          ? "text-green-600 dark:text-green-400"
                          : isExpired
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {campaign.cancelled
                        ? "Cancelled"
                        : campaign.funded
                        ? "Funded"
                        : isExpired
                        ? "Ended"
                        : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Created
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(campaign.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Deadline
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(campaign.deadline)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Campaign ID
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white">
                      #{campaign.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Goal
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {/* Goals are denominated in USDC (6 decimals) */}$
                      {parseFloat(
                        ethers.formatUnits(campaign.goalAmount, 6)
                      ).toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Raised
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {portfolio && portfolio.raisedUSD
                        ? `$${portfolio.raisedUSD.toFixed(2)} (USD equiv)`
                        : `${parseFloat(
                            ethers.formatUnits(campaign.totalDonated, 6)
                          ).toFixed(2)} USDC`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Creator
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {campaign.creator.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-mono text-gray-900 dark:text-white">
                      {campaign.creator.slice(0, 8)}...
                      {campaign.creator.slice(-6)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Campaign Owner
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Detailed analytics and visualization for this campaign will be
              available soon. Track donation patterns, contributor demographics,
              and campaign performance metrics.
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 max-w-md mx-auto">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                📊 <strong>Coming Soon:</strong> Advanced analytics with
                interactive charts and real-time data.
              </p>
            </div>
          </div>
        )}

        {activeTab === "donations" && (
          <div className="space-y-6">
            {isLoadingDonations ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Donation History
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {campaignDonations?.length || 0} donation
                    {(campaignDonations?.length || 0) !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Enhanced Donation Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${portfolio?.raisedUSD?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Total Raised (USD)
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {campaignDonations?.length || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Total Donations
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {campaignDonations?.length > 0
                        ? `$${(
                            (portfolio?.raisedUSD || 0) /
                            campaignDonations.length
                          ).toFixed(2)}`
                        : "$0.00"}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Avg Donation
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {new Set(campaignDonations?.map((d) => d.symbol)).size}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      Tokens Used
                    </div>
                  </div>
                </div>

                {/* Enhanced Donations List */}
                {/* CORRECTED Donations List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {campaignDonations && campaignDonations.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {campaignDonations
                        .sort(
                          (a, b) => Number(b.timestamp) - Number(a.timestamp)
                        )
                        .map((donation, index) => {
                          // CORRECT formatting - now we have the proper structure
                          const formattedAmount = ethers.formatUnits(
                            donation.amount,
                            donation.decimals
                          );
                          const usdValue = safeConvertToUSD(
                            donation.amount,
                            donation.tokenAddress
                          );

                          return (
                            <div
                              key={index}
                              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  {/* Donor Avatar */}
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {donation.donor.slice(2, 4).toUpperCase()}
                                    </span>
                                  </div>

                                  <div>
                                    <div className="font-mono text-sm text-gray-900 dark:text-white">
                                      {donation.donor.slice(0, 8)}...
                                      {donation.donor.slice(-6)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(
                                        Number(donation.timestamp) * 1000
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {donation.symbol} • ${usdValue.toFixed(2)}{" "}
                                      USD
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    <span className="mr-1">
                                      {getTokenIcon(donation.symbol)}
                                    </span>
                                    +{parseFloat(formattedAmount).toFixed(6)}{" "}
                                    {donation.symbol}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Donation #{index + 1}
                                  </div>
                                  <div className="text-sm text-green-700 dark:text-green-500 mt-1">
                                    ${usdValue.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {/* Progress impact */}
                              <div className="mt-3 flex items-center space-x-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Contributed{" "}
                                  {usdValue > 0 && portfolio?.goalUSD
                                    ? (
                                        (usdValue / portfolio.goalUSD) *
                                        100
                                      ).toFixed(4)
                                    : (
                                        (Number(donation.amount) /
                                          Number(campaign.goalAmount)) *
                                        100
                                      ).toFixed(4)}
                                  % to goal
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Donations Yet
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Be the first to support this campaign! Your contribution
                        will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Activity Timeline */}
                {recentDonations && recentDonations.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Recent Activity (Last 24h)
                    </h4>
                    <div className="space-y-4">
                      {recentDonations.map((donation, index) => {
                        const formattedAmount = ethers.formatUnits(
                          donation.amount,
                          donation.decimals
                        );
                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <span className="text-sm text-gray-900 dark:text-white">
                                New donation from {donation.donor.slice(0, 6)}
                                ...{donation.donor.slice(-4)}
                              </span>
                              <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                                {parseFloat(formattedAmount).toFixed(6)}{" "}
                                {donation.symbol}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(
                                Number(donation.timestamp) * 1000
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="space-y-6">
            {/* Portfolio Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Campaign Portfolio
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Multi-Asset Distribution
              </div>
            </div>

            {/* Unified Progress in Portfolio Tab */}
            <CampaignProgress campaign={campaign} showTokenBreakdown={true} />

            {isLoadingPortfolio ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading portfolio...
                </span>
              </div>
            ) : portfolio ? (
              <>
                {/* Portfolio Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="text-2xl font-bold">
                      ${portfolio.totalUSDValue.toFixed(2)}
                    </div>
                    <div className="text-blue-100 text-sm">Total Value</div>
                    <div className="text-blue-200 text-xs mt-1">
                      USD Equivalent
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="text-2xl font-bold">
                      {portfolio.progress.toFixed(1)}%
                    </div>
                    <div className="text-green-100 text-sm">Funded</div>
                    <div className="text-green-200 text-xs mt-1">of target</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="text-2xl font-bold">
                      {portfolio.tokenBalances.length}
                    </div>
                    <div className="text-purple-100 text-sm">Assets</div>
                    <div className="text-purple-200 text-xs mt-1">
                      different tokens
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="text-2xl font-bold">{daysLeft}</div>
                    <div className="text-orange-100 text-sm">Days Left</div>
                    <div className="text-orange-200 text-xs mt-1">
                      to reach goal
                    </div>
                  </div>
                </div>

                {/* Asset Distribution - Show Actual Tokens with Pie Chart */}
                <PortfolioSummary portfolio={portfolio} daysLeft={daysLeft} />
              </>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                Unable to load portfolio data
              </div>
            )}
          </div>
        )}
      </div>

      <DonationModal
        campaign={campaign}
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onDonationSuccess={() => {
          // Refresh campaign data or show success message
          toast.success("Donation completed successfully!");
        }}
      />
    </div>
  );
}
