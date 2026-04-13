"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAiAutoTradeSettings,
  getAiConfig,
  runAiExecution,
  updateAiAutoTradeSettings,
} from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";
import type { AiExecutionResponse } from "@/lib/types";

const QUICK_PAIRS = ["BTC_USDT", "ETH_USDT", "SOL_USDT", "HSK_USDT"];

export function AiAutoTradePanel() {
  const [enabled, setEnabled] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0.7);
  const [hasConfig, setHasConfig] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One-shot execution state
  const [execPair, setExecPair] = useState("BTC_USDT");
  const [execAmount, setExecAmount] = useState("0.01");
  const [execResult, setExecResult] = useState<AiExecutionResponse | null>(null);
  const [isExecuting, startExec] = useTransition();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("autotrader-auth-change", syncAuth);
    return () => window.removeEventListener("autotrader-auth-change", syncAuth);
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getAiConfig().then((config) => setHasConfig(Boolean(config?.hasKey)));
      getAiAutoTradeSettings().then((settings) => {
        setEnabled(settings.enabled);
        setMinConfidence(settings.minConfidence);
      });
    }
  }, [loggedIn]);

  const handleToggle = () => {
    startSave(async () => {
      setFeedback(null);
      setError(null);
      try {
        const updated = await updateAiAutoTradeSettings({ enabled: !enabled });
        setEnabled(updated.enabled);
        setFeedback(
          updated.enabled
            ? "AI Auto-Trade enabled. The bot will consult your AI before executing trades."
            : "AI Auto-Trade disabled. Trades will use technical signals only."
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update setting.");
      }
    });
  };

  const handleConfidenceUpdate = () => {
    startSave(async () => {
      setFeedback(null);
      setError(null);
      try {
        const updated = await updateAiAutoTradeSettings({ minConfidence });
        setMinConfidence(updated.minConfidence);
        setFeedback(`Minimum confidence threshold set to ${Math.round(updated.minConfidence * 100)}%.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update threshold.");
      }
    });
  };

  const handleOneShot = () => {
    startExec(async () => {
      setExecResult(null);
      setError(null);
      try {
        const result = await runAiExecution(execPair.trim().toUpperCase(), execAmount);
        setExecResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI execution failed.");
      }
    });
  };

  if (!loggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">AI Auto-Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
            Log in to configure AI-gated autonomous trading.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">AI Auto-Trade</CardTitle>
          {enabled ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <Badge tone="neutral">Inactive</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Auto-trade toggle */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Autonomous AI Execution</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            When enabled, the scanner will consult your AI provider before executing any trade.
            Only trades where AI confidence exceeds the threshold will be executed on-chain.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button
              onClick={handleToggle}
              disabled={isSaving || !hasConfig}
              variant={enabled ? "secondary" : "primary"}
            >
              {isSaving ? "Updating..." : enabled ? "Disable AI Gate" : "Enable AI Gate"}
            </Button>

            {!hasConfig && (
              <span className="text-xs text-[var(--muted)]">
                Configure your AI provider first in AI Settings.
              </span>
            )}
          </div>
        </div>

        {/* Confidence threshold */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Confidence Threshold</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Minimum AI confidence required to approve trade execution (10% – 100%).
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={Math.round(minConfidence * 100)}
              onChange={(e) => setMinConfidence(Number(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="w-12 text-right text-sm font-semibold">
              {Math.round(minConfidence * 100)}%
            </span>
            <Button variant="secondary" onClick={handleConfidenceUpdate} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>

        {/* One-shot AI execution */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">AI One-Shot Execution</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Analyze a pair with AI and execute on-chain in a single step — if AI approves.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_PAIRS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setExecPair(p)}
                className={`rounded-2xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  execPair === p
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]"
                }`}
              >
                {p.replace("_", "/")}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
            <input
              type="text"
              value={execPair}
              onChange={(e) => setExecPair(e.target.value)}
              placeholder="BTC_USDT"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)]"
            />
            <input
              type="text"
              value={execAmount}
              onChange={(e) => setExecAmount(e.target.value)}
              placeholder="0.01"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)]"
            />
            <Button onClick={handleOneShot} disabled={isExecuting || !hasConfig || !execPair.trim()}>
              {isExecuting ? "Analyzing..." : "AI Execute"}
            </Button>
          </div>
        </div>

        {/* Execution result */}
        {execResult && (
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <Badge tone={execResult.ai.recommendation === "NO_TRADE" ? "neutral" : "success"}>
                {execResult.ai.recommendation}
              </Badge>
              <span className="text-sm font-semibold">
                {Math.round(execResult.ai.confidence * 100)}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--foreground)]">{execResult.ai.reasoning}</p>

            <div className="mt-3 rounded-xl bg-[var(--background)] p-3">
              {execResult.execution.attempted ? (
                <div className="flex items-center gap-2">
                  <Badge tone={execResult.execution.status === "success" ? "success" : "warning"}>
                    {execResult.execution.status === "success" ? "Trade Executed" : "Execution Failed"}
                  </Badge>
                  {execResult.execution.txHash && (
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {execResult.execution.txHash.slice(0, 16)}...
                    </span>
                  )}
                  {execResult.execution.error && (
                    <span className="text-xs text-[#b42318]">{execResult.execution.error}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Not executed: {execResult.execution.reason}
                </p>
              )}
            </div>
          </div>
        )}

        {feedback && <p className="text-sm text-[var(--success)]">{feedback}</p>}
        {error && <p className="text-sm text-[#b42318]">{error}</p>}
      </CardContent>
    </Card>
  );
}
