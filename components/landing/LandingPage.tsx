"use client";

import { useEffect, useState } from "react";
import { Globe } from "./Globe";
import { ArrowRight, Zap, Shield, Globe2, Wallet } from "lucide-react";

interface LandingPageProps {
    onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animations after mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Navbar */}
            <nav
                className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto transition-all duration-700 ease-out"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(-20px)",
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
                        WarpSend
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                        <a href="#features" className="hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">
                            How it Works
                        </a>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-semibold transition-all backdrop-blur-sm"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Globe - fades in */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ease-out"
                    style={{
                        opacity: isVisible ? 0.2 : 0,
                    }}
                >
                    <Globe size={600} showArcs={true} autoRotate={true} />
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-purple-900/20 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    {/* Badge - animation delay 0.2s */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm mb-8 transition-all duration-700 ease-out"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transitionDelay: "0.2s",
                        }}
                    >
                        <Zap className="w-4 h-4" />
                        <span>Powered by Circle CCTP</span>
                    </div>

                    {/* Main Heading - animation delay 0.4s */}
                    <h1
                        className="font-bold tracking-tight text-white mb-6 transition-all duration-700 ease-out"
                        style={{
                            fontSize: "clamp(40px, 10vw, 80px)",
                            lineHeight: 1.1,
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(30px)",
                            transitionDelay: "0.4s",
                        }}
                    >
                        Send Crypto
                        <br />
                        <span className="text-purple-500">Anywhere, Instantly</span>
                    </h1>

                    {/* Subheading - animation delay 0.6s */}
                    <p
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 transition-all duration-700 ease-out"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transitionDelay: "0.6s",
                        }}
                    >
                        Transfer USDC across chains seamlessly. No bridges, no waiting.
                        Just fast, secure cross-chain payments.
                    </p>

                    {/* CTA Buttons - animation delay 0.8s */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transitionDelay: "0.8s",
                        }}
                    >
                        <button
                            onClick={onGetStarted}
                            className="group flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                        >
                            Start Sending
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="#features"
                            className="px-8 py-4 border border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 text-white font-semibold rounded-full transition-all"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* Scroll indicator - animation delay 1s */}
                <div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? "translateX(-50%) translateY(0)"
                            : "translateX(-50%) translateY(20px)",
                        transitionDelay: "1s",
                    }}
                >
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2 animate-bounce">
                        <div className="w-1.5 h-3 bg-purple-500 rounded-full animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-gradient-to-b from-black to-gray-950">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Why Choose <span className="text-purple-500">WarpSend</span>?
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Experience the future of cross-chain payments with our cutting-edge technology.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                                <Zap className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                            <p className="text-gray-400">
                                Cross-chain transfers in seconds, not minutes. Powered by Circle's CCTP protocol.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                                <Shield className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Secure & Trusted</h3>
                            <p className="text-gray-400">
                                Built on battle-tested infrastructure. Your funds are always safe and secure.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                                <Globe2 className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Multi-Chain</h3>
                            <p className="text-gray-400">
                                Support for all major chains. Send USDC anywhere in the crypto ecosystem.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6 bg-gray-950">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            How It <span className="text-purple-500">Works</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Send cross-chain payments in three simple steps.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Connect Wallet</h3>
                            <p className="text-gray-400">
                                Connect your favorite wallet to get started. We support all major wallets.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Enter Details</h3>
                            <p className="text-gray-400">
                                Enter the recipient address, choose the destination chain, and set the amount.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Send & Done</h3>
                            <p className="text-gray-400">
                                Confirm the transaction and watch your USDC arrive on the destination chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-gradient-to-t from-purple-900/30 to-gray-950">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Ready to <span className="text-purple-500">WarpSend</span>?
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Join thousands of users sending cross-chain payments effortlessly.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="group inline-flex items-center gap-2 px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-full transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                    >
                        <Wallet className="w-6 h-6" />
                        Launch App
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-purple-500 font-bold text-xl">WarpSend</div>
                    <p className="text-gray-500 text-sm">
                        © 2026 WarpSend. Built with ❤️ for the crypto community.
                    </p>
                </div>
            </footer>
        </div>
    );
}
