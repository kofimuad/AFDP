"use client";
// This file must be a client component because it uses useRouter, useEffect, useState, and Zustand.
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart2, Eye, LayoutDashboard, MousePointer, Search, Settings, Shield, Store } from "lucide-react";
import { addVendorDish, addVendorGrocery, removeVendorItem, updateVendor, updateVendorItem, uploadVendorImage, getMyVendor } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { useToast } from '@/lib/store/toastStore';
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
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const user = useAuthStore((state) => state.user);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [addDishVendorId, setAddDishVendorId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({ name: "", description: "", image_file: null as File | null, image_preview: "", ingredients: "", price: "" });
  const [savingDish, setSavingDish] = useState(false);
  const [dishError, setDishError] = useState<string | null>(null);
  const [vendorImageFile, setVendorImageFile] = useState<File | null>(null);
  const [vendorImagePreview, setVendorImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    website: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingItem, setEditingItem] = useState<{ vendorId: string; item: VendorItem } | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchMyVendor() {
      setLoading(true)
      try {
        if (user?.vendor_id) {
          const vendor = await getMyVendor()
          setVendors([vendor])
          setSettingsForm({
            name: vendor.name || "",
            type: vendor.type || "",
            address: vendor.address || "",
            phone: vendor.phone || "",
            website: vendor.website || "",
          })
        } else {
          setVendors([])
        }
      } catch (err: any) {
        // 404 means no listing yet — show empty state
        if (err?.response?.status === 404) {
          setVendors([])
        } else {
          console.error('Failed to fetch vendor listing', err)
          setVendors([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchMyVendor()
  }, [user?.vendor_id])

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
                    {vendors.map((vendor) => {
                      const isGrocery = vendor.type === "grocery_store";
                      const itemsLabel = isGrocery ? "Items" : "Dishes";
                      const itemSingular = isGrocery ? "item" : "dish";
                      const visibleItems = (vendor.vendor_items || []).filter((item: VendorItem) =>
                        isGrocery ? item.item_type === "ingredient" : item.item_type === "food"
                      );
                      return (
                      <li key={vendor.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-16 w-16 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                            {vendor.image_url ? (
                              <img src={vendor.image_url} alt={vendor.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--color-text-muted)]">{vendor.name[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-lg text-[var(--color-text-primary)]">{vendor.name}</div>
                            <div className="text-sm text-[var(--color-text-muted)]">{vendor.address}</div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-1">{isGrocery ? "Grocery Store" : "Restaurant"}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-md text-[var(--color-text-primary)]">{itemsLabel}</h3>
                          <Button
                            onClick={() => {
                              setAddDishVendorId(vendor.id);
                              setShowAddDish(true);
                            }}
                          >
                            {isGrocery ? "Add Item" : "Add Dish"}
                          </Button>
                        </div>
                                    <Modal open={showAddDish} onClose={() => setShowAddDish(false)} title={isGrocery ? "Add Item" : "Add Dish"}>
                                      <form
                                        className="space-y-4"
                                        onSubmit={async e => {
                                          e.preventDefault();
                                          if (!addDishVendorId || savingDish) return;
                                          setSavingDish(true);
                                          setDishError(null);
                                          try {
                                            const priceNum = dishForm.price ? parseFloat(dishForm.price) : undefined;
                                            const priceArg = Number.isFinite(priceNum as number) ? priceNum : undefined;
                                            const item = isGrocery
                                              ? await addVendorGrocery(addDishVendorId, {
                                                  name: dishForm.name.trim(),
                                                  price: priceArg,
                                                  available: true,
                                                  file: dishForm.image_file,
                                                })
                                              : await addVendorDish(addDishVendorId, {
                                                  name: dishForm.name.trim(),
                                                  description: dishForm.description.trim() || undefined,
                                                  price: priceArg,
                                                  available: true,
                                                  file: dishForm.image_file,
                                                });
                                            setVendors(vendors => vendors.map(v => v.id === addDishVendorId ? {
                                              ...v,
                                              vendor_items: [...v.vendor_items, item as VendorItem],
                                            } : v));
                                            setShowAddDish(false);
                                            setDishForm({ name: "", description: "", image_file: null, image_preview: "", ingredients: "", price: "" });
                                          } catch (err: any) {
                                            setDishError(err?.response?.data?.detail || `Failed to add ${itemSingular}`);
                                          } finally {
                                            setSavingDish(false);
                                          }
                                        }}
                                      >
                                        <Input
                                          placeholder={isGrocery ? "Item Name" : "Dish Name"}
                                          value={dishForm.name}
                                          onChange={e => setDishForm(f => ({ ...f, name: e.target.value }))}
                                          required
                                        />
                                        {!isGrocery && (
                                          <Input
                                            placeholder="Description"
                                            value={dishForm.description}
                                            onChange={e => setDishForm(f => ({ ...f, description: e.target.value }))}
                                          />
                                        )}
                                        <div>
                                          <label className="block text-sm font-medium mb-1">{isGrocery ? "Item Image" : "Dish Image"}</label>
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
                                          placeholder="Price (optional)"
                                          type="number"
                                          step="0.01"
                                          value={dishForm.price}
                                          onChange={e => setDishForm(f => ({ ...f, price: e.target.value }))}
                                        />
                                        {!isGrocery && (
                                          <Input
                                            placeholder="Ingredients (comma separated)"
                                            value={dishForm.ingredients}
                                            onChange={e => setDishForm(f => ({ ...f, ingredients: e.target.value }))}
                                          />
                                        )}
                                        {dishError && <p className="text-sm text-red-500">{dishError}</p>}
                                        <div className="flex justify-end">
                                          <Button type="submit" disabled={savingDish}>{savingDish ? "Saving…" : isGrocery ? "Add Item" : "Add Dish"}</Button>
                                        </div>
                                      </form>
                                    </Modal>
                        {visibleItems.length > 0 ? (
                          <ul className="space-y-2">
                            {visibleItems.map((item: VendorItem) => {
                              const catalog = isGrocery ? item.ingredient : item.food;
                              return (
                              <li key={item.id} className="flex items-center justify-between border-b border-dashed border-[var(--color-border)] py-2">
                                <div className="flex items-center gap-3">
                                  {catalog?.image_url ? (
                                    <img src={catalog.image_url} alt={catalog.name} className="h-10 w-10 rounded object-cover" />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-[var(--color-surface-hover)] flex items-center justify-center text-lg font-bold text-[var(--color-text-muted)]">
                                      {catalog?.name?.[0]}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-[var(--color-text-primary)]">{catalog?.name}</div>
                                    {!isGrocery && (
                                      <div className="text-xs text-[var(--color-text-muted)]">{item.food?.description}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600"
                                    onClick={() => {
                                      setEditingItem({ vendorId: vendor.id, item });
                                      setEditForm({
                                        name: catalog?.name || "",
                                        description: item.food?.description || "",
                                        price: item.price != null ? String(item.price) : "",
                                      });
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={removingItemId === item.id}
                                    className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                                    onClick={async () => {
                                      if (removingItemId) return;
                                      const ok = window.confirm(`Remove "${catalog?.name ?? `this ${itemSingular}`}" from your ${isGrocery ? "inventory" : "menu"}?`);
                                      if (!ok) return;
                                      setRemovingItemId(item.id);
                                      try {
                                        await removeVendorItem(vendor.id, item.id);
                                        setVendors((prev) =>
                                          prev.map((v) =>
                                            v.id === vendor.id
                                              ? { ...v, vendor_items: v.vendor_items.filter((i) => i.id !== item.id) }
                                              : v
                                          )
                                        );
                                        showToast(`${isGrocery ? "Item" : "Dish"} removed`, "success");
                                      } catch (err: any) {
                                        showToast(err?.response?.data?.detail || `Failed to remove ${itemSingular}`, "error");
                                      } finally {
                                        setRemovingItemId(null);
                                      }
                                    }}
                                  >
                                    {removingItemId === item.id ? "Removing..." : "Remove"}
                                  </button>
                                </div>
                              </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="text-xs text-[var(--color-text-muted)]">No {itemsLabel.toLowerCase()} yet.</div>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            <Modal
              open={editingItem !== null}
              onClose={() => setEditingItem(null)}
              title={editingItem?.item.item_type === "ingredient" ? "Edit Item" : "Edit Dish"}
            >
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editingItem || savingEdit) return;
                  setSavingEdit(true);
                  const isIngredient = editingItem.item.item_type === "ingredient";
                  try {
                    const priceNum = editForm.price.trim() ? parseFloat(editForm.price) : null;
                    if (editForm.price.trim() && !Number.isFinite(priceNum as number)) {
                      showToast("Price must be a number", "error");
                      setSavingEdit(false);
                      return;
                    }
                    const updated = await updateVendorItem(editingItem.vendorId, editingItem.item.id, {
                      name: editForm.name.trim(),
                      ...(isIngredient ? {} : { description: editForm.description.trim() || null }),
                      price: priceNum,
                    });
                    setVendors((prev) =>
                      prev.map((v) =>
                        v.id === editingItem.vendorId
                          ? {
                              ...v,
                              vendor_items: v.vendor_items.map((i) => (i.id === updated.id ? updated : i)),
                            }
                          : v
                      )
                    );
                    showToast(`${isIngredient ? "Item" : "Dish"} updated`, "success");
                    setEditingItem(null);
                  } catch (err: any) {
                    showToast(err?.response?.data?.detail || `Failed to update ${isIngredient ? "item" : "dish"}`, "error");
                  } finally {
                    setSavingEdit(false);
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">{editingItem?.item.item_type === "ingredient" ? "Item Name" : "Dish Name"}</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                {editingItem?.item.item_type !== "ingredient" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" onClick={() => setEditingItem(null)} disabled={savingEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Modal>

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
                  <form
                    className="mt-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (savingSettings) return;
                      setSavingSettings(true);
                      try {
                        const updated = await updateVendor(vendors[0].id, {
                          name: settingsForm.name.trim(),
                          address: settingsForm.address.trim(),
                          phone: settingsForm.phone.trim() || null,
                          website: settingsForm.website.trim() || null,
                        });
                        setVendors((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
                        showToast("Changes saved", "success");
                      } catch (err: any) {
                        const msg = err?.response?.data?.detail || "Failed to save changes";
                        showToast(msg, "error");
                      } finally {
                        setSavingSettings(false);
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Name</label>
                      <Input
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Business Type</label>
                      <Input
                        value={settingsForm.type === "grocery_store" ? "Grocery Store" : settingsForm.type === "restaurant" ? "Restaurant" : ""}
                        readOnly
                        disabled
                        className="cursor-not-allowed bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <Input
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <Input
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Website</label>
                      <Input
                        value={settingsForm.website}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, website: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-primary)]">Listing Image</label>
                      <div className="flex items-center gap-3">
                        {(vendorImagePreview || vendors[0].image_url) && (
                          <img
                            src={vendorImagePreview || vendors[0].image_url || ""}
                            alt="Listing"
                            className="h-16 w-16 rounded object-cover"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setVendorImageFile(f);
                            setVendorImagePreview(f ? URL.createObjectURL(f) : "");
                            setImageUploadError(null);
                          }}
                          className="text-sm text-[var(--color-text-primary)]"
                        />
                      </div>
                      {vendorImageFile && (
                        <Button
                          type="button"
                          className="mt-2"
                          disabled={uploadingImage}
                          onClick={async () => {
                            if (!vendorImageFile) return;
                            setUploadingImage(true);
                            setImageUploadError(null);
                            try {
                              const updated = await uploadVendorImage(vendors[0].id, vendorImageFile);
                              setVendors((prev) =>
                                prev.map((v) => (v.id === updated.id ? { ...v, image_url: updated.image_url } : v))
                              );
                              setVendorImageFile(null);
                              setVendorImagePreview("");
                            } catch (err: any) {
                              setImageUploadError(err.response?.data?.detail || "Upload failed");
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                        >
                          {uploadingImage ? "Uploading..." : "Upload image"}
                        </Button>
                      )}
                      {imageUploadError && (
                        <p className="mt-2 text-xs text-red-500">{imageUploadError}</p>
                      )}
                    </div>
                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Owner Name</label>
                      <Input
                        value={user?.full_name || ""}
                        readOnly
                        disabled
                        className="cursor-not-allowed bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Contact Email</label>
                      <Input
                        value={user?.email || ""}
                        readOnly
                        disabled
                        className="cursor-not-allowed bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingSettings}>
                        {savingSettings ? "Saving..." : "Save Changes"}
                      </Button>
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