# Nansen API validation

Live validation completed on September 27, 2026 against the public Nansen API examples used by the product.

## Result

- 106 of 106 purposeful calls succeeded
- 11 distinct endpoints covered
- 106 unique request fingerprints
- 130 Nansen credits reported by response headers
- No authentication, authorization, network, timeout, or rate-limit failures

## Coverage

| Tool | Calls |
| --- | ---: |
| Wallet Activity & Connections | 30 |
| Trader PnL Analysis | 42 |
| Token Holder & Flow Analysis | 26 |
| DeFi Portfolio Analysis | 6 |
| Smart Money Token Screener | 2 |

The plan varied public subjects, chains, time windows, pagination, and screening thresholds. It covered balances, transactions, related wallets, PnL summaries, token-level PnL, DEX trades, holders, flow intelligence, buyers and sellers, DeFi holdings, and token screening.

## Reproduce

Review the dry run first:

```bash
node scripts/validate-nansen-api.mjs --dry-run
```

For maintainers only, configure `NANSEN_API_KEY` in the local shell or an ignored `.env.local`, then execute the live validation:

```bash
node scripts/validate-nansen-api.mjs --execute
```

The runner stops immediately on authentication failures and after three consecutive rate limits. Generated reports are ignored by Git. They include only workflow labels, endpoints, request fingerprints, status codes, credit headers, request IDs, row counts, and timing—never the API key or response payloads.

This environment variable belongs only to the standalone validation script. The deployed application uses a bring-your-own-key flow: visitor keys are held in browser-tab memory and transiently forwarded through the same-origin API route for each confirmed analysis. They are not stored or logged by the application.
