import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

const baseClassName =
  "inline-flex items-center justify-center gap-2 rounded-full transition duration-200 font-semibold";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] px-5 py-3 text-[#ffffff] shadow-[var(--shadow-card)] hover:bg-[#163da8]",
  secondary:
    "border border-[var(--border-strong)] bg-white/80 px-5 py-3 text-[var(--foreground)] hover:bg-[var(--surface)]",
  ghost: "px-4 py-2 text-[var(--primary)] hover:bg-[var(--primary-soft)]",
};

const sizeClassNames: Record<ButtonSize, string> = {
  md: "text-sm",
  lg: "px-6 py-3.5 text-base",
};

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={twMerge(clsx(baseClassName, variantClassNames[variant], sizeClassNames[size], className))}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={twMerge(clsx(baseClassName, variantClassNames[variant], sizeClassNames[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}