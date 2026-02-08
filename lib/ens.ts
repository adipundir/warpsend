import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress, normalize } from "viem/ens";
import type { Address } from "viem";

// ENS lives on Ethereum mainnet; use a public client for resolution only
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Returns true if the input looks like an ENS name (contains a dot, doesn't start with 0x).
 */
export function looksLikeEnsName(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length > 0 && !trimmed.startsWith("0x") && trimmed.includes(".");
}

/**
 * Resolve an ENS name to an Ethereum address using viem (UTS-46 normalization + mainnet resolver).
 * Returns null if the name doesn't resolve or on error.
 */
export async function resolveEnsToAddress(name: string): Promise<Address | null> {
  const trimmed = name.trim();
  if (!trimmed || !looksLikeEnsName(trimmed)) return null;
  try {
    const normalized = normalize(trimmed);
    const address = await getEnsAddress(ensClient, { name: normalized });
    return address;
  } catch {
    return null;
  }
}
