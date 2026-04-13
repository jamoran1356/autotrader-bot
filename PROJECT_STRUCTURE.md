# 🤖 AUTOTRADER BOT - ESTRUCTURA PROYECTO

**Hackathon:** HashKey Chain Horizon  
**Timeline:** 5 días  
**Deadline:** Apr 15, 2026  
**Goal:** Production-ready MVP

---

## 📁 ESTRUCTURA CARPETAS

```
autotrader-bot/
├── smart-contracts/          # Smart contracts HashKey
│   ├── AutoTrader.sol        # Main contract
│   ├── TradeExecutor.sol     # Trade execution logic
│   ├── CopyTrading.sol       # Copy-trading logic
│   └── README.md
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── scanner/          # MACD/RSI scanner
│   │   ├── executor/         # Trade execution
│   │   ├── api/              # REST endpoints
│   │   ├── models/           # Database schemas
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation
│   │   └── index.js          # Entry point
│   ├── tests/                # Unit tests
│   ├── .env.example          # Config template
│   ├── package.json
│   └── README.md
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── package.json
│   └── README.md
├── docs/                     # Documentation
│   ├── API.md
│   ├── SMART_CONTRACTS.md
│   └── DEPLOYMENT.md
└── README.md
```

---

## 🎯 COMPONENTES CLAVE

### 1. Smart Contract (HashKey Mainnet)
```solidity
- AutoTrader.sol: Core contract
- Entry/Exit/SL logic
- On-chain state management
- Event emitters
```

### 2. Backend (Node.js + Express)
```
Scanner:
- Real-time MACD/RSI/ATR calculation
- Opportunity detection
- 4/4 confirmation logic

Executor:
- Smart contract interaction
- Trade execution
- Settlement

API:
- REST endpoints
- WebSocket for live updates
- Authentication
- Data persistence
```

### 3. Frontend (React)
```
Dashboard:
- Opportunities feed
- Active trades
- Leaderboard
- Copy-trading interface
```

---

## 📊 DATABASE SCHEMA

```
Collections:

opportunities:
- id, pair, price, rsi, macd, atr
- timestamp, status

trades:
- id, user_id, pair, entry_price
- tp1, tp2, tp3, sl
- status, profit/loss, gas_used

users:
- id, wallet_address, win_rate
- total_trades, total_profit

copy_trades:
- id, original_trader, copier
- auto_copy, fee_percentage

leaderboard:
- rank, user_id, win_rate
- total_profit, 30d_performance
```

---

## 🔄 WORKFLOW

```
1. Scanner detects 4/4 opportunity
   ↓
2. Creates opportunity record
   ↓
3. Users can view/copy trade
   ↓
4. Bot executes on blockchain
   ↓
5. Trade recorded on-chain
   ↓
6. Profit/loss calculated
   ↓
7. Copiers receive same trade
   ↓
8. Settlement + fees
```

---

## ✅ ACCEPTANCE CRITERIA

```
Backend MVP:
✅ Scanner 4/4 detection
✅ Smart contract interaction
✅ Trade execution
✅ Real-time updates (WebSocket)
✅ Leaderboard calculations
✅ Copy-trading logic
✅ 95%+ uptime
✅ <500ms response time
✅ Full test coverage
```

---

## 🚀 DEPLOYMENT

```
Day 5:
- Deploy SC to HashKey mainnet
- Backend on production server
- Frontend on IPFS/Vercel
- Final testing
- Video demo
- Submit to DoraHacks
```

---

**Status: READY TO BUILD** 🔥
