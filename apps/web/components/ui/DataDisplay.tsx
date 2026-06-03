import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// ── Stats Grid ───────────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  description?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <dl className={cn("grid grid-cols-1 gap-4", colClass, className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-start justify-between">
              <dt className="text-sm text-[var(--color-text-muted)]">{stat.label}</dt>
              {Icon && (
                <span className="rounded-[var(--radius-md)] bg-[var(--color-primary-light)] p-2 text-[var(--color-primary)]">
                  <Icon size={16} aria-hidden="true" />
                </span>
              )}
            </div>
            <dd className="display-font text-3xl font-bold text-[var(--color-text-primary)]">
              {stat.value}
            </dd>
            {stat.trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  stat.trend.positive
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-error)]"
                )}
              >
                {stat.trend.positive ? "↑" : "↓"} {stat.trend.value}
              </p>
            )}
            {stat.description && (
              <p className="text-xs text-[var(--color-text-muted)]">{stat.description}</p>
            )}
          </div>
        );
      })}
    </dl>
  );
}

// ── Data List ────────────────────────────────────────────────────────────

export interface DataListItem {
  label: string;
  value: React.ReactNode;
  /** Renders value in red/primary emphasis */
  emphasis?: boolean;
}

interface DataListProps {
  items: DataListItem[];
  /** Horizontal: label/value side by side; vertical: stacked */
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function DataList({ items, layout = "horizontal", className }: DataListProps) {
  return (
    <dl
      className={cn(
        "divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "px-4 py-3",
            layout === "horizontal"
              ? "flex items-center justify-between gap-4"
              : "flex flex-col gap-0.5"
          )}
        >
          <dt className="text-sm text-[var(--color-text-muted)]">{item.label}</dt>
          <dd
            className={cn(
              "text-sm font-semibold",
              item.emphasis
                ? "text-[var(--color-error)]"
                : "text-[var(--color-text-primary)]"
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ── Data Table ───────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  /** Width hint (Tailwind class like "w-24") */
  width?: string;
  /** How to align cell content */
  align?: "left" | "center" | "right";
  /** Custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T extends object> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Row key extractor */
  rowKey: (row: T, index: number) => string | number;
  /** Shown when rows is empty */
  emptyMessage?: string;
  /** Makes each row clickable */
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No data available",
  onRowClick,
  className
}: DataTableProps<T>) {
  const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]",
                    col.width,
                    alignClass[col.align ?? "left"]
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3 text-sm text-[var(--color-text-primary)]",
                        alignClass[col.align ?? "left"]
                      )}
                    >
                      {col.render
                        ? col.render(row, index)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-12 text-center",
        className
      )}
    >
      {icon && (
        <span className="text-[var(--color-text-muted)]">{icon}</span>
      )}
      <div>
        <p className="display-font text-lg font-semibold text-[var(--color-text-primary)]">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
