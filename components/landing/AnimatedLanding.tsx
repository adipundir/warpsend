"use client";

import { useState, useCallback } from "react";
import { LoadingCounter } from "./LoadingCounter";
import { Globe } from "./Globe";
import { LandingHero } from "./LandingHero";

type AnimationPhase =
    | "loading"
    | "globe-entry"
    | "globe-arcs"
    | "logo-reveal"
    | "complete";

interface AnimatedLandingProps {
    onComplete?: () => void;
}

export function AnimatedLanding({ onComplete }: AnimatedLandingProps) {
    const [phase, setPhase] = useState<AnimationPhase>("loading");

    const handleLoadingComplete = useCallback(() => {
        setPhase("globe-entry");

        // After globe appears, show arcs
        setTimeout(() => {
            setPhase("globe-arcs");
        }, 1500);

        // Then reveal the logo
        setTimeout(() => {
            setPhase("logo-reveal");
        }, 3500);

        // Finally complete
        setTimeout(() => {
            setPhase("complete");
            onComplete?.();
        }, 4500);
    }, [onComplete]);

    return (
        <div
            className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
            style={{ zIndex: 50 }}
        >
            {/* Loading Phase */}
            <div
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                style={{
                    opacity: phase === "loading" ? 1 : 0,
                    pointerEvents: phase === "loading" ? "auto" : "none",
                }}
            >
                <LoadingCounter duration={2500} onComplete={handleLoadingComplete} />
            </div>

            {/* Globe Phase */}
            <div
                className="absolute inset-0 flex items-center justify-center transition-all duration-700"
                style={{
                    opacity:
                        phase === "globe-entry" || phase === "globe-arcs" ? 1 : 0,
                    transform:
                        phase === "globe-entry" || phase === "globe-arcs"
                            ? "scale(1)"
                            : "scale(0.8)",
                    pointerEvents:
                        phase === "globe-entry" || phase === "globe-arcs" ? "auto" : "none",
                }}
            >
                <Globe
                    size={350}
                    showArcs={phase === "globe-arcs"}
                    autoRotate={true}
                    scale={phase === "globe-arcs" ? 1.1 : 1}
                />
            </div>

            {/* Logo Reveal Phase */}
            <div
                className="absolute inset-0 flex items-center justify-center transition-all duration-1000"
                style={{
                    opacity: phase === "logo-reveal" || phase === "complete" ? 1 : 0,
                    transform:
                        phase === "logo-reveal" || phase === "complete"
                            ? "scale(1)"
                            : "scale(0.9)",
                }}
            >
                <LandingHero isVisible={phase === "logo-reveal" || phase === "complete"} />
            </div>

            {/* Skip button */}
            {phase !== "complete" && (
                <button
                    onClick={() => {
                        setPhase("complete");
                        onComplete?.();
                    }}
                    className="absolute bottom-8 right-8 text-purple-500/50 hover:text-purple-500 text-sm transition-colors"
                >
                    Skip →
                </button>
            )}
        </div>
    );
}
