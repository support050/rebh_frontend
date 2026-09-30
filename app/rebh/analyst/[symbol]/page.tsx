"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { generateAnalystPdf, AnalystPdfData, AnalystRatioItem } from "./components/exportpdf";
import {
  Tab,
  SectorTemplate,
  AnalysisMode,
  SECTOR_TEMPLATES,
} from "./components/types";
import { AnalystHeader } from "./components/AnalystHeader";
import { CompanyHero } from "./components/CompanyHero";
import { AnalystNavigation } from "./components/AnalystNavigation";
import { IncomeStatementTab } from "./components/IncomeStatementTab";
import { BalanceSheetTab } from "./components/BalanceSheetTab";
import { CashFlowTab } from "./components/CashFlowTab";
import { FinancialRatiosTab } from "./components/FinancialRatiosTab";
import { FormulasDrawer } from "./components/FormulasDrawer";

export default function AnalystDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("is");
  const [viewMode, setViewMode] = useState<"annual" | "quarterly">("annual");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("absolute");
  const [template, setTemplate] = useState<SectorTemplate>("industrial");
  const [search, setSearch] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`No financial statements found for symbol: ${symbol}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol]);

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    const s = search.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) router.push(`/rebh/analyst/${s}`);
  };

  // ── Computed ratios ─────────────────────────────────────────────────────────
  const ratios = useMemo(() => {
    if (!data?.cur) return null;
    const c = data.cur;
    const pc = data.pct || {};
    const isData = data.income_statement || {};
    const bsData = data.bs || {};
    const cfData = data.cf || {};

    const ca = bsData.current_assets?.at(-1) ?? 0;
    const cl = bsData.current_liabilities?.at(-1) ?? 0;
    const cur = cl > 0 ? +(ca / cl).toFixed(2) : null;

    const sd = bsData.short_debt?.at(-1) ?? 0;
    const ld = bsData.long_debt?.at(-1) ?? 0;
    const eq = bsData.total_equity?.at(-1) ?? 0;
    const de = eq > 0 ? +((sd + ld) / eq).toFixed(2) : null;

    const cfo = cfData.cfo?.at(-1) ?? 0;
    const net = isData.net?.at(-1) ?? 0;
    const cfo_nm = net !== 0 ? +((cfo / net) * 100).toFixed(1) : null;

    const op = isData.op?.at(-1) ?? 0;
    const rev = isData.rev?.at(-1) ?? 0;
    const opm = rev > 0 ? +((op / rev) * 100).toFixed(1) : null;

    const rec = bsData.receivables?.at(-1) ?? 0;
    const inv = bsData.inventory?.at(-1) ?? 0;
    const pay = bsData.payables?.at(-1) ?? 0;
    const rawCogs = isData.cogs?.at(-1) ?? 0;
    const cogs = Math.abs(rawCogs);

    const dso = rev > 0 && rec > 0 ? +((rec / rev) * 365).toFixed(1) : null;
    const dio = cogs > 0 && inv > 0 ? +((inv / cogs) * 365).toFixed(1) : null;
    const dpo = cogs > 0 && pay > 0 ? +((pay / cogs) * 365).toFixed(1) : null;

    const ccc =
      dso !== null && dio !== null && dpo !== null
        ? +(dso + dio - dpo).toFixed(1)
        : null;

    return { ...c, cur, de, cfo_nm, opm, dso, dio, dpo, ccc, pct: pc };
  }, [data]);

  // Auto-detect sector template
  useEffect(() => {
    if (!data?.sec) return;
    const sec = (data.sec || "").toLowerCase();
    if (sec.includes("بنك") || sec.includes("bank")) {
      setTemplate("bank");
    } else if (sec.includes("ريت") || sec.includes("reit") || sec.includes("عقار")) {
      setTemplate("reit");
    } else if (
      sec.includes("اتصال") ||
      sec.includes("telecom") ||
      sec.includes("تقنية") ||
      sec.includes("tech")
    ) {
      setTemplate("telecom");
    } else if (
      sec.includes("تجزئة") ||
      sec.includes("استهلاك") ||
      sec.includes("consumer") ||
      sec.includes("retail") ||
      sec.includes("أغذية") ||
      sec.includes("food")
    ) {
      setTemplate("consumer");
    } else {
      setTemplate("industrial");
    }
  }, [data]);

  if (loading) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8">
        <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
          <h2 className="text-base font-bold">Failed to load statements — {symbol}</h2>
          <p className="text-xs text-[#6B7280]">{error}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
              }}
              className="px-4 py-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold"
            >
              Retry
            </button>
            <Link
              href="/rebh/analyst"
              className="px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#752f28]"
            >
              Another Symbol
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = data.en || data.name || symbol;
  const nameEn = data.en || "";
  const sector = data.sec_en || data.sec || "—";
  const isBank = Boolean(data.is_bank);
  const isData = data.income_statement || {};
  const bsData = (viewMode === "annual" ? data.bs : data.bs_quarterly || data.bs) || {};
  const cfData = (viewMode === "annual" ? data.cf : data.cf_quarterly || data.cf) || {};
  const isTTM = isData.ttm || {};

  const safetyPass = ratios ? (ratios.de ?? 0) <= 2 && (ratios.cur ?? 0) >= 1 : null;
  const qualityPass = ratios ? (ratios.roe ?? 0) >= 10 && (ratios.nm ?? 0) >= 5 : null;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      const R = (id: string, label: string, unit: string): AnalystRatioItem => ({
        id,
        label,
        value: ratios?.[id] ?? null,
        unit,
      });
      const groups: AnalystPdfData["groups"] = [
        {
          title: "Profitability",
          rows: [
            R("roe", "Return on Equity (ROE)", "%"),
            R("nm", "Net Profit Margin", "%"),
            R("gm", "Gross Profit Margin", "%"),
            R("opm", "Operating Margin (EBIT)", "%"),
          ],
        },
        {
          title: "Growth (YoY)",
          rows: [
            R("g_net", "Net Income Growth (YoY)", "%"),
            R("g_rev", "Revenue Growth (YoY)", "%"),
            R("peg", "PEG Ratio", "\u00D7"),
          ],
        },
        {
          title: "Valuation",
          rows: [
            R("pe", "Price / Earnings (P/E)", "\u00D7"),
            R("pb", "Price / Book (P/B)", "\u00D7"),
          ],
        },
      ];
      if (!isBank) {
        groups.push({
          title: "Liquidity / Leverage",
          rows: [
            R("cur", "Current Ratio", "\u00D7"),
            R("de", "Debt / Equity", "\u00D7"),
            R("cfo_nm", "Earnings-to-Cash Conversion (CFO/NI)", "%"),
          ],
        });
        const wc = [
          R("dso", "Days Sales Outstanding (DSO)", "days"),
          R("dio", "Days Inventory Outstanding (DIO)", "days"),
          R("dpo", "Days Payables Outstanding (DPO)", "days"),
          R("ccc", "Cash Conversion Cycle (CCC)", "days"),
        ].filter(r => r.value != null);
        if (wc.length > 0) {
          groups.push({ title: "Working Capital Efficiency", rows: wc });
        }
      }
      const peersRaw: any[] = data?.peers?.peers?.roe || [];
      const payload: AnalystPdfData = {
        symbol,
        name,
        nameEn,
        sector,
        isBank,
        templateLabel: SECTOR_TEMPLATES[template].label,
        templateNotes: SECTOR_TEMPLATES[template].notes,
        groups,
        safetyPass: safetyPass ?? null,
        qualityPass: qualityPass ?? null,
        ttm:
          isTTM && (isTTM.rev != null || isTTM.net != null)
            ? {
                rev: isTTM.rev ?? null,
                gp: isTTM.gp ?? null,
                net: isTTM.net ?? null,
                eps: isTTM.eps ?? null,
              }
            : null,
        peers: peersRaw.slice(0, 8).map(([sym, peerName, roe]: any) => ({
          sym,
          name: peerName,
          roe,
        })),
        peersCount: data?.peers?.n_sec || 0,
      };
      await generateAnalystPdf(payload);
    } catch (err) {
      console.error("Failed to generate analyst PDF:", err);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28">
      {/* Top Header */}
      <AnalystHeader
        symbol={symbol}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleNav}
        exportingPdf={exportingPdf}
        onExportPdf={handleExportPdf}
      />

      {/* Hero Strip & Verdict Cards */}
      <CompanyHero
        symbol={symbol}
        name={name}
        sector={sector}
        isBank={isBank}
        px={data.px}
        mc={data.mc}
        safetyPass={safetyPass}
        qualityPass={qualityPass}
      />

      {/* Two-Tier Stable Navigation Controls */}
      <AnalystNavigation
        tab={tab}
        setTab={setTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        analysisMode={analysisMode}
        setAnalysisMode={setAnalysisMode}
        template={template}
        setTemplate={setTemplate}
        onOpenFormulas={() => setShowDrawer(true)}
      />

      {/* Main Statement & Ratios Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {tab === "is" && (
          <IncomeStatementTab
            symbol={symbol}
            isData={isData}
            quartersData={data.quarters}
            viewMode={viewMode}
            analysisMode={analysisMode}
            ratios={ratios}
            isBank={isBank}
          />
        )}

        {tab === "bs" && (
          <BalanceSheetTab
            bsData={bsData}
            viewMode={viewMode}
            analysisMode={analysisMode}
            ratios={ratios}
          />
        )}

        {tab === "cf" && (
          <CashFlowTab
            symbol={symbol}
            cfData={cfData}
            viewMode={viewMode}
            analysisMode={analysisMode}
            ratios={ratios}
          />
        )}

        {tab === "ratios" && ratios && (
          <FinancialRatiosTab
            symbol={symbol}
            template={template}
            ratios={ratios}
            isBank={isBank}
            data={data}
            showFormulas={false}
          />
        )}
      </main>

      {/* Slide-over Formulas & Methodology Drawer */}
      <FormulasDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </div>
  );
}