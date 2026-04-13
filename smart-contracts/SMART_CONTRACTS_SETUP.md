# 🔗 SMART CONTRACTS - SETUP & DEPLOYMENT

**AutoTrader Bot - HashKey Chain**

---

## 📋 CONTENIDO

```
smart-contracts/
├── contracts/
│   └── AutoTrader.sol           (10.3 KB - Main contract)
├── scripts/
│   └── deploy.js                (2.5 KB - Deployment script)
├── test/
│   └── AutoTrader.test.js       (7.4 KB - Unit tests)
├── hardhat.config.js            (1.6 KB - Hardhat config)
├── package.json                 (1.1 KB - Dependencies)
├── .env.example                 (0.7 KB - Environment template)
└── SMART_CONTRACTS_SETUP.md     (This file)
```

---

## 🎯 QUÉ HACE EL CONTRATO

### AutoTrader.sol (Main Contract)

```solidity
✅ Deposit/Withdraw funds
✅ Execute trades (with 4/4 confirmations)
✅ Close trades (with profit/loss calculation)
✅ Update Take Profits (TP1, TP2, TP3)
✅ Update Stop Loss (SL)
✅ Copy-trading (follow other traders)
✅ Platform fees (2% default)
✅ Bot statistics (win rate, profit, etc)
```

**Key Features:**
- ReentrancyGuard (seguridad)
- Ownable (admin functions)
- Event logging (on-chain transparency)
- Win rate calculation (real-time)

---

## 🚀 INSTALACIÓN LOCAL

### 1. Prerequisitos

```bash
✅ Node.js 16+
✅ npm o yarn
✅ Hardhat (se instala con npm install)
```

### 2. Instalar dependencias

```bash
cd smart-contracts
npm install
```

**Se instala:**
- hardhat (framework)
- ethers.js (blockchain interaction)
- @openzeppelin/contracts (security)
- chai (testing)

### 3. Configurar .env

```bash
cp .env.example .env
nano .env  # O tu editor favorito
```

**Valores necesarios:**

```env
# RPC URLs (pre-configuradas para HashKey)
HASHKEY_RPC_URL=https://mainnet-rpc.hashkey.com
HASHKEY_TESTNET_RPC=https://testnet-rpc.hashkey.com

# IMPORTANTE: Tu private key
PRIVATE_KEY=0x...  # Bot wallet private key

# Direcciones (se configuran después de deploy)
PRICE_FEED_ADDRESS=0x...
FEE_COLLECTOR_ADDRESS=0x...  # Wallet para fees
```

---

## 🧪 TESTING LOCAL

### Compilar contrato

```bash
npm run compile

# Output:
# ✅ Compiled 1 Solidity file successfully
```

### Ejecutar tests

```bash
npm test

# Output:
# ✅ AutoTrader
#   ✅ Deployment
#     ✓ Should deploy successfully
#     ✓ Should initialize with correct parameters
#   ✅ Trade Execution
#     ✓ Should execute a trade with 4/4 confirmations
#     ✓ Should reject trades with < 4 confirmations
#   ...
```

### Con reporte de gas

```bash
npm run gas-report

# Muestra cuánto gas usa cada función
# Útil para optimizar antes de deploy
```

---

## 📤 DEPLOYMENT

### Deploy a Testnet (Recomendado primero)

```bash
npm run deploy:testnet

# Output esperado:
# 🚀 Starting AutoTrader deployment...
# 📝 Deploying from: 0x...
# 💰 Account balance: X.XX ETH
# 📦 Deploying AutoTrader...
# ✅ AutoTrader deployed to: 0x1234...5678
# 💾 Deployment info saved to deployments.json
```

**La salida te dará:**
- Contract address
- Deployment block number
- Timestamp

### Deploy a Mainnet (Solo cuando esté testeado)

```bash
npm run deploy:mainnet

# ⚠️ IMPORTANTE:
# - Verifica que todo funcione en testnet primero
# - Mainnet = dinero real
# - No se puede desplegar dos veces
```

