# WarpSend

Send USDC to any wallet or ENS name across chains with one unified balance. Powered by [Circle Gateway](https://developers.circle.com/gateway).

**Key points:**

- **Send and receive from any chain to any chain** — One balance, any source chain, any destination chain. No manual bridging.
- **QR code–first** — **Receive:** Create a payment-request QR (amount + chain). The sender scans it; amount and destination chain are filled automatically—they tap confirm and send. **Send:** Scan someone’s payment QR to prefill recipient, amount, and chain, or enter details manually.

---

## The Problem

- **USDC is siloed per chain.** Your USDC on Ethereum, Base, Avalanche, etc. lives in separate balances. To move value across chains you had to use bridges, wait for attestations, and juggle multiple networks.
- **Sending cross-chain was fragmented.** Recipients had to be on the right chain; you had to switch networks, copy addresses, and pay gas on both sides. No single “send to anyone, anywhere” flow.
- **Receiving was chain-specific.** Requesting payment meant specifying one chain and sharing an address on that chain only.

---

## The Solution

**WarpSend** uses **Circle Gateway** so you get:

1. **One unified balance** — Deposit USDC from any supported chain into Circle’s Gateway. Your balance is aggregated; you see a single “available to send” amount.
2. **Send from any chain to any chain** — **Scan a payment QR** to send: the recipient shares a WarpSend payment-request QR (amount + destination chain). You scan it; amount, recipient, and chain are filled automatically—you confirm and send. Or enter recipient (address or ENS) and destination chain manually.
3. **Receive via QR** — Generate a **payment-request QR** (amount + chain you want to receive on). Share it with the sender. They scan the QR in WarpSend; amount and destination chain are selected automatically. They confirm and send; funds land in your wallet on your chosen chain.

**Summary:** Send and receive between any supported chains by scanning a QR code. Create a payment QR when you want to receive; the sender scans it and the amount and chain are set automatically. When sending, scan the recipient’s payment QR for one-tap prefilled payments, or enter details manually.

---

## How the Partners Are Integrated

### Circle Gateway (core infrastructure)

- **Gateway API (testnet):** Used for unified balance and to submit burn intents and retrieve attestations.
- **Gateway contracts:** Same on every chain:
  - **Gateway Wallet** — Users deposit USDC here to credit their unified balance.
  - **Gateway Minter** — Receives attestation + signature; mints USDC to the recipient on the destination chain.
- **EIP-712 burn intents:** User signs a typed burn intent (source/destination domain, recipient, amount, etc.). The app calls the Gateway API, gets attestation and signature, then the payer (or recipient) calls `gatewayMint` on the destination chain.

### Supported chains (integrated networks)

All of these are wired with Circle Gateway domains, testnet USDC addresses, RPCs, and block explorers. Users can **deposit from** and **send to** any of them.

| Chain               | Gateway domain | Notes                    |
|---------------------|----------------|--------------------------|
| **Arc Testnet**     | 26             | Custom chain (viem)      |
| **Ethereum Sepolia**| 0              | viem/chains              |
| **Avalanche Fuji**  | 1              | viem/chains              |
| **Base Sepolia**    | 6              | viem/chains              |
| **Sonic Testnet**   | 13             | Custom chain             |
| **World Chain Sepolia** | 14        | Custom chain             |
| **Sei Testnet**     | 16             | Custom chain (Atlantic-2)|
| **HyperEVM Testnet**| 19             | Custom chain             |

Integration details per chain (in code):

- **`lib/chains.ts`** — Chain definitions, `GATEWAY_DOMAINS`, `USDC_ADDRESSES`, gas/attestation metadata, RPCs used by wagmi.
- **`lib/wagmi.ts`** — Wagmi config with transports for each chain so the app can read balances and send transactions on any of them.
- **`lib/gateway.ts`** — Burn intent construction, Gateway API calls, attestation handling, fee calculation using chain-specific gas.

### ENS (recipient resolution)

- **Purpose:** When sending, the recipient field accepts either a **0x address** or an **ENS name** (e.g. `alice.eth`). ENS names are resolved to an Ethereum address before building the burn intent.
- **Implementation:** `lib/ens.ts` uses **viem** on **Ethereum mainnet** for resolution only (no wallet/transaction on mainnet). Input is normalized with **UTS-46** (`normalize` from `viem/ens`), then **`getEnsAddress`** returns the resolved address. `looksLikeEnsName()` (no `0x`, contains a dot) decides when to call the resolver.
- **Where it’s used:** Send flow (manual entry and after scanning a payment QR): if the recipient looks like an ENS name, we resolve it and use the returned address; otherwise we validate as a 0x address. Invalid or unresolved names show an error.

---

## Tech Stack

- **Next.js** (App Router), **React**, **TypeScript**
- **wagmi** + **RainbowKit** — Wallet connection and multi-chain
- **viem** — Chains, ENS, encoding, contracts
- **Circle Gateway API** — Balances, burn intents, attestations

---

## Getting Started

1. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

2. **Configure env**

   Create `.env.local` with:

   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — From [WalletConnect Cloud](https://cloud.walletconnect.com).

3. Open [http://localhost:3000](http://localhost:3000), connect a wallet (testnet), deposit from any supported chain, then send or receive USDC across chains.

---

## Project structure (relevant to Gateway and chains)

- `app/` — Routes (landing, `/app` for the main balance/send/receive UI).
- `components/` — `unified-balance.tsx` (deposit + Gateway balance), `send-flow.tsx` (send with QR/manual + ENS), `receive-flow.tsx` (request payment QR), modals, UI.
- `lib/` — `chains.ts` (all chain and Gateway domain config), `gateway.ts` (Gateway API, burn intents, attestation), `wagmi.ts`, `ens.ts`, `contracts.ts`.

---

## Deploy

Build and run:

```bash
npm run build
npm start
```

You can deploy the output to any Node host or use the [Vercel](https://vercel.com) integration for Next.js.
