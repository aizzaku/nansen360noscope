"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Database,
  GitBranch,
  LoaderCircle,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CaseFile = {
  number: string;
  title: string;
  kicker: string;
  level: string;
  minutes: number;
  icon: typeof Search;
  objective: string;
  question: string;
  endpoints: string[];
  metrics: { label: string; value: string; note: string }[];
  conclusion: string;
};

type InvestigationResult = {
  mode: "demo" | "live";
  fetchedAt: string;
  address: string;
  chain: string;
  stats: {
    portfolioValue: number;
    tokenCount: number;
    transactions: number;
    relatedWallets: number;
  };
  assets: { symbol: string; valueUsd: number; share: number }[];
  relations: {
    address: string;
    label: string;
    relation: string;
    timestamp: string;
  }[];
  activities: {
    label: string;
    detail: string;
    timestamp: string;
  }[];
  calls: { endpoint: string; status: "complete" | "failed"; credits: string }[];
  insight: string;
};

const cases: CaseFile[] = [
  {
    number: "01",
    title: "Follow the money",
    kicker: "Wallet investigation",
    level: "Foundational",
    minutes: 8,
    icon: GitBranch,
    objective: "Trace a wallet from holdings to activity, then test whether connected wallets change the story.",
    question: "Is this a standalone wallet—or part of a coordinated network?",
    endpoints: ["Current balance", "Transactions", "Related wallets"],
    metrics: [
      { label: "Signal", value: "Funding path", note: "Start with the first meaningful transfer." },
      { label: "Trap", value: "Label bias", note: "A label is context, not a verdict." },
      { label: "Output", value: "Evidence graph", note: "Every edge must map to activity." },
    ],
    conclusion: "A relationship is a lead. Timing, direction, and repeated interaction turn it into evidence.",
  },
  {
    number: "02",
    title: "Trader or lucky?",
    kicker: "Performance audit",
    level: "Intermediate",
    minutes: 10,
    icon: Target,
    objective: "Separate repeatable trading skill from a single token that carried the wallet's result.",
    question: "Would you copy this wallet after removing its best trade?",
    endpoints: ["PnL summary", "PnL detail", "DEX trades"],
    metrics: [
      { label: "Realized PnL", value: "$184.2K", note: "Profits already locked in." },
      { label: "Win rate", value: "62%", note: "Across 87 closed positions." },
      { label: "Top trade share", value: "71%", note: "Most profit came from one bet." },
    ],
    conclusion: "The wallet is profitable, but not yet proven repeatable: one position explains most realized gains.",
  },
  {
    number: "03",
    title: "Token due diligence",
    kicker: "Market structure",
    level: "Advanced",
    minutes: 12,
    icon: Radar,
    objective: "Test a bullish token narrative against holder concentration and exchange-bound flows.",
    question: "Healthy accumulation—or sophisticated exit liquidity?",
    endpoints: ["Token holders", "Flow intelligence", "Who bought / sold"],
    metrics: [
      { label: "Top 10 share", value: "47.8%", note: "Concentrated ownership." },
      { label: "Smart money", value: "+$1.8M", note: "Seven-day netflow." },
      { label: "Exchange flow", value: "+$4.1M", note: "Tokens moving toward sell venues." },
    ],
    conclusion: "Smart-money accumulation is real, but rising exchange inflow creates a direct contradiction to monitor.",
  },
  {
    number: "04",
    title: "Find the signal",
    kicker: "Smart money discovery",
    level: "Advanced",
    minutes: 11,
    icon: Sparkles,
    objective: "Build a discovery funnel that ranks tokens without treating raw inflow as proof.",
    question: "Which signal survives liquidity, concentration, and wallet-quality checks?",
    endpoints: ["Token screener", "Smart money netflow", "Wallet profiler"],
    metrics: [
      { label: "Candidates", value: "28", note: "Passed initial screener." },
      { label: "Qualified", value: "4", note: "Passed three evidence gates." },
      { label: "Best signal", value: "AERO", note: "Broad buyers, liquid market." },
    ],
    conclusion: "The useful signal is agreement across independent checks—not the largest inflow on the board.",
  },
  {
    number: "05",
    title: "DeFi X-ray",
    kicker: "Exposure mapping",
    level: "Intermediate",
    minutes: 9,
    icon: ShieldCheck,
    objective: "Reveal where a wallet is exposed across protocols, chains, debt, and liquid reserves.",
    question: "What breaks first if collateral falls 20%?",
    endpoints: ["DeFi holdings", "Current balance", "Historical balance"],
    metrics: [
      { label: "Deployed", value: "78%", note: "Share outside the wallet." },
      { label: "Largest protocol", value: "43%", note: "Single-protocol concentration." },
      { label: "Health factor", value: "1.34", note: "Limited liquidation buffer." },
    ],
    conclusion: "The main risk is not chain exposure; it is leverage concentrated in one lending market.",
  },
];

