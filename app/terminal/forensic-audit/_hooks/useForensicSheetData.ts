"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api/authFetch";

export interface ForensicCompanyData {
  sym: string;
  name: string;
  en: string;
  sec: string;
  is_bank: boolean;
  px: number;
  mc: number;
  net: number[];
  rev: number[];
  gp?: number[];
  op?: number[];
  eps?: number[];
  periods_q: string[];
  periods_ar: string[];
  quarters?: {
    periods: string[];
    rev: number[];
    net: number[];
    gp?: number[];
    op?: number[];
  };
  income_statement?: {
    periods: string[];
    rev: number[];
    cogs: number[];
    gp: number[];
    ga: number[];
    op: number[];
    fin_cost: number[];
    jv: number[];
    other_inc: number[];
    pbt: number[];
    zakat: number[];
    net: number[];
    eps: number[];
    ttm: {
      rev: number;
      cogs: number;
      gp: number;
      ga: number;
      op: number;
      fin_cost: number;
      jv: number;
      other_inc: number;
      pbt: number;
      zakat: number;
      net: number;
      eps: number;
    };
  };
  bs?: {
    periods: string[];
    cash: number[];
    receivables: number[];
    current_assets: number[];
    ppe: number[];
    total_assets: number[];
    short_debt: number[];
    current_liabilities: number[];
    long_debt: number[];
    total_liabilities: number[];
    capital: number[];
    retained_earnings: number[];
    total_equity: number[];
  };
  cf?: {
    periods: string[];
    cfo: number[];
    inventory?: number[];
    finance_paid?: number[];
    capex: number[];
    other_investing?: number[];
    cfi: number[];
    borrowings?: number[];
    cff: number[];
    net_change?: number[];
    fcf: number[];
  };
  cur?: {
    roe: number | null;
    nm: number | null;
    gm: number | null;
    pe: number | null;
    pb: number | null;
    g_net: number | null;
    g_rev: number | null;
    peg: number | null;
  };
  pct?: {
    roe: number;
    nm: number;
    gm: number | null;
    pe: number;
    pb: number;
    g_net: number;
    g_rev: number;
  };
  peers?: {
    roe: [string, string, number][];
    nm: [string, string, number][];
    pe: [string, string, number][];
    g_net: [string, string, number][];
  };
}

export function useForensicSheetData(symbol: string) {
  const [data, setData] = useState<ForensicCompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/terminal/company-fundamental/${symbol}/`);
        if (!res.ok) {
          throw new Error("Failed to load company fundamental data");
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Error fetching data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (symbol) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  return { data, loading, error };
}