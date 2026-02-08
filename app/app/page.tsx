"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { UnifiedBalance } from "@/components/unified-balance";
import { SendFlow } from "@/components/send-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import { Modal } from "@/components/modal";
import { Wallet, Send, QrCode } from "lucide-react";

export default function AppPage() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const showConnectPrompt = !isConnected && !isConnecting && !isReconnecting;
  const showLoading = isConnecting || isReconnecting;

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center">
        <div className="w-full mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10 overflow-hidden">
          {showLoading ? (
            <div className="rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-8 md:p-12 text-center">
              <p className="text-muted-foreground">Loading…</p>
            </div>
          ) : showConnectPrompt ? (
            <div className="rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-foreground mb-1">Connect your wallet</h2>
              <p className="text-sm text-muted-foreground mb-6">Connect to view your balance, deposit, send, and receive USDC.</p>
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus="full"
              />
            </div>
          ) : (
            <>
              {/* Single box: balance + action buttons */}
              <div className="rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-6 md:p-8 mb-10">
                {/* Balance display */}
                <div className="mb-6">
                  <UnifiedBalance
                    variant="summary"
                    depositModalOpen={depositModalOpen}
                    onDepositModalOpenChange={setDepositModalOpen}
                  />
                </div>

                {/* Three buttons together: Deposit | Send | Receive */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setDepositModalOpen(true)}
                    className="group flex-1 flex items-center justify-center gap-2 h-12 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm btn-interactive"
                  >
                    <Wallet className="w-4 h-4 shrink-0 icon-bounce" />
                    Deposit into Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendModalOpen(true)}
                    className="group flex-1 flex items-center justify-center gap-2 h-12 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm btn-interactive"
                  >
                    <Send className="w-4 h-4 shrink-0 icon-slide-right" />
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiveModalOpen(true)}
                    className="group flex-1 flex items-center justify-center gap-2 h-12 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm btn-interactive"
                  >
                    <QrCode className="w-4 h-4 shrink-0 icon-bounce" />
                    Receive
                  </button>
                </div>
              </div>

              <Modal open={sendModalOpen} onClose={() => setSendModalOpen(false)}>
                <SendFlow onClose={() => setSendModalOpen(false)} />
              </Modal>

              <Modal open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)}>
                <ReceiveFlow onClose={() => setReceiveModalOpen(false)} />
              </Modal>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
