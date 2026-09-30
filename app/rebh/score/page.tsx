"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2, ShieldCheck, Award, Star, FileDown, Loader2,
  Copy, Check, FileText, ChevronRight, BarChart2, BookOpen,
  CheckSquare, AlertTriangle, Filter, ChevronDown
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { generateScorecardPdf, ScorecardPdfData } from "./components/exportpdf";

// ─── 35 Advisor Rows ──────────────────────────────────────────────────────────
type School =
  | "fundamental"
  | "macro"
  | "quant"
  | "technical"
  | "method"
  | "platform";

interface AdvisorRow {
  id: number;
  school: School;
  advisor: string;
  advisorEn: string;
  demand: string;
  platformAnswer: string;
  where: string;
  score: 10;
}

const ADVISORS: AdvisorRow[] = [
  // ── Fundamental School ────────────────────────────────────────────────────
  {
    id: 1, school: "fundamental",
    advisor: "Benjamin Graham", advisorEn: "Benjamin Graham",
    demand: "Computed margin of safety · P/B < 1 · NCAV screen · buying a dollar for fifty cents",
    platformAnswer: "The platform computes Margin of Safety % from the Nine-Box · NCAV · live P/B from the database",
    where: "/rebh/company · /rebh/analyst · Nine-Box",
    score: 10,
  },
  {
    id: 2, school: "fundamental",
    advisor: "Warren Buffett", advisorEn: "Warren Buffett",
    demand: "ROE > 15% · earnings durability · competitive moat · honest management",
    platformAnswer: "ROE computed from XBRL · Piotroski F-Score · BCG Stage · Porter 5 Forces",
    where: "/rebh/analyst · /rebh/xray · /rebh/score",
    score: 10,
  },
  {
    id: 3, school: "fundamental",
    advisor: "Peter Lynch", advisorEn: "Peter Lynch",
    demand: "PEG < 1 · EPS growth · understanding the business story",
    platformAnswer: "PEG computed dynamically · EPS growth YoY · narrative story from X-Ray",
    where: "/rebh/xray · /rebh/analyst",
    score: 10,
  },
  {
    id: 4, school: "fundamental",
    advisor: "Philip Fisher", advisorEn: "Philip Fisher",
    demand: "Long-run sales growth · sustainable net profit margin · visionary management",
    platformAnswer: "5 years of revenue and margin data · historical sparklines",
    where: "/rebh/xray (trend sparklines) · /rebh/studio",
    score: 10,
  },
  {
    id: 5, school: "fundamental",
    advisor: "John Neff", advisorEn: "John Neff",
    demand: "Low P/E + growth + high dividends",
    platformAnswer: "Live P/E + net income growth rate + Dividend Yield from the company engine",
    where: "/rebh/company · /rebh/analyst (valuation)",
    score: 10,
  },
  {
    id: 6, school: "fundamental",
    advisor: "Seth Klarman", advisorEn: "Seth Klarman",
    demand: "Forensic review of financial statements · avoiding manipulators · wide margin of safety",
    platformAnswer: "Beneish M-Score · Piotroski · Red Flags · Quarantine System",
    where: "/rebh/xray · /rebh/score · Quarantine",
    score: 10,
  },
  {
    id: 7, school: "fundamental",
    advisor: "Charlie Munger", advisorEn: "Charlie Munger",
    demand: "A wonderful company at a fair price, not a fair company at a wonderful price · compounding returns",
    platformAnswer: "The Nine-Box evaluates compounded returns over 5–10 years from FCF / EPS / dividends",
    where: "/rebh/company (Nine-Box) · /rebh/analyst",
    score: 10,
  },
  // ── Macro School ──────────────────────────────────────────────────────────
  {
    id: 8, school: "macro",
    advisor: "George Soros", advisorEn: "George Soros",
    demand: "Identifying the inflection point · reflexivity · studying the market as a system",
    platformAnswer: "The Reverse DCF engine reveals the growth rate embedded in the price · Zone System",
    where: "/rebh/company (Reverse DCF) · /rebh/analyst",
    score: 10,
  },
  {
    id: 9, school: "macro",
    advisor: "Ray Dalio", advisorEn: "Ray Dalio",
    demand: "Portfolio balance · sector diversification · volatility management",
    platformAnswer: "Coverage of 21 GICS sectors · sector scores · correlation check",
    where: "/rebh/company (sector) · /rebh/score",
    score: 10,
  },
  {
    id: 10, school: "macro",
    advisor: "Mark Mobius", advisorEn: "Mark Mobius",
    demand: "Emerging markets · corporate governance · market liquidity",
    platformAnswer: "Shariah compliance screen · XBRL governance · trading volume from the price database",
    where: "/rebh/company · /rebh/score (governance)",
    score: 10,
  },
  {
    id: 11, school: "macro",
    advisor: "Jim Rogers", advisorEn: "Jim Rogers",
    demand: "Investing in commodities and cyclical sectors",
    platformAnswer: "The Cyclical Bands Engine computes buy/sell ranges for cyclical stocks",
    where: "/rebh/company (Cyclical Bands)",
    score: 10,
  },
  // ── Quant School ──────────────────────────────────────────────────────────
  {
    id: 12, school: "quant",
    advisor: "Joel Greenblatt", advisorEn: "Joel Greenblatt",
    demand: "Magic Formula: EBIT/EV + ROIC · market ranking",
    platformAnswer: "Magic Formula computed from XBRL · ROIC · EBIT/EV · ranking within the universe",
    where: "/rebh/company (Magic Formula) · /rebh/analyst",
    score: 10,
  },
  {
    id: 13, school: "quant",
    advisor: "James Simons", advisorEn: "James Simons",
    demand: "Statistical patterns · high-quality data · data purity",
    platformAnswer: "XBRL Parser + Balance Identity Check + Forensic Audit = clean, documented data",
    where: "/rebh/score · /rebh/xray · forensic_service",
    score: 10,
  },
  {
    id: 14, school: "quant",
    advisor: "Eugene Fama", advisorEn: "Eugene Fama",
    demand: "Factors: value · size · momentum · quality",
    platformAnswer: "P/B · P/E · ROE · EPS Growth · Piotroski generate multiple factors",
    where: "/rebh/analyst (ratios) · /rebh/score",
    score: 10,
  },
  {
    id: 15, school: "quant",
    advisor: "Richard Thaler", advisorEn: "Richard Thaler",
    demand: "Behavioral bias · neglect of unloved stocks",
    platformAnswer: "The Quarantine System prevents emotional analysis · strict data governance",
    where: "/rebh/score (quarantine) · /rebh/xray",
    score: 10,
  },
  {
    id: 16, school: "quant",
    advisor: "Joseph Piotroski", advisorEn: "Joseph Piotroski",
    demand: "Full 9-point F-Score from real financial statements",
    platformAnswer: "F-Score computed entirely from XBRL · 9 points: profitability + liquidity + efficiency + leverage",
    where: "/rebh/company · /rebh/xray",
    score: 10,
  },
  {
    id: 17, school: "quant",
    advisor: "Messod Beneish", advisorEn: "Messod Beneish",
    demand: "M-Score as an accounting manipulation detector",
    platformAnswer: "Beneish M-Score computed from 8 XBRL indicators · danger threshold −1.78 (the platform's adopted standard)",
    where: "/rebh/xray · /rebh/company",
    score: 10,
  },
  {
    id: 18, school: "quant",
    advisor: "Edward Altman", advisorEn: "Edward Altman",
    demand: "Z-Score for bankruptcy prediction",
    platformAnswer: "Altman Z-Score computed from the balance sheet, income statement and market price",
    where: "/rebh/company · /rebh/xray",
    score: 10,
  },
  // ── Technical School ──────────────────────────────────────────────────────
  {
    id: 19, school: "technical",
    advisor: "William O'Neil", advisorEn: "William O'Neil",
    demand: "CANSLIM: C · A · N · S · L · I · M",
    platformAnswer: "EPS TTM · EPS YoY · sales growth · market leadership · institutional sponsorship",
    where: "/rebh/analyst · /rebh/studio (price action)",
    score: 10,
  },
  {
    id: 20, school: "technical",
    advisor: "Martin Pring", advisorEn: "Martin Pring",
    demand: "Integrated technical analysis · momentum indicators",
    platformAnswer: "Price Action Mode: SMA-20 · Volume Bars · Area Chart in Chart Studio",
    where: "/rebh/studio (price action mode)",
    score: 10,
  },
  {
    id: 21, school: "technical",
    advisor: "Stan Weinstein", advisorEn: "Stan Weinstein",
    demand: "Stage Analysis",
    platformAnswer: "The BCG Stage Engine classifies the company (Growth/Mature/Question/Dog)",
    where: "/rebh/company (BCG stage) · /rebh/xray",
    score: 10,
  },
  // ── Method Masters ────────────────────────────────────────────────────────
  {
    id: 22, school: "method",
    advisor: "Aswath Damodaran", advisorEn: "Aswath Damodaran",
    demand: "DCF · data-driven discount rate · Reverse DCF",
    platformAnswer: "Build-Up Required Return from Sukuk + Porter + Safety · Reverse DCF reveals the implied growth rate",
    where: "/rebh/company (Reverse DCF + Build-Up)",
    score: 10,
  },
  {
    id: 23, school: "method",
    advisor: "Michael Mauboussin", advisorEn: "Michael Mauboussin",
    demand: "Competitive advantage · ROIC vs WACC · intrinsic value analysis",
    platformAnswer: "ROIC computed · Porter 5 Forces · the Nine-Box computes value from ROIC and competitive-advantage period",
    where: "/rebh/company · /rebh/analyst (ratios)",
    score: 10,
  },
  {
    id: 24, school: "method",
    advisor: "Howard Marks", advisorEn: "Howard Marks",
    demand: "Market cycles · risk assessment · codified margin of safety",
    platformAnswer: "Zone System: Gold/Silver/Bronze · Margin of Safety % · Risk Flags",
    where: "/rebh/company (Zones) · /rebh/score",
    score: 10,
  },
  {
    id: 25, school: "method",
    advisor: "Mohnish Pabrai", advisorEn: "Mohnish Pabrai",
    demand: "Dhandho: buying simple businesses at very low prices",
    platformAnswer: "Buy Gate Evaluation · Quarantine · NCAV Screen · Net-Net Check",
    where: "/rebh/company (Buy Gate) · /rebh/score",
    score: 10,
  },
  {
    id: 26, school: "method",
    advisor: "Pat Dorsey", advisorEn: "Pat Dorsey",
    demand: "Economic moat: networks · switching costs · intangible assets",
    platformAnswer: "Porter 5 Forces quantified · BCG Stage · predictability score",
    where: "/rebh/company (Porter) · /rebh/analyst",
    score: 10,
  },
  {
    id: 27, school: "method",
    advisor: "Thomas Philips", advisorEn: "Thomas Philips",
    demand: "Owner's Earnings · true owner FCF",
    platformAnswer: "Owner Yield computed = FCF / Market Cap · FCF = CFO − CapEx from XBRL",
    where: "/rebh/company · /rebh/xray (money river)",
    score: 10,
  },
  {
    id: 28, school: "method",
    advisor: "Christopher Mayer", advisorEn: "Christopher Mayer",
    demand: "100-Bagger: compounding growth without one-off profits · founder-led",
    platformAnswer: "EPS TTM growth + Retained Earnings trend + 5Y predictability",
    where: "/rebh/analyst · /rebh/xray (sparklines)",
    score: 10,
  },
  // ── Platform Benchmark ────────────────────────────────────────────────────
  {
    id: 29, school: "platform",
    advisor: "IFRS / XBRL Standard", advisorEn: "IFRS / XBRL Standard",
    demand: "Conformance with international financial reporting standards · documented XML data",
    platformAnswer: "XBRL Parser reads official Tadawul files · A = L + E check · corrupted values blocked",
    where: "/rebh/score · forensic_service.py · xbrl_data_service.py",
    score: 10,
  },
  {
    id: 30, school: "platform",
    advisor: "CFA Institute", advisorEn: "CFA Institute",
    demand: "Data integrity · full disclosure · no manipulation of figures",
    platformAnswer: "Every ratio carries its source · every estimate is tagged · ° ≈ ⚑ 🔌 marks on every value",
    where: "/rebh/analyst (formula traceability) · /rebh/score",
    score: 10,
  },
  {
    id: 31, school: "platform",
    advisor: "Saudi Capital Market Authority (CMA)", advisorEn: "Saudi CMA",
    demand: "Compliance with Saudi disclosure regulations · official Tadawul data only",
    platformAnswer: "Data sourced exclusively from the official Tadawul platform · no unapproved data",
    where: "xbrl_data_service.py · forensic_service.py",
    score: 10,
  },
  {
    id: 32, school: "platform",
    advisor: "Banking Governance Standards (Basel III)", advisorEn: "Basel III",
    demand: "Separate valuation model for banks · NIM · LDR · CASA",
    platformAnswer: "Bank Metrics Engine: NIM · LDR · CASA · Cost of Risk · Provisions/Revenue",
    where: "/rebh/company (BankMetrics) · /rebh/analyst",
    score: 10,
  },
  {
    id: 33, school: "platform",
    advisor: "Shariah Compliance Standard", advisorEn: "Shariah Compliance",
    demand: "Debt ratio · impermissible income · illiquid assets",
    platformAnswer: "Shariah Compliance: debt/mc % · interest_income_pct · illiquid_assets_pct",
    where: "/rebh/company (Shariah) · /rebh/score",
    score: 10,
  },
  {
    id: 34, school: "platform",
    advisor: "Forensic Integrity Standard (Forensic Finance)", advisorEn: "Forensic Finance",
    demand: "Detecting accounting manipulation · verifiable cash · accruals signals",
    platformAnswer: "Beneish + Piotroski + CFO/NI check + Red Flag Engine + Quarantine",
    where: "/rebh/xray · /rebh/score · forensic_service",
    score: 10,
  },
  {
    id: 35, school: "platform",
    advisor: "Academic Investor UX Standard", advisorEn: "Academic Investor UX",
    demand: "Specialized screens · formula traceability · professional language",
    platformAnswer: "Analyst + Studio + X-Ray + Score + One + Company — 6 specialized screens",
    where: "/rebh/* — the full platform",
    score: 10,
  },
];

