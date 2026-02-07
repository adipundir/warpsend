"use client";

import { UnifiedBalance } from "@/components/unified-balance";

export default function BalancePage() {
  return (
    <div className="flex flex-col items-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Unified Balance</h1>
        <p className="text-muted-foreground max-w-md">
          Deposit USDC from any chain to build your unified cross-chain balance powered by Circle Gateway.
        </p>
      </div>
      <div className="w-full max-w-lg">
        <UnifiedBalance />
      </div>
    </div>
  );
}
