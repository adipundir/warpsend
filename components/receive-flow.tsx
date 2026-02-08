"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supportedChains, getChainInfo, isGatewaySupported, arcTestnet } from "@/lib/chains";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, QrCode, RefreshCw } from "lucide-react";

export function ReceiveFlow() {
  const { address, isConnected } = useAccount();
  
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState(arcTestnet.id.toString());
  const [qrData, setQrData] = useState<string | null>(null);

  const selectedChain = supportedChains.find(c => c.id.toString() === chainId);

  const handleGenerateQR = () => {
    if (!address || !amount || !chainId) {
      toast.error("Please enter an amount");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const paymentRequest = {
      type: "warpsend-payment-request",
      address: address,
      amount,
      chainId,
      timestamp: Date.now(),
    };

    setQrData(JSON.stringify(paymentRequest));
    toast.success("QR code generated!");
  };

  const handleCopyData = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      toast.success("Payment data copied");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector("#payment-qr svg") as SVGElement;
    if (svg) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `warpsend-${amount}-usdc.png`;
        a.click();
        toast.success("QR code downloaded");
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handleReset = () => {
    setQrData(null);
    setAmount("");
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Connect your wallet to receive USDC</p>
      </div>
    );
  }

  return (
    <div>
      {/* QR Code Display */}
      {qrData ? (
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Share to Receive</h3>
            <p className="text-sm text-muted-foreground">Anyone with WarpSend can scan this to pay you</p>
          </div>

          <div className="flex justify-center">
            <div id="payment-qr" className="bg-white p-5 rounded-2xl shadow-lg">
              <QRCodeSVG value={qrData} size={180} level="H" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold tabular-nums">{amount} USDC</p>
            <p className="text-sm text-muted-foreground">
              on {selectedChain?.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {address?.slice(0, 10)}...{address?.slice(-8)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCopyData} variant="outline" className="flex-1 rounded-xl h-11">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={handleDownloadQR} variant="outline" className="flex-1 rounded-xl h-11">
              <Download className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          <Button onClick={handleReset} variant="ghost" className="w-full rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Create New Request
          </Button>
        </div>
      ) : (
        /* Form to Generate QR */
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Request Payment</h3>
            <p className="text-muted-foreground text-sm">
              Generate a QR code that anyone can scan to pay you
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl h-12 bg-secondary/30 border-border/50 focus:border-primary/50 text-lg font-mono text-center"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Receive on</Label>
              <Select value={chainId} onValueChange={setChainId}>
                <SelectTrigger className="rounded-xl h-11 bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {supportedChains.filter(chain => isGatewaySupported(chain.id)).map((chain) => {
                    const info = getChainInfo(chain.id);
                    return (
                      <SelectItem key={chain.id} value={chain.id.toString()} className="rounded-lg">
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

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Receiving to</p>
              <p className="text-xs font-mono truncate">{address}</p>
            </div>
          </div>

          <Button 
            onClick={handleGenerateQR} 
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
