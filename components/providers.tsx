"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";
import { config } from "@/lib/wagmi";
import { arcTestnet } from "@/lib/chains";
import { useState, useSyncExternalStore, useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

function ArcChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const switchedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || chainId === arcTestnet.id) return;
    if (switchedRef.current) return;
    switchedRef.current = true;
    switchChainAsync({ chainId: arcTestnet.id }).catch(() => {});
  }, [isConnected, chainId, switchChainAsync]);

  return <>{children}</>;
}

// SSR-safe hook to check if mounted
function useIsMounted() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const mounted = useIsMounted();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RainbowKitProvider
            initialChain={arcTestnet}
            modalSize="compact"
            showRecentTransactions={true}
          >
            <ArcChainGuard>
              {mounted ? children : null}
            </ArcChainGuard>
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
