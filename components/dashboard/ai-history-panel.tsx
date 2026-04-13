"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAiTradeHistory } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";
import type { AiTradeLogEntry } from "@/lib/types";

function RecommendationBadge({ rec }: { rec: string }) {
  const tone =
    rec === "LONG" ? "success" : rec === "SHORT" ? "warning" : rec === "ERROR" ? "warning" : "default";
  return <Badge tone={tone}>{rec}</Badge>;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "var(--success)" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-[var(--border)]">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold">{pct}%</span>
    </div>
  );
}

export function AiHistoryPanel() {
  const [logs, setLogs] = useState<AiTradeLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startLoad] = useTransition();
  const [loggedIn, setLoggedIn] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const syncAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("autotrader-auth-change", syncAuth);
    return () => window.removeEventListener("autotrader-auth-change", syncAuth);
  }, []);

  useEffect(() => {
    if (loggedIn) {
      loadHistory();
    }
  }, [loggedIn]);

  function loadHistory() {
    startLoad(async () => {
      const data = await getAiTradeHistory(20);
      setLogs(data.logs);
      setTotal(data.total);
    });
  }

  if (!loggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">AI Decision Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
            Log in to view your AI trade decision history.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">AI Decision Log</CardTitle>
          <div className="flex items-center gap-3">
            {total > 0 && (
              <span className="text-sm text-[var(--muted)]">{total} decisions</span>
            )}
            <Button variant="secondary" onClick={loadHistory} disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
            No AI decisions yet. Run an AI analysis or enable AI auto-trade to see the decision trail here.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:bg-[var(--border)]"
            >
              <button
                type="button"
                className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-3">
                  <RecommendationBadge rec={log.recommendation} />
                  <span className="font-semibold text-[var(--foreground)]">{log.pair}</span>
                  <ConfidenceBar value={log.confidence} />
                </div>
                <div className="flex items-center gap-3">
                  {log.executed ? (
                    <Badge tone="success">Executed</Badge>
                  ) : (
                    <Badge tone="default">Not executed</Badge>
                  )}
                  {log.txHash && (
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {log.txHash.slice(0, 10)}...
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </button>

              {expandedId === log.id && (
                <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">AI Reasoning</p>
                    <p className="mt-1 text-sm text-[var(--foreground)]">{log.reasoning}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {log.marketRegime && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Market Regime</p>
                        <p className="text-sm font-semibold">{log.marketRegime}</p>
                      </div>
                    )}
                    {log.entryLow != null && log.entryHigh != null && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Entry Zone</p>
                        <p className="text-sm font-semibold">
                          ${log.entryLow.toLocaleString()} – ${log.entryHigh.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {log.stopLoss != null && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Stop Loss</p>
                        <p className="text-sm font-semibold">${log.stopLoss.toLocaleString()}</p>
                      </div>
                    )}
                    {log.riskReward != null && (
                      <div>
                        <p className="text-xs text-[var(--muted)]">Risk/Reward</p>
                        <p className="text-sm font-semibold">{log.riskReward.toFixed(2)}:1</p>
                      </div>
                    )}
                  </div>

                  {log.keyRisks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">Key Risks</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-[var(--foreground)]">
                        {log.keyRisks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {log.executionError && (
                    <div>
                      <p className="text-xs font-semibold text-[#b42318]">Execution Error</p>
                      <p className="mt-1 text-sm text-[#b42318]">{log.executionError}</p>
                    </div>
                  )}

                  <div className="text-xs text-[var(--muted)]">
                    Provider: {log.provider} · Model: {log.model}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
