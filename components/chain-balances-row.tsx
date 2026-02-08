"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { supportedChains, USDC_ADDRESSES, CHAIN_ICON_URLS, getChainIconUrl } from "@/lib/chains";
import { ERC20_ABI, parseUSDCAmount } from "@/lib/contracts";

export function ChainBalancesRow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const usdcAddress = chainId !== undefined ? USDC_ADDRESSES[chainId] : undefined;
  const { data: walletBalance, refetch: refetchWalletBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  useEffect(() => {
    const onBalanceChanged = () => refetchWalletBalance();
    window.addEventListener("warpsend-balance-changed", onBalanceChanged);
    return () => window.removeEventListener("warpsend-balance-changed", onBalanceChanged);
  }, [refetchWalletBalance]);

  if (!isConnected || chainId === undefined) {
    return null;
  }

  const chain = supportedChains.find((c) => c.id === chainId);
  if (!usdcAddress) {
    return (
      <section className="w-full">
        <p className="text-sm text-muted-foreground">
          USDC is not available on {chain?.name ?? "this chain"}.
        </p>
      </section>
    );
  }

  const balanceStr =
    walletBalance !== undefined ? parseUSDCAmount(walletBalance) : "—";
  const iconUrl = CHAIN_ICON_URLS[chainId] ?? getChainIconUrl(chainId);

  return (
    <section className="w-full">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">USDC on connected chain</h2>
      <div className="rounded-xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-4 flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center overflow-hidden shrink-0">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {chain?.name?.charAt(0) ?? "?"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {chain?.name ?? `Chain ${chainId}`}
          </p>
          <p className="text-lg font-mono font-semibold tabular-nums truncate">
            {balanceStr} USDC
          </p>
        </div>
      </div>
    </section>
  );
}
