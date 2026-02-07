"use client";

import { useState } from "react";
import { AnimatedLanding, LandingPage } from "@/components/landing";
import { SendFunds } from "@/components/send-funds";
import { BalanceSummary } from "@/components/balance-summary";

type PageState = "animation" | "landing" | "app";

export default function Home() {
  const [pageState, setPageState] = useState<PageState>("animation");

  // Animation and landing page need to be full screen (escape the layout)
  if (pageState === "animation") {
    return (
      <div className="fixed inset-0 z-50">
        <AnimatedLanding onComplete={() => setPageState("landing")} />
      </div>
    );
  }

  if (pageState === "landing") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black scrollbar-hide">
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <LandingPage onGetStarted={() => setPageState("app")} />
      </div>
    );
  }

  // Main app renders normally in the layout
  return (
    <div className="flex flex-col items-center justify-center py-8" id="app">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Send USDC Anywhere</h1>
        <p className="text-gray-400 max-w-md">
          Send USDC to any wallet address or ENS name. Cross-chain transfers
          powered by Circle Gateway.
        </p>
      </div>
      <div className="w-full max-w-lg space-y-6">
        <BalanceSummary />
        <SendFunds />
      </div>
    </div>
  );
}
