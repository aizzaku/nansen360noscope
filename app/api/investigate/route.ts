import { NextResponse } from "next/server";

const NANSEN_BASE_URL = "https://api.nansen.ai/api/v1";
const ALLOWED_CHAINS = ["ethereum", "base", "arbitrum", "polygon", "bnb", "solana"] as const;
type Chain = (typeof ALLOWED_CHAINS)[number];

type NansenEnvelope = { data?: unknown[] };
type CallResult = {
  endpoint: string;
  status: "complete" | "failed";
  credits: string;
  data: unknown[];
};

const DEMO_ADDRESS = "0x28c6c06298d514db089934071355e5743bf21d60";

const demoPayload = {
  mode: "demo" as const,
  fetchedAt: new Date().toISOString(),
  address: DEMO_ADDRESS,
  chain: "ethereum",
  stats: { portfolioValue: 18452031, tokenCount: 23, transactions: 47, relatedWallets: 6 },
  assets: [
    { symbol: "USDT", valueUsd: 8120000, share: 44 },
    { symbol: "ETH", valueUsd: 5351000, share: 29 },
    { symbol: "USDC", valueUsd: 2952000, share: 16 },
    { symbol: "OTHER", valueUsd: 2029031, share: 11 },
  ],
  relations: [
    { address: "0x3f5f2c86a9b74e47ea29411bd73123059c119a21", label: "Exchange deposit", relation: "frequent counterparty", timestamp: "18 min ago" },
    { address: "0x8b14a1e758a2d13fb75b49647f109c42ba82c740", label: "Unlabelled wallet", relation: "first funder", timestamp: "9 days ago" },
    { address: "0xa72d47e98d6c269dbce732afa1ad623849e111e4", label: "DEX router", relation: "contract interaction", timestamp: "2 hours ago" },
    { address: "0x5de88a64cfe40f98718cc119713360862bc540c9", label: "Related wallet", relation: "same funder", timestamp: "12 days ago" },
  ],
  activities: [
    { label: "Large outbound transfer", detail: "1.2M USDT → exchange deposit", timestamp: "18 min" },
    { label: "Asset swap", detail: "420 ETH → USDC via DEX router", timestamp: "2 hr" },
    { label: "Funding link", detail: "A first funder also funded a related wallet", timestamp: "9 d" },
  ],
  calls: [
    { endpoint: "/profiler/address/current-balance", status: "complete" as const, credits: "1" },
    { endpoint: "/profiler/address/transactions", status: "complete" as const, credits: "1" },
    { endpoint: "/profiler/address/related-wallets", status: "complete" as const, credits: "1" },
  ],
  insight: "The wallet behaves like operational infrastructure: frequent exchange deposits, router activity, and a shared-funder relationship outweigh the standalone-wallet hypothesis.",
};

export const runtime = "edge";

