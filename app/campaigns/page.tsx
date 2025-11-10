"use client";

import React, { useState } from "react";
import CampaignsSidebar from "../components/CampaignsSidebar";
import CampaignDetails from "../components/CampaignDetails";
import { Campaign } from "../contexts/CampaignsContext";

export default function CampaignsExplorerPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  return (
    <div className=" bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black mt-[20px] pt-[50px]">
      <div className="flex max-w-[70%] items-center mx-auto min-h-screen  rounded-lg shadow-lg overflow-hidden">
        {/* Sidebar - 20% */}
        <div className="w-80 rounded-2xl border-r border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CampaignsSidebar
            selectedCampaign={selectedCampaign}
            onSelectCampaign={handleSelectCampaign}
          />
        </div>

        {/* Main Content - 80% */}
        <div className="flex-1 overflow-hidden ml-4">
          {selectedCampaign ? (
            <CampaignDetails
              campaign={selectedCampaign}
              onBack={() => setSelectedCampaign(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-bl from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900 rounded-full flex items-center justify-center">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Select a Campaign
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose a campaign from the sidebar to view detailed
                  information, analytics, and management options.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Click on any campaign card to
                    explore its details and analytics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
