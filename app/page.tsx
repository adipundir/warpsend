"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedLanding, LandingPage } from "@/components/landing";

type PageState = "animation" | "landing";

export default function Home() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("animation");
  const [landingVisible, setLandingVisible] = useState(false);

  useEffect(() => {
    if (pageState === "landing") {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setLandingVisible(true));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [pageState]);

  const handleGetStarted = () => {
    router.push("/app");
  };

  if (pageState === "animation") {
    return (
      <div className="fixed inset-0 z-50">
        <AnimatedLanding onComplete={() => setPageState("landing")} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background scrollbar-hide"
      style={{
        opacity: landingVisible ? 1 : 0,
        transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
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
