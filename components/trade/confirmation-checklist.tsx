import { CheckCircle2, CircleAlert, Waves } from "lucide-react";

type Confirmations = {
  rsiExtreme: boolean;
  macdExtreme: boolean;
  volumeSpike: boolean;
  orderBookExtreme: boolean;
  total: number;
};

const items = [
  { key: "rsiExtreme", label: "RSI extreme" },
  { key: "macdExtreme", label: "MACD extreme" },
  { key: "volumeSpike", label: "Volume spike" },
  { key: "orderBookExtreme", label: "Order book extreme" },
] as const;

export function ConfirmationChecklist({
  confirmations,
  compact = true,
}: {
  confirmations: Confirmations;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Pre-trade checklist</p>
          <p className="text-sm text-[var(--muted)]">A trade can only open when all 4 signals are validated.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary)]">
          <Waves className="h-4 w-4" />
          {confirmations.total}/4
        </div>
      </div>

      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
        {items.map((item) => {
          const active = confirmations[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span>
              <span className={active ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                {active ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}