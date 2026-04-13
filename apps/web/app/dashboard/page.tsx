import Link from "next/link";
import { BarChart2, Eye, LayoutDashboard, MousePointer, Search, Settings, Shield, Store } from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Listings", icon: Store, active: false },
  { label: "Analytics", icon: BarChart2, active: false },
  { label: "Settings", icon: Settings, active: false }
] as const;

const STATS = [
  { label: "Total Views", value: "0", icon: Eye },
  { label: "Profile Clicks", value: "0", icon: MousePointer },
  { label: "Searches Appeared In", value: "0", icon: Search },
  { label: "Verified Status", value: "Pending", icon: Shield }
] as const;

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 md:px-6">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-[var(--radius-xl)] bg-[var(--color-dark)] p-4 text-white">
          <nav className="space-y-2">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 text-left text-sm ${
                  item.active
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {STATS.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                  <stat.icon size={16} className="text-[var(--color-text-muted)]" />
                </div>
                <p className="display-font mt-4 text-4xl text-[var(--color-text-primary)]">{stat.value}</p>
              </article>
            ))}
          </div>

          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Your Listings</h2>
            <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-16 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No listings yet.</p>
              <Link
                href="/vendors/register"
                className="mt-4 inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)]"
              >
                Add Your First Business
              </Link>
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Recent Activity</h2>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">No activity yet</p>
          </section>
        </section>
      </div>
    </main>
  );
}