"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supportedChains, GATEWAY_DOMAINS } from "@/lib/chains";
import { getGatewayBalances } from "@/lib/gateway";

export function BalanceSummary() {
  const { address, isConnected } = useAccount();
  const [unifiedBalance, setUnifiedBalance] = useState<string>("0");
  const [activeChains, setActiveChains] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await getGatewayBalances(address);
      
      let total = 0;
      let chainsWithBalance = 0;

      for (const chain of supportedChains) {
        const domain = GATEWAY_DOMAINS[chain.id];
        if (domain === undefined) continue;

        const gatewayBal = response.balances.find((b) => b.domain === domain);
        const amount = gatewayBal ? parseFloat(gatewayBal.balance) : 0;
        
        if (amount > 0) {
          total += amount;
          chainsWithBalance++;
        }
      }

      setUnifiedBalance(total.toFixed(2));
      setActiveChains(chainsWithBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Unified Gateway Balance</p>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : `${unifiedBalance} USDC`}
              </p>
            </div>
            {activeChains > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeChains} chain{activeChains > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/balance">Manage</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
