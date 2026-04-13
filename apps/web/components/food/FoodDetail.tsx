import { ResultCard } from "@/components/search/ResultCard";
import type { FoodDetail as FoodDetailType, VendorSummary } from "@/types";

interface FoodDetailProps {
  food: FoodDetailType;
  onVendorSelect?: (vendor: VendorSummary) => void;
  activeVendorId?: string | null;
}

export function FoodDetail({ food, onVendorSelect, activeVendorId }: FoodDetailProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="display-font text-4xl text-[var(--color-text-primary)]">{food.name}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{food.description ?? "Traditional dish details and nearby availability."}</p>
      </header>

      <section className="space-y-2">
        <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Ingredients</h2>
        <div className="flex flex-wrap gap-2">
          {food.ingredients.map((item) => (
            <span
              key={item.ingredient.id}
              className="rounded-[var(--radius-full)] bg-[var(--color-surface-hover)] px-3 py-1 text-sm text-[var(--color-text-primary)]"
            >
              {item.ingredient.name}
              {item.quantity_note ? ` • ${item.quantity_note}` : ""}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Restaurants</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {food.restaurants.map((vendor) => (
            <ResultCard
              key={vendor.id}
              vendor={vendor}
              active={activeVendorId === vendor.id}
              onClick={() => onVendorSelect?.(vendor)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display-font text-2xl text-[var(--color-text-primary)]">Ingredient Stores</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {food.stores.map((vendor) => (
            <ResultCard key={vendor.id} vendor={vendor} active={activeVendorId === vendor.id} onClick={() => onVendorSelect?.(vendor)} />
          ))}
        </div>
      </section>
    </section>
  );
}

// FLUTTER NOTE:
// This component maps to: Food detail screen with chip row + card grids
// Design tokens used: --color-text-primary, --color-text-muted, --radius-full, --color-surface-hover
// State management equivalent: BLoC food-detail-loaded + vendor-selected state
// API call: getFood