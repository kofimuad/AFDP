"use client";
// This file must be a client component because it uses useRouter, useEffect, useState, and Zustand.
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart2, Eye, LayoutDashboard, MousePointer, Search, Settings, Shield, Store } from "lucide-react";
import { getVendors } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import type { Vendor, VendorItem } from '@/types';

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
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const user = useAuthStore((state) => state.user);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [addDishVendorId, setAddDishVendorId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({ name: "", description: "", image_file: null as File | null, image_preview: "", ingredients: "" });

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      try {
        if (user?.id) {
          const all = await getVendors();
          // Show all vendors where the user is the owner (assuming user.id matches vendor.owner_id or similar)
          // If backend does not support owner_id, fallback to vendor_id array or similar logic
          setVendors(all.filter((v) => v.id === user.vendor_id));
        } else {
          setVendors([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [user?.id, user?.vendor_id]);

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
                    tab === item.href.split('tab=')[1]?.toLowerCase() || (item.href === "/dashboard" && tab === "dashboard")
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
            {tab === "dashboard" && (
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
            )}

            {tab === "listings" && (
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
                  <ul className="mt-4 space-y-8">
                    {vendors.map((vendor) => (
                      <li key={vendor.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow">
                        <div className="flex items-center gap-4 mb-4">
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
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-md">Dishes</h3>
                          <Button
                            onClick={() => {
                              setAddDishVendorId(vendor.id);
                              setShowAddDish(true);
                            }}
                          >
                            Add Dish
                          </Button>
                        </div>
                                    <Modal open={showAddDish} onClose={() => setShowAddDish(false)} title="Add Dish">
                                      <form
                                        className="space-y-4"
                                        onSubmit={e => {
                                          e.preventDefault();
                                          if (!addDishVendorId) return;
                                          setVendors(vendors => vendors.map(v => v.id === addDishVendorId ? {
                                            ...v,
                                            vendor_items: [
                                              ...v.vendor_items,
                                              {
                                                id: Math.random().toString(36).slice(2),
                                                vendor_id: v.id,
                                                food_id: null,
                                                ingredient_id: null,
                                                food: {
                                                  id: Math.random().toString(36).slice(2),
                                                  name: dishForm.name,
                                                  slug: dishForm.name.toLowerCase().replace(/\s+/g, '-'),
                                                  description: dishForm.description,
                                                  image_url: dishForm.image_preview,
                                                  created_at: new Date().toISOString(),
                                                },
                                                ingredient: null,
                                                price: null,
                                                available: true,
                                                item_type: "food"
                                              }
                                            ]
                                          } : v));
                                          setShowAddDish(false);
                                          setDishForm({ name: "", description: "", image_file: null, image_preview: "", ingredients: "" });
                                        }}
                                      >
                                        <Input
                                          placeholder="Dish Name"
                                          value={dishForm.name}
                                          onChange={e => setDishForm(f => ({ ...f, name: e.target.value }))}
                                          required
                                        />
                                        <Input
                                          placeholder="Description"
                                          value={dishForm.description}
                                          onChange={e => setDishForm(f => ({ ...f, description: e.target.value }))}
                                        />
                                        <div>
                                          <label className="block text-sm font-medium mb-1">Dish Image</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={e => {
                                              const file = e.target.files?.[0] || null;
                                              if (file) {
                                                setDishForm(f => ({
                                                  ...f,
                                                  image_file: file,
                                                  image_preview: URL.createObjectURL(file)
                                                }));
                                              } else {
                                                setDishForm(f => ({ ...f, image_file: null, image_preview: "" }));
                                              }
                                            }}
                                          />
                                          {dishForm.image_preview && (
                                            <img src={dishForm.image_preview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded" />
                                          )}
                                        </div>
                                        <Input
                                          placeholder="Ingredients (comma separated)"
                                          value={dishForm.ingredients}
                                          onChange={e => setDishForm(f => ({ ...f, ingredients: e.target.value }))}
                                        />
                                        <div className="flex justify-end">
                                          <Button type="submit">Add Dish</Button>
                                        </div>
                                      </form>
                                    </Modal>
                        {vendor.vendor_items && vendor.vendor_items.length > 0 ? (
                          <ul className="space-y-2">
                            {vendor.vendor_items.filter((item: VendorItem) => item.item_type === "food").map((item: VendorItem) => (
                              <li key={item.id} className="flex items-center justify-between border-b border-dashed border-gray-200 py-2">
                                <div className="flex items-center gap-3">
                                  {item.food?.image_url ? (
                                    <img src={item.food.image_url} alt={item.food.name} className="h-10 w-10 rounded object-cover" />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                                      {item.food?.name?.[0]}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{item.food?.name}</div>
                                    <div className="text-xs text-gray-500">{item.food?.description}</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600"
                                    onClick={() => alert('Edit Dish (not yet implemented)')}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                    onClick={() => alert('Remove Dish (not yet implemented)')}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-gray-400">No dishes yet.</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === "analytics" && (
              <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
                <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Analytics</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Dish Views</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">See how many times your dishes have been viewed by users. (Analytics integration needed)</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Searches Appeared In</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">Track how often your listings appear in user searches. (Analytics integration needed)</p>
                  </div>
                </div>
              </section>
            )}

            {tab === "settings" && (
              <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] max-w-xl">
                <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Business & Profile Settings</h2>
                {vendors.length > 0 ? (
                  <form className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Name</label>
                      <Input defaultValue={vendors[0].name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Type</label>
                      <Input defaultValue={vendors[0].type} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <Input defaultValue={vendors[0].address} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <Input defaultValue={vendors[0].phone || ""} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Website</label>
                      <Input defaultValue={vendors[0].website || ""} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Profile Image URL</label>
                      <Input defaultValue={vendors[0].image_url || ""} />
                    </div>
                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium mb-1">Owner Name</label>
                      <Input defaultValue={user?.full_name || ""} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Email</label>
                      <Input defaultValue={user?.email || ""} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-sm text-[var(--color-text-muted)]">No business profile found.</div>
                )}
              </section>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}