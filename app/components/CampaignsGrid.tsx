// components/CampaignsGrid.tsx
"use client";

import React, { useState } from "react";
import { useCampaigns } from "../contexts/CampaignsContext";
import CampaignCard from "./CampaignCard";
import { Campaign } from "../contexts/CampaignsContext";

interface CampaignsGridProps {
  onViewDetails: (campaign: Campaign) => void;
  onDonate: (campaign: Campaign) => void;
}

export default function CampaignsGrid({
  onViewDetails,
  onDonate,
}: CampaignsGridProps) {
  const { campaigns, loading, error, refreshCampaigns } = useCampaigns();
  const [filter, setFilter] = useState<
    "all" | "active" | "successful" | "ended"
  >("all");

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Convert BigInt to number for comparison
    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

    switch (filter) {
      case "active":
        return (
          campaign.active &&
          !campaign.cancelled &&
          !campaign.funded &&
          !isExpired
        );
      case "successful":
        return isSuccessful && campaign.active;
      case "ended":
        return (
          !campaign.active || campaign.cancelled || campaign.funded || isExpired
        );
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
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
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to load campaigns
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={refreshCampaigns}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Campaigns
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredCampaigns.length} campaign
            {filteredCampaigns.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filter === "active"
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("successful")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filter === "successful"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter("ended")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filter === "ended"
                ? "bg-gray-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Ended
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "all"
                ? "No campaigns have been created yet."
                : `No ${filter} campaigns found.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onViewDetails={onViewDetails}
              onDonate={onDonate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
