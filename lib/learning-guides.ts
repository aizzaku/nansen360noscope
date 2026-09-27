import type { ToolId } from "./playbooks";

export type LearningGuide = {
  level: string;
  goal: string;
  scenario: string;
  cast: { label: string; description: string }[];
  terms: { term: string; definition: string }[];
  predictions: [string, string, string];
  clueTitle: string;
  clueSummary: string;
  supported: { title: string; body: string };
  caution: { title: string; body: string };
  secondClue: { title: string; body: string };
  checks: { observed: boolean; label: string; note: string }[];
  explanation: { title: string; body: string }[];
  recipeTitle: string;
  recipe: string[];
  evidenceAction: string;
};

export const learningGuides: Record<ToolId, LearningGuide> = {
  wallet: {
    level: "BEGINNER",
    goal: "Learn how to trace a wallet's funding, activity, and relationships without overstating what a connection proves.",
    scenario: "When two wallets share a funding source, how should you evaluate the connection?",
    cast: [
      { label: "Target wallet", description: "The address you want to understand" },
      { label: "Funding source", description: "The address behind an early inbound transfer" },
      { label: "Related wallets", description: "Addresses linked by observed on-chain activity" },
    ],
    terms: [
      { term: "First funder", definition: "The source of a wallet's earliest observed inbound funding." },
      { term: "Counterparty", definition: "An address that sends assets to or receives assets from the target." },
      { term: "Connection", definition: "An observed relationship that is a lead, not proof of ownership." },
    ],
    predictions: [
      "A shared funder proves common ownership.",
      "A shared funder is a lead that needs another independent signal.",
      "I should inspect the transfers before forming a conclusion.",
    ],
    clueTitle: "Trace funding before interpreting relationships",
    clueSummary: "Start with early inbound transfers, then compare related wallets, repeated counterparties, timing, and transaction patterns.",
    supported: { title: "An on-chain relationship may be present", body: "Matching funding or transaction evidence can support a connection when it appears in the live result." },
    caution: { title: "The relationship identifies an owner", body: "A service, exchange, treasury, or unrelated sender can connect multiple wallets without common ownership." },
    secondClue: { title: "Test the first link with independent evidence", body: "Look for repeated transfers, shared counterparties, coordinated timing, or consistent behavior before strengthening the conclusion." },
    checks: [
      { observed: true, label: "Verify the earliest inbound transfer", note: "Use the live transaction history." },
      { observed: true, label: "Compare relationship and activity patterns", note: "Seek an independent supporting signal." },
      { observed: false, label: "Treat one connection as identity proof", note: "Keep ownership claims explicitly limited." },
    ],
    explanation: [
      { title: "What to establish", body: "Identify how the wallet was funded, what it does, and which addresses recur in its activity." },
      { title: "How to verify it", body: "Cross-check balances, transactions, and related-wallet evidence instead of relying on one endpoint." },
      { title: "Where to stop", body: "Describe the observed connection and its strength without assigning identity or control that the chain does not prove." },
    ],
    recipeTitle: "Investigate any wallet",
    recipe: ["Enter a wallet address.", "Choose the relevant chain and time window.", "Review current balances and recent activity.", "Trace early inbound funding.", "Compare related wallets and recurring counterparties.", "Require another signal before making an ownership claim."],
    evidenceAction: "Trace the relationships",
  },
  trader: {
    level: "INTERMEDIATE",
    goal: "Learn how to test whether a trader's performance is broad, repeatable, and supported by enough closed activity.",
    scenario: "How do you tell durable trading performance from one exceptional result?",
    cast: [
      { label: "PnL summary", description: "The headline realized result for the selected period" },
      { label: "Token attribution", description: "The contribution of individual tokens to total PnL" },
      { label: "Trade history", description: "The size, timing, wins, and losses behind the summary" },
    ],
    terms: [
      { term: "Realized PnL", definition: "Profit or loss from closed positions." },
      { term: "Win rate", definition: "The share of closed positions that made money." },
      { term: "Concentration", definition: "How much one trade drives the total result." },
    ],
    predictions: [
      "Positive headline PnL proves a repeatable strategy.",
      "I should test concentration, sample size, and downside first.",
      "Win rate alone is enough to rank traders.",
    ],
    clueTitle: "Remove the outlier before judging skill",
    clueSummary: "Compare total realized profit with token-level profit, then inspect the number and distribution of closed positions.",
    supported: { title: "Performance may be broad-based", body: "The case strengthens when profit remains distributed across multiple tokens and trades in the live result." },
    caution: { title: "Repeatability is proven", body: "A short period, small sample, or concentrated winner cannot establish durable skill." },
    secondClue: { title: "Test the result across time and market conditions", body: "Repeat the analysis across another period and compare downside, trade count, and token concentration." },
    checks: [
      { observed: true, label: "Measure token-level concentration", note: "Identify how much the largest winner contributes." },
      { observed: true, label: "Inspect sample size and downside", note: "Review closed trades, losses, and timing." },
      { observed: false, label: "Extrapolate one period indefinitely", note: "Repeat the analysis across different windows." },
    ],
    explanation: [
      { title: "What to establish", body: "Determine whether the result comes from repeatable activity or a small number of exceptional trades." },
      { title: "How to verify it", body: "Read PnL summary, token attribution, and trade history together." },
      { title: "Where to stop", body: "Describe the observed track record without presenting historical performance as a prediction." },
    ],
    recipeTitle: "Stress-test any trader",
    recipe: ["Enter the trader wallet.", "Choose a meaningful time window.", "Review realized PnL, win rate, and trade count.", "Rank PnL by token.", "Recalculate the story without the largest winner.", "Compare another period before judging repeatability."],
    evidenceAction: "Stress-test performance",
  },
  token: {
    level: "INTERMEDIATE",
    goal: "Learn how to evaluate token ownership and flows by combining supportive and contradictory evidence.",
    scenario: "When a labelled cohort is buying, what else must you verify before forming a token thesis?",
    cast: [
      { label: "Holder distribution", description: "How supply is distributed across addresses" },
      { label: "Cohort flows", description: "Net movement for labelled wallet groups" },
      { label: "Exchange flows", description: "Movement toward or away from exchange-labelled wallets" },
    ],
    terms: [
      { term: "Netflow", definition: "Inflows minus outflows for a wallet or cohort over a period." },
      { term: "Holder concentration", definition: "The share of supply controlled by a small group of addresses." },
      { term: "Exchange flow", definition: "Token movement involving exchange-labelled wallets." },
    ],
    predictions: [
      "Positive cohort netflow is enough to form a bullish conclusion.",
      "I should compare cohort flow with concentration and exchange flow.",
      "Transfer count alone explains demand.",
    ],
    clueTitle: "Put supportive and conflicting flows together",
    clueSummary: "Read labelled-cohort buying beside ownership concentration and tokens moving toward exchanges.",
    supported: { title: "A cohort-flow signal may be meaningful", body: "The signal becomes more useful when several independent wallets participate and ownership is not excessively concentrated." },
    caution: { title: "The flow predicts price direction", body: "Labels, transfers, and exchange movement describe behavior; they do not guarantee future returns." },
    secondClue: { title: "Challenge the narrative with opposing evidence", body: "Check whether concentration, exchange flows, or a small number of wallets weakens the initial interpretation." },
    checks: [
      { observed: true, label: "Inspect holder concentration", note: "Separate broad ownership from a concentrated supply." },
      { observed: true, label: "Compare cohort and exchange flows", note: "Look for agreement and contradiction." },
      { observed: false, label: "Convert flow directly into a price forecast", note: "Keep the conclusion behavioral and evidence-bound." },
    ],
    explanation: [
      { title: "What to establish", body: "Identify who holds the token, which cohorts are moving it, and where those tokens are going." },
      { title: "How to verify it", body: "Cross-check holders, flow intelligence, and buyer and seller evidence over the same period." },
      { title: "Where to stop", body: "State the observed ownership and flow pattern without turning it into a guaranteed market outcome." },
    ],
    recipeTitle: "Analyze any token",
    recipe: ["Enter the token contract.", "Choose the correct chain and window.", "Inspect top-holder concentration.", "Compare labelled-cohort netflow.", "Review buyers, sellers, and exchange flows.", "Record both supporting and conflicting evidence."],
    evidenceAction: "Test the token thesis",
  },
  signal: {
    level: "INTERMEDIATE",
    goal: "Learn how to turn a token screen into a research shortlist using explicit, repeatable evidence gates.",
    scenario: "How should you rank Smart Money candidates without treating the screen as a recommendation?",
    cast: [
      { label: "Liquidity", description: "The market depth available for entering or exiting" },
      { label: "Wallet breadth", description: "How many labelled wallets support the signal" },
      { label: "Netflow", description: "The direction and size of cohort movement" },
    ],
    terms: [
      { term: "Screen", definition: "A filter that creates research candidates." },
      { term: "Liquidity", definition: "Available market depth, not guaranteed execution." },
      { term: "Evidence gate", definition: "A condition every candidate must pass." },
    ],
    predictions: [
      "The candidate with the largest inflow is automatically the best lead.",
      "I should require liquidity, wallet breadth, and positive flow together.",
      "A passing screen completes the research process.",
    ],
    clueTitle: "Require every gate, not one exciting number",
    clueSummary: "Apply liquidity and wallet-breadth thresholds before treating positive netflow as a research lead.",
    supported: { title: "A candidate deserves deeper research", body: "A token can enter the shortlist when it passes each predefined gate in the live result." },
    caution: { title: "The ranking identifies a winner", body: "A screen does not establish token quality, holder risk, narrative strength, or expected return." },
    secondClue: { title: "Open each candidate and verify it independently", body: "Use the token workflow to inspect concentration and flows, then profile the wallets behind the signal." },
    checks: [
      { observed: true, label: "Define thresholds before ranking", note: "Use the same gates for every candidate." },
      { observed: true, label: "Verify passing tokens independently", note: "Continue into token and wallet analysis." },
      { observed: false, label: "Treat rank as a recommendation", note: "The output is a shortlist, not a conclusion." },
    ],
    explanation: [
      { title: "What to establish", body: "Find candidates that pass the same liquidity, participation, and flow requirements." },
      { title: "How to verify it", body: "Compare all returned candidates against the thresholds, then investigate each passing token." },
      { title: "Where to stop", body: "Use the screen to prioritize research without claiming that a candidate will outperform." },
    ],
    recipeTitle: "Build a defensible shortlist",
    recipe: ["Choose a chain.", "Set a realistic liquidity floor.", "Require several labelled holders.", "Compare netflow across candidates.", "Reject candidates that fail any gate.", "Open passing tokens for deeper analysis."],
    evidenceAction: "Apply the research gates",
  },
  defi: {
    level: "ADVANCED",
    goal: "Learn how to map protocol exposure and debt while keeping unavailable risk metrics explicitly unknown.",
    scenario: "What can a portfolio reveal about DeFi exposure, and what requires protocol-specific risk data?",
    cast: [
      { label: "Liquid balances", description: "Assets currently held in the wallet" },
      { label: "Protocol positions", description: "Assets deployed inside DeFi protocols" },
      { label: "Debt", description: "Borrowed value that may create liquidation exposure" },
    ],
    terms: [
      { term: "Gross assets", definition: "Assets before subtracting debt." },
      { term: "Protocol concentration", definition: "Exposure clustered in one protocol, chain, or position." },
      { term: "Health factor", definition: "A protocol-specific measure of borrowing safety that may require separate data." },
    ],
    predictions: [
      "Portfolio value alone is enough to estimate liquidation risk.",
      "I should map debt and concentration, then obtain protocol risk metrics.",
      "Exposure across several chains removes protocol risk.",
    ],
    clueTitle: "Separate visible exposure from missing risk data",
    clueSummary: "Map liquid assets, deployed positions, protocol concentration, and debt before asking what the evidence cannot answer.",
    supported: { title: "Exposure and debt can be mapped", body: "The live portfolio can show where assets are deployed, how concentrated they are, and whether debt is present." },
    caution: { title: "A liquidation threshold is known", body: "Do not calculate liquidation risk without protocol-specific collateral parameters, health factors, and oracle assumptions." },
    secondClue: { title: "Keep unavailable risk metrics unavailable", body: "Open the relevant protocol and verify collateral, debt, health, and liquidation settings before estimating a safety buffer." },
    checks: [
      { observed: true, label: "Map positions and debt by protocol", note: "Separate liquid balances from deployed exposure." },
      { observed: true, label: "Measure protocol and chain concentration", note: "Identify where risk is clustered." },
      { observed: false, label: "Invent missing liquidation metrics", note: "Retrieve them from the protocol before calculating risk." },
    ],
    explanation: [
      { title: "What to establish", body: "Determine where assets are held, where they are deployed, and which positions include debt." },
      { title: "How to verify it", body: "Combine wallet balances with protocol positions, chain distribution, and debt evidence." },
      { title: "Where to stop", body: "Describe exposure and missing inputs without estimating liquidation levels that the available evidence does not support." },
    ],
    recipeTitle: "Map a wallet's DeFi exposure",
    recipe: ["Enter the wallet address.", "Review liquid balances.", "Map positions by protocol and chain.", "Identify debt and concentration.", "List missing health and collateral metrics.", "Open the protocol before estimating liquidation risk."],
    evidenceAction: "Map the exposure",
  },
};
