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

With `NANSEN_API_KEY` configured locally, execute the live validation:

```bash
node scripts/validate-nansen-api.mjs --execute
```

The runner stops immediately on authentication failures and after three consecutive rate limits. Generated reports are ignored by Git. They include only workflow labels, endpoints, request fingerprints, status codes, credit headers, request IDs, row counts, and timing—never the API key or response payloads.
