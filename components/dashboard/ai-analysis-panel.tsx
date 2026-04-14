"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAiConfig, runAiAnalysis } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";
import type { AiAnalysisResponse } from "@/lib/types";

const POPULAR_PAIRS = ["BTC_USDT", "ETH_USDT", "SOL_USDT", "HSK_USDT", "DOGE_USDT"];

export function AiAnalysisPanel() {
  const [pair, setPair] = useState("BTC_USDT");
  const [result, setResult] = useState<AiAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyze] = useTransition();
  const [hasConfig, setHasConfig] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("autotrader-auth-change", syncAuth);
    return () => window.removeEventListener("autotrader-auth-change", syncAuth);
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getAiConfig().then((config) => setHasConfig(Boolean(config?.hasKey)));
    }
  }, [loggedIn]);

  // Re-check config when the window regains focus (user may have just saved key)
  useEffect(() => {
    const onFocus = () => {
      if (isLoggedIn()) {
        getAiConfig().then((config) => setHasConfig(Boolean(config?.hasKey)));
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleAnalyze = () => {
    startAnalyze(async () => {
      setError(null);
      setResult(null);

      if (!pair.trim()) {
        setError("Enter a trading pair.");
        return;
      }

      try {
        const data = await runAiAnalysis(pair.trim().toUpperCase());
        setResult(data);
        window.dispatchEvent(new Event("autotrader-analysis-complete"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
      }
    });
  };

  if (!loggedIn || !hasConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">AI Market Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
            {!loggedIn
              ? "Log in and configure your AI provider to access intelligent market analysis."
              : "Configure your AI provider above to unlock AI-powered analysis."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">AI Market Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Analyze any trading pair</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            AI combines live technical indicators (RSI, MACD, ATR, volume, order book) with deep reasoning to produce a risk-aware recommendation.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR_PAIRS.map((p) => (
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
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !pair.trim()}>
              {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}

        {result ? <AnalysisResult data={result} /> : null}
      </CardContent>
    </Card>
  );
}

function AnalysisResult({ data }: { data: AiAnalysisResponse }) {
  const { ai, technical } = data;

  const recColor =
    ai.recommendation === "LONG"
      ? "success"
      : ai.recommendation === "SHORT"
        ? "warning"
        : ("neutral" as const);

  return (
    <div className="space-y-4">
      {/* Header / recommendation */}
      <div className="rounded-[20px] border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{ai.pair}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {ai.recommendation.replace("_", " ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={recColor}>Confidence {ai.confidence}%</Badge>
            <span className="text-xs text-[var(--muted)]">
              {ai.provider}/{ai.model} · {ai.cached ? "cached" : "live"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{ai.reasoning}</p>
      </div>

      {/* Entry / TP / SL grid */}
      {ai.recommendation !== "NO_TRADE" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ai.entry_zone && (
            <MetricBlock
              label="Entry Zone"
              value={`$${ai.entry_zone.low.toLocaleString()} – $${ai.entry_zone.high.toLocaleString()}`}
            />
          )}
          {ai.stop_loss && (
            <MetricBlock label="Stop Loss" value={`$${ai.stop_loss.price.toLocaleString()}`} sub={ai.stop_loss.rationale} />
          )}
          {ai.risk_reward_ratio != null && (
            <MetricBlock label="Risk/Reward" value={`${ai.risk_reward_ratio.toFixed(2)}x`} />
          )}
          {ai.position_size_pct != null && (
            <MetricBlock label="Position Size" value={`${ai.position_size_pct}% of portfolio`} />
          )}
          {ai.take_profits?.map((tp) => (
            <MetricBlock
              key={tp.level}
              label={tp.level}
              value={`$${tp.price.toLocaleString()}`}
              sub={tp.rationale}
            />
          ))}
        </div>
      )}

      {/* Market regime + risks */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Market Regime</p>
          <p className="mt-2 text-sm font-semibold capitalize text-[var(--foreground)]">
            {ai.market_regime?.replace(/_/g, " ") || "Unknown"}
          </p>
        </div>

        {ai.invalidation && (
          <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Invalidation</p>
            <p className="mt-2 text-sm text-[var(--foreground)]">{ai.invalidation}</p>
          </div>
        )}
      </div>

      {ai.key_risks?.length > 0 && (
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Key Risks</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
            {ai.key_risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical data summary */}
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Technical data fed to AI</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <MiniMetric label="Price" value={`$${technical.currentPrice}`} />
          <MiniMetric label="RSI" value={technical.rsi?.toFixed(2) ?? "N/A"} />
          <MiniMetric label="MACD" value={technical.macd?.macd?.toFixed(6) ?? "N/A"} />
          <MiniMetric label="ATR" value={typeof technical.atr === "number" ? technical.atr.toFixed(6) : "N/A"} />
          <MiniMetric label="Volume 24h" value={technical.volume24h ?? "N/A"} />
          <MiniMetric label="Change 24h" value={technical.change24h ?? "N/A"} />
          <MiniMetric label="Buy %" value={`${technical.orderBook?.buyPercentage?.toFixed(1) ?? "N/A"}%`} />
          <MiniMetric
            label="Confirmations"
            value={`${technical.confirmations?.total ?? 0}/4`}
          />
        </div>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}
