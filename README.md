# Nansen 360 NoScope

Nansen 360 NoScope is a beginner-friendly on-chain investigation workspace that turns wallet, trader, token, Smart Money, and DeFi data into guided, evidence-based analysis.

> Choose a tool → add your own key → confirm the cost → review the evidence.

**Verified live:** 106/106 successful Nansen API calls across 11 endpoints and all five tools. See the [validation evidence](./API_VALIDATION.md).

## 60-second walkthrough

[Watch or download the silent submission walkthrough](./videos/nansen360noscope-launch/assets/nansen360noscope-submission-silent.mp4). It covers BYOK setup and a live workflow for every tool.

![Nansen 360 NoScope walkthrough contact sheet](./videos/nansen360noscope-launch/snapshots/submission-contact.jpg)

## Features

- Five focused investigation tools
- Wallet activity and connection mapping
- Trader profitability and concentration analysis
- Token-holder and directional flow analysis
- Smart Money token screening
- Cross-chain DeFi exposure analysis
- Two public case-study inputs for every tool
- Per-tool analysis guides that explain the method
- Live Nansen data using each visitor's own API key
- Locally saved investigation snapshots
- Supported-chain visibility before every run

## How to use it

1. Choose the question you want to investigate.
2. Enter your Nansen API key. It is held only in memory for the current browser tab.
3. Enter a wallet or token, or load a public case study.
4. Choose the chain, time window, and any tool-specific filters.
5. Review the estimated requests and credits, then run the analysis.
6. Read the visual conclusion and inspect the underlying evidence.
7. Save useful investigation results locally for later review.

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
npm run dev
```

Open the app and enter your key in the API-key control. The application does not require a shared server-side Nansen key.

## Bring your own API key

Nansen 360 NoScope uses a bring-your-own-key model:

- The key is held only in the current browser tab's memory. It is not written to local storage, session storage, saved investigations, URLs, logs, or the repository.
- When an analysis runs, the browser sends the key over HTTPS to the app's same-origin API route. The route forwards it to Nansen for that request and does not store or return it.
- Closing or reloading the tab clears the in-memory key. The user can also clear it from the interface.
- The fixed server-side adapters decide which Nansen endpoints may be called; users cannot supply an arbitrary upstream URL.

The key necessarily passes through the app's server route while a request is being processed. “Held in tab memory” means the app does not persist it, not that the server never receives it.

For additional protection, create a dedicated, revocable key for this tool rather than reusing a primary key. If the Nansen dashboard offers per-key credit or rate limits for your account, set conservative limits and monitor usage. Revoke and replace the key immediately if you suspect exposure.

## Vercel deployment

1. Import `aizzaku/nansen360noscope` into Vercel.
2. Keep the project root at the repository root and select the Next.js framework preset.
3. Use the repository's normal install and build commands.
4. Do **not** add `NANSEN_API_KEY` or any visitor key to Vercel environment variables.
5. Deploy, then confirm that a key is requested in the interface and that reloading the page clears it.

Because the application is BYOK, each visitor's Nansen account is responsible for their own API access and credits.

### Post-deployment check

- Open the production URL in a private window.
- Confirm **Investigate** is the default mode.
- Confirm the API-key prompt appears before a paid run.
- Run one public Wallet Activity case and inspect its query log.
- Reload and confirm the key is cleared while the site remains usable.
- Check the tool navigation once at desktop width and once on mobile.

The optional validation script still accepts a local environment variable for maintainers:

```env
NANSEN_API_KEY=your_validation_key
```

This variable is used by `scripts/validate-nansen-api.mjs`, not by the deployed application. `.env.local` is ignored by Git.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Live API surface

The same-origin adapters cover Nansen profiler balances, transactions, related wallets, PnL, DEX trades, token holders and flows, Smart Money holdings/netflows, token screening, and DeFi holdings. Live runs show request status and reported credit use in the query log.

The integration was verified with [106 successful live API calls across all five tools](./API_VALIDATION.md).

## Safety and interpretation

- Public examples are starting points, not ownership claims or investment advice.
- A wallet relationship is a lead until supported by repeated independent evidence.
- Labels, rankings, and Smart Money cohorts require context.
- Missing health metrics or liquidation thresholds remain unavailable rather than being guessed.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix/shadcn primitives, Lucide icons, Vinext/Vite, and Cloudflare-compatible server routes.
