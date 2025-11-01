import { useState } from 'react';
import { parseEther } from 'viem';
import { useWallet } from '../contexts/WalletContext';
import { 
  donorContractABI, 
  DONOR_CONTRACT_ADDRESS, 
  createWalletClientWithPK,
  createWalletClientWithProvider,
  publicClient
} from '../lib/contract';

export type CampaignData = {
  name: string;
  description: string;
  goalAmount: string;
  durationInDays: number;
};

export function useCampaign() {
  const { address, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = async (campaignData: CampaignData) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      let walletClient;
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      console.log('Wallet connection details:', {
        isConnected,
        address,
        hasPrivateKey: !!privateKey,
        hasWindowEthereum: typeof window !== 'undefined' && !!(window as any).ethereum
      });

      // Use browser provider if available (MetaMask/other wallet)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        console.log('Using browser wallet provider');
        walletClient = createWalletClientWithProvider();
        
        // For browser wallets, we need to get the account from the connected wallet
        const [account] = await walletClient.getAddresses();
        if (!account) {
          throw new Error('No account found in connected wallet');
        }
      } 
      // Fall back to private key if no browser wallet
      else if (privateKey) {
        console.log('Using private key wallet');
        walletClient = createWalletClientWithPK(privateKey);
      } else {
        throw new Error('No wallet provider available. Please install MetaMask or set a private key.');
      }

      // Convert ETH amount to wei
      const goalAmountWei = parseEther(campaignData.goalAmount);

      console.log('Creating campaign with data:', {
        name: campaignData.name,
        description: campaignData.description,
        goalAmount: campaignData.goalAmount,
        goalAmountWei: goalAmountWei.toString(),
        durationInDays: campaignData.durationInDays,
        contractAddress: DONOR_CONTRACT_ADDRESS
      });

      // Normalize connected address and always pass it as the `account` override.
      // Supplying account explicitly satisfies viem's typing even if the client
      // already has an attached account (private-key clients).
      const account = (address.startsWith("0x") ? address : `0x${address}`) as `0x${string}`;

      const hash = await walletClient.writeContract({
        account,
        address: DONOR_CONTRACT_ADDRESS,
        abi: donorContractABI,
        functionName: 'createCampaign',
        args: [
          campaignData.name,
          campaignData.description,
          goalAmountWei,
          BigInt(campaignData.durationInDays),
        ],
      });

      console.log('Transaction submitted:', hash);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log('Transaction confirmed:', receipt);

      if (receipt.status === 'success') {
        return {
          success: true,
          transactionHash: hash,
          receipt
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (err: unknown) {
      console.error('Error creating campaign:', err);

      // Provide more user-friendly error messages
      let errorMessage = 'Failed to create campaign';
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('no signer available')) {
          errorMessage = 'Wallet not properly connected. Please check your wallet connection.';
        } else if (msg.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.';
        } else {
          errorMessage = msg;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllCampaigns = async () => {
    try {
      const campaigns = await publicClient.readContract({
        address: DONOR_CONTRACT_ADDRESS,
        abi: donorContractABI,
        functionName: 'getAllCampaigns',
      });
      return campaigns;
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      throw err;
    }
  };

  return {
    createCampaign,
    getAllCampaigns,
    isLoading,
    error,
    isConnected
  };
}