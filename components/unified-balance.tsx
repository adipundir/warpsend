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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  supportedChains,
  USDC_ADDRESSES,
  GATEWAY_DOMAINS,
  GATEWAY_WALLET_ADDRESS,
  arcTestnet,
  getChainInfo,
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

  const currentChain = supportedChains.find((c) => c.id === chainId);
  const depositChainId = parseInt(selectedDepositChain);
  const depositChainInfo = getChainInfo(depositChainId);
  const usdcAddress = USDC_ADDRESSES[depositChainId];

  // Read wallet USDC balance for selected deposit chain
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
      refetchWalletBalance();

      // Refresh balances after a delay (wait for attestation)
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

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to view your unified balance
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unified USDC Balance</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUnifiedBalance}
              disabled={isLoadingBalances}
            >
              {isLoadingBalances ? "Loading..." : "Refresh"}
            </Button>
          </CardTitle>
          <CardDescription>
            Your total USDC balance across all chains via Circle Gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Total Available</p>
            <p className="text-5xl font-bold tracking-tight">
              {isLoadingBalances ? "..." : unifiedBalance}
            </p>
            <p className="text-lg text-muted-foreground">USDC</p>
          </div>

          {/* Per-chain breakdown */}
          {chainBalances.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Balance by Chain</p>
              <div className="space-y-2">
                {chainBalances
                  .filter((cb) => parseFloat(cb.gatewayBalance) > 0)
                  .map((cb) => (
                    <div
                      key={cb.chainId}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {cb.chainName}
                        </Badge>
                      </div>
                      <span className="font-mono font-medium">
                        {cb.gatewayBalance} USDC
                      </span>
                    </div>
                  ))}
                {chainBalances.every((cb) => parseFloat(cb.gatewayBalance) === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deposits yet. Deposit USDC to start building your unified balance.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit to Gateway</CardTitle>
          <CardDescription>
            Add USDC to your unified balance from any supported chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current wallet balance */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-xl font-bold">{formattedWalletBalance} USDC</p>
            </div>
            <Badge variant="outline">{currentChain?.name || "Unknown"}</Badge>
          </div>

          <Separator />

          {/* Chain Selection */}
          <div className="space-y-2">
            <Label>Deposit From Chain</Label>
            <Select
              value={selectedDepositChain}
              onValueChange={setSelectedDepositChain}
              disabled={isDepositing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent>
                {supportedChains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id.toString()}>
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

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (USDC)</Label>
            <div className="flex gap-2">
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isDepositing}
                min="0"
                step="0.01"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositAmount(formattedWalletBalance)}
                disabled={isDepositing}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Deposit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
          >
            {isDepositing ? "Depositing..." : "Deposit to Gateway"}
          </Button>

          {/* Switch chain hint */}
          {chainId !== depositChainId && (
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll be prompted to switch to {depositChainInfo.chain?.name}
            </p>
          )}

          {/* Faucet Link */}
          <p className="text-xs text-center text-muted-foreground">
            Need testnet USDC?{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Get it from Circle Faucet
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
