"use client";

import { useState, useCallback, useRef } from "react";
import { LoadingCounter } from "./LoadingCounter";
import { Globe } from "./Globe";

type AnimationPhase = "loading" | "globe-entry" | "globe-arcs";

interface AnimatedLandingProps {
    onComplete?: () => void;
}

export function AnimatedLanding({ onComplete }: AnimatedLandingProps) {
    const [phase, setPhase] = useState<AnimationPhase>("loading");
    const [isExiting, setIsExiting] = useState(false);
    const onCompleteRef = useRef(onComplete);
    const isExitingRef = useRef(false);
    onCompleteRef.current = onComplete;
    isExitingRef.current = isExiting;

    const handleLoadingComplete = useCallback(() => {
        setPhase("globe-entry");
        setTimeout(() => setPhase("globe-arcs"), 200);
        // After globe is visible, fade out and transition to main landing (hero section)
        setTimeout(() => setIsExiting(true), 1000);
    }, []);

    const handleExitTransitionEnd = useCallback((e: React.TransitionEvent) => {
        if (e.propertyName === "opacity" && isExitingRef.current) {
            onCompleteRef.current?.();
        }
    }, []);

    return (
        <div
            className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden"
            style={{
                zIndex: 50,
                opacity: isExiting ? 0 : 1,
                transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onTransitionEnd={handleExitTransitionEnd}
        >
            {/* Loading Phase */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    opacity: phase === "loading" ? 1 : 0,
                    pointerEvents: phase === "loading" ? "auto" : "none",
                    transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <LoadingCounter duration={700} onComplete={handleLoadingComplete} />
            </div>

            {/* Globe Phase — after loading, show globe then transition to main landing */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    opacity: phase === "globe-entry" || phase === "globe-arcs" ? 1 : 0,
                    transform: phase === "globe-entry" || phase === "globe-arcs" ? "scale(1)" : "scale(0.95)",
                    pointerEvents: phase === "globe-entry" || phase === "globe-arcs" ? "auto" : "none",
                    transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <Globe
                    size={350}
                    showArcs={phase === "globe-arcs"}
                    autoRotate={true}
                    scale={phase === "globe-arcs" ? 1.1 : 1}
                />
            </div>

            {/* Skip button */}
            {!isExiting && (
                <button
                    onClick={() => setIsExiting(true)}
                    className="absolute bottom-8 right-8 text-primary/50 hover:text-primary text-sm transition-colors"
                >
                    Skip →
                </button>
            )}
        </div>
    );
}
