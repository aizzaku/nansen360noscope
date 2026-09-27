"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, Check, ChevronRight, Database, GitBranch, Library, LoaderCircle, Pin, Play, Radar, RotateCcw, Save, Search, Settings2, ShieldCheck, Sparkles, Target, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Logo } from "@/components/logo";
import { ToolIcon } from "@/components/tool-icon";
import { defaultInput, estimateRun, getPlaybook, inputSchema, playbooks, resultSchema, shortAddress, toolIds, validateInput, type InvestigationResult, type RunInput, type ToolId } from "@/lib/playbooks";
import { compactResult, freshLesson, initialState, readLocalState, writeLocalState, type LocalState, type SavedInvestigation } from "@/lib/local-state";
import { demoEvidence } from "@/lib/demo-evidence";
import { getAnalystGuide } from "@/lib/analyst-guides";
import { learningGuides } from "@/lib/learning-guides";
import { workflowExamples, type WorkflowExample } from "@/lib/workflow-examples";
import "./nansen.css";

const icons = { wallet: GitBranch, trader: Target, token: Radar, signal: Sparkles, defi: ShieldCheck };
const steps = ["Brief", "Hypothesis", "Evidence", "Verdict", "Explanation"];
const chainLabel = (chain: string) => chain === "bnb" ? "BNB Chain" : chain[0].toUpperCase() + chain.slice(1);
const toolPromises: Record<ToolId, string> = {
  wallet: "See what a wallet holds, does, and connects to.",
  trader: "See whether profits are repeatable or one lucky trade.",
  token: "See who owns a token and where money is flowing.",
  signal: "Find tokens that pass your Smart Money filters.",
  defi: "See where a wallet is deployed and what it owes.",
};
const runLabels: Record<ToolId, string> = { wallet: "Analyze wallet", trader: "Analyze trader", token: "Analyze token", signal: "Find tokens", defi: "Analyze portfolio" };
const investigateGuideSteps = [
  { label: "01 · CHOOSE", title: "Pick the question, not the chart", body: "Select the tool that matches what you need to decide: trace a wallet, test a trader, challenge a token narrative, screen signals, or map DeFi exposure." },
  { label: "02 · LOAD", title: "Start from a public workflow", body: "Each tool includes two sourced examples. Loading one only prepares the address, chain, window, and filters—it never runs a paid query." },
  { label: "03 · VERIFY", title: "Read evidence before the conclusion", body: "Review the inputs, run the investigation, then inspect metrics, raw evidence, and the query log. Save useful snapshots to your local library." },
] as const;
type Entry = { input: RunInput; result: InvestigationResult; cached?: boolean };
type Confirm = { kind: "remove"; id: string } | { kind: "reset" } | { kind: "run"; input: RunInput };
type LessonState = { stage: number; hypothesis: string; verdict: number | null; completed: boolean };

