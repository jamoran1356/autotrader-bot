"use client";

import { useState, useTransition, useEffect } from "react";
import { Bot, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUserBot, getUserBots, type UserBot } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth-client";

const PAIRS = ["BTC_USDT", "ETH_USDT", "SOL_USDT", "HSK_USDT"];
const TONES = ["balanced", "aggressive", "conservative", "analytical"];
const RISK_MODES = ["balanced", "aggressive", "conservative", "dynamic"];

const TEMPLATES = [
  {
    label: "Momentum Scalper",
    prompt:
      "You are an aggressive momentum trader. Enter only when RSI shows extreme readings AND MACD confirms the direction. Use tight stop losses at 1.5x ATR. Take profit at 2x risk. Never hold positions longer than 4 hours.",
    tone: "aggressive",
    riskMode: "aggressive",
  },
  {
    label: "Swing Defender",
    prompt:
      "You are a conservative swing trader. Wait for all 4/4 confirmations before entering. Use wide stops at 2.5x ATR. Target 3:1 reward-to-risk. Skip any trade where social sentiment conflicts with technical signals. Prefer safety over opportunity.",
    tone: "conservative",
    riskMode: "conservative",
  },
  {
    label: "Sentiment Surfer",
    prompt:
      "You are a sentiment-driven trader. Weigh social sentiment and Fear & Greed Index heavily. Only enter bullish trades when sentiment score > 60 and bearish trades when < 40. Use standard 2x ATR stops. Exit immediately if sentiment reverses.",
    tone: "analytical",
    riskMode: "balanced",
  },
];

export function CreateBotPanel() {
  const [bots, setBots] = useState<UserBot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [pair, setPair] = useState("BTC_USDT");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("balanced");
  const [riskMode, setRiskMode] = useState("balanced");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  useEffect(() => {
    if (isLoggedIn()) {
      getUserBots().then(setBots);
    }
  }, []);

  const applyTemplate = (tpl: (typeof TEMPLATES)[number]) => {
    setPrompt(tpl.prompt);
    setTone(tpl.tone);
    setRiskMode(tpl.riskMode);
    setShowForm(true);
  };

  const handleCreate = () => {
    if (!name.trim() || !prompt.trim()) {
      setError("Name and prompt are required.");
      return;
    }
    setError(null);
    startCreate(async () => {
      try {
        const bot = await createUserBot({ name: name.trim(), pair, prompt: prompt.trim(), tone, riskMode });
        setBots((prev) => [bot, ...prev]);
        setName("");
        setPrompt("");
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create bot.");
      }
    });
  };

  const parsePair = (p: string) => {
    const match = p.match(/\[pair:([^\]]+)\]/);
    return match ? match[1] : null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">Your Trading Bots</CardTitle>
          <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Create bot"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick templates */}
        {!showForm && bots.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Create your first autonomous trading agent. Choose a template or build from scratch.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="group rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition-all hover:border-[var(--primary)] hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                    <p className="text-sm font-semibold text-[var(--foreground)]">{tpl.label}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{tpl.prompt}</p>
                  <div className="mt-2 flex gap-1">
                    <Badge tone="neutral">{tpl.tone}</Badge>
                    <Badge tone="neutral">{tpl.riskMode}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="space-y-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface)] p-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--foreground)]">Bot name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Alpha Scalper"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Trading pair</label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                >
                  {PAIRS.map((p) => (
                    <option key={p} value={p}>
                      {p.replace("_", "/")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]">Risk mode</label>
                <select
                  value={riskMode}
                  onChange={(e) => setRiskMode(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                >
                  {RISK_MODES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--foreground)]">
                AI personality prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how the AI agent should analyze markets and make decisions..."
                rows={4}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
              <p className="text-xs text-[var(--muted)]">
                This prompt instructs the AI on entry/exit strategy, risk tolerance, indicator preferences, and sentiment weighting.
              </p>
            </div>

            {error && <p className="text-sm text-[#b42318]">{error}</p>}

            <Button onClick={handleCreate} disabled={isCreating} className="w-full justify-center">
              {isCreating ? "Creating..." : "Create autonomous agent"}
            </Button>
          </div>
        )}

        {/* Bot list */}
        {bots.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Your agents ({bots.length})
            </p>
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{bot.botId}</p>
                    {parsePair(bot.prompt) && (
                      <Badge tone="neutral">{parsePair(bot.prompt)}</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                    {bot.prompt.replace(/\[pair:[^\]]+\]\s*/, "")}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <Badge tone="neutral">{bot.tone}</Badge>
                    <Badge tone="neutral">{bot.riskMode}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && bots.length > 0 && (
          <p className="text-center text-xs text-[var(--muted)]">
            Bots created here are visible in the Marketplace and can be used for AI-gated auto-trade.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
