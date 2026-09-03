"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { authFetch } from "@/lib/api/authFetch";

import type { CompanyKey, CompanyTemplate, SectorPulse, StmtView } from "./types";
import { engineSignals } from "./_components/SignalEngine";

import TemplateSwitcher from "./_components/TemplateSwitcher";
import CompanyHeader from "./_components/CompanyHeader";
import PriceBridge from "./_components/PriceBridge";
import KPICards from "./_components/KPICards";
import RatiosTiles from "./_components/RatiosTiles";
import InterestSensitivity from "./_components/InterestSensitivity";
import SignalsSection from "./_components/SignalsSection";
import StatementChartCard from "./_components/StatementChartCard";
import StatementTable from "./_components/StatementTable";
import NotesGrid from "./_components/NotesGrid";
import EarningsBreadthPulse from "./_components/EarningsBreadthPulse";

export default function SectorTemplatesOptimalPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [cKey, setCKey] = useState<CompanyKey>("bank");
  const [st, setSt] = useState<"is" | "bs" | "cf">("is");
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [sensBp, setSensBp] = useState<number>(0);

  const [companiesData, setCompaniesData] = useState<Record<string, CompanyTemplate>>({});
  const [pulseData, setPulseData] = useState<SectorPulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<number[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "") as CompanyKey;
      if (["bank", "petro", "gen", "ins", "fin", "reit"].includes(hash)) {
        setCKey(hash);
      }
    }

    async function load() {
      try {
        const res = await authFetch("/api/terminal/sector-templates/");
        if (res.ok) {
          const json = await res.json();
          setCompaniesData(json.companies || {});
          setPulseData(json.pulse || []);
        }
      } catch (err) {
        console.error("Failed to load sector templates", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectCompany = (key: CompanyKey) => {
    setCKey(key);
    setSelectedRowIdx(null);
    setSt("is");
    if (typeof window !== "undefined") {
      window.location.hash = key;
    }
  };

  // Fetch real price history whenever the selected company changes
  useEffect(() => {
    const C = companiesData[cKey];
    if (!C?.symbol) return;
    let cancelled = false;
    setPriceLoading(true);
    setPriceData([]);
    async function fetchPrices() {
      try {
        const res = await authFetch(`/api/prices/history/${C.symbol}?limit=110`);
        if (!cancelled && res.ok) {
          const json = await res.json();
          const rawList = Array.isArray(json) ? json : (json?.data || []);
          const closes: number[] = (rawList as { close?: number }[])
            .filter((d) => d.close != null)
            .map((d) => d.close as number)
            .slice(-110);
          if (!cancelled) setPriceData(closes);
        }
      } catch (err) {
        console.error("Failed to load price history", err);
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    }
    fetchPrices();
    return () => { cancelled = true; };
  }, [cKey, companiesData]);

  const C = companiesData[cKey];

  const curStmt: StmtView = useMemo(() => {
    if (!C) return { rows: [], periods: [], periodsEn: [], cumulative: false };
    if (st !== "is" && C.stmts) {
      const stmtObj = st === "bs" ? C.stmts.bs : st === "cf" ? C.stmts.cf : undefined;
      if (stmtObj) {
        return {
          rows: stmtObj.rows || [],
          periods: stmtObj.periods || [],
          periodsEn: stmtObj.periodsEn || [],
          cumulative: Boolean(stmtObj.cumulative),
        };
      }
    }
    return {
      rows: C.rows || [],
      periods: C.periods || [],
      periodsEn: C.periodsEn || [],
      cumulative: false,
    };
  }, [C, st]);


  const isPriceAboveMa = useMemo(() => {
    const p = priceData;
    if (p.length < 51) return null;
    const n = p.length;
    const ma50 = p.slice(n - 50).reduce((a, b) => a + b, 0) / 50;
    return p[n - 1] > ma50;
  }, [priceData]);

  // Automated quantitative rules engine signals
  const signals = useMemo(() => {
    if (!C) return [];
    return engineSignals(C, isPriceAboveMa ?? false);
  }, [C, isPriceAboveMa]);

  // Selected or default active row for bar chart
  const chartRow = useMemo(() => {
    if (!curStmt.rows || curStmt.rows.length === 0) return null;
    if (selectedRowIdx != null && curStmt.rows[selectedRowIdx]) {
      return curStmt.rows[selectedRowIdx];
    }
    // Default: find Net Profit row, or Total/Revenue row, or first row with non-empty values
    return (
      curStmt.rows.find((r) => r.en === "Net Profit for the Period" || r.ar.includes("صافي الربح للفترة")) ||
      curStmt.rows.find((r) => r.net) ||
      curStmt.rows.find((r) => r.en === "Revenue / Turnover" || r.ar.includes("الإيرادات")) ||
      curStmt.rows.find((r) => r.t === "total") ||
      curStmt.rows.find((r) => r.v && r.v.some((x) => x !== 0)) ||
      curStmt.rows[0]
    );
  }, [curStmt, selectedRowIdx]);

  if (loading || !C) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F8FA] dark:bg-[#0D0D0D]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E5E7EB] dark:border-[#2C2C2A] border-t-[#8C3B32] dark:border-t-[#3987E5]" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8FA] dark:bg-[#0D0D0D] font-sans text-[14px] text-[#1A1A1A] dark:text-[#F2F1ED] transition-colors">
      {/* ── 1. Top Sector Template Switcher ── */}
      <TemplateSwitcher
        activeKey={cKey}
        onSelect={handleSelectCompany}
        themeBtnLabel={mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        companiesData={companiesData}
      />


      {/* ── 2. Company Meta & Price Header ── */}
      <CompanyHeader C={C} />

      <div className="mx-auto max-w-[1280px] space-y-4 px-7 py-4 pb-16">
        <div className="text-[12px] text-[#9CA3AF] dark:text-[#898781]">{C.unit}</div>

        {/* ── 3. Price Bridge & Results Marks ── */}
        <PriceBridge priceData={priceData} priceLoading={priceLoading} C={C} />

        {/* ── 4. Key Performance Indicators with Sparklines ── */}
        <KPICards C={C} />

        {/* ── 5. Sector-Specific Financial Ratios ── */}
        <RatiosTiles C={C} />

        {/* ── 6. Interactive Interest Rate Sensitivity (Banks) ── */}
        <InterestSensitivity
          C={C}
          sensBp={sensBp}
          onSelectBp={(bp) => setSensBp(bp)}
        />


        {/* ── 7. Rules Engine Signals ── */}
        <SignalsSection signals={signals} />

        {/*
          Structural note: the statement tabs, the chart, and the table are three
          views of the same underlying statement data — grouping them inside one
          panel (instead of the tabs floating loose above two separate cards)
          makes that relationship visible instead of implied by proximity.
        */}
        <div>
          {/* ── 8. Multi-Statement Selector Tabs ── */}
          {C.stmts && (
            <div className="mb-3.5 flex w-fit gap-1 rounded-[4px] bg-[#F3F4F6] dark:bg-[#1a1a19] p-1">
              <button
                onClick={() => {
                  setSt("is");
                  setSelectedRowIdx(null);
                }}
                className={`rounded-[4px] px-3.5 py-1.5 text-[12.5px] transition-colors ${st === "is"
                  ? "border border-[#8C3B32] bg-white dark:bg-[#0d0d0d] font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-[#f2f1ed]"
                  }`}
              >
                قائمة الدخل
              </button>
              {C.stmts.bs && (
                <button
                  onClick={() => {
                    setSt("bs");
                    setSelectedRowIdx(null);
                  }}
                  className={`rounded-[4px] px-3.5 py-1.5 text-[12.5px] transition-colors ${st === "bs"
                    ? "border border-[#8C3B32] bg-white dark:bg-[#0d0d0d] font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-[#f2f1ed]"
                    }`}
                >
                  المركز المالي
                </button>
              )}
              {C.stmts.cf && (
                <button
                  onClick={() => {
                    setSt("cf");
                    setSelectedRowIdx(null);
                  }}
                  className={`rounded-[4px] px-3.5 py-1.5 text-[12.5px] transition-colors ${st === "cf"
                    ? "border border-[#8C3B32] bg-white dark:bg-[#0d0d0d] font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-[#f2f1ed]"
                    }`}
                >
                  التدفقات النقدية
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* ── 9. Interactive Bar Chart with 4-Quarter Range Band ── */}
            <StatementChartCard chartRow={chartRow} curStmt={curStmt} isReal={C.real} />

            {/* ── 10. Comprehensive Statement Table with In-line Sparklines & Audit Strip ── */}
            <StatementTable
              C={C}
              curStmt={curStmt}
              selectedRowIdx={selectedRowIdx}
              onSelectRow={(idx) => setSelectedRowIdx(idx)}
            />
          </div>
        </div>

        {/* ── 11. Notes & Disclosures Layer ── */}
        <NotesGrid C={C} />

        {/* ── 12. Market Earnings Breadth Pulse ── */}
        <EarningsBreadthPulse pulseData={pulseData} />
      </div>
    </div>
  );
}