---

## 🔍 DESPUÉS DEL DEPLOYMENT

### Verificar en Explorer

**HashKey Mainnet Explorer:**
```
https://explorer.hashkey.com/address/CONTRACT_ADDRESS
```

Deberías ver:
- ✅ Contract code
- ✅ Transactions
- ✅ Contract creator

### Actualizar Backend

Una vez desplegado, actualiza `/backend/.env`:

```env
CONTRACT_ADDRESS=0x1234...5678  # Del deployment
CONTRACT_ABI=[...]              # Generar abajo
```

**Generar ABI:**

```bash
cat artifacts/contracts/AutoTrader.sol/AutoTrader.json | jq '.abi' > abi.json

# Copia el contenido a .env:
CONTRACT_ABI=$(cat abi.json)
```

---

## 📚 ESTRUCTURA DEL CONTRATO

### Structs Principales

```solidity
struct Trade {
  uint256 id;              // ID único
  string pair;             // BTC_USDT, etc
  uint256 entryPrice;      // Precio de entrada
  uint256 tp1, tp2, tp3;   // Take profit levels
  uint256 sl;              // Stop loss
  uint256 amount;          // Cantidad en USDT
  address trader;          // Dueño del trade
  bool isOpen;             // ¿Abierto?
  uint8 rsi;               // RSI cuando se abrió
  uint8 confirmations;     // # de confirmaciones
}

struct BotStats {
  uint256 totalTrades;     // Total de trades
  uint256 winTrades;       // Trades ganadores
  uint256 totalProfit;     // Profit total
  uint256 winRate;         // %
}
```

### Funciones Principales

```solidity
// DEPOSIT/WITHDRAW
deposit()                          // Deposita ETH/HKEY
withdraw(uint256 amount)           // Retira fondos

// TRADING
executeTrade(...)                  // Abre nuevo trade (4/4 required)
closeTrade(tradeId, exitPrice)     // Cierra trade
updateTakeProfit(tradeId, ...)     // Actualiza TP
updateStopLoss(tradeId, sl)        // Actualiza SL

// COPY-TRADING
startCopyTrade(trader, amount, fee) // Sigue a otro trader
stopCopyTrade(copyId)              // Detiene copy

// INFO
getTrade(tradeId)                  // Info del trade
getBotStatistics(bot)              // Stats de bot
getBalance(user)                   // Balance del user
```

---

## 🔐 SEGURIDAD

**Mecanismos implementados:**

```solidity
✅ ReentrancyGuard
   - Previene re-entrancy attacks
   - Protege withdraw y closeTrade

✅ Ownable
   - Solo owner puede cambiar fees
   - Cambiar price feed
   - Cambiar fee collector

✅ Validaciones
   - Confirmations >= 4
   - TP > Entry > SL
   - Suficiente balance
   - Solo owner puede cerrar trade

✅ Eventos
   - Todo registrado on-chain
   - Transparencia 100%
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'hardhat'"

```bash
cd smart-contracts
npm install
```

### Error: "Invalid private key"

```env
# MAL:
PRIVATE_KEY=0x0x123...  # No doble 0x

# BIEN:
PRIVATE_KEY=0x123...    # Solo un 0x al inicio
# O:
PRIVATE_KEY=123...      # Sin 0x (hardhat lo agrega)
```

### Error: "Insufficient balance"

```
Necesitas fondos en tu wallet:
- Testnet: Pide faucet tokens
- Mainnet: Compra HKEY en exchange

Verifica:
ethers.getBalance(WALLET_ADDRESS)
```

### Error: "RPC connection failed"

```bash
# Verifica RPC en .env:
HASHKEY_RPC_URL=https://mainnet-rpc.hashkey.com

# Test conexión:
curl https://mainnet-rpc.hashkey.com/health

# Si no funciona, usa testnet:
HASHKEY_TESTNET_RPC=https://testnet-rpc.hashkey.com
```

### Error en tests: "Contract at X does not have code"

```bash
# Normal en tests locales
# Hardhat spinea una red local
# Los tests crean el contrato en cada test

