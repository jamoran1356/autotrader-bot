/**
 * MARKET SCANNER - Core Trading Opportunity Detector
 * Detects 4/4 confirmations: RSI + MACD + Volume + OrderBook
 */

const axios = require('axios');
const EventEmitter = require('events');

class MarketScanner extends EventEmitter {
  constructor(config = {}) {
    super();
    this.baseUrl = config.gateUrl || 'https://api.gateio.ws/api/v4';
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.scanInterval = config.scanInterval || 3600000; // 1 hour
    this.pairs = config.pairs || [];
    this.minConfirmations = config.minConfirmations || 4;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return null;

    const deltas = [];
    for (let i = 1; i < closes.length; i++) {
      deltas.push(closes[i] - closes[i - 1]);
    }

    const seed = deltas.slice(0, period + 1);
    let up = 0, down = 0;

    seed.forEach(delta => {
      if (delta >= 0) up += delta;
      else down -= delta;
    });

    up /= period;
    down /= period;

    let rs = up / down || 0;
    let rsi = 100 - 100 / (1 + rs);

    for (let i = period; i < deltas.length; i++) {
      const delta = deltas[i];
      if (delta >= 0) up = (up * (period - 1) + delta) / period;
      else down = (down * (period - 1) - delta) / period;

      rs = up / down || 0;
      rsi = 100 - 100 / (1 + rs);
    }

    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    if (closes.length < slow) return null;

    const closes_array = closes.map(c => parseFloat(c));

    // EMA12
    let ema12 = [];
    ema12[0] = closes_array[0];
    for (let i = 1; i < closes_array.length; i++) {
      ema12[i] = closes_array[i] * (2 / (fast + 1)) + ema12[i - 1] * (1 - 2 / (fast + 1));
    }

    // EMA26
    let ema26 = [];
    ema26[0] = closes_array[0];
    for (let i = 1; i < closes_array.length; i++) {
      ema26[i] = closes_array[i] * (2 / (slow + 1)) + ema26[i - 1] * (1 - 2 / (slow + 1));
    }

    // MACD Line
    const macdLine = ema12.map((val, i) => val - ema26[i]);

    // Signal Line
    let signalLine = [];
    signalLine[0] = macdLine[0];
    for (let i = 1; i < macdLine.length; i++) {
      signalLine[i] = macdLine[i] * (2 / (signal + 1)) + signalLine[i - 1] * (1 - 2 / (signal + 1));
    }

    // Histogram
    const histogram = macdLine.map((val, i) => val - signalLine[i]);

    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1]
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  calculateATR(highs, lows, closes, period = 14) {
    if (closes.length < period) return null;

    let tr = [];
    for (let i = 1; i < closes.length; i++) {
      const h = parseFloat(highs[i]);
      const l = parseFloat(lows[i]);
      const c = parseFloat(closes[i - 1]);

      const tr1 = h - l;
      const tr2 = Math.abs(h - c);
      const tr3 = Math.abs(l - c);

      tr.push(Math.max(tr1, tr2, tr3));
    }

    const atr = tr.slice(-period).reduce((a, b) => a + b) / period;
    return atr;
  }

  /**
   * Fetch klines (candles) from Gate.io
   */
  async fetchKlines(pair, interval = '1h', limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/candlesticks`, {
        params: {
          currency_pair: pair,
          interval: interval,
          limit: limit
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching klines for ${pair}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch ticker data
   */
  async fetchTicker(pair) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/tickers`, {
        params: { currency_pair: pair },
        timeout: 5000
      });

