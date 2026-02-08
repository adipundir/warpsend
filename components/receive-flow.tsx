"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supportedChains, getChainInfo } from "@/lib/chains";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, QrCode } from "lucide-react";

export function ReceiveFlow() {
  const { address, isConnected } = useAccount();
  
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState(supportedChains[0].id.toString());
  const [qrData, setQrData] = useState<string | null>(null);

  const handleGenerateQR = () => {
    const finalAddress = useConnectedWallet ? address : recipientAddress;
    
    if (!finalAddress || !amount || !chainId) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const paymentRequest = {
      type: "warpsend-payment-request",
      address: finalAddress,
      amount,
      chainId,
      timestamp: Date.now(),
    };

    setQrData(JSON.stringify(paymentRequest));
    toast.success("Payment request created!");
  };

  const handleCopyData = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      toast.success("Payment data copied to clipboard");
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#payment-qr canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `warpsend-payment-${Date.now()}.png`;
      a.click();
      toast.success("QR code downloaded");
    }
  };

  const handleReset = () => {
    setQrData(null);
    setAmount("");
    if (!useConnectedWallet) {
      setRecipientAddress("");
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to create payment requests
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payment</CardTitle>
        <CardDescription>
          Create a QR code that anyone can scan to pay you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrData ? (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-connected"
                checked={useConnectedWallet}
                onCheckedChange={(checked) => setUseConnectedWallet(checked as boolean)}
              />
              <Label htmlFor="use-connected" className="text-sm font-normal cursor-pointer">
                Use connected wallet address ({address?.slice(0, 6)}...{address?.slice(-4)})
              </Label>
            </div>

            {!useConnectedWallet && (
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Receive on Chain</Label>
              <Select value={chainId} onValueChange={setChainId}>
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

            <Button onClick={handleGenerateQR} className="w-full">
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4">
              <div id="payment-qr" className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={qrData} size={256} level="H" />
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  Request: {amount} USDC
                </p>
                <p className="text-xs text-muted-foreground">
                  To: {(useConnectedWallet ? address : recipientAddress)?.slice(0, 10)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Chain: {supportedChains.find(c => c.id.toString() === chainId)?.name}
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button onClick={handleCopyData} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Data
                </Button>
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <Button onClick={handleReset} variant="ghost" className="w-full">
                Create New Request
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
