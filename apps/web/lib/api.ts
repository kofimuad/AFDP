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