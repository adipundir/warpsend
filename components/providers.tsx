"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "next-themes";
import { config } from "@/lib/wagmi";
import { useState, useSyncExternalStore } from "react";
import "@rainbow-me/rainbowkit/styles.css";

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
            modalSize="compact"
            showRecentTransactions={true}
          >
            {mounted ? children : null}
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
