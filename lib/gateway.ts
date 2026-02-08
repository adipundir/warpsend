import { pad, zeroAddress, maxUint256, type Hex } from "viem";
import {
  GATEWAY_WALLET_ADDRESS,
  GATEWAY_MINTER_ADDRESS,
  GATEWAY_DOMAINS,
  getChainInfo,
  getGasFee,
} from "./chains";
import { formatUSDCAmount } from "./contracts";

// Gateway API endpoints
const GATEWAY_API_TESTNET = "https://gateway-api-testnet.circle.com/v1";

// EIP-712 Domain and Types for Gateway burn intents
export const EIP712_DOMAIN = { name: "GatewayWallet", version: "1" };

export const EIP712_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
  ],
  TransferSpec: [
    { name: "version", type: "uint32" },
    { name: "sourceDomain", type: "uint32" },
    { name: "destinationDomain", type: "uint32" },
    { name: "sourceContract", type: "bytes32" },
    { name: "destinationContract", type: "bytes32" },
    { name: "sourceToken", type: "bytes32" },
    { name: "destinationToken", type: "bytes32" },
    { name: "sourceDepositor", type: "bytes32" },
    { name: "destinationRecipient", type: "bytes32" },
    { name: "sourceSigner", type: "bytes32" },
    { name: "destinationCaller", type: "bytes32" },
    { name: "value", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "hookData", type: "bytes" },
  ],
  BurnIntent: [
    { name: "maxBlockHeight", type: "uint256" },
    { name: "maxFee", type: "uint256" },
    { name: "spec", type: "TransferSpec" },
  ],
} as const;

// Gateway Wallet ABI (for deposits)
export const GATEWAY_WALLET_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "token", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Gateway Minter ABI (for receiving transfers)
export const GATEWAY_MINTER_ABI = [
  {
    type: "function",
    name: "gatewayMint",
    inputs: [
      { name: "attestationPayload", type: "bytes" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Convert address to bytes32 format
export function addressToBytes32(address: string): Hex {
  return pad(address.toLowerCase() as Hex, { size: 32 });
}

// Calculate the recommended maxFee for a Gateway transfer
// Based on Circle's fee structure: https://developers.circle.com/gateway/references/fees
// Formula: maxFee ≥ gas fee + (amount × 0.00005)
// - Transfer fee: 0.005% (0.5 basis points) on crosschain transfers
// - Gas fee: varies by source chain ($0.001 to $2.00)
export function calculateMaxFee(amountInSmallestUnits: bigint, sourceChainId?: number): bigint {
  const transferFee = amountInSmallestUnits / 20000n; // 0.005% = 1/20000
  const gasFee = sourceChainId ? getGasFee(sourceChainId) : 100000n; // Use chain-specific or $0.10 default
  // Add 20% buffer for gas fluctuations
  const gasWithBuffer = (gasFee * 120n) / 100n;
  return transferFee + gasWithBuffer;
}

// Generate random salt for burn intent
function generateSalt(): Hex {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as Hex;
}

// Create burn intent for cross-chain transfer
export interface CreateBurnIntentParams {
  sourceChainId: number;
  destinationChainId: number;
  depositorAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  amount: string;
  maxFee?: bigint;
}

export function createBurnIntent(params: CreateBurnIntentParams) {
  const {
    sourceChainId,
    destinationChainId,
    depositorAddress,
    recipientAddress,
    amount,
    maxFee,
  } = params;

  const sourceInfo = getChainInfo(sourceChainId);
  const destInfo = getChainInfo(destinationChainId);

  if (sourceInfo.domain === undefined || destInfo.domain === undefined) {
    throw new Error("Gateway not supported on one of the chains");
  }

  const amountBigInt = formatUSDCAmount(amount);
  
  // Calculate maxFee if not provided using Circle's fee formula (chain-specific gas + 0.005% transfer fee)
  const calculatedMaxFee = maxFee ?? calculateMaxFee(amountBigInt, sourceChainId);

  return {
    maxBlockHeight: maxUint256,
    maxFee: calculatedMaxFee,
    spec: {
      version: 1,
      sourceDomain: sourceInfo.domain,
      destinationDomain: destInfo.domain,
      sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
      destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
      sourceToken: addressToBytes32(sourceInfo.usdcAddress!),
      destinationToken: addressToBytes32(destInfo.usdcAddress!),
      sourceDepositor: addressToBytes32(depositorAddress),
      destinationRecipient: addressToBytes32(recipientAddress),
      sourceSigner: addressToBytes32(depositorAddress),
      destinationCaller: addressToBytes32(zeroAddress),
      value: amountBigInt,
      salt: generateSalt(),
      hookData: "0x" as Hex,
    },
  };
}

// Create typed data for EIP-712 signing
export function createBurnIntentTypedData(burnIntent: ReturnType<typeof createBurnIntent>) {
  return {
    types: EIP712_TYPES,
    domain: EIP712_DOMAIN,
    primaryType: "BurnIntent" as const,
    message: burnIntent,
  };
}

// Gateway API response types
export interface GatewayTransferResponse {
  attestation?: string;
  signature?: string;
  error?: string;
}

export interface GatewayBalanceResponse {
  balances: Array<{
    domain: number;
    depositor?: string;
    balance: string; // USDC amount as string, e.g. "9.998950"
  }>;
}

// Request attestation from Gateway API (Circle docs: POST /v1/transfer, 201 = success)
// Request: array of { burnIntent: BurnIntent, signature: string }; BurnIntent uses Uint256 as string, Bytes32 as 0x+64 hex
export async function requestGatewayTransfer(
  burnIntents: Array<{
    burnIntent: ReturnType<typeof createBurnIntent>;
    signature: string;
  }>
): Promise<GatewayTransferResponse> {
  const body = JSON.stringify(burnIntents, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
  const response = await fetch(`${GATEWAY_API_TESTNET}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = (json as { error?: string; message?: string }).error ?? (json as { message?: string }).message ?? response.statusText;
    throw new Error(`Gateway API error: ${response.status} ${msg}`);
  }
  if ((json as { error?: string }).error) {
    throw new Error((json as { error: string }).error);
  }
  return json as GatewayTransferResponse;
}

// Get Gateway balances for an address
export async function getGatewayBalances(
  depositorAddress: string
): Promise<GatewayBalanceResponse> {
  const domains = Object.values(GATEWAY_DOMAINS);

  const body = {
    token: "USDC",
    sources: domains.map((domain) => ({
      domain,
      depositor: depositorAddress,
    })),
  };

  const response = await fetch(`${GATEWAY_API_TESTNET}/balances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gateway API error: ${response.status} ${text}`);
  }

  return response.json();
}

// Get deposit params for Gateway Wallet
export function getGatewayDepositParams(
  usdcAddress: `0x${string}`,
  amount: bigint
) {
  return {
    address: GATEWAY_WALLET_ADDRESS,
    abi: GATEWAY_WALLET_ABI,
    functionName: "deposit" as const,
    args: [usdcAddress, amount] as const,
  };
}

// Get mint params for receiving transfers
export function getGatewayMintParams(
  attestation: `0x${string}`,
  signature: `0x${string}`
) {
  return {
    address: GATEWAY_MINTER_ADDRESS,
    abi: GATEWAY_MINTER_ABI,
    functionName: "gatewayMint" as const,
    args: [attestation, signature] as const,
  };
}
