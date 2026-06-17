export type VendorType = "restaurant" | "grocery_store";

export interface FoodSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  region: string | null;
  cuisines: string[];
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  created_at: string | null;
}

export interface IngredientSummary {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface VendorSummary {
  id: string;
  name: string;
  slug: string;
  type: VendorType;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  is_verified: boolean;
  is_featured: boolean;
  /** true = delivers, false = no delivery, null = unknown (not verified). */
  delivery_available: boolean | null;
  created_at: string | null;
  distance_km: number | null;
}

export interface VendorItem {
  id: string;
  vendor_id: string;
  food_id: string | null;
  ingredient_id: string | null;
  food: FoodSummary | null;
  ingredient: IngredientSummary | null;
  price: number | null;
  available: boolean;
  item_type: "food" | "ingredient";
}

export interface Vendor extends VendorSummary {
  vendor_items: VendorItem[];
}

export interface FoodIngredient {
  ingredient: IngredientSummary;
  quantity: number | null;
  unit: string | null;
  quantity_note: string | null;
}

export type RecipeSourceType = "youtube" | "article";

export interface RecipeLink {
  id: string;
  url: string;
  source_type: RecipeSourceType;
  title: string;
  thumbnail_url: string | null;
  is_primary: boolean;
  last_checked: string | null;
}

export interface FoodDetail extends FoodSummary {
  ingredients: FoodIngredient[];
  restaurants: VendorSummary[];
  stores: VendorSummary[];
  recipe_links: RecipeLink[];
}

export interface IngredientStores {
  ingredient: IngredientSummary;
  quantity_note: string | null;
  available_nearby: boolean;
  stores: VendorSummary[];
  fallback_stores: VendorSummary[];
}

export interface ShoppingListItem {
  id: string;
  ingredient: IngredientSummary;
  quantity_note: string | null;
  checked: boolean;
  source_food_name: string | null;
  source_food_slug: string | null;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  total: number;
  checked_count: number;
}

export interface AddRecipeResult {
  food_slug: string;
  food_name: string;
  added: number;
  total: number;
}

export interface StoreCoverage {
  store: VendorSummary;
  items_covered: number;
  total_items: number;
  covered_ingredient_ids: string[];
}

export interface IngredientDetail extends IngredientSummary {
  stores: VendorSummary[];
}

export interface SearchIngredientBundle {
  ingredient: IngredientSummary;
  stores: VendorSummary[];
}

export interface SearchResponse {
  food_match: FoodSummary | null;
  restaurants: VendorSummary[];
  ingredients: SearchIngredientBundle[];
  primary_recipe: RecipeLink | null;
}

export interface VendorsQueryParams {
  type?: VendorType;
  lat?: number;
  lng?: number;
  radius_km?: number;
  is_featured?: boolean;
  is_verified?: boolean;
  page?: number;
  page_size?: number;
}

export interface VendorAnalytics {
  totals: {
    views: number;
    search_appearances: number;
    dish_views: number;
    saves: number;
  };
  views_this_week: { label: string; count: number }[];
}

export interface SearchParams {
  q: string;
  lat: number;
  lng: number;
  radius_km?: number;
}

export interface RegisterVendorPayload {
  name: string;
  type: VendorType;
  address: string;
  lat: number;
  lng: number;
  phone?: string | null;
  website?: string | null;
  image_url?: string | null;
}