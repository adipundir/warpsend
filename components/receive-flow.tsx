"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supportedChains, getChainInfo, isGatewaySupported, arcTestnet, CHAIN_ICON_URLS, getChainIconUrl } from "@/lib/chains";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, QrCode, RefreshCw, Check } from "lucide-react";

export function ReceiveFlow({ onClose }: { onClose?: () => void }) {
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
  };

  const handleCopyData = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
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
            <Button onClick={handleCopyData} variant="outline" className="flex-1 rounded-xl h-12 min-h-[48px]">
              <Copy className="w-4 h-4 mr-2 shrink-0" />
              Copy
            </Button>
            <Button onClick={handleDownloadQR} variant="outline" className="flex-1 rounded-xl h-12 min-h-[48px]">
              <Download className="w-4 h-4 mr-2 shrink-0" />
              Save
            </Button>
          </div>

          <div className="flex gap-2 w-full">
            <Button onClick={handleReset} variant="ghost" className="flex-1 rounded-xl h-11">
              <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
              New Request
            </Button>
            {onClose && (
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Form to Generate QR */
        <div className="space-y-5">
          <div className="text-center">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {supportedChains
                  .filter((c) => isGatewaySupported(c.id))
                  .sort((a, b) => (a.id === arcTestnet.id ? -1 : b.id === arcTestnet.id ? 1 : 0))
                  .map((chain) => {
                    const info = getChainInfo(chain.id);
                    const iconUrl = CHAIN_ICON_URLS[chain.id] ?? getChainIconUrl(chain.id);
                    const isSelected = chainId === chain.id.toString();
                    return (
                      <button
                        key={chain.id}
                        type="button"
                        onClick={() => setChainId(chain.id.toString())}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all min-h-[52px] ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                            : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center overflow-hidden shrink-0">
                          {iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {chain.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{chain.name}</p>
                          {info?.attestationTime && (
                            <p className="text-[10px] text-muted-foreground truncate">
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

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Receiving to</p>
              <p className="text-xs font-mono truncate">{address}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateQR} 
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 h-12 rounded-xl text-sm font-semibold min-h-[48px]"
            >
              <QrCode className="w-4 h-4 mr-2 shrink-0" />
              Generate QR Code
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl min-h-[48px] px-4"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
