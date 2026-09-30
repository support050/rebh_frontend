"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, FileDown, Loader2 } from "lucide-react";
import { generateCourseReportPdf, CourseReportPdfData } from "./exportpdf";

interface ReportData {
  sym: string;
  n: string;
  en?: string;
  sec: string;
  sec_en?: string;
  px?: number;
  mc?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  roa?: number;
  nm?: number;
  de?: number;
  current?: number;
  coverage?: number;
  fcf?: number;
  g_net?: number;
  de_assets?: number;
  khurafshi?: {
    safety_score: number;
    safety_details: Array<{ name: string; val: string; score: number }>;
    implied_growth_pct?: number;
    margin_of_safety_pct?: number;
  };
  quarters?: {
    periods: string[];
    rev: (number | null)[];
    net: (number | null)[];
    gp?: (number | null)[];
    op?: (number | null)[];
  };
  grades?: Record<string, { g: string; p: number; b: string }>;
  wl?: Array<[string, string]>;
  epv?: { bear: number; base: number; bull: number; vs: number };
}

interface CompanyMeta {
  sym: string;
  name: string;
  type: string;
  label: string;
}

interface Props {
  meta: CompanyMeta;
  data: ReportData | null;
  loading: boolean;
}

const fmt = (v: number | null | undefined, dec = 0) => {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const fmtPct = (v: number | null | undefined) => {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
};

// Porter scores hardcoded from client HTML per company type (approximate)
const PORTER_BY_TYPE: Record<string, { items: { q: string; v: number; reason: string }[]; total: number; comp: number; label: string }> = {
  bank: {
    items: [
      { q: "Threat of New Entrants", v: 0.80, reason: "Central bank licensing is a near-closed barrier" },
      { q: "Buyer Power", v: 0.60, reason: "Retail customers are fragmented; corporates negotiate" },
      { q: "Supplier Power", v: 0.70, reason: "Depositors are fragmented and current accounts are costless" },
      { q: "Threat of Substitutes", v: 0.50, reason: "Fintech is nibbling at the edges" },
      { q: "Competitive Rivalry", v: 0.50, reason: "Strong competition in the sector" },
    ],
    total: 3.10, comp: 3, label: "3% (≥3.5→2 · ≥2.5→3 · else 4)",
  },
  defensive: {
    items: [
      { q: "Threat of New Entrants", v: 0.75, reason: "Capital and distribution network are a major barrier" },
      { q: "Buyer Power", v: 0.55, reason: "Large retailers negotiate; consumers are loyal" },
      { q: "Supplier Power", v: 0.55, reason: "Multiple suppliers — eased by foreign ownership" },
      { q: "Threat of Substitutes", v: 0.55, reason: "Substitutes exist and loyalty protects the core" },
      { q: "Competitive Rivalry", v: 0.45, reason: "Limited competition in the core business" },
    ],
    total: 2.85, comp: 3, label: "3% (≥2.5→3 · else 4)",
  },
  growth: {
    items: [
      { q: "Threat of New Entrants", v: 0.65, reason: "Strong brand and entrenched network" },
      { q: "Buyer Power", v: 0.60, reason: "Diverse customers; individuals and corporates" },
      { q: "Supplier Power", v: 0.65, reason: "Diversified contracting reduces concentration" },
      { q: "Threat of Substitutes", v: 0.60, reason: "Digitization threatens the edges — the core is protected" },
      { q: "Competitive Rivalry", v: 0.55, reason: "Intensifying competition in growth" },
    ],
    total: 3.05, comp: 3, label: "3% (≥2.5→3 · else 4)",
  },
  cyclical: {
    items: [
      { q: "Threat of New Entrants", v: 0.70, reason: "Heavy capital and an operating license" },
      { q: "Buyer Power", v: 0.45, reason: "Large buyers negotiate hard" },
      { q: "Supplier Power", v: 0.50, reason: "Volatile commodity inputs" },
      { q: "Threat of Substitutes", v: 0.55, reason: "Limited substitutes for construction materials" },
      { q: "Competitive Rivalry", v: 0.40, reason: "Price competition at cyclical peaks" },
    ],
    total: 2.60, comp: 4, label: "4% (< 2.5)",
  },
  realestate: {
    items: [
      { q: "Threat of New Entrants", v: 0.65, reason: "Land, capital and relationships are the barrier" },
      { q: "Buyer Power", v: 0.50, reason: "Individual buyers — demand drives the market" },
      { q: "Supplier Power", v: 0.55, reason: "Multiple building-materials suppliers and contractors" },
      { q: "Threat of Substitutes", v: 0.45, reason: "Renting is a permanent substitute" },
      { q: "Competitive Rivalry", v: 0.40, reason: "Price war during cyclical downturns" },
    ],
    total: 2.55, comp: 4, label: "4% (< 2.5)",
  },
};

const SAFETY_THRESHOLDS = [
  { key: "ROE", label: "ROE", field: "roe", thresholds: [15, 10], labels: ["≥15 / 10–15 / <10"] },
  { key: "ROA", label: "ROA°", field: "roa", thresholds: [10, 6], labels: ["≥10 / 6–10 / ≤6"] },
  { key: "Current", label: "Current Ratio", field: "current", thresholds: [2, 1], labels: ["≥2 / 1–2 / ≤1"] },
  { key: "DeAssets", label: "Debt/Assets°", field: "de_assets", reverse: true, thresholds: [40, 60], labels: ["≤40 / 40–60 / ≥60"] },
  { key: "Coverage", label: "Interest Coverage", field: "coverage", thresholds: [10, 6], labels: ["≥10 / 6–10 / ≤6"] },
];

function safetyScore(v: number | null, thresholds: number[], reverse = false): number {
  if (v == null) return 0;
  const [hi, lo] = thresholds;
  if (!reverse) {
    if (v >= hi) return 1;
    if (v >= lo) return 0;
    return -1;
  } else {
    if (v <= hi) return 1;
    if (v <= lo) return 0;
    return -1;
  }
}

function ScoreChip({ score }: { score: number }) {
  if (score > 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">+1 ✓</span>;
  if (score === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FBEFEC] text-[#8C3B32]">0 Neutral</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626]">−1 ✗</span>;
}

function TTM(vals: (number | null)[]): number | null {
  const last4 = vals.slice(-4);
  if (last4.length < 4 || !last4.every(x => x != null)) return null;
  return last4.reduce((a, b) => a + (b ?? 0), 0);
}

export default function CompanyReportView({ meta, data, loading }: Props) {
  const [exportingPdf, setExportingPdf] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-64 text-[#6B7280] text-xs">
        <div className="w-8 h-8 border-2 border-[#8C3B32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const porter = PORTER_BY_TYPE[meta.type] || PORTER_BY_TYPE.defensive;
  const ttmRev = data?.quarters?.rev ? TTM(data.quarters.rev) : null;
  const ttmNet = data?.quarters?.net ? TTM(data.quarters.net) : null;
  const ttmOp = data?.quarters?.op ? TTM(data.quarters.op) : null;
  const qPeriods = data?.quarters?.periods?.slice(-9) || [];
  const qRev = data?.quarters?.rev?.slice(-9) || [];
  const qGp = data?.quarters?.gp?.slice(-9) || [];
  const qOp = data?.quarters?.op?.slice(-9) || [];
  const qNet = data?.quarters?.net?.slice(-9) || [];

  // Safety
  const safetyItems = data ? SAFETY_THRESHOLDS.map(t => {
    const v = (data as any)[t.field] as number | null;
    const s = safetyScore(v, t.thresholds, (t as any).reverse);
    return { ...t, v, score: s };
  }) : [];
  const totalSafety = safetyItems.reduce((a, b) => a + b.score, 0);
  const safetyComp = totalSafety >= 3 ? 3 : totalSafety >= 1 ? 4 : totalSafety >= -1 ? 5 : 6;

  // Build-Up R
  const porterWeight = meta.type === "bank" ? 1.0 : 0.4;
  const safetyWeight = meta.type === "bank" ? 0.0 : 0.6;
  const bondRate = meta.type === "bank" || meta.type === "defensive" ? 4.55 : 4.85;
  const R = (porterWeight * porter.comp + safetyWeight * safetyComp + bondRate).toFixed(2);

  // GS Growth (approximate by type)
  const gsMap: Record<string, number> = { bank: 8, defensive: 6, growth: 12, cyclical: 5, realestate: 7 };
  const GS = gsMap[meta.type] || 6;
  const GL = 3;
  const N = 5;
  const Rf = parseFloat(R);

  // 9-box: EPS-based
  const ttmEPS = data?.epv ? (data.epv.base / 10) : null;
  const noGrowthV = ttmEPS && Rf > 0 ? ttmEPS / (Rf / 100) : null;
  const gordonV = noGrowthV && (Rf - GL) > 0 ? noGrowthV * (1 + GL / 100) / ((Rf - GL) / 100) * (Rf / 100) : null;
  const transitV = gordonV && (Rf - GL) > 0 ? gordonV + (ttmEPS ?? 0) * (N / 2) * ((GS - GL) / 100) / ((Rf - GL) / 100) : null;

  const px = data?.px;
  let zone = "";
  if (px && noGrowthV && gordonV && transitV) {
    if (px <= noGrowthV) zone = "Gold";
    else if (px <= (noGrowthV + gordonV) / 2) zone = "Silver";
    else if (px <= transitV) zone = "Bronze";
    else zone = "Expensive";
  }

  const zoneColor = zone === "Gold" ? "text-[#16A34A]" : zone === "Silver" ? "text-[#8C3B32]" : zone === "Bronze" ? "text-[#6B7280]" : "text-[#DC2626]";

  const shariaDeAssets = data?.de_assets;
  const shariaOk = shariaDeAssets != null && shariaDeAssets < 33;

  const displayName = data?.en || meta.name || data?.n || meta.sym;
  const displaySector = data?.sec_en || (data?.sec && !/[\u0600-\u06FF]/.test(data.sec) ? data.sec : meta.label) || "—";

  // ── PDF export (direct jsPDF generator, replaces legacy window.print) ──────
  const handleExportPdf = async () => {
    if (exportingPdf) return;
    if (!data) return;
    try {
      setExportingPdf(true);
      const qRows: { label: string; vals: (number | null)[]; ttm: number | null }[] = [];
      if (qPeriods.length > 0) {
        qRows.push({ label: "Revenue", vals: qRev, ttm: ttmRev });
        if (qGp.length > 0) qRows.push({ label: "Gross Profit", vals: qGp, ttm: null });
        if (qOp.length > 0) qRows.push({ label: "Operating Profit", vals: qOp, ttm: ttmOp });
        qRows.push({ label: "Net Income", vals: qNet, ttm: ttmNet });
      }
      const verdict = meta.type === "bank"
        ? "A bank is read with the banking toolkit (NII/NIM/CASA) — the decision depends on data completeness."
        : zone === "Gold" ? "Gold price below the no-growth value — excellent margin of safety."
          : zone === "Silver" ? "Silver zone — worth following and detailed analysis."
            : zone === "Bronze" ? "Bronze zone — price approaching fair value per GS."
              : "Educational analysis per the course methodology, not an investment recommendation.";
      const payload: CourseReportPdfData = {
        sym: meta.sym,
        name: displayName,
        sec: displaySector,
        typeLabel: meta.label,
        type: meta.type,
        px: data.px ?? null,
        pe: data.pe ?? null,
        pb: data.pb ?? null,
        roe: data.roe ?? null,
        deAssets: data.de_assets ?? null,
        de: data.de ?? null,
        shariaOk: shariaDeAssets != null ? shariaOk : null,
        porterItems: porter.items,
        porterTotal: porter.total,
        porterComp: porter.comp,
        porterLabel: porter.label,
        quarters: { periods: qPeriods, rows: qRows },
        gNet: data.g_net ?? null,
        gs: GS,
        safetyItems: safetyItems.map((it) => ({ label: it.label, v: it.v ?? null, score: it.score, limits: it.labels[0] })),
        totalSafety,
        safetyComp,
        buildUp: { porterWeight, safetyWeight, bondRate, r: R },
        gl: GL,
        n: N,
        epv: data.epv ?? null,
        zone,
        verdict,
        warnings: data.wl || [],
        isBank: meta.type === "bank",
      };
      await generateCourseReportPdf(payload);
    } catch (err) {
      console.error("Failed to generate course report PDF:", err);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 flex flex-wrap items-center gap-4 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div>
          <h2 className="text-lg font-black text-[#1A1A1A] font-mono">{displayName}</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
            <span className="font-mono text-[#8C3B32] font-bold">{meta.sym}</span>
            <span>{displaySector}</span>
            <span className="px-2 py-0.5 bg-[#F3F4F6] rounded text-[10px]">{meta.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {data?.px && <div className="text-center"><div className="text-[#6B7280]">Price</div><div className="text-[#1A1A1A] font-bold text-sm">{data.px.toFixed(2)}</div></div>}
          {data?.pe && <div className="text-center"><div className="text-[#6B7280]">P/E</div><div className="text-[#1A1A1A] font-bold">{data.pe.toFixed(1)}×</div></div>}
          {data?.pb && <div className="text-center"><div className="text-[#6B7280]">P/B</div><div className="text-[#1A1A1A] font-bold">{data.pb.toFixed(2)}×</div></div>}
          {data?.roe && <div className="text-center"><div className="text-[#6B7280]">ROE%</div><div className="text-[#16A34A] font-bold">{data.roe.toFixed(1)}%</div></div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1 text-[11px] text-[#1A1A1A] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] px-3 py-1.5 rounded-[4px] font-bold transition disabled:opacity-60"
          >
            {exportingPdf ? (<><Loader2 size={13} className="animate-spin" />Exporting...</>) : (<><FileDown size={13} />Export PDF</>)}
          </button>
          <Link href={`/rebh/${meta.sym}`} className="flex items-center gap-1.5 text-[11px] text-[#8C3B32] hover:text-[#1A1A1A] border border-[#8C3B32]/30 px-3 py-1.5 rounded-[4px] hover:bg-[#8C3B32]/10 transition">
            <span>Full Company Screen ONE ∞</span><ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Classification Row */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Classification Card</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="px-4 py-2 text-left font-medium">Industry Classification</th>
                <th className="px-4 py-2 text-left font-medium">Market Structure</th>
                <th className="px-4 py-2 text-left font-medium">Boston Life-Cycle Stage</th>
                <th className="px-4 py-2 text-left font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#1A1A1A] font-bold">{meta.label}</td>
                <td className="px-4 py-2.5 text-[#6B7280]">{meta.type === "bank" ? "Oligopoly" : meta.type === "defensive" ? "Oligopoly" : meta.type === "cyclical" ? "Competitive" : "Monopolistic Competition"}</td>
                <td className="px-4 py-2.5 text-[#6B7280]">{meta.type === "growth" ? "Youth / Growth" : "Maturity / Aging"}</td>
                <td className="px-4 py-2.5 text-[#6B7280]">{meta.type === "bank" || meta.type === "defensive" ? "Low" : "Medium"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sharia */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Sharia Compliance <span className="text-[#9CA3AF] font-normal normal-case">Computed quantitative screen</span></h3>
        </div>
        <div className="p-4 text-xs text-[#6B7280] leading-relaxed">
          {data ? (
            <div className="space-y-1">
              <p>
                Debt/Assets°{" "}
                <span className="font-mono font-bold text-[#1A1A1A]">{data.de_assets?.toFixed(1) ?? "—"}%</span>{" "}
                {shariaOk ? <span className="text-[#16A34A]">✅ &lt;33</span> : <span className="text-[#DC2626]">❌ &gt;33</span>}
                {" · "}Debt/Market Cap°{" "}
                <span className="font-mono text-[#1A1A1A]">{data.de?.toFixed(1) ?? "—"}%</span>
                {" · "}Interest income/revenue ≈🔌 (financial statements line — file importer)
                {" · "}Cash &amp; investments ≈🔌
              </p>
              <p className="text-[#8C3B32] font-bold mt-2">The final verdict rests with your own committee (standards differ between committees — course rule).</p>
            </div>
          ) : (
            <span className="text-[#9CA3AF]">Requires company data from the database.</span>
          )}
        </div>
      </div>

      {/* Porter 5 Forces */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Michael Porter's Five Forces <span className="text-[#9CA3AF] font-normal normal-case">0–1 per force — never exactly zero or one (course rule)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="px-4 py-2 text-left">Force</th>
                <th className="px-4 py-2 text-right font-mono">Score</th>
                <th className="px-4 py-2 text-left">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {porter.items.map((item, i) => (
                <tr key={i} className="hover:bg-[#F3F4F6]">
                  <td className="px-4 py-2.5 text-[#1A1A1A] font-medium">{item.q}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32] font-bold">{item.v.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{item.reason}</td>
                </tr>
              ))}
              <tr className="bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#8C3B32] font-black">Total → Premium</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32] font-black">{porter.total.toFixed(2)}/5</td>
                <td className="px-4 py-2.5 text-[#6B7280]">{porter.label}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 9 Quarters Financials */}
      {qPeriods.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">
              Financial Statements — Realized Quarters° <span className="text-[#9CA3AF] font-normal normal-case">9 discrete quarters verified by identity checks · SAR millions</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left min-w-[110px] sticky left-0 bg-[#F3F4F6] z-10">Line Item</th>
                  {qPeriods.map((p, i) => <th key={i} className="px-3 py-2 text-right whitespace-nowrap">{i === qPeriods.length - 1 ? <b className="text-[#1A1A1A]">{p}</b> : p}</th>)}
                  <th className="px-3 py-2 text-right bg-[#F3F4F6] text-[#8C3B32] font-bold">TTM°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { label: "Revenue", vals: qRev, ttm: ttmRev },
                  ...(qGp.length > 0 ? [{ label: "Gross Profit", vals: qGp, ttm: null }] : []),
                  ...(qOp.length > 0 ? [{ label: "Operating Profit", vals: qOp, ttm: ttmOp }] : []),
                  { label: "Net Income", vals: qNet, ttm: ttmNet },
                ].map((row, ri) => (
                  <tr key={ri} className={`hover:bg-[#F3F4F6] ${ri === 3 ? "bg-[#F3F4F6]" : ""}`}>
                    <td className={`px-3 py-2 text-[#1A1A1A] font-bold font-sans sticky left-0 z-10 ${ri === 3 ? "bg-[#F3F4F6]" : "bg-[#FFFFFF]"}`}>{row.label}</td>
                    {row.vals.map((v, vi) => (
                      <td key={vi} className={`px-3 py-2 text-right tabular-nums ${v != null && v < 0 ? "text-[#DC2626]" : "text-[#6B7280]"}`}>
                        {v != null ? Math.round(v).toLocaleString() : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-bold text-[#1A1A1A] bg-[#F3F4F6]">
                      {row.ttm != null ? Math.round(row.ttm).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Growth */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Growth <span className="text-[#9CA3AF] font-normal normal-case">Determination by elimination first — Lecture 16 rule</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right font-mono">Value</th>
                <th className="px-4 py-2 text-left">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Simple (latest period)</td>
                <td className={`px-4 py-2.5 text-right font-mono font-bold ${data?.g_net != null && data.g_net >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{fmtPct(data?.g_net)}</td>
                <td className="px-4 py-2.5 text-[#9CA3AF]">Net income, year-over-year</td>
              </tr>
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Compound CAGR 3–6 years</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32]">🔌</td>
                <td className="px-4 py-2.5 text-[#9CA3AF]">Requires deepening history to pre-2020 — queued in developer tasks</td>
              </tr>
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Earning Power° (DuPont)</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32]">
                  {data?.roe ? `${data.roe.toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-2.5 text-[#9CA3AF]">
                  NPM {data?.nm?.toFixed(1) ?? "—"}% × computed turnover × financial leverage
                </td>
              </tr>
              <tr className="bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#8C3B32] font-black">Adopted GS</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32] font-black">{GS}.0%</td>
                <td className="px-4 py-2.5 text-[#6B7280]">Conservative transitional growth adopted by company type and course methodology</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Elements */}
      {meta.type !== "bank" && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Financial Safety Elements <span className="text-[#9CA3AF] font-normal normal-case">Color scoring +1/0/−1 using the course's literal thresholds</span></h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="px-4 py-2 text-left">Element</th>
                  <th className="px-4 py-2 text-right font-mono">Value</th>
                  <th className="px-4 py-2 text-left">Thresholds</th>
                  <th className="px-4 py-2 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {safetyItems.map((item, i) => (
                  <tr key={i} className="hover:bg-[#F3F4F6]">
                    <td className="px-4 py-2.5 text-[#6B7280]">{item.label}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${item.score > 0 ? "text-[#16A34A]" : item.score === 0 ? "text-[#8C3B32]" : "text-[#DC2626]"}`}>
                      {item.v != null ? item.v.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#9CA3AF]">{item.labels[0]}</td>
                    <td className="px-4 py-2.5 text-center"><ScoreChip score={item.score} /></td>
                  </tr>
                ))}
                <tr className="bg-[#F3F4F6]">
                  <td colSpan={2} className="px-4 py-2.5 text-[#8C3B32] font-black">Total → Premium</td>
                  <td colSpan={2} className="px-4 py-2.5 text-right font-mono text-[#8C3B32] font-black">{totalSafety} → {safetyComp}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Build-Up R */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Required Return — Build-Up <span className="text-[#9CA3AF] font-normal normal-case">Bond yield by rating + weighted premiums · course range 4–12%</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-right font-mono">Weight</th>
                <th className="px-4 py-2 text-right font-mono">Premium</th>
                <th className="px-4 py-2 text-right font-mono">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Porter Forces ({porter.total.toFixed(2)}/5)</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{(porterWeight * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{porter.comp}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{(porterWeight * porter.comp).toFixed(2)}%</td>
              </tr>
              {meta.type !== "bank" && (
                <tr className="hover:bg-[#F3F4F6]">
                  <td className="px-4 py-2.5 text-[#6B7280]">Safety Elements ({totalSafety})</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{(safetyWeight * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{safetyComp}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{(safetyWeight * safetyComp).toFixed(2)}%</td>
                </tr>
              )}
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Bond Yield (≈ A/BBB)</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#9CA3AF]">—</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#9CA3AF]">—</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{bondRate}%</td>
              </tr>
              <tr className="bg-[#F3F4F6]">
                <td colSpan={3} className="px-4 py-2.5 text-[#8C3B32] font-black">Required R</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8C3B32] font-black">{R}% ✅ Within 4–12</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3 text-[10px] text-[#9CA3AF]">
          GL={GL}% (Gulf 3–5) · N={N}: stated strategy horizon · The bond anchor is an approximate SAR yield — the company's own sukuk yield is preferable when available 🔌
        </div>
      </div>

      {/* 9-Box Matrix */}
      {data?.epv && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Nine-Box Matrix — Price Zones° <span className="text-[#9CA3AF] font-normal normal-case">Literal course equations</span></h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#9CA3AF] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  <th className="px-4 py-2 text-left">Lens (per share, SAR)</th>
                  <th className="px-4 py-2 text-right font-mono">No Growth X/R</th>
                  <th className="px-4 py-2 text-right font-mono">Gordon GL</th>
                  <th className="px-4 py-2 text-right font-mono">Transitional GS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr className="hover:bg-[#F3F4F6]">
                  <td className="px-4 py-2.5 text-[#6B7280]">From EPV (static)</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{fmt(data.epv.bear, 2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{fmt(data.epv.base, 2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A]">{fmt(data.epv.bull, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#E5E7EB] flex flex-wrap gap-4 items-center text-xs">
            <div>
              <span className="text-[#9CA3AF]">Current Price: </span>
              <span className="text-[#1A1A1A] font-mono font-bold">{data.px?.toFixed(2) ?? "—"}</span>
            </div>
            {zone && (
              <div>
                <span className="text-[#9CA3AF]">Zone: </span>
                <span className={`font-bold ${zoneColor}`}>{zone}</span>
              </div>
            )}
            <div>
              <span className="text-[#9CA3AF]">vs. EPV Base: </span>
              <span className={`font-mono font-bold ${(data.epv.vs ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                {fmtPct(data.epv.vs)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {data?.wl && data.wl.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Red Flags° &amp; Buy Gate</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.wl.map(([type, msg], i) => (
              <div key={i} className={`flex items-start gap-2.5 text-xs p-2.5 rounded-[4px] border ${type === "w" ? "bg-[#FBEFEC] border-[#F0DDD6] text-[#8C3B32]" : "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"}`}>
                <span className="font-bold">{type === "w" ? "⚑" : "✓"}</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] px-4 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wider">Conclusion &amp; Decision <span className="text-[#9CA3AF] font-normal normal-case">In course format — educational analysis, not an investment recommendation</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Required Return R</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A] font-bold">{R}%</td>
              </tr>
              <tr className="hover:bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#6B7280]">Adopted Transitional Growth GS</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#1A1A1A] font-bold">{GS}.0%</td>
              </tr>
              {zone && (
                <tr className="hover:bg-[#F3F4F6]">
                  <td className="px-4 py-2.5 text-[#6B7280]">Price Zone</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${zoneColor}`}>{zone}</td>
                </tr>
              )}
              <tr className="bg-[#F3F4F6]">
                <td className="px-4 py-2.5 text-[#8C3B32] font-black">Verdict</td>
                <td className="px-4 py-2.5 text-[#6B7280]">
                  {meta.type === "bank" ? "A bank is read with the banking toolkit (NII/NIM/CASA) — the decision depends on data completeness." :
                    zone === "Gold" ? "Gold price below the no-growth value — excellent margin of safety." :
                      zone === "Silver" ? "Silver zone — worth following and detailed analysis." :
                        zone === "Bronze" ? "Bronze zone — price approaching fair value per GS." :
                          "Educational analysis per the course methodology, not an investment recommendation."}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3 text-[10px] text-[#9CA3AF]">This is educational analysis per the course methodology and is not an investment recommendation.</div>
      </div>
    </div>
  );
}