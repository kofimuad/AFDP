"use client";

import { Bookmark, Heart, ListPlus, Loader2, MapPin, Store, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { addSavedRecipesToShoppingList } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useSavedStore, type SavedFood, type SavedVendor } from "@/lib/store/savedStore";
import { useToast } from "@/lib/store/toastStore";

type TabId = "foods" | "places";

export default function SavedPage() {
  const foods = useSavedStore((s) => s.foods);
  const vendors = useSavedStore((s) => s.vendors);
  const hasHydrated = useSavedStore((s) => s._hasHydrated);
  const removeFood = useSavedStore((s) => s.removeFood);
  const removeVendor = useSavedStore((s) => s.removeVendor);
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("foods");
  const [addingToList, setAddingToList] = useState(false);

  async function addAllToShoppingList() {
    if (!useAuthStore.getState().isAuthenticated()) {
      showToast("Sign in to build a shopping list from your saved recipes.", "info");
      router.push("/auth");
      return;
    }
    setAddingToList(true);
    try {
      const res = await addSavedRecipesToShoppingList();
      showToast(
        res.added > 0
          ? `Added ${res.added} ingredient${res.added === 1 ? "" : "s"} from ${res.recipes} recipe${res.recipes === 1 ? "" : "s"}`
          : "Everything's already on your shopping list",
        "success"
      );
      router.push("/shopping-list");
    } catch {
      showToast("Couldn't build your shopping list. Please try again.", "error");
    } finally {
      setAddingToList(false);
    }
  }

  const tabs = [
    { id: "foods", label: <TabLabel text="Foods" count={hasHydrated ? foods.length : 0} active={activeTab === "foods"} /> },
    { id: "places", label: <TabLabel text="Places" count={hasHydrated ? vendors.length : 0} active={activeTab === "places"} /> }
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Saved
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your favourite dishes and places, all in one spot.
        </p>
      </header>

      <div className="mb-6 max-w-xs">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
          variant="segment"
        />
      </div>

      {!hasHydrated ? (
        <SkeletonGrid />
      ) : (
        <>
          <TabPanel tabId="foods" activeTab={activeTab}>
            {foods.length === 0 ? (
              <EmptyState
                icon={<Utensils size={26} />}
                title="No saved dishes yet"
                subtitle="Tap the bookmark on any dish to save it here for later."
                ctaHref="/foods"
                ctaLabel="Explore dishes"
              />
            ) : (
              <>
                {/* SCRUM-36: feed saved recipes into the multi-recipe shopping list */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-grocery-light)] bg-[var(--color-grocery-light)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--color-grocery)]">
                    Turn your saved recipes into one shopping list.
                  </p>
                  <button
                    type="button"
                    onClick={addAllToShoppingList}
                    disabled={addingToList}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-grocery)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-70"
                  >
                    {addingToList ? <Loader2 size={16} className="animate-spin" /> : <ListPlus size={16} />}
                    Add all to shopping list
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
                  {foods.map((food) => (
                    <FoodCard
                      key={food.slug}
                      food={food}
                      onRemove={() => {
                        removeFood(food.slug);
                        showToast("Removed from saved", "info");
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </TabPanel>

          <TabPanel tabId="places" activeTab={activeTab}>
            {vendors.length === 0 ? (
              <EmptyState
                icon={<MapPin size={26} />}
                title="No saved places yet"
                subtitle="Find restaurants and stores you love, then tap Save to come back later."
                ctaHref="/search"
                ctaLabel="Find places"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                {vendors.map((vendor) => (
                  <PlaceCard
                    key={vendor.slug}
                    vendor={vendor}
                    onRemove={() => {
                      removeVendor(vendor.slug);
                      showToast("Removed from saved", "info");
                    }}
                  />
                ))}
              </div>
            )}
          </TabPanel>
        </>
      )}
    </main>
  );
}

// ── Tab label with count chip ────────────────────────────────

function TabLabel({ text, count, active }: { text: string; count: number; active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {text}
      <span
        className={
          active
            ? "rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]"
            : "rounded-full bg-[var(--color-border)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-text-muted)]"
        }
      >
        {count}
      </span>
    </span>
  );
}

// ── Heart remove button ──────────────────────────────────────

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:scale-110"
    >
      <Heart size={16} fill="currentColor" />
    </button>
  );
}

// ── Food card ────────────────────────────────────────────────

function FoodCard({ food, onRemove }: { food: SavedFood; onRemove: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <div className="absolute right-2.5 top-2.5 z-10">
        <RemoveButton onClick={onRemove} label={`Remove ${food.name} from saved`} />
      </div>
      <Link href={`/foods/${food.slug}`} aria-label={food.name} className="block">
        {food.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.image_url}
            alt={food.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="food-gradient-dish aspect-square w-full" />
        )}
        <div className="p-3">
          <p className="font-semibold text-[var(--color-text-primary)]">{food.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {food.description ?? "Traditional African flavors."}
          </p>
        </div>
      </Link>
    </div>
  );
}

// ── Place card ───────────────────────────────────────────────

function PlaceCard({ vendor, onRemove }: { vendor: SavedVendor; onRemove: () => void }) {
  return (
    <div className="group relative flex gap-3 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
      <Link href={`/vendors/${vendor.slug}`} className="shrink-0">
        {vendor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.image_url}
            alt={vendor.name}
            loading="lazy"
            className="h-24 w-24 rounded-[var(--radius-md)] object-cover"
          />
        ) : (
          <div className="food-gradient-vendor h-24 w-24 rounded-[var(--radius-md)]" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/vendors/${vendor.slug}`} className="block">
          <p className="truncate font-bold text-[var(--color-text-primary)]">{vendor.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)]">
            <MapPin size={12} className="shrink-0" />
            {vendor.address}
          </p>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={vendor.type === "grocery_store" ? "grocery" : "restaurant"}>
            <Store size={11} className="mr-1" />
            {vendor.type === "grocery_store" ? "Grocery" : "Restaurant"}
          </Badge>
        </div>
      </div>
      <div className="absolute right-3 top-3">
        <RemoveButton onClick={onRemove} label={`Remove ${vendor.name} from saved`} />
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
  ctaHref,
  ctaLabel
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ctaHref: "/foods" | "/search";
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
        {icon ?? <Bookmark size={26} />}
      </span>
      <div>
        <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
      <Link
        href={ctaHref}
        className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]"
        />
      ))}
    </div>
  );
}
