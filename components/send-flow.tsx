"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useSignTypedData } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { type Address, type Hex, isAddress } from "viem";
import { supportedChains, GATEWAY_MINTER_ADDRESS, getChainInfo, isGatewaySupported, arcTestnet, CHAIN_ICON_URLS, getChainIconUrl } from "@/lib/chains";
import { resolveEnsToAddress, looksLikeEnsName } from "@/lib/ens";
import { GATEWAY_MINTER_ABI, createBurnIntent, createBurnIntentTypedData, requestGatewayTransfer, getGatewayBalances } from "@/lib/gateway";
import { ScanLine, Send, CheckCircle2, Check, ExternalLink } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type TxStep = "idle" | "signing" | "requesting" | "switching" | "minting" | "success";

export function SendFlow({ onClose }: { onClose?: () => void }) {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [destChainId, setDestChainId] = useState("");
  const effectiveDestChainId =
    destChainId || (connectedChainId != null ? String(connectedChainId) : arcTestnet.id.toString());
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<{
    address: string;
    amount: string;
    chainId: string;
    chainName: string;
  } | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  // Start camera only after qr-reader is in the DOM
  useEffect(() => {
    if (!scanning) return;
    setCameraError(null);
    const el = document.getElementById("qr-reader");
    if (!el) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === "warpsend-payment-request") {
              const chain = supportedChains.find((c) => c.id.toString() === String(data.chainId));
              setRecipient(data.address);
              setAmount(String(data.amount));
              setDestChainId(String(data.chainId));
              setScannedData({
                address: data.address,
                amount: String(data.amount),
                chainId: String(data.chainId),
                chainName: chain?.name || "Unknown",
              });
              scannerRef.current = null;
              setScanning(false);
              // Let effect cleanup call stop() so we don't double-stop and throw
            } else {
              toast.error("Invalid WarpSend QR code");
            }
          } catch {
            toast.error("Invalid QR code format");
          }
        },
        () => { }
      )
      .catch((err: Error) => {
        console.error("QR scan error:", err);
        setCameraError(
          "Camera unavailable. Use HTTPS, allow camera permission in browser settings, or enter details manually below."
        );
        setScanning(false);
        scannerRef.current = null;
      });

    return () => {
      try {
        html5QrCode.stop().catch(() => { });
      } catch {
        // Scanner may already be stopped (e.g. after successful scan)
      }
      scannerRef.current = null;
    };
  }, [scanning]);

  const handleScanQR = () => {
    setScanning(true);
    setScannedData(null);
    setCameraError(null);
  };

  const handleCancelScan = () => {
    setScanning(false);
    setCameraError(null);
    scannerRef.current?.stop().catch(() => { });
    scannerRef.current = null;
  };

  const handleManualContinue = async () => {
    if (!recipient.trim() || !amount) {
      toast.error("Fill in address and amount");
      return;
    }
    let resolvedAddress = recipient.trim();
    if (looksLikeEnsName(resolvedAddress)) {
      const address = await resolveEnsToAddress(resolvedAddress);
      if (!address) {
        toast.error("Could not resolve ENS name. Check the name or use a 0x address.");
        return;
      }
      resolvedAddress = address;
    } else if (!isAddress(resolvedAddress)) {
      toast.error("Invalid address. Enter a valid 0x address or ENS name.");
      return;
    }
    const chain = supportedChains.find((c) => c.id.toString() === effectiveDestChainId);
    setScannedData({
      address: resolvedAddress,
      amount,
      chainId: effectiveDestChainId,
      chainName: chain?.name || "Unknown",
    });
    setDestChainId(effectiveDestChainId);
  };

  const handleSend = async () => {
    if (!address || !recipient || !amount || !effectiveDestChainId) {
      toast.error("Enter payment details first");
      return;
    }

    let recipientAddress = recipient.trim();
    if (looksLikeEnsName(recipientAddress)) {
      const resolved = await resolveEnsToAddress(recipientAddress);
      if (!resolved) {
        toast.error("Could not resolve ENS name. Check the name or use a 0x address.");
        return;
      }
      recipientAddress = resolved;
    } else if (!isAddress(recipientAddress)) {
      toast.error("Invalid address. Enter a valid 0x address or ENS name.");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const destinationChainId = parseInt(effectiveDestChainId, 10);
    const destinationChain = supportedChains.find((c) => c.id === destinationChainId);

    if (!destinationChain || !isGatewaySupported(destinationChainId)) {
      toast.error("Destination chain not supported");
      return;
    }

    if (connectedChainId != null && !isGatewaySupported(connectedChainId)) {
      toast.error("Please switch to a Gateway-supported chain");
      return;
    }

    // Check Gateway unified balance
    const transferFee = amountValue * 0.00005;
    const estimatedGas = connectedChainId === 11155111 ? 2.00 : 0.05;
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

      const burnIntent = createBurnIntent({
        sourceChainId: connectedChainId!,
        destinationChainId,
        depositorAddress: address,
        recipientAddress: recipientAddress as Address,
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

      const transferResponse = await requestGatewayTransfer([
        { burnIntent: typedData.message, signature },
      ]);

      if (transferResponse.error) {
        throw new Error(transferResponse.error || "Gateway transfer failed");
      }
      const attestationPayload = transferResponse.attestation;
      const operatorSignature = transferResponse.signature;
      if (!attestationPayload || !operatorSignature) {
        throw new Error("No attestation from Gateway. Try again.");
      }
      const attestationHex = attestationPayload.startsWith("0x") ? (attestationPayload as Hex) : (`0x${attestationPayload}` as Hex);
      const signatureHex = operatorSignature.startsWith("0x") ? (operatorSignature as Hex) : (`0x${operatorSignature}` as Hex);

      if (connectedChainId !== destinationChainId) {
        setTxStep("switching");
        const destChainName = destinationChain?.name ?? "destination chain";
        toast.info(`Approve switching to ${destChainName} to credit the recipient`);
        await switchChainAsync({ chainId: destinationChainId });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setTxStep("minting");
      toast.info(`Confirm mint on ${destinationChain?.name ?? "destination"} to send USDC to recipient`);

      const hash = await writeContractAsync({
        address: GATEWAY_MINTER_ADDRESS,
        abi: GATEWAY_MINTER_ABI,
        functionName: "gatewayMint",
        args: [attestationHex, signatureHex],
        chainId: destinationChainId,
      });

      setMintTxHash(hash ?? null);
      setTxStep("success");
      window.dispatchEvent(new CustomEvent("warpsend-balance-changed"));
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
      {/* Split: left = scan (blur until Scan clicked) | right = form — when idle and no scannedData yet */}
      {!scannedData && txStep === "idle" && (
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Left: camera placeholder (blur glass) until Scan clicked, then camera feed */}
          <div className="w-full md:min-w-[240px] md:max-w-[280px] flex flex-col gap-3 md:justify-center">
            {!scanning ? (
              <button
                type="button"
                onClick={handleScanQR}
                className="min-h-[220px] md:min-h-[260px] w-full rounded-xl border border-border/60 bg-card/30 backdrop-blur-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-card/50 hover:border-border hover:text-foreground transition-colors"
              >
                <span className="text-sm font-medium">Scan QR</span>
                <span className="text-xs text-center px-4">Point camera at a WarpSend payment QR</span>
              </button>
            ) : (
              <>
                <div id="qr-reader" className="w-full rounded-xl overflow-hidden bg-black min-h-[220px] md:min-h-[260px]" />
                {cameraError && (
                  <p className="text-xs text-muted-foreground text-center">{cameraError}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleCancelScan} variant="ghost" size="sm" className="rounded-xl h-10">
                    Stop
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right: form fields (filled by scan or manually) */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm">Recipient address or ENS name</Label>
              <Input
                placeholder="0x... or name.eth"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="rounded-xl h-11 bg-secondary/30"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl h-11 bg-secondary/30 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Destination chain</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {[...supportedChains]
                  .filter((c) => isGatewaySupported(c.id))
                  .sort((a, b) => (a.id === arcTestnet.id ? -1 : b.id === arcTestnet.id ? 1 : 0))
                  .map((chain) => {
                    const info = getChainInfo(chain.id);
                    const iconUrl = CHAIN_ICON_URLS[chain.id] ?? getChainIconUrl(chain.id);
                    const isSelected = effectiveDestChainId === chain.id.toString();
                    return (
                      <button
                        key={chain.id}
                        type="button"
                        onClick={() => setDestChainId(chain.id.toString())}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${isSelected
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
                          <p className="text-xs font-medium text-foreground truncate">{chain.name}</p>
                          {info?.attestationTime && (
                            <p className="text-[10px] text-muted-foreground truncate">{info.attestationTime}</p>
                          )}
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-primary shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
            <Button onClick={handleManualContinue} className="w-full h-12 rounded-xl">
              Continue
            </Button>
          </div>
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
              className="w-full h-12 rounded-xl text-sm font-semibold min-h-[48px]"
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
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setScannedData(null)}
                    variant="ghost"
                    className="flex-1 rounded-xl"
                  >
                    Change details
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="flex-1 rounded-xl"
                  >
                    Scan different QR
                  </Button>
                </div>
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    Close
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {txStep === "success" && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-1">Payment sent</h3>
            <p className="text-muted-foreground">
              {amount} USDC sent to recipient on {scannedData?.chainName ?? "destination chain"}
            </p>
          </div>
          {mintTxHash && (
            <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Mint transaction</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono truncate text-foreground">
                  {mintTxHash}
                </code>
                {effectiveDestChainId && (() => {
                  const destInfo = getChainInfo(parseInt(effectiveDestChainId, 10));
                  const explorerUrl = destInfo.chain?.blockExplorers?.default?.url;
                  return explorerUrl ? (
                    <a
                      href={`${explorerUrl}/tx/${mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
          )}
          {onClose && (
            <Button
              onClick={() => {
                setTxStep("idle");
                setMintTxHash(null);
                setScannedData(null);
                setRecipient("");
                setAmount("");
                setDestChainId("");
                onClose();
              }}
              className="w-full h-12 rounded-xl"
            >
              Close
            </Button>
          )}
        </div>
      )}

    </div>
  );
}
