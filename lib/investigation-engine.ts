import { compactMoney as money, type Evidence, type InvestigationResult, type QueryLog, type RunInput, validAddress } from "./playbooks";

type RecordValue = Record<string, unknown>;
type Call = { log: QueryLog; payload: unknown };
export const record = (value: unknown): RecordValue => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const list = (value: unknown): RecordValue[] => Array.isArray(value) ? value.map(record) : [];
const rows = (call: Call) => list(record(call.payload).data);
const num = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown, fallback = "Unavailable") => typeof value === "string" && value ? value : fallback;
const sum = (values: (number | null)[]) => values.length && values.every(v => v !== null) ? values.reduce<number>((total, v) => total + (v ?? 0), 0) : null;
const pct = (value: number | null) => value === null ? "Unavailable" : `${value.toFixed(1)}%`;
const ratio = (part: number | null, total: number | null) => part !== null && total !== null && total > 0 ? part / total * 100 : null;
const metric = (label: string, value: string, note: string) => ({ label, value, note });
const table = (title: string, call: Call, columns: string[], data: string[][]): Evidence => ({ title, source: call.log.endpoint, columns, rows: data });
const available = (call: Call) => call.log.status === "complete";

export async function callNansen(apiKey: string, endpoint: string, body: object): Promise<Call> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://api.nansen.ai/api/v1${endpoint}`, { method: "POST", headers: { "content-type": "application/json", apikey: apiKey }, body: JSON.stringify(body), signal: controller.signal });
    const payload: unknown = await response.json().catch(() => null);
    const creditsHeader = response.headers.get("x-nansen-credits-used");
    const credits = creditsHeader !== null && Number.isFinite(Number(creditsHeader)) ? Number(creditsHeader) : null;
    const log: QueryLog = { endpoint, status: response.ok && payload !== null ? "complete" : "failed", credits,
      requestId: response.headers.get("x-request-id") ?? undefined, remaining: response.headers.get("x-nansen-credits-remaining") ?? undefined };
    if (log.status === "failed") log.error = response.status === 429 ? "Rate limited. Wait before retrying." : response.status === 401 || response.status === 403 ? "Access denied. Check the server API key and plan." : `Query unavailable (HTTP ${response.status}).`;
    return { log, payload: log.status === "complete" ? payload : null };
  } catch (error) {
    return { log: { endpoint, status: "failed", credits: null, error: error instanceof Error && error.name === "AbortError" ? "Query timed out after 15 seconds." : "Could not reach Nansen." }, payload: null };
  } finally { clearTimeout(timer); }
}

