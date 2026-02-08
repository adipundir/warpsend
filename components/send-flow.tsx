"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useSignTypedData } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Address, type Hex } from "viem";
import { supportedChains, GATEWAY_MINTER_ADDRESS, getChainInfo, isGatewaySupported } from "@/lib/chains";
import { GATEWAY_MINTER_ABI, createBurnIntent, createBurnIntentTypedData, requestGatewayTransfer, getGatewayBalances } from "@/lib/gateway";
import { ScanLine, Send, CheckCircle2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type TxStep = "idle" | "signing" | "requesting" | "switching" | "minting" | "success";

export function SendFlow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [destChainId, setDestChainId] = useState("");
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<{
    address: string;
    amount: string;
    chainId: string;
    chainName: string;
  } | null>(null);

  const handleScanQR = async () => {
    setScanning(true);
    setScannedData(null);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === "warpsend-payment-request") {
              const chain = supportedChains.find(c => c.id.toString() === data.chainId);
              setRecipient(data.address);
              setAmount(data.amount);
              setDestChainId(data.chainId);
              setScannedData({
                address: data.address,
                amount: data.amount,
                chainId: data.chainId,
                chainName: chain?.name || "Unknown",
              });
              toast.success("Payment request scanned!");
              html5QrCode.stop();
              setScanning(false);
            } else {
              toast.error("Invalid WarpSend QR code");
            }
          } catch {
            toast.error("Invalid QR code format");
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("QR scan error:", err);
      toast.error("Failed to start camera. Please allow camera access.");
      setScanning(false);
    }
  };

  const handleCancelScan = () => {
    setScanning(false);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCode.stop().catch(() => {});
    } catch {}
  };

  const handleSend = async () => {
    if (!address || !recipient || !amount || !destChainId) {
      toast.error("Please scan a payment QR code first");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const destinationChainId = parseInt(destChainId);
    const destinationChain = supportedChains.find((c) => c.id === destinationChainId);
    
    if (!destinationChain || !isGatewaySupported(destinationChainId)) {
      toast.error("Destination chain not supported");
      return;
    }

    if (!isGatewaySupported(chainId)) {
      toast.error("Please switch to a Gateway-supported chain");
      return;
    }

    // Check Gateway unified balance
    const transferFee = amountValue * 0.00005;
    const estimatedGas = chainId === 11155111 ? 2.00 : 0.05;
    const estimatedFee = transferFee + estimatedGas;
    try {
      const balanceRes = await getGatewayBalances(address);
      const totalAvailable = balanceRes.balances.reduce((sum, b) => sum + parseFloat(b.balance), 0);
      const required = amountValue + estimatedFee;
      if (totalAvailable < required) {
        toast.error(
          `Insufficient balance. You have ${totalAvailable.toFixed(2)} USDC, need ~${required.toFixed(2)} USDC.`
        );
        return;
      }
    } catch (e) {
      console.warn("Could not validate balance", e);
    }

    try {
      setTxStep("signing");
      toast.info("Please sign the transaction...");
      
      const burnIntent = createBurnIntent({
        sourceChainId: chainId,
        destinationChainId,
        depositorAddress: address,
        recipientAddress: recipient as Address,
        amount: amount,
      });

      const typedData = createBurnIntentTypedData(burnIntent);
      const signature = await signTypedDataAsync({
        types: typedData.types,
        domain: typedData.domain,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      if (!signature) {
        throw new Error("Failed to sign");
      }

      setTxStep("requesting");
      toast.info("Getting attestation from Gateway...");
      
      const { attestation, signature: operatorSignature } = await requestGatewayTransfer([
        { burnIntent: typedData.message, signature },
      ]);

      if (chainId !== destinationChainId) {
        setTxStep("switching");
        toast.info(`Switching to ${destinationChain.name}...`);
        await switchChainAsync({ chainId: destinationChainId });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setTxStep("minting");
      toast.info("Minting USDC...");
      
      await writeContractAsync({
        address: GATEWAY_MINTER_ADDRESS,
        abi: GATEWAY_MINTER_ABI,
        functionName: "gatewayMint",
        args: [attestation as Hex, operatorSignature as Hex],
      });

      setTxStep("success");
      toast.success(`Sent ${amount} USDC!`);
      window.dispatchEvent(new CustomEvent("warpsend-balance-changed"));

      setTimeout(() => {
        setTxStep("idle");
        setRecipient("");
        setAmount("");
        setDestChainId("");
        setScannedData(null);
      }, 3000);
    } catch (error: any) {
      console.error("Send error:", error);
      const msg = error?.message ?? "";
      if (msg.includes("Insufficient balance")) {
        toast.error("Insufficient Gateway balance for this transfer.");
      } else if (msg.includes("rejected") || msg.includes("denied")) {
        toast.error("Transaction rejected");
      } else {
        toast.error(msg || "Transfer failed");
      }
      setTxStep("idle");
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setRecipient("");
    setAmount("");
    setDestChainId("");
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <ScanLine className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Connect your wallet to send USDC</p>
      </div>
    );
  }

  return (
    <div>
      {/* QR Scanner */}
      {scanning && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Scan Payment QR</h3>
            <p className="text-sm text-muted-foreground">Point your camera at a WarpSend QR code</p>
          </div>
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden bg-black" />
          <Button 
            onClick={handleCancelScan} 
            variant="outline" 
            className="w-full rounded-xl h-12"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Scanned Payment Details */}
      {!scanning && scannedData && txStep !== "success" && (
        <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Payment Request</h3>
              <p className="text-sm text-muted-foreground">Review and confirm the payment</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 text-center">
              <p className="text-sm text-muted-foreground mb-2">Amount</p>
              <p className="text-4xl font-bold tabular-nums mb-1">{scannedData.amount}</p>
              <p className="text-lg text-muted-foreground">USDC</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/30">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-mono">
                  {scannedData.address.slice(0, 8)}...{scannedData.address.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/30">
                <span className="text-sm text-muted-foreground">Chain</span>
                <span className="text-sm font-medium">{scannedData.chainName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSend}
                disabled={txStep !== "idle"}
                className="w-full h-14 rounded-xl text-base font-semibold"
              >
                {txStep === "idle" && (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send {scannedData.amount} USDC
                  </>
                )}
                {txStep === "signing" && "Signing..."}
                {txStep === "requesting" && "Getting attestation..."}
                {txStep === "switching" && "Switching chain..."}
                {txStep === "minting" && "Minting..."}
              </Button>
              
              {txStep === "idle" && (
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="w-full rounded-xl"
                >
                  Scan Different QR
                </Button>
              )}
            </div>
        </div>
      )}

      {/* Success State */}
      {txStep === "success" && (
        <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Payment Sent!</h3>
              <p className="text-muted-foreground">
                {amount} USDC sent successfully
              </p>
            </div>
        </div>
      )}

      {/* Initial State - Scan Button */}
      {!scanning && !scannedData && txStep === "idle" && (
        <div className="text-center space-y-5">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <ScanLine className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scan to Pay</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Scan a WarpSend QR code to send USDC across any chain
            </p>
          </div>

          <Button
            onClick={handleScanQR}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
