// --- VENDOR: Get my vendor (authenticated) ---
export const getMyVendor = async (): Promise<Vendor> => {
  const { data } = await api.get<Vendor>("/vendors/me");
  return data;
};

// --- VENDOR: Analytics scoped to the authenticated vendor ---
export const getMyVendorAnalytics = async (): Promise<import("@/types").VendorAnalytics> => {
  const { data } = await api.get<import("@/types").VendorAnalytics>("/vendors/me/analytics");
  return data;
};
import axios from "axios";

import type {
  FoodDetail,
  FoodSummary,
  IngredientDetail,
  RegisterVendorPayload,
  SearchParams,
  SearchResponse,
  Vendor,
  VendorsQueryParams,
  VendorSummary
} from "@/types";


const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";


export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

// --- AUTH INTERCEPTORS ---
import { useAuthStore } from './store/authStore'

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth endpoints handle their own 401s (e.g. wrong password) — the global
// interceptor must not hijack those into a redirect, or a failed login just
// bounces back to /auth instead of showing the error.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/vendor-register', '/auth/refresh']

// Response interceptor — handle 401 with refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const url: string = original?.url || ''
    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => url.includes(p))
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const refreshToken = localStorage.getItem('afdp-refresh-token')
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          const newToken = res.data.access_token
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            newToken,
            refreshToken
          )
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          useAuthStore.getState().clearAuth()
          window.location.href = '/auth'
        }
      } else {
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// --- AUTH API FUNCTIONS ---

export interface UserRegisterData {
  email: string
  full_name: string
  password: string
}

export interface VendorRegisterData extends UserRegisterData {
  business_name: string
  business_type: 'restaurant' | 'grocery_store'
  address: string
  lat: number
  lng: number
  phone?: string
  website?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: string
    email: string
    full_name: string
    role: 'user' | 'vendor' | 'admin'
    vendor_id: string | null
  }
}

export const registerUser = async (
  data: UserRegisterData
): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', data)
  return res.data
}

export const registerVendorWithAuth = async (
  data: VendorRegisterData
): Promise<AuthResponse> => {
  const res = await api.post('/auth/vendor-register', data)
  return res.data
}

export const loginUser = async (
  data: LoginData
): Promise<AuthResponse> => {
  const res = await api.post('/auth/login', data)
  return res.data
}

export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ access_token: string }> => {
  const res = await api.post('/auth/refresh', {
    refresh_token: refreshToken
  })
  return res.data
}

export interface MeResponse {
  id: string
  email: string
  full_name: string
  role: 'user' | 'vendor' | 'admin'
  vendor_id: string | null
  created_at: string | null
  profile_image_url: string | null
  pref_lat: number | null
  pref_lng: number | null
}

export const getMe = async (): Promise<MeResponse> => {
  const res = await api.get<MeResponse>('/auth/me')
  return res.data
}

export const updateProfile = async (data: { full_name: string }): Promise<MeResponse> => {
  const res = await api.patch<MeResponse>('/auth/me', data)
  return res.data
}

export const changePassword = async (data: {
  current_password: string
  new_password: string
}): Promise<void> => {
  await api.post('/auth/me/password', data)
}

export const setMyLocation = async (lat: number, lng: number): Promise<MeResponse> => {
  const res = await api.put<MeResponse>('/auth/me/location', { lat, lng })
  return res.data
}

export const clearMyLocation = async (): Promise<MeResponse> => {
  const res = await api.delete<MeResponse>('/auth/me/location')
  return res.data
}

export const uploadProfilePhoto = async (file: File): Promise<MeResponse> => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<MeResponse>('/auth/me/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export interface AddDishInput {
  name: string
  description?: string
  price?: number
  available?: boolean
  file?: File | null
}

