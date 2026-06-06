import { Check, Minus } from "lucide-react";

import { COMPARISON, type ComparisonRow } from "@/lib/plans";

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check size={16} className="mx-auto text-[var(--color-success)]" />
    ) : (
      <Minus size={16} className="mx-auto text-[var(--color-text-muted)]" />
    );
  }
  return (
    <span className={highlight ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}>
      {value}
    </span>
  );
}

export function PlanComparison() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-muted)]">
            <th className="px-4 py-3 text-left">Feature</th>
            <th className="px-4 py-3 text-center">Basic</th>
            <th className="px-4 py-3 text-center text-[var(--color-primary)]">Featured</th>
            <th className="px-4 py-3 text-center">Premium</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((section) => (
            <SectionRows key={section.section} title={section.section} rows={section.rows} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionRows({ title, rows }: { title: string; rows: ComparisonRow[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={4}
          className="bg-[var(--color-surface-hover)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]"
        >
          {title}
        </td>
      </tr>
      {rows.map((row) => (
        <tr key={row.label} className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{row.label}</td>
          <td className="px-4 py-3 text-center"><Cell value={row.basic} /></td>
          <td className="px-4 py-3 text-center"><Cell value={row.featured} highlight /></td>
          <td className="px-4 py-3 text-center"><Cell value={row.premium} /></td>
        </tr>
      ))}
    </>
  );
}
