// components/CampaignsGrid.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  const [isSpread, setIsSpread] = useState(false);
  const [viewMode, setViewMode] = useState<"stacked" | "grid">("stacked");

  // Sort campaigns by creation date (newest first) for stacking
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
  );

  // Filter campaigns based on selected filter
  const filteredCampaigns = sortedCampaigns.filter((campaign) => {
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

  // Auto-show as grid after initial load if there are campaigns
  useEffect(() => {
    if (filteredCampaigns.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setViewMode("grid");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filteredCampaigns.length, loading]);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "stacked" ? "grid" : "stacked"));
    setIsSpread(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute inset-0"></div>
        </div>
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

  if (filteredCampaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No campaigns found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or check back later for new campaigns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          {/* View Toggle */}
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105 active:scale-95"
          >
            {viewMode === "stacked" ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid View
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Stack View
              </span>
            )}
          </button>

          {/* Filters */}
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === "all"
                ? "bg-blue-500 text-white shadow-md scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === "active"
                ? "bg-green-500 text-white shadow-md scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("successful")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === "successful"
                ? "bg-purple-500 text-white shadow-md scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter("ended")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              filter === "ended"
                ? "bg-gray-500 text-white shadow-md scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Ended
          </button>
        </div>
      </div>

      {/* Cards Container */}
      {viewMode === "stacked" ? (
        /* Stacked View with Spread Animation */
        <div
          className="relative h-auto pt-[100px] flex justify-center items-center"
          style={{ perspective: "2000px" }}
          onMouseEnter={() => setIsSpread(true)}
          onMouseLeave={() => setIsSpread(false)}
        >
          <div className="relative w-full max-w-md">
            {filteredCampaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.id} className="absolute top-0 left-0 w-full">
                <CampaignCard
                  campaign={campaign}
                  onViewDetails={onViewDetails}
                  onDonate={onDonate}
                  index={index}
                  totalCards={Math.min(filteredCampaigns.length, 5)}
                  isGroupHovered={isSpread}
                  isStacked={true}
                />
              </div>
            ))}
          </div>

          {/* Hint Text */}
          {!isSpread && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg animate-bounce">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hover to spread cards
                </span>
                <svg
                  className="w-4 h-4 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Show more campaigns indicator */}
          {filteredCampaigns.length > 5 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full border border-blue-500/20">
                <span className="text-sm font-medium">
                  +{filteredCampaigns.length - 5} more campaigns
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCampaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="transform transition-all duration-500 hover:scale-105"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <CampaignCard
                campaign={campaign}
                onViewDetails={onViewDetails}
                onDonate={onDonate}
                isStacked={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add keyframes for fade in animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
