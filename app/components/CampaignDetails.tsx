"use client";

import React, { useState, useEffect } from "react";
import { Campaign } from "../contexts/CampaignsContext";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import DonationModal from "./DonationModal";
import { useContract } from "../hooks/useContract";

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
    "overview" | "analytics" | "donations"
  >("overview");
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [campaignDonations, setCampaignDonations] = useState<any[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const { getCampaignDonations } = useContract();

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab === "donations") {
        setIsLoadingDonations(true);
        try {
          const donations = await getCampaignDonations(campaign.id);
          setCampaignDonations(donations);
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
    campaign.totalDonated > 0n
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
  const isSuccessful = campaign.totalDonated >= campaign.goalAmount;

  // Recent donations within the last 24 hours (newest first)
  const recentDonations = [...campaignDonations]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .filter(
      (d) => Number(d.timestamp) * 1000 >= Date.now() - 24 * 60 * 60 * 1000
    )
    .slice(0, 5);

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
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "donations", label: "Donations", icon: "💝" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
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
            {/* Progress Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Funding Progress
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isExpired
                      ? "Campaign has ended"
                      : `${daysLeft} days remaining`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {progress.toFixed(1)}%
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
                    {ethers.formatUnits(campaign.totalDonated, 18)} USDC
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Raised
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {ethers.formatUnits(campaign.goalAmount, 18)} USDC
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Goal
                  </div>
                </div>
              </div>
            </div>

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

                {/* Donation Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {ethers.formatUnits(campaign.totalDonated, 18)}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Total Raised
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
                        ? parseFloat(
                            ethers.formatUnits(
                              campaign.totalDonated /
                                BigInt(campaignDonations.length),
                              18
                            )
                          ).toFixed(2)
                        : "0.00"}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Average Donation
                    </div>
                  </div>
                </div>

                {/* Donations List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {campaignDonations && campaignDonations.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[...campaignDonations]
                        .sort(
                          (a, b) => Number(b.timestamp) - Number(a.timestamp)
                        )
                        .map((donation, index) => (
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
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  +{ethers.formatUnits(donation.amount, 18)}{" "}
                                  USDC
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Donation #{index + 1}
                                </div>
                              </div>
                            </div>

                            {/* Progress impact (optional) */}
                            <div className="mt-3 flex items-center space-x-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Contributed{" "}
                                {(
                                  (Number(donation.amount) /
                                    Number(campaign.goalAmount)) *
                                  100
                                ).toFixed(2)}
                                % to goal
                              </div>
                            </div>
                          </div>
                        ))}
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
                        will appear here and help inspire others to donate.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Activity Timeline (Alternative View) */}
                {recentDonations && recentDonations.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Recent Activity
                    </h4>
                    <div className="space-y-4">
                      {recentDonations.map((donation, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <span className="text-sm text-gray-900 dark:text-white">
                              New donation from {donation.donor.slice(0, 6)}
                              ...
                              {donation.donor.slice(-4)}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                              {ethers.formatUnits(donation.amount, 18)} USDC
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(
                              Number(donation.timestamp) * 1000
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
