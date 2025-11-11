// hooks/useContract.ts
import { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { useEthersSigner } from './useClientSigner';
import { DONOR_CONTRACT_ADDRESS, donorContractABI } from '../lib/contract';

// Types based on your contract
export type Campaign = {
  id: bigint;
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
};

export type Donation = {
  donor: string;
  amount: bigint;
  timestamp: bigint;
};

export type CampaignData = {
  name: string;
  description: string;
  goalAmount: string;
  durationInDays: number;
};

export function useContract() {
  const { isConnected, address } = useAccount();
  const signerPromise = useEthersSigner();
  const [isLoading, setIsLoading] = useState(false);

  // Get contract instance
  const getContract = async () => {
    // Resolve the signer promise and ensure we have a signer instance.
    const signer = await signerPromise;
    if (!signer) {
      throw new Error('No signer available');
    }

    return new ethers.Contract(DONOR_CONTRACT_ADDRESS, donorContractABI, signer);
  };

  // Create a new campaign
  const createCampaign = async (campaignData: CampaignData) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating campaign...');

    try {
      // Validate input
      if (!campaignData.name.trim()) {
        toast.update(toastId, { 
          render: 'Campaign name is required', 
          type: 'error', 
          isLoading: false,
          autoClose: 3000 
        });
        throw new Error('Campaign name is required');
      }

      if (!campaignData.goalAmount || parseFloat(campaignData.goalAmount) <= 0) {
        toast.update(toastId, { 
          render: 'Goal amount must be greater than 0', 
          type: 'error', 
          isLoading: false,
          autoClose: 3000 
        });
        throw new Error('Goal amount must be greater than 0');
      }

      if (campaignData.durationInDays <= 0 || campaignData.durationInDays > 365) {
        toast.update(toastId, { 
          render: 'Duration must be between 1 and 365 days', 
          type: 'error', 
          isLoading: false,
          autoClose: 3000 
        });
        throw new Error('Duration must be between 1 and 365 days');
      }

      const contract = await getContract();
      
      // Convert ETH amount to wei
      const goalAmountWei = ethers.parseEther(campaignData.goalAmount);

      console.log('Creating campaign with data:', {
        name: campaignData.name,
        description: campaignData.description,
        goalAmount: campaignData.goalAmount,
        goalAmountWei: goalAmountWei.toString(),
        durationInDays: campaignData.durationInDays
      });

      toast.update(toastId, { render: 'Confirming transaction in your wallet...' });

      // Execute the transaction
      const transaction = await contract.createCampaign(
        campaignData.name,
        campaignData.description,
        goalAmountWei,
        campaignData.durationInDays
      );

      toast.update(toastId, { render: 'Transaction submitted. Waiting for confirmation...' });

      // Wait for transaction confirmation
      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Campaign created successfully! 🎉', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error creating campaign:', err);
      
      let errorMessage = 'Failed to create campaign';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Donate to a campaign
  const donateToCampaign = async (
    campaignId: number, 
    tokenAddress: string, 
    amount: string
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Processing donation...');

    try {
      const contract = await getContract();
      const amountWei = ethers.parseEther(amount);

      toast.update(toastId, { render: 'Confirming donation in your wallet...' });

      const transaction = await contract.donateToCampaign(
        tokenAddress,
        campaignId,
        amountWei
      );

      toast.update(toastId, { render: 'Donation submitted. Waiting for confirmation...' });

      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Donation successful! Thank you for your support! 💝', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error donating to campaign:', err);
      
      let errorMessage = 'Failed to process donation';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw funds from campaign
  const withdrawFunds = async (campaignId: number, tokenAddress: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Withdrawing funds...');

    try {
      const contract = await getContract();

      toast.update(toastId, { render: 'Confirming withdrawal in your wallet...' });

      const transaction = await contract.withdrawFunds(
        tokenAddress,
        campaignId
      );

      toast.update(toastId, { render: 'Withdrawal submitted. Waiting for confirmation...' });

      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Funds withdrawn successfully! 💰', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error withdrawing funds:', err);
      
      let errorMessage = 'Failed to withdraw funds';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  //setToken allowed
  const setTokenAllowed = async (tokenAddress: string, allowed: boolean) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Updating token allowance...');

    try {
      const contract = await getContract();

      toast.update(toastId, { render: 'Confirming update in your wallet...' });

      const transaction = await contract.setAllowedToken(
        tokenAddress,
        allowed
      );

      toast.update(toastId, { render: 'Update submitted. Waiting for confirmation...' });

      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Token allowance updated successfully! ✅', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error updating token allowance:', err);
      
      let errorMessage = 'Failed to update token allowance';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a campaign
  const cancelCampaign = async (campaignId: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Cancelling campaign...');

    try {
      const contract = await getContract();

      toast.update(toastId, { render: 'Confirming cancellation in your wallet...' });

      const transaction = await contract.cancelCampaign(campaignId);

      toast.update(toastId, { render: 'Cancellation submitted. Waiting for confirmation...' });

      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Campaign cancelled successfully', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error cancelling campaign:', err);
      
      let errorMessage = 'Failed to cancel campaign';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refund donation
  const refundDonation = async (campaignId: number, tokenAddress: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    const toastId = toast.loading('Processing refund...');

    try {
      const contract = await getContract();

      toast.update(toastId, { render: 'Confirming refund in your wallet...' });

      const transaction = await contract.refundDonation(
        campaignId,
        tokenAddress
      );

      toast.update(toastId, { render: 'Refund submitted. Waiting for confirmation...' });

      const receipt = await transaction.wait();

      toast.update(toastId, { 
        render: 'Refund processed successfully! 🔄', 
        type: 'success', 
        isLoading: false,
        autoClose: 5000 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt
      };

    } catch (err: any) {
      console.error('Error processing refund:', err);
      
      let errorMessage = 'Failed to process refund';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, { 
        render: errorMessage, 
        type: 'error', 
        isLoading: false,
        autoClose: 5000 
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Read functions (no toasts for read operations)
  const getAllCampaigns = async (): Promise<Campaign[]> => {
    try {
      const contract = await getContract();
      const campaigns = await contract.getAllCampaigns();
      return campaigns;
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      throw err;
    }
  };

  //check role
  const hasRole = async (role: string): Promise<boolean> => {
  try {
    const contract = await getContract();
    const roleBytes = ethers.keccak256(ethers.toUtf8Bytes(role));
    const hasRole = await contract.hasRole(roleBytes, address);
    return hasRole;
  } catch (err) {
    console.error('Error checking role:', err);
    return false;
  }
};

  const getCampaignById = async (campaignId: number): Promise<Campaign> => {
    try {
      const contract = await getContract();
      const campaign = await contract.getCampaignById(campaignId);
      return campaign;
    } catch (err) {
      console.error('Error fetching campaign:', err);
      throw err;
    }
  };

  const getCampaignDonations = async (campaignId: number): Promise<Donation[]> => {
    try {
      const contract = await getContract();
      const donations = await contract.getCampaignDonations(campaignId);
      return donations;
    } catch (err) {
      console.error('Error fetching donations:', err);
      throw err;
    }
  };

  const isCampaignSuccessful = async (campaignId: number): Promise<boolean> => {
    try {
      const contract = await getContract();
      const isSuccessful = await contract.isCampaignSuccessful(campaignId);
      return isSuccessful;
    } catch (err) {
      console.error('Error checking campaign success:', err);
      throw err;
    }
  };

  const getCampaignFundsByToken = async (campaignId: number, tokenAddress: string): Promise<bigint> => {
    try {
      const contract = await getContract();
      const funds = await contract.getCampaignFundsByToken(campaignId, tokenAddress);
      return funds;
    } catch (err) {
      console.error('Error fetching campaign funds:', err);
      throw err;
    }
  };

  return {
    // Write functions
    createCampaign,
    donateToCampaign,
    withdrawFunds,
    cancelCampaign,
    refundDonation,
    setTokenAllowed,
    
    // Read functions
    getAllCampaigns,
    getCampaignById,
    getCampaignDonations,
    isCampaignSuccessful,
    getCampaignFundsByToken,
    hasRole,
    
    // State
    isLoading,
    isConnected
  };
}