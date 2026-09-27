import { z } from "zod";

export const toolIds = ["wallet", "trader", "token", "signal", "defi"] as const;
export type ToolId = (typeof toolIds)[number];
export const chains = ["ethereum", "base", "arbitrum", "polygon", "bnb", "solana"] as const;
export const inputSchema = z.object({
  tool: z.enum(toolIds), chain: z.enum(chains), subject: z.string().trim().max(100).default(""),
  days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
  liquidity: z.number().finite().min(0).max(1e12).default(100000),
  smartMoney: z.number().int().min(1).max(1000).default(3),
  demo: z.boolean().default(true),
  enrichment: z.boolean().default(false),
});
export type RunInput = z.infer<typeof inputSchema>;
export const metricSchema = z.object({ label: z.string(), value: z.string(), note: z.string() });
export const evidenceSchema = z.object({
  title: z.string(), source: z.string(), columns: z.array(z.string()),
  rows: z.array(z.array(z.string())), bars: z.array(z.object({ label: z.string(), value: z.number(), display: z.string() })).optional(),
});
export const resultSchema = z.object({
  tool: z.enum(toolIds), status: z.enum(["live", "demo", "partial", "failed", "cached"]),
  fetchedAt: z.string().datetime(), subject: z.string(), chain: z.string(),
  metrics: z.array(metricSchema), evidence: z.array(evidenceSchema), observations: z.array(z.string()), conclusion: z.string(),
  calls: z.array(z.object({ endpoint: z.string(), status: z.enum(["complete", "failed", "demo"]), credits: z.number().nullable(), error: z.string().optional(), requestId: z.string().optional(), remaining: z.string().optional() })),
  candidates: z.array(z.object({ address: z.string(), symbol: z.string(), chain: z.string(), passed: z.boolean(), reasons: z.array(z.string()) })).optional(),
});
export type InvestigationResult = z.infer<typeof resultSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type QueryLog = InvestigationResult["calls"][number];
type Playbook = {
  id: ToolId; name: string; lesson: string; subtitle: string; objective: string; question: string;
  options: string[]; explanation: string; answer: number; endpoints: string[]; chains: readonly string[];
};
export const playbooks: Playbook[] = [
  { id: "wallet", name: "Wallet Activity & Connections", lesson: "Wallet Activity & Connections", subtitle: "Balances, transactions, and related wallets", objective: "Learn how to follow the first money entering a wallet, spot connected wallets, and separate a useful clue from proof.", question: "Wallet A and Wallet B received their first ETH from the same wallet. What does that tell us?", options: ["The same person definitely owns both wallets", "The wallets are connected, but we need more evidence to claim common ownership", "The link means nothing and can be ignored"], answer: 1, explanation: "The shared funding wallet connects A and B, but it does not identify who controls them. Look for a second clue—such as repeated transfers, matching timing, or the same recurring counterparties—before making a stronger claim.", endpoints: ["/profiler/address/current-balance", "/profiler/address/transactions", "/profiler/address/related-wallets"], chains },
  { id: "trader", name: "Trader PnL Analysis", lesson: "Trader PnL Analysis", subtitle: "PnL, trades, and token-level performance", objective: "Review realized PnL, trade history, win rate, and token-level performance to distinguish repeatable results from one exceptional trade.", question: "Would the demo trader still be profitable without the best token?", options: ["Yes, but profit alone does not prove repeatability", "No, the remaining tokens lose money", "A 62% win rate guarantees future returns"], answer: 0, explanation: "Subtract the largest token profit from total realized profit. A positive remainder is useful evidence, but sample size, losses, and the selected window still matter.", endpoints: ["/profiler/address/pnl-summary", "/profiler/address/pnl", "/profiler/dex-trades"], chains },
  { id: "token", name: "Token Holder & Flow Analysis", lesson: "Token Holder & Flow Analysis", subtitle: "Holders, flows, buyers, and sellers", objective: "Analyze holder concentration, Smart Money activity, exchange flows, and recent buyers and sellers for a token.", question: "What weakens the demo token's accumulation narrative?", options: ["Smart Money inflow alone proves it", "Exchange inflows and concentrated ownership", "A large number of transfers proves demand"], answer: 1, explanation: "Accumulation can coexist with concentrated supply and tokens moving toward exchanges. Treat these as conflicting signals, not a buy or sell instruction.", endpoints: ["/tgm/holders", "/tgm/flow-intelligence", "/tgm/who-bought-sold"], chains },
  { id: "signal", name: "Smart Money Token Screener", lesson: "Smart Money Token Screener", subtitle: "Liquidity and Smart Money filters", objective: "Screen tokens by liquidity and Smart Money participation, then review candidates that meet every selected filter.", question: "Which demo candidate deserves further investigation?", options: ["The largest inflow, regardless of liquidity", "The candidate with the most price appreciation", "The candidate that passes every available evidence gate"], answer: 2, explanation: "A candidate is a research lead. Check liquidity, independent participation, netflow, and the limitations of the wallet labels; never turn a ranking into a guarantee.", endpoints: ["/token-screener", "/smart-money/netflow", "/tgm/holders"], chains },
  { id: "defi", name: "DeFi Portfolio Analysis", lesson: "DeFi Portfolio Analysis", subtitle: "Positions, protocols, chains, and debt", objective: "Review DeFi positions across protocols and chains, including supplied assets, debt, and available health metrics.", question: "Can we infer a liquidation price when health metrics are missing?", options: ["Yes, from total portfolio value", "No; the position needs protocol-specific evidence", "Yes, assuming a 20% collateral drop"], answer: 1, explanation: "Balances and concentration do not establish liquidation thresholds. A missing health factor stays unavailable; inspect collateral, debt, and protocol rules before estimating liquidation risk.", endpoints: ["/profiler/address/current-balance", "/portfolio/defi-holdings"], chains: chains.filter(c => c !== "solana") },
];
export const getPlaybook = (id: ToolId) => playbooks.find(p => p.id === id)!;
export const demoWallet = "0x28c6c06298d514db089934071355e5743bf21d60";
export const demoToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export function defaultInput(tool: ToolId): RunInput { return { tool, chain: "ethereum", subject: tool === "token" ? demoToken : tool === "signal" ? "" : demoWallet, days: 30, liquidity: 100000, smartMoney: 3, demo: true, enrichment: false }; }
export function estimateRun(input: RunInput) {
  if (input.tool === "signal") return { requests: 8, credits: 36, maximum: true };
  if (input.tool === "token") return { requests: 3, credits: input.enrichment ? 152 : 7, maximum: false };
  return { requests: input.tool === "defi" ? 2 : 3, credits: input.tool === "defi" ? 2 : 3, maximum: false };
}
export function validAddress(address: string, chain: string): boolean {
  if (chain !== "solana") return /^0x[0-9a-fA-F]{40}$/.test(address);
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let value = BigInt(0);
  for (const letter of address) value = value * BigInt(58) + BigInt(alphabet.indexOf(letter));
  let bytes = 0;
  while (value > BigInt(0)) { bytes++; value >>= BigInt(8); }
  return bytes + (address.match(/^1*/)?.[0].length ?? 0) === 32;
}
export function validateInput(input: RunInput): string | null {
  if (!getPlaybook(input.tool).chains.includes(input.chain)) return "This tool does not support the selected chain.";
  if (input.tool !== "signal" && !validAddress(input.subject, input.chain)) return `Enter a valid ${input.chain === "solana" ? "Solana" : "EVM"} ${input.tool === "token" ? "token" : "wallet"} address.`;
  return null;
}
export const compactMoney = (value: number | null) => value === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
export const shortAddress = (value: string) => value.length > 22 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;

