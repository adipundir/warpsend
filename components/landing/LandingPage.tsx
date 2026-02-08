"use client";

import { useEffect, useState } from "react";
import { Globe } from "./Globe";
import { ArrowRight, Zap, Wallet, Link2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";

interface LandingPageProps {
    onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
                style={{ opacity: isVisible ? 1 : 0 }}
            >
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <Logo className="w-full h-full" />
                            </div>
                            <span className="text-lg font-semibold tracking-tight">
                                WarpSend
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <button
                                onClick={onGetStarted}
                                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/25"
                            >
                                Launch App
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Globe */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
                    style={{ opacity: isVisible ? 0.4 : 0 }}
                >
                    <Globe size={600} showArcs={true} autoRotate={true} />
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-8 transition-all duration-700"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(10px)'
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-muted-foreground">Powered by <span className="text-foreground font-medium">Circle Gateway</span></span>
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="font-bold tracking-tighter mb-6 transition-all duration-700 delay-100"
                        style={{
                            fontSize: "clamp(40px, 10vw, 80px)",
                            lineHeight: 1.05,
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                        }}
                    >
                        Send USDC
                        <br />
                        <span className="gradient-text">Across Any Chain</span>
                    </h1>

                    {/* Subheading */}
                    <p
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                        }}
                    >
                        Your USDC on Ethereum, Base, Avalanche, and more?
                        We combine it all into <span className="text-foreground font-medium">one unified balance</span>.
                        Send to anyone, anywhere, instantly.
                    </p>

                    {/* CTA Button */}
                    <div
                        className="flex items-center justify-center transition-all duration-700 delay-300"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
                        }}
                    >
                        <button
                            onClick={onGetStarted}
                            className="group flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02]"
                        >
                            Launch App
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div
                        className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-border/50 transition-all duration-700 delay-500"
                        style={{
                            opacity: isVisible ? 1 : 0,
                        }}
                    >
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold tabular-nums">8</div>
                            <div className="text-sm text-muted-foreground mt-1">Chains</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold tabular-nums">0.5s</div>
                            <div className="text-sm text-muted-foreground mt-1">Speed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold tabular-nums">1</div>
                            <div className="text-sm text-muted-foreground mt-1">Unified Balance</div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-700"
                    style={{ opacity: isVisible ? 0.6 : 0 }}
                >
                    <div className="w-6 h-10 border-2 border-border rounded-full flex justify-center pt-2">
                        <div className="w-1.5 h-3 bg-primary/60 rounded-full animate-bounce" />
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            How it works
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                            Three simple steps to unified cross-chain payments
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass-card rounded-2xl p-8 text-center transition-all hover:scale-[1.02]">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-sm font-medium text-primary mb-2">Step 1</div>
                            <h3 className="text-xl font-semibold mb-3">Deposit</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Add USDC from any chain to your unified Gateway balance
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-8 text-center transition-all hover:scale-[1.02]">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                                <Zap className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-sm font-medium text-primary mb-2">Step 2</div>
                            <h3 className="text-xl font-semibold mb-3">Send</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Pick any destination chain. Instant delivery.
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-8 text-center transition-all hover:scale-[1.02]">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                                <Link2 className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-sm font-medium text-primary mb-2">Step 3</div>
                            <h3 className="text-xl font-semibold mb-3">Receive</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Create QR codes to request payments from anyone
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="glass-card rounded-3xl p-12 md:p-16">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Ready to start?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Connect your wallet and experience seamless cross-chain USDC payments.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-primary/20"
                        >
                            Launch App
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border/50">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Logo className="w-full h-full" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            © 2026 WarpSend
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Powered by Circle Gateway
                    </p>
                </div>
            </footer>
        </div>
    );
}
