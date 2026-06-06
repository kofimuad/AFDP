import type { VendorAnalytics } from "@/types";

interface VendorViewsChartProps {
  data: VendorAnalytics["views_this_week"];
}

export function VendorViewsChart({ data }: VendorViewsChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label="Profile views over the last 7 days">
        {data.map((point, i) => {
          const heightPct = (point.count / max) * 100;
          const isToday = i === data.length - 1;
          return (
            <div key={`${point.label}-${i}`} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                {point.count > 0 ? point.count : ""}
              </span>
              <div
                className="w-full rounded-t-[var(--radius-sm)] transition-all"
                style={{
                  height: `${Math.max(heightPct, point.count > 0 ? 6 : 2)}%`,
                  backgroundColor: isToday ? "var(--color-primary)" : "var(--color-primary-light)"
                }}
                title={`${point.label}: ${point.count} views`}
              />
              <span className="text-[11px] text-[var(--color-text-muted)]">{point.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {total} profile {total === 1 ? "view" : "views"} in the last 7 days
      </p>
    </div>
  );
}
