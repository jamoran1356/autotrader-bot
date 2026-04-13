"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthToken } from "@/lib/auth-client";

const presets = [
  "Trade conservatively and protect capital first.",
  "Focus on high-conviction momentum setups only.",
  "Avoid overtrading and wait for full 4/4 confirmation.",
  "Explain every trade in simple language before execution.",
];

export function BotPersonalityPanel({ botId }: { botId: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const storageKey = `autotrader_prompt_${botId}`;
  const [prompt, setPrompt] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(storageKey) || "";
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    fetch(`${apiUrl}/users/prompts/${botId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json();
        return payload.data;
      })
      .then((record) => {
        if (record?.prompt) {
          setPrompt(record.prompt);
        }
      })
      .catch(() => null);
  }, [apiUrl, botId]);

  const savePrompt = async () => {
    const cleanPrompt = prompt.trim();
    localStorage.setItem(storageKey, cleanPrompt);

    const token = getAuthToken();
    if (token) {
      await fetch(`${apiUrl}/users/prompts/${botId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          tone: "professional",
          riskMode: "balanced",
        }),
      });
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <Card>
      <CardHeader>
        <Badge tone="primary">AI Prompting</Badge>
        <CardTitle className="mt-3 text-2xl font-semibold">Bot personality and behavior prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-[var(--muted)]">
          Let users define how the bot communicates and prioritizes decisions. This prompt can be attached to strategy execution and explanations.
        </p>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPrompt(preset)}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              {preset}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: Be disciplined, avoid emotional trades, and explain every action in one sentence."
          className="min-h-[140px] w-full rounded-[18px] border border-[var(--border-strong)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
        />

        <div className="flex items-center gap-3">
          <Button onClick={savePrompt}>Save personality prompt</Button>
          {saved ? <span className="text-sm font-semibold text-[var(--success)]">Saved</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
