"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/modal";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  supportedChains,
  USDC_ADDRESSES,
  GATEWAY_DOMAINS,
  GATEWAY_WALLET_ADDRESS,
  arcTestnet,
  getChainInfo,
  CHAIN_ICON_URLS,
  getChainIconUrl,
} from "@/lib/chains";
import { ERC20_ABI, formatUSDCAmount, parseUSDCAmount } from "@/lib/contracts";
import { getGatewayBalances, GATEWAY_WALLET_ABI } from "@/lib/gateway";

interface ChainBalance {
  chainId: number;
  chainName: string;
  domain: number;
  walletBalance: string;
  gatewayBalance: string;
}

type UnifiedBalanceVariant = "full" | "summary";

export function UnifiedBalance({
  variant = "full",
  depositModalOpen: controlledDepositOpen,
  onDepositModalOpenChange,
}: {
  variant?: UnifiedBalanceVariant;
  depositModalOpen?: boolean;
  onDepositModalOpenChange?: (open: boolean) => void;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [unifiedBalance, setUnifiedBalance] = useState<string>("0");
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedDepositChain, setSelectedDepositChain] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [internalDepositOpen, setInternalDepositOpen] = useState(false);

  const isControlled = controlledDepositOpen !== undefined && onDepositModalOpenChange;
  const depositModalOpen = isControlled ? controlledDepositOpen : internalDepositOpen;
  const setDepositModalOpen = isControlled ? (open: boolean) => onDepositModalOpenChange?.(open) : setInternalDepositOpen;

  const currentChain = supportedChains.find((c) => c.id === chainId);
  const effectiveDepositChainIdRaw = selectedDepositChain ? parseInt(selectedDepositChain, 10) : (chainId ?? arcTestnet.id);
  const depositChainId = Number.isNaN(effectiveDepositChainIdRaw) ? (chainId ?? arcTestnet.id) : effectiveDepositChainIdRaw;
  const depositChainInfo = getChainInfo(depositChainId);
  const usdcAddress = USDC_ADDRESSES[depositChainId];

  // Keep deposit selection in sync with connected chain when user switches
  useEffect(() => {
    if (chainId != null) setSelectedDepositChain(chainId.toString());
  }, [chainId]);

  // Read wallet USDC balance for connected chain (header/summary)
  const { data: walletBalance, refetch: refetchWalletBalance } = useReadContract({
    address: USDC_ADDRESSES[chainId],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESSES[chainId],
    },
  });

  // Read wallet USDC balance for selected deposit chain (so we can show it without requiring a chain switch)
  const { data: selectedChainBalance, isPending: isSelectedChainBalancePending } = useReadContract({
    address: USDC_ADDRESSES[depositChainId],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: depositChainId,
    query: {
      enabled: !!address && !!USDC_ADDRESSES[depositChainId] && !Number.isNaN(depositChainId),
    },
  });


  const { writeContractAsync } = useWriteContract();

  // Fetch unified balance from Gateway API
  const fetchUnifiedBalance = useCallback(async () => {
    if (!address) return;

    setIsLoadingBalances(true);
    try {
      const response = await getGatewayBalances(address);

      let total = 0;
      const balances: ChainBalance[] = [];

      for (const chain of supportedChains) {
        const domain = GATEWAY_DOMAINS[chain.id];
        if (domain === undefined) continue;

        const gatewayBal = response.balances.find((b) => Number(b.domain) === domain);
        const gatewayAmount = gatewayBal ? parseFloat(String(gatewayBal.balance)) : 0;
        total += gatewayAmount;

        balances.push({
          chainId: chain.id,
          chainName: chain.name,
          domain,
          walletBalance: "0", // Will be fetched separately
          gatewayBalance: gatewayAmount.toFixed(6),
        });
      }

      setUnifiedBalance(total.toFixed(6));
      setChainBalances(balances);
    } catch (error) {
      console.error("Error fetching Gateway balances:", error);
      toast.error("Failed to fetch unified balance");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address]);

  // Fetch balances on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchUnifiedBalance();
    }
  }, [address, fetchUnifiedBalance]);

  // Refresh balance when a send or deposit completes (other components dispatch this event)
  useEffect(() => {
    const onBalanceChanged = () => {
      if (address) {
        fetchUnifiedBalance();
        refetchWalletBalance();
      }
    };
    window.addEventListener("warpsend-balance-changed", onBalanceChanged);
    return () => window.removeEventListener("warpsend-balance-changed", onBalanceChanged);
  }, [address, fetchUnifiedBalance, refetchWalletBalance]);

  // Handle deposit to Gateway
  const handleDeposit = async () => {
    if (!address || !depositAmount || !publicClient) {
      toast.error("Please enter an amount");
      return;
    }

    const amountBigInt = formatUSDCAmount(depositAmount);

    // Check if we need to switch chains
    if (chainId !== depositChainId) {
      try {
        await switchChain({ chainId: depositChainId });
        // Wait for chain switch
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch {
        toast.error("Failed to switch chain");
        return;
      }
    }

    setIsDepositing(true);
    try {
      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [GATEWAY_WALLET_ADDRESS, amountBigInt],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      const depositHash = await writeContractAsync({
        address: GATEWAY_WALLET_ADDRESS,
        abi: GATEWAY_WALLET_ABI,
        functionName: "deposit",
        args: [usdcAddress, amountBigInt],
      });

      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      toast.success(`Deposited ${depositAmount} USDC to Gateway`);

      setDepositAmount("");
      setDepositModalOpen(false);
      refetchWalletBalance();

      // Refresh balance now and again after attestation
      fetchUnifiedBalance();
      setTimeout(() => {
        fetchUnifiedBalance();
      }, 5000);
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error(error instanceof Error ? error.message : "Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  const formattedWalletBalance = walletBalance ? parseUSDCAmount(walletBalance) : "0";
  // In modal, show balance for the selected deposit chain (read via chainId in useReadContract — no switch needed)
  const modalWalletBalance =
    selectedChainBalance != null ? parseUSDCAmount(selectedChainBalance) : "0";
  const modalWalletBalanceNum = parseFloat(modalWalletBalance);

  // Show all gateway chains (with 0 balance) before first fetch; Arc Testnet first
  const displayChainBalances = (
    chainBalances.length > 0
      ? chainBalances
      : supportedChains
        .filter((c) => GATEWAY_DOMAINS[c.id] !== undefined)
        .map((c) => ({
          chainId: c.id,
          chainName: c.name,
          domain: GATEWAY_DOMAINS[c.id],
          walletBalance: "0",
          gatewayBalance: "0.000000",
        }))
  ).sort((a, b) => (a.chainId === arcTestnet.id ? -1 : b.chainId === arcTestnet.id ? 1 : 0));

  if (!isConnected) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl border border-border/60 bg-card/50">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1">Connect your wallet</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">Connect to view your unified balance and send USDC across chains.</p>
      </div>
    );
  }

  const connectedChainUsdcAddress = chainId !== undefined ? USDC_ADDRESSES[chainId] : undefined;
  const connectedChainWalletBalanceStr =
    walletBalance !== undefined && connectedChainUsdcAddress
      ? parseUSDCAmount(walletBalance)
      : null;
  const connectedChain = currentChain;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Gateway unified balance</h2>
          <p className="text-base font-medium text-muted-foreground">Total USDC across all chains</p>
        </div>
        {connectedChainUsdcAddress && connectedChain && (
          <div className="rounded-xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-4 flex items-center gap-3 shrink-0 min-w-[160px]">
            <div className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center overflow-hidden shrink-0">
              {(CHAIN_ICON_URLS[chainId] ?? getChainIconUrl(chainId)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={CHAIN_ICON_URLS[chainId] ?? getChainIconUrl(chainId)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">
                  {connectedChain.name?.charAt(0) ?? "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {connectedChain.name}
              </p>
              <p className="text-base font-mono font-semibold tabular-nums whitespace-nowrap">
                {connectedChainWalletBalanceStr ?? "—"} USDC
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main balance display */}
      <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
        <p className="text-sm font-medium text-muted-foreground mb-2">Available to send</p>
        {isLoadingBalances ? (
          <div className="h-14 md:h-16 w-48 mx-auto rounded-xl shimmer mb-2" />
        ) : (
          <p className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums mb-2">
            {unifiedBalance}
          </p>
        )}
        <p className="text-lg text-muted-foreground font-medium">USDC</p>
        {!isControlled && (
          <Button
            className="mt-5 h-12 rounded-xl px-6 text-sm font-semibold w-full max-w-xs mx-auto"
            onClick={() => setDepositModalOpen(true)}
          >
            Deposit into Gateway
          </Button>
        )}
      </div>

      {/* Per-chain balance cards - only when variant is full */}
      {variant === "full" && displayChainBalances.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Balance by chain</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayChainBalances.map((cb) => {
              const iconUrl = CHAIN_ICON_URLS[cb.chainId] ?? getChainIconUrl(cb.chainId);
              return (
                <div
                  key={cb.chainId}
                  className="glass-card card-hover rounded-2xl p-5 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center overflow-hidden shrink-0">
                    {iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={iconUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-semibold text-muted-foreground">
                        {cb.chainName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate w-full">{cb.chainName}</p>
                  {isLoadingBalances ? (
                    <div className="h-5 w-20 rounded shimmer" />
                  ) : (
                    <p className="text-base font-mono font-semibold tabular-nums">
                      {cb.gatewayBalance}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={depositModalOpen} onClose={() => setDepositModalOpen(false)}>
        <div className="space-y-5">
          {/* Wallet balance for selected chain */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Wallet balance on {depositChainInfo.chain?.name ?? "selected chain"}</p>
              <p className="text-2xl font-bold tabular-nums">
                {isSelectedChainBalancePending ? "…" : `${modalWalletBalance} USDC`}
              </p>
              {depositChainId !== chainId && (
                <p className="text-xs text-muted-foreground mt-1">
                  You’ll switch to {depositChainInfo.chain?.name} when you confirm deposit
                </p>
              )}
            </div>
            <Badge variant="secondary" className="rounded-lg px-3 py-1">{depositChainInfo.chain?.name ?? "—"}</Badge>
          </div>

          {/* Source chain: grid of cards */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source chain</Label>
            <div className="grid grid-cols-2 gap-2">
              {[...supportedChains]
                .sort((a, b) => (a.id === arcTestnet.id ? -1 : b.id === arcTestnet.id ? 1 : 0))
                .map((chain) => {
                  const info = getChainInfo(chain.id);
                  const iconUrl = CHAIN_ICON_URLS[chain.id] ?? getChainIconUrl(chain.id);
                  const isSelected = (selectedDepositChain || chainId?.toString() || arcTestnet.id.toString()) === chain.id.toString();
                  const isCurrent = chain.id === chainId;
                  return (
                    <button
                      key={chain.id}
                      type="button"
                      disabled={isDepositing}
                      onClick={() => setSelectedDepositChain(chain.id.toString())}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all min-h-[56px] ${isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                        : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                        }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center overflow-hidden shrink-0">
                        {iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-muted-foreground">
                            {chain.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1 flex-wrap">
                          {chain.name}
                          {isCurrent && (
                            <span className="text-xs text-muted-foreground font-normal">(current)</span>
                          )}
                        </p>
                        {info?.attestationTime && (
                          <p className="text-xs text-muted-foreground">
                            {info.attestationTime}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Amount with 25% 50% Max */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount-modal" className="text-sm font-medium">Amount (USDC)</Label>
            <Input
              id="deposit-amount-modal"
              type="number"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isDepositing}
              min="0"
              step="0.01"
              className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 text-lg font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() =>
                  setDepositAmount(
                    (modalWalletBalanceNum * 0.25).toFixed(6)
                  )
                }
                disabled={isDepositing || modalWalletBalanceNum <= 0}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() =>
                  setDepositAmount(
                    (modalWalletBalanceNum * 0.5).toFixed(6)
                  )
                }
                disabled={isDepositing || modalWalletBalanceNum <= 0}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setDepositAmount(modalWalletBalance)}
                disabled={isDepositing || modalWalletBalanceNum <= 0}
              >
                Max
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-14 rounded-xl text-base font-semibold"
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
          >
            {isDepositing ? "Depositing..." : "Deposit to Gateway"}
          </Button>

          {chainId !== depositChainId && (
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll be prompted to switch to {depositChainInfo.chain?.name}
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Need testnet USDC?{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Circle Faucet
            </a>
          </p>
        </div>
      </Modal>
    </div>
  );
}