const SCHOOL_META: Record<School, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  fundamental: { label: "Fundamental School", labelEn: "Fundamental School", color: "text-[#1D4ED8]", bg: "bg-[#EFF6FF]", border: "border-[#BFDBFE]" },
  macro: { label: "Macro School", labelEn: "Macro School", color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]", border: "border-[#DDD6FE]" },
  quant: { label: "Quant School", labelEn: "Quant School", color: "text-[#0D9488]", bg: "bg-[#F0FDFA]", border: "border-[#99F6E4]" },
  technical: { label: "Technical Analysis", labelEn: "Technical Analysis", color: "text-[#B45309]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]" },
  method: { label: "Method Masters", labelEn: "Method Masters", color: "text-[#9D174D]", bg: "bg-[#FDF2F8]", border: "border-[#FBCFE8]" },
  platform: { label: "Platform Benchmark", labelEn: "Platform Benchmark", color: "text-[#166534]", bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]" },
};

// ─── Evidence map labels ──────────────────────────────────────────────────────
const EVIDENCE_LABEL: Record<string, string> = {
  forensic_pass: "Forensic Pass", total_universe: "Total Universe",
  fresh_companies: "Fresh Statements", stale_quarantined: "Quarantined",
  live_price_symbols: "Live Prices", sectors_unique: "Sectors",
  pass_count: "Passed", coverage_pct: "Coverage %",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RebhCouncilScorecardPage() {
  const [liveData, setLiveData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<School | "all">("all");
  const [search, setSearch] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/scorecard`);
        if (res.ok) setLiveData(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    fetchScorecard();
  }, []);

  const filtered = useMemo(() => {
    let rows = ADVISORS;
    if (filter !== "all") rows = rows.filter(r => r.school === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.advisor.toLowerCase().includes(q) ||
        r.advisorEn.toLowerCase().includes(q) ||
        r.demand.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [filter, search]);

  const handleCopy = () => {
    const lines = ADVISORS.map(a =>
      `[${a.id}] ${a.advisor} (${a.advisorEn}) | ${a.demand} | ${a.platformAnswer} | ${a.score}/10`
    );
    navigator.clipboard.writeText(["REBH Platform Coverage Scorecard — 35 Requirements", ...lines].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // School counts
  const schoolCounts = useMemo(() =>
    Object.keys(SCHOOL_META).reduce((acc, k) => {
      acc[k] = ADVISORS.filter(a => a.school === k).length;
      return acc;
    }, {} as Record<string, number>)
    , []);

  // ── PDF export (direct jsPDF generator, replaces legacy window.print) ──────
  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      const groups = (Object.keys(SCHOOL_META) as School[]).map((k) => ({
        label: SCHOOL_META[k].label,
        labelEn: SCHOOL_META[k].labelEn,
        rows: ADVISORS.filter((a) => a.school === k),
      }));
      const payload: ScorecardPdfData = { groups, liveData: liveData ?? null };
      await generateScorecardPdf(payload);
    } catch (err) {
      console.error("Failed to generate scorecard PDF:", err);
      alert("An error occurred while generating the PDF file. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28 print:bg-white">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] print:hidden">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">SCORECARD</span>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">Platform Coverage Scorecard · 35 Requirements</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151]">
            {copied ? <Check size={13} className="text-[#16A34A]" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={handleExportPdf} disabled={exportingPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold disabled:opacity-60">
            {exportingPdf ? (<><Loader2 size={13} className="animate-spin" />Exporting...</>) : (<><FileDown size={13} />Export (PDF)</>)}
          </button>
        </div>
      </header>

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <section className="bg-[#0F172A] text-white px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 text-[#4ADE80] text-xs font-bold font-mono">
              <ShieldCheck size={14} />
              Platform Coverage Matrix · 35 Advisory Requirements
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Platform Coverage Scorecard
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              35 investment advisors and institutional standards · each with a specific requirement ·
              the platform documents how it answers each one — <strong className="text-white">a documented coverage matrix</strong>, not an independently computed score for each advisor
            </p>
            <p className="text-[11px] font-mono text-[#64748B] border border-[#334155] rounded-[4px] px-3 py-1.5 inline-block">
              ⚠ This Scorecard evaluates platform coverage, not any individual stock — a score of 10 means the tool is available, not that every stock is a suitable buy
            </p>
          </div>

          {/* Grand score display */}
          <div className="shrink-0 text-center bg-white/5 border border-white/10 rounded-[8px] px-8 py-6 space-y-2">
            <span className="block text-[11px] font-mono text-[#94A3B8]">Documented Requirements</span>
            <div className="text-5xl font-black font-mono text-[#4ADE80]">35</div>
            <div className="text-base font-bold text-white">Requirements × Documented Coverage</div>
            <div className="text-[11px] font-mono text-[#4ADE80] mt-1">
              Platform coverage matrix ✓
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE PLATFORM STATS (from backend) ───────────────────────────── */}
      {!loading && liveData && (
        <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold text-[#94A3B8] mb-3 font-mono">Live database figures (computed at: {liveData.computed_at ?? "—"})</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Company Universe", val: liveData.total_coverage, unit: "companies" },
                { label: "Passed Screening", val: liveData.pass_count, unit: "companies" },
                { label: "Quarantined (Too-Hard Pile)", val: liveData.stale_quarantined, unit: "companies" },
                { label: "Live Market Prices", val: liveData.live_price_symbols, unit: "symbols" },
                { label: "Unique Sectors", val: liveData.sectors_unique, unit: "sectors" },
              ].map((s, i) => (
                <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-[#64748B]">{s.label}</span>
                  <span className="font-mono font-black text-xs text-[#0F172A]">{s.val ?? "—"} {s.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SCHOOL FILTER + SEARCH ────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold border transition-colors ${filter === "all" ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
            >
              All ({ADVISORS.length})
            </button>
            {(Object.keys(SCHOOL_META) as School[]).map(k => {
              const m = SCHOOL_META[k];
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-bold border transition-colors ${filter === k ? `${m.bg} ${m.color} ${m.border}` : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
                >
                  {m.label} ({schoolCounts[k]})
                </button>
              );
            })}
          </div>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by advisor or requirement…"
            className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] bg-[#F9FAFB] w-52"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── ADVISOR TABLE ────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Award size={14} className="text-[#8C3B32]" />
              Advisor Table — {filtered.length} {filtered.length === 1 ? "row" : "rows"}
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">Every row: Score = 10/10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-2.5 text-left font-bold text-[#475569] w-8">#</th>
                  <th className="p-2.5 text-left font-bold text-[#475569] min-w-[120px]">Advisor</th>
                  <th className="p-2.5 text-left font-bold text-[#475569] min-w-[80px]">School</th>
                  <th className="p-2.5 text-left font-bold text-[#475569] min-w-[200px]">Core Requirement</th>
                  <th className="p-2.5 text-left font-bold text-[#475569] min-w-[220px]">Platform Answer</th>
                  <th className="p-2.5 text-left font-bold text-[#475569] min-w-[160px]">Location</th>
                  <th className="p-2.5 text-center font-bold text-[#475569] w-16">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map(row => {
                  const sm = SCHOOL_META[row.school];
                  return (
                    <tr key={row.id} className="hover:bg-[#FFFBF9] group transition-colors">
                      <td className="p-2.5 text-left">
                        <span className="font-mono font-bold text-[#94A3B8]">{row.id}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="block font-bold text-[#0F172A]">{row.advisor}</span>
                        {row.advisorEn !== row.advisor && (
                          <span className="block text-[10px] font-mono text-[#6B7280]">{row.advisorEn}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.color} ${sm.border}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#374151] leading-relaxed">{row.demand}</td>
                      <td className="p-2.5 text-[#374151] leading-relaxed">{row.platformAnswer}</td>
                      <td className="p-2.5">
                        <span className="block font-mono text-[10px] text-[#8C3B32] leading-relaxed">{row.where}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] font-mono font-black text-[#16A34A] text-xs">
                          10
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                    <td colSpan={6} className="p-3 text-left text-xs font-bold text-[#0F172A]">
                      Total Score ({filtered.length} {filtered.length === 1 ? "advisor" : "advisors"})
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-sm text-[#16A34A]">
                        {filtered.length * 10}/{filtered.length * 10}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── SCHOOL BREAKDOWN CARDS ────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <BookOpen size={14} className="text-[#8C3B32]" />
            Investment School Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(SCHOOL_META) as [School, typeof SCHOOL_META[School]][]).map(([k, m]) => (
              <div
                key={k}
                className={`rounded-[6px] border ${m.border} ${m.bg} p-4 text-center cursor-pointer hover:shadow-sm transition-all`}
                onClick={() => setFilter(k === filter ? "all" : k)}
              >
                <span className={`block text-2xl font-black font-mono ${m.color}`}>{schoolCounts[k]}</span>
                <span className={`block text-[11px] font-bold mt-1 ${m.color}`}>{m.label}</span>
                {m.labelEn !== m.label && (
                  <span className="block text-[10px] font-mono text-[#94A3B8] mt-0.5">{m.labelEn}</span>
                )}
                <span className={`block text-[10px] font-bold mt-1 ${m.color}`}>
                  {schoolCounts[k] * 10}/{schoolCounts[k] * 10}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── LIVE 10-DIMENSION DATA (from backend) ────────────────────── */}
        {!loading && liveData?.categories?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <CheckSquare size={14} className="text-[#8C3B32]" />
              The Ten Verified Dimensions — Live Platform Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveData.categories.map((cat: any) => (
                <div key={cat.id} className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8C3B32] text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">{cat.id}</span>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{cat.nameEn || cat.name}</h4>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-[#16A34A] shrink-0">{cat.score}/{cat.max} ✓</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">{cat.detail}</p>
                  {cat.evidence && Object.keys(cat.evidence).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(cat.evidence).map(([k, v]: [string, any]) => (
                        <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[9px] font-mono text-[#334155]">
                          <span className="text-[#64748B]">{EVIDENCE_LABEL[k] ?? k}:</span>
                          <strong>{typeof v === "number" && !Number.isInteger(v) ? v.toFixed(1) : String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] border-t border-[#F8FAFC] pt-1.5">
                    <span className="text-[#64748B]">Authority Reference</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{cat.authority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCLAIMER + NAVIGATION ──────────────────────────────────── */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] p-5 space-y-3">
          <h4 className="text-xs font-bold text-[#92400E] flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#D97706]" />
            Disclaimer — Please Read
          </h4>
          <ul className="space-y-1.5 text-xs text-[#78350F]">
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              This Scorecard evaluates the platform as an analytical tool and does not constitute a recommendation to buy or sell any stock.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              A 10/10 score means the platform provides a complete set of analytical tools — investing is a personal decision that carries risk.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              Live database figures reflect the time of computation — they may change as official financial statements are updated.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              This platform is an academic investment benchmark and does not replace accredited Shariah committees or certified financial advisors.
            </li>
          </ul>
        </div>

        {/* Nav footer */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div>
            <p className="font-bold text-[#0F172A]">Explore the Platform</p>
            <p className="text-[#64748B] mt-0.5">Each screen answers a different advisor requirement</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {[
              { href: "/rebh/analyst/2222", label: "Analyst" },
              { href: "/rebh/xray/2222", label: "X-Ray" },
              { href: "/rebh/studio/2222", label: "Studio" },
              { href: "/rebh/company/2222", label: "Full Company View", primary: true },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors ${l.primary ? "bg-[#8C3B32] hover:bg-[#752f28] text-white" : "bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#374151]"}`}>
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB] print:mt-8">
        <p>REBH Platform — Platform Coverage Scorecard · 35 Documented Requirements</p>
        <p className="mt-0.5">This score evaluates the platform as an analytical tool · it is not an investment recommendation for any stock</p>
      </footer>
    </div>
  );
}