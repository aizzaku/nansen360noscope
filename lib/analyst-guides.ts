import type { ToolId } from "./playbooks";

export type AnalystGuideStep = {
  title: string;
  instruction: string;
  decision: string;
};

export type AnalystGuideMetric = {
  name: string;
  meaning: string;
  readAs: string;
  caution: string;
};

export type AnalystGuideCheck = {
  question: string;
  why: string;
  source: string;
};

export type AnalystGuide = {
  title: string;
  coreQuestion: string;
  beforeYouRun: string[];
  readingOrder: AnalystGuideStep[];
  metrics: AnalystGuideMetric[];
  evidenceChecks: AnalystGuideCheck[];
  commonMistakes: string[];
  conclusionLimits: string[];
  analysisRecipe: string[];
};

export const analystGuides = {
  wallet: {
    title: "Analyze a wallet and its connections",
    coreQuestion: "What does this wallet hold, what has it done, and which relationships are worth investigating?",
    beforeYouRun: [
      "Confirm that you have the correct public wallet address and chain.",
      "Choose a time window that matches the question. Use 7 days for a recent event, 30 days for current behavior, or 90 days for a broader pattern.",
      "Write down the claim you want to test—for example, ‘these wallets may be controlled together.’",
      "Remember that a connection is a lead, not proof of identity or ownership.",
    ],
    readingOrder: [
      { title: "Start with balances", instruction: "Identify the largest current assets and whether most value sits in one token.", decision: "Decide whether the wallet is active capital, a pass-through account, or nearly empty." },
      { title: "Build the activity timeline", instruction: "Read recent transfers in time order and note deposits, withdrawals, swaps, and repeated counterparties.", decision: "Separate one-off activity from repeated behavior." },
      { title: "Find the first funder", instruction: "Locate the earliest inbound gas or native-token transfer shown in the selected evidence.", decision: "Treat the funder as the first relationship to check, not as the owner." },
      { title: "Inspect related wallets", instruction: "Compare shared funders, recurring counterparties, timing, and repeated transfer routes.", decision: "Rank connections as weak, useful, or strong based on how many independent clues agree." },
      { title: "Write a bounded conclusion", instruction: "State what happened, cite the supporting records, and name what remains unknown.", decision: "Only make the narrowest claim supported by the evidence." },
    ],
    metrics: [
      { name: "Portfolio value", meaning: "The estimated value of assets currently visible in the wallet.", readAs: "Context for the wallet's present size—not its historical profit.", caution: "Pricing gaps, unsupported assets, and positions outside the wallet can make the total incomplete." },
      { name: "Transaction count", meaning: "The number of returned activities inside the selected window or response.", readAs: "A rough indication of activity level.", caution: "A busy wallet is not automatically important, profitable, or human-controlled." },
      { name: "First funder", meaning: "The address that supplied the earliest visible operating funds.", readAs: "A useful starting relationship for tracing provenance.", caution: "Exchanges, bridges, faucets, and service wallets fund many unrelated users." },
      { name: "Related-wallet signals", meaning: "Observed links such as shared funding or recurring transfers.", readAs: "Multiple independent, repeated signals are stronger than one shared counterparty.", caution: "Related does not mean commonly owned." },
    ],
    evidenceChecks: [
      { question: "Is the same relationship visible more than once?", why: "Repeated behavior is less likely to be coincidence.", source: "Transactions and related-wallet evidence" },
      { question: "Is the counterparty a known exchange, bridge, or service?", why: "Shared infrastructure creates false ownership links.", source: "Wallet labels and transaction counterparties" },
      { question: "Do timing, amounts, and destinations form a consistent pattern?", why: "Independent agreement strengthens a behavioral connection.", source: "Transaction timeline" },
      { question: "Does another chain or time window contradict the pattern?", why: "A conclusion should survive a reasonable change in scope.", source: "A second run with a different chain or period" },
    ],
    commonMistakes: [
      "Calling two wallets commonly owned because they share one funder.",
      "Treating current balances as a complete transaction history.",
      "Ignoring exchange, bridge, router, and contract addresses.",
      "Choosing a short time window and assuming missing older evidence never existed.",
    ],
    conclusionLimits: [
      "On-chain activity does not reveal a legal or real-world identity by itself.",
      "A shared service or counterparty can connect unrelated wallets.",
      "Unsupported chains, tokens, or older history may be absent.",
      "State common control only when several independent patterns support it—and still label it as an assessment, not a fact.",
    ],
    analysisRecipe: [
      "Define one claim to test.",
      "Review balances for present context.",
      "Read transactions in chronological order.",
      "Identify the first funder and repeated counterparties.",
      "Seek a second independent connection signal.",
      "Check whether a service address explains the link.",
      "Write: observation → evidence → alternative explanation → limit.",
    ],
  },
  trader: {
    title: "Test a trader's performance",
    coreQuestion: "Does this wallet show repeatable trading skill, or is the headline result dominated by one outlier?",
    beforeYouRun: [
      "Confirm that the address is the trading wallet, not a deposit or custody address.",
      "Select a window with enough closed trades to evaluate; compare another period when possible.",
      "Decide whether you are testing profitability, consistency, risk, or all three.",
      "Do not treat past profit as a forecast.",
    ],
    readingOrder: [
      { title: "Read realized PnL", instruction: "Start with closed-position profit or loss and the number of trades behind it.", decision: "Check whether the headline rests on a meaningful sample." },
      { title: "Inspect win rate", instruction: "Compare profitable and losing closed positions.", decision: "Use it with payoff size; a high win rate can hide a few large losses." },
      { title: "Rank PnL by token", instruction: "Find the best and worst contributors and calculate how much the largest winner explains.", decision: "Distinguish broad performance from one-token concentration." },
      { title: "Stress-test the result", instruction: "Remove the best token mentally and inspect the remaining PnL and losses.", decision: "Decide whether evidence of an edge remains without the outlier." },
      { title: "Compare periods", instruction: "Repeat the analysis in another window or market condition when data permits.", decision: "Look for persistence rather than a single favorable episode." },
    ],
    metrics: [
      { name: "Realized PnL", meaning: "Profit or loss recorded when positions were closed.", readAs: "The clearest returned measure of completed-trade outcome.", caution: "It excludes unrealized positions and may not capture every cost or venue." },
      { name: "Win rate", meaning: "The percentage of closed positions that made money.", readAs: "A consistency clue that must be paired with average win and loss size.", caution: "Many small wins can be erased by a few large losses." },
      { name: "Trade count", meaning: "The number of transactions or closed positions represented.", readAs: "More observations usually make the pattern more informative.", caution: "A large count does not remove selection bias or prove independent trades." },
      { name: "Best-token share", meaning: "The portion of total profit attributable to the largest winning token.", readAs: "A high share signals concentration and outlier dependence.", caution: "Concentration is not automatically bad, but it weakens claims of broad repeatability." },
    ],
    evidenceChecks: [
      { question: "Is PnL still positive without the largest winner?", why: "This tests outlier dependence.", source: "Total and token-level realized PnL" },
      { question: "Are losses controlled relative to wins?", why: "Win rate alone cannot describe payoff quality.", source: "Token PnL and DEX trades" },
      { question: "Are there enough completed positions?", why: "Small samples are easily dominated by chance.", source: "PnL summary and trade history" },
      { question: "Does performance persist in another period?", why: "Repeatability requires more than one market regime.", source: "A second time-window run" },
    ],
    commonMistakes: [
      "Calling a trader skilled from total profit alone.",
      "Using win rate without checking the size of wins and losses.",
      "Counting unrealized gains as secured profit.",
      "Ignoring deposits, withdrawals, fees, and tokens not covered by the returned data.",
    ],
    conclusionLimits: [
      "Historical results do not establish future returns.",
      "One address may not represent the trader's complete portfolio or activity.",
      "Realized PnL methodology and venue coverage can affect totals.",
      "Use language such as ‘the period shows’ rather than ‘the trader will.’",
    ],
    analysisRecipe: [
      "Choose a representative window.",
      "Record realized PnL, win rate, and sample size.",
      "Rank token-level contributors.",
      "Remove the largest winner and recalculate the story.",
      "Inspect the largest losses and trade chronology.",
      "Compare a second period.",
      "Conclude on concentration and consistency, not future performance.",
    ],
  },
  token: {
    title: "Challenge a token-flow narrative",
    coreQuestion: "Who controls the token, which cohorts are buying or selling, and do the signals agree?",
    beforeYouRun: [
      "Verify the contract address and chain; token symbols are not unique.",
      "Choose a time window that matches the claimed catalyst or flow change.",
      "Separate the question of ownership concentration from the question of recent flow.",
      "Treat wallet labels as analytical categories, not guarantees of future behavior.",
    ],
    readingOrder: [
      { title: "Map holder concentration", instruction: "Measure how much supply the largest holders control and identify labelled contracts or exchanges.", decision: "Decide whether ownership appears dispersed or concentrated." },
      { title: "Read cohort netflow", instruction: "Compare tokens or value entering and leaving Smart Money and other labelled cohorts.", decision: "Classify the recent direction as accumulation, distribution, or mixed." },
      { title: "Check exchange flow", instruction: "Inspect movement toward and away from exchange-labelled addresses.", decision: "Identify potential liquidity or sell-side pressure without assuming intent." },
      { title: "Inspect buyers and sellers", instruction: "Check whether activity is broad across wallets or dominated by one address.", decision: "Separate independent participation from single-wallet noise." },
      { title: "Reconcile contradictions", instruction: "Put supportive and conflicting evidence in the same conclusion.", decision: "Prefer a mixed conclusion when the evidence is mixed." },
    ],
    metrics: [
      { name: "Top-holder concentration", meaning: "The supply share held by the largest returned addresses.", readAs: "Higher concentration increases dependency on a small number of holders.", caution: "Contracts, bridges, treasuries, burn addresses, and exchanges need different interpretation." },
      { name: "Smart Money netflow", meaning: "Inflows minus outflows for wallets included in a labelled cohort.", readAs: "Positive values indicate net accumulation by that cohort during the window.", caution: "The label does not guarantee wallet skill, intent, or future price direction." },
      { name: "Exchange netflow", meaning: "Net token movement involving exchange-labelled addresses.", readAs: "Exchange inflow may increase available supply; outflow may reduce it.", caution: "Transfers can support custody, internal operations, or liquidity—not only selling or buying." },
      { name: "Buyer/seller breadth", meaning: "How many wallets participate on each side of recent flow.", readAs: "Broader participation is generally more informative than one dominant wallet.", caution: "Wallet count does not equal independent people or capital sources." },
    ],
    evidenceChecks: [
      { question: "Are top holders contracts or operational addresses?", why: "Raw concentration can overstate discretionary ownership.", source: "Holder labels and address types" },
      { question: "Do Smart Money and exchange flows point in the same direction?", why: "Agreement makes the narrative cleaner; disagreement requires caution.", source: "Flow intelligence" },
      { question: "Is the flow broad or dominated by one wallet?", why: "Single-wallet activity is more fragile.", source: "Who bought/sold evidence" },
      { question: "Does the result persist across windows?", why: "A one-day event may not represent the wider trend.", source: "Repeated 7-, 30-, or 90-day runs" },
    ],
    commonMistakes: [
      "Using a token symbol instead of verifying the contract.",
      "Treating positive Smart Money netflow as a buy signal.",
      "Counting exchange or bridge contracts as ordinary holders.",
      "Ignoring contradictory flows because one metric supports the preferred story.",
    ],
    conclusionLimits: [
      "On-chain flow shows movement, not motive.",
      "Labels and entity coverage may be incomplete or change over time.",
      "Holder snapshots do not explain off-chain liquidity or derivatives exposure.",
      "No combination of these metrics guarantees price direction.",
    ],
    analysisRecipe: [
      "Verify contract and chain.",
      "Classify the largest holders.",
      "Calculate concentration after accounting for known contracts.",
      "Read Smart Money and exchange netflows together.",
      "Check buyer and seller breadth.",
      "Repeat in another time window.",
      "Report supportive evidence, conflicting evidence, and unknown intent.",
    ],
  },
  signal: {
    title: "Turn a screen into a research shortlist",
    coreQuestion: "Which tokens pass every selected evidence gate and deserve deeper investigation?",
    beforeYouRun: [
      "Choose the chain you can actually investigate and trade or monitor.",
      "Set a liquidity floor appropriate to the size of the intended research or position.",
      "Require several participating Smart Money wallets to reduce single-wallet noise.",
      "Accept that the screen produces candidates, not recommendations.",
    ],
    readingOrder: [
      { title: "Apply liquidity first", instruction: "Remove candidates below the selected liquidity floor.", decision: "Avoid spending time on leads that cannot support reasonable execution." },
      { title: "Require wallet breadth", instruction: "Check that more than one labelled wallet supports the signal.", decision: "Reject signals dominated by a single participant." },
      { title: "Compare netflow", instruction: "Rank the remaining candidates by direction and magnitude of labelled-wallet flow.", decision: "Use flow to prioritize, not to bypass the other gates." },
      { title: "Read failure reasons", instruction: "For rejected candidates, identify exactly which threshold failed.", decision: "Keep the screen explainable and reproducible." },
      { title: "Open each survivor", instruction: "Continue with Token Analysis and, when useful, profile the participating wallets.", decision: "Promote a candidate only after token-level evidence survives deeper checks." },
    ],
    metrics: [
      { name: "Liquidity", meaning: "A measure of available market depth returned for the candidate.", readAs: "A practical gate for whether activity can occur without excessive market impact.", caution: "Displayed liquidity is not a guarantee of execution at a particular price." },
      { name: "Smart Money wallet count", meaning: "The number of labelled wallets participating in the signal.", readAs: "Greater breadth can reduce dependence on one wallet.", caution: "Several addresses may still share an entity or strategy." },
      { name: "Netflow", meaning: "The cohort's inflow minus outflow over the measured window.", readAs: "Positive flow identifies accumulation within that cohort.", caution: "Absolute size should be interpreted relative to liquidity and token scale." },
      { name: "Passed/failed gates", meaning: "Whether the candidate met every selected threshold.", readAs: "A transparent filter result, not a quality score.", caution: "A token can pass numeric gates while failing fundamental or concentration checks." },
    ],
    evidenceChecks: [
      { question: "Did the candidate pass every gate?", why: "Cherry-picking one strong metric defeats the screen.", source: "Candidate reasons and thresholds" },
      { question: "Is participation spread across independent wallets?", why: "Breadth reduces but does not eliminate coordinated activity.", source: "Smart Money holdings and netflow" },
      { question: "Is flow material relative to liquidity?", why: "The same dollar flow has different meaning in a small and large market.", source: "Netflow and liquidity metrics" },
      { question: "Does Token Analysis reveal concentration or exchange-flow risk?", why: "The screener does not complete token due diligence.", source: "Follow-up Token Holder & Flow Analysis" },
    ],
    commonMistakes: [
      "Ranking only by the largest inflow.",
      "Lowering thresholds until a preferred token passes.",
      "Treating labelled wallets as independent without checking connections.",
      "Publishing a shortlist as an investment recommendation.",
    ],
    conclusionLimits: [
      "The candidate universe and labels depend on available coverage.",
      "Liquidity and wallet counts can change quickly.",
      "Passing a screen says nothing certain about future return or token quality.",
      "Every passing candidate still requires contract, holder, flow, and risk review.",
    ],
    analysisRecipe: [
      "Choose chain and research window.",
      "Set the liquidity floor before seeing results.",
      "Set a minimum independent-wallet count.",
      "Keep only candidates that pass all gates.",
      "Compare flow relative to liquidity.",
      "Run Token Analysis on each survivor.",
      "Document why each candidate passed, failed, or remains uncertain.",
    ],
  },
  defi: {
    title: "Map a wallet's DeFi exposure",
    coreQuestion: "Where is the wallet's capital deployed, how concentrated is it, and which risks can the available data actually support?",
    beforeYouRun: [
      "Confirm the wallet and review every supported chain relevant to it.",
      "Decide whether the goal is exposure mapping, debt review, or liquidation analysis.",
      "Expect portfolio totals to be estimates that may omit unsupported protocols or assets.",
      "Do not estimate a liquidation level without protocol-specific collateral and health data.",
    ],
    readingOrder: [
      { title: "Separate liquid and deployed assets", instruction: "Compare wallet balances with positions held inside protocols.", decision: "Understand how much capital is immediately liquid versus committed." },
      { title: "Map protocols and chains", instruction: "Group supplied assets, pools, staking, and rewards by protocol and network.", decision: "Identify operational dependencies and the largest exposure." },
      { title: "Measure concentration", instruction: "Calculate the share of gross assets in the largest protocol, chain, and position.", decision: "Flag exposures where one failure could dominate the portfolio." },
      { title: "Inspect debt", instruction: "Locate borrowed assets and compare visible debt with supplied collateral.", decision: "Determine whether leverage exists and what information is still missing." },
      { title: "Keep unavailable risk metrics unavailable", instruction: "Look for health factor, collateral thresholds, and liquidation parameters before estimating risk.", decision: "If they are absent, stop at exposure and debt—not liquidation price." },
    ],
    metrics: [
      { name: "Gross assets", meaning: "The value of visible assets before subtracting debt.", readAs: "The size of the returned exposure set.", caution: "It is not net worth and may omit unsupported or unpriced positions." },
      { name: "Debt", meaning: "The value of visible borrowed assets.", readAs: "Evidence that leverage or repayment obligations exist.", caution: "Debt alone does not reveal liquidation proximity." },
      { name: "Protocol concentration", meaning: "The share of returned assets located in the largest protocol.", readAs: "A dependency indicator for smart-contract, oracle, and protocol risk.", caution: "Different positions inside one protocol may have different risk profiles." },
      { name: "Health factor", meaning: "A protocol-specific indicator of collateral safety when provided.", readAs: "Lower values generally imply less liquidation buffer, subject to protocol rules.", caution: "Never infer or fabricate it from portfolio totals." },
    ],
    evidenceChecks: [
      { question: "Are wallet balances and protocol positions being double-counted?", why: "Receipt tokens and deposited assets can make exposure look larger than it is.", source: "Balances and DeFi position details" },
      { question: "Which protocol, chain, and asset dominate?", why: "Concentration determines where a failure matters most.", source: "Position allocation" },
      { question: "Is debt tied to identifiable collateral?", why: "Risk depends on the borrowing market and collateral rules.", source: "Protocol-level supplied and borrowed positions" },
      { question: "Are health factor and liquidation parameters actually present?", why: "Without them, liquidation estimates would be invented.", source: "Protocol-specific position metadata" },
    ],
    commonMistakes: [
      "Calling gross assets net portfolio value.",
      "Inferring liquidation price from debt or portfolio value alone.",
      "Ignoring chain, bridge, oracle, and smart-contract dependencies.",
      "Assuming missing positions mean the wallet has no exposure there.",
    ],
    conclusionLimits: [
      "Coverage can omit protocols, chains, NFTs, derivatives, or unpriced assets.",
      "Portfolio snapshots can change immediately after retrieval.",
      "Debt does not equal imminent liquidation.",
      "A liquidation assessment requires current protocol-specific collateral, oracle, threshold, and health data.",
    ],
    analysisRecipe: [
      "Review liquid wallet balances.",
      "Map positions by protocol and chain.",
      "Separate supplied assets, rewards, and debt.",
      "Calculate the largest concentration.",
      "Check for double counting and missing prices.",
      "Locate health and liquidation metrics—or mark them unavailable.",
      "Conclude on visible exposure, concentration, debt, and data limits.",
    ],
  },
} satisfies Record<ToolId, AnalystGuide>;

export const getAnalystGuide = (tool: ToolId): AnalystGuide => analystGuides[tool];
