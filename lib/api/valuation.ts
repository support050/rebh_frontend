// lib/api/valuation.ts
// Thin fetch wrappers for all valuation API endpoints.
// Uses the NEXT_PUBLIC_API_URL env variable.

import type {
  BondDashboard,
  TreasuryDailyResponse,
  MonthlyCurveResponse,
  EconomyAssessmentResponse,
  SP500ScenariosResponse,
  HistoricalPeResponse,
  TasiMarketWeightResponse,
  EpsEstimate,
  SystemConfigRow,
  ValuationZone,
} from "@/types/valuation";
import { authFetch } from "./authFetch";
import { API_BASE_URL } from "./config";

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  let urlStr = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => searchParams.set(k, String(v)));
    const qs = searchParams.toString();
    if (qs) urlStr += `?${qs}`;
  }
  const res = await authFetch(urlStr, {
    next: { revalidate: 60 },   // ISR: refresh every 60 seconds
  } as any);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await authFetch(`${API_BASE_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await authFetch(`${API_BASE_URL}${path}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Tab 1 ────────────────────────────────────────────────────────────────────
export const getBondDashboard = () =>
  get<BondDashboard>("/api/valuation/bond-dashboard");

// ── Tab 2 ────────────────────────────────────────────────────────────────────
export const getTreasuryDaily = (params?: {
  start?: string;
  end?: string;
  page?: number;
  page_size?: number;
}) => get<TreasuryDailyResponse>("/api/valuation/treasury/daily", params as any);

export const getTreasuryLatest = () =>
  get<Record<string, number | null>>("/api/valuation/treasury/latest");

// ── Tab 3 ────────────────────────────────────────────────────────────────────
export const getMonthlyCurve = () =>
  get<MonthlyCurveResponse>("/api/valuation/treasury/monthly-curve");

// ── Tab 4 ────────────────────────────────────────────────────────────────────
export const getEconomyAssessment = () =>
  get<EconomyAssessmentResponse>("/api/valuation/economy-assessment");

// ── Tab 5 ────────────────────────────────────────────────────────────────────
export const getSP500Scenarios = (n_years: number = 2) =>
  get<SP500ScenariosResponse>("/api/valuation/sp500-scenarios", { n_years });

// ── Tab 6 ────────────────────────────────────────────────────────────────────
export const getHistoricalPE = (limit: number = 10) =>
  get<HistoricalPeResponse>("/api/valuation/historical-pe", { limit });

// ── Tab 7 / 8 ────────────────────────────────────────────────────────────────
export const getTasiMarketWeight = () =>
  get<TasiMarketWeightResponse>("/api/valuation/tasi-market-weight");

export const getReport = () =>
  get<Pick<TasiMarketWeightResponse, "summary_current" | "summary_top70">>("/api/valuation/report");

// ── Admin: EPS Estimates ──────────────────────────────────────────────────────
export const listEpsEstimates  = () => get<EpsEstimate[]>("/api/admin/eps-estimates");
export const upsertEpsEstimate = (body: Partial<EpsEstimate>) =>
  post<{ action: string; year: number }>("/api/admin/eps-estimates", body);
export const updateEpsEstimate = (year: number, body: Partial<EpsEstimate>) =>
  put<{ action: string; year: number }>(`/api/admin/eps-estimates/${year}`, body);

// ── Admin: System Config ──────────────────────────────────────────────────────
export const listSystemConfig  = () => get<SystemConfigRow[]>("/api/admin/system-config");
export const updateSystemConfig = (key: string, value: string) =>
  put<{ action: string }>(`/api/admin/system-config/${key}`, { value });

// ── Admin: Valuation Zones ────────────────────────────────────────────────────
export const listValuationZones = () => get<ValuationZone[]>("/api/admin/valuation-zones");
export const updateValuationZone = (id: number, body: Partial<ValuationZone>) =>
  put<{ action: string }>(`/api/admin/valuation-zones/${id}`, body);

// ── Admin: Scraper ────────────────────────────────────────────────────────────
export const getSystemStats = () =>
  get<Record<string, unknown>>("/api/admin/system/stats");
export const triggerScraper = (scraper: string, options?: { mode?: string; force?: boolean }) =>
  post<{ status: string }>("/api/admin/system/run-scraper", { scraper, ...options });
