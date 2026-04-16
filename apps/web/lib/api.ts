// --- VENDOR: Get my vendor (authenticated) ---
export const getMyVendor = async (): Promise<Vendor> => {
  const { data } = await api.get<Vendor>("/vendors/me");
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
  VendorsQueryParams
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

// Response interceptor — handle 401 with refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
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
}

export const getMe = async (): Promise<MeResponse> => {
  const res = await api.get<MeResponse>('/auth/me')
  return res.data
}

export const updateProfile = async (data: { full_name: string }): Promise<MeResponse> => {
  const res = await api.patch<MeResponse>('/auth/me', data)
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

export async function getFoods(params?: { region?: string; hasVendors?: boolean }): Promise<FoodSummary[]> {
  const query: Record<string, string | boolean> = {};
  if (params?.region) query.region = params.region;
  if (params?.hasVendors) query.has_vendors = true;
  const { data } = await api.get<FoodSummary[]>("/foods", { params: query });
  return data;
}

export async function getFood(slug: string, lat?: number, lng?: number): Promise<FoodDetail> {
  const { data } = await api.get<FoodDetail>(`/foods/${slug}`, { params: { lat, lng } });
  return data;
}

export async function getIngredient(slug: string, lat?: number, lng?: number): Promise<IngredientDetail> {
  const { data } = await api.get<IngredientDetail>(`/ingredients/${slug}`, { params: { lat, lng } });
  return data;
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