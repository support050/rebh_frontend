"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileDown, Loader2, ArrowLeft, Shield, Award, CheckCircle2,
  AlertCircle, FileText, Scale, Edit3, Save, AlertTriangle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { generateOfficialReportPdf, OfficialReportPdfData } from "./components/exportpdf";

const SECTION_TITLE = "text-xs font-bold text-[#8C3B32] uppercase tracking-wide mb-2 border-b border-[#E5E7EB] pb-1";
const TABLE_HEAD = "bg-[#F3F4F6] border-b border-[#E5E7EB]";

export default function RebhReportPage() {
  const params = useParams();
  const symbol = (params?.symbol as string) || "2222";
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        setError(null);
        // Primary call: Universal Engine contract
        let res = await fetch(`${API_BASE_URL}/api/engine/${symbol}`);
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`);
        }
        if (!res.ok) {
          throw new Error(`Unable to fetch the financial report (code ${res.status})`);
        }
        const data = await res.json();
        setCompany(data);

        // Load notes from backend database, fallback to localStorage
        try {
          const notesRes = await fetch(`${API_BASE_URL}/api/rebh/notes/${symbol}`, {
            credentials: "include"
          });
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            if (notesData && notesData.note) {
              setUserNotes(notesData.note);
            } else {
              const localNote = localStorage.getItem(`rebh_note_${symbol}`);
              if (localNote) setUserNotes(localNote);
            }
          } else {
            const localNote = localStorage.getItem(`rebh_note_${symbol}`);
            if (localNote) setUserNotes(localNote);
          }
        } catch (_) {
          const localNote = localStorage.getItem(`rebh_note_${symbol}`);
          if (localNote) setUserNotes(localNote);
        }
      } catch (err: any) {
        console.error("Error fetching report data:", err);
        setError(err.message || "Failed to connect to the reporting server");
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [symbol]);

  const handleSaveNotes = async () => {
    // 1. Fallback to localStorage
    localStorage.setItem(`rebh_note_${symbol}`, userNotes);

    // 2. Persist to API per user
    try {
      await fetch(`${API_BASE_URL}/api/rebh/notes/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ symbol, note: userNotes })
      });
    } catch (_) { }

    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-8 flex flex-col items-center justify-center" dir="ltr">
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Unable to Load Report</h2>
            <p className="text-xs text-[#6B7280] mt-1">{error || "Data is currently unavailable"}</p>
          </div>
          <Link
            href={`/rebh/${symbol}`}
            className="inline-block px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#7a332b] transition"
          >
            Back to Company Screen ONE ∞
          </Link>
        </div>
      </div>
    );
  }

  // Contract field extraction
  const name = company.en || company.name || company.n || symbol;
  const sec = company.sector || company.sec || "—";
  // Display-only sector label (prefers English name from backend); `sec` stays untouched for classification logic below
  const secDisplay = company.sec_en || sec;
  const indClass = company.industry_class || "—";
  const px = Number(company.price ?? company.px ?? 0);
  const mc = Number(company.market_cap ?? company.mc ?? 0);
  const asOf = company.as_of || new Date().toISOString().split("T")[0];

  const buildUp = company.build_up;
  const requiredReturnPct = buildUp?.required_return_r_pct ?? company.required_return ?? 8.0;
  const requiredR = requiredReturnPct / 100.0;

  const eps = company.nine_box?.earnings?.x_value ?? company.TTM?.eps ?? (company.pe && company.pe > 0 ? px / company.pe : null);
  const pe = company.pe ?? (eps && eps > 0 ? px / eps : null);
  const de = company.safety?.de ?? company.de ?? 0.0;
  const roe = company.safety?.roe ?? company.roe;
  const roa = company.safety?.roa ?? company.roa;
  const current = company.safety?.current_ratio ?? company.current;
  const debtToAssetsPct = company.safety?.debt_to_assets ?? (company.de_assets != null ? company.de_assets : (company.shariah?.debt_to_market_cap_pct ?? null));
  const f_score = company.piotroski ?? company.f_score ?? 0;

  // Implied Growth from Engine
  const impliedGrowthPct = company.reverse_dcf?.implied_growth_pct ?? (eps && px ? Math.round(((px * requiredR - eps) / (px + eps)) * 1000) / 10 : null);

  // Classification logic
  const isBank = company.bank_metrics?.is_bank || sec === "Banks" || sec === "Financial Services";
  const isCyclical = company.cyclical_bands?.is_cyclical || ["Materials", "Energy", "Real Estate Mgmt & Dev't", "Capital Goods"].includes(sec);
  const isLossMaker = company.ps_ladder?.is_loss_maker;
  const companyCategory = isBank ? "Financials / Banks (Al-Asiri Toolkit)" : isCyclical ? "Cyclical (subject to cycle bands)" : isLossMaker ? "Unprofitable (P/S track)" : (roe && roe > 15) ? "Growth" : "Defensive / Stable";

  // R x GS Stress Matrix
  const rRates = [0.06, 0.08, 0.10, 0.12];
  const gsRates = [0.02, 0.04, 0.06, 0.08];

  // ── PDF export (direct jsPDF generator, replaces legacy window.print) ──────
  const safetyNarrative = `The company reports a return on equity (ROE) of ${roe != null ? `${roe}%` : "—"} and a return on assets (ROA) of ${roa != null ? `${roa}%` : "—"}.` +
    (isCyclical
      ? " As a cyclical-sector company, the methodological investment decision is derived from peak and trough cycle multiples, avoiding the trap of a low P/E at the cycle peak."
      : isBank
        ? " It is subject to banking-analysis indicators (NIM on average earning assets, CASA ratio, and LDR soundness)."
        : " The company is valued on sustainable cash flows and earnings, with a required margin of safety of no less than 15%.");

  const reverseDcfNote = impliedGrowthPct && impliedGrowthPct > 10
    ? "The market is pricing in very high growth for the stock, leaving it priced for perfection and reducing the investor's margin of safety."
    : "The market is pricing in modest or conservative growth, giving the investor an opportunity if actual performance exceeds these muted expectations.";

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      const payload: OfficialReportPdfData = {
        symbol,
        name,
        sector: secDisplay,
        category: companyCategory,
        asOf,
        px,
        mc,
        pe: pe ?? null,
        fScore: f_score,
        eps: eps ?? null,
        de: de ?? null,
        debtToAssetsPct: debtToAssetsPct ?? null,
        current: current ?? null,
        roe: roe ?? null,
        roa: roa ?? null,
        requiredReturnPct,
        buildUpFormula: buildUp?.formula_display ?? null,
        buildUpSource: buildUp ? `${buildUp.rate_source} (${buildUp.risk_free_rate_pct}%)` : null,
        ttm: company.TTM ? {
          quartersCount: company.TTM.discrete_quarters_count || 4,
          isComplete: Boolean(company.TTM.is_complete),
          revenue: company.TTM.revenue ?? null,
          netProfit: company.TTM.net_profit ?? null,
        } : null,
        safetyNarrative,
        nineBox: company.nine_box ? {
          glPct: company.nine_box.gl_pct ?? 3,
          gsPct: company.nine_box.gs_pct ?? 6,
          earnings: company.nine_box.earnings ?? null,
          fcfNetDebt: company.nine_box.fcf_net_debt ?? null,
          dividends: company.nine_box.dividends ?? null,
        } : null,
        zones: company.zones ? {
          goldMax: company.zones.gold_max ?? 0,
          silverMax: company.zones.silver_max ?? 0,
          bronzeMax: company.zones.bronze_max ?? 0,
          currentZone: company.zones.current_zone ?? "—",
        } : null,
        impliedGrowthPct: impliedGrowthPct ?? null,
        reverseDcfNote,
        userNotes: userNotes || null,
        rRates,
        gsRates,
      };
      await generateOfficialReportPdf(payload);
    } catch (err) {
      console.error("Failed to generate official report PDF:", err);
      alert("An error occurred while generating the PDF file. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-8 text-[#1A1A1A] font-sans print:bg-white print:py-0 antialiased" dir="ltr">
      {/* Print Controls & Navigation (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center print:hidden">
        <Link href={`/rebh/company/${symbol}`} className="text-xs font-bold text-[#8C3B32] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Stock Screen ONE ∞
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-[4px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F3F4F6] transition"
          >
            <Save className="w-3.5 h-3.5" />
            {savedNotes ? "Saved ✓" : "Save Notes"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-bold flex items-center gap-2 hover:bg-[#7a332b] transition shadow-[0_1px_3px_rgba(0,0,0,0.06)] disabled:opacity-60"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export Report (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {/* The Printable Document */}
      <div className="max-w-4xl mx-auto bg-white border border-[#E5E7EB] rounded-[4px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] print:border-none print:shadow-none print:p-2">
        {/* Document Header */}
        <header className="border-b-2 border-[#8C3B32] pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-[11px] font-bold text-[#8C3B32] tracking-wide uppercase mb-1">
              REBH RESEARCH · Comprehensive Analytical Financial Report (Meshal Al-Khurafshi Methodology)
            </div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{name} ({symbol})</h1>
            <span className="text-xs text-[#6B7280]">Sector: {secDisplay} · Methodology Classification: {companyCategory}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#9CA3AF] block uppercase tracking-wider">Data As-Of Date°</span>
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">{asOf}</span>
          </div>
        </header>

        {/* 1. Summary Metrics Card */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            1. Key Metrics &amp; Market Pricing Structure (Market Pricing &amp; Scale)
          </h2>
          <div className="grid grid-cols-4 gap-3 text-xs border border-[#E5E7EB] rounded-[4px] p-3 bg-[#F3F4F6]">
            <div>
              <span className="text-[#6B7280] block text-[10px]">Market Price</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{px.toFixed(2)} SAR</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">Market Capitalization</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{mc ? `${(mc / 1000).toFixed(1)}B SAR` : "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">P/E Ratio°</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{pe ? `${pe.toFixed(1)}x` : "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">Piotroski F-Score</span>
              <span className="font-bold text-[#16A34A] font-mono">{f_score}/9</span>
            </div>
          </div>
        </section>

        {/* Quarterly Statements & Provenance Section */}
        {company.TTM && (
          <section className="mb-6">
            <h2 className={SECTION_TITLE}>
              1.1 Quarterly Financial Statement Provenance (TTM Provenance &amp; Quarters)
            </h2>
            <div className="border border-[#E5E7EB] rounded-[4px] p-3 text-xs bg-white space-y-2">
              <div className="flex flex-wrap justify-between items-center text-[#6B7280] text-[11px] border-b border-[#E5E7EB] pb-2">
                <span>Periods included in TTM calculation: <b className="text-[#1A1A1A]">{company.TTM.discrete_quarters_count || 4} consecutive periods</b></span>
                <span>Statement completeness: <b className={company.TTM.is_complete ? "text-[#16A34A]" : "text-[#B45309]"}>{company.TTM.is_complete ? "Complete ✓" : "Partial estimate ⚑"}</b></span>
                <span>TTM Revenue: <b className="text-[#1A1A1A]">{company.TTM.revenue ? `${(company.TTM.revenue / 1000).toFixed(1)}B SAR` : "—"}</b></span>
                <span>TTM Net Income: <b className="text-[#1A1A1A]">{company.TTM.net_profit ? `${(company.TTM.net_profit / 1000).toFixed(1)}B SAR` : "—"}</b></span>
              </div>
            </div>
          </section>
        )}

        {/* 2. Shariah & Capital Structure */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            2. Capital Structure &amp; Quantitative Shariah Screening (Shariah Quantitative Legs)
          </h2>
          <table className="w-full text-xs border border-[#E5E7EB] rounded-[4px] text-left border-collapse overflow-hidden">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="p-2 font-semibold text-[#6B7280]">Financial Criterion</th>
                <th className="p-2 font-semibold text-[#6B7280]">Reference Threshold</th>
                <th className="p-2 font-semibold text-[#6B7280]">Computed Ratio°</th>
                <th className="p-2 font-semibold text-[#6B7280]">Quantitative Screen Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr>
                <td className="p-2">Debt-to-Equity Ratio (D/E)</td>
                <td className="p-2 font-mono">Moderate &lt; 1.0x</td>
                <td className="p-2 font-bold font-mono">{de != null ? `${de}x` : "—"}</td>
                <td className="p-2 text-[#16A34A] font-bold">{de != null && de < 1.0 ? "Sound ✓" : "Caution ⚠"}</td>
              </tr>
              <tr>
                <td className="p-2">Debt-to-Assets Ratio (Debt / Assets)</td>
                <td className="p-2 font-mono">&le; 33.0%</td>
                <td className="p-2 font-bold font-mono">
                  {debtToAssetsPct != null ? `${debtToAssetsPct.toFixed(1)}%` : "🔌 Source unavailable"}
                </td>
                <td className="p-2 text-[#16A34A] font-bold">
                  {debtToAssetsPct != null ? (debtToAssetsPct <= 33 ? "Quantitatively compliant ✓" : "Exceeds cap ⚑") : "Pending retrieval"}
                </td>
              </tr>
              <tr>
                <td className="p-2">Liquidity Ratio (Current Ratio)</td>
                <td className="p-2 font-mono">&ge; 1.50x</td>
                <td className="p-2 font-bold font-mono">{current != null ? `${Number(current).toFixed(2)}x` : "—"}</td>
                <td className="p-2 font-bold">{current != null && current >= 1.5 ? "Strong ✓" : "Acceptable"}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">
            {company.shariah?.committee_disclaimer || "This automated quantitative screen does not replace approval by accredited Shariah committees."}
          </p>
        </section>

        {/* 3. Safety Cluster & Build-Up R */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            3. Safety Cluster &amp; Required Return (Khurafshi Build-Up R)
          </h2>
          <div className="border border-[#E5E7EB] rounded-[4px] p-4 space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between items-center bg-[#F3F4F6] p-2 rounded-[4px] font-bold">
              <span>Adopted Required Return R° (Build-Up):</span>
              <span className="text-base text-[#8C3B32] font-mono">{requiredReturnPct}%</span>
            </div>
            {buildUp && (
              <div className="text-[11px] text-[#6B7280] space-y-1">
                <p>Required return components: {buildUp.formula_display}</p>
                <p className="text-[10px] text-[#9CA3AF]">Base instrument source: {buildUp.rate_source} ({buildUp.risk_free_rate_pct}%)</p>
              </div>
            )}
            <p className="text-[#1A1A1A]">
              The company reports a return on equity (ROE) of <b>{roe != null ? `${roe}%` : "—"}</b> and a return on assets (ROA) of <b>{roa != null ? `${roa}%` : "—"}</b>.
              {isCyclical
                ? " As a cyclical-sector company, the methodological investment decision is derived from peak and trough cycle multiples, avoiding the trap of a low P/E at the cycle peak."
                : isBank
                  ? " It is subject to banking-analysis indicators (NIM on average earning assets, CASA ratio, and LDR soundness)."
                  : " The company is valued on sustainable cash flows and earnings, with a required margin of safety of no less than 15%."}
            </p>
          </div>
        </section>

        {/* 3.1 Nine-Box Valuation Matrix (Khurafshi Canonical 9-Box) */}
        {company.nine_box && (
          <section className="mb-6">
            <h2 className={SECTION_TITLE}>
              3.1 Adopted Nine-Box Valuation Matrix (Khurafshi 9-Box Matrix)
            </h2>
            <p className="text-[11px] text-[#6B7280] mb-2">
              Valuation of the stock across the three pillars (dividends, earnings per share, and free cash flow net of debt) at three growth levels (zero, long-term {company.nine_box.gl_pct}%, and short-term {company.nine_box.gs_pct}%):
            </p>
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-[4px]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="p-2 border-r border-[#E5E7EB] text-[#6B7280] text-left">Methodology Pillar</th>
                    <th className="p-2 border-r border-[#E5E7EB] text-[#6B7280]">Base Value X</th>
                    <th className="p-2 border-r border-[#E5E7EB] text-[#6B7280]">V1 (No Growth)</th>
                    <th className="p-2 border-r border-[#E5E7EB] text-[#6B7280]">V2 (Perpetual Growth {company.nine_box.gl_pct}%)</th>
                    <th className="p-2 text-[#6B7280]">V3 (Transitional Growth {company.nine_box.gs_pct}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-r border-[#E5E7EB] text-left">Earnings per Share (Earnings)</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.earnings?.x_value ?? "—"} SAR</td>
                    <td className="p-2 font-mono font-bold text-[#8C3B32] border-r border-[#E5E7EB]">{company.nine_box.earnings?.v1 ?? "—"} SAR</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.earnings?.v2 ?? "—"} SAR</td>
                    <td className="p-2 font-mono font-bold text-[#16A34A]">{company.nine_box.earnings?.v3 ?? "—"} SAR</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-r border-[#E5E7EB] text-left">Free Cash Flow after Net Debt (FCF Net Debt)</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.x_value ?? "—"} SAR</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.v1 ?? "—"} SAR</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.v2 ?? "—"} SAR</td>
                    <td className="p-2 font-mono">{company.nine_box.fcf_net_debt?.v3 ?? "—"} SAR</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-r border-[#E5E7EB] text-left">Cash Dividends (Dividends)</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.dividends?.x_value ?? "—"} SAR</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.dividends?.v1 ?? "—"} SAR</td>
                    <td className="p-2 font-mono border-r border-[#E5E7EB]">{company.nine_box.dividends?.v2 ?? "—"} SAR</td>
                    <td className="p-2 font-mono">{company.nine_box.dividends?.v3 ?? "—"} SAR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {company.zones && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F7F8FA] rounded-[4px] border border-[#E5E7EB] text-[11px]">
                <span>Price zones: <b className="text-[#B45309]">Gold &le; {company.zones.gold_max} SAR</b> · <b className="text-[#6B7280]">Silver &le; {company.zones.silver_max} SAR</b> · <b className="text-[#1A1A1A]">Bronze &le; {company.zones.bronze_max} SAR</b></span>
                <span>Current price zone ({px} SAR): <b className="text-[#8C3B32]">{company.zones.current_zone}</b></span>
              </div>
            )}
          </section>
        )}

        {/* 4. R x GS Two-Way Stress Table */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            4. Two-Way Stress Matrix (R × GS Stress Matrix)
          </h2>
          <p className="text-[11px] text-[#6B7280] mb-2">
            Fair value sensitivity table per share (SAR) at the intersection of required return rates R and expected growth rates GS:
          </p>
          <table className="w-full text-xs border border-[#E5E7EB] rounded-[4px] text-center border-collapse overflow-hidden">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="p-2 border-r border-[#E5E7EB] font-semibold text-[#6B7280]">R \ GS</th>
                {gsRates.map(g => (
                  <th key={g} className="p-2 font-semibold text-[#6B7280]">Growth {(g * 100).toFixed(0)}%</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {rRates.map(r => (
                <tr key={r}>
                  <td className="p-2 bg-[#F3F4F6] font-bold border-r border-[#E5E7EB]">Discount {(r * 100).toFixed(0)}%</td>
                  {gsRates.map(g => {
                    const baseVal = eps && eps > 0 && r > g ? (eps * (1 + g)) / (r - g) : 0;
                    const isCheap = baseVal > px;
                    return (
                      <td key={g} className={`p-2 font-mono ${isCheap ? 'bg-[#F0FDF4] text-[#16A34A] font-bold' : 'text-[#1A1A1A]'}`}>
                        {baseVal > 0 ? baseVal.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 5. Reverse DCF & Market Expectation */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            5. Reverse Valuation &amp; Market Expectations (Reverse DCF Analysis)
          </h2>
          <div className="border border-[#E5E7EB] rounded-[4px] p-4 space-y-2 text-xs leading-relaxed text-[#1A1A1A]">
            <p>
              <b>Growth rate currently priced into the stock by the market: </b>
              <span className="font-bold text-[#8C3B32] font-mono">{impliedGrowthPct != null ? `${impliedGrowthPct}%` : "—"}</span>
            </p>
            <p className="text-[#6B7280]">
              {impliedGrowthPct && impliedGrowthPct > 10
                ? "The market is pricing in very high growth for the stock, leaving it priced for perfection and reducing the investor's margin of safety."
                : "The market is pricing in modest or conservative growth, giving the investor an opportunity if actual performance exceeds these muted expectations."}
            </p>
          </div>
        </section>

        {/* 6. Analyst Written Notes */}
        <section className="mb-6">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-1 mb-2">
            <h2 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wide">
              6. Analyst Notes &amp; Thesis
            </h2>
            <span className="text-[10px] text-[#9CA3AF]">Course rule: document the adopted R and the rationale before archiving</span>
          </div>
          <div className="border border-[#E5E7EB] rounded-[4px] p-3 bg-[#F3F4F6]">
            <textarea
              rows={4}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Write your investment thesis here: the adopted required return R, the reasons behind your valuation, and the points that would change your decision if they shifted..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[4px] p-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 leading-relaxed transition"
            />
          </div>
        </section>

        {/* Document Footer */}
        <footer className="mt-8 pt-4 border-t-2 border-[#8C3B32] text-[10px] text-[#6B7280] text-center space-y-1">
          <p className="font-bold text-[#1A1A1A]">Strict Educational Disclaimer:</p>
          <p>
            This analytical report was prepared following the course methodology of Mr. Meshal Al-Khurafshi, for purely educational and analytical purposes.
            All figures and data are extracted directly from the company&apos;s official financial statements. Nothing in this report constitutes, under any circumstances, a recommendation to buy or sell, or to make any investment decision.
          </p>
        </footer>
      </div>
    </div>
  );
}