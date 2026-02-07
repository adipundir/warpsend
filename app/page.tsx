"use client";

import { useState } from "react";
import { AnimatedLanding, LandingPage } from "@/components/landing";

type PageState = "animation" | "landing";

export default function Home() {
  const [pageState, setPageState] = useState<PageState>("animation");

  const handleGetStarted = () => {
    setPageState("landing");
  };

  if (pageState === "animation") {
    return (
      <div className="fixed inset-0 z-50">
        <AnimatedLanding onComplete={() => setPageState("landing")} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background scrollbar-hide">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <LandingPage onGetStarted={handleGetStarted} />
    </div>
  );
}