export async function runInvestigation(input: RunInput, apiKey: string): Promise<InvestigationResult> {
  const now = new Date();
  const date = { from: new Date(now.getTime() - input.days * 86400000).toISOString(), to: now.toISOString() };
  const wallet = { address: input.subject, chain: input.chain };
  const token = { token_address: input.subject, chain: input.chain };
  const pagination = { page: 1, per_page: 100 };
  const call = (endpoint: string, body: object) => callNansen(apiKey, endpoint, body);
  let calls: Call[];
  let result: Pick<InvestigationResult, "metrics" | "evidence" | "observations" | "conclusion" | "candidates">;
  switch (input.tool) {
    case "wallet":
      calls = await Promise.all([
        call("/profiler/address/current-balance", { ...wallet, hide_spam_token: true, pagination, order_by: [{ field: "value_usd", direction: "DESC" }] }),
        call("/profiler/address/transactions", { ...wallet, date, pagination }),
        call("/profiler/address/related-wallets", { ...wallet, pagination }),
      ]);
      result = normalizeWallet(calls); break;
    case "trader":
      calls = await Promise.all([
        call("/profiler/address/pnl-summary", { ...wallet, date }),
        call("/profiler/address/pnl", { ...wallet, date, pagination, filters: { show_realized: true }, order_by: [{ field: "pnl_usd_realised", direction: "DESC" }] }),
        call("/profiler/dex-trades", { ...wallet, date, pagination }),
      ]);
      result = normalizeTrader(calls); break;
    case "token":
      calls = await Promise.all([
        call("/tgm/holders", { ...token, pagination, aggregate_by_entity: false, premium_labels: input.enrichment, order_by: [{ field: "ownership_percentage", direction: "DESC" }] }),
        call("/tgm/flow-intelligence", { ...token, timeframe: "7d" }),
        call("/tgm/who-bought-sold", { ...token, date, pagination }),
      ]);
      result = normalizeToken(calls); break;
    case "defi":
      calls = await Promise.all([
        call("/profiler/address/current-balance", { ...wallet, hide_spam_token: true, pagination }),
        call("/portfolio/defi-holdings", { wallet_address: input.subject }),
      ]);
      result = normalizeDefi(calls, input.chain); break;
    case "signal": {
      const screener = await call("/token-screener", { chains: [input.chain], timeframe: input.days === 7 ? "7d" : "30d", filters: { liquidity: { min: input.liquidity }, only_smart_money: true }, pagination: { page: 1, per_page: 5 } });
      calls = [screener];
      const candidates = rows(screener).filter(r => validAddress(str(r.token_address, ""), input.chain)).slice(0, 5);
      if (!available(screener) || candidates.length === 0) {
        result = { metrics: [metric("Candidates", available(screener) ? "0" : "Unavailable", "First screener page")], evidence: [], observations: ["No valid candidates were returned; enrichment was skipped."], conclusion: "No shortlist can be established from this run.", candidates: [] }; break;
      }
      const addresses = candidates.map(r => str(r.token_address));
      const enrichment = await Promise.all([
        call("/smart-money/netflow", { chains: [input.chain], filters: { token_address: addresses }, pagination }),
        call("/smart-money/holdings", { chains: [input.chain], filters: { token_address: addresses }, pagination }),
        ...addresses.map(address => call("/tgm/holders", { chain: input.chain, token_address: address, aggregate_by_entity: false, premium_labels: false, pagination: { page: 1, per_page: 10 }, order_by: [{ field: "ownership_percentage", direction: "DESC" }] })),
      ]);
      calls.push(...enrichment);
      const netflows = rows(enrichment[0]); const holdings = rows(enrichment[1]);
      const netKey = input.days === 7 ? "net_flow_7d_usd" : "net_flow_30d_usd";
      const shortlist = candidates.map((r, i) => {
        const address = str(r.token_address);
        const sameToken = (entry: RecordValue) => str(entry.token_address, "").toLowerCase() === address.toLowerCase();
        const flow = num(netflows.find(sameToken)?.[netKey]);
        const holders = num(holdings.find(sameToken)?.holders_count);
        const concentration = sum(rows(enrichment[i + 2]).slice(0, 10).map(h => num(h.ownership_percentage)));
        const liquidity = num(r.liquidity);
        const passed = liquidity !== null && liquidity >= input.liquidity && holders !== null && holders >= input.smartMoney && flow !== null && flow > 0 && concentration !== null && concentration < 50;
        return { address, symbol: str(r.token_symbol, address), chain: input.chain, passed, reasons: [
          `Liquidity: ${money(liquidity)} · ${liquidity === null ? "unavailable" : liquidity >= input.liquidity ? "passes" : "fails"}`,
          `Smart Money holders: ${holders ?? "unavailable"} · ${holders === null ? "unavailable" : holders >= input.smartMoney ? "passes" : "fails"}`,
          `Netflow: ${money(flow)} · ${flow === null ? "unavailable" : flow > 0 ? "passes" : "fails"}`,
          `Top 10 supply: ${pct(concentration)} · ${concentration === null ? "unavailable" : concentration < 50 ? "passes (<50%)" : "fails (≥50%)"}`,
        ] };
      }).sort((a, b) => Number(b.passed) - Number(a.passed));
      result = { metrics: [metric("Candidates", String(shortlist.length), "Up to five screened tokens"), metric("Passed gates", String(shortlist.filter(r => r.passed).length), "Liquidity, breadth, flow, concentration"), metric("Time window", `${Math.min(input.days, 30)} days`, "Smart Money flow window")], evidence: [table("Screener evidence", screener, ["Token", "Liquidity", "Volume"], candidates.map(r => [str(r.token_symbol), money(num(r.liquidity)), money(num(r.volume))]))], candidates: shortlist, observations: ["Tokens pass only when all four checks have evidence. Missing checks remain unqualified.", "Smart Money labels are a cohort proxy, not proof of wallet skill. Concentration uses the top 10 returned holders; exchange and contract wallets may distort it."], conclusion: `${shortlist.filter(r => r.passed).length} of ${shortlist.length} candidates pass the research gates. Continue with Token Holder & Flow Analysis before forming a view.` };
      break;
    }
  }
  const successes = calls.filter(available).length;
  const status = successes === 0 ? "failed" : successes === calls.length ? "live" : "partial";
  return { tool: input.tool, status, fetchedAt: now.toISOString(), subject: input.tool === "signal" ? `${input.chain} discovery` : input.subject, chain: input.tool === "defi" ? `${input.chain} wallet / cross-chain DeFi` : input.chain, ...result, calls: calls.map(c => c.log), conclusion: status === "failed" ? "No evidence was retrieved. Check the query log and try again." : result.conclusion };
}