export const addVendorDish = async (vendorId: string, input: AddDishInput): Promise<import("@/types").VendorItem> => {
  const form = new FormData()
  form.append('name', input.name)
  if (input.description) form.append('description', input.description)
  if (input.price != null) form.append('price', String(input.price))
  form.append('available', String(input.available ?? true))
  if (input.file) form.append('file', input.file)
  const res = await api.post(`/vendors/${vendorId}/dishes`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export interface AddGroceryInput {
  name: string
  price?: number
  available?: boolean
  file?: File | null
}

export const addVendorGrocery = async (vendorId: string, input: AddGroceryInput): Promise<import("@/types").VendorItem> => {
  const form = new FormData()
  form.append('name', input.name)
  if (input.price != null) form.append('price', String(input.price))
  form.append('available', String(input.available ?? true))
  if (input.file) form.append('file', input.file)
  const res = await api.post(`/vendors/${vendorId}/groceries`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const uploadVendorImage = async (vendorId: string, file: File): Promise<Vendor> => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<Vendor>(`/vendors/${vendorId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export interface UpdateVendorItemInput {
  name?: string
  description?: string | null
  price?: number | null
}

export const updateVendorItem = async (
  vendorId: string,
  itemId: string,
  input: UpdateVendorItemInput
): Promise<import("@/types").VendorItem> => {
  const { data } = await api.patch(`/vendors/${vendorId}/items/${itemId}`, input)
  return data
}

export const removeVendorItem = async (vendorId: string, itemId: string): Promise<void> => {
  await api.delete(`/vendors/${vendorId}/items/${itemId}`)
}

export interface UpdateVendorInput {
  name?: string
  type?: 'restaurant' | 'grocery_store'
  address?: string
  phone?: string | null
  website?: string | null
}

export const updateVendor = async (vendorId: string, input: UpdateVendorInput): Promise<Vendor> => {
  const { data } = await api.patch<Vendor>(`/vendors/${vendorId}`, input)
  return data
}

export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}

export const logoutUser = async () => {
  await api.post('/auth/logout')
}

export async function searchFood(q: string, lat: number, lng: number, radius_km?: number): Promise<SearchResponse> {
  const params: SearchParams = { q, lat, lng, radius_km };
  const { data } = await api.get<SearchResponse>("/search", { params });
  return data;
}

export async function getVendors(params?: VendorsQueryParams): Promise<Vendor[]> {
  const { data } = await api.get<Vendor[]>("/vendors", { params });
  return data;
}

export async function getVendor(slug: string, lat?: number, lng?: number): Promise<Vendor> {
  const { data } = await api.get<Vendor>(`/vendors/${slug}`, { params: { lat, lng } });
  return data;
}

export async function getFoods(params?: {
  region?: string;
  cuisine?: string;
  hasVendors?: boolean;
}): Promise<FoodSummary[]> {
  const query: Record<string, string | boolean> = {};
  if (params?.region) query.region = params.region;
  if (params?.cuisine) query.cuisine = params.cuisine;
  if (params?.hasVendors) query.has_vendors = true;
  const { data } = await api.get<FoodSummary[]>("/foods", { params: query });
  return data;
}

export async function getFood(slug: string, lat?: number, lng?: number): Promise<FoodDetail> {
  const { data } = await api.get<FoodDetail>(`/foods/${slug}`, { params: { lat, lng } });
  return data;
}

// --- SHOPPING LIST ---

export async function addRecipeToShoppingList(slug: string): Promise<import("@/types").AddRecipeResult> {
  const { data } = await api.post<import("@/types").AddRecipeResult>(`/shopping-list/recipes/${slug}`);
  return data;
}

export async function getShoppingList(): Promise<import("@/types").ShoppingList> {
  const { data } = await api.get<import("@/types").ShoppingList>("/shopping-list");
  return data;
}

export interface AddFromSavedResult {
  recipes: number;
  added: number;
  total: number;
}

export async function addSavedRecipesToShoppingList(): Promise<AddFromSavedResult> {
  const { data } = await api.post<AddFromSavedResult>("/shopping-list/from-saved");
  return data;
}

export async function setShoppingItemChecked(
  itemId: string,
  checked: boolean
): Promise<import("@/types").ShoppingListItem> {
  const { data } = await api.patch<import("@/types").ShoppingListItem>(
    `/shopping-list/items/${itemId}`,
    { checked }
  );
  return data;
}

export async function removeShoppingItem(itemId: string): Promise<void> {
  await api.delete(`/shopping-list/items/${itemId}`);
}

export async function clearShoppingList(): Promise<void> {
  await api.delete("/shopping-list");
}

export async function getShoppingListStores(
  lat: number,
  lng: number,
  radiusKm?: number
): Promise<import("@/types").StoreCoverage[]> {
  const { data } = await api.get<import("@/types").StoreCoverage[]>("/shopping-list/stores", {
    params: { lat, lng, radius_km: radiusKm }
  });
  return data;
}

export async function getFoodIngredientStores(
  slug: string,
  lat: number,
  lng: number,
  radiusKm?: number
): Promise<import("@/types").IngredientStores[]> {
  const { data } = await api.get<import("@/types").IngredientStores[]>(
    `/foods/${slug}/ingredient-stores`,
    { params: { lat, lng, radius_km: radiusKm } }
  );
  return data;
}

export async function getIngredient(slug: string, lat?: number, lng?: number): Promise<IngredientDetail> {
  const { data } = await api.get<IngredientDetail>(`/ingredients/${slug}`, { params: { lat, lng } });
  return data;
}

export async function getIngredients(): Promise<import("@/types").IngredientSummary[]> {
  const { data } = await api.get<import("@/types").IngredientSummary[]>("/ingredients");
  return data;
}

// --- VENDOR STOCK: low-friction "carries this ingredient" flag ---

export const setVendorStock = async (vendorId: string, ingredientId: string): Promise<void> => {
  await api.put(`/vendors/${vendorId}/stock/${ingredientId}`);
};

export const removeVendorStock = async (vendorId: string, ingredientId: string): Promise<void> => {
  await api.delete(`/vendors/${vendorId}/stock/${ingredientId}`);
};

// --- ENGAGEMENT TRACKING ---
// Fire-and-forget; never throw so it can't break the UI.
export async function trackView(
  entityType: "vendor" | "food" | "ingredient",
  entityId: string
): Promise<void> {
  try {
    await api.post("/events/view", { entity_type: entityType, entity_id: entityId });
  } catch {
    // ignore — analytics must never break the page
  }
}

// --- SAVED COLLECTION (M6 SCRUM-37) ---

export interface SavedCollection {
  foods: FoodSummary[];
  vendors: VendorSummary[];
}

export async function getSavedCollection(): Promise<SavedCollection> {
  const { data } = await api.get<SavedCollection>("/saved");
  return data;
}

export async function saveFoodApi(slug: string): Promise<void> {
  await api.post(`/saved/foods/${slug}`);
}

export async function unsaveFoodApi(slug: string): Promise<void> {
  await api.delete(`/saved/foods/${slug}`);
}

export async function saveVendorApi(slug: string): Promise<void> {
  await api.post(`/saved/vendors/${slug}`);
}

export async function unsaveVendorApi(slug: string): Promise<void> {
  await api.delete(`/saved/vendors/${slug}`);
}

// --- ADMIN ANALYTICS ---

export interface AdminTotals {
  users: number
  vendors: number
  total_searches: number
  zero_result_searches: number
  total_views: number
}

export interface TopSearch {
  normalized_query: string
  count: number
}

export interface ZeroResultSearch {
  normalized_query: string
  count: number
  avg_lat: number | null
  avg_lng: number | null
}

export interface SearchGeoPoint {
  lat: number
  lng: number
  normalized_query: string
  zero_result: boolean
}

export interface TopViewed {
  entity_id: string
  count: number
  name?: string
  slug?: string
}

export const getAdminTotals = async (): Promise<AdminTotals> => {
  const { data } = await api.get<AdminTotals>('/admin/analytics/totals')
  return data
}

export const getTopSearches = async (days = 30, limit = 20): Promise<TopSearch[]> => {
  const { data } = await api.get<TopSearch[]>('/admin/analytics/top-searches', { params: { days, limit } })
  return data
}

export const getZeroResultSearches = async (days = 30, limit = 20): Promise<ZeroResultSearch[]> => {
  const { data } = await api.get<ZeroResultSearch[]>('/admin/analytics/zero-result-searches', { params: { days, limit } })
  return data
}

export const getSearchGeo = async (days = 30, limit = 1000): Promise<SearchGeoPoint[]> => {
  const { data } = await api.get<SearchGeoPoint[]>('/admin/analytics/search-geo', { params: { days, limit } })
  return data
}

export const getTopViewed = async (entityType: 'vendor' | 'food' | 'ingredient', days = 30, limit = 20): Promise<TopViewed[]> => {
  const { data } = await api.get<TopViewed[]>(`/admin/analytics/top-viewed/${entityType}`, { params: { days, limit } })
  return data
}

export interface AdminPlatformStats {
  total_vendors: number
  total_restaurants: number
  total_grocery_stores: number
  total_foods: number
  total_ingredients: number
  total_searches: number
}

export const getAdminPlatformStats = async (): Promise<AdminPlatformStats> => {
  const { data } = await api.get<AdminPlatformStats>('/admin/manage/stats')
  return data
}

// --- ADMIN MANAGEMENT ---

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'user' | 'vendor' | 'admin'
  vendor_id: string | null
  is_active: boolean
  created_at: string | null
  profile_image_url: string | null
}

export interface AdminVendor {
  id: string
  name: string
  slug: string
  type: string
  address: string
  lat: number | null
  lng: number | null
  phone: string | null
  website: string | null
  image_url: string | null
  is_verified: boolean
  is_featured: boolean
  delivery_available: boolean | null
  created_at: string | null
  plan: 'basic' | 'featured' | 'premium'
  plan_expires_at: string | null
}

export const adminListUsers = async (params?: { q?: string; role?: string; page?: number; page_size?: number }): Promise<AdminUser[]> => {
  const { data } = await api.get<AdminUser[]>('/admin/manage/users', { params })
  return data
}

export const adminUpdateUserRole = async (userId: string, role: string): Promise<AdminUser> => {
  const { data } = await api.patch<AdminUser>(`/admin/manage/users/${userId}/role`, { role })
  return data
}

export const adminSetUserActive = async (userId: string, isActive: boolean): Promise<AdminUser> => {
  const { data } = await api.patch<AdminUser>(`/admin/manage/users/${userId}/active`, { is_active: isActive })
  return data
}

export const adminListVendors = async (params?: { q?: string; is_verified?: boolean; plan?: string; page?: number; page_size?: number }): Promise<AdminVendor[]> => {
  const { data } = await api.get<AdminVendor[]>('/admin/manage/vendors', { params })
  return data
}

export const adminVerifyVendor = async (vendorId: string) => {
  const { data } = await api.patch(`/admin/manage/vendors/${vendorId}/verify`)
  return data
}

export const adminToggleVendorFeature = async (vendorId: string) => {
  const { data } = await api.patch(`/admin/manage/vendors/${vendorId}/feature`)
  return data
}

export const adminSetVendorDelivery = async (
  vendorId: string,
  deliveryAvailable: boolean | null
): Promise<AdminVendor> => {
  const { data } = await api.patch<AdminVendor>(
    `/admin/manage/vendors/${vendorId}/delivery`,
    { delivery_available: deliveryAvailable }
  )
  return data
}

export const adminUpdateVendorPlan = async (vendorId: string, plan: string) => {
  const { data } = await api.patch(`/admin/manage/vendors/${vendorId}/plan`, { plan })
  return data
}

export const adminDeleteVendor = async (vendorId: string) => {
  const { data } = await api.delete(`/admin/manage/vendors/${vendorId}`)
  return data
}

export async function registerVendor(payload: RegisterVendorPayload): Promise<Vendor> {
  const { data } = await api.post<Vendor>("/vendors/register", payload);
  return data;
}
// --- ADMIN FOOD CATALOG MANAGEMENT (SCRUM-53) ---

export interface AdminFood {
  id: string
  name: string
  slug: string
  description: string | null
  region: string | null
  image_url: string | null
  recipe_link: string | null
  created_at: string | null
}

export interface AdminFoodInput {
  name?: string
  description?: string | null
  region?: string | null
  image_url?: string | null
  recipe_link?: string | null
}

export const adminListFoods = async (params?: { q?: string; page?: number; page_size?: number }): Promise<AdminFood[]> => {
  const { data } = await api.get<AdminFood[]>('/admin/manage/foods', { params })
  return data
}

export const adminCreateFood = async (input: AdminFoodInput): Promise<AdminFood> => {
  const { data } = await api.post<AdminFood>('/admin/manage/foods', input)
  return data
}

export const adminUpdateFood = async (slug: string, input: AdminFoodInput): Promise<AdminFood> => {
  const { data } = await api.patch<AdminFood>(`/admin/manage/foods/${slug}`, input)
  return data
}

export const adminDeleteFood = async (slug: string): Promise<void> => {
  await api.delete(`/admin/manage/foods/${slug}`)
}

// --- FOOD SUGGESTIONS (recommend a dish + admin moderation) ---

export interface FoodSuggestion {
  id: string
  name: string
  description: string | null
  region: string | null
  image_url: string | null
  recipe_link: string | null
  note: string | null
  status: 'pending' | 'accepted' | 'declined'
  suggested_by_email: string | null
  created_food_slug: string | null
  created_at: string | null
  reviewed_at: string | null
}

export interface FoodSuggestionInput {
  name: string
  description?: string | null
  region?: string | null
  image_url?: string | null
  recipe_link?: string | null
  note?: string | null
}

export const submitFoodSuggestion = async (input: FoodSuggestionInput): Promise<FoodSuggestion> => {
  const { data } = await api.post<FoodSuggestion>('/food-suggestions', input)
  return data
}

export const getMyFoodSuggestions = async (): Promise<FoodSuggestion[]> => {
  const { data } = await api.get<FoodSuggestion[]>('/food-suggestions/mine')
  return data
}

export const adminListFoodSuggestions = async (
  status: 'pending' | 'accepted' | 'declined' = 'pending'
): Promise<FoodSuggestion[]> => {
  const { data } = await api.get<FoodSuggestion[]>('/admin/manage/food-suggestions', { params: { status } })
  return data
}

export const adminAcceptFoodSuggestion = async (id: string): Promise<FoodSuggestion> => {
  const { data } = await api.patch<FoodSuggestion>(`/admin/manage/food-suggestions/${id}/accept`)
  return data
}

export const adminDeclineFoodSuggestion = async (id: string): Promise<FoodSuggestion> => {
  const { data } = await api.patch<FoodSuggestion>(`/admin/manage/food-suggestions/${id}/decline`)
  return data
}
