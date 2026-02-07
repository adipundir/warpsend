"use client";

import { useEffect, useState } from "react";
import { Globe } from "./Globe";
import { ArrowRight, Zap, Shield, Globe2, Wallet, Check, ChevronDown, ChevronUp, DollarSign, Clock, Link2 } from "lucide-react";

interface LandingPageProps {
    onGetStarted?: () => void;
}

// FAQ data
const faqs = [
    {
        question: "What is Circle CCTP?",
        answer: "Circle's Cross-Chain Transfer Protocol (CCTP) enables native USDC transfers between blockchains. Unlike bridges that use wrapped tokens, CCTP burns USDC on the source chain and mints native USDC on the destination chain."
    },
    {
        question: "Which chains are supported?",
        answer: "WarpSend currently supports Ethereum, Arbitrum, Base, Optimism, Polygon, and Avalanche. More chains are added as Circle expands CCTP support."
    },
    {
        question: "How long do transfers take?",
        answer: "Most transfers complete in under 2 minutes. The exact time depends on the source and destination chains' block confirmation times."
    },
    {
        question: "Are there any fees?",
        answer: "WarpSend charges no platform fees. You only pay the network gas fees for the transaction on the source chain."
    },
    {
        question: "Is it safe?",
        answer: "Yes. CCTP is built and operated by Circle, the issuer of USDC. Every transfer is cryptographically attested by Circle's infrastructure, ensuring your funds are secure."
    }
];

// Supported chains
const supportedChains = [
    { name: "Ethereum", color: "#627EEA" },
    { name: "Arbitrum", color: "#28A0F0" },
    { name: "Base", color: "#0052FF" },
    { name: "Optimism", color: "#FF0420" },
    { name: "Polygon", color: "#8247E5" },
    { name: "Avalanche", color: "#E84142" },
];

// Stats
const stats = [
    { value: "6+", label: "Supported Chains", icon: Link2 },
    { value: "<2min", label: "Average Transfer Time", icon: Clock },
    { value: "$0", label: "Platform Fees", icon: DollarSign },
    { value: "100%", label: "Native USDC", icon: Shield },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-border last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
            >
                <span className="font-medium">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
            </button>
            <div
                className="overflow-hidden transition-all duration-300"
                style={{
                    maxHeight: isOpen ? "200px" : "0",
                    opacity: isOpen ? 1 : 0,
                }}
            >
                <p className="pb-5 text-muted-foreground text-sm leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
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
                    <span className="text-xl font-semibold text-primary">
                        WarpSend
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">
                            How it Works
                        </a>
                        <a href="#faq" className="hover:text-foreground transition-colors">
                            FAQ
                        </a>
                    </div>
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

                {/* Simple gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs mb-6 transition-opacity duration-500"
                        style={{ opacity: isVisible ? 1 : 0 }}
                    >
                        <Zap className="w-3 h-3" />
                        <span>Powered by Circle CCTP</span>
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="font-bold text-foreground mb-5 transition-opacity duration-500"
                        style={{
                            fontSize: "clamp(36px, 8vw, 72px)",
                            lineHeight: 1.1,
                            opacity: isVisible ? 1 : 0,
                        }}
                    >
                        Cross-Chain USDC
                        <br />
                        <span className="text-primary">Made Simple</span>
                    </h1>

                    {/* Subheading */}
                    <p
                        className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 transition-opacity duration-500 delay-100"
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
                            className="group flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                        >
                            Start Sending
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <a
                            href="#features"
                            className="px-6 py-3 border border-border hover:border-primary/50 text-foreground font-medium rounded-lg transition-colors"
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
                    <div className="w-5 h-8 border border-border rounded-full flex justify-center pt-1.5">
                        <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Stats Section */}
            <section className="py-16 px-6 border-y border-border bg-muted/20">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                                    <stat.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Supported Chains Section */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-xl md:text-2xl font-bold mb-2">
                            Supported <span className="text-primary">Chains</span>
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Send USDC seamlessly across all major networks
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        {supportedChains.map((chain, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: chain.color }}
                                >
                                    {chain.name.charAt(0)}
                                </div>
                                <span className="font-medium">{chain.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            Why <span className="text-primary">WarpSend</span>?
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                            Cross-chain payments without the usual headaches.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Fast Transfers</h3>
                            <p className="text-muted-foreground text-sm">
                                Seconds, not minutes. Circle CCTP handles the heavy lifting.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Secure</h3>
                            <p className="text-muted-foreground text-sm">
                                Native USDC, no wrapped tokens. Circle&apos;s attestation guarantees every transfer.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Globe2 className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Multi-Chain</h3>
                            <p className="text-muted-foreground text-sm">
                                Ethereum, Arbitrum, Base, and more. Send to any supported chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-6 bg-muted/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            How It <span className="text-primary">Works</span>
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                            Three steps to send cross-chain payments.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                1
                            </div>
                            <h3 className="text-lg font-medium mb-2">Connect</h3>
                            <p className="text-muted-foreground text-sm">
                                Connect your wallet. We support MetaMask, WalletConnect, and more.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                2
                            </div>
                            <h3 className="text-lg font-medium mb-2">Enter Details</h3>
                            <p className="text-muted-foreground text-sm">
                                Recipient address, destination chain, and amount. ENS names work too.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                                3
                            </div>
                            <h3 className="text-lg font-medium mb-2">Send</h3>
                            <p className="text-muted-foreground text-sm">
                                Confirm the transaction. USDC arrives on the destination chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            WarpSend vs <span className="text-primary">Traditional Bridges</span>
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                            See why native USDC transfers are the better choice.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">Feature</th>
                                    <th className="px-6 py-4 text-center font-medium text-primary">WarpSend</th>
                                    <th className="px-6 py-4 text-center font-medium text-muted-foreground">Other Bridges</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-6 py-4 text-sm">Token Type</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                            <Check className="w-4 h-4" /> Native USDC
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">Wrapped tokens</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm">Transfer Time</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                            <Check className="w-4 h-4" /> ~2 minutes
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">10-30 minutes</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm">Platform Fees</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                            <Check className="w-4 h-4" /> Free
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">0.1% - 0.5%</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm">Security</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                            <Check className="w-4 h-4" /> Circle-backed
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">Third-party validators</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 px-6 bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            Frequently Asked <span className="text-primary">Questions</span>
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                            Everything you need to know about WarpSend.
                        </p>
                    </div>

                    <div className="bg-card rounded-xl border border-border px-6">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-t from-primary/10 to-muted/30">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">
                        Ready to try <span className="text-primary">WarpSend</span>?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Start sending cross-chain payments today.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                    >
                        <Wallet className="w-5 h-5" />
                        Launch App
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-primary font-semibold text-lg">WarpSend</div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
                            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            © 2026 WarpSend. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