# Solución: Limpiar y recompilar
npm run clean
npm run compile
npm test
```

---

## 🔗 INTERACCIÓN CON BACKEND

### Backend llama el contrato así:

```javascript
// backend/src/executor/TradeExecutor.js

const tx = await this.contract.executeTrade(
  "BTC_USDT",           // pair
  entryPrice,           // entry
  tp1, tp2, tp3,        // take profits
  sl,                   // stop loss
  amount,               // trade amount
  rsi,                  // RSI value
  confirmations         // 4 (mínimo)
);

await tx.wait(1);       // Espera 1 confirmación
```

### Ejemplos de llamadas

```javascript
// Abrir trade
const tradeId = await contract.executeTrade(
  "BTC_USDT",
  ethers.utils.parseEther("70000"),  // Entry: 70,000
  ethers.utils.parseEther("71000"),  // TP1: 71,000
  ethers.utils.parseEther("72000"),  // TP2: 72,000
  ethers.utils.parseEther("73000"),  // TP3: 73,000
  ethers.utils.parseEther("69000"),  // SL: 69,000
  ethers.utils.parseEther("1"),      // Amount: 1
  55,                                 // RSI: 55
  4                                   // Confirmations: 4
);

// Cerrar trade
await contract.closeTrade(
  tradeId,
  ethers.utils.parseEther("72500")  // Exit price
);

// Ver stats
const stats = await contract.getBotStatistics(botAddress);
console.log("Win rate:", stats.winRate.toNumber() / 100, "%");
```

---

## 📊 INFORMACIÓN IMPORTANTE

### Gas Costs (Aproximado)

```
Deploy:              ~300,000 gas
Execute Trade:       ~150,000 gas
Close Trade:         ~100,000 gas
Update TP/SL:        ~50,000 gas
Copy Trade Start:    ~80,000 gas

Testnet = gratis (faucet)
Mainnet = $$$ (calcula antes)
```

### Fees

```
Platform fee:        2% (configurable)
Network gas:         ~$5-20 por tx (depends on congestion)
Total por trade:     ~$6-25 (entrada + salida)
```

---

## 🎯 PRÓXIMAS FASES

### Phase 3: Frontend Integration

El frontend (`../frontend/`) debe:

1. Conectar con wallet (MetaMask, etc)
2. Leer contract ABI
3. Llamar funciones del contrato
4. Mostrar trades en real-time
5. Update TP/SL desde UI

### Phase 4: Deployment

1. ✅ Deploy a testnet (verificar)
2. ✅ Audit de seguridad
3. ✅ Deploy a mainnet
4. ✅ Verificar en explorer

---

## 💾 ARCHIVOS GENERADOS

Después del deployment:

```
smart-contracts/
├── artifacts/
│   └── contracts/AutoTrader.sol/
│       ├── AutoTrader.json    # ABI + bytecode
│       └── AutoTrader.dbg.json
├── cache/                       # Compilación cache
├── deployments.json            # ✅ Guardar esto!
└── abi.json                    # ABI extraído
```

**IMPORTANTE:** Guarda `deployments.json` en lugar seguro.

---

## ✅ CHECKLIST ANTES DE DEPLOY MAINNET

```
□ Tests pasando (npm test)
□ Compilación limpia (npm run compile)
□ Testado en testnet 24h+
□ Private key seguro (.env no committeado)
□ Suficiente balance (HKEY)
□ ABI updated en backend .env
□ Contract address guardado
□ Funciones testeadas manualmente
```

---

## 🆘 SOPORTE

Problemas frecuentes:

1. **"Cannot find module"** → `npm install`
2. **"Invalid RPC"** → Verifica URL en .env
3. **"Insufficient balance"** → Faucet o compra HKEY
4. **"Transaction reverted"** → Revisa requirements (4/4 confirmations, etc)

---

**¡Smart Contracts listos para HashKey!** 🚀

**Next: Deploy a testnet y luego mainnet** 📤
