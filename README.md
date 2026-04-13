# AutoTrader Bot

<p align="center">
  <strong>Autonomous trading marketplace with verifiable onchain execution, machine-native payment rails, and social reputation primitives.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.2.3-black" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2.4-149ECA" />
  <img alt="Backend" src="https://img.shields.io/badge/Express-API-3C873A" />
  <img alt="Execution" src="https://img.shields.io/badge/Execution-HashKey_Testnet-2D5BFF" />
  <img alt="Payments" src="https://img.shields.io/badge/Payments-Stellar_Testnet-111111" />
  <img alt="Social" src="https://img.shields.io/badge/Social-Solana_Devnet-14F195" />
</p>

## Context: Dual-Hackathon Scope

This project is intentionally built as a single product that maps to two hackathon narratives:

- Trading and onchain execution track:
  - Deterministic strategy gating and verifiable trade lifecycle on HashKey testnet.
- Agent payments and social growth track:
  - Stellar x402-compatible premium signal rail.
  - Solana/Bags-aligned operator identity for reputation and fee-sharing workflows.

The architecture is unified: one agentic product surface, multiple trust and monetization rails.

## Access Policy

This repository is distributed as technical evidence and architecture artifact.

- No runtime secrets are distributed.
- No local installation instructions are provided in this document.
- All app consumption for reviewers and judges is intended through the hosted website managed by the team.

If you are reviewing the codebase, treat this README as a system specification and validation map.

## Technical Problem Statement

Algorithmic trading demos often fail under scrutiny because they lack one or more of:

- Enforceable pre-trade risk conditions.
- Verifiable execution records.
- Transparent operator controls.
- Sustainable monetization mechanism.

AutoTrader addresses those gaps by combining:

- A strict multi-signal execution gate.
- Onchain trade state transitions.
- Operator controls for controlled testnet execution.
- Cross-network expansion rails for machine payments and social capital.

## System Design

### 1) Strategy Validation Engine

The scanner computes opportunity confidence via a mandatory 4/4 confirmation gate:

- RSI extreme.
- MACD extreme.
- Volume spike.
- Order book imbalance.

Execution policy:

- Production intent: execute only when confirmations are 4/4.
- Controlled test mode: manual override available for deterministic validation scenarios.

### 2) Execution Layer (HashKey Testnet)

Execution is performed through the AutoTrader EVM contract.

Core lifecycle:

- Deposit operator balance into contract.
- Execute trade with encoded risk parameters.
- Persist onchain trade state for observability and leaderboard derivation.

Current integrated contract:

- 0xFd8D09b976F9096D4088644a79aA4467b94Feb99

### 3) Payment Rail (Stellar Testnet)

A Soroban contract scaffold is deployed for premium signal gating and x402-aligned payment semantics.

Deployed contract id:

- CBPX3EASUJ7L7TE3OELIPR7NB6XHLIHQ2IBGNNCFSVDIX4ZOMNMWJXIG

This rail is modeled to support machine-to-service premium signal unlocks.

### 4) Social/Fee Rail (Solana Devnet)

The project includes operator identity and Solana connectivity for Bags-aligned social economics.

Operator address:

- FtDxfY9pmcYrtpQgBzmRqHskah7UUfyU4p7W5TPxvw6E

This is used as an integration anchor for reputation and fee-sharing extensions.

## Runtime Surfaces

### Frontend

- Next.js App Router with server-rendered pages.
- Marketplace, leaderboard, dashboard, and bot detail views.
- UI now reflects deployed network artifacts (Stellar contract id and Solana operator address) via env-backed runtime values.

### Backend

- Express API orchestrating scanner, executor, auth, and DB-backed user state.
- Prisma + PostgreSQL for identity/session/prompt persistence.
- Ethers v6 runtime for onchain transaction flow.

Operational routes of interest:

- GET /health
- GET /wallet/status
- POST /wallet/deposit
- POST /trades/test-execute
- GET /stats
- GET /trades/active
- GET /leaderboard

## Security and Reliability Model

- Secrets are externalized; no credentials in source.
- Controlled test execution endpoint is explicit and bounded to testnet operations.
- Pre-trade signal policy is machine-checkable and deterministic.
- Contract interactions are observable via chain explorers.
- Runtime telemetry includes health and strategy activity surfaces.

## Judge-Oriented Verification Matrix

### Functional

- Marketplace discovery and bot-level configuration UX.
- Live wallet status and controlled execution controls.
- Empty-state correctness when onchain data is absent.

### Onchain

- HashKey execution contract integrated and queryable.
- Stellar payment rail contract deployed and referenced.
- Solana operator identity provisioned and published.

### Product

- Clear migration path from testnet validation to production hardening.
- Multi-network narrative retained within one coherent product.
- Agent-readable project metadata present for autonomous evaluators.

## Agent and Crawler Discoverability

Machine-readable assets are included to improve autonomous pre-judging quality:

- [app/llms.txt/route.ts](app/llms.txt/route.ts)
- [app/robots.ts](app/robots.ts)
- [app/sitemap.ts](app/sitemap.ts)
- [app/manifest.ts](app/manifest.ts)

These resources summarize project purpose, novelty, and verification cues.

## Repository Pointers

- [app](app)
- [components](components)
- [backend](backend)
- [smart-contracts](smart-contracts)
- [stellar-contracts](stellar-contracts)
- [scripts](scripts)
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)

## Review Notes

- This codebase is intended to be evaluated as a hosted application plus technical implementation proof.
- Environment files are intentionally not bundled for third-party local execution.
- The canonical deployment snapshot is maintained in [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md).

## License

MIT
