# Nansen 360 NoScope

Nansen 360 NoScope is a beginner-friendly on-chain investigation workspace that turns wallet, trader, token, Smart Money, and DeFi data into guided, evidence-based analysis.

## Features

- Five focused investigation tools
- Wallet activity and connection mapping
- Trader profitability and concentration analysis
- Token-holder and directional flow analysis
- Smart Money token screening
- Cross-chain DeFi exposure analysis
- Two public example workflows for every tool
- Guided investigations that teach the analysis method
- Sample mode without credits and optional live Nansen data
- Locally saved investigation snapshots
- Supported-chain visibility before every run

## How to use it

1. Choose the question you want to investigate.
2. Enter a wallet or token, or load a public example.
3. Select Sample or Live data.
4. Run the analysis.
5. Read the visual conclusion and key metrics.
6. Open the underlying evidence before drawing a conclusion.
7. Save useful investigations for later.

Use the compact **Analysis guide** inside every Investigate tool. For the complete evidence checks, metric definitions, mistakes, and conclusion limits, read the [Analyst Guide](./ANALYST_GUIDE.md).

## Tools

| Tool | What it helps answer |
| --- | --- |
| Wallet Activity & Connections | What does this wallet hold, do, and connect to? |
| Trader PnL Analysis | Are the trader's profits repeatable or concentrated in one trade? |
| Token Holder & Flow Analysis | Who owns the token and where is money moving? |
| Smart Money Token Screener | Which tokens pass the selected liquidity and wallet-breadth filters? |
| DeFi Portfolio Analysis | Where is a wallet deployed, concentrated, and carrying debt? |

## Local setup

Requires Node.js `>=22.13.0`.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Add the live key only to `.env.local`:

```env
NANSEN_API_KEY=your_server_side_key
```

The key remains server-side and `.env.local` is ignored by Git.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Live API surface

The server adapters cover Nansen profiler balances, transactions, related wallets, PnL, DEX trades, token holders and flows, Smart Money holdings/netflows, token screening, and DeFi holdings. Live runs show request status and reported credit use in the query log.

The integration was verified with [106 successful live API calls across all five tools](./API_VALIDATION.md).

Without a key, the product remains fully reviewable through explicitly labelled sample data. Sample conclusions are teaching fixtures, not measurements of the entered address.

## Safety and interpretation

- Public examples are starting points, not ownership claims or investment advice.
- A wallet relationship is a lead until supported by repeated independent evidence.
- Labels, rankings, and Smart Money cohorts require context.
- Missing health metrics or liquidation thresholds remain unavailable rather than being guessed.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix/shadcn primitives, Lucide icons, Vinext/Vite, and Cloudflare-compatible server routes.
