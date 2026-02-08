"use client";

import { useState } from "react";
import { UnifiedBalance } from "@/components/unified-balance";
import { SendFlow } from "@/components/send-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import { Send, QrCode } from "lucide-react";

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* Top row: Balance left, Send/Receive right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8">
          {/* Left: Gateway unified balance */}
          <section className="min-h-[280px] flex flex-col rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-6 md:p-8">
            <UnifiedBalance />
          </section>

          {/* Right: Send / Receive */}
          <section className="min-h-[280px] flex flex-col rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-6 md:p-8">
            {/* Custom tab bar - not shadcn */}
            <div className="flex rounded-2xl p-1 bg-black/10 dark:bg-white/5 mb-6 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setActiveTab("send")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "send"
                    ? "bg-background dark:bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("receive")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "receive"
                    ? "bg-background dark:bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Receive
              </button>
            </div>

            <div className="flex-1">
              {activeTab === "send" && <SendFlow />}
              {activeTab === "receive" && <ReceiveFlow />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
