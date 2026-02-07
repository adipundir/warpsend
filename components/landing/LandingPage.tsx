"use client";

import { useEffect, useState } from "react";
import { Globe } from "./Globe";
import { ArrowRight, Zap, Wallet, Link2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto transition-opacity duration-500 bg-background/80 backdrop-blur-md"
                style={{ opacity: isVisible ? 1 : 0 }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                        WarpSend
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={onGetStarted}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
                {/* Background Globe */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700"
                    style={{ opacity: isVisible ? 0.5 : 0 }}
                >
                    <Globe size={550} showArcs={true} autoRotate={true} />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs mb-6 transition-opacity duration-500"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        <Zap className="w-3 h-3" />
                        <span>Powered by Circle Gateway & Arc</span>
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="font-bold tracking-tight text-foreground mb-5 transition-opacity duration-500"
                        style={{
                            fontSize: "clamp(36px, 8vw, 72px)",
                            lineHeight: 1.1,
                            opacity: isVisible ? 1 : 0,
                        }}
                    >
                        Send USDC
                        <br />
                        <span className="text-primary">Across Any Chain</span>
                    </h1>

                    {/* Subheading */}
                    <p
                        className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 transition-opacity duration-500 delay-100"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        Your USDC on Ethereum, Base, Arbitrum, and 5 other chains? 
                        We combine it all into one balance. Send to anyone on any chain in seconds.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 transition-opacity duration-500 delay-200"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        <button
                            onClick={onGetStarted}
                            className="group flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                        >
                            Start Sending
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 delay-300"
                    style={{ opacity: isVisible ? 0.5 : 0 }}
                >
                    <div className="w-5 h-8 border border-border rounded-full flex justify-center pt-1.5">
                        <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">One Balance</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Stop juggling USDC across multiple chains. Combine everything.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Instant</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Arc settles in 0.5 seconds. Send money as fast as you click.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Link2 className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Payment Links</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Create invoices that accept USDC from any chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-muted/20">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Ready to send?
                    </h2>
                    <p className="text-muted-foreground mb-10 text-lg max-w-xl mx-auto">
                        Connect your wallet and start sending USDC across any chain.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all text-lg"
                    >
                        Launch App
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        © 2026 WarpSend
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Powered by Circle Gateway & Arc Network
                    </div>
                </div>
            </footer>
        </div>
    );
}
