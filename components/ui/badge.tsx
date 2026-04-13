import { clsx } from "clsx";

type BadgeTone = "primary" | "accent" | "success" | "neutral" | "warning";

const toneClassNames: Record<BadgeTone, string> = {
  primary: "bg-[var(--primary-soft)] text-[var(--primary)] border-[rgba(34,83,217,0.16)]",
  accent: "bg-[rgba(210,139,51,0.14)] text-[var(--accent)] border-[rgba(210,139,51,0.18)]",
  success: "bg-[rgba(15,159,111,0.12)] text-[var(--success)] border-[rgba(15,159,111,0.18)]",
  neutral: "bg-white text-[var(--foreground)] border-[var(--border)]",
  warning: "bg-[rgba(192,122,18,0.12)] text-[var(--warning)] border-[rgba(192,122,18,0.18)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}