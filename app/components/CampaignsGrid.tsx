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
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [peelingCampaign, setPeelingCampaign] = useState<number | null>(null);

  // Sort campaigns by creation date (newest first) for stacking
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
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

  // Auto-spread after initial load
  useEffect(() => {
    if (isInitialLoad && filteredCampaigns.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setIsSpread(true);
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [filteredCampaigns.length, loading, isInitialLoad]);

  const handleCardClick = (campaign: Campaign) => {
    if (!isSpread) {
      setIsSpread(true);
      // Start peel animation
      setPeelingCampaign(campaign.id);
      // After peel animation completes, set as active
      setTimeout(() => {
        setActiveCampaign(campaign);
        setPeelingCampaign(null);
      }, 600);
    } else {
      setActiveCampaign(campaign);
    }
  };

  const handleCloseActive = () => {
    setActiveCampaign(null);
  };

  const handleContainerHover = () => {
    if (!isSpread && !activeCampaign) {
      setIsSpread(true);
    }
  };

  const handleContainerLeave = () => {
    if (isSpread && !activeCampaign && filteredCampaigns.length > 3) {
      setIsSpread(false);
    }
  };

  // Calculate stack positions
  const getStackPosition = (index: number) => {
    if (isSpread || activeCampaign) {
      return {
        zIndex: 10 + index,
        transform: "translateX(0) translateY(0) rotate(0deg)",
      };
    }

    const totalCards = Math.min(filteredCampaigns.length, 5);
    const stackOffset = 8;
    const maxRotation = 3;

    if (index >= totalCards) {
      return {
        zIndex: 10,
        transform: "translateX(0) translateY(0) rotate(0deg)",
        opacity: 0,
      };
    }

    const position = totalCards - index - 1;
    const rotation = (Math.random() - 0.5) * maxRotation * 2;
    const xOffset = (Math.random() - 0.5) * stackOffset;

    return {
      zIndex: 10 + position,
      transform: `translateX(${xOffset}px) translateY(${
        position * stackOffset
      }px) rotate(${rotation}deg)`,
    };
  };

  // Stacked Card Cover Component
  const StackedCardCover = ({
    campaign,
    index,
  }: {
    campaign: Campaign;
    index: number;
  }) => {
    const stackStyle = getStackPosition(index);
    const isPeeling = peelingCampaign === campaign.id;

    return (
      <div
        className={`
          absolute w-80 h-48 cursor-pointer
          transition-all duration-500 ease-out
          ${isPeeling ? "scale-110 rotate-6 z-50" : ""}
        `}
        style={stackStyle}
        onClick={() => handleCardClick(campaign)}
      >
        {/* Main Cover */}
        <div
          className={`
            w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700
            shadow-2xl border-2 border-white/20 backdrop-blur-sm
            transition-all duration-300
            ${isPeeling ? "opacity-0 scale-95" : "opacity-100"}
            group hover:scale-105 hover:shadow-xl
          `}
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />

          {/* Content */}
          <div className="relative p-6 h-full flex flex-col justify-between">
            {/* Campaign Title */}
            <div className="text-white">
              <h3 className="text-xl font-bold truncate drop-shadow-lg">
                {campaign.name}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
              </p>
            </div>

            {/* Peel Hint */}
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-sm">#{campaign.id}</div>
              <div className="flex items-center space-x-1 text-white/60">
                <span className="text-xs">Click to reveal</span>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Peel Corner Effect */}
          <div
            className={`
              absolute top-4 right-4 w-6 h-6
              transition-all duration-300
              ${isPeeling ? "opacity-0 scale-150" : "opacity-100"}
              group-hover:scale-110 group-hover:rotate-12
            `}
          >
            <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Peel Animation Layer */}
        {isPeeling && (
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              transform: "perspective(1000px) rotateX(5deg) rotateY(-5deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Peeling Corner */}
            <div
              className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-full shadow-2xl"
              style={{
                transform: "rotate(45deg) translate(20px, -20px)",
                animation: "peel 0.6s ease-out forwards",
              }}
            >
              <style jsx>{`
                @keyframes peel {
                  0% {
                    transform: rotate(45deg) translate(0, 0) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: rotate(45deg) translate(40px, -40px) scale(1.2);
                    opacity: 0;
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            {!isSpread && " • Click to reveal details"}
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

      {/* Cards Container */}
      <div
        className="relative"
        onMouseEnter={handleContainerHover}
        onMouseLeave={handleContainerLeave}
      >
        {/* Stacked Covers View */}
        {!isSpread && !activeCampaign && (
          <div className="relative min-h-96 flex justify-center items-start pt-20">
            {filteredCampaigns.map((campaign, index) => (
              <StackedCardCover
                key={campaign.id}
                campaign={campaign}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Spread Grid View */}
        {(isSpread || activeCampaign) && (
          <div
            className={`
            transition-all duration-700 ease-out
            ${
              isSpread || activeCampaign
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : ""
            }
          `}
          >
            {filteredCampaigns.map((campaign, index) => {
              const isActive = activeCampaign?.id === campaign.id;

              return (
                <div
                  key={campaign.id}
                  className={`
                    transition-all duration-500 ease-out
                    ${
                      isActive ? "z-50 scale-105" : "hover:scale-105 hover:z-40"
                    }
                  `}
                >
                  <CampaignCard
                    campaign={campaign}
                    onViewDetails={(camp) => {
                      handleCardClick(camp);
                      onViewDetails(camp);
                    }}
                    onDonate={(camp) => {
                      handleCardClick(camp);
                      onDonate(camp);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Overlay for active card */}
        {activeCampaign && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={handleCloseActive}
          >
            <div
              className="relative z-50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CampaignCard
                campaign={activeCampaign}
                onViewDetails={onViewDetails}
                onDonate={onDonate}
              />
              <button
                onClick={handleCloseActive}
                className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stack Visual Guide */}
        {!isSpread && !activeCampaign && filteredCampaigns.length > 0 && (
          <div className="text-center mt-32">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Click any card to peel and reveal details
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
