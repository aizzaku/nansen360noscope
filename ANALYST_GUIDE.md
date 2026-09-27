# Nansen 360 NoScope Analyst Guide

This handbook explains how to use all five Investigate tools without turning incomplete on-chain evidence into overconfident claims.

## The method used throughout

Every investigation should follow the same discipline:

1. **Question** — Write one claim you want to test.
2. **Scope** — Confirm the address, chain, and relevant time window.
3. **Observation** — Describe what the returned data shows without interpreting motive.
4. **Evidence** — Cite the specific metric, transaction, holder, or position supporting the observation.
5. **Alternative** — Ask what ordinary explanation could produce the same pattern.
6. **Conclusion** — Make the narrowest defensible claim.
7. **Limit** — State what the available data cannot establish.

Use Sample mode to learn the interface. Sample conclusions are teaching fixtures, not measurements of the address typed into the input. Use Live mode only when a server-side Nansen API key is configured.

---

## 1. Wallet Activity & Connections

### The question

What does this wallet hold, what has it done, and which relationships deserve further investigation?

### Before running

- Verify the wallet address and chain.
- Choose 7 days for a recent event, 30 days for current behavior, or 90 days for a broader pattern.
- Write the claim being tested—for example, “Wallet A and Wallet B may be controlled together.”
- Remember: a shared funder is a lead, not proof of common ownership.

### Read the result in this order

1. **Balances:** Note the largest current assets and concentration. This describes the wallet now, not its historical profit.
2. **Activity timeline:** Read transfers chronologically. Mark deposits, withdrawals, swaps, and recurring counterparties.
3. **First funder:** Find the earliest visible source of operating funds. Exchanges and bridges can fund many unrelated wallets.
4. **Related wallets:** Look for repeated transfers, shared routes, similar timing, and recurring counterparties.
5. **Second clue:** Never make an ownership claim from one relationship. Seek another independent pattern.

### Main metrics

- **Portfolio value:** Estimated value currently visible. It can exclude unsupported assets or positions.
- **Transaction count:** An activity indicator, not a measure of importance or profitability.
- **First funder:** A starting point for tracing provenance, not an identified owner.
- **Related-wallet signals:** Connections become more useful when several independent, repeated behaviors agree.

### Evidence checks

- Is the relationship repeated?
- Is the counterparty a service, exchange, bridge, router, or contract?
- Do timing, amounts, and destinations form a consistent pattern?
- Does another period or chain contradict the pattern?

### Common mistakes

- Calling two wallets commonly owned because they share one funder.
- Treating current balances as complete history.
- Ignoring infrastructure addresses.
- Assuming missing older activity never happened.

### What you can conclude

Good: “Both wallets received initial funds from the same source and later used two of the same counterparties. This supports a behavioral connection, but does not establish common ownership.”

Too strong: “The same person owns both wallets.”

### Reusable recipe

Define the claim → review balances → read transactions → find first funder → find repeated counterparties → seek a second clue → test the service-address explanation → report observation, alternative, and limit.

---

## 2. Trader PnL Analysis

### The question

Does this wallet show repeatable trading performance, or is the headline result dominated by one outlier?

### Before running

- Confirm that this is a trading wallet rather than an exchange deposit address.
- Select a window containing enough closed positions to examine.
- Decide whether you are testing profitability, consistency, downside, or all three.
- Plan to compare another period if the data permits.

### Read the result in this order

1. **Realized PnL:** Start with closed-position profit or loss and the sample behind it.
2. **Win rate:** Pair the percentage of winning positions with the size of wins and losses.
3. **Token contribution:** Rank profit and loss by token.
4. **Outlier test:** Remove the largest winner mentally. Ask whether the remaining result is still positive.
5. **Loss review:** Inspect the largest losses and their timing.
6. **Period comparison:** Check whether the pattern survives another time window.

### Main metrics

- **Realized PnL:** Outcome from closed positions. It excludes unrealized exposure and may not include every cost or venue.
- **Win rate:** Share of closed positions that made money. Many small wins can still be erased by a few large losses.
- **Trade count:** Context for sample size; a large count does not prove independent or repeatable bets.
- **Best-token share:** How much the largest winner explains. High concentration weakens claims of broad repeatability.

