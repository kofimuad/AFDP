import * as React from "react";

import { cn } from "@/lib/utils";

// ── Semantic badge variants ─────────────────────────────────────────────
export type BadgeVariant =
  | "restaurant"
  | "grocery"
  | "verified"
  | "featured"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const styleByVariant: Record<BadgeVariant, string> = {
  restaurant: "bg-[var(--color-primary-light)] text-[var(--color-restaurant)]",
  grocery:    "bg-[var(--color-grocery-light)] text-[var(--color-grocery)]",
  verified:   "bg-[var(--color-surface-hover)] text-[var(--color-dark-secondary)]",
  featured:   "bg-[var(--color-dark)] text-[var(--color-text-inverse)]",
  success:    "bg-[var(--color-success-light)] text-[var(--color-success)]",
  warning:    "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  error:      "bg-[var(--color-error-light)] text-[var(--color-error)]",
  info:       "bg-[var(--color-info-light)] text-[var(--color-info)]",
  neutral:    "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
};

/** Default label for domain-specific variants where text is almost always the same */
const defaultLabelByVariant: Partial<Record<BadgeVariant, string>> = {
  restaurant: "Restaurant",
  grocery:    "Grocery",
  verified:   "Verified",
  featured:   "Featured"
};

interface BadgeProps {
  variant?: BadgeVariant;
  /** Overrides the default label. Required when no default label exists (success/warning/error/info/neutral). */
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const label = children ?? defaultLabelByVariant[variant] ?? null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-semibold leading-5",
        styleByVariant[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
