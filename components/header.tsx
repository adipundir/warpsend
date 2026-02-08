"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Header() {
  const pathname = usePathname();

  // Don't show header on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
        <div className="glass rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <Logo className="w-full h-full" />
            </div>
            <span className="text-lg font-semibold tracking-tight">WarpSend</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