export function normalizeWallet(calls: Call[]) {
  const [balance, activity, relationships] = calls;
  const assets = rows(balance); const transactions = rows(activity); const related = rows(relationships);
  const total = sum(assets.map(a => num(a.value_usd)));
  const sorted = [...assets].sort((a, b) => (num(b.value_usd) ?? 0) - (num(a.value_usd) ?? 0));
  const topShare = ratio(num(sorted[0]?.value_usd), total);
  const evidence = [table("Asset composition", balance, ["Asset", "Observed value", "Share of sample"], sorted.slice(0, 12).map(a => [str(a.token_symbol), money(num(a.value_usd)), pct(ratio(num(a.value_usd), total))])),
    table("Wallet relationships", relationships, ["Wallet", "Label", "Relationship"], related.slice(0, 12).map(r => [str(r.address), str(r.address_label, "Unlabelled"), str(r.relation)])),
    table("Recent activity", activity, ["Method", "Sent / received", "Time"], transactions.slice(0, 12).map(t => [str(t.method), `${list(t.tokens_sent).map(a => str(a.token_symbol)).join(", ") || "—"} → ${list(t.tokens_received).map(a => str(a.token_symbol)).join(", ") || "—"}`, str(t.block_timestamp)]))];
  evidence[0].bars = sorted.slice(0, 6).flatMap(a => { const share = ratio(num(a.value_usd), total); return share === null ? [] : [{ label: str(a.token_symbol), value: share, display: pct(share) }]; });
  return { metrics: [metric("Observed assets", money(total), "First page; not total portfolio"), metric("Activity sample", available(activity) ? String(transactions.length) : "Unavailable", "Up to 100 transactions"), metric("Related wallets", available(relationships) ? String(related.length) : "Unavailable", "Returned relationships")], evidence,
    observations: [topShare === null ? "Asset concentration could not be established." : `The largest asset is ${pct(topShare)} of the returned balance sample.`, "A funding or transaction link does not establish common ownership."],
    conclusion: topShare !== null && topShare >= 60 ? "The observed holdings are concentrated. Inspect the transaction direction and relationships before assigning a behavioral label." : "Use the returned activity and relationship evidence together. This sample alone does not establish wallet ownership or intent." };
}

export function normalizeTrader(calls: Call[]) {
  const [summaryCall, pnlCall, tradesCall] = calls;
  const summary = record(summaryCall.payload); const pnl = rows(pnlCall); const trades = rows(tradesCall);
  const realized = num(summary.realized_pnl_usd); const winRate = num(summary.win_rate);
  const profits = pnl.map(t => num(t.pnl_usd_realised)).filter((n): n is number => n !== null);
  const largest = profits.length ? Math.max(...profits) : null;
  const concentration = ratio(largest, realized);
  const remainder = realized !== null && largest !== null ? realized - largest : null;
  return { metrics: [metric("Realized profit", money(realized), "Summary may lag by about an hour"), metric("Win rate", winRate === null ? "Unavailable" : pct(winRate * 100), "API summary · selected window"), metric("Best token / net profit", pct(concentration), "Can exceed 100% when other tokens lose")],
    evidence: [table("Profit by token", pnlCall, ["Token", "Realized PnL", "Unrealized PnL", "Buys / sells"], pnl.slice(0, 12).map(t => [str(t.token_symbol), money(num(t.pnl_usd_realised)), money(num(t.pnl_usd_unrealised)), `${num(t.nof_buys) ?? "—"} / ${num(t.nof_sells) ?? "—"}`])), table("Supporting trades", tradesCall, ["Bought", "Sold", "Trade value"], trades.slice(0, 12).map(t => [str(t.token_bought_symbol), str(t.token_sold_symbol), money(num(t.trade_value_usd))])), table("Summary", summaryCall, ["Measure", "Value"], [["Tokens traded", String(num(summary.traded_token_count) ?? "Unavailable")], ["Trades", String(num(summary.traded_times) ?? "Unavailable")]])],
    observations: [remainder === null ? "Profit excluding the best returned token is unavailable." : `Removing the best returned token leaves ${money(remainder)} in realized PnL.`, "Token-level results cover the first 100 rows. Concentration is an estimate when the account traded more tokens."],
    conclusion: concentration !== null && concentration > 50 ? "The best returned token explains more than half of net realized profit. This is concentrated performance, not proof of repeatability." : "Assess realized profit alongside sample size and individual losses. Historical win rate does not establish future performance." };
}

