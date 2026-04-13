# AutoTrader Bot — AI-Powered DeFi on HashKey Chain

<p align="center">
  <strong>Every trade is gated by your AI. Every decision is logged. Every execution is on-chain.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.2.3-black" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2.4-149ECA" />
  <img alt="AI" src="https://img.shields.io/badge/AI-Multi--Provider_LLM-FF6B35" />
  <img alt="Execution" src="https://img.shields.io/badge/Execution-HashKey_Chain-2D5BFF" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Express+Prisma-3C873A" />
  <img alt="Security" src="https://img.shields.io/badge/Keys-AES--256_Encrypted-critical" />
</p>

---

## What Makes This Different

AutoTrader is not another trading bot with a dashboard. It introduces **AI-gated on-chain execution** — a dual safety architecture where every trade must pass through both technical signal validation AND an LLM risk analysis before touching the blockchain.

```
Market Scanner → 4/4 Technical Gate → AI Analysis → Confidence Check → HashKey Chain Execution
                                                          ↓
                                              Decision Log (full audit trail)
```

**The AI doesn't just advise. It decides.** If the AI says no, the trade doesn't execute — regardless of how strong the technical signals are.

---

## Core Innovation: Dual Safety Gate

### Gate 1: Technical Signals (4/4 required)
| Signal | Condition | Purpose |
|--------|-----------|---------|
| RSI | Extreme values (<30 or >70) | Momentum reversal detection |
| MACD | Histogram divergence + crossover | Trend confirmation |
| Volume | Spike >1.2× average | Momentum validation |
| Order Book | Imbalance >60% | Supply/demand pressure |

### Gate 2: AI Risk Analysis
| Parameter | Description |
|-----------|-------------|
| Recommendation | LONG / SHORT / NO_TRADE |
| Confidence Score | 0–100% — must exceed user-defined threshold |
| Risk/Reward Ratio | Quantified with entry zone, TP1/TP2/TP3, stop loss |
| Market Regime | Trending / ranging / volatile / low-liquidity |
| Key Risks | Specific risk factors identified by the AI |
| Reasoning | Full natural-language explanation of the decision |

**Both gates must pass.** A 4/4 technical signal with low AI confidence = no trade. High AI confidence with 3/4 technicals = no trade.

---

## Multi-Provider AI: Bring Your Own Key

Users choose their AI provider and model. API keys are encrypted AES-256-CBC at rest and only used for direct calls to the chosen provider.

| Provider | Models | Access |
|----------|--------|--------|
| **OpenRouter** | GPT-4o, Claude, Llama, Mixtral, 100+ models | Single key, any model |
| **OpenAI** | GPT-4o, GPT-4o-mini | Direct API |
| **Anthropic** | Claude Sonnet, Claude Haiku | Direct API |

No vendor lock-in. No data sent to our servers. The user's key talks directly to their chosen provider.

---

## AI Execution Modes

### 1. AI Analysis Only
Analyze any trading pair with AI — get a structured recommendation without executing.
```
POST /ai/analyze/:pair → AI recommendation + technical data
```

### 2. AI One-Shot Execution
Analyze + decide + execute on-chain in a single request. If AI approves, the trade goes to HashKey Chain.
```
POST /ai/execute/:pair → Analysis + Decision + On-Chain Trade
```

### 3. AI Auto-Trade (Autonomous)
Enable AI auto-trade with a configurable confidence threshold. The scanner runs continuously, and the AI approves or rejects each opportunity automatically.
```
PUT /ai/auto-trade → { enabled: true, minConfidence: 0.75 }
```

### 4. Full Decision Audit Trail
Every AI decision — whether it led to execution or not — is persisted with full context.
```
GET /ai/history → Paginated log of all AI decisions with reasoning
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  Dashboard: Stats · Active Trades · AI Settings · AI Analysis    │
│             AI Auto-Trade · AI Decision Log · Trading Ops        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                      BACKEND (Express.js)                        │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ MarketScanner│  │ StrategyAnalyst │  │  TradeExecutor    │  │
│  │ RSI/MACD/ATR │→ │ Multi-LLM Gate  │→ │  HashKey Chain    │  │
│  │ Volume/OB    │  │ OpenRouter/OAI  │  │  ethers.js v6     │  │
│  └──────────────┘  │ Anthropic       │  └───────────────────┘  │
│                    └─────────────────┘                           │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │  AiTradeLog │  ← Every decision persisted   │
│                    │  PostgreSQL │                               │
│                    └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              HASHKEY CHAIN TESTNET (Solidity)                    │
│  Contract: 0xFd8D09b976F9096D4088644a79aA4467b94Feb99           │
│  OpenZeppelin Ownable + ReentrancyGuard                          │
│  Trade lifecycle: deposit → execute → settle → leaderboard       │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### AI Endpoints (all require JWT auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/providers` | List supported AI providers and models |
| `GET` | `/ai/config` | Get user's current AI config (key masked) |
| `PUT` | `/ai/config` | Save/update AI provider, model, and encrypted key |
| `DELETE` | `/ai/config` | Remove AI configuration |
| `POST` | `/ai/analyze/:pair` | AI analysis with live technical data |
| `POST` | `/ai/execute/:pair` | **AI analysis + on-chain execution (one-shot)** |
| `POST` | `/ai/validate-key` | Quick API key validation |
| `GET` | `/ai/history` | Paginated AI decision audit trail |
| `GET` | `/ai/auto-trade` | Get auto-trade settings |
| `PUT` | `/ai/auto-trade` | Toggle AI auto-trade + confidence threshold |

