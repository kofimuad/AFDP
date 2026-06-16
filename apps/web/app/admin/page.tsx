"use client";

import {
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  Users as UsersIcon
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Badge } from "@/components/ui/Badge";
import {
  adminDeleteVendor,
  adminListUsers,
  adminListVendors,
  adminSetUserActive,
  adminSetVendorDelivery,
  adminToggleVendorFeature,
  adminUpdateUserRole,
  adminUpdateVendorPlan,
  adminVerifyVendor,
  getAdminTotals,
  getSearchGeo,
  getTopSearches,
  getTopViewed,
  getZeroResultSearches,
  type AdminTotals,
  type AdminUser,
  type AdminVendor,
  type SearchGeoPoint,
  type TopSearch,
  type TopViewed,
  type ZeroResultSearch
} from "@/lib/api";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Tab = "overview" | "demand" | "vendors" | "users";

const NAV: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "demand", label: "Demand Map", icon: MapPin },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "users", label: "Users", icon: UsersIcon }
];

function AdminInner() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Demand intelligence, moderation, and platform management.
          </p>
        </div>
        <Badge variant="error">Admin</Badge>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden h-fit rounded-[var(--radius-xl)] bg-[var(--color-dark)] p-3 text-white lg:block">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm font-medium transition",
                  tab === item.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {/* Mobile tab bar */}
          <div className="mb-5 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition",
                  tab === item.id
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-text-muted)]"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab onGoToVendors={() => setTab("vendors")} />}
          {tab === "demand" && <DemandTab />}
          {tab === "vendors" && <VendorsTab showToast={showToast} />}
          {tab === "users" && <UsersTab showToast={showToast} />}
        </div>
      </div>
    </main>
  );
}

