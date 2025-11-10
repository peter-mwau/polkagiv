// components/CampaignCard.tsx
"use client";

import React from "react";
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

  // Format ETH values from wei
  const formatETH = (wei: bigint) => {
    return ethers.formatEther(wei);
  };

  // Check if campaign is active
  const isActive = campaign.active && !campaign.cancelled && !campaign.funded;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;
  const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

  // Get status badge
  const getStatusBadge = () => {
    if (campaign.cancelled) {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
          Cancelled
        </span>
      );
    }
    if (campaign.funded) {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          Funded
        </span>
      );
    }
    if (!isActive || isExpired) {
      return (
        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
          Ended
        </span>
      );
    }
    return (
      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
        Active
      </span>
    );
  };

  // Format deadline
  const formatDeadline = (deadline: bigint) => {
    return new Date(Number(deadline) * 1000).toLocaleDateString();
  };

  // Format creation date
  const formatCreationDate = (createdAt: bigint) => {
    return new Date(Number(createdAt) * 1000).toLocaleDateString();
  };

  // Calculate progress percentage
  const progress =
    campaign.totalDonated > 0n
      ? Math.min(
          (Number(campaign.totalDonated) / Number(campaign.goalAmount)) * 100,
          100
        )
      : 0;

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Campaign Image/Header */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        <div className="absolute top-4 left-4">{getStatusBadge()}</div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white truncate">
            {campaign.name}
          </h3>
          <p className="text-blue-100 text-sm mt-1">
            by {truncateAddress(campaign.creator)}
          </p>
        </div>
      </div>

      {/* Campaign Content */}
      <div className="p-6">
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {campaign.description || "No description provided."}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Raised</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatETH(campaign.totalDonated)} ETH
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Goal</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatETH(campaign.goalAmount)} ETH
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Deadline</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatDeadline(campaign.deadline)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Created</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatCreationDate(campaign.createdAt)}
            </div>
          </div>
        </div>

        {/* Campaign ID */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Campaign ID
          </div>
          <div className="font-mono text-sm text-gray-900 dark:text-white">
            #{campaign.id}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewDetails(campaign)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            View Details
          </button>
          {isActive && !isExpired && (
            <button
              onClick={() => onDonate(campaign)}
              disabled={!isConnected}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isConnected ? "Donate" : "Connect"}
            </button>
          )}
        </div>

        {/* Success Indicator */}
        {isSuccessful && isActive && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center text-green-800 dark:text-green-200">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Goal reached! 🎉</span>
            </div>
          </div>
        )}

        {/* Expired Indicator */}
        {isExpired && isActive && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center text-amber-800 dark:text-amber-200">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Campaign ended</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