### Trading Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health + runtime mode |
| `GET` | `/wallet/status` | Bot wallet + contract balances |
| `POST` | `/wallet/deposit` | Deposit HSK into contract |
| `POST` | `/trades/test-execute` | Controlled test trade on testnet |
| `POST` | `/trades/execute` | Manual trade execution |
| `GET` | `/trades/active` | Active on-chain trades |
| `GET` | `/stats` | Global statistics from chain |
| `GET` | `/leaderboard` | Performance rankings |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | JWT token issuance |
| `GET` | `/users/me` | User profile |
| `PUT` | `/users/me/wallet` | Link wallet address |

---

## Data Model

```
User
├── email, passwordHash, displayName, role, walletAddress
├── aiAutoTrade (bool)          ← autonomous AI execution toggle
├── aiMinConfidence (float)     ← minimum confidence threshold
├── AiProviderConfig (1:1)      ← provider, model, encrypted API key
├── AiTradeLog[] (1:many)       ← full AI decision history
├── UserSession[]
└── BotPersonalityPrompt[]

AiTradeLog
├── pair, recommendation, confidence, reasoning
├── marketRegime, keyRisks, entryLow/High, stopLoss, riskReward
├── executed (bool), txHash, executionError
├── provider, model, technicalData
└── createdAt (indexed for fast queries)
```

---

## Security Model

| Layer | Protection |
|-------|-----------|
| API Keys | AES-256-CBC encrypted at rest. Never stored in plaintext. |
| Auth | JWT with bcrypt password hashing. 7-day token expiry. |
| AI Config | Per-user isolation. Keys decrypted only at API call time. |
| Contract | OpenZeppelin Ownable + ReentrancyGuard. Owner-restricted execution. |
| Secrets | All credentials externalized via environment variables. |
| Input | Server-side validation on all API endpoints. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.3, React 19.2.4, TypeScript 5, Tailwind CSS 4 |
| Backend | Express.js, Prisma ORM, PostgreSQL |
| AI | Multi-provider LLM (OpenRouter / OpenAI / Anthropic) |
| Blockchain | ethers.js v6, Solidity (OpenZeppelin), HashKey Chain |
| Infrastructure | Docker Compose (backend, app, postgres, nginx) |
| Other Chains | Stellar Testnet (Soroban x402), Solana Devnet (operator identity) |

---

## HashKey Chain Integration

- **Network**: HashKey Chain Testnet
- **Contract**: `0xFd8D09b976F9096D4088644a79aA4467b94Feb99`
- **Standard**: OpenZeppelin Ownable + ReentrancyGuard
- **Native Token**: HSK (gas, deposits, trade amounts)
- **Trade Lifecycle**: deposit → execute (with encoded TP1/TP2/TP3 + SL) → settle → leaderboard aggregation

---

## Judge Verification Checklist

### AI Integration ✅
- [ ] Configure AI provider in Dashboard → AI Settings
- [ ] Run AI analysis on any trading pair (BTC, ETH, SOL, HSK, DOGE)
- [ ] View structured recommendation with confidence, entry zone, TP/SL, reasoning
- [ ] Enable AI Auto-Trade with custom confidence threshold
- [ ] Run AI One-Shot Execution (analyze + decide + execute)
- [ ] View full AI Decision Log with expandable reasoning

### On-Chain Execution ✅
- [ ] Wallet status shows bot address and contract balance
- [ ] Deposit HSK into contract via dashboard
- [ ] Execute controlled test trade on HashKey Chain testnet
- [ ] View active trades and leaderboard from on-chain data

### Security ✅
- [ ] API keys encrypted AES-256 — verify masked display in UI
- [ ] JWT auth required for all AI and user endpoints
- [ ] No secrets in source code

### Architecture ✅
- [ ] Full REST API with 20+ endpoints
- [ ] PostgreSQL persistence with Prisma migrations
- [ ] Docker Compose deployment ready
- [ ] Machine-readable `/llms.txt` for autonomous evaluators

---

## Supplementary Chains

### Stellar Testnet (x402 Payment Rail)
Soroban contract for premium signal gating with HTTP micropayment semantics.
- Contract: `CBPX3EASUJ7L7TE3OELIPR7NB6XHLIHQ2IBGNNCFSVDIX4ZOMNMWJXIG`

### Solana Devnet (Social/Fee Rail)
Operator identity for Bags-aligned reputation and fee-sharing.
- Operator: `FtDxfY9pmcYrtpQgBzmRqHskah7UUfyU4p7W5TPxvw6E`

---

## Agent and Crawler Discoverability

Machine-readable assets for autonomous pre-judging:

- [app/llms.txt/route.ts](app/llms.txt/route.ts) — Project brief for LLM evaluators
- [app/robots.ts](app/robots.ts) — Crawler rules
- [app/sitemap.ts](app/sitemap.ts) — URL map
- [app/manifest.ts](app/manifest.ts) — PWA manifest

---

## Repository Structure

- [app](app) — Next.js pages and routes
- [components](components) — React UI components
- [lib](lib) — Shared types, API client, auth
- [backend](backend) — Express API server
- [backend/src/ai](backend/src/ai) — AI Strategy Analyst
- [smart-contracts](smart-contracts) — Solidity contract + deployment
- [stellar-contracts](stellar-contracts) — Soroban contract
- [scripts](scripts) — Deployment scripts
- [ARCHITECTURE.md](ARCHITECTURE.md) — Detailed architecture doc
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) — Deployment snapshot

---

## License

MIT