export default function NansenApp() {
  const [state, setState] = useState<LocalState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [investigateGuide, setInvestigateGuide] = useState(false);
  const [analystGuide, setAnalystGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [settings, setSettings] = useState(false);
  const [library, setLibrary] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [inputs, setInputs] = useState<Record<ToolId, RunInput>>(() => ({ wallet: defaultInput("wallet"), trader: defaultInput("trader"), token: defaultInput("token"), signal: defaultInput("signal"), defi: defaultInput("defi") }));
  const [entries, setEntries] = useState<Partial<Record<ToolId, Entry>>>({});
  const [loading, setLoading] = useState<ToolId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [focusResult, setFocusResult] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [rename, setRename] = useState<SavedInvestigation | null>(null);
  const [name, setName] = useState("");
  const stateRef = useRef(state);
  const replayRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function commit(next: LocalState) {
    stateRef.current = next;
    setState(next);
    setStorageError(writeLocalState(next));
  }
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const saved = readLocalState();
      stateRef.current = saved.state;
      setState(saved.state); setStorageError(saved.error); setWelcome(!saved.state.welcomed); setReady(true);
    });
    fetch("/api/playbooks").then(r => r.json()).then((data: unknown) => {
      if (active && data && typeof data === "object" && "liveAvailable" in data) setLiveAvailable(data.liveAvailable === true);
    }).catch(() => { if (active) setError("Could not check live-data availability. Demo investigations remain available."); });
    const context = document.modelContext;
    const lifecycle = new AbortController();
    if (context?.registerTool) {
      void Promise.resolve(context.registerTool({
        name: "start_nansen_case", title: "Start Nansen case", description: "Open one of the five Nansen learning cases.",
        inputSchema: { type: "object", properties: { caseNumber: { type: "integer", minimum: 1, maximum: 5 } }, required: ["caseNumber"], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input: unknown) {
          if (!input || typeof input !== "object" || !("caseNumber" in input) || !Number.isInteger(input.caseNumber) || Number(input.caseNumber) < 1 || Number(input.caseNumber) > 5) throw new Error("caseNumber must be an integer from 1 to 5");
          const id = toolIds[Number(input.caseNumber) - 1];
          const next: LocalState = { ...stateRef.current, active: id, mode: "learn" };
          stateRef.current = next; setState(next); setStorageError(writeLocalState(next)); setLibrary(false);
          return { activeCase: input.caseNumber, title: getPlaybook(id).lesson };
        },
      }, { signal: lifecycle.signal })).catch(() => { if (active) console.info("Optional browser tool registration unavailable."); });
    }
    return () => { active = false; lifecycle.abort(); };
  }, []);

  const current = getPlaybook(state.active);
  const Icon = icons[state.active];
  const lesson = state.lessons[state.active] ?? freshLesson();
  const input = inputs[state.active];
  const entry = entries[state.active];
  const completed = Object.values(state.lessons).filter(l => l.completed).length;
  const estimate = estimateRun(input);
  const demo = demoEvidence(defaultInput(state.active));

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (!focusResult || !entry || !resultRef.current) return;
    const result = resultRef.current;
    setFocusResult(false);
    result.focus({ preventScroll: true });
    result.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [entry, focusResult]);

  function selectTool(id: ToolId) { commit({ ...state, active: id }); setLibrary(false); setError(null); setNotice(""); }
  function updateLesson(patch: Partial<typeof lesson>) { commit({ ...state, lessons: { ...state.lessons, [state.active]: { ...lesson, ...patch } } }); }
  function updateInput(patch: Partial<RunInput>) { setInputs(old => ({ ...old, [state.active]: { ...old[state.active], ...patch } })); setError(null); }
  function dismissWelcome(mode?: LocalState["mode"]) {
    commit({ ...state, welcomed: true, ...(mode ? { mode, active: mode === "learn" ? "wallet" : state.active } : {}) });
    setWelcome(false); setLibrary(false);
    if (mode === "investigate" && !state.investigateGuideSeen) { setGuideStep(0); setInvestigateGuide(true); }
  }
  function openInvestigate() {
    commit({ ...state, mode: "investigate" });
    setLibrary(false);
    if (!state.investigateGuideSeen) { setGuideStep(0); setInvestigateGuide(true); }
  }
  function finishInvestigateGuide() {
    commit({ ...state, investigateGuideSeen: true, mode: "investigate" });
    setInvestigateGuide(false);
  }
  function loadExample(example: WorkflowExample) {
    const next = inputSchema.safeParse({ ...defaultInput(state.active), ...example.input, tool: state.active, demo: !liveAvailable });
    if (!next.success) { setError("This example is not supported by the selected tool."); return; }
    setInputs(old => ({ ...old, [state.active]: next.data }));
    setEntries(old => ({ ...old, [state.active]: undefined }));
    setError(null);
    setNotice(liveAvailable ? "Example loaded. Review the inputs before running it." : "Example loaded. Live data is not configured, so Run demo still uses the teaching fixture.");
  }
  async function execute(run: RunInput) {
    if (loading) return;
    setLoading(run.tool); setError(null); setNotice("");
    try {
      const response = await fetch("/api/playbooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(run) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "Investigation failed. Please try again.");
      const parsed = resultSchema.safeParse(payload);
      if (!parsed.success) throw new Error("The server returned an unreadable result. The previous evidence is preserved.");
      setEntries(old => ({ ...old, [run.tool]: { input: run, result: parsed.data } }));
      setFocusResult(true);
      setNotice(parsed.data.status === "failed" ? "Investigation failed. Check the query log." : `${getPlaybook(run.tool).name} complete. ${parsed.data.status === "demo" ? "Sample data; no credits used." : "Evidence ready."}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Investigation failed."); }
    finally { setLoading(null); }
  }
  function requestRun(run: RunInput) {
    const parsed = inputSchema.safeParse(run);
    if (!parsed.success) { setError("Check the investigation inputs."); return; }
    const issue = validateInput(parsed.data);
    if (issue) { setError(issue); return; }
    if (!parsed.data.demo) setConfirm({ kind: "run", input: parsed.data });
    else void execute(parsed.data);
  }
  function saveEntry() {
    if (!entry || entry.result.status === "failed") return;
    if (state.library.length >= 50) { setError("Your library holds 50 investigations. Remove an old entry before saving another."); return; }
    const saved: SavedInvestigation = { id: crypto.randomUUID(), name: `${current.name} · ${shortAddress(entry.result.subject)}`, pinned: false, savedAt: new Date().toISOString(), input: entry.input, result: compactResult(entry.result) };
    commit({ ...state, library: [saved, ...state.library] }); setNotice("Saved locally.");
  }
  function openSaved(saved: SavedInvestigation, rerun = false) {
    commit({ ...state, active: saved.input.tool, mode: "investigate" });
    setInputs(old => ({ ...old, [saved.input.tool]: saved.input }));
    setEntries(old => ({ ...old, [saved.input.tool]: { input: saved.input, result: saved.result, cached: true } }));
    setLibrary(false); setError(null); setNotice(rerun ? "Inputs restored." : "Saved snapshot opened.");
  }
  function openCandidate(address: string, chain: string, isDemo: boolean) {
    const checked = inputSchema.safeParse({ ...defaultInput("token"), subject: address, chain, demo: isDemo });
    if (!checked.success) { setError("This candidate uses an unsupported chain."); return; }
    setInputs(old => ({ ...old, token: checked.data }));
    commit({ ...state, active: "token", mode: "investigate" });
    setNotice("Opened in Token Holder & Flow Analysis.");
  }

  return <div className={`fieldwork-shell n360 ${state.mode === "learn" && !library ? "n-learn-mode" : ""}`}>
    <header className="n-header">
      <button className="n-brand" aria-label="Nansen 360 NoScope home" onClick={() => setLibrary(false)}><Logo /></button>
      <nav className="n-modes" aria-label="Product mode">
        <button aria-pressed={state.mode === "investigate" && !library} onClick={openInvestigate}><Search size={16} /> Investigate</button>
        <button aria-pressed={state.mode === "learn" && !library} onClick={() => { commit({ ...state, mode: "learn" }); setLibrary(false); }}><BookOpen size={16} /> Learn</button>
      </nav>
      <div className="n-header-actions"><button className="n-icon-button" aria-label="Open saved library" onClick={() => setLibrary(true)}><Library size={19} /><span>{state.library.length}</span></button><button ref={replayRef} className="n-icon-button" aria-label="Product settings" onClick={() => setSettings(true)}><Settings2 size={19} /></button></div>
    </header>
    <div className="n-layout">
      <aside className="n-sidebar">
        <div className="n-eyebrow">{state.mode === "learn" ? "CASES" : "TOOLS"}<span>05</span></div>
        <nav aria-label={state.mode === "learn" ? "Learning cases" : "Investigation tools"} className="n-case-list">
          {playbooks.map((book, index) => { const CaseIcon = icons[book.id]; return <button key={book.id} aria-current={!library && state.active === book.id ? "page" : undefined} onClick={() => selectTool(book.id)}><span className="n-case-number">0{index + 1}</span><span><strong>{state.mode === "learn" ? book.lesson : book.name}</strong>{state.mode === "learn" && <small>{book.subtitle}</small>}</span>{state.lessons[book.id]?.completed && state.mode === "learn" ? <ToolIcon icon={Check} tone="sage" /> : <ToolIcon icon={CaseIcon} />}</button>; })}
        </nav>
        {state.mode === "learn" && <div className="n-progress"><div><span>Progress</span><b>{completed} / 5</b></div><progress value={completed} max={5} aria-label="Learning progress" /></div>}
        <button className={`n-library-link ${library ? "active" : ""}`} onClick={() => setLibrary(true)}><Library size={17} /> Saved investigations <span>{state.library.length}</span></button>
        {state.mode === "learn" && <div className="n-sidebar-foot"><Database size={16} /><p>Stored on this device.</p></div>}
      </aside>
      <main className="n-main" id="main-content">
        {storageError && <div role="alert" className="n-message n-error">{storageError}</div>}
        {error && <div ref={errorRef} role="alert" tabIndex={-1} className="n-message n-error">{error}<button aria-label="Dismiss error" onClick={() => setError(null)}><X size={16} /></button></div>}
        {notice && <div role="status" className="n-message">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
        {!ready ? <p className="n-loading"><LoaderCircle className="animate-spin" size={18} /> Opening your workspace…</p> : library ? <>
          <div className="n-page-heading"><div><div className="n-eyebrow">LIBRARY</div><h1>Saved investigations</h1><p>Saved on this device.</p></div><span className="n-count">{state.library.length} / 50</span></div>
          {state.library.length === 0 ? <div className="n-empty"><Library size={28} /><h2>No saved investigations</h2><p>Save a result to return to it later.</p><Button onClick={openInvestigate}>Open tools <ArrowRight /></Button></div> : <div className="n-saved-list">{[...state.library].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(saved => <article className="n-saved" key={saved.id}><div className="n-saved-top"><span className={`n-status ${saved.result.status}`}>{saved.result.status}</span><span className="n-muted">{getPlaybook(saved.input.tool).name} · {new Date(saved.savedAt).toLocaleDateString()}</span><button className="n-icon-button" aria-label={`${saved.pinned ? "Unpin" : "Pin"} ${saved.name}`} aria-pressed={saved.pinned} onClick={() => commit({ ...state, library: state.library.map(item => item.id === saved.id ? { ...item, pinned: !item.pinned } : item) })}><Pin size={17} fill={saved.pinned ? "currentColor" : "none"} /></button></div><h2>{saved.name}</h2><p>{saved.result.conclusion}</p><div className="n-saved-actions"><Button variant="outline" onClick={() => openSaved(saved)}>Open</Button><Button variant="ghost" onClick={() => openSaved(saved, true)}><RotateCcw /> Rerun</Button><Button variant="ghost" onClick={() => { setRename(saved); setName(saved.name); }}>Rename</Button><Button variant="ghost" aria-label={`Remove ${saved.name}`} onClick={() => setConfirm({ kind: "remove", id: saved.id })}><Trash2 /></Button></div></article>)}</div>}
        </> : <>
          {state.mode === "learn" && <div className="n-breadcrumb"><span>LEARN</span><ChevronRight size={12} /><span>0{toolIds.indexOf(state.active) + 1}</span></div>}
          <div className={`n-page-heading ${state.mode === "investigate" ? "n-tool-heading" : ""}`}><div className="n-tool-intro"><h1>{state.mode === "learn" ? current.lesson : current.name}</h1>{state.mode === "learn" && <span className="n-mobile-progress">Case {toolIds.indexOf(state.active) + 1} of 5 · {completed} complete</span>}<p>{state.mode === "investigate" ? toolPromises[state.active] : current.objective}</p><div className="n-supported-chains" aria-label={`Supported chains: ${current.chains.map(chainLabel).join(", ")}`}><span>Chains</span><ul>{current.chains.map(chain => <li key={chain}>{chainLabel(chain)}</li>)}</ul></div></div>{state.mode === "investigate" && <CompactExamples examples={workflowExamples[state.active]} onLoad={loadExample} />}</div>
          {state.mode === "learn" ? <>
            <nav className="n-steps" aria-label="Learning stages">{steps.map((step, i) => <button key={step} disabled={i > lesson.stage} aria-current={lesson.stage === i ? "step" : undefined} onClick={() => updateLesson({ stage: i })}><span>{i < lesson.stage ? <Check size={13} /> : `0${i + 1}`}</span>{step}</button>)}</nav>
            {state.active === "wallet" ? <WalletLesson lesson={lesson} updateLesson={updateLesson} demo={demo} onOpenTool={openInvestigate} /> : <GuidedLesson tool={state.active} lesson={lesson} updateLesson={updateLesson} demo={demo} onOpenTool={openInvestigate} onCandidate={openCandidate} />}
            {lesson.stage !== 4 && <div className="n-learn-footer"><button onClick={openInvestigate}>Open {current.name} <ArrowRight size={15} /></button></div>}
          </> : <>
            <form className="n-panel n-run-form n-tool-form" onSubmit={(e: FormEvent) => { e.preventDefault(); requestRun(input); }}>
              <div className="n-form-title"><span className="n-eyebrow">{runLabels[state.active]}</span><div className="n-form-tools"><Button type="button" variant="ghost" className="n-analysis-guide-trigger" onClick={() => setAnalystGuide(true)}><BookOpen size={15} /> Analysis guide</Button><label className="n-source-select">Data<select aria-label="Data source" value={input.demo ? "demo" : "live"} onChange={e => updateInput({ demo: e.target.value === "demo" })}><option value="demo">Sample</option><option value="live" disabled={!liveAvailable}>Live{!liveAvailable ? " · unavailable" : ""}</option></select></label></div></div>
              <div className={`n-fields ${state.active === "signal" ? "n-signal-fields" : ""}`}>
                {state.active !== "signal" && <label className="n-subject">{state.active === "token" ? "Token contract address" : "Wallet address"}<input aria-label={state.active === "token" ? "Token contract address" : "Wallet address"} value={input.subject} onChange={e => updateInput({ subject: e.target.value })} spellCheck={false} placeholder="0x…" required disabled={input.demo} /></label>}
                <label>{state.active === "defi" ? "Wallet balance chain" : "Chain"}<select aria-label="Chain" value={input.chain} disabled={input.demo} onChange={e => { const parsed = inputSchema.safeParse({ ...input, chain: e.target.value }); if (parsed.success) updateInput({ chain: parsed.data.chain }); }}>{current.chains.map(chain => <option key={chain} value={chain}>{chainLabel(chain)}</option>)}</select></label>
                {state.active !== "defi" && <label>Time window<select aria-label="Time window" value={input.days} disabled={input.demo} onChange={e => updateInput({ days: Number(e.target.value) === 7 ? 7 : Number(e.target.value) === 90 ? 90 : 30 })}><option value={7}>7 days</option><option value={30}>30 days</option>{state.active !== "signal" && <option value={90}>90 days</option>}</select></label>}
                {state.active === "signal" && <><label>Min. liquidity (USD)<input aria-label="Minimum liquidity" type="number" min={0} max={1e12} value={input.liquidity} disabled={input.demo} onChange={e => updateInput({ liquidity: Number(e.target.value) })} /></label><label>Min. Smart Money holders<input aria-label="Minimum Smart Money holders" type="number" min={1} max={1000} step={1} value={input.smartMoney} disabled={input.demo} onChange={e => updateInput({ smartMoney: Number(e.target.value) })} /></label></>}
              </div>
              {state.active === "token" && <label className="n-check"><input type="checkbox" checked={input.enrichment} disabled={input.demo} onChange={e => updateInput({ enrichment: e.target.checked })} /> Premium holder labels <span>+145 estimated credits · opt-in</span></label>}
              <div className="n-run-bottom"><p id="demo-fixture-note">{input.demo ? <>Sample data · no credits</> : <>{estimate.maximum ? "Up to " : ""}{estimate.requests} requests · ~{estimate.credits} credits</>}</p><Button ref={confirmRef} type="submit" className="n-primary" disabled={loading !== null}>{loading === state.active ? <><LoaderCircle className="animate-spin" /> Analyzing…</> : <><Play size={15} /> {runLabels[state.active]}</>}</Button></div>
              {state.active === "token" && <p className="n-form-note">Flow intelligence always covers 7 days. The selected window applies to buyers and sellers.</p>}
              {state.active === "defi" && <p className="n-form-note">DeFi is a current cross-chain snapshot. Wallet balances use the selected chain.</p>}
              {!liveAvailable && <p className="n-form-note">Live data unavailable. Add NANSEN_API_KEY to enable it.</p>}
            </form>
            {entry ? <div ref={resultRef} className="n-result-region" tabIndex={-1} aria-labelledby="investigation-results-heading"><h2 id="investigation-results-heading" className="sr-only">Investigation results</h2><div className="n-result-actions"><span>{entry.cached ? "SAVED" : "RESULT"} · {shortAddress(entry.result.subject)}</span><div><Button variant="ghost" disabled={loading !== null} onClick={() => requestRun(entry.input)}><RotateCcw /> Rerun</Button><Button variant="outline" disabled={entry.result.status === "failed"} onClick={saveEntry}><Save /> Save</Button></div></div><InvestigationSummary result={entry.result} onCandidate={openCandidate} /><details className="n-panel n-investigation-details"><summary>Evidence, tables and query details</summary><Results result={entry.result} cached={entry.cached} hideConclusion onCandidate={openCandidate} /></details></div> : <div className="n-tool-ready"><ToolIcon icon={Icon} size="empty" tone="gold" /><div><h2>Ready</h2><p>{state.active === "signal" ? "Set your filters and find candidates." : `Enter a ${state.active === "token" ? "token" : "wallet"} or load an example.`}</p></div></div>}
          </>}
        </>}
        <footer className="n-footer"><span>NANSEN 360 NOSCOPE</span></footer>
      </main>
    </div>
    <Dialog open={welcome} onOpenChange={open => { if (!open) dismissWelcome(); }}>
      <DialogContent className="n-welcome" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); replayRef.current?.focus(); }}>
        <div className="n-welcome-panel">
          <div className="n-welcome-copy">
            <div className="n-welcome-brand"><Logo variant="mark" /><div className="n-eyebrow">NANSEN 360 NOSCOPE</div></div>
            <div><DialogTitle>Investigate first.<br />Learn as you go.</DialogTitle><DialogDescription>Five on-chain workflows with public examples, transparent evidence, and guided cases when you want the method explained.</DialogDescription></div>
            <div><div className="n-welcome-actions"><Button className="n-welcome-action n-primary" onClick={() => dismissWelcome("investigate")}><span><b>Start investigating</b><small>Take the one-time guided tour</small></span><ArrowRight /></Button><Button className="n-welcome-action" variant="outline" onClick={() => dismissWelcome("learn")}><span><b>Open Learn</b><small>Work through a guided case</small></span><ArrowRight /></Button></div><span className="n-muted">Progress and saved investigations stay on this device.</span></div>
          </div>
          <div className="n-welcome-visual" aria-hidden="true">
            <div className="n-welcome-grid" />
            <span className="n-trace trace-a" /><span className="n-trace trace-b" /><span className="n-trace trace-c" /><span className="n-trace trace-d" /><span className="n-trace trace-e" />
            <div className="n-node node-wallet"><GitBranch size={20} /><span>Wallet</span></div><div className="n-node node-trader"><Target size={20} /><span>Trader</span></div><div className="n-node node-token"><Radar size={20} /><span>Token</span></div><div className="n-node node-signal"><Sparkles size={20} /><span>Signal</span></div><div className="n-node node-defi"><ShieldCheck size={20} /><span>DeFi</span></div>
            <div className="n-core"><span className="n-core-logo" /><strong>NANSEN <em>360</em></strong><small>5 playbooks + tools</small></div>
          </div>
          <div className="n-welcome-meta"><span>01—05 / CASES + TOOLS</span><span>ESC TO CLOSE</span></div>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={investigateGuide} onOpenChange={open => { if (!open) finishInvestigateGuide(); }}>
      <DialogContent className="n-investigate-guide" showCloseButton={false}>
        <div className="n-guide-progress" aria-label={`Investigate guide step ${guideStep + 1} of ${investigateGuideSteps.length}`}>{investigateGuideSteps.map((_, index) => <span key={index} className={index <= guideStep ? "active" : ""} />)}</div>
        <div className="n-eyebrow">{investigateGuideSteps[guideStep].label}</div>
        <DialogTitle>{investigateGuideSteps[guideStep].title}</DialogTitle>
        <DialogDescription>{investigateGuideSteps[guideStep].body}</DialogDescription>
        <div className="n-guide-preview" aria-hidden="true">
          <span>{guideStep === 0 ? "Choose a tool" : guideStep === 1 ? "Load a workflow" : "Run → evidence → save"}</span>
          <strong>{guideStep === 0 ? "Wallet · Trader · Token · Signal · DeFi" : guideStep === 1 ? "Two sourced examples in every tool" : "Inputs stay under your control"}</strong>
        </div>
        <div className="n-guide-actions"><Button variant="ghost" onClick={finishInvestigateGuide}>Skip tour</Button><div>{guideStep > 0 && <Button variant="outline" onClick={() => setGuideStep(step => step - 1)}>Back</Button>}<Button className="n-primary" onClick={() => { if (guideStep === investigateGuideSteps.length - 1) finishInvestigateGuide(); else setGuideStep(step => step + 1); }}>{guideStep === investigateGuideSteps.length - 1 ? "Start investigating" : "Next"}<ArrowRight /></Button></div></div>
      </DialogContent>
    </Dialog>
    <AnalystGuideDialog open={analystGuide} onOpenChange={setAnalystGuide} tool={state.active} />
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent onCloseAutoFocus={e => { e.preventDefault(); replayRef.current?.focus(); }}><DialogTitle>Workspace preferences</DialogTitle><DialogDescription>Learning progress and saved investigations are stored only in this browser.</DialogDescription><Button variant="outline" onClick={() => { setSettings(false); setWelcome(true); }}>Replay introduction</Button><Button variant="outline" onClick={() => { setSettings(false); setConfirm({ kind: "reset" }); }}>Reset learning progress</Button><p className="n-muted">Live data: {liveAvailable ? "configured" : "not configured"}. API credentials stay on the server.</p></DialogContent></Dialog>
    <Dialog open={rename !== null} onOpenChange={open => { if (!open) setRename(null); }}><DialogContent><DialogTitle>Rename investigation</DialogTitle><DialogDescription>Choose a name you’ll recognize in your library.</DialogDescription><form className="n-rename" onSubmit={e => { e.preventDefault(); if (!rename || !name.trim()) return; commit({ ...state, library: state.library.map(saved => saved.id === rename.id ? { ...saved, name: name.trim() } : saved) }); setRename(null); }}><label htmlFor="saved-name">Investigation name</label><input id="saved-name" autoFocus value={name} maxLength={100} onChange={e => setName(e.target.value)} /><Button type="submit" disabled={!name.trim()}>Save name</Button></form></DialogContent></Dialog>
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}><AlertDialogContent onCloseAutoFocus={e => { e.preventDefault(); confirmRef.current?.focus(); }}><AlertDialogTitle>{confirm?.kind === "run" ? "Run a paid investigation?" : confirm?.kind === "reset" ? "Reset learning progress?" : "Remove this investigation?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.kind === "run" ? `${getPlaybook(confirm.input.tool).name} will make ${estimateRun(confirm.input).maximum ? "up to " : ""}${estimateRun(confirm.input).requests} requests, estimated at ${estimateRun(confirm.input).credits} Nansen credits. Actual usage will appear in the query log when supplied by Nansen.` : confirm?.kind === "reset" ? "This clears all five case hypotheses, verdicts, and completion markers. Your investigation library is kept." : "This removes the saved snapshot from this browser. This cannot be undone."}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirm?.kind === "run") void execute(confirm.input); else if (confirm?.kind === "reset") { commit({ ...state, lessons: initialState().lessons }); setNotice("Learning progress reset."); } else if (confirm?.kind === "remove") commit({ ...state, library: state.library.filter(saved => saved.id !== confirm.id) }); setConfirm(null); }}>{confirm?.kind === "run" ? "Confirm and run" : confirm?.kind === "reset" ? "Reset progress" : "Remove investigation"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function AnalystGuideDialog({ open, onOpenChange, tool }: { open: boolean; onOpenChange: (open: boolean) => void; tool: ToolId }) {
  const guide = getAnalystGuide(tool);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="n-analyst-guide">
      <div className="n-eyebrow">ANALYSIS GUIDE · {getPlaybook(tool).name}</div>
      <DialogTitle>{guide.title}</DialogTitle>
      <DialogDescription>{guide.coreQuestion}</DialogDescription>
      <div className="n-guide-scroll">
        <section><h3>Before you run</h3><ul>{guide.beforeYouRun.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section><h3>Read the evidence in this order</h3><ol>{guide.readingOrder.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.instruction}</span><small>Decision: {step.decision}</small></li>)}</ol></section>
        <details><summary>Metric meanings and cautions</summary><div className="n-guide-detail-grid">{guide.metrics.map(metric => <article key={metric.name}><strong>{metric.name}</strong><p>{metric.meaning}</p><small><b>Read as:</b> {metric.readAs}</small><small><b>Caution:</b> {metric.caution}</small></article>)}</div></details>
        <details><summary>Evidence checks</summary><ul>{guide.evidenceChecks.map(check => <li key={check.question}><strong>{check.question}</strong><span>{check.why}</span><small>Check: {check.source}</small></li>)}</ul></details>
        <details><summary>Common mistakes</summary><ul>{guide.commonMistakes.map(item => <li key={item}>{item}</li>)}</ul></details>
        <details><summary>What you cannot conclude</summary><ul>{guide.conclusionLimits.map(item => <li key={item}>{item}</li>)}</ul></details>
        <section className="n-guide-recipe"><h3>Full workflow</h3><ol>{guide.analysisRecipe.map(item => <li key={item}>{item}</li>)}</ol></section>
      </div>
    </DialogContent>
  </Dialog>;
}

function CompactExamples({ examples, onLoad }: { examples: [WorkflowExample, WorkflowExample]; onLoad: (example: WorkflowExample) => void }) {
  return <aside className="n-compact-examples" aria-label="Example case studies">
    <span className="n-eyebrow">TRY A CASE</span>
    <div>{examples.map((example, index) => <button type="button" key={example.title} onClick={() => onLoad(example)} title={example.purpose}><span>0{index + 1}</span><strong>{example.title}</strong><small>{example.subjectLabel}</small></button>)}</div>
  </aside>;
}

function numberFromDisplay(value: string): number | null {
  const normalized = value.replaceAll(",", "").replace("−", "-").replace(/[^0-9.KMBkmb+\-]/g, "");
  const match = normalized.match(/^([+-]?[0-9]*\.?[0-9]+)([KMBkmb])?$/);
  if (!match) return null;
  const multiplier = match[2]?.toUpperCase() === "K" ? 1e3 : match[2]?.toUpperCase() === "M" ? 1e6 : match[2]?.toUpperCase() === "B" ? 1e9 : 1;
  const parsed = Number(match[1]) * multiplier;
  return Number.isFinite(parsed) ? parsed : null;
}

function chartBars(result: InvestigationResult) {
  const block = result.evidence[0];
  if (!block) return [];
  if (block.bars?.length) return block.bars.slice(0, 6);
  const valueColumn = result.tool === "defi" ? Math.max(1, block.columns.findIndex(column => /assets/i.test(column))) : 1;
  const parsed = block.rows.slice(0, 6).flatMap(row => {
    const value = numberFromDisplay(row[valueColumn] ?? "");
    return value === null ? [] : [{ label: row[0], raw: Math.abs(value), display: row[valueColumn] }];
  });
  const maximum = Math.max(...parsed.map(item => item.raw), 1);
  return parsed.map(item => ({ label: item.label, value: item.raw / maximum * 100, display: item.display }));
}

function SimpleBars({ result }: { result: InvestigationResult }) {
  const bars = chartBars(result);
  if (!bars.length) return <p className="n-visual-empty">No comparable values returned.</p>;
  return <div className="n-simple-bars" role="img" aria-label={`${getPlaybook(result.tool).name} comparison chart`}>{bars.map(bar => <div key={bar.label}><div><span>{bar.label}</span><b>{bar.display}</b></div><div><span style={{ width: `${Math.max(3, Math.min(bar.value, 100))}%` }} /></div></div>)}</div>;
}

function WalletFlow({ result }: { result: InvestigationResult }) {
  const relationships = result.evidence.find(block => /relationship/i.test(block.title))?.rows.slice(0, 4) ?? [];
  return <div className="n-wallet-visual"><div className="n-wallet-center"><span>WALLET</span><strong>{shortAddress(result.subject)}</strong></div><div className="n-wallet-relations">{relationships.length ? relationships.map((row, index) => <div key={`${row[0]}-${index}`}><span className="n-connector" /><article><strong>{shortAddress(row[0])}</strong><small>{row[1] || row[2] || "Observed link"}</small></article></div>) : <p>No related wallets returned.</p>}</div></div>;
}

function TokenFlow({ result }: { result: InvestigationResult }) {
  const ownership = Math.max(0, Math.min(numberFromDisplay(result.metrics[0]?.value ?? "") ?? 0, 100));
  const smart = numberFromDisplay(result.metrics[1]?.value ?? "") ?? 0;
  const exchange = numberFromDisplay(result.metrics[2]?.value ?? "") ?? 0;
  const maximum = Math.max(Math.abs(smart), Math.abs(exchange), 1);
  return <div className="n-token-visual"><div className="n-ownership"><div><strong>{result.metrics[0]?.value ?? "—"}</strong><span>top-holder share</span></div><progress value={ownership} max={100} aria-label={`Top-holder share ${ownership}%`} /></div><div className="n-flow-compare"><div><span>Smart Money</span><b>{result.metrics[1]?.value ?? "—"}</b><i style={{ width: `${Math.abs(smart) / maximum * 100}%` }} /></div><div><span>Exchange flow</span><b>{result.metrics[2]?.value ?? "—"}</b><i style={{ width: `${Math.abs(exchange) / maximum * 100}%` }} /></div></div></div>;
}

function CandidateVisual({ result, onCandidate }: { result: InvestigationResult; onCandidate: (address: string, chain: string, demo: boolean) => void }) {
  return <div className="n-candidate-visual">{result.candidates?.slice(0, 5).map(candidate => <article key={candidate.address}><div><span className={`n-pass-dot ${candidate.passed ? "passed" : ""}`} /><div><strong>{candidate.symbol}</strong><small>{candidate.passed ? "Passes every filter" : "Needs more evidence"}</small></div></div><Button variant="ghost" onClick={() => onCandidate(candidate.address, candidate.chain, result.status === "demo")}>Open <ArrowRight /></Button></article>) ?? <p>No candidates returned.</p>}</div>;
}

function InvestigationSummary({ result, onCandidate }: { result: InvestigationResult; onCandidate: (address: string, chain: string, demo: boolean) => void }) {
  return <section className="n-summary-panel">
    <header><div><span className={`n-status ${result.status}`}>{result.status === "demo" ? "SAMPLE" : result.status}</span><span className="n-summary-label">WHAT THE DATA SAYS</span></div><h2>{result.conclusion}</h2></header>
    <div className="n-summary-metrics">{result.metrics.slice(0, 3).map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
    <div className="n-visual-panel"><div className="n-visual-title"><span>{result.tool === "wallet" ? "Connections" : result.tool === "token" ? "Ownership & flow" : result.tool === "signal" ? "Filtered candidates" : result.tool === "defi" ? "Protocol exposure" : "Profit concentration"}</span><small>Visual summary</small></div>{result.tool === "wallet" ? <WalletFlow result={result} /> : result.tool === "token" ? <TokenFlow result={result} /> : result.tool === "signal" ? <CandidateVisual result={result} onCandidate={onCandidate} /> : <SimpleBars result={result} />}</div>
  </section>;
}

function GuidedLesson({ tool, lesson, updateLesson, demo, onOpenTool, onCandidate }: {
  tool: Exclude<ToolId, "wallet">;
  lesson: LessonState;
  updateLesson: (patch: Partial<LessonState>) => void;
  demo: InvestigationResult;
  onOpenTool: () => void;
  onCandidate: (address: string, chain: string, demo: boolean) => void;
}) {
  const current = getPlaybook(tool);
  const guide = learningGuides[tool];

  if (lesson.stage === 0) return <section className="n-brief n-panel n-guided-brief">
    <div className="n-eyebrow">CASE 0{toolIds.indexOf(tool) + 1} · {guide.level}</div>
    <p className="n-lesson-goal">{guide.goal}</p>
    <h2>{guide.scenario}</h2>
    <div className="n-story-cast" aria-label="Evidence roles in this case">{guide.cast.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.description}</strong></div>)}</div>
    <div className="n-plain-terms">{guide.terms.map(item => <span key={item.term}><b>{item.term}</b>{item.definition}</span>)}</div>
    {lesson.completed && <p className="n-review-note">Your previous prediction and verdict are preserved.</p>}
    <Button className="n-primary" onClick={() => updateLesson({ stage: 1 })}>{lesson.completed ? "Review the case" : "Start the investigation"}<ArrowRight /></Button>
  </section>;

  if (lesson.stage === 1) return <section className="n-panel n-hypothesis n-guided-hypothesis">
    <div className="n-eyebrow">YOUR FIRST GUESS</div>
    <h2>What seems most likely before you inspect the evidence?</h2>
    <p>A hypothesis is a starting position. The useful part is noticing which evidence makes you change it.</p>
    <div className="n-prediction-options" role="group" aria-label="Choose a starting prediction">{guide.predictions.map((prediction, index) => <button type="button" key={prediction} aria-pressed={lesson.hypothesis === prediction} onClick={() => updateLesson({ hypothesis: prediction })}><span>0{index + 1}</span><strong>{prediction}</strong></button>)}</div>
    <label htmlFor={`${tool}-hypothesis`}>Or write your own hypothesis</label>
    <textarea id={`${tool}-hypothesis`} maxLength={2000} value={lesson.hypothesis} onChange={event => updateLesson({ hypothesis: event.target.value })} placeholder="I expect… because…" />
    <p className="n-muted">Name the evidence that would change your view.</p>
    <Button className="n-primary" disabled={!lesson.hypothesis.trim()} onClick={() => updateLesson({ stage: 2 })}>{guide.evidenceAction} <ArrowRight /></Button>
  </section>;

  if (lesson.stage === 2) return <>
    <section className="n-panel n-wallet-evidence">
      <div className="n-evidence-lesson-head"><div><span>CLUE 01</span><h2>{guide.clueTitle}</h2></div><p>{guide.clueSummary}</p></div>
      <div className="n-learning-metrics">{demo.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</div>
      <div className="n-meaning-grid"><article><span className="n-status live">WE CAN SAY</span><h3>{guide.supported.title}</h3><p>{guide.supported.body}</p></article><article><span className="n-status partial">WE CANNOT SAY</span><h3>{guide.caution.title}</h3><p>{guide.caution.body}</p></article></div>
    </section>
    <section className="n-panel n-second-clue"><div><span className="n-eyebrow">CLUE 02 · TEST THE FIRST STORY</span><h2>{guide.secondClue.title}</h2><p>{guide.secondClue.body}</p></div><ul>{guide.checks.map(check => <li key={check.label}>{check.observed ? <Check size={16} /> : <X size={16} />}<span><b>{check.label}</b>{check.note}</span></li>)}</ul></section>
    <details className="n-panel n-raw-evidence"><summary>See the raw tables an analyst can inspect</summary><div><Results result={demo} hideConclusion onCandidate={onCandidate} /></div></details>
    <div className="n-next"><p>Your starting hypothesis: <em>{lesson.hypothesis}</em></p><Button className="n-primary" onClick={() => updateLesson({ stage: 3 })}>Make the call <ArrowRight /></Button></div>
  </>;

  if (lesson.stage === 3) return <section className="n-panel n-verdict n-guided-verdict">
    <div className="n-eyebrow">MAKE THE CALL</div>
    <h2>{current.question}</h2>
    <p>Select what the evidence supports—not what might be possible.</p>
    <fieldset><legend className="sr-only">Choose your verdict</legend>{current.options.map((option, index) => <label key={option} className={lesson.verdict === index ? "selected" : ""}><input type="radio" name="verdict" checked={lesson.verdict === index} onChange={() => updateLesson({ verdict: index })} /><span>{option}</span></label>)}</fieldset>
    <Button className="n-primary" disabled={lesson.verdict === null} onClick={() => updateLesson({ stage: 4, completed: true })}>Explain the answer <ArrowRight /></Button>
  </section>;

  return <section className="n-panel n-explanation n-guided-explanation">
    <span className="n-status complete">CASE COMPLETE</span>
    <h2>{lesson.verdict === current.answer ? "You matched the claim to the evidence" : "The safest conclusion needs a tighter claim"}</h2>
    <p className="n-answer">{current.options[current.answer]}</p>
    <div className="n-explain-grid">{guide.explanation.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
    <div className="n-investigate-recipe"><div><span className="n-eyebrow">REPEAT THIS IN INVESTIGATE</span><h3>{guide.recipeTitle}</h3></div><ol>{guide.recipe.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></div>
    <div className="n-actions"><Button className="n-primary" onClick={onOpenTool}>Try it in Investigate <ArrowRight /></Button></div>
  </section>;
}

function WalletLesson({ lesson, updateLesson, demo, onOpenTool }: {
  lesson: LessonState;
  updateLesson: (patch: Partial<LessonState>) => void;
  demo: InvestigationResult;
  onOpenTool: () => void;
}) {
  const current = getPlaybook("wallet");
  const predictions = [
    "The same person probably owns both wallets.",
    "The wallets are connected, but this one clue cannot prove who owns them.",
    "I am not sure yet—I want to see the money flow first.",
  ];

  if (lesson.stage === 0) return <section className="n-brief n-panel n-wallet-brief">
    <div className="n-eyebrow">CASE 01 · BEGINNER</div>
    <p className="n-lesson-goal">Today you will learn how to follow the first money entering a wallet and decide what that connection really proves.</p>
    <h2>Two wallets received their first ETH from the same place. Does that mean one person owns both?</h2>
    <div className="n-story-cast" aria-label="People and wallets in this case">
      <div><span>Wallet A</span><strong>The wallet we are investigating</strong></div>
      <div><span>Wallet B</span><strong>A wallet that may be connected</strong></div>
      <div><span>Wallet F</span><strong>The wallet that funded both</strong></div>
    </div>
    <div className="n-plain-terms"><span><b>Wallet</b> An on-chain account.</span><span><b>Funder</b> A wallet that sent it starter crypto.</span><span><b>Important</b> A connection is not proof of ownership.</span></div>
    {lesson.completed && <p className="n-review-note">Your previous prediction and verdict are preserved.</p>}
    <Button className="n-primary" onClick={() => updateLesson({ stage: 1 })}>{lesson.completed ? "Review the case" : "Meet the wallets"}<ArrowRight /></Button>
  </section>;

  if (lesson.stage === 1) return <section className="n-panel n-hypothesis n-guided-hypothesis">
    <div className="n-eyebrow">YOUR FIRST GUESS</div>
    <h2>No expert knowledge needed. What seems most likely right now?</h2>
    <p>A hypothesis is simply your starting guess. You are allowed to change it when the evidence changes.</p>
    <div className="n-prediction-options" role="group" aria-label="Choose a starting prediction">
      {predictions.map((prediction, index) => <button type="button" key={prediction} aria-pressed={lesson.hypothesis === prediction} onClick={() => updateLesson({ hypothesis: prediction })}><span>0{index + 1}</span><strong>{prediction}</strong></button>)}
    </div>
    <label htmlFor="wallet-hypothesis">Or write your own guess</label>
    <textarea id="wallet-hypothesis" maxLength={2000} value={lesson.hypothesis} onChange={event => updateLesson({ hypothesis: event.target.value })} placeholder="I think the wallets are…" />
    <p className="n-muted">There is no penalty for guessing incorrectly. The point is to notice what changes your mind.</p>
    <Button className="n-primary" disabled={!lesson.hypothesis.trim()} onClick={() => updateLesson({ stage: 2 })}>Follow the money <ArrowRight /></Button>
  </section>;

  if (lesson.stage === 2) return <>
    <section className="n-panel n-wallet-evidence">
      <div className="n-evidence-lesson-head"><div><span>CLUE 01</span><h2>Start with the first money in</h2></div><p>We look backward to find the wallet that gave each address the crypto it needed to begin operating.</p></div>
      <div className="n-flow-map" role="img" aria-label="Wallet F sent 8 ETH to Wallet A and 3.5 ETH to Wallet B">
        <div className="n-flow-node funder"><span>WALLET F</span><strong>Funding wallet</strong><small>0x93b2…11F0</small></div>
        <div className="n-flow-transfer"><span>↓</span><b>8 ETH</b><small>09:14 UTC</small></div>
        <div className="n-flow-transfer"><span>↓</span><b>3.5 ETH</b><small>09:22 UTC</small></div>
        <div className="n-flow-node wallet-a"><span>WALLET A</span><strong>We are investigating this one</strong><small>0x28c6…f21d60</small></div>
        <div className="n-flow-node wallet-b"><span>WALLET B</span><strong>Possible related wallet</strong><small>0x7f31…9A20</small></div>
      </div>
      <div className="n-meaning-grid"><article><span className="n-status live">WE CAN SAY</span><h3>The wallets are connected</h3><p>The same source funded both wallets within eight minutes. That is a useful lead.</p></article><article><span className="n-status partial">WE CANNOT SAY</span><h3>One person owns both</h3><p>A service, exchange, team treasury, or another person could have funded several wallets.</p></article></div>
    </section>
    <section className="n-panel n-second-clue">
      <div><span className="n-eyebrow">CLUE 02 · LOOK FOR REPEAT BEHAVIOUR</span><h2>One link starts the investigation. A second clue strengthens it.</h2><p>Before claiming common control, check whether the wallets repeatedly move money together or interact with the same places at similar times.</p></div>
      <ul><li><Check size={16} /><span><b>Same first funder</b>Observed in this case</span></li><li><X size={16} /><span><b>Repeated transfers between A and B</b>Not shown in this case</span></li><li><X size={16} /><span><b>Matching repeated counterparties and timing</b>Not shown in this case</span></li></ul>
    </section>
    <details className="n-panel n-raw-evidence"><summary>See the raw tables an analyst can inspect</summary><div><Results result={demo} hideConclusion onCandidate={() => undefined} /></div></details>
    <div className="n-next"><p>Your starting guess: <em>{lesson.hypothesis}</em></p><Button className="n-primary" onClick={() => updateLesson({ stage: 3 })}>Make the call <ArrowRight /></Button></div>
  </>;

  if (lesson.stage === 3) return <section className="n-panel n-verdict n-guided-verdict">
    <div className="n-eyebrow">MAKE THE CALL</div>
    <h2>Based on the evidence, what is the safest conclusion?</h2>
    <p>Select what the evidence supports—not what might be possible.</p>
    <fieldset><legend className="sr-only">Choose your verdict</legend>{current.options.map((option, index) => <label key={option} className={lesson.verdict === index ? "selected" : ""}><input type="radio" name="verdict" checked={lesson.verdict === index} onChange={() => updateLesson({ verdict: index })} /><span>{option}</span></label>)}</fieldset>
    <Button className="n-primary" disabled={lesson.verdict === null} onClick={() => updateLesson({ stage: 4, completed: true })}>Explain the answer <ArrowRight /></Button>
  </section>;

  return <section className="n-panel n-explanation n-wallet-explanation">
    <span className="n-status complete">CASE COMPLETE</span>
    <h2>{lesson.verdict === current.answer ? "You separated a clue from proof" : "The safe answer needs less certainty"}</h2>
    <div className="n-explain-grid">
      <article><span>01</span><h3>What happened</h3><p>Wallet F sent the first ETH to Wallet A and Wallet B. This creates a visible funding connection.</p></article>
      <article><span>02</span><h3>How we know</h3><p>The transaction history shows the first inbound transfers. The related-wallet result shows that both wallets share the same funder.</p></article>
      <article><span>03</span><h3>What we still cannot claim</h3><p>We cannot identify the owner from this link alone. We would need another independent clue before making that claim.</p></article>
    </div>
    <div className="n-investigate-recipe"><div><span className="n-eyebrow">REPEAT THIS IN INVESTIGATE</span><h3>Use the same method on any wallet</h3></div><ol><li><span>1</span>Paste a wallet address.</li><li><span>2</span>Choose its chain and time window.</li><li><span>3</span>Run Wallet Activity &amp; Connections.</li><li><span>4</span>Find the earliest inbound transfer.</li><li><span>5</span>Check Related Wallets for a shared funder.</li><li><span>6</span>Look for a second clue before claiming ownership.</li></ol></div>
    <div className="n-actions"><Button className="n-primary" onClick={onOpenTool}>Try it in Investigate <ArrowRight /></Button></div>
  </section>;
}

function Results({ result, cached, hideConclusion, onCandidate }: { result: InvestigationResult; cached?: boolean; hideConclusion?: boolean; onCandidate: (address: string, chain: string, demo: boolean) => void }) {
  const knownCredits = result.calls.every(c => c.credits !== null);
  const totalCredits = result.calls.reduce((total, c) => total + (c.credits ?? 0), 0);
  return <div className="n-results">
    <div className="n-provenance"><span className={`n-status ${result.status}`}>{cached ? `CACHED · ${result.status}` : result.status}</span><span>{result.chain} · {new Date(result.fetchedAt).toLocaleString()}</span><span className="n-provenance-note">{result.status === "demo" ? "Sample data" : "Nansen data · interpretations marked"}</span></div>
    {result.status === "partial" && <p role="status" className="n-message n-error">Some queries failed. Available evidence is shown.</p>}
    {result.status === "failed" && <p role="alert" className="n-message n-error">No live evidence returned. Check the query log.</p>}
    <div className="n-metrics">{result.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</div>
    <div className="n-evidence-grid">{result.evidence.map((block, index) => <section className={`n-panel n-evidence ${index === 0 ? "n-evidence-primary" : ""}`} key={block.title}><div className="n-evidence-heading"><h2>{block.title}</h2><span>{result.status === "demo" ? "SAMPLE" : "NANSEN"}</span></div>{block.bars && block.bars.length > 0 && <div className="n-bars" aria-label={`${block.title} chart`}>{block.bars.map(bar => <div key={bar.label}><div><span>{bar.label}</span><b>{bar.display}</b></div><div className="n-bar-track"><span style={{ width: `${Math.max(0, Math.min(bar.value, 100))}%` }} /></div></div>)}</div>}<div className="n-table-scroll"><table><caption className="sr-only">{block.title}</caption><thead><tr>{block.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} title={cell}>{cell.startsWith("0x") ? shortAddress(cell) : cell}</td>)}</tr>)}</tbody></table>{block.rows.length === 0 && <p className="n-no-evidence">{result.calls.some(c => c.endpoint === block.source && c.status === "failed") ? "Query failed. No evidence available." : "No rows returned. This does not prove inactivity."}</p>}</div><div className="n-source">{block.source}</div></section>)}</div>
    {result.candidates && result.candidates.length > 0 && <section className="n-panel n-candidates"><div className="n-evidence-heading"><h2>Evidence gates</h2><span>RULES</span></div>{result.candidates.map(candidate => <article key={candidate.address}><div><h3>{candidate.symbol}<span className={`n-status ${candidate.passed ? "live" : "partial"}`}>{candidate.passed ? "PASSES" : "UNQUALIFIED"}</span></h3><ul>{candidate.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></div><Button variant="outline" onClick={() => onCandidate(candidate.address, candidate.chain, result.status === "demo")}>Open Token Analysis <ArrowRight /></Button></article>)}</section>}
    {!hideConclusion && <section className="n-panel n-conclusion"><div className="n-eyebrow">INTERPRETATION · {result.status === "demo" ? "SAMPLE DATA" : "RETURNED DATA"}</div><h2>{result.conclusion}</h2><ul>{result.observations.map(observation => <li key={observation}>{observation}</li>)}</ul></section>}
    <details className="n-panel n-query-log"><summary><span><Database size={16} /> Query log · {result.calls.length} {result.status === "demo" ? "simulated queries" : "requests"}</span><span>{knownCredits ? totalCredits : `${totalCredits} known; total unavailable`} credits consumed</span></summary><div className="n-table-scroll"><table><thead><tr><th>Endpoint</th><th>Status</th><th>Credits used</th><th>Details</th></tr></thead><tbody>{result.calls.map((call, i) => <tr key={`${call.endpoint}-${i}`}><td><code>{call.endpoint}</code></td><td>{call.status}</td><td>{call.credits ?? "Not reported"}</td><td>{call.error ?? (call.status === "demo" ? "No upstream request made" : "Completed")}{call.requestId && <small>Request: {call.requestId}</small>}{call.remaining && <small>Credits remaining: {call.remaining}</small>}</td></tr>)}</tbody></table></div></details>
  </div>;
}
