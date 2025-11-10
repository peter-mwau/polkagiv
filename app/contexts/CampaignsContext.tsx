// contexts/CampaignsContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useContract } from "../hooks/useContract";

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
  const { getAllCampaigns } = useContract();
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const rawCampaigns = await getAllCampaigns();

      console.log("Raw campaigns data:", rawCampaigns); // For debugging

      if (!Array.isArray(rawCampaigns)) {
        throw new Error("Invalid campaigns data format");
      }

      // Transform each raw campaign array into a proper Campaign object
      const processedCampaigns = rawCampaigns.map(transformCampaign);

      console.log("Processed campaigns:", processedCampaigns); // For debugging

      setCampaigns(processedCampaigns);
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

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
