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

export async function getFoods(): Promise<FoodSummary[]> {
  const { data } = await api.get<FoodSummary[]>("/foods");
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

export async function registerVendor(payload: RegisterVendorPayload): Promise<Vendor> {
  const { data } = await api.post<Vendor>("/vendors/register", payload);
  return data;
}