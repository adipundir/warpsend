# WarpSend

Send USDC to any wallet or ENS name across chains with one unified balance. Powered by [Circle Gateway](https://developers.circle.com/gateway).

---

## The Problem

- **USDC is siloed per chain.** Your USDC on Ethereum, Base, Avalanche, etc. lives in separate balances. To move value across chains you had to use bridges, wait for attestations, and juggle multiple networks.
- **Sending cross-chain was fragmented.** Recipients had to be on the right chain; you had to switch networks, copy addresses, and pay gas on both sides. No single “send to anyone, anywhere” flow.
- **Receiving was chain-specific.** Requesting payment meant specifying one chain and sharing an address on that chain only.

---

## The Solution

**WarpSend** uses **Circle Gateway** so you get:

1. **One unified balance** — Deposit USDC from any supported chain into Circle’s Gateway. Your balance is aggregated; you see a single “available to send” amount.
2. **Send to anyone, any chain** — Enter a recipient (wallet address or ENS name) and a destination chain. WarpSend burns from your Gateway balance, Circle attestation runs, and USDC is minted to the recipient on the chosen chain. You can scan a WarpSend payment-request QR or enter details manually.
3. **Receive via QR** — Generate a payment-request QR (amount + chain). Anyone with WarpSend can scan it and pay you; funds land in your wallet on the chain you chose.

No manual bridging. You deposit once (from any supported chain), then send and receive across all of them with one balance and one flow.

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

The app uses **ENS** (viem/ens, mainnet) to resolve names to addresses when the user enters an ENS name as recipient.

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
