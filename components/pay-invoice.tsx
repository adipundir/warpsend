"use client";

import { useState, useCallback } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Invoice, markInvoicePaid, formatInvoiceStatus } from "@/lib/invoices";

interface PayInvoiceProps {
  invoice: Invoice;
  onPaid?: () => void;
}

type TxStep = "idle" | "approving" | "depositing" | "signing" | "minting" | "transferring";

export function PayInvoice({ invoice, onPaid }: PayInvoiceProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { signTypedDataAsync } = useSignTypedData();

  const [txStep, setTxStep] = useState<TxStep>("idle");

  const sourceChain = supportedChains.find((c) => c.id === chainId);
  const destChain = supportedChains.find((c) => c.id === invoice.recipientChainId);
  const isCrossChain = chainId !== invoice.recipientChainId;
  const usdcAddress = USDC_ADDRESSES[chainId];
  const amountBigInt = formatUSDCAmount(invoice.amount);
  const destInfo = getChainInfo(invoice.recipientChainId);

  // Read USDC balance
  const { data: balance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  // Write contract hooks
  const { writeContractAsync, isPending } = useWriteContract();

  // Same-chain direct transfer
  const handleSameChainPayment = useCallback(async () => {
    if (!address || !usdcAddress || !publicClient) return;

    try {
      setTxStep("transferring");
      toast.info("Processing payment...");

      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [invoice.recipientAddress as `0x${string}`, amountBigInt],
      });

      toast.info("Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash });

      markInvoicePaid(invoice.id, address, hash, chainId);
      toast.success("Payment successful!");
      onPaid?.();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed");
    } finally {
      setTxStep("idle");
    }
  }, [address, usdcAddress, publicClient, writeContractAsync, invoice, amountBigInt, chainId, onPaid]);

  // Cross-chain payment via Gateway
  const handleCrossChainPayment = useCallback(async () => {
    if (!address || !usdcAddress || !walletClient || !publicClient) return;

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
      toast.success("Deposited! Creating transfer...");

      // Step 3: Create and sign burn intent
      setTxStep("signing");
      toast.info("Creating cross-chain payment...");

      // Wait a bit for the deposit to be reflected
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const burnIntent = createBurnIntent({
        sourceChainId: chainId,
        destinationChainId: invoice.recipientChainId,
        depositorAddress: address,
        recipientAddress: invoice.recipientAddress as `0x${string}`,
        amount: invoice.amount,
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
      if (chainId !== invoice.recipientChainId) {
        toast.info(`Switching to ${destChain?.name} for minting...`);
        await switchChain({ chainId: invoice.recipientChainId });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      toast.info("Minting USDC on destination chain...");

      const mintHash = await writeContractAsync({
        address: GATEWAY_MINTER_ADDRESS,
        abi: GATEWAY_MINTER_ABI,
        functionName: "gatewayMint",
        args: [response.attestation as `0x${string}`, response.signature as `0x${string}`],
      });

      markInvoicePaid(invoice.id, address, mintHash, chainId);
      toast.success("Payment complete!");
      onPaid?.();
    } catch (error) {
      console.error("Cross-chain payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setTxStep("idle");
    }
  }, [
    address,
    usdcAddress,
    walletClient,
    publicClient,
    chainId,
    invoice,
    amountBigInt,
    destChain,
    signTypedDataAsync,
    switchChain,
    writeContractAsync,
    onPaid,
  ]);

  const handlePay = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (balance && amountBigInt > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (isCrossChain) {
      await handleCrossChainPayment();
    } else {
      await handleSameChainPayment();
    }
  };

  const formattedBalance = balance ? parseUSDCAmount(balance) : "0";
  const isLoading = isPending || txStep !== "idle";
  const isPaid = invoice.status === "paid";
  const isCancelled = invoice.status === "cancelled";
  const canPay = isConnected && !isLoading && !isPaid && !isCancelled;
  const hasInsufficientBalance = balance ? amountBigInt > balance : false;

  const getStatusVariant = (status: Invoice["status"]) => {
    const variants: Record<Invoice["status"], "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default",
      expired: "destructive",
      cancelled: "outline",
    };
    return variants[status];
  };

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
          return "Processing...";
        default:
          return "Processing...";
      }
    }
    return `Pay ${invoice.amount} USDC`;
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Payment Request</CardTitle>
            <CardDescription>{invoice.description}</CardDescription>
          </div>
          <Badge variant={getStatusVariant(invoice.status)}>
            {formatInvoiceStatus(invoice.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Details */}
        <div className="space-y-4">
          <div className="text-center py-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-4xl font-bold">{invoice.amount} USDC</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-mono">
                {invoice.recipientAddress.slice(0, 6)}...{invoice.recipientAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receive On</span>
              <span>{destChain?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Separator />

        {isPaid ? (
          <div className="text-center py-4">
            <p className="text-lg font-medium text-foreground">
              This invoice has been paid
            </p>
            {invoice.paidBy && (
              <p className="text-sm text-muted-foreground mt-2">
                Paid by: {invoice.paidBy.slice(0, 6)}...{invoice.paidBy.slice(-4)}
              </p>
            )}
          </div>
        ) : isCancelled ? (
          <div className="text-center py-4">
            <p className="text-lg font-medium text-muted-foreground">
              This invoice has been cancelled
            </p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-4 text-muted-foreground">
            Connect your wallet to pay this invoice
          </div>
        ) : (
          <>
            {/* Your Balance */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-xl font-bold">{formattedBalance} USDC</p>
              </div>
              <Badge variant="outline">{sourceChain?.name || "Unknown"}</Badge>
            </div>

            {isCrossChain && GATEWAY_DOMAINS[invoice.recipientChainId] !== undefined && (
              <p className="text-sm text-muted-foreground text-center">
                Cross-chain payment via Circle Gateway • {destInfo.attestationTime}
              </p>
            )}

            {hasInsufficientBalance && (
              <p className="text-sm text-destructive text-center">
                Insufficient balance. You need {invoice.amount} USDC.
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handlePay}
              disabled={!canPay || hasInsufficientBalance}
            >
              {getButtonText()}
            </Button>

            {/* Suggest switching to Arc Testnet */}
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
