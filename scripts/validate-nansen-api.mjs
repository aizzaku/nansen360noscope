#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_ROOT = "https://api.nansen.ai/api/v1";
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const dryRun = args.has("--dry-run") || !execute;
const delayMs = integerArgument("--delay-ms", 450, 0, 60_000);
const limit = integerArgument("--limit", Number.POSITIVE_INFINITY, 1, Number.POSITIVE_INFINITY);

if (execute && args.has("--dry-run")) fail("Choose either --execute or --dry-run, not both.");

const now = new Date();
const date = (days) => ({
  from: new Date(now.getTime() - days * 86_400_000).toISOString(),
  to: now.toISOString(),
});
const pagination = (page, perPage = 50) => ({ page, per_page: perPage });

// All subjects below are public examples already used by the product in
// lib/workflow-examples.ts. Each request varies a meaningful dimension (time
// window, page, tool, address, chain, or screening threshold).
const publicExamples = {
  wallet: [
    { workflow: "Binance 14 wallet map", address: "0x28c6c06298d514db089934071355e5743bf21d60", chain: "ethereum" },
    { workflow: "Related-wallet seed", address: "0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50", chain: "ethereum" },
  ],
  trader: [
    { workflow: "Nansen PnL fixture", address: "0x39d52da6beec991f075eebe577474fd105c5caec", chain: "ethereum" },
    { workflow: "Early Base whale", address: "0x1f5bbef0722b6188b87b29dff530d6cfb5a46967", chain: "base" },
  ],
  token: [
    { workflow: "PEPE holder and flow analysis", token_address: "0x6982508145454ce325ddbe47a25d4ec3d2311933", chain: "ethereum" },
    { workflow: "PENGU holder and flow analysis", token_address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", chain: "solana" },
  ],
  defi: [
    { workflow: "Staking concentration", address: "0x7805a78a3ad50d460efabf32562d1884c3d0259a", chain: "ethereum" },
    { workflow: "Concentrated LP exposure", address: "0xde6b2a06407575b98724818445178c1f5fd53361", chain: "base" },
  ],
};

const plan = [];
const add = (tool, workflow, endpoint, body, purpose) => plan.push({
  sequence: plan.length + 1,
  tool,
  workflow,
  endpoint,
  body,
  purpose,
  fingerprint: createHash("sha256").update(`${endpoint}\n${JSON.stringify(body)}`).digest("hex").slice(0, 16),
});

for (const example of publicExamples.wallet) {
  for (const page of [1, 2, 3]) {
    add("wallet", example.workflow, "/profiler/address/current-balance", { address: example.address, chain: example.chain, hide_spam_token: true, pagination: pagination(page), order_by: [{ field: "value_usd", direction: "DESC" }] }, `Inspect balance page ${page}.`);
    add("wallet", example.workflow, "/profiler/address/related-wallets", { address: example.address, chain: example.chain, pagination: pagination(page) }, `Inspect relationship page ${page}.`);
  }
  for (const days of [7, 30, 90]) for (const page of [1, 2, 3]) {
    add("wallet", example.workflow, "/profiler/address/transactions", { address: example.address, chain: example.chain, date: date(days), pagination: pagination(page) }, `Inspect transaction page ${page} over ${days} days.`);
  }
}

for (const example of publicExamples.trader) {
  for (const days of [7, 30, 90]) {
    add("trader", example.workflow, "/profiler/address/pnl-summary", { address: example.address, chain: example.chain, date: date(days) }, `Compare the ${days}-day PnL summary.`);
    for (const page of [1, 2, 3]) {
      add("trader", example.workflow, "/profiler/address/pnl", { address: example.address, chain: example.chain, date: date(days), pagination: pagination(page), filters: { show_realized: true }, order_by: [{ field: "pnl_usd_realised", direction: "DESC" }] }, `Inspect token PnL page ${page} over ${days} days.`);
      add("trader", example.workflow, "/profiler/dex-trades", { address: example.address, chain: example.chain, date: date(days), pagination: pagination(page) }, `Inspect DEX trade page ${page} over ${days} days.`);
    }
  }
}

for (const example of publicExamples.token) {
  for (const page of [1, 2, 3]) {
    add("token", example.workflow, "/tgm/holders", { token_address: example.token_address, chain: example.chain, pagination: pagination(page), aggregate_by_entity: false, premium_labels: false, order_by: [{ field: "ownership_percentage", direction: "DESC" }] }, `Inspect holder page ${page}.`);
  }
  add("token", example.workflow, "/tgm/flow-intelligence", { token_address: example.token_address, chain: example.chain, timeframe: "7d" }, "Compare labelled cohort flows over seven days.");
  for (const days of [7, 30, 90]) for (const page of [1, 2, 3]) {
    add("token", example.workflow, "/tgm/who-bought-sold", { token_address: example.token_address, chain: example.chain, date: date(days), pagination: pagination(page) }, `Inspect buyer/seller page ${page} over ${days} days.`);
  }
}

for (const example of publicExamples.defi) {
  for (const page of [1, 2]) {
    add("defi", example.workflow, "/profiler/address/current-balance", { address: example.address, chain: example.chain, hide_spam_token: true, pagination: pagination(page) }, `Compare liquid balance page ${page} with deployed positions.`);
  }
  add("defi", example.workflow, "/portfolio/defi-holdings", { wallet_address: example.address }, "Inspect cross-chain DeFi protocol exposure.");
}

add("signal", "Emerging Ethereum flow", "/token-screener", { chains: ["ethereum"], timeframe: "7d", filters: { liquidity: { min: 1_000_000 }, only_smart_money: true }, pagination: { page: 1, per_page: 5 } }, "Test the strict Ethereum discovery preset.");
add("signal", "Early Base discovery", "/token-screener", { chains: ["base"], timeframe: "7d", filters: { liquidity: { min: 250_000 }, only_smart_money: true }, pagination: { page: 1, per_page: 5 } }, "Test the exploratory Base discovery preset.");

const duplicateFingerprints = duplicates(plan.map((request) => request.fingerprint));
if (duplicateFingerprints.length) fail(`Plan contains duplicate requests: ${duplicateFingerprints.join(", ")}`);
if (plan.length < 100) fail(`Validation plan must contain at least 100 calls; found ${plan.length}.`);

const selectedPlan = plan.slice(0, limit);
const coverage = summarizePlan(selectedPlan);
console.log(`${dryRun ? "Dry run" : "Live validation"}: ${selectedPlan.length} of ${plan.length} planned upstream calls.`);
console.log(`Coverage: ${Object.entries(coverage.tools).map(([tool, count]) => `${tool}=${count}`).join(", ")}`);
console.log(`Endpoints: ${Object.keys(coverage.endpoints).length}; unique request fingerprints: ${new Set(selectedPlan.map((request) => request.fingerprint)).size}.`);

if (dryRun) {
  console.log("No network requests were made. Run with --execute after reviewing the plan.");
  process.exit(0);
}

const apiKey = process.env.NANSEN_API_KEY || readEnvLocal("NANSEN_API_KEY");
if (!apiKey) fail("NANSEN_API_KEY was not found in the environment or .env.local.");

const startedAt = new Date();
const results = [];
let consecutiveRateLimits = 0;
let stoppedReason = null;

for (const request of selectedPlan) {
  if (results.length) await wait(delayMs);
  const result = await executeRequest(request, apiKey);
  results.push(result);
  console.log(`[${results.length}/${selectedPlan.length}] ${result.tool} ${result.endpoint} ${result.httpStatus ?? result.status} credits=${result.credits ?? "unknown"} request=${result.requestId ?? "unknown"}`);

  if (result.httpStatus === 401 || result.httpStatus === 403) {
    stoppedReason = `Authentication or authorization failed (HTTP ${result.httpStatus}).`;
    break;
  }
  if (result.httpStatus === 429) {
    consecutiveRateLimits += 1;
    if (consecutiveRateLimits >= 3) {
      stoppedReason = "Stopped after three consecutive rate-limited requests.";
      break;
    }
    await wait(Math.min(30_000, 2 ** consecutiveRateLimits * 2_000));
  } else {
    consecutiveRateLimits = 0;
  }
}

const finishedAt = new Date();
const outputDirectory = join(PROJECT_ROOT, "outputs");
mkdirSync(outputDirectory, { recursive: true });
const stamp = finishedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");
const report = buildReport({ startedAt, finishedAt, plan: selectedPlan, results, stoppedReason });
const jsonPath = join(outputDirectory, `nansen-api-validation-${stamp}.json`);
const markdownPath = join(outputDirectory, `nansen-api-validation-${stamp}.md`);
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(markdownPath, markdownReport(report), "utf8");
console.log(`Reports written to ${jsonPath} and ${markdownPath}.`);
if (stoppedReason) fail(stoppedReason);
if (results.length < 100) fail(`Only ${results.length} upstream calls completed; the 100-call target was not reached.`);

async function executeRequest(request, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const requestedAt = new Date();
  try {
    const response = await fetch(`${API_ROOT}${request.endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: apiKey },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return {
      sequence: request.sequence,
      tool: request.tool,
      workflow: request.workflow,
      endpoint: request.endpoint,
      purpose: request.purpose,
      fingerprint: request.fingerprint,
      requestedAt: requestedAt.toISOString(),
      durationMs: Date.now() - requestedAt.getTime(),
      status: response.ok ? "complete" : response.status === 429 ? "rate_limited" : "failed",
      httpStatus: response.status,
      credits: headerNumber(response, ["x-nansen-credits-used", "x-nansen-credits-cost"]),
      creditsRemaining: headerText(response, ["x-nansen-credits-remaining"]),
      requestId: headerText(response, ["x-request-id", "x-nansen-request-id", "cf-ray"]),
      responseRows: Array.isArray(payload?.data) ? payload.data.length : null,
    };
  } catch (error) {
    return {
      sequence: request.sequence,
      tool: request.tool,
      workflow: request.workflow,
      endpoint: request.endpoint,
      purpose: request.purpose,
      fingerprint: request.fingerprint,
      requestedAt: requestedAt.toISOString(),
      durationMs: Date.now() - requestedAt.getTime(),
      status: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error",
      httpStatus: null,
      credits: null,
      creditsRemaining: null,
      requestId: null,
      responseRows: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildReport({ startedAt, finishedAt, plan, results, stoppedReason }) {
  const totalCredits = results.reduce((sum, result) => sum + (result.credits ?? 0), 0);
  const byStatus = Object.fromEntries([...new Set(results.map((result) => result.status))].map((status) => [status, results.filter((result) => result.status === status).length]));
  return {
    schemaVersion: 1,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    plannedCalls: plan.length,
    attemptedCalls: results.length,
    completedCalls: results.filter((result) => result.status === "complete").length,
    totalCredits,
    stoppedReason,
    coverage: summarizePlan(plan),
    byStatus,
    results,
  };
}

function markdownReport(report) {
  const statusRows = Object.entries(report.byStatus).map(([status, count]) => `| ${status} | ${count} |`).join("\n") || "| No calls | 0 |";
  const toolRows = Object.entries(report.coverage.tools).map(([tool, count]) => `| ${tool} | ${count} |`).join("\n");
  return `# Nansen API validation report\n\n- Started: ${report.startedAt}\n- Finished: ${report.finishedAt}\n- Planned calls: ${report.plannedCalls}\n- Attempted calls: ${report.attemptedCalls}\n- Successful calls: ${report.completedCalls}\n- Reported credits used: ${report.totalCredits}\n- Stopped reason: ${report.stoppedReason ?? "None"}\n\n## Status\n\n| Status | Calls |\n|---|---:|\n${statusRows}\n\n## Tool coverage\n\n| Tool | Planned calls |\n|---|---:|\n${toolRows}\n\n## Privacy\n\nThe report records public workflow labels, endpoints, request fingerprints, status codes, credit headers, request IDs, response row counts, and timing. It does not contain the API key or response payloads.\n`;
}

function summarizePlan(requests) {
  const countBy = (key) => requests.reduce((counts, request) => ({ ...counts, [request[key]]: (counts[request[key]] ?? 0) + 1 }), {});
  return { tools: countBy("tool"), endpoints: countBy("endpoint") };
}

function readEnvLocal(name) {
  const path = join(PROJECT_ROOT, ".env.local");
  if (!existsSync(path)) return "";
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] !== name) continue;
    return match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return "";
}

function integerArgument(name, fallback, minimum, maximum) {
  const prefix = `${name}=`;
  const raw = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  if (!raw) return fallback;
  const value = Number(raw.slice(prefix.length));
  if (!Number.isInteger(value) || value < minimum || value > maximum) fail(`${name} must be an integer between ${minimum} and ${maximum}.`);
  return value;
}

function headerText(response, names) {
  for (const name of names) {
    const value = response.headers.get(name);
    if (value) return value;
  }
  return null;
}

function headerNumber(response, names) {
  const value = headerText(response, names);
  return value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
}

function duplicates(values) {
  const seen = new Set();
  const found = new Set();
  for (const value of values) {
    if (seen.has(value)) found.add(value);
    else seen.add(value);
  }
  return [...found];
}

function wait(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
function fail(message) { console.error(message); process.exit(1); }
