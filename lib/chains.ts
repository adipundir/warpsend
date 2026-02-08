import { defineChain } from "viem";
import {
  sepolia,
  baseSepolia,
  avalancheFuji,
} from "viem/chains";

// Arc Testnet custom chain definition
// MetaMask requires nativeCurrency.decimals to be 18 for wallet_addEthereumChain
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// HyperEVM Testnet
export const hyperliquidEvmTestnet = defineChain({
  id: 998,
  name: "HyperEVM Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HYPE",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://api.hyperliquid-testnet.xyz/evm"],
    },
  },
  blockExplorers: {
    default: { name: "Purrsec", url: "https://testnet.purrsec.com" },
  },
  testnet: true,
});

// Sei Testnet (Atlantic-2)
export const seiTestnet = defineChain({
  id: 1328,
  name: "Sei Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "SEI",
    symbol: "SEI",
  },
  rpcUrls: {
    default: {
      http: ["https://evm-rpc-testnet.sei-apis.com"],
    },
  },
  blockExplorers: {
    default: { name: "SeiTrace", url: "https://seitrace.com/?chain=atlantic-2" },
  },
  testnet: true,
});

// Sonic Testnet
export const sonicTestnet = defineChain({
  id: 64165,
  name: "Sonic Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "S",
    symbol: "S",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.soniclabs.com"],
    },
  },
  blockExplorers: {
    default: { name: "Sonic Testnet", url: "https://testnet.soniclabs.com" },
  },
  testnet: true,
});

// World Chain Sepolia
export const worldchainSepolia = defineChain({
  id: 4801,
  name: "World Chain Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: { name: "WorldScan", url: "https://sepolia.worldscan.org" },
  },
  testnet: true,
});

// Export all supported chains (Gateway supported testnets)
export const supportedChains = [
  arcTestnet,
  sepolia,
  baseSepolia,
  avalancheFuji,
  hyperliquidEvmTestnet,
  seiTestnet,
  sonicTestnet,
  worldchainSepolia,
] as const;

// Gateway domain identifiers (same as CCTP domains)
export const GATEWAY_DOMAINS: Record<number, number> = {
  [sepolia.id]: 0, // Ethereum Sepolia
  [avalancheFuji.id]: 1, // Avalanche Fuji
  [baseSepolia.id]: 6, // Base Sepolia
  [sonicTestnet.id]: 13, // Sonic Testnet
  [worldchainSepolia.id]: 14, // World Chain Sepolia
  [hyperliquidEvmTestnet.id]: 19, // HyperEVM Testnet
  [seiTestnet.id]: 16, // Sei Testnet
  [arcTestnet.id]: 26, // Arc Testnet
};

// USDC Token addresses per chain (testnet)
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [avalancheFuji.id]: "0x5425890298aed601595a70ab815c96711a31bc65",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [sonicTestnet.id]: "0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51",
  [worldchainSepolia.id]: "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88",
  [hyperliquidEvmTestnet.id]: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
  [seiTestnet.id]: "0x4fCF1784B31630811181f670Aea7A7bEF803eaED",
  [arcTestnet.id]: "0x3600000000000000000000000000000000000000",
};

// Gateway Contract Addresses (same across all chains)
export const GATEWAY_WALLET_ADDRESS: `0x${string}` =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

export const GATEWAY_MINTER_ADDRESS: `0x${string}` =
  "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";

// Average time to attestation per chain
export const ATTESTATION_TIMES: Record<number, string> = {
  [arcTestnet.id]: "~0.5 seconds",
  [avalancheFuji.id]: "~8 seconds",
  [seiTestnet.id]: "~5 seconds",
  [sonicTestnet.id]: "~8 seconds",
  [hyperliquidEvmTestnet.id]: "~5 seconds",
  [sepolia.id]: "~13-19 minutes",
  [baseSepolia.id]: "~13-19 minutes",
  [worldchainSepolia.id]: "~13-19 minutes",
};

// Gas fees per chain (in USDC with 6 decimals) - from Circle docs
// https://developers.circle.com/gateway/references/fees
export const GAS_FEES: Record<number, bigint> = {
  [arcTestnet.id]: 10000n,           // $0.01 (estimated, not in docs)
  [avalancheFuji.id]: 20000n,        // $0.02
  [seiTestnet.id]: 1000n,            // $0.001
  [sonicTestnet.id]: 10000n,         // $0.01
  [hyperliquidEvmTestnet.id]: 50000n,// $0.05
  [sepolia.id]: 2000000n,            // $2.00 (Ethereum is expensive)
  [baseSepolia.id]: 10000n,          // $0.01
  [worldchainSepolia.id]: 10000n,    // $0.01
};

// Get gas fee for a chain (with small buffer)
export function getGasFee(chainId: number): bigint {
  return GAS_FEES[chainId] ?? 100000n; // Default $0.10 if unknown
}

// Helper to get chain info
export function getChainInfo(chainId: number) {
  const chain = supportedChains.find((c) => c.id === chainId);
  return {
    chain,
    domain: GATEWAY_DOMAINS[chainId],
    usdcAddress: USDC_ADDRESSES[chainId],
    attestationTime: ATTESTATION_TIMES[chainId] || "Unknown",
  };
}

// Check if cross-chain transfer is needed
export function isCrossChainTransfer(
  sourceChainId: number,
  destChainId: number
): boolean {
  return sourceChainId !== destChainId;
}

// Check if Gateway is supported on this chain
export function isGatewaySupported(chainId: number): boolean {
  return GATEWAY_DOMAINS[chainId] !== undefined;
}

// Get chainId for a Gateway domain (for picking source chain from balance)
export function getChainIdByDomain(domain: number): number | undefined {
  const entry = Object.entries(GATEWAY_DOMAINS).find(([, d]) => d === domain);
  return entry ? Number(entry[0]) : undefined;
}

// Chain icon URLs (local assets in public/logos take precedence)
export function getChainIconUrl(chainId: number): string {
  return `https://explorer-api.walletconnect.com/v3/logo?chainId=eip155:${chainId}`;
}
export const CHAIN_ICON_URLS: Record<number, string> = {
  [arcTestnet.id]: "/logos/arc.png",
  [sepolia.id]: "/logos/eth.svg",
  [baseSepolia.id]: "/logos/base.png",
  [avalancheFuji.id]: "/logos/evalanche.png",
  [sonicTestnet.id]: "/logos/sonic.png",
  [worldchainSepolia.id]: "/logos/world.png",
  [hyperliquidEvmTestnet.id]: "/logos/hyperevm.png",
  [seiTestnet.id]: "/logos/sei.png",
};