// ── KPI card ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "warning";
  hint?: string;
}) {
  const warn = tone === "warning";
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-sm)]",
        warn
          ? "border-[var(--color-warning)] bg-[var(--color-warning-light)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <span
          className={cn(
            "rounded-[var(--radius-md)] p-2",
            warn ? "bg-[var(--color-warning)]/15 text-[var(--color-warning)]" : "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          )}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="display-font mt-2 text-3xl font-extrabold text-[var(--color-text-primary)]">
        {value.toLocaleString()}
      </p>
      {hint && (
        <p className={cn("mt-1 text-xs", warn ? "font-medium text-[var(--color-warning)]" : "text-[var(--color-text-muted)]")}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ── List card ────────────────────────────────────────────────

function ListCard({
  title,
  subtitle,
  rows,
  emphasis
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; value: number }[];
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="display-font text-base font-bold text-[var(--color-text-primary)]">{title}</h3>
      {subtitle && <p className="mb-3 mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">No data yet.</p>
      ) : (
        <ul className={cn("space-y-1", !subtitle && "mt-3")}>
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 text-sm last:border-0">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">{i + 1}</span>
                <span className={cn("truncate", emphasis ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]")}>
                  {r.label}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-[var(--color-text-primary)]">{r.value.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────

function OverviewTab({ onGoToVendors }: { onGoToVendors: () => void }) {
  const [totals, setTotals] = useState<AdminTotals | null>(null);
  const [top, setTop] = useState<TopSearch[]>([]);
  const [zero, setZero] = useState<ZeroResultSearch[]>([]);
  const [topVendors, setTopVendors] = useState<TopViewed[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [t, s, z, tv, pending] = await Promise.all([
          getAdminTotals(),
          getTopSearches(30, 8),
          getZeroResultSearches(30, 8),
          getTopViewed("vendor", 30, 8),
          adminListVendors({ page_size: 200 })
        ]);
        if (cancel) return;
        setTotals(t);
        setTop(s);
        setZero(z);
        setTopVendors(tv);
        setPendingCount(pending.filter((v) => !v.is_verified).length);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-hover)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Users" value={totals?.users ?? 0} icon={UsersIcon} />
        <KpiCard label="Active Vendors" value={totals?.vendors ?? 0} icon={Store} />
        <KpiCard label="Total Searches" value={totals?.total_searches ?? 0} icon={Search} />
        <KpiCard
          label="Zero-Result Searches"
          value={totals?.zero_result_searches ?? 0}
          icon={AlertTriangle}
          tone="warning"
          hint="Demand AFDP isn't serving yet"
        />
      </div>

      {/* Pending approvals callout */}
      {pendingCount != null && pendingCount > 0 && (
        <button
          type="button"
          onClick={onGoToVendors}
          className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-[var(--color-warning-light)] px-5 py-4 text-left transition hover:brightness-[0.98]"
        >
          <ShieldCheck size={20} className="shrink-0 text-[var(--color-warning)]" />
          <span className="flex-1">
            <span className="block text-sm font-bold text-[var(--color-text-primary)]">
              {pendingCount} {pendingCount === 1 ? "vendor is" : "vendors are"} awaiting verification
            </span>
            <span className="block text-xs text-[var(--color-text-muted)]">Review and approve them in the Vendors queue.</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-[var(--color-warning)]">Review →</span>
        </button>
      )}

      {/* Insight lists */}
      <div className="grid gap-4 md:grid-cols-2">
        <ListCard
          title="Top searches"
          subtitle="Last 30 days"
          rows={top.map((r) => ({ label: r.normalized_query, value: r.count }))}
        />
        <ListCard
          title="Demand gaps"
          subtitle="Zero-result searches — what users want that AFDP lacks"
          rows={zero.map((r) => ({ label: r.normalized_query, value: r.count }))}
          emphasis
        />
        <ListCard
          title="Most-viewed vendors"
          subtitle="Last 30 days"
          rows={topVendors.map((r) => ({ label: r.name ?? r.entity_id, value: r.count }))}
        />
        <div className="flex flex-col justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-[var(--shadow-sm)]">
          <BarChart3 size={22} className="mx-auto text-[var(--color-text-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{(totals?.total_views ?? 0).toLocaleString()} total profile/dish views</p>
          <p className="text-xs text-[var(--color-text-muted)]">Open the Demand Map to see where searches cluster.</p>
        </div>
      </div>
    </div>
  );
}

// ── Demand map ───────────────────────────────────────────────

function DemandTab() {
  const [points, setPoints] = useState<SearchGeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [zeroOnly, setZeroOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setPoints(await getSearchGeo(30, 2000));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => (zeroOnly ? points.filter((p) => p.zero_result) : points), [points, zeroOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={zeroOnly}
            onChange={(e) => setZeroOnly(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Show only zero-result searches
        </label>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-error)]" /> Unmet demand
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /> Served demand
          </span>
          <span>{visible.length} points</span>
        </div>
      </div>

      <div className="h-[68vh] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Loading map…</div>
        ) : (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ latitude: 38.9072, longitude: -77.0369, zoom: 3.5 }}
            mapStyle="mapbox://styles/mapbox/light-v11"
          >
            <NavigationControl position="top-right" />
            {visible.map((p, i) => (
              <Marker key={i} longitude={p.lng} latitude={p.lat}>
                <div
                  title={`${p.normalized_query}${p.zero_result ? " (no results)" : ""}`}
                  className="h-2.5 w-2.5 rounded-full opacity-70"
                  style={{ backgroundColor: p.zero_result ? "var(--color-error)" : "var(--color-primary)" }}
                />
              </Marker>
            ))}
          </Map>
        )}
      </div>
    </div>
  );
}

// ── Table shell ──────────────────────────────────────────────

function SearchBar({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-1 items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 focus-within:border-[var(--color-primary)]">
        <Search size={15} className="shrink-0 text-[var(--color-text-muted)]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        Search
      </button>
    </div>
  );
}

// ── Vendors (verification queue) ─────────────────────────────

function VendorsTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setVendors(await adminListVendors({ q: q || undefined, page_size: 100 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = vendors.filter((v) => !v.is_verified).length;
  const shown = filter === "pending" ? vendors.filter((v) => !v.is_verified) : vendors;

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      showToast(ok, "success");
      await reload();
    } catch {
      showToast("Action failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} onSubmit={reload} placeholder="Search vendors by name or address…" />

      {/* Queue filter */}
      <div className="inline-flex rounded-full bg-[var(--color-surface-hover)] p-1">
        {([
          ["pending", `Pending${pendingCount ? ` (${pendingCount})` : ""}`],
          ["all", "All vendors"]
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filter === key
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-hover)]">
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  {filter === "pending" ? "No vendors awaiting verification 🎉" : "No vendors found."}
                </td></tr>
              ) : (
                shown.map((v) => (
                  <tr key={v.id} className={cn(busyId === v.id && "opacity-50")}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--color-text-primary)]">{v.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{v.address}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={v.type === "grocery_store" ? "grocery" : "restaurant"} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={v.plan}
                        onChange={(e) => act(v.id, () => adminUpdateVendorPlan(v.id, e.target.value), `Plan set to ${e.target.value}`)}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs capitalize text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="basic">basic</option>
                        <option value="featured">featured</option>
                        <option value="premium">premium</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {v.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
                        {v.is_featured && <Badge variant="featured" />}
                      </div>
                      {/* Delivery override (true / false / unknown) */}
                      <select
                        value={v.delivery_available === true ? "yes" : v.delivery_available === false ? "no" : "unknown"}
                        onChange={(e) => {
                          const val = e.target.value === "yes" ? true : e.target.value === "no" ? false : null;
                          act(v.id, () => adminSetVendorDelivery(v.id, val), "Delivery updated");
                        }}
                        title="Delivery availability"
                        className="mt-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="unknown">🛵 Delivery: unknown</option>
                        <option value="yes">🛵 Delivers</option>
                        <option value="no">🛵 No delivery</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {!v.is_verified && (
                          <button
                            type="button"
                            disabled={busyId === v.id}
                            onClick={() => act(v.id, () => adminVerifyVendor(v.id), "Vendor verified")}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                          >
                            <ShieldCheck size={12} />
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => act(v.id, () => adminToggleVendorFeature(v.id), v.is_featured ? "Unfeatured" : "Featured")}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                        >
                          <Star size={12} className={cn(v.is_featured && "fill-current text-[var(--color-primary)]")} />
                          {v.is_featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => {
                            if (confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) {
                              act(v.id, () => adminDeleteVendor(v.id), "Vendor deleted");
                            }
                          }}
                          aria-label="Delete vendor"
                          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 text-[var(--color-error)] transition hover:bg-[var(--color-error-light)] disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────

function UsersTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setUsers(await adminListUsers({ q: q || undefined, page_size: 100 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      showToast(ok, "success");
      await reload();
    } catch {
      showToast("Action failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} onSubmit={reload} placeholder="Search users by email or name…" />

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-hover)]">
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={cn(busyId === u.id && "opacity-50")}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--color-text-primary)]">{u.full_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => act(u.id, () => adminUpdateUserRole(u.id, e.target.value), `Role set to ${e.target.value}`)}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="user">user</option>
                        <option value="vendor">vendor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? "success" : "neutral"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => act(u.id, () => adminSetUserActive(u.id, !u.is_active), u.is_active ? "User deactivated" : "User activated")}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminInner />
    </ProtectedRoute>
  );
}
