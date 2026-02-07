"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useSignTypedData,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { normalize } from "viem/ens";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  supportedChains,
  USDC_ADDRESSES,
  GATEWAY_DOMAINS,
  arcTestnet,
  getChainInfo,
  GATEWAY_MINTER_ADDRESS,
} from "@/lib/chains";
import { ERC20_ABI, formatUSDCAmount, parseUSDCAmount } from "@/lib/contracts";
import {
  createBurnIntent,
  createBurnIntentTypedData,
  requestGatewayTransfer,
  GATEWAY_MINTER_ABI,
  getGatewayDepositParams,
} from "@/lib/gateway";

// Mainnet client for ENS resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

type TxStep = "idle" | "approving" | "depositing" | "signing" | "minting" | "transferring";

export function SendFunds() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { signTypedDataAsync } = useSignTypedData();

  const [recipient, setRecipient] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<`0x${string}` | null>(null);
  const [isResolvingEns, setIsResolvingEns] = useState(false);
  const [amount, setAmount] = useState("");
  const [destinationChain, setDestinationChain] = useState<string>(arcTestnet.id.toString());
  const [txStep, setTxStep] = useState<TxStep>("idle");

  const sourceChain = supportedChains.find((c) => c.id === chainId);
  const destChainId = parseInt(destinationChain);
  const isCrossChain = chainId !== destChainId;
  const usdcAddress = USDC_ADDRESSES[chainId];
  const destInfo = getChainInfo(destChainId);

  // Read USDC balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  // Write contract hooks for approval and deposit
  const { writeContractAsync, isPending } = useWriteContract();

  // ENS resolution
  useEffect(() => {
    const resolveEns = async () => {
      if (!recipient) {
        setResolvedAddress(null);
        return;
      }

      // Check if it's already a valid address
      if (recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        setResolvedAddress(recipient as `0x${string}`);
        return;
      }

      // Check if it looks like an ENS name
      if (recipient.includes(".")) {
        setIsResolvingEns(true);
        try {
          const normalized = normalize(recipient);
          const resolved = await mainnetClient.getEnsAddress({ name: normalized });
          setResolvedAddress(resolved);
          if (!resolved) {
            toast.error("Could not resolve ENS name");
          }
        } catch (error) {
          console.error("ENS resolution error:", error);
          setResolvedAddress(null);
        } finally {
          setIsResolvingEns(false);
        }
      } else {
        setResolvedAddress(null);
      }
    };

    const debounce = setTimeout(resolveEns, 500);
    return () => clearTimeout(debounce);
  }, [recipient]);

  // Same-chain direct transfer
  const handleSameChainTransfer = useCallback(async () => {
    if (!resolvedAddress || !amount || !address || !usdcAddress) return;

    const amountBigInt = formatUSDCAmount(amount);

    try {
      setTxStep("transferring");
      toast.info("Sending USDC...");

      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [resolvedAddress, amountBigInt],
      });

      toast.info("Waiting for confirmation...");
      await publicClient?.waitForTransactionReceipt({ hash });

      toast.success("Transfer successful!");
      setRecipient("");
      setAmount("");
      refetchBalance();
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Transfer failed");
    } finally {
      setTxStep("idle");
    }
  }, [resolvedAddress, amount, address, usdcAddress, writeContractAsync, publicClient, refetchBalance]);

  // Cross-chain transfer via Gateway
  const handleCrossChainTransfer = useCallback(async () => {
    if (!resolvedAddress || !amount || !address || !usdcAddress || !walletClient || !publicClient) return;

    const amountBigInt = formatUSDCAmount(amount);

    try {
      // Step 1: Approve Gateway Wallet
      setTxStep("approving");
      toast.info("Approving USDC for Gateway...");

      const depositParams = getGatewayDepositParams(usdcAddress, amountBigInt);

      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [depositParams.address, amountBigInt],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      toast.success("Approved!");

      // Step 2: Deposit to Gateway Wallet
      setTxStep("depositing");
      toast.info("Depositing to Gateway...");

      const depositHash = await writeContractAsync(depositParams);
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      toast.success("Deposited! Waiting for attestation...");

      // Step 3: Create and sign burn intent
      setTxStep("signing");
      toast.info("Creating cross-chain transfer...");

      // Wait a bit for the deposit to be reflected in Gateway
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const burnIntent = createBurnIntent({
        sourceChainId: chainId,
        destinationChainId: destChainId,
        depositorAddress: address,
        recipientAddress: resolvedAddress,
        amount,
      });

      const typedData = createBurnIntentTypedData(burnIntent);

      // Sign the burn intent
      const signature = await signTypedDataAsync({
        types: typedData.types,
        domain: typedData.domain,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Step 4: Request attestation from Gateway API
      toast.info("Requesting attestation...");

      const response = await requestGatewayTransfer([
        { burnIntent, signature },
      ]);

      if (!response.attestation || !response.signature) {
        throw new Error(response.error || "Failed to get attestation");
      }

      // Step 5: Mint on destination chain
      setTxStep("minting");

      // Check if we need to switch chains
      if (chainId !== destChainId) {
        toast.info(`Switching to ${destInfo.chain?.name} for minting...`);
        await switchChain({ chainId: destChainId });

        // Wait for chain switch
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      toast.info("Minting USDC on destination chain...");

      // Create new client for destination chain
      const destChainConfig = supportedChains.find((c) => c.id === destChainId);
      if (!destChainConfig) throw new Error("Destination chain not found");

      await writeContractAsync({
        address: GATEWAY_MINTER_ADDRESS,
        abi: GATEWAY_MINTER_ABI,
        functionName: "gatewayMint",
        args: [response.attestation as `0x${string}`, response.signature as `0x${string}`],
      });

      toast.success(
        `Cross-chain transfer complete! ${amount} USDC sent to ${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)} on ${destInfo.chain?.name}`
      );

      setRecipient("");
      setAmount("");
      refetchBalance();
    } catch (error) {
      console.error("Cross-chain transfer error:", error);
      toast.error(error instanceof Error ? error.message : "Cross-chain transfer failed");
    } finally {
      setTxStep("idle");
    }
  }, [
    resolvedAddress,
    amount,
    address,
    usdcAddress,
    walletClient,
    publicClient,
    chainId,
    destChainId,
    destInfo,
    signTypedDataAsync,
    switchChain,
    writeContractAsync,
    refetchBalance,
  ]);

  const handleSend = async () => {
    if (!resolvedAddress || !amount || !address) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountBigInt = formatUSDCAmount(amount);

    if (balance && amountBigInt > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (isCrossChain) {
      await handleCrossChainTransfer();
    } else {
      await handleSameChainTransfer();
    }
  };

  const formattedBalance = balance ? parseUSDCAmount(balance) : "0";
  const isLoading = isPending || txStep !== "idle";
  const canSend = resolvedAddress && amount && parseFloat(amount) > 0 && !isLoading && !isResolvingEns;

  const getButtonText = () => {
    if (isLoading) {
      switch (txStep) {
        case "approving":
          return "Approving...";
        case "depositing":
          return "Depositing to Gateway...";
        case "signing":
          return "Signing...";
        case "minting":
          return "Minting on destination...";
        case "transferring":
          return "Sending...";
        default:
          return "Processing...";
      }
    }
    return isCrossChain ? "Send Cross-Chain" : "Send USDC";
  };

  return (
    <Card className="w-full max-w-lg bg-white/[0.02] border-purple-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Send USDC</CardTitle>
        <CardDescription>
          Send USDC to any wallet address or ENS name across supported chains via Circle Gateway
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            Connect your wallet to send funds
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">{formattedBalance} USDC</p>
              </div>
              <Badge variant="outline">{sourceChain?.name || "Unknown"}</Badge>
            </div>

            <Separator />

            {/* Recipient Input */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="0x... or vitalik.eth"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={isLoading}
              />
              {isResolvingEns && (
                <p className="text-sm text-muted-foreground">Resolving ENS name...</p>
              )}
              {resolvedAddress && resolvedAddress !== recipient && (
                <p className="text-sm text-muted-foreground">
                  Resolved: {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(formattedBalance)}
                  disabled={isLoading}
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Destination Chain */}
            <div className="space-y-2">
              <Label>Destination Chain</Label>
              <Select value={destinationChain} onValueChange={setDestinationChain} disabled={isLoading}>
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
              {isCrossChain && GATEWAY_DOMAINS[destChainId] !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Cross-chain via Circle Gateway • Attestation: {destInfo.attestationTime}
                </p>
              )}
            </div>

            {/* Send Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSend}
              disabled={!canSend}
            >
              {getButtonText()}
            </Button>

            {/* Chain Switch Hint */}
            {chainId !== arcTestnet.id && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => switchChain({ chainId: arcTestnet.id })}
              >
                Switch to Arc Testnet (Fastest)
              </Button>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
