"use client";

import { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  adminDeleteVendor,
  adminListUsers,
  adminListVendors,
  adminSetUserActive,
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
  type ZeroResultSearch,
} from "@/lib/api";
import { useToast } from "@/lib/store/toastStore";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Tab = "overview" | "demand" | "vendors" | "users";

function AdminInner() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="display-font text-3xl mb-2">Admin Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Demand intelligence, moderation, and platform management.
        </p>

        <div className="flex gap-2 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
          {(["overview", "demand", "vendors", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "demand" && <DemandTab />}
        {tab === "vendors" && <VendorsTab showToast={showToast} />}
        {tab === "users" && <UsersTab showToast={showToast} />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [totals, setTotals] = useState<AdminTotals | null>(null);
  const [top, setTop] = useState<TopSearch[]>([]);
  const [zero, setZero] = useState<ZeroResultSearch[]>([]);
  const [topVendors, setTopVendors] = useState<TopViewed[]>([]);
  const [topFoods, setTopFoods] = useState<TopViewed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [t, s, z, tv, tf] = await Promise.all([
          getAdminTotals(),
          getTopSearches(30, 10),
          getZeroResultSearches(30, 10),
          getTopViewed("vendor", 30, 10),
          getTopViewed("food", 30, 10),
        ]);
        if (cancel) return;
        setTotals(t);
        setTop(s);
        setZero(z);
        setTopVendors(tv);
        setTopFoods(tf);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Users" value={totals?.users ?? 0} />
        <StatCard label="Vendors" value={totals?.vendors ?? 0} />
        <StatCard label="Searches" value={totals?.total_searches ?? 0} />
        <StatCard label="Zero-result" value={totals?.zero_result_searches ?? 0} highlight />
        <StatCard label="Views" value={totals?.total_views ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ListCard title="Top searches (30d)" rows={top.map((r) => ({ label: r.normalized_query, value: r.count }))} />
        <ListCard
          title="Zero-result searches (demand gaps)"
          rows={zero.map((r) => ({ label: r.normalized_query, value: r.count }))}
          emphasis
        />
        <ListCard title="Most-viewed vendors" rows={topVendors.map((r) => ({ label: r.name ?? r.entity_id, value: r.count }))} />
        <ListCard title="Most-viewed foods" rows={topFoods.map((r) => ({ label: r.name ?? r.entity_id, value: r.count }))} />
      </div>
    </div>
  );
}

function DemandTab() {
  const [points, setPoints] = useState<SearchGeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [zeroOnly, setZeroOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getSearchGeo(30, 2000);
        setPoints(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => (zeroOnly ? points.filter((p) => p.zero_result) : points), [points, zeroOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={zeroOnly} onChange={(e) => setZeroOnly(e.target.checked)} />
          Show only zero-result searches
        </label>
        <span className="text-sm text-[var(--color-text-muted)]">{visible.length} points</span>
      </div>

      <div className="h-[70vh] w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">Loading map…</div>
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
                  className={`h-2.5 w-2.5 rounded-full ${p.zero_result ? "bg-red-500" : "bg-orange-500"} opacity-70`}
                />
              </Marker>
            ))}
          </Map>
        )}
      </div>
    </div>
  );
}

function VendorsTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const onVerify = async (v: AdminVendor) => {
    try {
      await adminVerifyVendor(v.id);
      showToast("Vendor verified", "success");
      reload();
    } catch {
      showToast("Failed to verify", "error");
    }
  };

  const onFeature = async (v: AdminVendor) => {
    try {
      await adminToggleVendorFeature(v.id);
      showToast("Feature toggled", "success");
      reload();
    } catch {
      showToast("Failed", "error");
    }
  };

  const onPlan = async (v: AdminVendor, plan: string) => {
    try {
      await adminUpdateVendorPlan(v.id, plan);
      showToast(`Plan set to ${plan}`, "success");
      reload();
    } catch {
      showToast("Failed to set plan", "error");
    }
  };

  const onDelete = async (v: AdminVendor) => {
    if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteVendor(v.id);
      showToast("Vendor deleted", "success");
      reload();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reload()}
          placeholder="Search name or address…"
          className="flex-1 px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
        <button onClick={reload} className="px-4 py-2 rounded bg-[var(--color-primary)] text-white text-sm">
          Search
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Featured</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-[var(--color-text-muted)]">Loading…</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-[var(--color-text-muted)]">No vendors</td></tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{v.address}</div>
                  </td>
                  <td className="p-3 capitalize">{v.type.replace("_", " ")}</td>
                  <td className="p-3">
                    <select
                      value={v.plan}
                      onChange={(e) => onPlan(v, e.target.value)}
                      className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <option value="basic">basic</option>
                      <option value="featured">featured</option>
                      <option value="premium">premium</option>
                    </select>
                  </td>
                  <td className="p-3">{v.is_verified ? "✓" : "—"}</td>
                  <td className="p-3">{v.is_featured ? "✓" : "—"}</td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    {!v.is_verified && (
                      <button onClick={() => onVerify(v)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">
                        Verify
                      </button>
                    )}
                    <button onClick={() => onFeature(v)} className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs">
                      {v.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button onClick={() => onDelete(v)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const onRole = async (u: AdminUser, role: string) => {
    try {
      await adminUpdateUserRole(u.id, role);
      showToast(`Role set to ${role}`, "success");
      reload();
    } catch {
      showToast("Failed to set role", "error");
    }
  };

  const onActive = async (u: AdminUser) => {
    try {
      await adminSetUserActive(u.id, !u.is_active);
      showToast(u.is_active ? "User deactivated" : "User activated", "success");
      reload();
    } catch {
      showToast("Failed", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reload()}
          placeholder="Search email or name…"
          className="flex-1 px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
        <button onClick={reload} className="px-4 py-2 rounded bg-[var(--color-primary)] text-white text-sm">
          Search
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Active</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-[var(--color-text-muted)]">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-[var(--color-text-muted)]">No users</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.full_name}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => onRole(u, e.target.value)}
                      className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <option value="user">user</option>
                      <option value="vendor">vendor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-3">{u.is_active ? "✓" : "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => onActive(u)} className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs">
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
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-[var(--radius-md)] border ${highlight ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="display-font text-2xl mt-1">{value.toLocaleString()}</div>
    </div>
  );
}

function ListCard({ title, rows, emphasis }: { title: string; rows: { label: string; value: number }[]; emphasis?: boolean }) {
  return (
    <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <h3 className="font-semibold mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No data yet</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className={emphasis ? "text-red-600 dark:text-red-400" : ""}>{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
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
