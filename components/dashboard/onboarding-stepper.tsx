"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Key, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAiConfig } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";

type StepStatus = "done" | "current" | "upcoming";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  anchor?: string;
}

export function OnboardingStepper() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const authenticated = isLoggedIn();
      setLoggedIn(authenticated);
      if (authenticated) {
        getAiConfig().then((config) => setHasAiKey(Boolean(config?.hasKey)));
      }
    };
    syncAuth();
    window.addEventListener("autotrader-auth-change", syncAuth);
    window.addEventListener("autotrader-ai-config-change", syncAuth);
    window.addEventListener("focus", syncAuth);
    return () => {
      window.removeEventListener("autotrader-auth-change", syncAuth);
      window.removeEventListener("autotrader-ai-config-change", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  // Listen for analysis-complete events (dispatched from analysis panel)
  useEffect(() => {
    const onAnalysis = () => setHasRunAnalysis(true);
    window.addEventListener("autotrader-analysis-complete", onAnalysis);
    return () => window.removeEventListener("autotrader-analysis-complete", onAnalysis);
  }, []);

  // Re-check AI key on focus (user may have just saved it)
  useEffect(() => {
    const onFocus = () => {
      if (isLoggedIn()) {
        getAiConfig().then((config) => setHasAiKey(Boolean(config?.hasKey)));
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const getStatus = (done: boolean, index: number, steps: boolean[]): StepStatus => {
    if (done) return "done";
    const prevDone = index === 0 || steps.slice(0, index).every(Boolean);
    return prevDone ? "current" : "upcoming";
  };

  const completions = [loggedIn, hasAiKey, hasRunAnalysis];
  const allDone = completions.every(Boolean);

  const steps: Step[] = [
    {
      id: "auth",
      label: "Sign in",
      description: loggedIn ? "Authenticated" : "Create an account or sign in to get started",
      icon: Check,
      status: getStatus(loggedIn, 0, completions),
      anchor: "/auth",
    },
    {
      id: "ai-key",
      label: "Configure AI provider",
      description: hasAiKey
        ? "AI provider connected"
        : "Add your OpenRouter, OpenAI, or Anthropic API key below",
      icon: Key,
      status: getStatus(hasAiKey, 1, completions),
      anchor: "#ai-settings",
    },
    {
      id: "analyze",
      label: "Run your first AI analysis",
      description: hasRunAnalysis
        ? "Analysis complete — check the results below"
        : "Pick a trading pair and let the AI analyze live market data",
      icon: Sparkles,
      status: getStatus(hasRunAnalysis, 2, completions),
      anchor: "#ai-analysis",
    },
  ];

  if (allDone) return null;

  const completedCount = completions.filter(Boolean).length;

  return (
    <Card className="border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--primary)]" />
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Get started — {completedCount}/3 complete
            </p>
          </div>
          <div className="flex gap-1">
            {completions.map((done, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  done ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <a
              key={step.id}
              href={step.status === "current" ? step.anchor : undefined}
              className={`group flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                step.status === "done"
                  ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                  : step.status === "current"
                    ? "border-[var(--primary)]/40 bg-white cursor-pointer hover:border-[var(--primary)] hover:shadow-sm"
                    : "border-[var(--border)] bg-white/50 opacity-60"
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  step.status === "done"
                    ? "bg-[var(--success)] text-white"
                    : step.status === "current"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {step.status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{step.label}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{step.description}</p>
              </div>
              {step.status === "current" && (
                <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
