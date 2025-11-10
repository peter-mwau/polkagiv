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
}

export default function CampaignCard({
  campaign,
  onViewDetails,
  onDonate,
}: CampaignCardProps) {
  const { isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);

  // Format ETH values from wei
  const formatETH = (wei: bigint) => {
    return ethers.formatEther(wei);
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

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Card Container */}
      <div
        className={`
          relative bg-white dark:bg-gray-800 rounded-2xl 
          transition-all duration-500 ease-out
          border border-gray-200/50 dark:border-gray-700/50
          backdrop-blur-sm
          ${
            isHovered
              ? "shadow-2xl scale-105 rotate-0 -translate-y-2"
              : "shadow-lg scale-100 -rotate-1"
          }
        `}
        style={{
          transform: isHovered
            ? "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.05, 1.05, 1.05)"
            : "perspective(1000px) rotateX(2deg) rotateY(-1deg) scale3d(1, 1, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Gradient Border Effect */}
        <div
          className={`
            absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500
            ${getStatusColor()}
            ${isHovered ? "opacity-10" : "opacity-0"}
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
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>

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
                ${isHovered ? "scale-110" : "scale-100"}
              `}
            >
              {getStatusText()}
            </span>
          </div>

          {/* Campaign Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-lg font-bold text-white truncate drop-shadow-lg">
              {truncateText(campaign.name, 40)}
            </h3>
            <p className="text-white/80 text-sm mt-1 truncate">
              by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
            </p>
          </div>
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
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-1000 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {formatETH(campaign.totalDonated)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Raised</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {formatETH(campaign.goalAmount)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Goal</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {new Date(
                  Number(campaign.deadline) * 1000
                ).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Deadline</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
                  hover:shadow-lg
                  text-white
                  border border-transparent
                  transform hover:scale-105 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {isConnected ? "Donate" : "Connect"}
              </button>
            )}
          </div>

          {/* Success Badge */}
          {isSuccessful && isActive && (
            <div className="mt-3 flex items-center justify-center">
              <div className="flex items-center space-x-1 bg-green-500/10 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-500/20">
                <span className="text-sm">🎉</span>
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
      </div>

      {/* Floating Shadow */}
      <div
        className={`
          absolute inset-0 rounded-2xl bg-gray-900/10 dark:bg-gray-900/20
          blur-xl transition-all duration-500
          ${isHovered ? "opacity-50 scale-105" : "opacity-30 scale-100"}
          -z-10
        `}
      />
    </div>
  );
}
