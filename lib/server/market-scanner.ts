/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MARKET SCANNER - Core Trading Opportunity Detector
 * Detects 4/4 confirmations: RSI + MACD + Volume + OrderBook
 */

import axios from "axios";
import { EventEmitter } from "events";

export class MarketScanner extends EventEmitter {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  scanIntervalMs: number;
  pairs: string[];
  minConfirmations: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: any = {}) {
    super();
    this.baseUrl = config.gateUrl || "https://api.gateio.ws/api/v4";
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.scanIntervalMs = config.scanInterval || 3600000;
    this.pairs = config.pairs || [];
    this.minConfirmations = config.minConfirmations || 4;
  }

  calculateRSI(closes: number[], period = 14): number | null {
    if (closes.length < period + 1) return null;

    const deltas: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      deltas.push(closes[i] - closes[i - 1]);
    }

    const seed = deltas.slice(0, period + 1);
    let up = 0,
      down = 0;

    seed.forEach((delta) => {
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

  calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
    if (closes.length < slow) return null;

    const closesArr = closes.map((c) => parseFloat(String(c)));

    const ema12: number[] = [closesArr[0]];
    for (let i = 1; i < closesArr.length; i++) {
      ema12[i] = closesArr[i] * (2 / (fast + 1)) + ema12[i - 1] * (1 - 2 / (fast + 1));
    }

    const ema26: number[] = [closesArr[0]];
    for (let i = 1; i < closesArr.length; i++) {
      ema26[i] = closesArr[i] * (2 / (slow + 1)) + ema26[i - 1] * (1 - 2 / (slow + 1));
    }

    const macdLine = ema12.map((val, i) => val - ema26[i]);

    const signalLine: number[] = [macdLine[0]];
    for (let i = 1; i < macdLine.length; i++) {
      signalLine[i] = macdLine[i] * (2 / (signal + 1)) + signalLine[i - 1] * (1 - 2 / (signal + 1));
    }

    const histogram = macdLine.map((val, i) => val - signalLine[i]);

    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1],
    };
  }

  calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number | null {
    if (closes.length < period) return null;

    const tr: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const h = parseFloat(String(highs[i]));
      const l = parseFloat(String(lows[i]));
      const c = parseFloat(String(closes[i - 1]));
      tr.push(Math.max(h - l, Math.abs(h - c), Math.abs(l - c)));
    }

    return tr.slice(-period).reduce((a, b) => a + b) / period;
  }

  async fetchKlines(pair: string, interval = "1h", limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/candlesticks`, {
        params: { currency_pair: pair, interval, limit },
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching klines for ${pair}:`, error.message);
      return null;
    }
  }

  async fetchTicker(pair: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/tickers`, {
        params: { currency_pair: pair },
        timeout: 5000,
      });
      return response.data[0];
    } catch (error: any) {
      console.error(`Error fetching ticker for ${pair}:`, error.message);
      return null;
    }
  }

  async fetchOrderBook(pair: string, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/spot/order_book`, {
        params: { currency_pair: pair, limit },
        timeout: 5000,
      });

      const data = response.data;
      const buyVol = data.bids.reduce((sum: number, [, vol]: [string, string]) => sum + parseFloat(vol), 0);
      const sellVol = data.asks.reduce((sum: number, [, vol]: [string, string]) => sum + parseFloat(vol), 0);
      const total = buyVol + sellVol;

      return {
        buyPercentage: (buyVol / total) * 100,
        sellPercentage: (sellVol / total) * 100,
        buyVolume: buyVol,
        sellVolume: sellVol,
      };
    } catch (error: any) {
      console.error(`Error fetching order book for ${pair}:`, error.message);
      return null;
    }
  }

  async analyzePair(pair: string) {
    const klines = await this.fetchKlines(pair);
    if (!klines || klines.length < 26) return null;

    const closes = klines.map((k: any) => parseFloat(k[4]));
    const highs = klines.map((k: any) => parseFloat(k[2]));
    const lows = klines.map((k: any) => parseFloat(k[3]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));

    const rsi = this.calculateRSI(closes);
    const macd = this.calculateMACD(closes);
    const atr = this.calculateATR(highs, lows, closes);

    const ticker = await this.fetchTicker(pair);
    const orderBook = await this.fetchOrderBook(pair);

    if (!ticker || !orderBook || !macd) return null;

    const currentPrice = parseFloat(ticker.last);
    const avgVolume = volumes.slice(-20).reduce((a: number, b: number) => a + b) / 20;
    const currentVolume = volumes[volumes.length - 1];

    const confirmations = {
      rsiExtreme: rsi !== null && (rsi < 30 || rsi > 70),
      macdExtreme: Math.abs(macd.macd) > 0.0015,
      volumeSpike: currentVolume > avgVolume * 1.2,
      orderBookExtreme: orderBook.buyPercentage > 60 || orderBook.buyPercentage < 40,
      total: 0,
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
      timestamp: new Date(),
    };
  }

  async scanAllPairs(pairs: string[]) {
    console.log(`[SCANNER] Starting scan of ${pairs.length} pairs...`);
    const results: any[] = [];

    for (const pair of pairs) {
      const analysis = await this.analyzePair(pair);
      if (analysis && analysis.confirmations.total >= 4) {
        results.push(analysis);
      }
    }

    results.sort((a, b) => {
      if (a.confirmations.total !== b.confirmations.total) return b.confirmations.total - a.confirmations.total;
      return Math.abs(b.macd.macd) - Math.abs(a.macd.macd);
    });

    this.emit("scan-complete", results);
    return results;
  }

  startScanning(pairs: string[]) {
    this.scanAllPairs(pairs);
    this.timer = setInterval(() => {
      this.scanAllPairs(pairs);
    }, this.scanIntervalMs);
  }

  stopScanning() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
