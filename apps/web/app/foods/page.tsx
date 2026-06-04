import { FoodsExplorer } from "@/components/foods/FoodsExplorer";
import { getFoods } from "@/lib/api";

export const metadata = {
  title: "Explore African Dishes | AFDP",
  description:
    "Browse the full directory of African cuisine — search and filter dishes by region, then find them near you."
};

// Canonical region names (must match regions.name in the backend)
const REGIONS = [
  "West African",
  "East African",
  "North African",
  "Southern African",
  "Central African",
  "Afro-Caribbean"
];

interface FoodsPageProps {
  searchParams: { region?: string };
}

export default async function FoodsPage({ searchParams }: FoodsPageProps) {
  const requested = searchParams.region?.trim();
  const activeRegion =
    requested && REGIONS.find((r) => r.toLowerCase() === requested.toLowerCase());

  const foods = await getFoods(
    activeRegion ? { region: activeRegion } : undefined
  ).catch(() => []);

  return (
    <FoodsExplorer
      foods={foods}
      regions={REGIONS}
      activeRegion={activeRegion ?? null}
    />
  );
}
