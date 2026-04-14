"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fields = [
  ["Bot name", "Quant Pulse Pro"],
  ["Category", "AI Agents"],
  ["Main pair", "BTC_USDT"],
  ["Minimum capital", "$250"],
  ["Premium model", "Bags + x402"],
  ["Risk profile", "Balanced"],
];

export function CreateBotPanel() {
  return (
    <Card>
      <CardHeader>
        <Badge tone="primary">Scaffold</Badge>
        <CardTitle className="mt-3 text-2xl font-semibold">Create Bot — Minimum listing data</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
        <div className="md:col-span-2">
          <Button className="w-full justify-center">Publish when contract is deployed</Button>
        </div>
      </CardContent>
    </Card>
  );
}