      return response.data[0];
    } catch (error) {
      console.error(`Error fetching ticker for ${pair}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch order book
   */
  async fetchOrderBook(pair, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/order_book`, {
        params: {
          currency_pair: pair,
          limit: limit
        },
        timeout: 5000
      });

      const data = response.data;
      const buyVol = data.bids.reduce((sum, [_, vol]) => sum + parseFloat(vol), 0);
      const sellVol = data.asks.reduce((sum, [_, vol]) => sum + parseFloat(vol), 0);
      const total = buyVol + sellVol;

      return {
        buyPercentage: (buyVol / total) * 100,
        sellPercentage: (sellVol / total) * 100,
        buyVolume: buyVol,
        sellVolume: sellVol
      };
    } catch (error) {
      console.error(`Error fetching order book for ${pair}:`, error.message);
      return null;
    }
  }

  /**
   * Analyze single pair
   */
  async analyzePair(pair) {
    const klines = await this.fetchKlines(pair);
    if (!klines || klines.length < 26) return null;

    const closes = klines.map(k => parseFloat(k[4]));
    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));
    const volumes = klines.map(k => parseFloat(k[5]));

    // Calculate indicators
    const rsi = this.calculateRSI(closes);
    const macd = this.calculateMACD(closes);
    const atr = this.calculateATR(highs, lows, closes);

    // Fetch ticker & order book
    const ticker = await this.fetchTicker(pair);
    const orderBook = await this.fetchOrderBook(pair);

    if (!ticker || !orderBook || !macd) return null;

    const currentPrice = parseFloat(ticker.last);
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
    const currentVolume = volumes[volumes.length - 1];

    // Check confirmations
    const confirmations = {
      rsiExtreme: rsi < 30 || rsi > 70,
      macdExtreme: Math.abs(macd.macd) > 0.0015,
      volumeSpike: currentVolume > avgVolume * 1.2,
      orderBookExtreme: orderBook.buyPercentage > 60 || orderBook.buyPercentage < 40,
      total: 0
    };

    confirmations.total =
      (confirmations.rsiExtreme ? 1 : 0) +
      (confirmations.macdExtreme ? 1 : 0) +
      (confirmations.volumeSpike ? 1 : 0) +
      (confirmations.orderBookExtreme ? 1 : 0);

    return {
      pair,
      currentPrice,
      rsi,
      macd,
      atr,
      orderBook,
      confirmations,
      volume24h: parseFloat(ticker.quote_volume),
      change24h: parseFloat(ticker.change_percentage),
      high24h: parseFloat(ticker.high_24h),
      low24h: parseFloat(ticker.low_24h),
      timestamp: new Date()
    };
  }

  /**
   * Scan all pairs for opportunities
   */
  async scanAllPairs(pairs) {
    console.log(`[SCANNER] Starting scan of ${pairs.length} pairs...`);
    const results = [];

    for (const pair of pairs) {
      const analysis = await this.analyzePair(pair);
      if (analysis && analysis.confirmations.total >= 4) {
        results.push(analysis);
        console.log(`[SCANNER] ✅ ${pair} - ${analysis.confirmations.total}/4 confirmations`);
      } else {
        console.log(`[SCANNER] ⏸️ ${pair} - ${analysis?.confirmations.total || 0}/4`);
      }
    }

    // Sort by strength
    results.sort((a, b) => {
      if (a.confirmations.total !== b.confirmations.total) {
        return b.confirmations.total - a.confirmations.total;
      }
      return Math.abs(b.macd.macd) - Math.abs(a.macd.macd);
    });

    console.log(`[SCANNER] Found ${results.length} strong opportunities`);
    this.emit('scan-complete', results);
    return results;
  }

  /**
   * Start continuous scanning
   */
  startScanning(pairs) {
    console.log(`[SCANNER] Starting continuous scanning every ${this.scanInterval}ms`);

    // Scan immediately
    this.scanAllPairs(pairs);

    // Then scan every interval
    this.scanInterval = setInterval(() => {
      this.scanAllPairs(pairs);
    }, this.scanInterval);
  }

  /**
   * Stop scanning
   */
  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      console.log('[SCANNER] Scanning stopped');
    }
  }
}

module.exports = MarketScanner;
