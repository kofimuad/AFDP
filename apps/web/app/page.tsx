import { DishScrollRow } from "@/components/home/DishScrollRow";
import { FeaturedVendors } from "@/components/home/FeaturedVendors";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RegionGrid } from "@/components/home/RegionGrid";
import { StatsBar } from "@/components/home/StatsBar";
import { VendorCtaBanner } from "@/components/home/VendorCtaBanner";
import { getFoods, getVendors } from "@/lib/api";

// Render on each request so the homepage reflects live catalog data (dish images,
// featured vendors) instead of a stale snapshot baked at build time.
export const dynamic = "force-dynamic";

const STATS = [
  { value: "2,400+", label: "African dishes listed" },
  { value: "380+", label: "Verified vendors" },
  { value: "48", label: "Cities covered" },
  { value: "54", label: "Cuisines from all Africa" }
];

export default async function HomePage() {
  const [foods, featuredVendors] = await Promise.all([
    getFoods({ hasVendors: true }).catch(() => []),
    getVendors({ is_featured: true, page_size: 6 }).catch(() => [])
  ]);

  return (
    <>
      <HomeHero />
      <StatsBar stats={STATS} />
      <DishScrollRow foods={foods} />
      <RegionGrid />
      <HowItWorks />
      <VendorCtaBanner />
      <FeaturedVendors initialVendors={featuredVendors} />
    </>
  );
}
