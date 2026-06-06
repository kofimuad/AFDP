interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-[var(--color-surface)] px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-2 gap-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center shadow-[var(--shadow-sm)] md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="display-font text-3xl font-extrabold leading-none tracking-tight text-[var(--color-primary)]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm font-medium text-[var(--color-text-muted)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
