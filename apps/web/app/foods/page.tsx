import { FoodsExplorer } from "@/components/foods/FoodsExplorer";
import { getFoods } from "@/lib/api";

export const metadata = {
  title: "Cook It Yourself — African Recipes | AFDP",
  description:
    "Browse African dishes to cook at home — search by name and filter by cuisine and region, then find the ingredients near you."
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

// Canonical cuisine names (must match cuisines.name in the backend / catalog.py CUISINES)
const CUISINES = [
  "Nigerian",
  "Ghanaian",
  "Senegalese",
  "Ivorian",
  "Cameroonian",
  "Ethiopian",
  "Eritrean",
  "Somali",
  "Kenyan",
  "Ugandan",
  "Moroccan",
  "Tunisian",
  "Algerian",
  "South African",
  "Congolese"
];

interface FoodsPageProps {
  searchParams: { region?: string; cuisine?: string };
}

export default async function FoodsPage({ searchParams }: FoodsPageProps) {
  const requestedRegion = searchParams.region?.trim();
  const activeRegion =
    requestedRegion && REGIONS.find((r) => r.toLowerCase() === requestedRegion.toLowerCase());

  const requestedCuisine = searchParams.cuisine?.trim();
  const activeCuisine =
    requestedCuisine && CUISINES.find((c) => c.toLowerCase() === requestedCuisine.toLowerCase());

  const foods = await getFoods({
    region: activeRegion || undefined,
    cuisine: activeCuisine || undefined
  }).catch(() => []);

  return (
    <FoodsExplorer
      foods={foods}
      regions={REGIONS}
      cuisines={CUISINES}
      activeRegion={activeRegion ?? null}
      activeCuisine={activeCuisine ?? null}
    />
  );
}
