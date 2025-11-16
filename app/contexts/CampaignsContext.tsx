// contexts/CampaignsContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useContract } from "../hooks/useContract";
import { useTokenConversion } from "../hooks/useTokenConversion";

// Updated Campaign interface based on your actual data structure
export interface Campaign {
  id: number;
  name: string;
  description: string;
  creator: string;
  goalAmount: bigint;
  totalDonated: bigint;
  createdAt: bigint;
  deadline: bigint;
  active: boolean;
  exists: boolean;
  funded: boolean;
  cancelled: boolean;
}

interface CampaignsContextType {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refreshCampaigns: () => Promise<void>;
  getCampaignById: (id: number) => Campaign | undefined;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(
  undefined
);

interface CampaignsProviderProps {
  children: ReactNode;
}

export function CampaignsProvider({ children }: CampaignsProviderProps) {
  const { getAllCampaigns, getCampaignTokenBalances } = useContract();
  const { calculatePortfolioValue } = useTokenConversion();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to transform the raw campaign array into a proper Campaign object
  const transformCampaign = (rawCampaign: any[]): Campaign => {
    // The array indices correspond to the struct fields in your contract
    return {
      id: Number(rawCampaign[0]), // id
      name: rawCampaign[1], // name
      description: rawCampaign[2], // description
      creator: rawCampaign[3], // creator
      goalAmount: rawCampaign[4], // goalAmount
      totalDonated: rawCampaign[5], // totalDonated
      createdAt: rawCampaign[6], // createdAt
      deadline: rawCampaign[7], // deadline
      active: rawCampaign[8], // active
      exists: rawCampaign[9], // exists
      funded: rawCampaign[10], // funded
      cancelled: rawCampaign[11], // cancelled
    };
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawCampaigns = await getAllCampaigns();

      console.log("Raw campaigns data:", rawCampaigns); // For debugging

      if (!Array.isArray(rawCampaigns)) {
        throw new Error("Invalid campaigns data format");
      }

      // Transform each raw campaign array into a proper Campaign object
      const processedCampaigns = (rawCampaigns as any[]).map(transformCampaign);

      // For each campaign compute USDC-equivalent portfolio (goalUSD, raisedUSD, progress)
      const enrichedCampaigns = await Promise.all(
        processedCampaigns.map(async (c) => {
          try {
            const portfolio = await calculatePortfolioValue(
              c.id,
              c.goalAmount.toString(),
              getCampaignTokenBalances
            );

            return {
              ...c,
              goalUSD: portfolio.goalUSD,
              raisedUSD: portfolio.raisedUSD,
              progress: portfolio.progress,
              tokenBalances: portfolio.tokenBalances,
            } as Campaign & {
              goalUSD?: number;
              raisedUSD?: number;
              progress?: number;
              tokenBalances?: any[];
            };
          } catch (error: unknown) {
            // If portfolio calculation fails, return original campaign
            console.error(
              "Portfolio enrichment failed for campaign",
              c.id,
              error
            );
            return c;
          }
        })
      );

      console.log("Processed campaigns:", enrichedCampaigns); // For debugging

      setCampaigns(enrichedCampaigns as Campaign[]);
    } catch (err: unknown) {
      console.error("Error fetching campaigns:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
    // Intentionally only depend on calculatePortfolioValue here. getAllCampaigns and
    // getCampaignTokenBalances come from `useContract` and may change identity
    // across renders which would cause this effect to refetch repeatedly. The
    // functions themselves are stable in practice; if you change the contract
    // implementation to memoize those functions, you can add them back to the
    // dependency list. For now we disable the exhaustive-deps rule for those
    // two values to avoid an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatePortfolioValue]);

  const getCampaignById = (id: number): Campaign | undefined => {
    return campaigns.find((campaign) => campaign.id === id);
  };

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const contextValue: CampaignsContextType = {
    campaigns,
    loading,
    error,
    refreshCampaigns: fetchCampaigns,
    getCampaignById,
  };

  return (
    <CampaignsContext.Provider value={contextValue}>
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignsContext);
  if (context === undefined) {
    throw new Error("useCampaigns must be used within a CampaignsProvider");
  }
  return context;
}
