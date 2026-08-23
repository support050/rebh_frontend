"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { authFetch } from "@/lib/api/authFetch";

import type { CompanyKey, CompanyTemplate, SectorPulse, StmtView } from "./types";
import { mkPrice, PRICE_CONFIGS } from "./utils";
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

  useEffect(() => {
    setMounted(true);
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


  const priceData = useMemo(() => {
    const cfg = PRICE_CONFIGS[cKey] || { base: 20, trend: 0.02, amp: 0.5, cyc: 9 };
    return mkPrice(cfg.base, cfg.trend, cfg.amp, cfg.cyc);
  }, [cKey]);

  const isPriceAboveMa = useMemo(() => {
    const p = priceData;
    const n = p.length;
    const ma50 = p.slice(n - 50).reduce((a, b) => a + b, 0) / 50;
    return p[n - 1] > ma50;
  }, [priceData]);

  // Automated quantitative rules engine signals
  const signals = useMemo(() => {
    if (!C) return [];
    return engineSignals(C, isPriceAboveMa);
  }, [C, isPriceAboveMa]);

  // Selected or default active row for bar chart
  const chartRow = useMemo(() => {
    if (!curStmt.rows || curStmt.rows.length === 0) return null;
    return selectedRowIdx != null
      ? curStmt.rows[selectedRowIdx]
      : curStmt.rows.find((r) => r.net) ||
          curStmt.rows.find((r) => r.t === "total") ||
          curStmt.rows[0];
  }, [curStmt, selectedRowIdx]);

  if (loading || !C) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-[#fff]">
        <div className="text-center">
          <div className="text-lg font-bold">جارٍ تحميل منظومة قوالب القطاعات المالية OPTIMAL v3...</div>
          <div className="mt-1 text-[12px] text-[#898781]">قوالب البنوك، الدورية، التأمين، شركات التمويل، وصناديق الريت</div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0d0d0d] font-sans text-[14px] text-[#fff]">
      {/* ── 1. Top Sector Template Switcher ── */}
      <TemplateSwitcher
        activeKey={cKey}
        onSelect={(key) => {
          setCKey(key);
          setSelectedRowIdx(null);
          setSt("is");
        }}
        themeBtnLabel={mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      {/* ── 2. Company Meta & Price Header ── */}
      <CompanyHeader C={C} />

      <div className="mx-auto max-w-[1280px] space-y-3.5 px-7 py-3 pb-16">
        <div className="text-[12px] text-[#898781]">{C.unit}</div>

        {/* ── 3. Price Bridge & Results Marks ── */}
        <PriceBridge priceData={priceData} C={C} />

        {/* ── 4. Key Performance Indicators with Sparklines ── */}
        <KPICards C={C} />

        {/* ── 5. Sector-Specific Financial Ratios ── */}
        <RatiosTiles C={C} />

        {/* ── 6. Interactive Interest Rate Sensitivity (Banks) ── */}
        <InterestSensitivity
          hasSens={C.hasSens}
          sensBp={sensBp}
          onSelectBp={(bp) => setSensBp(bp)}
        />

        {/* ── 7. Rules Engine Signals ── */}
        <SignalsSection signals={signals} />

        {/* ── 8. Multi-Statement Selector Tabs ── */}
        {C.stmts && (
          <div className="flex w-fit gap-1 rounded-lg bg-[#262624] p-1">
            <button
              onClick={() => {
                setSt("is");
                setSelectedRowIdx(null);
              }}
              className={`rounded-md px-3.5 py-1.5 text-[12.5px] transition-colors ${
                st === "is" ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7] hover:text-[#fff]"
              }`}
            >
              قائمة الدخل
            </button>
            <button
              onClick={() => {
                setSt("bs");
                setSelectedRowIdx(null);
              }}
              className={`rounded-md px-3.5 py-1.5 text-[12.5px] transition-colors ${
                st === "bs" ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7] hover:text-[#fff]"
              }`}
            >
              المركز المالي
            </button>
            <button
              onClick={() => {
                setSt("cf");
                setSelectedRowIdx(null);
              }}
              className={`rounded-md px-3.5 py-1.5 text-[12.5px] transition-colors ${
                st === "cf" ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7] hover:text-[#fff]"
              }`}
            >
              التدفقات النقدية
            </button>
          </div>
        )}

        {/* ── 9. Interactive Bar Chart with 4-Quarter Range Band ── */}
        <StatementChartCard chartRow={chartRow} curStmt={curStmt} isReal={C.real} />

        {/* ── 10. Comprehensive Statement Table with In-line Sparklines & Audit Strip ── */}
        <StatementTable
          C={C}
          curStmt={curStmt}
          selectedRowIdx={selectedRowIdx}
          onSelectRow={(idx) => setSelectedRowIdx(idx)}
        />

        {/* ── 11. Notes & Disclosures Layer ── */}
        <NotesGrid C={C} />

        {/* ── 12. Market Earnings Breadth Pulse ── */}
        <EarningsBreadthPulse pulseData={pulseData} />
      </div>
    </div>
  );
}
