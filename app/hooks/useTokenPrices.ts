import { useState, useEffect } from 'react';

const COINGECKO_API = process.env.NEXT_PUBLIC_COINGECKO_API_URL;

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

export interface TokenPrices {
  [tokenId: string]: TokenPrice;
}

export function useTokenPrices(tokenIds: string[]) {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const ids = tokenIds.join(',');
        const response = await fetch(
          `${COINGECKO_API}?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }
        
        const data = await response.json();
        setPrices(data);
      } catch (err) {
        console.error('Error fetching token prices:', err);
        setError('Failed to fetch current prices');
        
        // Fallback to mock prices
        setPrices({
          'usd-coin': { usd: 1, usd_24h_change: 0, last_updated_at: Date.now() / 1000 },
          'weth': { usd: 3213, usd_24h_change: 2.5, last_updated_at: Date.now() / 1000 },
          'wrapped-bitcoin': { usd: 110464, usd_24h_change: 1.2, last_updated_at: Date.now() / 1000 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [tokenIds]);

  return { prices, loading, error };
}