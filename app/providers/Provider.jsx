"use client";

import PropTypes from "prop-types";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import {
  sepolia,
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  skaleTitanTestnet,
} from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { moonbaseAlpha } from "viem/chains";

export default function Providers({ children }) {
  const config = getDefaultConfig({
    appName: "Polkagiv",
    projectId: "1e91e33eb8db73af7f34de8d02fb03f1",
    chains: [
      sepolia,
      mainnet,
      polygon,
      optimism,
      arbitrum,
      base,
      skaleTitanTestnet,
      moonbaseAlpha,
    ],
    ssr: true,
  });

  const queryClient = new QueryClient();

  Providers.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#fafafa",
            accentColorForeground: "#0c1321",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