### Evidence checks

- Is PnL positive without the largest winner?
- Are losses controlled relative to wins?
- Are there enough completed positions to interpret?
- Does performance persist in another period?

### Common mistakes

- Calling a trader skilled from total profit alone.
- Reading win rate without payoff size.
- Counting unrealized gains as secured profit.
- Assuming one address contains the trader’s complete activity.

### What you can conclude

Good: “The wallet was profitable during this window, but most profit came from one token. Positive PnL remains without it, which is encouraging but insufficient to prove a durable edge.”

Too strong: “This trader will remain profitable.”

### Reusable recipe

Choose a representative window → record realized PnL, win rate, and sample size → rank token contributors → remove the largest winner → inspect losses → compare another period → conclude on concentration and consistency, not future returns.

---

## 3. Token Holder & Flow Analysis

### The question

Who controls the token, which cohorts are buying or selling, and do the signals agree?

### Before running

- Verify the contract address and chain. Symbols are not unique.
- Match the window to the catalyst or flow story being tested.
- Separate ownership concentration from recent flow.
- Treat labels as analytical categories, not promises of wallet skill.

### Read the result in this order

1. **Holder concentration:** Measure the supply controlled by the largest returned holders.
2. **Address type:** Separate ordinary wallets from exchanges, bridges, treasuries, burn addresses, and contracts.
3. **Smart Money flow:** Determine whether the labelled cohort accumulated or distributed during the window.
4. **Exchange flow:** Note movement toward or away from exchange-labelled wallets without assuming motive.
5. **Buyer/seller breadth:** Check whether activity is broad or dominated by one wallet.
6. **Contradictions:** Keep supportive and conflicting evidence in the same conclusion.

### Main metrics

- **Top-holder concentration:** Dependency on a small number of addresses; contract types must be interpreted separately.
- **Smart Money netflow:** Cohort inflow minus outflow. Positive flow does not predict price.
- **Exchange netflow:** Movement involving labelled exchanges. It can reflect custody or internal operations, not just buying or selling.
- **Buyer/seller breadth:** Number of participating wallets. Addresses do not necessarily equal independent people.

### Evidence checks

- Are the largest holders operational contracts?
- Do Smart Money and exchange flows agree?
- Is activity broad or driven by one wallet?
- Does the result persist across multiple windows?

### Common mistakes

- Investigating a symbol without confirming the contract.
- Treating positive Smart Money flow as a recommendation.
- Counting contracts like ordinary holders.
- Ignoring evidence that conflicts with the preferred story.

### What you can conclude

Good: “Labelled wallets accumulated during the period, but ownership remains concentrated and exchange inflow increased. The evidence is mixed rather than unambiguously bullish.”

Too strong: “Smart Money is buying, so price will rise.”

### Reusable recipe

Verify contract → classify top holders → measure meaningful concentration → read Smart Money and exchange flow together → inspect buyer/seller breadth → compare windows → report agreement, conflict, and unknown motive.

---

## 4. Smart Money Token Screener

### The question

Which tokens pass every chosen evidence gate and deserve deeper investigation?

### Before running

- Choose the chain you can meaningfully investigate.
- Set the liquidity floor before seeing results.
- Require several participating labelled wallets.
- Treat the output as a research queue, not a recommendation list.

### Read the result in this order

1. **Liquidity gate:** Reject candidates below the chosen floor.
2. **Wallet-breadth gate:** Reject candidates dominated by one labelled wallet.
3. **Netflow comparison:** Rank survivors by direction and magnitude of flow.
4. **Failure reasons:** Understand exactly why every rejected candidate failed.
5. **Deep analysis:** Open survivors in Token Holder & Flow Analysis and profile important wallets where useful.

### Main metrics

