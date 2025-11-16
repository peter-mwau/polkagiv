// hooks/useTokenConversion.ts
import { ethers } from 'ethers';
import { useTokenPrices } from './useTokenPrices';
import { TOKENS, TOKEN_BY_ADDRESS, TokenInfo } from '../../config/tokens';

export interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  usdValue: number;
  decimals: number;
  usdEquivalent: string;
}

export interface CampaignPortfolio {
  totalUSDValue: number;
  tokenBalances: TokenBalance[];
  progress: number;
  goalUSD: number;
  raisedUSD: number;
}

export function useTokenConversion() {
  // Build a deduplicated list of coingecko ids from configured tokens
  const COINGECKO_IDS = Array.from(
    new Set(
      Object.values(TOKENS)
        .map((t) => t.coingeckoId)
        .filter((id): id is string => !!id)
    )
  );

  const { prices, loading: pricesLoading, error: pricesError } = useTokenPrices(COINGECKO_IDS);

   const getTokenConfig = (tokenAddress?: string): TokenInfo & { address?: string } => {
    if (!tokenAddress) return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
    const info = TOKEN_BY_ADDRESS[tokenAddress.toLowerCase()];
    if (info) return info;
    return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18, address: tokenAddress };
  };

    const convertToUSD = (amount: string | bigint, tokenAddress: string): number => {
    if (!amount || !prices) return 0;

    try {
      const tokenConfig = getTokenConfig(tokenAddress);
      const formattedAmount = parseFloat(
        typeof amount === 'bigint'
          ? ethers.formatUnits(amount, tokenConfig.decimals)
          : ethers.formatUnits(amount as string, tokenConfig.decimals)
      );
      // Resolve token price with multiple fallbacks to avoid incorrect 1:1 USD assumptions
      let tokenPrice: number | undefined;

      if (tokenConfig.coingeckoId) {
        tokenPrice = prices[tokenConfig.coingeckoId]?.usd;
      }

      // Try symbol-based lookup (coingecko ids often match lowercase symbol)
      if (!tokenPrice && tokenConfig.symbol) {
        const bySymbol = prices[tokenConfig.symbol.toLowerCase()];
        if (bySymbol?.usd) tokenPrice = bySymbol.usd;
      }

      // Try to find a token in the canonical TOKENS list by symbol and use its coingecko id
      if (!tokenPrice && tokenConfig.symbol) {
        const match = Object.values(TOKENS).find(
          (t) => t.symbol.toLowerCase() === tokenConfig.symbol.toLowerCase()
        );
        if (match?.coingeckoId) tokenPrice = prices[match.coingeckoId]?.usd;
      }

      // If still undefined, return 0 to avoid displaying misleading USD values
      if (!tokenPrice) {
        return 0;
      }

      return formattedAmount * tokenPrice;
    } catch (error) {
      console.error('Error converting to USD:', error);
      return 0;
    }
  };

   const calculatePortfolioValue = async (
    campaignId: number,
    goalAmount: string, // USDC goal amount (6 decimals)
    getCampaignTokenBalances: (campaignId: number) => Promise<[string[], bigint[]]>
  ): Promise<CampaignPortfolio> => {
    try {
      const [tokenAddresses, balances] = await getCampaignTokenBalances(campaignId);
      
      let totalUSDValue = 0;
      const tokenBalances: TokenBalance[] = [];

      for (let i = 0; i < tokenAddresses.length; i++) {
        const tokenAddress = tokenAddresses[i];
        const balance = balances[i];
        if (!balance || balance === BigInt(0)) continue;

        // Resolve token config: try canonical mapping first, otherwise
        // attempt an on-chain lookup for symbol/decimals and match by symbol
        let tokenConfig = getTokenConfig(tokenAddress);
        if (!tokenConfig.coingeckoId) {
          try {
            // Try to read symbol/decimals from the token contract in the browser
            if (typeof window !== 'undefined' && (window as any).ethereum) {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const provider = new ethers.BrowserProvider((window as any).ethereum as any);
              const signerOrProvider = await provider.getSigner().catch(() => provider);
              /* eslint-enable @typescript-eslint/no-explicit-any */
              const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                  'function symbol() view returns (string)',
                  'function decimals() view returns (uint8)'
                ],
                signerOrProvider
              );

              const [onchainSymbol, onchainDecimals] = await Promise.all([
                tokenContract.symbol().catch(() => undefined),
                tokenContract.decimals().catch(() => undefined),
              ]);

              if (onchainSymbol) {
                // Try to find a matching token config by symbol
                const match = Object.values(TOKENS).find((t) => t.symbol === onchainSymbol);
                if (match) {
                  tokenConfig = { ...match, address: tokenAddress };
                } else {
                  tokenConfig = {
                    name: onchainSymbol,
                    symbol: onchainSymbol,
                    decimals: typeof onchainDecimals === 'number' ? onchainDecimals : tokenConfig.decimals,
                    address: tokenAddress,
                  } as TokenInfo & { address?: string };
                }
              }
            }
          } catch (e) {
            // Silent fallback; we'll continue with whatever tokenConfig we have
            console.warn('Failed to enrich token info on-chain for', tokenAddress, e);
          }
        }

        const usdValue = convertToUSD(balance, tokenConfig.address ?? tokenAddress);

        totalUSDValue += usdValue;

        tokenBalances.push({
          tokenAddress,
          symbol: tokenConfig.symbol,
          balance: balance.toString(),
          balanceFormatted: ethers.formatUnits(balance, tokenConfig.decimals),
          usdValue,
          decimals: tokenConfig.decimals,
          usdEquivalent: usdValue.toFixed(6),
        });
      }

      // Calculate progress
      const goalUSD = parseFloat(ethers.formatUnits(goalAmount, 6)); // USDC has 6 decimals
      const progress = goalUSD > 0 ? (totalUSDValue / goalUSD) * 100 : 0;

      return {
        totalUSDValue,
        tokenBalances,
        progress: Math.min(progress, 100),
        goalUSD,
        raisedUSD: totalUSDValue
      };
    } catch (error) {
      console.error('Error calculating portfolio:', error);
      return {
        totalUSDValue: 0,
        tokenBalances: [],
        progress: 0,
        goalUSD: parseFloat(ethers.formatUnits(goalAmount, 6)),
        raisedUSD: 0
      };
    }
  };

  // Convert any token amount to USDC equivalent
  const toUSDCEquivalent = (amount: string, tokenAddress: string): string => {
    const usdValue = convertToUSD(amount, tokenAddress);
    // Convert USD value back to USDC (1 USDC = 1 USD)
    return usdValue.toFixed(6); // USDC has 6 decimals
  };

  return {
    convertToUSD,
    calculatePortfolioValue,
    toUSDCEquivalent,
    getTokenConfig,
    prices,
    loading: pricesLoading,
    error: pricesError
  };
}