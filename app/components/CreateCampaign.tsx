"use client";

import React, { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";

export type CreateCampaignData = {
  name: string;
  description: string;
  goalAmount: string;
  durationInDays: number;
  deadlineTs: number;
};

type Props = {
  onCreate?: (data: CreateCampaignData) => Promise<void> | void;
  initial?: Partial<CreateCampaignData>;
  onClose?: () => void;
};

export default function CreateCampaign({ onCreate, initial, onClose }: Props) {
  const { isConnected } = useAccount();
  const { createCampaign, isLoading } = useContract();

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [goalAmount, setGoalAmount] = useState(initial?.goalAmount || "");
  const [durationInDays, setDurationInDays] = useState<number>(
    initial?.durationInDays || 7
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // Renamed to avoid confusion

  const deadlineTs = useMemo(() => {
    const secs = Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60;
    return secs;
  }, [durationInDays]);

  const validate = (): string | null => {
    if (!name || name.trim().length === 0) return "Name cannot be empty";
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    const amt = Number(goalAmount);
    if (!goalAmount || isNaN(amt) || !(amt > 0))
      return "Goal amount must be a number greater than 0";
    if (
      !Number.isInteger(durationInDays) ||
      durationInDays <= 0 ||
      durationInDays > 365
    )
      return "Duration must be an integer between 1 and 365 days";
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError(null);

    if (!isConnected) {
      setFormError("Please connect your wallet first");
      return;
    }

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      goalAmount: goalAmount.trim(),
      durationInDays,
    };

    try {
      setSubmitting(true);

      // Use the contract hook to create campaign - toasts are handled inside the hook
      const result = await createCampaign(payload);

      console.log("Campaign created successfully:", result);

      // Call the original onCreate callback if provided
      if (onCreate) {
        await onCreate({
          ...payload,
          deadlineTs,
        });
      }

      // Close the modal after successful creation
      onClose?.();
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setDescription("");
    setGoalAmount("");
    setDurationInDays(7);
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Campaign
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
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
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Start a new crowdfunding campaign on Moonbase Alpha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Only show form validation errors, contract errors are handled by toasts */}
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 dark:text-red-200 font-medium">
                  {formError}
                </span>
              </div>
            </div>
          )}

          {/* Form fields remain the same as before */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Campaign Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter campaign title"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={4}
              placeholder="Describe your campaign goals and purpose..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Goal Amount (ETH) *
            </label>
            <div className="relative">
              <input
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                placeholder="0.00"
                inputMode="decimal"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  ETH
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Duration (days) *
            </label>
            <input
              value={durationInDays}
              onChange={(e) => setDurationInDays(Number(e.target.value))}
              type="number"
              min={1}
              max={365}
              className="w-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Campaign will end on:{" "}
              <strong className="text-gray-900 dark:text-white">
                {new Date(deadlineTs * 1000).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || isLoading || !isConnected}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {submitting || isLoading ? (
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
                  Creating on Blockchain...
                </span>
              ) : (
                "Create Campaign"
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={submitting || isLoading}
              className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          {!isConnected && (
            <div className="text-center">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Please connect your wallet to create a campaign
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
