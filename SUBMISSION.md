# Nansen 360 NoScope — Submission Copy

## One-sentence description

Nansen 360 NoScope is a beginner-friendly on-chain investigation workspace that turns wallet, trader, token, Smart Money, and DeFi data into guided, evidence-based analysis.

## Features

- Five focused investigation tools for wallets, traders, tokens, Smart Money signals, and DeFi portfolios
- Wallet activity and connection mapping with balances, transactions, funders, and related wallets
- Trader performance analysis covering realized PnL, trades, win rate, and token-level concentration
- Token research combining holder concentration, Smart Money activity, exchange flows, buyers, and sellers
- Smart Money token screening using liquidity, wallet-participation, and netflow filters
- Cross-chain DeFi exposure analysis covering positions, protocols, supplied assets, and debt
- Per-tool analysis guides, public case-study inputs, live Nansen data through a bring-your-own-key system, and locally saved investigations
- API keys held only in browser-tab memory and transiently forwarded through a same-origin route

## How to use it

1. Choose one of the five investigation tools and define the question you want to answer.
2. Enter your own Nansen API key; it remains in memory for the current browser tab and is not saved by the app.
3. Enter a wallet or token address, or load a public case study; then choose the chain, time window, and filters.
4. Review the estimated credit use, run the live analysis, and read the visual summary, metrics, flow, and evidence in the suggested order.
5. Check the underlying evidence and stated limitations before saving or sharing a conclusion.

## Short social post

Built Nansen 360 NoScope: a beginner-friendly workspace for investigating wallets, trader PnL, token holders and flows, Smart Money signals, and DeFi exposure. Bring your own Nansen API key, run focused live analyses, and move from raw on-chain evidence to a defensible conclusion.

Repository: https://github.com/aizzaku/nansen360noscope

## Longer submission description

Nansen 360 NoScope is an on-chain investigation and learning workspace designed to help newer analysts move from a question to a defensible conclusion. Instead of presenting a dense general-purpose dashboard, it organizes the work into five focused tools: Wallet Activity & Connections, Trader PnL Analysis, Token Holder & Flow Analysis, Smart Money Token Screener, and DeFi Portfolio Analysis.

Each workflow explains what to inspect, presents the most important metrics visually, and keeps the supporting evidence available for review. Public case studies can preload real inputs, while every analysis uses live Nansen data and the visitor's own API access. The accompanying Analyst Guide teaches a repeatable process: verify the subject and scope, read the evidence in order, test alternative explanations, and state what the available data cannot prove.

The bring-your-own-key design avoids a shared project credential. A visitor's key is held only in the current browser tab's memory, sent over HTTPS to a same-origin API route when an analysis runs, and transiently forwarded to Nansen. The application does not persist or log it. Users should create a dedicated, revocable key and apply conservative per-key credit or rate limits if their Nansen dashboard offers them.

The product supports Ethereum, Base, Arbitrum, Polygon, BNB Chain, and Solana where the selected Nansen data and tool allow it. Investigations can be saved locally for later review. The interface is intentionally minimal and uses a forensic, research-instrument design so the analysis remains the focus.

## Repository

https://github.com/aizzaku/nansen360noscope
