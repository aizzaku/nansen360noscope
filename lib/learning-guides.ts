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
    goal: "Learn how to follow the first money entering a wallet and decide what that connection really proves.",
    scenario: "Two wallets received their first ETH from the same place. Does that mean one person owns both?",
    cast: [
      { label: "Wallet A", description: "The wallet we are investigating" },
      { label: "Wallet B", description: "A wallet that may be connected" },
      { label: "Wallet F", description: "The wallet that funded both" },
    ],
    terms: [
      { term: "Wallet", definition: "An on-chain account." },
      { term: "Funder", definition: "A wallet that sent it starter crypto." },
      { term: "Important", definition: "A connection is not proof of ownership." },
    ],
    predictions: [
      "The same person probably owns both wallets.",
      "The wallets are connected, but this one clue cannot prove who owns them.",
      "I am not sure yet—I want to see the money flow first.",
    ],
    clueTitle: "Start with the first money in",
    clueSummary: "Look backward to find the wallet that gave each address the crypto it needed to begin operating.",
    supported: { title: "The wallets are connected", body: "The same source funded both wallets within eight minutes. That is a useful lead." },
    caution: { title: "One person owns both", body: "A service, exchange, team treasury, or another person could have funded several wallets." },
    secondClue: { title: "One link starts the investigation. A second clue strengthens it.", body: "Before claiming common control, check whether the wallets repeatedly move money together or interact with the same places at similar times." },
    checks: [
      { observed: true, label: "Same first funder", note: "Observed in this case" },
      { observed: false, label: "Repeated transfers between A and B", note: "Not shown in this case" },
      { observed: false, label: "Matching counterparties and timing", note: "Not shown in this case" },
    ],
    explanation: [
      { title: "What happened", body: "Wallet F sent the first ETH to Wallet A and Wallet B, creating a visible funding connection." },
      { title: "How we know", body: "Transaction history shows the first inbound transfers, while related-wallet evidence shows the shared funder." },
      { title: "What we still cannot claim", body: "This link does not identify the owner. Another independent clue is needed before making that claim." },
    ],
    recipeTitle: "Use the same method on any wallet",
    recipe: ["Paste a wallet address.", "Choose its chain and time window.", "Run Wallet Activity & Connections.", "Find the earliest inbound transfer.", "Check Related Wallets for a shared funder.", "Look for a second clue before claiming ownership."],
    evidenceAction: "Follow the money",
  },
  trader: {
    level: "INTERMEDIATE",
    goal: "Learn how to test whether a trader's result looks repeatable or depends on one exceptional win.",
    scenario: "A trader made $184K in 30 days. Is that enough to call the strategy consistently profitable?",
    cast: [
      { label: "Total PnL", description: "The headline result across closed positions" },
      { label: "Best token", description: "The single largest source of realized profit" },
      { label: "Remainder", description: "Performance after removing that best trade" },
    ],
    terms: [
      { term: "Realized PnL", definition: "Profit or loss from closed positions." },
      { term: "Win rate", definition: "The share of closed positions that made money." },
      { term: "Concentration", definition: "How much one trade drives the total result." },
    ],
    predictions: [
      "The headline profit proves the strategy is repeatable.",
      "The trader may be skilled, but I need to remove the best token first.",
      "Win rate matters more than the size of wins and losses.",
    ],
    clueTitle: "Remove the outlier before judging skill",
    clueSummary: "Compare total realized profit with token-level profit, then inspect the number and distribution of closed positions.",
    supported: { title: "Profit remains without the best token", body: "Removing the largest winner still leaves $53.4K in realized profit across the sample." },
    caution: { title: "Repeatability is proven", body: "One token produced 71% of net profit, and a 30-day sample cannot establish durable skill." },
    secondClue: { title: "Consistency needs more than a positive remainder.", body: "Check the sample size, downside, trade timing, and whether profits persist across different market conditions." },
    checks: [
      { observed: true, label: "Positive PnL without the best token", note: "$53.4K remains" },
      { observed: true, label: "Enough trades to inspect", note: "87 closed positions in the fixture" },
      { observed: false, label: "Performance across multiple regimes", note: "Not established by 30 days" },
    ],
    explanation: [
      { title: "What happened", body: "The trader realized $184.2K, with $130.8K coming from a single token." },
      { title: "How we know", body: "PnL summary gives the headline; token PnL reveals concentration; trade history gives the sample size." },
      { title: "What we still cannot claim", body: "The result may be genuine, but it does not guarantee the same edge will persist." },
    ],
    recipeTitle: "Stress-test any trader's track record",
    recipe: ["Paste the trader wallet.", "Choose a meaningful time window.", "Review realized PnL and win rate.", "Rank profit by token.", "Remove the largest winner mentally.", "Inspect losses and repeat across another period."],
    evidenceAction: "Stress-test the result",
  },
  token: {
    level: "INTERMEDIATE",
    goal: "Learn how to challenge an accumulation story with holder concentration and exchange flows.",
    scenario: "Smart Money is buying a token. Does that automatically make the flow bullish?",
    cast: [
      { label: "Smart Money", description: "A labelled wallet cohort with positive netflow" },
      { label: "Top holders", description: "The addresses controlling a large supply share" },
      { label: "Exchanges", description: "Destinations that can increase sell-side availability" },
    ],
    terms: [
      { term: "Netflow", definition: "Tokens in minus tokens out for a cohort." },
      { term: "Concentration", definition: "Supply held by a small group of addresses." },
      { term: "Exchange inflow", definition: "Tokens moving toward exchange-labelled wallets." },
    ],
    predictions: [
      "Smart Money inflow is enough to make the token attractive.",
      "The inflow is a lead, but concentration and exchange flow may contradict it.",
      "Transfer count alone will tell me whether demand is real.",
    ],
    clueTitle: "Put supportive and conflicting flows together",
    clueSummary: "Read labelled-cohort buying beside ownership concentration and tokens moving toward exchanges.",
    supported: { title: "Labelled wallets are accumulating", body: "The fixture shows +$1.8M of Smart Money netflow during the measured period." },
    caution: { title: "The signal is uncomplicated", body: "Top holders control 47.8%, while exchange netflow is +$4.1M toward potential sell-side venues." },
    secondClue: { title: "A useful thesis must survive contradictory evidence.", body: "Check who owns supply, whether several independent wallets participate, and where tokens move after they are bought." },
    checks: [
      { observed: true, label: "Positive Smart Money netflow", note: "+$1.8M in the fixture" },
      { observed: true, label: "Material holder concentration", note: "Top 10 hold 47.8%" },
      { observed: false, label: "Low exchange-bound supply", note: "Exchange inflow is elevated" },
    ],
    explanation: [
      { title: "What happened", body: "A labelled cohort accumulated while a larger value moved toward exchanges." },
      { title: "How we know", body: "Flow intelligence, holder distribution, and buyer/seller cohorts expose the competing signals." },
      { title: "What we still cannot claim", body: "Neither wallet labels nor exchange movements reveal future price direction on their own." },
    ],
    recipeTitle: "Challenge any token-flow narrative",
    recipe: ["Paste the token contract.", "Choose the chain and window.", "Inspect top-holder concentration.", "Compare Smart Money netflow.", "Check exchange-bound flows.", "Treat agreement as a lead, never a guarantee."],
    evidenceAction: "Challenge the narrative",
  },
  signal: {
    level: "INTERMEDIATE",
    goal: "Learn how to turn a ranked token list into a shortlist that passes independent evidence gates.",
    scenario: "Several tokens show Smart Money inflows. Which one deserves deeper investigation?",
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
      "The token with the largest inflow is automatically the best lead.",
      "I should require liquidity, wallet breadth, and positive flow together.",
      "Recent price appreciation is enough to rank the candidates.",
    ],
    clueTitle: "Require every gate, not one exciting number",
    clueSummary: "Apply liquidity and wallet-breadth thresholds before treating positive netflow as a research lead.",
    supported: { title: "Two candidates pass the selected gates", body: "AERO and WETH clear the illustrative liquidity and wallet-breadth thresholds." },
    caution: { title: "The ranking predicts a winner", body: "The screen finds candidates; it does not assess holder concentration, narrative quality, or future returns." },
    secondClue: { title: "Screening is the start of research, not the conclusion.", body: "Open each passing token, test concentration and flows, then profile the participating wallets before forming a thesis." },
    checks: [
      { observed: true, label: "Liquidity threshold", note: "Applied to every candidate" },
      { observed: true, label: "Multiple labelled wallets", note: "Breadth reduces single-wallet noise" },
      { observed: false, label: "Token-level due diligence", note: "Still required after the screen" },
    ],
    explanation: [
      { title: "What happened", body: "Two tokens passed every numeric gate while a thin-liquidity token failed despite large inflow." },
      { title: "How we know", body: "The screener creates candidates; netflow and holder counts test participation; liquidity filters fragility." },
      { title: "What we still cannot claim", body: "Passing a screen does not establish token quality or expected return." },
    ],
    recipeTitle: "Build a defensible token shortlist",
    recipe: ["Choose a chain.", "Set a realistic liquidity floor.", "Require several labelled holders.", "Compare netflow across candidates.", "Reject candidates that fail any gate.", "Open passing tokens for deeper analysis."],
    evidenceAction: "Apply the gates",
  },
  defi: {
    level: "ADVANCED",
    goal: "Learn how to map protocol exposure and debt without inventing liquidation metrics the data does not provide.",
    scenario: "A wallet has $1M across DeFi. Can its liquidation risk be inferred from portfolio value alone?",
    cast: [
      { label: "Liquid assets", description: "Tokens currently held in the wallet" },
      { label: "Deployed assets", description: "Positions placed inside DeFi protocols" },
      { label: "Debt", description: "Borrowed value that may create liquidation exposure" },
    ],
    terms: [
      { term: "Gross assets", definition: "Assets before subtracting debt." },
      { term: "Health factor", definition: "A protocol-specific measure of borrow safety." },
      { term: "Concentration", definition: "Exposure clustered in one protocol or chain." },
    ],
    predictions: [
      "Total portfolio value is enough to estimate liquidation risk.",
      "Debt is a warning, but I need protocol-specific health data.",
      "A diversified chain mix removes protocol risk.",
    ],
    clueTitle: "Separate visible exposure from missing risk data",
    clueSummary: "Map liquid assets, deployed positions, protocol concentration, and debt before asking what the evidence cannot answer.",
    supported: { title: "Debt and concentration deserve review", body: "Aave holds 43% of gross assets and the fixture shows $124K of outstanding debt." },
    caution: { title: "A liquidation price is known", body: "No health factor, collateral parameters, or protocol liquidation threshold is present in the fixture." },
    secondClue: { title: "Missing risk metrics must stay missing.", body: "Inspect collateral and debt inside the specific protocol before estimating a safety buffer or liquidation level." },
    checks: [
      { observed: true, label: "Protocol concentration", note: "Largest position is 43%" },
      { observed: true, label: "Outstanding debt", note: "$124K in the fixture" },
      { observed: false, label: "Health factor and liquidation level", note: "Not returned by this evidence" },
    ],
    explanation: [
      { title: "What happened", body: "Most assets are deployed, with the largest position and all shown debt inside Aave." },
      { title: "How we know", body: "Wallet balances show liquid assets while DeFi holdings reveal protocols, supplied value, debt, and rewards." },
      { title: "What we still cannot claim", body: "Portfolio totals alone cannot establish the wallet's liquidation threshold or safety margin." },
    ],
    recipeTitle: "Map a wallet's DeFi exposure",
    recipe: ["Paste the wallet address.", "Review liquid balances.", "Map positions by protocol and chain.", "Identify debt and concentration.", "Mark unavailable health metrics explicitly.", "Open the protocol before estimating liquidation risk."],
    evidenceAction: "Map the exposure",
  },
};
