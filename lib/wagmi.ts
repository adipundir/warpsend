"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  arcTestnet,
  supportedChains,
  hyperliquidEvmTestnet,
  seiTestnet,
  sonicTestnet,
  worldchainSepolia,
} from "./chains";
import {
  sepolia,
  baseSepolia,
  avalancheFuji,
} from "viem/chains";

// You should get your own project ID from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "WarpSend",
  projectId,
  chains: supportedChains,
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [hyperliquidEvmTestnet.id]: http("https://api.hyperliquid-testnet.xyz/evm"),
    [seiTestnet.id]: http("https://evm-rpc-testnet.sei-apis.com"),
    [sonicTestnet.id]: http("https://rpc.testnet.soniclabs.com"),
    [worldchainSepolia.id]: http("https://worldchain-sepolia.g.alchemy.com/public"),
  },
  ssr: true,
});