const demoResult: InvestigationResult = {
  mode: "demo",
  fetchedAt: "2026-09-23T10:00:00.000Z",
  address: "0x28c6c06298d514db089934071355e5743bf21d60",
  chain: "ethereum",
  stats: { portfolioValue: 18452031, tokenCount: 23, transactions: 47, relatedWallets: 6 },
  assets: [
    { symbol: "USDT", valueUsd: 8120000, share: 44 },
    { symbol: "ETH", valueUsd: 5351000, share: 29 },
    { symbol: "USDC", valueUsd: 2952000, share: 16 },
    { symbol: "OTHER", valueUsd: 2029031, share: 11 },
  ],
  relations: [
    { address: "0x3f5…9a21", label: "Exchange deposit", relation: "frequent counterparty", timestamp: "18 min ago" },
    { address: "0x8b1…c740", label: "Unlabelled wallet", relation: "first funder", timestamp: "9 days ago" },
    { address: "0xa72…11e4", label: "DEX router", relation: "contract interaction", timestamp: "2 hours ago" },
    { address: "0x5de…40c9", label: "Related wallet", relation: "same funder", timestamp: "12 days ago" },
  ],
  activities: [
    { label: "Large outbound transfer", detail: "1.2M USDT → exchange deposit", timestamp: "18 min" },
    { label: "Asset swap", detail: "420 ETH → USDC via DEX router", timestamp: "2 hr" },
    { label: "Funding link", detail: "0x8b1…c740 funded two related wallets", timestamp: "9 d" },
  ],
  calls: [
    { endpoint: "/profiler/address/current-balance", status: "complete", credits: "1" },
    { endpoint: "/profiler/address/transactions", status: "complete", credits: "1" },
    { endpoint: "/profiler/address/related-wallets", status: "complete", credits: "1" },
  ],
  insight: "The wallet behaves like operational infrastructure: frequent exchange deposits, router activity, and a shared-funder relationship outweigh the standalone-wallet hypothesis.",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function shortAddress(address: string) {
  return address.length > 18 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address;
}

export default function Fieldwork() {
  const [activeCase, setActiveCase] = useState(0);
  const [address, setAddress] = useState(demoResult.address);
  const [chain, setChain] = useState("ethereum");
  const [result, setResult] = useState<InvestigationResult>(demoResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<number[]>([]);
  const current = cases[activeCase];
  const CaseIcon = current.icon;
  const completion = useMemo(() => (completed.length / cases.length) * 100, [completed]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "start_nansen_case",
          title: "Start Nansen case",
          description: "Open one of the five visible Nansen Fieldwork investigation cases by its case number.",
          inputSchema: {
            type: "object",
            properties: { caseNumber: { type: "integer", minimum: 1, maximum: 5 } },
            required: ["caseNumber"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input: unknown) {
            if (!input || typeof input !== "object" || !("caseNumber" in input)) throw new Error("caseNumber is required");
            const caseNumber = (input as { caseNumber: unknown }).caseNumber;
            if (!Number.isInteger(caseNumber) || Number(caseNumber) < 1 || Number(caseNumber) > 5) throw new Error("caseNumber must be an integer from 1 to 5");
            setActiveCase(Number(caseNumber) - 1);
            return { activeCase: Number(caseNumber), title: cases[Number(caseNumber) - 1].title };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  async function runInvestigation(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: address.trim(), chain }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "The investigation could not be completed.";
        throw new Error(message);
      }
      setResult(payload as InvestigationResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The investigation could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  function markComplete() {
    setCompleted((value) => value.includes(activeCase) ? value : [...value, activeCase]);
    if (activeCase < cases.length - 1) setActiveCase(activeCase + 1);
  }

  return (
    <main className="fieldwork-shell min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center bg-[var(--signal)] text-[#171716]"><Network className="size-4" /></div>
          <div>
            <p className="text-[15px] font-semibold leading-none tracking-[-0.02em]">Nansen Fieldwork</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Learn by investigating</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span>{completed.length}/5 cases</span>
            <Progress value={completion} className="h-1.5 w-24 bg-border [&_[data-slot=progress-indicator]]:bg-[var(--signal)]" />
          </div>
          <span className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className={`size-1.5 rounded-full ${result.mode === "live" ? "bg-[var(--positive)]" : "bg-[var(--warning)]"}`} />
            {result.mode === "live" ? "Live data" : "Demo data"}
          </span>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card md:border-b-0 md:border-r">
          <div className="hidden px-5 pb-3 pt-7 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground md:block">Case files</div>
          <nav aria-label="Investigation cases" className="scrollbar-none flex overflow-x-auto p-2 md:block md:space-y-1 md:p-3">
            {cases.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeCase;
              const isDone = completed.includes(index);
              return (
                <button key={item.number} onClick={() => setActiveCase(index)} className={`group flex min-w-[220px] items-center gap-3 border px-3 py-3 text-left transition md:min-w-0 md:w-full ${isActive ? "border-[var(--signal)] bg-[var(--signal)] text-[#171716]" : "border-transparent hover:border-border hover:bg-muted"}`}>
                  <span className={`grid size-8 shrink-0 place-items-center border ${isActive ? "border-background/25" : "border-border bg-background"}`}>{isDone ? <Check className="size-4 text-[var(--signal)]" /> : <Icon className="size-4" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-mono text-[10px] uppercase tracking-[0.13em] ${isActive ? "text-background/55" : "text-muted-foreground"}`}>Case {item.number}</span>
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                  </span>
                  <ChevronRight className={`size-4 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                </button>
              );
            })}
          </nav>
          <div className="mx-5 mt-5 hidden border-t border-border pt-5 md:block">
            <p className="text-sm leading-6 text-muted-foreground">A practical curriculum built on live Nansen evidence.</p>
            <a href="https://docs.nansen.ai" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline">API reference <ArrowRight className="size-3.5" /></a>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border bg-card px-4 py-7 md:px-8 lg:px-10">
            <div className="mx-auto max-w-[1180px]">
              <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Case {current.number}</span><span>/</span><span>{current.kicker}</span>
                <span className="ml-auto border border-border px-2 py-1">{current.level} · {current.minutes} min</span>
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div>
                  <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center bg-[var(--signal-soft)] text-[var(--signal-ink)]"><CaseIcon className="size-5" /></span><span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Investigation {current.number}</span></div>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{current.title}</h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{current.objective}</p>
                </div>
                <div className="border-l-2 border-[var(--signal)] pl-4"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your question</p><p className="mt-2 text-base font-medium leading-6">{current.question}</p></div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1244px] p-4 md:p-8">
            {activeCase === 0 ? <WalletInvestigation address={address} chain={chain} result={result} loading={loading} error={error} setAddress={setAddress} setChain={setChain} onSubmit={runInvestigation} onComplete={markComplete} /> : <CasePreview caseFile={current} onComplete={markComplete} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function WalletInvestigation({ address, chain, result, loading, error, setAddress, setChain, onSubmit, onComplete }: {
  address: string;
  chain: string;
  result: InvestigationResult;
  loading: boolean;
  error: string;
  setAddress: (value: string) => void;
  setChain: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="grid gap-3 border border-border bg-card p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_160px_auto]">
        <label className="relative block"><span className="sr-only">Wallet address</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter a wallet address" className="h-11 w-full border border-border bg-background pl-10 pr-3 font-mono text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-[var(--signal-soft)]" aria-label="Wallet address" /></label>
        <label><span className="sr-only">Blockchain</span><select value={chain} onChange={(event) => setChain(event.target.value)} className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-foreground" aria-label="Blockchain"><option value="ethereum">Ethereum</option><option value="base">Base</option><option value="arbitrum">Arbitrum</option><option value="polygon">Polygon</option><option value="bnb">BNB Chain</option><option value="solana">Solana</option></select></label>
        <Button type="submit" disabled={loading} className="h-11 rounded-[10px] bg-[var(--signal)] px-5 text-[#171716] hover:bg-[#e4d1ae]">{loading ? <><LoaderCircle className="animate-spin" /> Running 3 calls</> : <>Run investigation <ArrowRight /></>}</Button>
        {error ? <p role="alert" className="text-sm text-destructive md:col-span-3">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground md:col-span-3"><span className="inline-flex items-center gap-1.5"><CircleDollarSign className="size-3.5" /> Estimated cost: 3 credits</span><span className="inline-flex items-center gap-1.5"><Database className="size-3.5" /> Key remains server-side</span><span>Results: balances · 30-day activity · related wallets</span></div>
      </form>

      <Tabs defaultValue="evidence" className="gap-4">
        <TabsList variant="line" className="h-10 w-full justify-start border-b border-border p-0"><TabsTrigger value="brief" className="flex-none rounded-[8px] px-4">01 · Brief</TabsTrigger><TabsTrigger value="evidence" className="flex-none rounded-[8px] px-4">02 · Evidence</TabsTrigger><TabsTrigger value="verdict" className="flex-none rounded-[8px] px-4">03 · Verdict</TabsTrigger></TabsList>
        <TabsContent value="brief"><div className="grid gap-px border border-border bg-border lg:grid-cols-3">{[["Start with assets", "Holdings show what the wallet can move now. Look for concentration and operational stablecoins."], ["Read activity", "Transactions add direction, timing, counterparties, and methods—the difference between position and behavior."], ["Test relationships", "Related wallets reveal shared funding and repeated interaction. Treat each connection as a lead."]].map(([title, copy], index) => <article key={title} className="bg-card p-6"><span className="font-mono text-xs text-[var(--signal-ink)]">0{index + 1}</span><h2 className="mt-6 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div></TabsContent>
        <TabsContent value="evidence"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-5"><div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4"><Stat label="Portfolio" value={money.format(result.stats.portfolioValue)} /><Stat label="Assets" value={String(result.stats.tokenCount)} /><Stat label="30d activity" value={String(result.stats.transactions)} /><Stat label="Connections" value={String(result.stats.relatedWallets)} accent /></div><EvidenceGraph result={result} /><div className="grid gap-5 lg:grid-cols-2"><AssetMix assets={result.assets} /><ActivityLog activities={result.activities} /></div></div><aside className="space-y-5"><QueryLog result={result} /><div className="border border-border bg-foreground p-5 text-background"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-background/55"><BookOpen className="size-3.5" /> Investigator note</div><p className="mt-4 text-sm leading-6 text-background/80">{result.insight}</p></div><div className="border border-border bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Source</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-sm font-medium">{result.mode === "live" ? "Nansen API · live" : "Curated demo case"}</span><span className="text-xs text-muted-foreground">{new Date(result.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div></div></aside></div></TabsContent>
        <TabsContent value="verdict"><div className="grid gap-5 lg:grid-cols-[1fr_360px]"><article className="border border-border bg-card p-6 md:p-8"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal-ink)]">Evidence-backed verdict</p><h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.03em]">Operational wallet with a connected funding cluster</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{result.insight}</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><VerdictSignal label="Supports" value="Repeated exchange deposits" /><VerdictSignal label="Supports" value="Shared first funder" /><VerdictSignal label="Does not prove" value="Common ownership" muted /></div></article><aside className="border border-border bg-[var(--signal-soft)] p-6"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--signal-ink)]">The method</p><p className="mt-4 text-lg font-semibold">Position → behavior → relationships → conclusion.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Keep inference separate from fact. Every strong conclusion should survive at least two independent signals.</p><Button onClick={onComplete} className="mt-6 w-full rounded-[10px] bg-[var(--signal)] text-[#171716] hover:bg-[#e4d1ae]">Complete case <ArrowRight /></Button></aside></div></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="bg-card p-4 md:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${accent ? "text-[var(--signal-ink)]" : ""}`}>{value}</p></div>; }

function EvidenceGraph({ result }: { result: InvestigationResult }) {
  const positions = ["left-[3%] top-[10%]", "right-[3%] top-[10%]", "left-[3%] bottom-[10%]", "right-[3%] bottom-[10%]"];
  return <section className="overflow-hidden border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-semibold">Relationship map</h2><p className="mt-0.5 text-xs text-muted-foreground">Edges are derived from observed on-chain relationships.</p></div><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{result.chain}</span></div><div className="evidence-grid relative h-[360px] overflow-hidden sm:h-[400px]"><svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none"><path d="M400 200 L145 82 M400 200 L660 86 M400 200 L132 324 M400 200 L668 326" stroke="currentColor" strokeWidth="1" className="text-border" /><circle cx="270" cy="140" r="3" fill="var(--signal)" /><circle cx="530" cy="145" r="3" fill="var(--signal)" /><circle cx="260" cy="260" r="3" fill="var(--signal)" /><circle cx="540" cy="266" r="3" fill="var(--signal)" /></svg><div className="absolute left-1/2 top-1/2 z-10 w-[190px] -translate-x-1/2 -translate-y-1/2 border border-foreground bg-foreground p-4 text-background shadow-[8px_8px_0_var(--signal)]"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-background/55">Target wallet</p><p className="mt-2 font-mono text-sm">{shortAddress(result.address)}</p><p className="mt-3 text-xs text-background/60">{money.format(result.stats.portfolioValue)} observed</p></div>{result.relations.slice(0, 4).map((relation, index) => <div key={`${relation.address}-${index}`} className={`absolute z-10 w-[138px] border border-border bg-background p-3 shadow-sm sm:w-[180px] ${positions[index]}`}><p className="truncate text-xs font-semibold">{relation.label}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{shortAddress(relation.address)}</p><div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="truncate">{relation.relation}</span><span className="hidden shrink-0 sm:inline">{relation.timestamp}</span></div></div>)}</div></section>;
}

function AssetMix({ assets }: { assets: InvestigationResult["assets"] }) { return <section className="border border-border bg-card p-5"><div className="flex items-center gap-2"><WalletCards className="size-4" /><h2 className="text-sm font-semibold">Asset mix</h2></div><div className="mt-5 space-y-4">{assets.map((asset) => <div key={asset.symbol}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium">{asset.symbol}</span><span className="text-muted-foreground">{money.format(asset.valueUsd)} · {asset.share}%</span></div><div className="h-1.5 bg-muted"><div className="h-full bg-foreground" style={{ width: `${Math.max(2, asset.share)}%` }} /></div></div>)}</div></section>; }

function ActivityLog({ activities }: { activities: InvestigationResult["activities"] }) { return <section className="border border-border bg-card p-5"><div className="flex items-center gap-2"><Activity className="size-4" /><h2 className="text-sm font-semibold">Recent evidence</h2></div><div className="mt-4 divide-y divide-border">{activities.map((activity, index) => <div key={`${activity.label}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 py-3 first:pt-1"><div><p className="text-sm font-medium">{activity.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{activity.detail}</p></div><span className="font-mono text-[10px] text-muted-foreground">{activity.timestamp}</span></div>)}</div></section>; }

function QueryLog({ result }: { result: InvestigationResult }) { return <div className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">Query log</h2><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">3 calls</span></div><div className="divide-y divide-border">{result.calls.map((call) => <div key={call.endpoint} className="flex items-start gap-3 px-4 py-3"><span className={`mt-1 size-2 rounded-full ${call.status === "complete" ? "bg-[var(--positive)]" : "bg-destructive"}`} /><div className="min-w-0 flex-1"><p className="break-all font-mono text-[11px] leading-5">{call.endpoint}</p><p className="text-xs text-muted-foreground">{call.credits} credit · {call.status}</p></div></div>)}</div></div>; }

function VerdictSignal({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) { return <div className={`border p-4 ${muted ? "border-dashed border-border" : "border-border bg-muted/50"}`}><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-sm font-medium leading-5">{value}</p></div>; }

function CasePreview({ caseFile, onComplete }: { caseFile: CaseFile; onComplete: () => void }) {
  return <Tabs defaultValue="brief" className="gap-4"><TabsList variant="line" className="h-10 w-full justify-start border-b border-border p-0"><TabsTrigger value="brief" className="flex-none rounded-[8px] px-4">01 · Brief</TabsTrigger><TabsTrigger value="evidence" className="flex-none rounded-[8px] px-4">02 · Evidence</TabsTrigger><TabsTrigger value="verdict" className="flex-none rounded-[8px] px-4">03 · Verdict</TabsTrigger></TabsList><TabsContent value="brief"><div className="grid gap-5 lg:grid-cols-[1fr_360px]"><article className="border border-border bg-card p-6 md:p-8"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal-ink)]">Mission brief</p><h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.03em]">Form a hypothesis before you reveal the evidence.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{caseFile.objective}</p><div className="mt-8 border-l-2 border-foreground pl-5"><p className="text-sm font-semibold">Decision to make</p><p className="mt-2 text-lg leading-7">{caseFile.question}</p></div></article><aside className="border border-border bg-card p-6"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Live API sequence</p><div className="mt-5 space-y-3">{caseFile.endpoints.map((endpoint, index) => <div key={endpoint} className="flex items-center gap-3 border border-border p-3"><span className="grid size-7 place-items-center bg-muted font-mono text-[10px]">0{index + 1}</span><span className="text-sm font-medium">{endpoint}</span></div>)}</div></aside></div></TabsContent><TabsContent value="evidence"><div className="grid gap-px border border-border bg-border md:grid-cols-3">{caseFile.metrics.map((metric) => <article key={metric.label} className="bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">{metric.label}</p><p className="mt-7 text-3xl font-semibold tracking-[-0.04em]">{metric.value}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.note}</p></article>)}</div><div className="mt-5 border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">Prototype case: the full live adapter will reuse the same server-side Nansen client as Case 01.</div></TabsContent><TabsContent value="verdict"><article className="border border-border bg-card p-6 md:p-8"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--signal-ink)]">Model conclusion</p><p className="mt-5 max-w-3xl text-2xl font-semibold leading-9 tracking-[-0.03em]">{caseFile.conclusion}</p><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">In the live lesson, this conclusion is computed from the returned Nansen evidence and compared with the learner&apos;s original hypothesis.</p><Button onClick={onComplete} className="mt-7 rounded-[10px] bg-[var(--signal)] text-[#171716] hover:bg-[#e4d1ae]">Complete case <ArrowRight /></Button></article></TabsContent></Tabs>;
}

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: object;
        execute: (input: unknown) => unknown | Promise<unknown>;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}
