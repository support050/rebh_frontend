"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ArrowUpRight, ArrowDownRight, ShieldCheck,
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3,
  Layers, FileText, Search, Activity, Cpu, Percent, HelpCircle,
  Clock, ShieldAlert, Sparkles, Edit3, X, Check, FileDown, Loader2
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { generateCompanyMemoPdf, CompanyMemoPdfData } from "../components/exportpdf";
import { buildCanvasPdf } from "@/lib/rebh/pdf";
import RebhRadarScore from "../../[symbol]/components/RebhRadarScore";
import SectorPeersTable from "../../[symbol]/components/SectorPeersTable";
import QuarterlyEngineRoom from "../../[symbol]/components/QuarterlyEngineRoom";
import InvestmentThesisBuyGate from "../../[symbol]/components/InvestmentThesisBuyGate";
import StatementDiagnosticsDiff from "../../[symbol]/components/StatementDiagnosticsDiff";
import FactorScoreboard from "../../[symbol]/components/FactorScoreboard";
import ValuationBandsAndMos from "../../[symbol]/components/ValuationBandsAndMos";
import CapitalStructureCard from "../../[symbol]/components/CapitalStructureCard";
import CompanyAnalystNotes from "../../[symbol]/components/CompanyAnalystNotes";


export default function RebhCompanyOfficialPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 7-Pillar Classification Dynamic Data
  const [classData, setClassData] = useState<any>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPagePdf, setExportingPagePdf] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        setError(null);
        // Direct unified production contract endpoint
        const res = await fetch(`${API_BASE_URL}/api/engine/${symbol}`);
        if (!res.ok) {
          // Fallback to compatibility endpoint
          const compatRes = await fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`);
          if (!compatRes.ok) {
            throw new Error(`Error fetching company data: ${compatRes.status}`);
          }
          const compatData = await compatRes.json();
          setCompany(compatData);
          return;
        }
        const data = await res.json();
        setCompany(data);
      } catch (err: any) {
        setError(err.message || "A server connection error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [symbol]);

  // Load classification details
  useEffect(() => {
    async function fetchClassification() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/classification/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setClassData(data);
        }
      } catch (err) {
        console.error("Failed to load classification:", err);
      }
    }
    fetchClassification();
  }, [symbol]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/rebh/company/${searchQuery.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-8 flex flex-col items-center justify-center">
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-[#DC2626]" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1.5">Unable to display data for symbol: {symbol}</h2>
            <p className="text-sm text-[#6B7280]">{error || "Company not found, or its financial statements are not yet complete"}</p>
          </div>
          <Link
            href="/rebh/company/2222"
            className="inline-block px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-sm font-semibold hover:bg-[#752f28] transition-colors"
          >
            Return to benchmark symbol (2222 Aramco)
          </Link>
        </div>
      </div>
    );
  }

  // Contract data mapping (supporting both RebhUniversalContract and legacy fields)
  const name = company.en || company.name || company.n || symbol;
  const sec = company.sector || company.sec || "—";
  // Display-only English sector label. `sec` itself stays the backend value because it is used for the peers API query.
  const secDisplay = company.sec_en || sec;
  const indClass = company.industry_class || "—";
  const px = Number(company.price ?? company.px ?? 0);
  const mc = Number(company.market_cap ?? company.mc ?? 0);
  const currency = company.currency || "SAR";
  const isFresh = company.fresh !== false;
  const staleReason = company.stale_reason;
  const quarantineReason = company.quarantine_reason;
  const balanceIdentity = company.balance_identity || { is_valid: true };
  const isQuarantined = Boolean(quarantineReason || (!balanceIdentity.is_valid && company.balance_identity));

  const pe = company.TTM?.eps && px > 0 ? Number((px / company.TTM.eps).toFixed(1)) : company.pe;
  const f_score = company.piotroski ?? company.f_score ?? 0;
  const grades = company.grades || {};
  const safety = company.safety || {};
  const buildUp = company.build_up;
  const nineBox = company.nine_box;
  const zones = company.zones;
  const irrDecision = company.irr_decision || {};
  const cyclicalBands = company.cyclical_bands;
  const psLadder = company.ps_ladder;
  const bankMetrics = company.bank_metrics;
  const redFlags = company.red_flags || [];
  const buyGate = company.buy_gate;
  const shariah = company.shariah;
  const selectedGrowth = company.selected_growth || {};
  const reverseDcf = company.reverse_dcf || {};

  // Discrete Quarters diff & trend
  const quarterly = company.quarterly || {};
  const periods = quarterly.periods || [];
  const netProfits = quarterly.net_profit || [];
  const lastIdx = periods.length - 1;
  const prevIdx = periods.length - 2;
  const yoyIdx = periods.length - 5;

  const currentQName = lastIdx >= 0 ? periods[lastIdx] : "Latest Quarter";
  const currentQNet = lastIdx >= 0 && netProfits[lastIdx] != null ? netProfits[lastIdx] : null;
  const prevQNet = prevIdx >= 0 && netProfits[prevIdx] != null ? netProfits[prevIdx] : null;
  const yoyQNet = yoyIdx >= 0 && netProfits[yoyIdx] != null ? netProfits[yoyIdx] : null;

  const qoqDelta = (currentQNet != null && prevQNet != null && prevQNet !== 0)
    ? (((currentQNet - prevQNet) / Math.abs(prevQNet)) * 100).toFixed(1)
    : null;
  const yoyDelta = (currentQNet != null && yoyQNet != null && yoyQNet !== 0)
    ? (((currentQNet - yoyQNet) / Math.abs(yoyQNet)) * 100).toFixed(1)
    : null;

  const TTM = company.TTM || {};
  const pb = balanceIdentity.equity && balanceIdentity.equity > 0 && mc > 0
    ? Number((mc / (balanceIdentity.equity / 1_000_000)).toFixed(2))
    : company.pb;
  const roe = (grades?.["الربحية والكفاءة"]?.p != null) ? `${grades["الربحية والكفاءة"].p}% percentile` : (company.roe ? `${company.roe}%` : "—");
  const netMargin = TTM.revenue && TTM.net_profit ? ((TTM.net_profit / TTM.revenue) * 100).toFixed(1) : null;
  const fcfYield = mc > 0 && TTM.fcf ? ((TTM.fcf / 1_000_000 / mc) * 100).toFixed(1) : null;

  const estimatedFv = zones?.silver_max ?? zones?.gold_max ?? (nineBox?.earnings?.v2 ?? null);
  const marginOfSafety = company.margin_of_safety ?? (
    (estimatedFv && px > 0)
      ? Number((((estimatedFv - px) / estimatedFv) * 100).toFixed(1))
      : null
  );

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      const localNote = typeof window !== "undefined" ? localStorage.getItem(`rebh_note_${symbol}`) : null;

      const pdfPayload: CompanyMemoPdfData = {
        symbol,
        name,
        sector: company.sec_en || classData?.sector || sec,
        industryClass: indClass,
        currency,
        price: px,
        marketCap: mc,
        pe,
        pb,
        roe,
        netMargin,
        fcfYield,
        fScore: f_score,
        grades,
        rebhScoreOverride: company.rebh_score,
        marketRank: company.market_rank,
        sectorRank: company.sector_rank,
        isFresh,
        staleReason,
        quarantineReason,
        balanceIdentity,
        buyGate,
        capitalStructure: company.capital_structure,
        zones,
        irrDecision,
        reverseDcf,
        buildUp,
        safety,
        marginOfSafety,
        bankMetrics,
        cyclicalBands,
        psLadder,
        redFlags,
        shariah,
        classData,
        quarterly,
        currentQName,
        qoqDelta,
        yoyDelta,
        note: localNote,
      };

      await generateCompanyMemoPdf(pdfPayload);
    } catch (err) {
      console.error("Failed to generate PDF memo:", err);
      alert("An error occurred while generating the PDF file. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // ── Full-page PDF export (canvas capture of the analytical page) ───────────
  const handleExportPagePdf = async () => {
    if (exportingPagePdf) return;
    const node = document.getElementById("company-page-content");
    if (!node) return;
    try {
      setExportingPagePdf(true);
      const dateStr = new Date().toISOString().split("T")[0];
      await buildCanvasPdf({
        node,
        filename: `REBH_Company_${symbol}_${dateStr}.pdf`,
        header: {
          symbol,
          title: name,
          subtitle: `Comprehensive Analytical Page - ${company.sec_en || classData?.sector || sec}`,
        },
      });
    } catch (err) {
      console.error("Failed to export company page PDF:", err);
      alert("An error occurred while generating the PDF file. Please try again.");
    } finally {
      setExportingPagePdf(false);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-16">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/rebh/tools" className="flex items-center gap-2 text-[#1A1A1A] font-bold tracking-tight text-base">
            <Cpu className="w-5 h-5 text-[#8C3B32]" />
            REBH ONE
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-[#6B7280]">
            <Link href={`/rebh/company/${symbol}`} className="text-[#8C3B32] border-b-2 border-[#8C3B32] pb-1 font-semibold">Overview</Link>
            <Link href="/rebh/tools" className="hover:text-[#1A1A1A] transition-colors">Tools &amp; Labs</Link>
            <Link href="/rebh/watchlist" className="hover:text-[#1A1A1A] transition-colors">Watchlist</Link>
            <Link
              href={`/rebh/report/${symbol}`}
              className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] text-[#1A1A1A] hover:border-[#8C3B32] hover:text-[#8C3B32] rounded-[4px] transition-colors font-semibold flex items-center gap-1.5"
            >
              <span>View Official Report</span>
            </Link>
          </nav>
        </div>

        {/* Stock Search Bar in Header */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a stock symbol (e.g., 1120, 2010)..."
              className="text-xs bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] pr-3 pl-8 py-1.5 w-[220px] sm:w-[260px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/20 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#8C3B32] text-white text-xs font-semibold rounded-[4px] hover:bg-[#752f28] transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const pxVal = px.toFixed(2);
              const fvVal = zones?.silver_max ?? zones?.gold_max ?? "—";
              const mosVal = marginOfSafety != null ? `${marginOfSafety}%` : "—";
              const txt = `[REBH Deep-Dive ONE Case Study] ${name} (${symbol})\nCurrent Price: ${pxVal} SAR | Estimated Fair Value: ${fvVal} SAR | Margin of Safety: ${mosVal}\nTTM P/E: ${pe ?? "—"}x | Piotroski F-Score: ${f_score}/9\nInvestment Gate Decision: ${buyGate?.gate_passed ? "Gate passed ✓" : "Pending ⚠️"}`;
              navigator.clipboard.writeText(txt);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151]"
          >
            <span>Copy Thesis</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-60 text-white rounded-[4px] text-xs font-semibold shadow-sm transition-colors"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Memo (PDF)</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportPagePdf}
            disabled={exportingPagePdf}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] text-[#374151] rounded-[4px] text-xs font-semibold shadow-sm disabled:opacity-60"
          >
            {exportingPagePdf ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Exporting...</>) : (<><FileDown className="w-3.5 h-3.5" />Export Page (PDF)</>)}
          </button>
        </div>
      </header>

      {/* Freshness / Quarantine Alert Bar (Rule #1 & #10) */}
      {isQuarantined && (
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-3 flex items-center gap-3 text-xs text-[#DC2626]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Stock placed in the Too-Hard Pile (Quarantine): </span>
            <span>
              {(() => {
                const raw = quarantineReason || company.balance_identity?.reason || "";
                if (raw.includes("A != L + E") || raw.includes("الميزانية")) return "Balance Sheet accounting identity discrepancy (A != L + E)";
                if (raw.includes("قائمة دخل") || raw.includes("غير مكتملة")) return "Incomplete or economically implausible Income Statement";
                return raw || "Balance Sheet accounting identity check failed";
              })()}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#FECACA]">Automated pricing blocked ⚑</span>
        </div>
      )}

      {!isFresh && !isQuarantined && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-6 py-2.5 flex items-center gap-3 text-xs text-[#B45309]">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Data freshness warning: {staleReason && !staleReason.includes("تجاوزت") ? staleReason : "The company's financial statements have exceeded the statutory period without an update"} (≈ disclosed estimate)
          </span>
        </div>
      )}

      {/* Snapshot Bar */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-sm">
            {symbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#1A1A1A] leading-tight">{name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-mono border border-[#E5E7EB]">
                {classData?.industry_class || indClass}
              </span>
            </div>
            <span className="text-xs text-[#6B7280]">{company.sec_en || classData?.sector || sec} · Saudi Market TASI</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">Current Price</span>
            <span className="text-sm font-bold text-[#1A1A1A] font-mono">{px.toFixed(2)} SAR</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">Market Cap</span>
            <span className="text-sm font-bold text-[#1A1A1A] font-mono">{(mc / 1000).toFixed(1)}B SAR</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">P/E Ratio°</span>
            <span className="text-sm font-bold text-[#8C3B32] font-mono">{pe ? `${pe}x` : "—"}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">Piotroski F-Score</span>
            <span className="text-sm font-bold text-[#16A34A] font-mono">{f_score}/9</span>
          </div>
        </div>
      </div>

      {/* Real Sector & Business Dynamics Strip */}
      {classData && (
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-2.5 text-[11.5px] text-[#475569] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-[#1E293B]">Business Pillars Classification:</span>
            <span>Sector: <strong className="text-[#8C3B32]">{company.sec_en || classData.sector || sec}</strong></span>
            <span>Market Structure: <strong className="text-[#0F172A]">{(classData.market_form || "Sector Competition").split(" (")[0]}</strong></span>
            <span>Price Elasticity: <strong className="text-[#0F172A]">{(classData.price_elasticity || "—").split(" (")[0]}</strong></span>
            <span>BCG Matrix: <strong className="text-[#0F172A]">{(classData.bcg_position || "—").split(" (")[0]}</strong></span>
            <span>Dominance: <strong className="text-[#0F172A]">{(classData.dominance || "—").split(" (")[0]}</strong></span>
            <span>Retail Path: <strong className="text-[#0F172A]">{(classData.retail_path || "Mixed Commercial").split(" (")[0]}</strong></span>
          </div>
          <div className="font-mono text-[10.5px] text-[#64748B]">
            Live Financial Engine
          </div>
        </div>
      )}

      {/* Main Container */}
      <main id="company-page-content" className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 1. Investment Thesis & Buy Gate Verdict */}
        <InvestmentThesisBuyGate buyGate={buyGate} />

        {/* 2. Rebh 5-Factor Radar Score */}
        <RebhRadarScore
          grades={grades}
          sec={secDisplay}
          symbol={symbol}
          warnCount={redFlags.length}
          goodCount={buyGate?.pass_conditions?.length ?? 0}
          marketRank={company.market_rank}
          sectorRank={company.sector_rank}
          scoreOverride={company.rebh_score}
          isStaleOrFallback={!isFresh}
          predictabilityStars={company.predictability_stars}
        />

        {/* 2.5 Capital Structure (Seeking Alpha Model) */}
        <CapitalStructureCard
          capitalStructure={company.capital_structure}
          currency={currency}
        />

        {/* 2.6 My Notes (Session & API Persistent Analyst Thesis) */}
        <CompanyAnalystNotes symbol={symbol} />

        {/* 2.7 Factor Scoreboard — quantitative rating vs. sector */}
        <FactorScoreboard grades={grades} />

        {/* 3. Valuation multiples + margin of safety & implied growth */}
        <ValuationBandsAndMos
          pe={pe}
          pb={pb}
          roe={roe}
          netMargin={netMargin}
          fcfYield={fcfYield}
          irrDecision={irrDecision}
          zones={zones}
          marginOfSafety={marginOfSafety}
          reverseDcf={reverseDcf}
          buildUp={buildUp}
        />

        {/* 4. Safety Cluster & Nine-Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Khurafshi Safety Cluster & Build-Up R */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
                Safety Cluster &amp; Required Return R°
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#F3F4F6] text-[#8C3B32] rounded-full border border-[#E5E7EB]">
                R = {buildUp?.required_return_r_pct ? `${buildUp.required_return_r_pct}%` : "8.0%"}
              </span>
            </div>

            <div className="space-y-2">
              {safety?.details ? (
                safety.details.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                    <span className="text-[#6B7280] font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1A1A1A] font-bold font-mono">{item.val}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.score > 0 ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : item.score === 0 ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}`}>
                        {item.score > 0 ? '+1 Safe' : item.score === 0 ? '0 Neutral' : '-1 Risk'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B7280]">Safety items follow the approved sector model.</p>
              )}
            </div>

            {buildUp && (
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
                <div className="flex justify-between">
                  <span>Base Sukuk Yield ({buildUp.rate_source}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{buildUp.risk_free_rate_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Porter Forces Compensation ({buildUp.porter_compensation_pct}% × {buildUp.porter_weight}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{(buildUp.porter_compensation_pct * buildUp.porter_weight).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Financial Safety Compensation ({buildUp.safety_compensation_pct}% × {buildUp.safety_weight}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{(buildUp.safety_compensation_pct * buildUp.safety_weight).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Card B: Nine-Box & Valuation Bands */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                Price Bands &amp; Nine-Box Matrix
              </h2>
              {zones?.current_zone && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#8C3B32] border border-[#E5E7EB]">
                  Current Zone: {zones.current_zone}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
                <span className="text-[10px] text-[#16A34A] block font-bold">Gold Zone</span>
                <span className="text-xs font-black text-[#16A34A] font-mono">
                  {zones?.gold_max ? `≤ ${zones.gold_max} SAR` : "—"}
                </span>
              </div>
              <div className="bg-[#F3F4F6] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#8C3B32] block font-bold">Silver Zone</span>
                <span className="text-xs font-black text-[#1A1A1A] font-mono">
                  {zones?.silver_max ? `≤ ${zones.silver_max} SAR` : "—"}
                </span>
              </div>
              <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
                <span className="text-[10px] text-[#DC2626] block font-bold">Bronze Zone</span>
                <span className="text-xs font-black text-[#DC2626] font-mono">
                  {zones?.bronze_max ? `≤ ${zones.bronze_max} SAR` : "—"}
                </span>
              </div>
            </div>

            <div className="bg-[#F7F8FA] p-3.5 rounded-[4px] border border-[#E5E7EB] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Expected IRR (5-year):</span>
                <span className="text-[#1A1A1A] font-mono font-bold">
                  {irrDecision?.irr_pct != null ? `${irrDecision.irr_pct}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Margin of Safety:</span>
                <span className="text-[#16A34A] font-mono font-bold">
                  {marginOfSafety != null ? `${marginOfSafety}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Priced-in Implied Growth (Reverse DCF):</span>
                <span className="text-[#8C3B32] font-mono font-bold">
                  {reverseDcf?.implied_growth_pct != null ? `${reverseDcf.implied_growth_pct}%` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Specialized Section: Banking Toolkit (If Bank) */}
        {bankMetrics && bankMetrics.is_bank && (
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#8C3B32]" />
                Specialized Bank Analysis Lab &amp; Toolkit (Banks Toolkit)
              </h2>
              <span className="text-[11px] text-[#16A34A] font-mono">NIM on average earning assets°</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">Net Interest Margin (NIM)</span>
                <span className="text-base font-black font-mono text-[#1A1A1A]">
                  {bankMetrics.nim_pct != null ? `${bankMetrics.nim_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">Current Deposits (CASA)</span>
                <span className="text-base font-black font-mono text-[#1A1A1A]">
                  {bankMetrics.casa_pct != null ? `${bankMetrics.casa_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">Loan-to-Deposit Ratio (LDR)</span>
                <span className={`text-base font-black font-mono ${bankMetrics.ldr_pct && bankMetrics.ldr_pct >= 95 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {bankMetrics.ldr_pct != null ? `${bankMetrics.ldr_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">Cost of Risk (COR)</span>
                <span className="text-base font-black font-mono text-[#1A1A1A]">
                  {bankMetrics.cost_of_risk_pct != null ? `${bankMetrics.cost_of_risk_pct}%` : "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Specialized Section: Cyclical Bands or P/S Ladder */}
        {cyclicalBands && cyclicalBands.is_cyclical && (
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Cyclical Stock Bands (Cyclical Bands Rule)</h3>
            <p className="text-xs text-[#6B7280]">
              Precision trough entry: 14–16x on the lowest clear cyclical earnings ({cyclicalBands.lowest_cycle_eps ?? "—"} SAR) = {cyclicalBands.buy_band_min ?? "—"} to {cyclicalBands.buy_band_max ?? "—"} SAR.
            </p>
          </div>
        )}

        {psLadder && psLadder.is_loss_maker && (
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">P/S Ladder for Unprofitable Companies</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
                <span className="text-[10px] text-[#16A34A] block">Cheap Range</span>
                <span className="font-mono font-bold text-[#16A34A]">{psLadder.cheap_ps ?? "—"}x P/S</span>
              </div>
              <div className="bg-[#F3F4F6] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#8C3B32] block">Moderate Range</span>
                <span className="font-mono font-bold text-[#1A1A1A]">{psLadder.medium_ps ?? "—"}x P/S</span>
              </div>
              <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
                <span className="text-[10px] text-[#DC2626] block">Danger Range</span>
                <span className="font-mono font-bold text-[#DC2626]">{psLadder.danger_ps ?? "—"}x P/S</span>
              </div>
            </div>
          </div>
        )}

        {/* Forensic Red Flags & Shariah Section */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8C3B32]" />
              Forensic Red Flags &amp; Shariah Screens
            </h3>
            {shariah && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                {shariah.is_compliant ? "Quantitatively Shariah-compliant ✓" : "Under Shariah review"}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {redFlags.length > 0 ? (
              redFlags.map((flag: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-xs p-3 rounded-[4px] bg-[#FEF2F2] border border-[#FECACA] text-[#7f1d1d]"
                >
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{flag.title_en || flag.title_ar}: </span>
                    <span>{flag.detail_en || flag.detail}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs p-3 rounded-[4px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532d]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>No accounting red flags detected in the latest financial statements.</span>
              </div>
            )}
          </div>
        </section>

        {/* 9-Quarter Engine Room */}
        <QuarterlyEngineRoom symbol={symbol} />

        {/* Statement Diagnostics & What Changed (Diff) */}
        <StatementDiagnosticsDiff
          balanceIdentity={balanceIdentity}
          isFresh={isFresh}
          staleReason={staleReason}
          currentQName={currentQName}
          qoqDelta={qoqDelta}
          yoyDelta={yoyDelta}
        />


        {/* Sector Peers Comparison Table */}
        {/* Pass the stable primary sector (`sec`, available right after the company fetch)
            instead of `classData?.sector || sec`, so the table does not re-fetch when the
            async classification data arrives and changes the sector string. */}
        <SectorPeersTable currentSymbol={symbol} sector={sec} sectorEn={company.sec_en} />

      </main>
    </div>
  );
}