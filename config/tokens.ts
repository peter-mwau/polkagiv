export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  address?: string; // env var may be undefined
  coingeckoId?: string;
};

export const TOKENS: Record<string, TokenInfo> = {
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
    coingeckoId: "usd-coin",
  },
  WETH: {
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    address: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS,
    coingeckoId: "weth",
  },
  WBTC: {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    address: process.env.NEXT_PUBLIC_WBTC_CONTRACT_ADDRESS,
    coingeckoId: "wrapped-bitcoin",
  },
};

// convenient helpers
export const TOKENS_ARRAY = Object.values(TOKENS);
export const TOKEN_ADDRESSES: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(TOKENS).map(([k, v]) => [k, v.address])
);

export const TOKEN_BY_ADDRESS: Record<string, TokenInfo> = Object.values(TOKENS)
  .filter((t) => !!t.address)
  .reduce((acc, t) => {
    acc[t.address!.toLowerCase()] = t;
    return acc;
  }, {} as Record<string, TokenInfo>);