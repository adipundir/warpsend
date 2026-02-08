"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Clock, RefreshCw, Wallet } from "lucide-react";
import { supportedChains, CHAIN_ICON_URLS, getChainIconUrl } from "@/lib/chains";
import { getTransactions, getExplorerUrl, type Transaction } from "@/lib/transaction-store";

export function TransactionHistory() {
    const { address, isConnected } = useAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(() => {
        setIsLoading(true);
        try {
            const txs = getTransactions();
            setTransactions(txs);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Listen for transaction updates
    useEffect(() => {
        const onUpdate = () => fetchTransactions();
        window.addEventListener("warpsend-transaction-added", onUpdate);
        window.addEventListener("warpsend-transaction-updated", onUpdate);
        window.addEventListener("warpsend-balance-changed", onUpdate);
        return () => {
            window.removeEventListener("warpsend-transaction-added", onUpdate);
            window.removeEventListener("warpsend-transaction-updated", onUpdate);
            window.removeEventListener("warpsend-balance-changed", onUpdate);
        };
    }, [fetchTransactions]);

    if (!isConnected) return null;

    const getChainIcon = (chainId: number) => {
        return CHAIN_ICON_URLS[chainId] ?? getChainIconUrl(chainId);
    };

    const getChainName = (chainId: number) => {
        return supportedChains.find(c => c.id === chainId)?.name ?? "Unknown";
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getTypeIcon = (type: Transaction["type"]) => {
        switch (type) {
            case "send":
                return <ArrowUpRight className="w-5 h-5" />;
            case "receive":
                return <ArrowDownLeft className="w-5 h-5" />;
            case "deposit":
                return <Wallet className="w-5 h-5" />;
            default:
                return <ArrowDownLeft className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: Transaction["type"]) => {
        switch (type) {
            case "send":
                return "bg-orange-500/10 text-orange-500";
            case "receive":
                return "bg-green-500/10 text-green-500";
            case "deposit":
                return "bg-primary/10 text-primary";
            default:
                return "bg-primary/10 text-primary";
        }
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-card/50 dark:bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <button
                    onClick={fetchTransactions}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
                    aria-label="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {isLoading && transactions.length === 0 ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20">
                            <div className="w-10 h-10 rounded-full shimmer" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 rounded shimmer" />
                                <div className="h-3 w-32 rounded shimmer" />
                            </div>
                            <div className="h-5 w-16 rounded shimmer" />
                        </div>
                    ))}
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 px-4">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No transactions yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                        Your activity will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {transactions.map((tx) => {
                        const explorerUrl = tx.txHash ? getExplorerUrl(tx.chainId, tx.txHash) : null;
                        return (
                            <div
                                key={tx.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors card-hover"
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(tx.type)}`}>
                                    {getTypeIcon(tx.type)}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm capitalize">{tx.type}</span>
                                        {tx.status === "pending" && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getChainIcon(tx.chainId)}
                                            alt=""
                                            className="w-3 h-3 rounded-full"
                                        />
                                        <span>{tx.chainName || getChainName(tx.chainId)}</span>
                                        <span>•</span>
                                        <span>{formatTime(tx.timestamp)}</span>
                                        {tx.recipient && (
                                            <>
                                                <span>•</span>
                                                <span>To {formatAddress(tx.recipient)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right shrink-0">
                                    <p className={`font-mono font-semibold text-sm ${tx.type === "send" ? "text-orange-500" : "text-green-500"
                                        }`}>
                                        {tx.type === "send" ? "-" : "+"}{tx.amount} USDC
                                    </p>
                                    {explorerUrl && (
                                        <a
                                            href={explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            View <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
