"use client";

// Transaction store using localStorage for persistence

export interface Transaction {
    id: string;
    type: "send" | "receive" | "deposit";
    amount: string;
    chainId: number;
    chainName: string;
    recipient?: string;
    sender?: string;
    timestamp: number; // unix ms
    txHash?: string;
    status: "pending" | "completed" | "failed";
}

const STORAGE_KEY = "warpsend-transactions";
const MAX_TRANSACTIONS = 50;

function getStoredTransactions(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as Transaction[];
    } catch {
        return [];
    }
}

function saveTransactions(txs: Transaction[]) {
    if (typeof window === "undefined") return;
    try {
        // Keep only the most recent transactions
        const limited = txs.slice(0, MAX_TRANSACTIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (e) {
        console.error("Failed to save transactions:", e);
    }
}

export function addTransaction(tx: Omit<Transaction, "id">): Transaction {
    const newTx: Transaction = {
        ...tx,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    const existing = getStoredTransactions();
    saveTransactions([newTx, ...existing]);

    // Dispatch event so TransactionHistory can update
    window.dispatchEvent(new CustomEvent("warpsend-transaction-added"));
    return newTx;
}

export function updateTransaction(id: string, updates: Partial<Transaction>) {
    const existing = getStoredTransactions();
    const updated = existing.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
    );
    saveTransactions(updated);
    window.dispatchEvent(new CustomEvent("warpsend-transaction-updated"));
}

export function getTransactions(walletAddress?: string): Transaction[] {
    const txs = getStoredTransactions();
    // Could filter by wallet if we stored sender address - for now return all
    return txs;
}

export function getExplorerUrl(chainId: number, txHash: string): string | null {
    const explorers: Record<number, string> = {
        // Testnets
        11155111: "https://sepolia.etherscan.io",
        421614: "https://sepolia.arbiscan.io",
        84532: "https://sepolia.basescan.org",
        80002: "https://amoy.polygonscan.com",
        43113: "https://testnet.snowtrace.io",
        1301: "https://explorer.arc.org", // Arc testnet - placeholder
        // Mainnets (for future)
        1: "https://etherscan.io",
        42161: "https://arbiscan.io",
        8453: "https://basescan.org",
        137: "https://polygonscan.com",
        43114: "https://snowtrace.io",
    };

    const base = explorers[chainId];
    if (!base) return null;
    return `${base}/tx/${txHash}`;
}

export function clearTransactions() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("warpsend-transactions-cleared"));
}
