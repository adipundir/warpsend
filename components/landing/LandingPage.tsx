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
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Navbar */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto transition-opacity duration-500"
                style={{ opacity: isVisible ? 1 : 0 }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-purple-400">
                        WarpSend
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">
                            How it Works
                        </a>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
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

                {/* Simple gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs mb-6 transition-opacity duration-500"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        <Zap className="w-3 h-3" />
                        <span>Powered by Circle CCTP</span>
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="font-bold text-white mb-5 transition-opacity duration-500"
                        style={{
                            fontSize: "clamp(36px, 8vw, 72px)",
                            lineHeight: 1.1,
                            opacity: isVisible ? 1 : 0,
                        }}
                    >
                        Cross-Chain USDC
                        <br />
                        <span className="text-purple-400">Made Simple</span>
                    </h1>

                    {/* Subheading */}
                    <p
                        className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-8 transition-opacity duration-500 delay-100"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        Send USDC to any address on any chain. No bridging, no wrapped tokens.
                        It just works.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 transition-opacity duration-500 delay-200"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        <button
                            onClick={onGetStarted}
                            className="group flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all"
                        >
                            Start Sending
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <a
                            href="#features"
                            className="px-6 py-3 border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 delay-300"
                    style={{ opacity: isVisible ? 0.5 : 0 }}
                >
                    <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-1.5">
                        <div className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-gray-950">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            Why <span className="text-purple-400">WarpSend</span>?
                        </h2>
                        <p className="text-gray-500 max-w-lg mx-auto text-sm">
                            Cross-chain payments without the usual headaches.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Fast Transfers</h3>
                            <p className="text-gray-500 text-sm">
                                Seconds, not minutes. Circle CCTP handles the heavy lifting.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                                <Shield className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Secure</h3>
                            <p className="text-gray-500 text-sm">
                                Native USDC, no wrapped tokens. Circle's attestation guarantees every transfer.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                                <Globe2 className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Multi-Chain</h3>
                            <p className="text-gray-500 text-sm">
                                Ethereum, Arbitrum, Base, and more. Send to any supported chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-6 bg-gray-950">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            How It <span className="text-purple-400">Works</span>
                        </h2>
                        <p className="text-gray-500 max-w-lg mx-auto text-sm">
                            Three steps to send cross-chain payments.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                1
                            </div>
                            <h3 className="text-lg font-medium mb-2">Connect</h3>
                            <p className="text-gray-500 text-sm">
                                Connect your wallet. We support MetaMask, WalletConnect, and more.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                2
                            </div>
                            <h3 className="text-lg font-medium mb-2">Enter Details</h3>
                            <p className="text-gray-500 text-sm">
                                Recipient address, destination chain, and amount. ENS names work too.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                3
                            </div>
                            <h3 className="text-lg font-medium mb-2">Send</h3>
                            <p className="text-gray-500 text-sm">
                                Confirm the transaction. USDC arrives on the destination chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-t from-purple-900/20 to-gray-950">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">
                        Ready to try <span className="text-purple-400">WarpSend</span>?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Start sending cross-chain payments today.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all"
                    >
                        <Wallet className="w-5 h-5" />
                        Launch App
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-purple-400 font-semibold">WarpSend</div>
                    <p className="text-gray-600 text-xs">
                        © 2026 WarpSend
                    </p>
                </div>
            </footer>
        </div>
    );
}
