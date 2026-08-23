"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authFetch } from "@/lib/api/authFetch";

import { MarketMachineTab } from "./components/MarketMachineTab";
import { LegendScreensTab } from "./components/LegendScreensTab";
import { QuantLabTab } from "./components/QuantLabTab";
import { RatiosAllMarketTab, type RatioRow } from "./components/RatiosAllMarketTab";
import { CompanyDeepDiveTab } from "./components/CompanyDeepDiveTab";
import { ForensicAuditTab } from "./components/ForensicAuditTab";
import { CouncilSignoffTab } from "./components/CouncilSignoffTab";

// ── Types & Interfaces ─────────────────────────────────────────────────────

type TabKey = "machine" | "screens" | "quant" | "ratios" | "company" | "audit" | "council";

interface MarketMachineData {
  macro: {
    agg_earnings_ttm_bn: number;
    agg_earnings_prev_bn?: number;
    agg_earnings_yoy_pct?: number;
    agg_sample_n: number;
    sector_breadth: Record<string, { n: number; pct_up: number; mc: number; ni_ttm: number }>;
    bank_assets_bn: number;
    bank_ni_ttm_bn: number;
    banks_n: number;
    top10_mc_share_pct: number;
    total_mc_bn: number;
    median_pe: number;
    median_pb: number;
    median_fcf_yield: number;
    median_de_nonfin: number;
    coverage_weak_n: number;
    coverage_all_n: number;
    pe_n: number;
  };
}

interface QuantLabData {
  factors: Record<string, {
    value: number | null;
    quality: number | null;
    cash: number | null;
    growth: number | null;
    balance: number | null;
    composite: number;
    coverage: number;
    rank: number;
  }>;
  quant: {
    pool_n: number;
    scored_n: number;
    declared_limits: string;
  };
}

interface AuditSummaryData {
  pass: number;
  na: number;
  fixed: number;
  mixed: number;
  withheld: number;
  audit_checks: string[];
  refuse_list: { type: string; text: string }[];
}

