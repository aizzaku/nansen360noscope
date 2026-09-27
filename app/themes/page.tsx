import type { CSSProperties } from "react";
import { ArrowUpRight, Check, Network, Search, ShieldCheck, Sparkles } from "lucide-react";

import "./themes.css";

type Theme = {
  id: string;
  number: string;
  name: string;
  descriptor: string;
  rationale: string;
  bg: string;
  panel: string;
  panelAlt: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  accentText: string;
  display: string;
  body: string;
  treatment: string;
};

const themes: Theme[] = [
  {
    id: "antique",
    number: "01",
    name: "Antique Gold",
    descriptor: "Quiet authority",
    rationale: "Muted metal, ink-black surfaces, and archival typography. It feels like a serious research instrument with a collector’s finish.",
    bg: "#0d0e0d",
    panel: "#141512",
    panelAlt: "#1a1b17",
    text: "#eee8da",
    muted: "#918c80",
    line: "#34332d",
    accent: "#bd9541",
    accentText: "#11110f",
    display: '"Palatino Linotype", Palatino, serif',
    body: '"Segoe UI", sans-serif',
    treatment: "Refined / archival",
  },
  {
    id: "signal",
    number: "02",
    name: "Signal Yellow",
    descriptor: "Technical urgency",
    rationale: "Hard black, luminous yellow, and instrument-panel density. The clearest hackathon statement and the most energetic live-data feel.",
    bg: "#080908",
    panel: "#10110f",
    panelAlt: "#171915",
    text: "#f1f2e9",
    muted: "#81857b",
    line: "#2d302a",
    accent: "#f0dd28",
    accentText: "#080908",
    display: '"Arial Narrow", Bahnschrift, sans-serif',
    body: "Bahnschrift, sans-serif",
    treatment: "Technical / kinetic",
  },
  {
    id: "champagne",
    number: "03",
    name: "Graphite Champagne",
    descriptor: "Editorial intelligence",
    rationale: "Soft graphite, pale champagne, and generous spacing. More premium and composed, with the investigation reading like a private briefing.",
    bg: "#151616",
    panel: "#1d1e1d",
    panelAlt: "#242523",
    text: "#f0ece3",
    muted: "#a19c92",
    line: "#3b3b37",
    accent: "#d8c3a0",
    accentText: "#171716",
    display: 'Georgia, "Times New Roman", serif',
    body: 'Optima, "Segoe UI", sans-serif',
    treatment: "Premium / editorial",
  },
];

export default function ThemeComparison() {
  return (
    <main className="theme-study">
      <header className="study-header">
        <div>
          <p className="study-eyebrow">Nansen Fieldwork / Theme study</p>
          <h1>Three ways to work in the dark.</h1>
        </div>
        <p className="study-intro">Same investigation. Different character. Compare the interface, not a palette strip.</p>
      </header>

      <nav className="study-nav" aria-label="Theme mockups">
        {themes.map((theme) => <a key={theme.id} href={`#${theme.id}`}><span>{theme.number}</span>{theme.name}</a>)}
      </nav>

      <div className="mock-list">
        {themes.map((theme) => <ThemeMock key={theme.id} theme={theme} />)}
      </div>
    </main>
  );
}

function ThemeMock({ theme }: { theme: Theme }) {
  const variables = {
    "--mock-bg": theme.bg,
    "--mock-panel": theme.panel,
    "--mock-panel-alt": theme.panelAlt,
    "--mock-text": theme.text,
    "--mock-muted": theme.muted,
    "--mock-line": theme.line,
    "--mock-accent": theme.accent,
    "--mock-accent-text": theme.accentText,
    "--mock-display": theme.display,
    "--mock-body": theme.body,
  } as CSSProperties;

  return (
    <section id={theme.id} className="mock-section" style={variables}>
      <div className="mock-caption">
        <div className="mock-index">{theme.number}</div>
        <div className="mock-title-block">
          <p>{theme.treatment}</p>
          <h2>{theme.name}</h2>
        </div>
        <p className="mock-rationale">{theme.rationale}</p>
        <div className="swatches" aria-label={`${theme.name} color palette`}>
          {[theme.bg, theme.panelAlt, theme.accent, theme.text].map((color) => <span key={color} style={{ background: color }} title={color} />)}
        </div>
      </div>

      <div className="product-frame">
        <header className="product-topbar">
          <div className="product-brand"><span className="brand-mark"><Network /></span><span><strong>Nansen Fieldwork</strong><small>Learn by investigating</small></span></div>
          <div className="product-progress"><span>2 / 5 cases</span><i><b /></i></div>
          <span className="live-pill"><i /> Live data</span>
        </header>

        <div className="product-body">
          <aside className="case-rail">
            <p className="rail-label">Case files</p>
            {["Follow the money", "Trader or lucky?", "Token due diligence", "Find the signal", "DeFi X-ray"].map((label, index) => (
              <div key={label} className={`case-row ${index === 0 ? "active" : ""}`}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong>{index === 0 ? <ArrowUpRight /> : null}
              </div>
            ))}
            <div className="rail-note"><Sparkles /><p>Five practical cases.<br />One investigation method.</p></div>
          </aside>

          <div className="workspace">
            <div className="workspace-heading">
              <div><p>Case 01 / Wallet investigation</p><h3>Follow the money</h3><span>Trace holdings, activity, and connected wallets.</span></div>
              <div className="question"><small>Your question</small><strong>Standalone wallet—or coordinated network?</strong></div>
            </div>

            <div className="search-row">
              <div><Search /> 0x28c6…f21d60</div><span>Ethereum</span><button>Run investigation <ArrowUpRight /></button>
            </div>

            <div className="tabs"><span>01 · Brief</span><span className="selected">02 · Evidence</span><span>03 · Verdict</span></div>

            <div className="evidence-layout">
              <div className="evidence-main">
                <div className="metric-grid">
                  {[['Portfolio', '$18.5M'], ['Assets', '23'], ['30d activity', '47'], ['Connections', '6']].map(([label, value], index) => <div key={label}><small>{label}</small><strong className={index === 3 ? "accent-value" : ""}>{value}</strong></div>)}
                </div>
                <div className="network-map">
                  <div className="map-label"><strong>Relationship map</strong><small>Ethereum</small></div>
                  <svg viewBox="0 0 660 260" aria-hidden="true">
                    <path d="M330 130L110 62M330 130L550 62M330 130L108 208M330 130L552 208" />
                    <circle cx="330" cy="130" r="34" className="hub" />
                    <circle cx="110" cy="62" r="18" /><circle cx="550" cy="62" r="18" /><circle cx="108" cy="208" r="18" /><circle cx="552" cy="208" r="18" />
                  </svg>
                  <div className="wallet-node"><small>Target wallet</small><strong>0x28c6…f21d60</strong></div>
                  <span className="node n1">Exchange deposit</span><span className="node n2">First funder</span><span className="node n3">DEX router</span><span className="node n4">Related wallet</span>
                </div>
              </div>

              <aside className="query-panel">
                <div className="query-title"><strong>Query log</strong><small>3 calls</small></div>
                {["Current balance", "Transactions", "Related wallets"].map((call) => <div className="query-row" key={call}><Check /><span><strong>{call}</strong><small>1 credit · complete</small></span></div>)}
                <div className="analyst-note"><ShieldCheck /><small>Investigator note</small><p>Shared funding and repeated exchange deposits outweigh the standalone-wallet hypothesis.</p></div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
