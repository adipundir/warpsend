"use client";

import { SendFunds } from "@/components/send-funds";
import { BalanceSummary } from "@/components/balance-summary";

export default function SendPage() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Send USDC Anywhere</h1>
        <p className="text-muted-foreground max-w-md">
          Send USDC to any wallet address or ENS name. Cross-chain transfers powered by Circle Gateway.
        </p>
      </div>
      <div className="w-full max-w-lg space-y-6">
        <BalanceSummary />
        <SendFunds />
      </div>
    </div>
  );
}
