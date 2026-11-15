// hooks/useValuation.ts
// SWR-based hooks for all 8 valuation tabs + admin data.
// Install: npm install swr

import useSWR from "swr";
import * as api from "@/lib/api/valuation";

// Generic fetcher — SWR calls this with the key string but we use typed api fns
const noop = undefined;

// ── Tab 1 ─────────────────────────────────────────────────────────────────────
export function useBondDashboard() {
  const { data, error, isLoading, mutate } = useSWR(
    "bond-dashboard",
    api.getBondDashboard,
    { refreshInterval: 5 * 60 * 1000 }   // auto-refresh every 5 min
  );
  return { data, error, isLoading, refresh: mutate };
}

// ── Tab 2 ─────────────────────────────────────────────────────────────────────
export function useTreasuryDaily(params?: {
  start?: string;
  end?: string;
  page?: number;
  page_size?: number;
}) {
  const key = ["treasury-daily", JSON.stringify(params)];
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.getTreasuryDaily(params),
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useTreasuryLatest() {
  const { data, error, isLoading, mutate } = useSWR(
    "treasury-latest",
    api.getTreasuryLatest,
    { refreshInterval: 5 * 60 * 1000 }
  );
  return { data, error, isLoading, refresh: mutate };
}

// ── Tab 3 ─────────────────────────────────────────────────────────────────────
export function useMonthlyCurve() {
  const { data, error, isLoading } = useSWR(
    "monthly-curve",
    api.getMonthlyCurve,
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading };
}

// ── Tab 4 ─────────────────────────────────────────────────────────────────────
export function useEconomyAssessment() {
  const { data, error, isLoading, mutate } = useSWR(
    "economy-assessment",
    api.getEconomyAssessment,
    { refreshInterval: 10 * 60 * 1000 }
  );
  return { data, error, isLoading, refresh: mutate };
}

// ── Tab 5 ─────────────────────────────────────────────────────────────────────
export function useSP500Scenarios(nYears: number = 2) {
  const { data, error, isLoading, mutate } = useSWR(
    ["sp500-scenarios", nYears],
    () => api.getSP500Scenarios(nYears),
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading, refresh: mutate };
}

// ── Tab 6 ─────────────────────────────────────────────────────────────────────
export function useHistoricalPE(limit: number = 10) {
  const { data, error, isLoading } = useSWR(
    ["historical-pe", limit],
    () => api.getHistoricalPE(limit),
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading };
}

// ── Tab 7 / 8 ─────────────────────────────────────────────────────────────────
export function useTasiMarketWeight() {
  const { data, error, isLoading, mutate } = useSWR(
    "tasi-market-weight",
    api.getTasiMarketWeight,
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useReport() {
  const { data, error, isLoading } = useSWR("report", api.getReport);
  return { data, error, isLoading };
}

// ── Admin hooks ───────────────────────────────────────────────────────────────
export function useEpsEstimates() {
  const { data, error, isLoading, mutate } = useSWR(
    "eps-estimates",
    api.listEpsEstimates
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useSystemConfig() {
  const { data, error, isLoading, mutate } = useSWR(
    "system-config",
    api.listSystemConfig
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useValuationZones() {
  const { data, error, isLoading, mutate } = useSWR(
    "valuation-zones",
    api.listValuationZones
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useSystemStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "system-stats",
    api.getSystemStats,
    { refreshInterval: 30 * 1000 }   // poll every 30 sec for scraper progress
  );
  return { data, error, isLoading, refresh: mutate };
}
