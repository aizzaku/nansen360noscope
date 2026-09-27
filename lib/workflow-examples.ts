import type { RunInput, ToolId } from "./playbooks";

export type WorkflowExample = {
  title: string;
  subjectLabel: string;
  purpose: string;
  steps: [string, string, string];
  input: Partial<RunInput>;
  sourceLabel: string;
  sourceUrl: string;
  caveat?: string;
};

export const workflowExamples: Record<ToolId, [WorkflowExample, WorkflowExample]> = {
  wallet: [
    {
      title: "Map an exchange hot wallet",
      subjectLabel: "Binance 14 · Ethereum",
      purpose: "Separate high-volume exchange operations from evidence of shared wallet ownership.",
      steps: ["Review the asset mix and recent transfers.", "Trace recurring counterparties and first funding.", "Treat shared funders as leads, then seek a second clue."],
      input: { subject: "0x28c6c06298d514db089934071355e5743bf21d60", chain: "ethereum", days: 30 },
      sourceLabel: "Nansen Profiler documentation",
      sourceUrl: "https://docs.nansen.ai/api/profiler/address-related-wallets",
    },
    {
      title: "Investigate a related-wallet seed",
      subjectLabel: "Nansen guide target · Ethereum",
      purpose: "Start from a public address used in Nansen's related-wallet workflow and test how strong each link is.",
      steps: ["Establish the wallet's transaction context.", "Inspect related wallets and shared counterparties.", "Compare timing and repeated behavior before attributing control."],
      input: { subject: "0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50", chain: "ethereum", days: 30 },
      sourceLabel: "Nansen related-wallet guide",
      sourceUrl: "https://docs.nansen.ai/guides/templates/complex-use-cases/use-case-3-identifying-related-wallets-at-scale",
    },
  ],
  trader: [
    {
      title: "Stress-test a PnL profile",
      subjectLabel: "Nansen guide wallet · Ethereum",
      purpose: "Check whether headline profitability survives after removing the wallet's best token.",
      steps: ["Review the 90-day PnL summary.", "Measure how much the top token contributes.", "Inspect DEX trades and losses before judging repeatability."],
      input: { subject: "0x39d52da6beec991f075eebe577474fd105c5caec", chain: "ethereum", days: 90 },
      sourceLabel: "Nansen copy-trading guide",
      sourceUrl: "https://docs.nansen.ai/guides/templates/complex-use-cases/use-case-4-copytrading-top-performing-wallets",
    },
    {
      title: "Compare a diversified early whale",
      subjectLabel: "Early Base whale · Base",
      purpose: "Contrast a wider historical token basket with a result dominated by one exceptional trade.",
      steps: ["Measure realized PnL over 90 days.", "Rank results by token and identify concentration.", "Compare breadth, losses, and trade frequency."],
      input: { subject: "0x1f5bbef0722b6188b87b29dff530d6cfb5a46967", chain: "base", days: 90 },
      sourceLabel: "Nansen Research · Early Base Whales",
      sourceUrl: "https://research.nansen.ai/articles/what-are-early-base-whales-doing-on-chain",
      caveat: "The article describes a historical holdings snapshot, not current profitability.",
    },
  ],
  token: [
    {
      title: "Challenge an Ethereum meme-token flow",
      subjectLabel: "PEPE · Ethereum",
      purpose: "Read Smart Money activity beside holder concentration and exchange-bound flow.",
      steps: ["Measure top-holder concentration.", "Compare labelled-wallet and exchange netflows.", "Inspect recent buyers and sellers for confirmation or conflict."],
      input: { subject: "0x6982508145454ce325ddbe47a25d4ec3d2311933", chain: "ethereum", days: 30 },
      sourceLabel: "Nansen Flow Intelligence documentation",
      sourceUrl: "https://docs.nansen.ai/api/token-god-mode/flow-intelligence",
    },
    {
      title: "Compare a Solana token flow",
      subjectLabel: "PENGU · Solana",
      purpose: "Repeat the holder-and-flow method on the Solana token used in Nansen's documentation.",
      steps: ["Review holder distribution.", "Compare cohort inflows and outflows.", "Inspect buyer and seller activity before forming a narrative."],
      input: { subject: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", chain: "solana", days: 30 },
      sourceLabel: "Nansen token-flow documentation",
      sourceUrl: "https://docs.nansen.ai/api/token-god-mode/flows",
    },
  ],
  signal: [
    {
      title: "Emerging Ethereum flow",
      subjectLabel: "Ethereum · stricter liquidity gate",
      purpose: "Find liquid candidates supported by several labelled wallets rather than one large inflow.",
      steps: ["Require at least $1M of liquidity.", "Require five Smart Money holders.", "Open passing candidates in Token Analysis."],
      input: { subject: "", chain: "ethereum", days: 7, liquidity: 1_000_000, smartMoney: 5 },
      sourceLabel: "Nansen Smart Money workflow",
      sourceUrl: "https://docs.nansen.ai/guides/templates/complex-use-cases/use-case-1-automated-token-tracking-and-smart-money-analysis",
      caveat: "These thresholds are product presets, not Nansen recommendations.",
    },
    {
      title: "Early Base discovery",
      subjectLabel: "Base · exploratory liquidity gate",
      purpose: "Create a wider early-stage shortlist while still rejecting single-wallet and thin-liquidity noise.",
      steps: ["Require at least $250K of liquidity.", "Require three Smart Money holders.", "Validate each candidate's holders and flows."],
      input: { subject: "", chain: "base", days: 7, liquidity: 250_000, smartMoney: 3 },
      sourceLabel: "Nansen multi-chain tracking guide",
      sourceUrl: "https://nansen.ai/post/track-onchain-across-all-supported-chains",
      caveat: "These thresholds are product presets, not Nansen recommendations.",
    },
  ],
  defi: [
    {
      title: "Map staking concentration",
      subjectLabel: "Early Base whale · Ethereum",
      purpose: "Compare liquid balances with historically reported Lido and EigenLayer exposure.",
      steps: ["Split liquid and deployed assets.", "Map exposure by protocol and chain.", "Inspect debt, then mark missing health metrics explicitly."],
      input: { subject: "0x7805a78a3ad50d460efabf32562d1884c3d0259a", chain: "ethereum" },
      sourceLabel: "Nansen Research · Early Base Whales",
      sourceUrl: "https://research.nansen.ai/articles/what-are-early-base-whales-doing-on-chain",
      caveat: "The reported positions are historical; the current portfolio may differ.",
    },
    {
      title: "Inspect concentrated LP exposure",
      subjectLabel: "Early Base whale · Base",
      purpose: "Map a wallet historically reported with material BaseSwap liquidity-provider positions.",
      steps: ["Compare wallet and deployed balances.", "Measure protocol and LP concentration.", "Do not estimate liquidation risk without protocol-specific data."],
      input: { subject: "0xde6b2a06407575b98724818445178c1f5fd53361", chain: "base" },
      sourceLabel: "Nansen Research · Early Base Whales",
      sourceUrl: "https://research.nansen.ai/articles/what-are-early-base-whales-doing-on-chain",
      caveat: "The reported positions are historical; the current portfolio may differ.",
    },
  ],
};