export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Provide a wallet address and chain." }, { status: 400 });

  const candidate = input as Record<string, unknown>;
  const address = typeof candidate.address === "string" ? candidate.address.trim() : "";
  const chain = typeof candidate.chain === "string" ? candidate.chain : "";
  if (!ALLOWED_CHAINS.includes(chain as Chain)) return NextResponse.json({ error: "Choose a supported chain." }, { status: 422 });
  if (!isValidAddress(address, chain as Chain)) return NextResponse.json({ error: `Enter a valid ${chain} wallet address.` }, { status: 422 });

  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) return NextResponse.json({ ...demoPayload, address, chain, fetchedAt: new Date().toISOString() });

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const pagination = { page: 1, per_page: 20 };
  const calls = await Promise.all([
    callNansen(apiKey, "/profiler/address/current-balance", { address, chain, hide_spam_token: true, pagination, order_by: [{ field: "value_usd", direction: "DESC" }] }),
    callNansen(apiKey, "/profiler/address/transactions", { address, chain, date: { from: from.toISOString(), to: now.toISOString() }, hide_spam_token: true, pagination }),
    callNansen(apiKey, "/profiler/address/related-wallets", { address, chain, pagination: { page: 1, per_page: 10 } }),
  ]);

  const balances = calls[0].data;
  const transactions = calls[1].data;
  const related = calls[2].data;
  if (calls.every((call) => call.status === "failed")) return NextResponse.json({ error: "Nansen rejected all three queries. Check the API key, credits, and address." }, { status: 502 });

  const normalizedAssets = balances.map(asRecord).map((item) => ({ symbol: stringValue(item.token_symbol, "Unknown"), valueUsd: numberValue(item.value_usd) })).sort((a, b) => b.valueUsd - a.valueUsd);
  const portfolioValue = normalizedAssets.reduce((sum, item) => sum + item.valueUsd, 0);
  const topAssets = normalizedAssets.slice(0, 4).map((item) => ({ ...item, share: portfolioValue > 0 ? Math.round((item.valueUsd / portfolioValue) * 100) : 0 }));
  const relations = related.slice(0, 4).map(asRecord).map((item) => ({
    address: stringValue(item.address, "Unknown wallet"),
    label: stringValue(item.address_label, "Unlabelled wallet"),
    relation: humanize(stringValue(item.relation, "on-chain relation")),
    timestamp: relativeTime(stringValue(item.block_timestamp, "")),
  }));
  const activities = transactions.slice(0, 3).map(asRecord).map((item) => {
    const symbol = stringValue(item.token_symbol, "token");
    const counterparty = stringValue(item.counterparty_name, stringValue(item.counterparty_address, "counterparty"));
    return {
      label: humanize(stringValue(item.method, stringValue(item.source_type, "Transfer"))),
      detail: `${symbol} · ${shortAddress(counterparty)}`,
      timestamp: relativeTime(stringValue(item.block_timestamp, stringValue(item.timestamp, ""))),
    };
  });

  return NextResponse.json({
    mode: "live",
    fetchedAt: now.toISOString(),
    address,
    chain,
    stats: { portfolioValue, tokenCount: balances.length, transactions: transactions.length, relatedWallets: related.length },
    assets: topAssets.length ? topAssets : [{ symbol: "No balances", valueUsd: 0, share: 0 }],
    relations: relations.length ? relations : [{ address, label: "No related wallets returned", relation: "No relation observed", timestamp: "Now" }],
    activities: activities.length ? activities : [{ label: "No recent activity", detail: "No transactions returned for the last 30 days", timestamp: "30 d" }],
    calls: calls.map(({ endpoint, status, credits }) => ({ endpoint, status, credits })),
    insight: buildInsight(normalizedAssets, transactions.length, related.length),
  });
}

async function callNansen(apiKey: string, endpoint: string, body: object): Promise<CallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${NANSEN_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    const envelope = payload && typeof payload === "object" ? payload as NansenEnvelope : {};
    return {
      endpoint,
      status: response.ok ? "complete" : "failed",
      credits: response.headers.get("x-nansen-credits-used") ?? response.headers.get("x-nansen-credits-cost") ?? "—",
      data: response.ok && Array.isArray(envelope.data) ? envelope.data : [],
    };
  } catch {
    return { endpoint, status: "failed", credits: "—", data: [] };
  } finally {
    clearTimeout(timer);
  }
}

function isValidAddress(address: string, chain: Chain) {
  if (chain === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function stringValue(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value : fallback; }
function numberValue(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function shortAddress(value: string) { return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value; }
function relativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Recent";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1_440) return `${Math.round(minutes / 60)} hr ago`;
  return `${Math.round(minutes / 1_440)} d ago`;
}
function buildInsight(assets: { symbol: string; valueUsd: number }[], transactionCount: number, relationCount: number) {
  const total = assets.reduce((sum, asset) => sum + asset.valueUsd, 0);
  const largest = assets[0];
  const share = largest && total > 0 ? Math.round((largest.valueUsd / total) * 100) : 0;
  if (relationCount >= 4) return `This is a connected wallet: Nansen returned ${relationCount} related wallets and ${transactionCount} recent activities. The largest asset, ${largest?.symbol ?? "unknown"}, represents ${share}% of observed value.`;
  if (share >= 60) return `The wallet is highly concentrated: ${largest?.symbol ?? "one asset"} represents ${share}% of observed value. Relationship evidence is limited, so avoid inferring common ownership.`;
  return `The wallet has a relatively distributed asset mix and ${relationCount} observed related wallets. Use transaction direction and timing before assigning a behavioral label.`;
}
