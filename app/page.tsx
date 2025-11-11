"use client";

import Image from "next/image";
import { useState } from "react";
import CreateCampaign from "./components/CreateCampaign";
import CampaignsGrid from "./components/CampaignsGrid";
import { Campaign } from "./hooks/useContract";

export default function Home() {
  const [openCreateCampaign, setOpenCreateCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  const handleDonate = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDonation(true);
  };

  return (
    <>
      <div className="h-[180vh] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black pt-16">
        <main className="flex min-h-screen w-full max-w-7xl mx-auto flex-col items-center justify-between py-32 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="space-y-6">
              <Image
                className="dark:invert mx-auto"
                src="/next.svg"
                alt="Next.js logo"
                width={180}
                height={36}
                priority
              />

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                Decentralized{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Crowdfunding
                </span>{" "}
                Made Simple
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-8">
                Launch your campaign on the blockchain. Transparent, secure, and
                accessible to everyone. Powered by Moonbase Alpha.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button
                onClick={() => setOpenCreateCampaign(true)}
                className="group bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
              >
                <span>Start a Campaign</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                Learn More
              </a>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 pt-16">
              {[
                {
                  title: "Transparent",
                  description:
                    "All transactions are recorded on the blockchain for complete transparency",
                  icon: "🔍",
                },
                {
                  title: "Secure",
                  description:
                    "Smart contracts ensure funds are handled securely and automatically",
                  icon: "🛡️",
                },
                {
                  title: "Accessible",
                  description:
                    "Open to anyone with a crypto wallet, no intermediaries needed",
                  icon: "🌍",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-2xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <CampaignsGrid
              onViewDetails={handleViewDetails}
              onDonate={handleDonate}
            />
          </div>
        </main>

        {/* Create Campaign Modal */}
        {openCreateCampaign && (
          <CreateCampaign onClose={() => setOpenCreateCampaign(false)} />
        )}
      </div>
    </>
  );
}