type ScreenFilter = "all" | "buffett" | "graham" | "magic_formula";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${fmt(v, digits)}%`;
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function FinancialTerminalPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>("machine");
  const [screenFilter, setScreenFilter] = useState<ScreenFilter>("all");

  // Endpoint States
  const [machineData, setMachineData] = useState<MarketMachineData | null>(null);
  const [quantData, setQuantData] = useState<QuantLabData | null>(null);
  const [ratiosData, setRatiosData] = useState<RatioRow[]>([]);
  const [auditData, setAuditData] = useState<AuditSummaryData | null>(null);
  const [modelsData, setModelsData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTerminalData() {
      setLoading(true);
      setError(null);

      try {
        // Load initial base models first
        const resModels = await authFetch("/api/companies/models/all/");
        if (resModels.ok && !cancelled) {
          setModelsData(await resModels.json());
        }

        // Load tab specific endpoints dynamically
        if (activeTab === "machine" && !machineData) {
          const res = await authFetch("/api/terminal/market-machine/");
          if (res.ok && !cancelled) setMachineData(await res.json());
        } else if (activeTab === "quant" && !quantData) {
          const res = await authFetch("/api/terminal/quant-lab/");
          if (res.ok && !cancelled) setQuantData(await res.json());
        } else if ((activeTab === "ratios" || activeTab === "screens") && ratiosData.length === 0) {
          const res = await authFetch("/api/terminal/all-ratios/");
          if (res.ok && !cancelled) setRatiosData(await res.json());
        } else if (activeTab === "audit" && !auditData) {
          const res = await authFetch("/api/terminal/audit-summary/");
          if (res.ok && !cancelled) setAuditData(await res.json());
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dataset");
          setLoading(false);
        }
      }
    }

    loadTerminalData();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const filteredModels = useMemo(() => {
    if (screenFilter === "all") return modelsData;
    return modelsData.filter((m) => m.models && m.models[screenFilter]);
  }, [modelsData, screenFilter]);

  const sortedRatios = useMemo(() => {
    if (!sortKey) return ratiosData;
    return [...ratiosData].sort((a: any, b: any) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === "number" && typeof y === "number") {
        return sortAsc ? x - y : y - x;
      }
      return sortAsc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
    });
  }, [ratiosData, sortKey, sortAsc]);

  function handleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const macro = machineData?.macro;

  return (
    <div dir="ltr" className="min-h-screen bg-[#0d0d0d] text-[#f2f1ed] font-mono text-[12.5px] dark:bg-[#0d0d0d] dark:text-[#f2f1ed]">
      {/* ── HEADER & MARKET STRIP ── */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-4 border-b border-white/10 bg-[#1a1a19] px-5 py-2.5">
        <div className="text-[15px] font-extrabold tracking-wide">
          REBH <b className="text-[#3987e5]">FINANCIAL TERMINAL</b>{" "}
          <span className="text-[10px] text-[#898781]">LIVE · TASI</span>
        </div>

        {macro && (
          <div className="flex flex-wrap gap-4 text-[11px] text-[#c3c2b7]">
            <span>Listed: <b className="text-[#f2f1ed]">{macro.agg_sample_n}</b></span>
            <span>Market Cap: <b className="text-[#f2f1ed]">{macro.total_mc_bn}B SAR</b></span>
            <span>Median P/E: <b className="text-[#f2f1ed]">{macro.median_pe}x</b></span>
            <span>Median P/B: <b className="text-[#f2f1ed]">{macro.median_pb}x</b></span>
            <span>Audit Verified: <b className="text-[#0ca30c]">{auditData?.pass || 0} Pass</b></span>
          </div>
        )}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="ml-auto rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-[#c3c2b7] hover:bg-[#222220]"
        >
          {mounted && theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      {/* ── SUB-NAV (7 TABS) ── */}
      <nav className="sticky top-[47px] z-30 flex overflow-x-auto border-b border-white/10 bg-[#1a1a19] px-5">
        {[
          { key: "machine", label: "Market Machine" },
          { key: "screens", label: "Legend Screens" },
          { key: "quant", label: "Quant Lab" },
          { key: "ratios", label: "Ratios — All Market" },
          { key: "company", label: "Company Deep-Dive" },
          { key: "audit", label: "Forensic Audit" },
          { key: "council", label: "Council Sign-off" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[12.5px] transition-colors ${
              activeTab === tab.key
                ? "border-[#3987e5] font-bold text-[#3987e5]"
                : "border-transparent text-[#c3c2b7] hover:text-[#f2f1ed]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── MAIN CONTAINER ── */}
      <div className="mx-auto max-w-[1340px] px-5 py-4 pb-16">
        {error && (
          <div className="mb-4 rounded-lg border border-[#e66767]/40 bg-[#e66767]/10 p-3 text-[11px] text-[#e66767]">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-[#898781]">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#3987e5] border-t-transparent mb-2" />
            <p>Loading real-time XBRL terminal engine…</p>
          </div>
        ) : (
          <>
            {/* ══════════ TAB: MARKET MACHINE ══════════ */}
            {activeTab === "machine" && macro && (
              <MarketMachineTab macro={macro} />
            )}

            {/* ══════════ TAB: LEGEND SCREENS ══════════ */}
            {activeTab === "screens" && (
              <LegendScreensTab rows={ratiosData as any} />
            )}

            {/* ══════════ TAB: QUANT LAB ══════════ */}
            {activeTab === "quant" && quantData && (
              <QuantLabTab quantData={quantData} fmt={fmt} />
            )}

            {/* ══════════ TAB: RATIOS — ALL MARKET ══════════ */}
            {activeTab === "ratios" && (
              <RatiosAllMarketTab rows={ratiosData} />
            )}

            {/* ══════════ TAB: COMPANY DEEP-DIVE ══════════ */}
            {activeTab === "company" && (
              <CompanyDeepDiveTab />
            )}

            {/* ══════════ TAB: FORENSIC AUDIT ══════════ */}
            {activeTab === "audit" && auditData && (
              <ForensicAuditTab auditData={auditData} />
            )}

            {/* ══════════ TAB: COUNCIL SIGN-OFF ══════════ */}
            {activeTab === "council" && (
              <CouncilSignoffTab />
            )}
          </>
        )}
      </div>
    </div>
  );
}