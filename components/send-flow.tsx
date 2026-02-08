"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWriteContract, useSignTypedData } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { parseUnits, type Address, type Hex, pad, maxUint256, zeroAddress } from "viem";
import { supportedChains, GATEWAY_DOMAINS, GATEWAY_WALLET_ADDRESS, GATEWAY_MINTER_ADDRESS, getChainInfo, isGatewaySupported } from "@/lib/chains";
import { ERC20_ABI } from "@/lib/contracts";
import { GATEWAY_WALLET_ABI, GATEWAY_MINTER_ABI, createBurnIntent, createBurnIntentTypedData, requestGatewayTransfer } from "@/lib/gateway";
import { QrCodeIcon, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type TxStep = "idle" | "approving" | "depositing" | "signing" | "requesting" | "switching" | "minting" | "success";

export function SendFlow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [destChainId, setDestChainId] = useState(supportedChains[0].id.toString());
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [scanning, setScanning] = useState(false);

  const handleScanQR = async () => {
    setScanning(true);
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
              setRecipient(data.address);
              setAmount(data.amount);
              setDestChainId(data.chainId);
              toast.success("Payment request scanned!");
              html5QrCode.stop();
              setScanning(false);
            }
          } catch (e) {
            toast.error("Invalid QR code");
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("QR scan error:", err);
      toast.error("Failed to start camera");
      setScanning(false);
    }
  };

  const handleSend = async () => {
    if (!address || !recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const destinationChainId = parseInt(destChainId);
    const destinationChain = supportedChains.find((c) => c.id === destinationChainId);
    
    if (!destinationChain) {
      toast.error("Invalid destination chain");
      return;
    }

    if (!isGatewaySupported(destinationChainId)) {
      toast.error("Destination chain not supported by Gateway");
      return;
    }

    if (!isGatewaySupported(chainId)) {
      toast.error("Please switch to a Gateway-supported chain");
      return;
    }

    const amountInUnits = parseUnits(amount, 6);

    try {
      setTxStep("signing");
      
      // Create and sign burn intent
      const burnIntent = createBurnIntent({
        sourceChainId: chainId,
        destinationChainId,
        depositorAddress: address,
        recipientAddress: recipient as Address,
        amount: amountInUnits.toString(),
      });

      const typedData = createBurnIntentTypedData(burnIntent);
      const signature = await signTypedDataAsync({
        types: typedData.types,
        domain: typedData.domain,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      if (!signature) {
        throw new Error("Failed to sign burn intent");
      }

      setTxStep("requesting");
      
      // Request attestation from Gateway API
      const { attestation, signature: operatorSignature } = await requestGatewayTransfer([
        { burnIntent: typedData.message, signature },
      ]);

      // Switch to destination chain if needed
      if (chainId !== destinationChainId) {
        setTxStep("switching");
        await switchChainAsync({ chainId: destinationChainId });
      }

      setTxStep("minting");
      
      // Mint on destination chain
      await writeContractAsync({
        address: GATEWAY_MINTER_ADDRESS,
        abi: GATEWAY_MINTER_ABI,
        functionName: "gatewayMint",
        args: [attestation as Hex, operatorSignature as Hex],
        chainId: destinationChainId,
      });

      setTxStep("success");
      toast.success(`Sent ${amount} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
      
      setTimeout(() => {
        setTxStep("idle");
        setRecipient("");
        setAmount("");
      }, 3000);
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error?.message || "Transfer failed");
      setTxStep("idle");
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to send USDC
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send USDC</CardTitle>
        <CardDescription>
          Send to any wallet on any chain from your unified balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scanning && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <div id="qr-reader" className="w-full" />
            <Button 
              onClick={() => setScanning(false)} 
              variant="outline" 
              className="w-full mt-4"
            >
              Cancel Scan
            </Button>
          </div>
        )}

        {!scanning && (
          <>
            <div className="space-y-2">
              <Label>Recipient Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="0x... or ENS name"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={txStep !== "idle"}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleScanQR}
                  disabled={txStep !== "idle"}
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={txStep !== "idle"}
              />
            </div>

            <div className="space-y-2">
              <Label>Destination Chain</Label>
              <Select value={destChainId} onValueChange={setDestChainId} disabled={txStep !== "idle"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map((chain) => {
                    const info = getChainInfo(chain.id);
                    return (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        {chain.name}
                        {info?.attestationTime && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({info.attestationTime})
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSend}
              disabled={txStep !== "idle" || !recipient || !amount}
              className="w-full"
            >
              {txStep === "idle" && "Send USDC"}
              {txStep === "signing" && "Signing..."}
              {txStep === "requesting" && "Requesting attestation..."}
              {txStep === "switching" && "Switching chain..."}
              {txStep === "minting" && "Minting..."}
              {txStep === "success" && "Success!"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
