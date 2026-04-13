export type VendorType = "restaurant" | "grocery_store";

export interface FoodSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
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
  quantity_note: string | null;
}

export interface FoodDetail extends FoodSummary {
  ingredients: FoodIngredient[];
  restaurants: VendorSummary[];
  stores: VendorSummary[];
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
  preparation_guide: string | null;
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