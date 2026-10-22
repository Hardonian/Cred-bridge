# CredBridge

CredBridge is a shared international credentialing and competency reference architecture. It demonstrates a pooled credit ledger, CASE-aligned skills, signed credential primitives, and an executive Admin Central surface for three synthetic regional pilots.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The app is intentionally deterministic and has no external data dependency in reference mode.

## Verify

```bash
pnpm verify:all
```

The repository is MIT/BSD/Apache-oriented; see `DEPENDENCY_POLICY.md`. Synthetic data is clearly separated from production integrations.
