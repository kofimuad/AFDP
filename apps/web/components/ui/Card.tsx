import * as React from "react";

import { cn } from "@/lib/utils";

// ── Base Card ────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a primary border accent on the left edge */
  accent?: boolean;
  /** Flat (no shadow) style for nested contexts */
  flat?: boolean;
  /** Make the card interactive (hover shadow lift) */
  interactive?: boolean;
}

export function Card({ className, accent, flat, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        flat ? "" : "shadow-[var(--shadow-sm)]",
        interactive && "cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]",
        accent && "border-l-4 border-l-[var(--color-primary)]",
        className
      )}
      {...props}
    />
  );
}

// ── Card sub-sections ────────────────────────────────────────────────────

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 border-b border-[var(--color-border)] px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("display-font text-lg font-bold text-[var(--color-text-primary)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[var(--color-text-muted)]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-[var(--color-border)] px-5 py-3",
        className
      )}
      {...props}
    />
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="display-font mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <span className="shrink-0 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] p-2.5 text-[var(--color-primary)]">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

// ── List Item Card ──────────────────────────────────────────────────────

interface ListItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  interactive?: boolean;
}

export function ListItemCard({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  interactive,
  className,
  ...props
}: ListItemCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3",
        interactive &&
          "cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]",
        className
      )}
      {...props}
    >
      {leading && <span className="shrink-0">{leading}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-[var(--color-text-muted)]">{subtitle}</p>
        )}
      </div>
      {meta && <p className="shrink-0 text-xs text-[var(--color-text-muted)]">{meta}</p>}
      {trailing && <span className="shrink-0">{trailing}</span>}
    </div>
  );
}
