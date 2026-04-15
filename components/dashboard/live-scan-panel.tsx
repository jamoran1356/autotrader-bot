"use client";

import { useState, useTransition } from "react";
import { Activity, Globe, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAIRS = ["BTC_USDT", "ETH_USDT", "SOL_USDT", "HSK_USDT", "DOGE_USDT"];

interface SentimentData {
  fearGreedIndex: { value: number; label: string } | null;
  news: Array<{ title: string; source: string; sentiment: string; url: string; publishedAt: string }>;
  overallSentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
}

interface ScanResult {
  pair: string;
  currentPrice: number;
  change24h: string;
  volume24h: string;
  high24h: number;
  low24h: number;
  indicators: {
    rsi: number | null;
    macd: { value: number; signal: number; histogram: number } | null;
    atr: number | null;
  };
  orderBook: { buyPercentage: number; sellPercentage: number };
  confirmations: {
    rsiExtreme: boolean;
    macdExtreme: boolean;
    volumeSpike: boolean;
    orderBookExtreme: boolean;
    total: string;
  };
  sentiment: SentimentData | null;
  timestamp: string;
}

export function LiveScanPanel() {
  const [pair, setPair] = useState("BTC_USDT");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, startScan] = useTransition();

  const handleScan = () => {
    startScan(async () => {
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`/api/ai/scan/${encodeURIComponent(pair.trim().toUpperCase())}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Scan failed");
        setResult(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">Live Market Scanner</CardTitle>
          <Badge tone="success">No API key needed</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Real-time technical analysis</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Fetches live data from Gate.io and computes RSI, MACD, ATR, volume analysis, and order book signals. This is the same data pipeline that feeds the AI.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {PAIRS.map((p) => (
              <button
                key={p}
                onClick={() => setPair(p)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  pair === p
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]"
                }`}
              >
                {p.replace("_", "/")}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder="BTC_USDT"
              className="flex-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
            />
            <Button onClick={handleScan} disabled={isScanning || !pair.trim()}>
              {isScanning ? (
                <>
                  <Activity className="h-4 w-4 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Scan now
                </>
              )}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-[#b42318]">{error}</p>}

        {result && <ScanResultView data={result} />}
      </CardContent>
    </Card>
  );
}

function ScanResultView({ data }: { data: ScanResult }) {
  const isPositive = !data.change24h.startsWith("-");
  const confirmCount = parseInt(data.confirmations.total);

  return (
    <div className="space-y-4">
      {/* Price header */}
      <div className="rounded-[20px] border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{data.pair.replace("_", " / ")}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              ${data.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={isPositive ? "success" : "warning"}>
              {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {data.change24h}
            </Badge>
            <span className="text-xs text-[var(--muted)]">Vol: {data.volume24h}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <span className="text-[var(--muted)]">24h High: <strong className="text-[var(--foreground)]">${data.high24h.toLocaleString()}</strong></span>
          <span className="text-[var(--muted)]">24h Low: <strong className="text-[var(--foreground)]">${data.low24h.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="RSI (14)" value={data.indicators.rsi?.toFixed(2) ?? "N/A"} hint={data.indicators.rsi ? (data.indicators.rsi > 70 ? "Overbought" : data.indicators.rsi < 30 ? "Oversold" : "Neutral") : undefined} />
        <Metric label="MACD" value={data.indicators.macd?.value.toFixed(6) ?? "N/A"} hint={data.indicators.macd ? (data.indicators.macd.histogram > 0 ? "Bullish" : "Bearish") : undefined} />
        <Metric label="ATR (14)" value={data.indicators.atr?.toFixed(6) ?? "N/A"} hint="Volatility" />
        <Metric label="Order Book" value={`${data.orderBook.buyPercentage}% buy`} hint={data.orderBook.buyPercentage > 60 ? "Buy pressure" : data.orderBook.buyPercentage < 40 ? "Sell pressure" : "Balanced"} />
      </div>

      {/* 4/4 Confirmations */}
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">4/4 Safety Gate</p>
          <Badge tone={confirmCount >= 4 ? "success" : confirmCount >= 2 ? "warning" : "neutral"}>
            {data.confirmations.total} confirmations
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <ConfirmPill label="RSI extreme" active={data.confirmations.rsiExtreme} />
          <ConfirmPill label="MACD signal" active={data.confirmations.macdExtreme} />
          <ConfirmPill label="Volume spike" active={data.confirmations.volumeSpike} />
          <ConfirmPill label="Book pressure" active={data.confirmations.orderBookExtreme} />
        </div>
      </div>

      {/* Social Sentiment */}
      {data.sentiment && (
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--muted)]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Social Sentiment</p>
            </div>
            <Badge
              tone={
                data.sentiment.overallSentiment === "bullish"
                  ? "success"
                  : data.sentiment.overallSentiment === "bearish"
                    ? "warning"
                    : "neutral"
              }
            >
              {data.sentiment.overallSentiment} — {data.sentiment.sentimentScore}/100
            </Badge>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {/* Fear & Greed */}
            {data.sentiment.fearGreedIndex && (
              <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Fear & Greed Index</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[var(--foreground)]">{data.sentiment.fearGreedIndex.value}</span>
                  <span className="text-xs text-[var(--muted)]">{data.sentiment.fearGreedIndex.label}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.sentiment.fearGreedIndex.value}%`,
                      background:
                        data.sentiment.fearGreedIndex.value > 60
                          ? "var(--success)"
                          : data.sentiment.fearGreedIndex.value < 40
                            ? "#b42318"
                            : "var(--primary)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sentiment Score */}
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Aggregate Sentiment</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--foreground)]">{data.sentiment.sentimentScore}</span>
                <span className="text-xs text-[var(--muted)]">/100</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Combined from Fear & Greed + crypto news sentiment
              </p>
            </div>
          </div>

          {/* News headlines */}
          {data.sentiment.news.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--foreground)]">Latest crypto news</p>
              {data.sentiment.news.map((n, i) => (
                <a
                  key={i}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs transition-colors hover:border-[var(--primary)]"
                >
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      n.sentiment === "positive"
                        ? "bg-[var(--success)]"
                        : n.sentiment === "negative"
                          ? "bg-[#b42318]"
                          : "bg-[var(--border)]"
                    }`}
                  />
                  <span className="text-[var(--foreground)]">{n.title}</span>
                  <span className="ml-auto shrink-0 text-[var(--muted)]">{n.source}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function ConfirmPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
        active
          ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
          : "border-[var(--border)] bg-white/50 text-[var(--muted)]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />
      {label}
    </div>
  );
}
