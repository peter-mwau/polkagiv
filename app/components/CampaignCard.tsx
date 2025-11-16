// components/CampaignCard.tsx
"use client";

import React, { useState } from "react";
import { Campaign } from "../contexts/CampaignsContext";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

interface CampaignCardProps {
  campaign: Campaign;
  onViewDetails: (campaign: Campaign) => void;
  onDonate: (campaign: Campaign) => void;
  index?: number;
  totalCards?: number;
  isGroupHovered?: boolean;
  isStacked?: boolean;
}

export default function CampaignCard({
  campaign,
  onViewDetails,
  onDonate,
  index = 0,
  totalCards = 1,
  isGroupHovered = false,
  isStacked = false,
}: CampaignCardProps) {
  const { isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);

  // Format ETH values from wei
  // const formatETH = (wei: bigint) => {
  //   return ethers.formatEther(wei);
  // };
  const formatUSDC = (amount: bigint) => {
    return ethers.formatUnits(amount, 6); // USDC has 6 decimals
  };

  // Check if campaign is active
  const isActive = campaign.active && !campaign.cancelled && !campaign.funded;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;
  const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

  // Calculate progress percentage
  const progress =
    campaign.totalDonated > 0n
      ? Math.min(
          (Number(campaign.totalDonated) / Number(campaign.goalAmount)) * 100,
          100
        )
      : 0;

  // Get status color
  const getStatusColor = () => {
    if (campaign.cancelled) return "from-red-500 to-red-600";
    if (campaign.funded) return "from-green-500 to-green-600";
    if (!isActive || isExpired) return "from-gray-500 to-gray-600";
    if (isSuccessful) return "from-purple-500 to-purple-600";
    return "from-blue-500 to-blue-600";
  };

  // Get status text
  const getStatusText = () => {
    if (campaign.cancelled) return "Cancelled";
    if (campaign.funded) return "Funded";
    if (!isActive || isExpired) return "Ended";
    if (isSuccessful) return "Successful";
    return "Active";
  };

  // Truncate text
  const truncateText = (text: string, length: number) => {
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  // Calculate spread transform for stacked view
  const getSpreadTransform = () => {
    if (!isStacked) {
      return {};
    }

    if (!isGroupHovered) {
      // Stacked state - cards pile on top of each other
      return {
        transform: `translateX(${index * 10}px) translateY(${
          index * 6
        }px) rotate(${index * -1.5}deg) scale(${1 - index * 0.015})`,
        zIndex: totalCards - index,
        opacity: 1 - index * 0.1,
      };
    }

    // Spread state - cards fan out with rotation
    const centerIndex = (totalCards - 1) / 2;
    const offsetFromCenter = index - centerIndex;
    const spreadDistance = 280;
    const rotationAngle = offsetFromCenter * 6;
    const verticalOffset = Math.abs(offsetFromCenter) * 15;

    return {
      transform: `translateX(${
        offsetFromCenter * spreadDistance
      }px) translateY(${verticalOffset}px) rotate(${rotationAngle}deg) scale(${
        isHovered ? 1.08 : 1
      })`,
      zIndex: isHovered ? 100 : totalCards - Math.abs(offsetFromCenter),
      opacity: 1,
    };
  };

  const spreadStyle = getSpreadTransform();

  return (
    <div
      className={`group relative ${
        isStacked ? "transition-all duration-700 ease-out" : ""
      }`}
      style={isStacked ? spreadStyle : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Card Container */}
      <div
        className={`
          relative bg-white dark:bg-gray-800 rounded-2xl 
          transition-all duration-500 ease-out
          border-2 border-gray-200/50 dark:border-gray-700/50
          backdrop-blur-sm
          ${isHovered ? "shadow-2xl -translate-y-2" : "shadow-lg"}
          ${!isStacked ? "hover:scale-105" : ""}
        `}
        style={{
          transformStyle: "preserve-3d",
          transform: isStacked
            ? "none"
            : isHovered
            ? "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.05, 1.05, 1.05)"
            : "perspective(1000px) rotateX(1deg) rotateY(-0.5deg)",
        }}
      >
        {/* Gradient Border Effect */}
        <div
          className={`
            absolute inset-0 rounded-2xl bg-gradient-to-br transition-opacity duration-500
            ${getStatusColor()}
            ${isHovered ? "opacity-15" : "opacity-0"}
          `}
        />

        {/* Header with Gradient */}
        <div
          className={`
            relative h-32 rounded-t-2xl bg-gradient-to-br ${getStatusColor()}
            overflow-hidden
          `}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>

          {/* Animated Particles */}
          {isHovered && (
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" />
              <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-ping delay-100" />
              <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-white/30 rounded-full animate-ping delay-200" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                ${
                  campaign.cancelled
                    ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                    : campaign.funded
                    ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                    : !isActive || isExpired
                    ? "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30"
                    : "bg-white/20 text-white border border-white/30"
                }
                transition-all duration-300
                ${isHovered ? "scale-110 shadow-lg" : "scale-100"}
              `}
            >
              {getStatusText()}
            </span>
          </div>

          {/* Campaign Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3
              className={`text-lg font-bold text-white truncate drop-shadow-lg transition-all duration-300 ${
                isHovered ? "translate-x-1" : ""
              }`}
            >
              {truncateText(campaign.name, 40)}
            </h3>
            <p
              className={`text-white/80 text-sm mt-1 truncate transition-all duration-300 ${
                isHovered ? "translate-x-1" : ""
              }`}
            >
              by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
            </p>
          </div>

          {/* Shine Effect on Hover */}
          <div
            className={`
              absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
              transition-all duration-700
              ${isHovered ? "translate-x-full" : "-translate-x-full"}
            `}
            style={{ transition: "transform 0.7s ease-in-out" }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
            {campaign.description ||
              "No description provided for this campaign."}
          </p>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Funding Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-1000 ease-out relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                {/* Animated shine on progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div
              className={`text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${
                isHovered ? "bg-gray-100 dark:bg-gray-700 scale-105" : ""
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {formatUSDC(campaign.totalDonated)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Raised</div>
            </div>
            <div
              className={`text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${
                isHovered ? "bg-gray-100 dark:bg-gray-700 scale-105" : ""
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {formatUSDC(campaign.goalAmount)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Goal</div>
            </div>
            <div
              className={`text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${
                isHovered ? "bg-gray-100 dark:bg-gray-700 scale-105" : ""
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {new Date(
                  Number(campaign.deadline) * 1000
                ).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Deadline</div>
            </div>
            <div
              className={`text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${
                isHovered ? "bg-gray-100 dark:bg-gray-700 scale-105" : ""
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">
                #{campaign.id}
              </div>
              <div className="text-gray-500 dark:text-gray-400">ID</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(campaign)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                bg-gray-100 dark:bg-gray-700 
                hover:bg-gray-200 dark:hover:bg-gray-600 
                text-gray-700 dark:text-gray-300
                border border-gray-200 dark:border-gray-600
                hover:scale-105 active:scale-95
                hover:shadow-md
              `}
            >
              Details
            </button>

            {isActive && !isExpired && (
              <button
                onClick={() => onDonate(campaign)}
                disabled={!isConnected}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  bg-gradient-to-r ${getStatusColor()} 
                  hover:shadow-lg hover:shadow-blue-500/50
                  text-white
                  border border-transparent
                  transform hover:scale-105 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  relative overflow-hidden
                `}
              >
                <span className="relative z-10">
                  {isConnected ? "Donate" : "Connect"}
                </span>
                {isHovered && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}
              </button>
            )}
          </div>

          {/* Success Badge */}
          {isSuccessful && isActive && (
            <div
              className={`mt-3 flex items-center justify-center transition-all duration-300 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
            >
              <div className="flex items-center space-x-1 bg-green-500/10 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-500/20">
                <span className="text-sm animate-bounce">🎉</span>
                <span className="text-xs font-medium">Goal Achieved!</span>
              </div>
            </div>
          )}
        </div>

        {/* Subtle Glow Effect */}
        <div
          className={`
            absolute inset-0 rounded-2xl pointer-events-none
            bg-gradient-to-br from-transparent via-blue-500/5 to-transparent
            transition-opacity duration-500
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Ripple Effect on Hover */}
        {isHovered && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
          </div>
        )}
      </div>

      {/* Floating Shadow */}
      <div
        className={`
          absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900/10 to-gray-900/5 dark:from-gray-900/20 dark:to-gray-900/10
          blur-xl transition-all duration-500
          ${
            isHovered ? "opacity-60 scale-105 blur-2xl" : "opacity-30 scale-100"
          }
          -z-10
        `}
      />
    </div>
  );
}

// Add this CSS to your global styles or as a style tag
const styles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}
`;
