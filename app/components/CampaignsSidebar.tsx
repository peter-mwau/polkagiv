"use client";

import React, { useState } from "react";
import { useCampaigns } from "../contexts/CampaignsContext";
import { Campaign } from "../contexts/CampaignsContext";
import { ethers } from "ethers";

interface CampaignsSidebarProps {
  selectedCampaign: Campaign | null;
  onSelectCampaign: (campaign: Campaign) => void;
}

export default function CampaignsSidebar({
  selectedCampaign,
  onSelectCampaign,
}: CampaignsSidebarProps) {
  const { campaigns, loading, error, refreshCampaigns } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "successful" | "ended"
  >("all");

  // Filter and search campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());

    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

    const matchesFilter =
      filter === "all"
        ? true
        : filter === "active"
        ? campaign.active &&
          !campaign.cancelled &&
          !campaign.funded &&
          !isExpired
        : filter === "successful"
        ? isSuccessful && campaign.active
        : filter === "ended"
        ? !campaign.active || campaign.cancelled || campaign.funded || isExpired
        : true;

    return matchesSearch && matchesFilter;
  });

  const formatUSDC = (amount: bigint) => {
    return ethers.formatUnits(amount, 18); // USDC has 6 decimals
  };

  const getStatusColor = (campaign: Campaign) => {
    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

    if (campaign.cancelled) return "bg-red-500";
    if (campaign.funded) return "bg-green-500";
    if (!campaign.active || isExpired) return "bg-gray-500";
    if (isSuccessful) return "bg-purple-500";
    return "bg-blue-500";
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Loading campaigns...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={refreshCampaigns}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[85vh] flex flex-col">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Campaigns
          </h1>
          <button
            onClick={refreshCampaigns}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex space-x-1">
          {[
            { key: "all", label: "All", color: "bg-gray-500" },
            { key: "active", label: "Active", color: "bg-blue-500" },
            { key: "successful", label: "Successful", color: "bg-purple-500" },
            { key: "ended", label: "Ended", color: "bg-gray-500" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                filter === key
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign)}
              className={`group p-4 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 ${
                selectedCampaign?.id === campaign.id
                  ? "border-blue-500 shadow-lg shadow-blue-500/25 scale-105"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              }`}
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(campaign)}`}
                ></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  #{campaign.id}
                </span>
              </div>

              {/* Campaign Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {campaign.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {campaign.description}
              </p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {(
                      (Number(campaign.totalDonated) /
                        Number(campaign.goalAmount)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(
                        (Number(campaign.totalDonated) /
                          Number(campaign.goalAmount)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between text-xs">
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatUSDC(campaign.totalDonated)}
                  </span>{" "}
                  USDC
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Goal:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatUSDC(campaign.goalAmount)}
                  </span>{" "}
                  USDC
                </div>
              </div>
            </div>
          ))}

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No campaigns found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {filteredCampaigns.length} of {campaigns.length} campaigns
        </div>
      </div>
    </div>
  );
}
