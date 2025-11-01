import { createPublicClient, createWalletClient, http, parseEther, custom, type Transport } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { moonbaseAlpha } from 'viem/chains';
import DonorContractABI from "../../artifacts/DonorContract.json";

// Contract ABI - based on your deployed contract
export const donorContractABI = DonorContractABI.abi as const;

// Replace with your actual deployed contract address
export const DONOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DONOR_CONTRACT_ADDRESS as `0x${string}`;

// Create clients
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';

export const publicClient = createPublicClient({
  chain: moonbaseAlpha,
  transport: http(rpcUrl),
});

// Helper to create wallet client with private key
export const createWalletClientWithPK = (privateKey: string) => {
  if (!privateKey || typeof privateKey !== "string") {
    throw new Error("createWalletClientWithPK: privateKey is required");
  }
  // ensure 0x prefix required by viem types
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain: moonbaseAlpha,
    transport: http(rpcUrl),
  });
};

// Helper to create wallet client with browser provider (MetaMask)
export const createWalletClientWithProvider = () => {
  if (typeof window === 'undefined') {
    throw new Error('No Ethereum provider found (server)');
  }

  type EthereumProvider = {
    request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
  };

  const provider = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  if (!provider) throw new Error('No Ethereum provider found (window.ethereum missing)');

  return createWalletClient({
    chain: moonbaseAlpha,
    transport: custom(provider as unknown as Transport),
  });
};