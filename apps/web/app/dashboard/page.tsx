"use client";
// This file must be a client component because it uses useRouter, useEffect, useState, and Zustand.
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart2, Eye, LayoutDashboard, MousePointer, Search, Settings, Shield, Store } from "lucide-react";
import { getVendors } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Listings", icon: Store, href: "/dashboard?tab=listings" },
  { label: "Analytics", icon: BarChart2, href: "/dashboard?tab=analytics" },
  { label: "Settings", icon: Settings, href: "/dashboard?tab=settings" }
] as const;

const STATS = [
  { label: "Total Views", value: "0", icon: Eye },
  { label: "Profile Clicks", value: "0", icon: MousePointer },
  { label: "Searches Appeared In", value: "0", icon: Search },
  { label: "Verified Status", value: "Pending", icon: Shield }
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      try {
        // Only fetch vendors for this user
        if (user?.vendor_id) {
          const all = await getVendors();
          setVendors(all.filter((v) => v.id === user.vendor_id));
        } else {
          setVendors([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [user?.vendor_id]);

  return (
    <ProtectedRoute requireRole="vendor">
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-[var(--radius-xl)] bg-[var(--color-dark)] p-4 text-white">
            <nav className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 text-left text-sm ${
                    router && window.location.pathname + window.location.search === item.href
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
              {loading ? (
                <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
              ) : vendors.length === 0 ? (
                <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-16 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">No listings yet.</p>
                  <Link
                    href="/vendors/register"
                    className="mt-4 inline-flex rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)]"
                  >
                    Add Your First Business
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {vendors.map((vendor) => (
                    <li key={vendor.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                          {vendor.image_url ? (
                            <img src={vendor.image_url} alt={vendor.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">{vendor.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{vendor.name}</div>
                          <div className="text-sm text-gray-500">{vendor.address}</div>
                          <div className="text-xs text-gray-400 mt-1">{vendor.type}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Recent Activity</h2>
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">No activity yet</p>
            </section>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}