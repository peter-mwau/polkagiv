// components/DonationModal.tsx
"use client";

import React, { useState } from "react";
import { Campaign } from "../contexts/CampaignsContext";
import { useContract } from "../hooks/useContract";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";

interface DonationModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onDonationSuccess: () => void;
}

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || "";

export default function DonationModal({
  campaign,
  isOpen,
  onClose,
  onDonationSuccess,
}: DonationModalProps) {
  const { isConnected, address } = useAccount();
  const { donateToCampaign } = useContract();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check if approval is needed
  const checkAllowance = async (): Promise<boolean> => {
    if (!address || !amount || parseFloat(amount) <= 0) return false;

    try {
      // Get USDC contract instance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)",
          "function decimals() view returns (uint8)",
        ],
        signer
      );

      const donationContractAddress =
        process.env.NEXT_PUBLIC_DONOR_CONTRACT_ADDRESS;
      const currentAllowance = await usdcContract.allowance(
        address,
        donationContractAddress
      );
      const amountInWei = ethers.parseUnits(amount, 18); // Your USDC uses 18 decimals

      return currentAllowance < amountInWei;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  // Approve USDC tokens
  const approveTokens = async (): Promise<boolean> => {
    if (!address) return false;

    const toastId = toast.loading("Approving USDC tokens...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer
      );

      const amountInWei = ethers.parseUnits(amount, 18);
      const donationContractAddress =
        process.env.NEXT_PUBLIC_DONOR_CONTRACT_ADDRESS;

      const tx = await usdcContract.approve(
        donationContractAddress,
        amountInWei
      );

      toast.update(toastId, {
        render: "Approval submitted. Waiting for confirmation...",
        type: "info",
        isLoading: true,
      });

      await tx.wait();

      toast.update(toastId, {
        render: "USDC tokens approved successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      return true;
    } catch (error: any) {
      console.error("Approval error:", error);

      let errorMessage = "Failed to approve tokens";
      if (error.message?.includes("rejected")) {
        errorMessage = "Approval was rejected";
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      return false;
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }

    setIsLoading(true);

    try {
      // Check if approval is needed
      const requiresApproval = await checkAllowance();

      if (requiresApproval) {
        setNeedsApproval(true);
        const approved = await approveTokens();
        if (!approved) {
          setIsLoading(false);
          return;
        }
        setNeedsApproval(false);
      }

      // Now proceed with donation
      const toastId = toast.loading("Processing your donation...");
      const amountInWei = ethers.parseUnits(amount, 18);

      await donateToCampaign(USDC_ADDRESS, campaign.id, amount);

      toast.update(toastId, {
        render: "Donation successful! Thank you for your support! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setAmount("");
      onDonationSuccess();
      onClose();
    } catch (error: any) {
      console.error("Donation error:", error);

      let errorMessage = "Failed to process donation";
      if (error.message?.includes("rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Insufficient balance";
      } else if (error.message?.includes("allowance")) {
        errorMessage = "Token approval needed. Please try again.";
        setNeedsApproval(true);
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedAmounts = [10, 25, 50, 100];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {needsApproval ? "Approve USDC Tokens" : "Support this Campaign"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            {campaign.name}
          </p>
        </div>

        {/* Donation Form */}
        <form onSubmit={handleDonate} className="p-6 space-y-6">
          {needsApproval ? (
            /* Approval Step */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Approval Required
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You need to approve the contract to spend your USDC tokens
                  before donating.
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This is a one-time approval for this amount. You won&apos;t
                  need to approve again for future donations of the same or
                  smaller amounts.
                </p>
              </div>
            </div>
          ) : (
            /* Donation Step */
            <>
              {/* Campaign Progress */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <span>Current Progress</span>
                  <span>
                    {(
                      (Number(campaign.totalDonated) /
                        Number(campaign.goalAmount)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (Number(campaign.totalDonated) /
                          Number(campaign.goalAmount)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mt-2">
                  <span>
                    {ethers.formatUnits(campaign.totalDonated, 18)} USDC raised
                  </span>
                  <span>
                    {ethers.formatUnits(campaign.goalAmount, 18)} USDC goal
                  </span>
                </div>
              </div>

              {/* Quick Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Select Amount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedAmounts.map((suggestedAmount) => (
                    <button
                      key={suggestedAmount}
                      type="button"
                      onClick={() => setAmount(suggestedAmount.toString())}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        amount === suggestedAmount.toString()
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {suggestedAmount} USDC
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 pl-16 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      USDC
                    </span>
                  </div>
                </div>
              </div>

              {/* Donation Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-800 dark:text-green-200">
                      Your Donation:
                    </span>
                    <span className="font-semibold text-green-900 dark:text-green-100">
                      {amount} USDC
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                    This will bring the campaign to{" "}
                    {(
                      ((Number(campaign.totalDonated) +
                        parseFloat(amount) * 1e18) /
                        Number(campaign.goalAmount)) *
                      100
                    ).toFixed(1)}
                    % of its goal
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !isConnected || isLoading || !amount || parseFloat(amount) <= 0
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {needsApproval ? "Approving..." : "Processing..."}
                </span>
              ) : needsApproval ? (
                "Approve USDC"
              ) : (
                "Donate Now"
              )}
            </button>
          </div>

          {!isConnected && (
            <div className="text-center">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Please connect your wallet to make a donation
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
