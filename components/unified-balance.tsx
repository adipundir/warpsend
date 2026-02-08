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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function UnifiedBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [unifiedBalance, setUnifiedBalance] = useState<string>("0");
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedDepositChain, setSelectedDepositChain] = useState<string>(arcTestnet.id.toString());
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const currentChain = supportedChains.find((c) => c.id === chainId);
  const depositChainId = parseInt(selectedDepositChain);
  const depositChainInfo = getChainInfo(depositChainId);
  const usdcAddress = USDC_ADDRESSES[depositChainId];

  // Read wallet USDC balance for connected chain
  const { data: walletBalance, refetch: refetchWalletBalance } = useReadContract({
    address: USDC_ADDRESSES[chainId],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESSES[chainId],
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

        const gatewayBal = response.balances.find((b) => b.domain === domain);
        const gatewayAmount = gatewayBal ? parseFloat(gatewayBal.balance) : 0;
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
      if (address) fetchUnifiedBalance();
    };
    window.addEventListener("warpsend-balance-changed", onBalanceChanged);
    return () => window.removeEventListener("warpsend-balance-changed", onBalanceChanged);
  }, [address, fetchUnifiedBalance]);

  // Handle deposit to Gateway
  const handleDeposit = async () => {
    if (!address || !depositAmount || !publicClient) {
      toast.error("Please enter an amount");
      return;
    }

    const amountBigInt = formatUSDCAmount(depositAmount);

    // Check if we need to switch chains
    if (chainId !== depositChainId) {
      toast.info(`Switching to ${depositChainInfo.chain?.name}...`);
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
      // Step 1: Approve Gateway Wallet
      toast.info("Approving USDC for Gateway deposit...");

      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [GATEWAY_WALLET_ADDRESS, amountBigInt],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      toast.success("Approved!");

      // Step 2: Deposit to Gateway Wallet
      toast.info("Depositing to Gateway...");

      const depositHash = await writeContractAsync({
        address: GATEWAY_WALLET_ADDRESS,
        abi: GATEWAY_WALLET_ABI,
        functionName: "deposit",
        args: [usdcAddress, amountBigInt],
      });

      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      
      toast.success(`Deposited ${depositAmount} USDC to Gateway!`);
      toast.info(`Waiting for attestation (${depositChainInfo.attestationTime})...`);

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
  // In modal, use connected chain balance when selected chain matches; otherwise 0 (switch to see balance)
  const modalWalletBalance =
    depositChainId === chainId ? formattedWalletBalance : "0";
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
      <div className="text-center py-8">
        <p className="text-muted-foreground">Connect your wallet to view your balance</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Gateway unified balance</h2>
        <p className="text-sm text-muted-foreground">Total USDC across all chains</p>
      </div>
      
      {/* Main balance display */}
      <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
        <p className="text-sm font-medium text-muted-foreground mb-2">Available to send</p>
        <p className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums mb-2">
          {isLoadingBalances ? "..." : unifiedBalance}
        </p>
        <p className="text-lg text-muted-foreground font-medium">USDC</p>
        <Button
          className="mt-5 rounded-xl px-6 py-5 text-sm font-semibold"
          onClick={() => setDepositModalOpen(true)}
        >
          Deposit into Gateway
        </Button>
      </div>

      {/* Per-chain balance cards */}
      {displayChainBalances.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Balance by chain</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayChainBalances.map((cb) => {
              const iconUrl = CHAIN_ICON_URLS[cb.chainId] ?? getChainIconUrl(cb.chainId);
              return (
                <div 
                  key={cb.chainId} 
                  className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all hover:scale-[1.02]"
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
                  <p className="text-base font-mono font-semibold tabular-nums">
                    {isLoadingBalances ? "…" : cb.gatewayBalance}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deposit to Gateway modal */}
      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Deposit to Gateway</DialogTitle>
            <DialogDescription>
              Add USDC to your unified balance from any supported chain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Wallet balance for selected chain */}
            <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border/50">
              <div>
                <p className="text-sm text-muted-foreground">Wallet balance</p>
                <p className="text-2xl font-bold tabular-nums">
                  {modalWalletBalance} USDC
                </p>
                {depositChainId !== chainId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Switch to {depositChainInfo.chain?.name} to see balance
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="rounded-lg px-3 py-1">{depositChainInfo.chain?.name ?? "—"}</Badge>
            </div>

            {/* Chain selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select source chain</Label>
              <Select
                value={selectedDepositChain}
                onValueChange={setSelectedDepositChain}
                disabled={isDepositing}
              >
                <SelectTrigger className="rounded-xl h-12 bg-secondary/30 border-border/50">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()} className="rounded-lg">
                      {chain.name}
                      {chain.id === chainId && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Attestation time: {depositChainInfo.attestationTime}
              </p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
