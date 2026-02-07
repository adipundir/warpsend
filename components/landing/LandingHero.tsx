"use client";

import { Globe } from "./Globe";

interface LandingHeroProps {
    isVisible?: boolean;
}

export function LandingHero({ isVisible = false }: LandingHeroProps) {
    return (
        <div className="relative flex items-center justify-center w-full h-full">
            {/* Background Globe */}
            <div
                className="absolute opacity-20"
                style={{
                    transition: "opacity 0.8s ease-out",
                    opacity: isVisible ? 0.5 : 0,
                }}
            >
                <Globe size={280} showArcs={true} autoRotate={true} />
            </div>

            {/* Main Text */}
            <div
                className="relative z-10 text-center"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "all 0.6s ease-out 0.2s",
                }}
            >
                {/* Logo */}
                <h1
                    className="font-bold tracking-tight text-purple-400"
                    style={{
                        fontSize: "clamp(44px, 10vw, 120px)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                    }}
                >
                    WarpSend
                </h1>

                {/* Tagline */}
                <p
                    className="mt-4 text-purple-400/60 text-base md:text-lg"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transition: "opacity 0.6s ease-out 0.5s",
                    }}
                >
                    Cross-chain USDC, simplified
                </p>

                {/* CTA Button */}
                <div
                    className="mt-6"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transition: "opacity 0.6s ease-out 0.7s",
                    }}
                >
                    <button
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                        onClick={() => {
                            window.location.href = "#app";
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