- **Liquidity:** Available market depth. It does not guarantee execution at a displayed price.
- **Smart Money wallet count:** Breadth of labelled participation. Several addresses can still share one entity.
- **Netflow:** Cohort inflow minus outflow. Interpret it relative to market size and liquidity.
- **Passed/failed:** A transparent threshold result, not a quality score.

### Evidence checks

- Did the candidate pass every gate?
- Is participation plausibly independent?
- Is flow material relative to liquidity?
- Does follow-up Token Analysis reveal concentration or exchange-flow risk?

### Common mistakes

- Ranking only by largest inflow.
- Changing thresholds until a preferred token passes.
- Treating every labelled address as independent.
- Presenting the shortlist as financial advice.

### What you can conclude

Good: “These tokens passed the selected liquidity, wallet-breadth, and netflow gates. They are prioritized research candidates and still require token-level review.”

Too strong: “These are the best tokens to buy.”

### Reusable recipe

Choose chain → fix thresholds in advance → keep only candidates passing all gates → compare flow relative to liquidity → run Token Analysis → profile relevant wallets → document pass, fail, and uncertainty reasons.

---

## 5. DeFi Portfolio Analysis

### The question

Where is the wallet’s capital deployed, how concentrated is it, and which risks can the available data actually support?

### Before running

- Verify the wallet and every relevant supported chain.
- Decide whether the goal is exposure mapping, debt review, or liquidation analysis.
- Expect portfolio totals to omit unsupported or unpriced positions.
- Do not estimate liquidation levels without protocol-specific collateral and health data.

### Read the result in this order

1. **Liquid versus deployed assets:** Separate wallet balances from capital inside protocols.
2. **Protocol and chain map:** Group supplied assets, pools, staking, and rewards.
3. **Concentration:** Calculate the largest protocol, chain, and position shares.
4. **Debt:** Identify borrowed assets and the visible collateral relationship.
5. **Risk metadata:** Look for health factor, oracle, collateral threshold, and liquidation parameters.
6. **Missing evidence:** If those metrics are absent, stop at exposure and debt rather than inventing liquidation risk.

### Main metrics

- **Gross assets:** Visible assets before debt. This is not net worth.
- **Debt:** Visible borrowed value. Debt alone does not establish liquidation proximity.
- **Protocol concentration:** Dependency on one protocol’s contracts, oracle, governance, and operation.
- **Health factor:** Protocol-specific collateral safety when supplied. Never fabricate it from totals.

### Evidence checks

- Are receipt tokens and deposited assets double-counted?
- Which protocol, chain, and asset dominate exposure?
- Is debt tied to identifiable collateral?
- Are health factor and liquidation parameters actually present?

### Common mistakes

- Calling gross assets net portfolio value.
- Inferring a liquidation price from debt alone.
- Ignoring bridge, oracle, chain, and smart-contract dependencies.
- Assuming missing coverage means no position exists.

### What you can conclude

Good: “Most visible capital is deployed in one protocol and the wallet carries debt. Concentration deserves review, but liquidation proximity cannot be established because health and collateral-threshold data are unavailable.”

Too strong: “The wallet will be liquidated after a 20% market decline.”

### Reusable recipe

Review liquid balances → map protocols and chains → separate supplied assets, rewards, and debt → calculate concentration → check double counting → locate health metrics or mark them unavailable → conclude only on visible exposure and supported risk.

---

## A one-paragraph investigation template

> **Question:** [claim tested]. **Observation:** [what the data shows]. **Evidence:** [specific metric, transaction, wallet, holder, or position]. **Alternative explanation:** [another plausible cause]. **Conclusion:** [narrow supported statement]. **Limit:** [what is missing or cannot be known from this evidence].

## Final quality check

Before saving or sharing an investigation, ask:

- Did I verify the address, contract, chain, and time window?
- Did I distinguish observed movement from assumed intent?
- Did I check for a service, contract, or labelling explanation?
- Did I include evidence that conflicts with my hypothesis?
- Did I state what the available data cannot prove?
- Could another analyst reproduce my conclusion from the cited evidence?

Nansen 360 NoScope is an investigation aid. Its output is not proof of identity and is not financial advice.