export function normalizeToken(calls: Call[]) {
  const [holderCall, flowCall, tradersCall] = calls;
  const holders = rows(holderCall); const flows = rows(flowCall); const traders = rows(tradersCall);
  const concentration = sum(holders.slice(0, 10).map(h => num(h.ownership_percentage)));
  const smart = sum(flows.map(f => num(f.smart_trader_net_flow_usd))); const exchange = sum(flows.map(f => num(f.exchange_net_flow_usd)));
  return { metrics: [metric("Top 10 ownership", pct(concentration), "Returned holders · token supply"), metric("Smart Trader netflow", money(smart), "7-day labelled cohort"), metric("Exchange netflow", money(exchange), "7-day labelled cohort")],
    evidence: [table("Largest holders", holderCall, ["Wallet", "Label", "Supply share", "Value"], holders.slice(0, 10).map(h => [str(h.address), str(h.address_label, "Unlabelled"), pct(num(h.ownership_percentage)), money(num(h.value_usd))])), table("Flow intelligence · 7 days", flowCall, ["Cohort", "Netflow", "Wallet count"], flows.flatMap(f => ["smart_trader", "exchange", "whale", "fresh_wallets"].map(cohort => [cohort.replaceAll("_", " "), money(num(f[`${cohort}_net_flow_usd`])), String(num(f[`${cohort}_wallet_count`]) ?? "Unavailable")]))), table("Buyers and sellers", tradersCall, ["Wallet", "Bought", "Sold"], traders.slice(0, 12).map(t => [str(t.address_label, str(t.address)), money(num(t.bought_volume_usd)), money(num(t.sold_volume_usd))]))],
    observations: [concentration === null ? "Holder concentration is unavailable." : `The top 10 returned holders control ${pct(concentration)} of supply.`, "Exchange inflow indicates movement toward exchange-labelled wallets, not a completed sale. Smart Trader and Smart Money cohorts are not interchangeable."],
    conclusion: smart !== null && exchange !== null && smart > 0 && exchange > 0 ? "Smart Trader accumulation coexists with exchange inflow. These signals conflict; inspect holder structure and trade evidence before drawing a conclusion." : "Compare ownership and flow evidence. Missing or one-sided signals do not establish a token's direction." };
}

export function normalizeDefi(calls: Call[], chain: string) {
  const [balanceCall, defiCall] = calls;
  const payload = record(defiCall.payload); const summary = record(payload.summary); const protocols = list(payload.protocols);
  const liquid = sum(rows(balanceCall).map(a => num(a.value_usd)));
  const assets = num(summary.total_assets_usd); const debt = num(summary.total_debts_usd);
  const protocolAssets = protocols.map(p => num(p.total_assets_usd)).filter((v): v is number => v !== null);
  const largest = protocolAssets.length ? Math.max(...protocolAssets) : null;
  const concentration = ratio(largest, assets);
  const byChain = new Map<string, (number | null)[]>();
  protocols.forEach(p => { const key = str(p.chain); byChain.set(key, [...(byChain.get(key) ?? []), num(p.total_assets_usd)]); });
  return { metrics: [metric("Liquid / deployed assets", `${money(liquid)} / ${money(assets)}`, `${chain} wallet sample / all-chain DeFi`), metric("Largest protocol", pct(concentration), "Share of cross-chain deployed assets"), metric("DeFi debt", money(debt), "Health factors not returned by this endpoint")],
    evidence: [table("Protocol exposure", defiCall, ["Protocol", "Chain", "Assets", "Debt", "Rewards"], protocols.map(p => [str(p.protocol_name), str(p.chain), money(num(p.total_assets_usd)), money(num(p.total_debts_usd)), money(num(p.total_rewards_usd))])), table("Chain concentration", defiCall, ["Chain", "Deployed assets", "Share"], [...byChain].map(([key, values]) => [key, money(sum(values)), pct(ratio(sum(values), assets))])), table("Positions", defiCall, ["Protocol", "Token", "Position", "Value"], protocols.flatMap(p => list(p.tokens).map(t => [str(p.protocol_name), str(t.symbol), str(t.position_type), money(num(t.value_usd))])).slice(0, 30))],
    observations: ["Wallet balances cover the selected chain; DeFi positions cover all chains returned by Nansen. A global liquid/deployed percentage is not inferred from different scopes.", "Health factor and liquidation price are unavailable in this endpoint. Missing debt or rewards remain unavailable."],
    conclusion: debt !== null && debt > 0 ? `The portfolio reports ${money(debt)} in DeFi debt. Review protocol concentration and collateral terms; these balances do not establish a liquidation threshold.` : "Review the protocol and chain distribution. Available balances cannot establish liquidation safety." };
}
