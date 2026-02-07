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
                className="absolute opacity-30"
                style={{
                    transform: "translateX(30px) translateY(-20px)",
                    transition: "opacity 1s ease-out",
                    opacity: isVisible ? 0.3 : 0,
                }}
            >
                <Globe size={300} showArcs={true} autoRotate={true} />
            </div>

            {/* Main Text */}
            <div
                className="relative z-10 text-center"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "all 0.8s ease-out 0.3s",
                }}
            >
                {/* WARPSEND Logo with Globe as O */}
                <h1
                    className="font-bold tracking-tight text-purple-500"
                    style={{
                        fontSize: "clamp(48px, 12vw, 140px)",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                    }}
                >
                    <span>WARP</span>
                    <span className="relative inline-block">
                        {/* Globe as the 'S' background */}
                        <span className="relative">
                            S
                            <span
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                    transform: "scale(1.2)",
                                    opacity: 0.6,
                                }}
                            >
                                <Globe size={80} showArcs={false} autoRotate={true} />
                            </span>
                        </span>
                    </span>
                    <span>END</span>
                </h1>

                {/* Tagline */}
                <p
                    className="mt-6 text-purple-400/80 text-lg md:text-xl max-w-md mx-auto"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(10px)",
                        transition: "all 0.8s ease-out 0.6s",
                    }}
                >
                    Send crypto anywhere, instantly
                </p>

                {/* CTA Button */}
                <div
                    className="mt-8"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(10px)",
                        transition: "all 0.8s ease-out 0.9s",
                    }}
                >
                    <button
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                        onClick={() => {
                            // Navigate to main app
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
