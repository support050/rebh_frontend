"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileSpreadsheet, Search, ArrowUpRight, ArrowDownRight,
  BarChart3, Printer, AlertTriangle, ShieldCheck, RefreshCw,
  Info, ChevronRight, CheckCircle2, XCircle, Minus,
  TrendingUp, Layers, Activity, BookOpen
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "is" | "bs" | "cf" | "ratios";
type SectorTemplate = "industrial" | "bank" | "reit";

// ─── Formula definitions (shown under each ratio) ─────────────────────────────
const FORMULAS: Record<string, { formula: string; source: string; note?: string }> = {
  roe:    { formula: "صافي الربح ÷ إجمالي حقوق المساهمين × 100", source: "قائمة الدخل + الميزانية العمومية", note: "مؤشر العائد على ملكية المساهمين — كلما ارتفع كان أفضل (مع الحذر من الرافعة المالية العالية)" },
  gm:     { formula: "(إجمالي الربح ÷ الإيرادات) × 100", source: "قائمة الدخل", note: "هامش الربح الإجمالي — يكشف قوة التسعير وكفاءة الإنتاج" },
  nm:     { formula: "(صافي الربح ÷ الإيرادات) × 100", source: "قائمة الدخل", note: "هامش الربح الصافي — النسبة المتبقية للمساهم بعد كل المصاريف" },
  opm:    { formula: "(الربح التشغيلي ÷ الإيرادات) × 100", source: "قائمة الدخل", note: "هامش التشغيل — يقيس ربحية النشاط التشغيلي قبل الفوائد والضرائب" },
  pe:     { formula: "القيمة السوقية ÷ صافي الربح السنوي (TTM)", source: "سعر السوق + قائمة الدخل", note: "مضاعف الأرباح — كلما انخفض دل على تقييم أفضل (مع تحفظ على الشركات الخاسرة)" },
  pb:     { formula: "القيمة السوقية ÷ إجمالي حقوق المساهمين", source: "سعر السوق + الميزانية", note: "مضاعف القيمة الدفترية — P/B < 1 قد يعني تقييماً منخفضاً أو ضعفاً هيكلياً" },
  peg:    { formula: "P/E ÷ معدل نمو صافي الربح السنوي %", source: "قائمة الدخل + سعر السوق", note: "مضاعف النمو (Lynch) — PEG < 1 علامة إيجابية وفق منهجية Lynch" },
  current:{ formula: "الأصول المتداولة ÷ الالتزامات المتداولة", source: "الميزانية العمومية", note: "نسبة التداول — المقبول أعلى من 1.5×" },
  debt_eq:{ formula: "إجمالي الديون ÷ إجمالي حقوق المساهمين", source: "الميزانية العمومية", note: "نسبة الرافعة المالية — كلما ارتفعت ازدادت مخاطر الملاءة" },
  cfo_nm: { formula: "(CFO ÷ صافي الربح) × 100", source: "قائمة التدفق النقدي + قائمة الدخل", note: "معدل تحويل الأرباح إلى كاش — CFO/NI > 100% علامة صحية" },
  g_net:  { formula: "((صافي ربح Q الأخير ÷ صافي ربح نفس Q السابق) − 1) × 100", source: "البيانات الربعية", note: "نمو صافي الربح سنة على سنة — YoY" },
  g_rev:  { formula: "((إيرادات Q الأخير ÷ إيرادات نفس Q السابق) − 1) × 100", source: "البيانات الربعية", note: "نمو الإيرادات سنة على سنة — YoY" },
};

// ─── Traffic-light classifier ─────────────────────────────────────────────────
function classifyRatio(id: string, val: number | null): "green" | "amber" | "red" | "neutral" {
  if (val == null) return "neutral";
  switch (id) {
    case "roe":    return val >= 15 ? "green" : val >= 8 ? "amber" : "red";
    case "gm":     return val >= 40 ? "green" : val >= 20 ? "amber" : "red";
    case "nm":     return val >= 15 ? "green" : val >= 5 ? "amber" : "red";
    case "opm":    return val >= 15 ? "green" : val >= 5 ? "amber" : "red";
    case "pe":     return val > 0 && val <= 20 ? "green" : val <= 35 ? "amber" : "red";
    case "pb":     return val > 0 && val <= 2 ? "green" : val <= 4 ? "amber" : "red";
    case "peg":    return val > 0 && val <= 1 ? "green" : val <= 2 ? "amber" : "red";
    case "current":return val >= 2 ? "green" : val >= 1 ? "amber" : "red";
    case "debt_eq":return val <= 0.5 ? "green" : val <= 1.5 ? "amber" : "red";
    case "cfo_nm": return val >= 100 ? "green" : val >= 60 ? "amber" : "red";
    case "g_net":  return val >= 15 ? "green" : val >= 0 ? "amber" : "red";
    case "g_rev":  return val >= 10 ? "green" : val >= 0 ? "amber" : "red";
    default:       return "neutral";
  }
}

const LIGHT_CSS: Record<string, string> = {
  green:   "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  amber:   "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  red:     "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  neutral: "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]",
};
const LIGHT_DOT: Record<string, string> = {
  green: "bg-[#16A34A]", amber: "bg-[#D97706]", red: "bg-[#DC2626]", neutral: "bg-[#94A3B8]",
};

// ─── Sector template definitions ─────────────────────────────────────────────
const SECTOR_TEMPLATES: Record<SectorTemplate, { label: string; ratios: string[]; notes: string[] }> = {
  industrial: {
    label: "الشركات الصناعية والبتروكيماويات",
    ratios: ["gm", "opm", "nm", "roe", "current", "debt_eq", "g_rev", "g_net"],
    notes: [
      "الهوامش الثلاثة (إجمالي / تشغيلي / صافي) هي المحور الرئيسي للشركات الصناعية",
      "نسبة الدين/حقوق الملكية حساسة — الصناعات الثقيلة تقبل رفعاً أعلى من التجزئة",
      "نمو الإيرادات مؤشر قيادي على توسع الحصة السوقية",
    ]
  },
  bank: {
    label: "البنوك والمؤسسات المالية",
    ratios: ["roe", "pb", "nm", "pe"],
    notes: [
      "البنوك لا تُقيَّم بهوامش الربح التقليدية — ROE هو المقياس الأول",
      "P/B < 1 في البنوك غالباً يعكس مخاوف في جودة الأصول أو الرأسمال",
      "لا تُطبَّق نسبة التداول (Current Ratio) على البنوك — الإطار التنظيمي بازل أهم",
      "لا تتوفر نسبة Debt/Equity بالمعنى التقليدي للبنوك — تُستبدل بنسبة الرأسمال (CAR)",
    ]
  },
  reit: {
    label: "الصناديق العقارية (REITs) والمطورون",
    ratios: ["nm", "pb", "g_rev", "debt_eq"],
    notes: [
      "صناديق الريت تُقيَّم أساساً بتوزيعات الأرباح (Dividend Yield) لا P/E",
      "الرافعة المالية مقبولة في الريت بمستويات أعلى من الصناعات الأخرى",
      "نمو الإيرادات في الريت يعكس الإشغال والأجار — متابعة القطاعي أهم",
    ]
  }
};

// ─── Statement Row ────────────────────────────────────────────────────────────
function StatRow({
  label, values, periods, unit = "M", isTotal = false, indent = false,
  source, verdict, onClick
}: {
  label: string; values: number[]; periods: string[]; unit?: string;
  isTotal?: boolean; indent?: boolean; source?: string; verdict?: "green"|"amber"|"red"|"neutral";
  onClick?: () => void;
}) {
  const [showNote, setShowNote] = useState(false);
  if (!values || values.every(v => v === 0)) return null;
  const latest = values[values.length - 1] ?? 0;
  const prev   = values[values.length - 2] ?? 0;
  const chg    = prev !== 0 ? ((latest - prev) / Math.abs(prev)) * 100 : null;
  const isUp   = chg !== null && chg >= 0;

  return (
    <tr
      className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] group cursor-pointer ${isTotal ? "bg-[#F8FAFC]" : ""}`}
      onClick={onClick}
    >
      <td className={`p-2 text-right text-xs ${isTotal ? "font-black text-[#0F172A]" : indent ? "pl-6 text-[#374151] font-medium" : "font-semibold text-[#0F172A]"}`}>
        <div className="flex items-center gap-1.5">
          {verdict && <span className={`w-2 h-2 rounded-full shrink-0 ${LIGHT_DOT[verdict]}`} />}
          {indent && <span className="w-3 shrink-0" />}
          <span>{label}</span>
          {source && (
            <button
              onClick={e => { e.stopPropagation(); setShowNote(!showNote); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Info size={10} className="text-[#94A3B8]" />
            </button>
          )}
        </div>
        {showNote && source && (
          <div className="mt-1 text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded font-normal">
            المصدر: {source}
          </div>
        )}
      </td>
      {values.map((v, i) => (
        <td key={i} className={`p-2 text-right font-mono text-xs ${isTotal ? "font-black text-[#0F172A]" : "text-[#1E293B]"} ${i === values.length - 1 ? "bg-[#FFFBF5]" : ""}`}>
          {v === 0 ? <span className="text-[#CBD5E1]">—</span> : (
            <span>
              {v.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              {unit === "%" ? "%" : ""}
            </span>
          )}
        </td>
      ))}
      <td className="p-2 text-right text-[11px] font-mono">
        {chg != null ? (
          <span className={`inline-flex items-center gap-0.5 ${isUp ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(chg).toFixed(1)}%
          </span>
        ) : <span className="text-[#CBD5E1]">—</span>}
      </td>
    </tr>
  );
}

// ─── Ratio Card ───────────────────────────────────────────────────────────────
function RatioCard({
  id, label, value, unit, percentile, template
}: {
  id: string; label: string; value: number | null; unit: string;
  percentile?: number; template: SectorTemplate;
}) {
  const [open, setOpen] = useState(false);
  const light   = classifyRatio(id, value);
  const formula = FORMULAS[id];
  const tpl     = SECTOR_TEMPLATES[template];
  const inTemplate = tpl.ratios.includes(id);

  return (
    <div
      className={`rounded-[6px] border p-4 space-y-2 cursor-pointer transition-all hover:shadow-md ${LIGHT_CSS[light]} ${inTemplate ? "ring-1 ring-[#8C3B32]/30" : ""}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {inTemplate && (
              <span className="text-[9px] font-bold text-[#8C3B32] bg-[#FFF1EF] border border-[#FECACA] px-1.5 py-0.5 rounded-full">
                {tpl.label.split(" ")[0]}
              </span>
            )}
            <span className="text-xs font-bold text-[#0F172A] truncate">{label}</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono">
              {value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-mono">{unit}</span>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          {light !== "neutral" && (
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              light === "green" ? "bg-[#BBF7D0] text-[#166534]" :
              light === "amber" ? "bg-[#FDE68A] text-[#92400E]" :
              "bg-[#FECACA] text-[#991B1B]"
            }`}>
              {light === "green" ? "✓ قوي" : light === "amber" ? "◑ متوسط" : "✗ ضعيف"}
            </div>
          )}
          {percentile != null && (
            <div className="text-[10px] font-mono text-[#64748B]">
              رتبة {percentile}% بالقطاع
            </div>
          )}
        </div>
      </div>

      {/* Expandable formula */}
      {open && formula && (
        <div className="border-t border-current/20 pt-2 mt-2 space-y-1.5">
          <div className="text-[11px]">
            <span className="font-bold">الصيغة:</span>{" "}
            <code className="font-mono bg-black/5 px-1 rounded">{formula.formula}</code>
          </div>
          <div className="text-[11px]">
            <span className="font-bold">المصدر:</span> {formula.source}
          </div>
          {formula.note && (
            <div className="text-[11px] text-current/80">{formula.note}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RebhAnalystPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = ((params?.symbol as string) || "2222").toUpperCase();

  const [data,   setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [tab,      setTab]      = useState<Tab>("is");
  const [template, setTemplate] = useState<SectorTemplate>("industrial");
  const [showFormulas, setShowFormulas] = useState(false);
  const [viewMode, setViewMode] = useState<"annual" | "quarterly">("annual");

  // Fetch
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`);
        if (!res.ok) throw new Error(`لم يُعثر على قوائم مالية للرمز: ${symbol}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [symbol]);

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    const s = search.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) router.push(`/rebh/analyst/${s}`);
  };

  // ── Computed ratios ─────────────────────────────────────────────────────────
  const ratios = useMemo(() => {
    if (!data?.cur) return null;
    const c  = data.cur;
    const pc = data.pct || {};
    const isData = data.income_statement || {};
    const bsData = data.bs || {};
    const cfData = data.cf || {};

    // Derived: current ratio from BS
    const ca  = bsData.current_assets?.at(-1) ?? 0;
    const cl  = bsData.current_liabilities?.at(-1) ?? 0;
    const cur = cl > 0 ? +(ca / cl).toFixed(2) : null;

    // Derived: debt/equity
    const sd  = bsData.short_debt?.at(-1) ?? 0;
    const ld  = bsData.long_debt?.at(-1) ?? 0;
    const eq  = bsData.total_equity?.at(-1) ?? 0;
    const de  = eq > 0 ? +((sd + ld) / eq).toFixed(2) : null;

    // CFO/NI conversion
    const cfo = cfData.cfo?.at(-1) ?? 0;
    const net = isData.net?.at(-1) ?? 0;
    const cfo_nm = net !== 0 ? +((cfo / net) * 100).toFixed(1) : null;

    // Operating margin
    const op  = isData.op?.at(-1) ?? 0;
    const rev = isData.rev?.at(-1) ?? 0;
    const opm = rev > 0 ? +((op / rev) * 100).toFixed(1) : null;

    return { ...c, cur, de, cfo_nm, opm, pct: pc };
  }, [data]);

  // Auto-detect sector template
  useEffect(() => {
    if (!data?.sec) return;
    const sec = (data.sec || "").toLowerCase();
    if (sec.includes("بنك") || sec.includes("bank")) setTemplate("bank");
    else if (sec.includes("ريت") || sec.includes("reit") || sec.includes("عقار")) setTemplate("reit");
    else setTemplate("industrial");
  }, [data]);

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-11 h-11 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#1A1A1A]">جاري تحليل القوائم المالية…</p>
        <p className="text-xs text-[#6B7280]">استخراج البيانات من XBRL · حساب النسب · تدقيق المصادر</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8">
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
        <h2 className="text-base font-bold">تعذر تحميل القوائم — {symbol}</h2>
        <p className="text-xs text-[#6B7280]">{error}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => { setLoading(true); setError(null); }} className="px-4 py-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold">إعادة المحاولة</button>
          <Link href="/rebh/analyst" className="px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#752f28]">رمز آخر</Link>
        </div>
      </div>
    </div>
  );

  const name   = data.name || symbol;
  const nameEn = data.en   || "";
  const sector = data.sec  || "—";
  const isBank = data.is_bank;
  const isData = data.income_statement || {};
  const bsData = data.bs || {};
  const cfData = data.cf || {};
  const isTTM  = isData.ttm || {};
  const periods: string[] = viewMode === "annual"
    ? (isData.periods || [])
    : (data.quarters?.periods || []);

  // Dual verdict
  const safetyPass  = ratios && (ratios.de ?? 0) <= 2 && (ratios.cur ?? 0) >= 1;
  const qualityPass = ratios && (ratios.roe ?? 0) >= 10 && (ratios.nm ?? 0) >= 5;

  const TAB_LIST: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "is",     label: "قائمة الدخل",         icon: <TrendingUp size={13} /> },
    { id: "bs",     label: "الميزانية العمومية",   icon: <Layers size={13} /> },
    { id: "cf",     label: "التدفقات النقدية",     icon: <Activity size={13} /> },
    { id: "ratios", label: "النسب المالية",         icon: <BarChart3 size={13} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <Link href="/rebh/analyst">
            <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs cursor-pointer hover:bg-[#752f28]">ANALYST</span>
          </Link>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">
            Statements · Analyst — <span className="font-mono text-[#8C3B32]">{symbol}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleNav} className="flex items-center gap-1.5">
            <input
              type="text" inputMode="numeric" maxLength={4}
              value={search} onChange={e => setSearch(e.target.value.replace(/\D/g, ""))}
              placeholder="رمز" className="w-24 px-2.5 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]"
            />
            <button type="submit" className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold">عرض</button>
          </form>
          <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold">
            <Printer size={13} />طباعة
          </button>
        </div>
      </header>

      {/* ── COMPANY HEADER ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base shrink-0">{symbol}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#1A1A1A]">{name}</h2>
                {nameEn && <span className="text-[11px] font-mono text-[#6B7280]">{nameEn}</span>}
                {isBank && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8]">بنك · نموذج مالي خاص</span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">{sector} · السوق المالي السعودي (تداول)</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs font-mono">
                {data.px && <span className="text-[#0F172A] font-bold">السعر: {data.px} SAR</span>}
                {data.mc && <span className="text-[#64748B]">القيمة السوقية: {(data.mc / 1000).toFixed(1)} مليار</span>}
              </div>
            </div>
          </div>

          {/* Dual Verdict */}
          <div className="flex items-stretch gap-3 shrink-0">
            {[
              {
                label: "حكم الملاءة المالية",
                sub: "نسب السيولة والرافعة",
                pass: safetyPass,
                passText: "آمن · ملاءة سليمة",
                failText: "مخاطرة · راجع الدين والسيولة",
              },
              {
                label: "حكم جودة الأرباح",
                sub: "هوامش الربح والعائد",
                pass: qualityPass,
                passText: "جيد · أرباح منتجة",
                failText: "ضعيف · هوامش متدنية",
              }
            ].map((v, i) => (
              <div
                key={i}
                className={`rounded-[6px] border px-4 py-3 min-w-[160px] ${v.pass ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FEF2F2] border-[#FECACA]"}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {v.pass
                    ? <ShieldCheck size={14} className="text-[#16A34A]" />
                    : <AlertTriangle size={14} className="text-[#DC2626]" />}
                  <span className="text-[11px] font-bold text-[#0F172A]">{v.label}</span>
                </div>
                <div className={`text-xs font-bold ${v.pass ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                  {v.pass ? v.passText : v.failText}
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">{v.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TABS + CONTROLS ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3 py-2">
          {/* Tab bar */}
          <nav className="flex items-center gap-1">
            {TAB_LIST.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] text-xs font-semibold transition-all ${
                  tab === t.id ? "bg-[#8C3B32] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Annual / Quarterly toggle (only for IS tab) */}
            {tab === "is" && (
              <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB] text-[11px] font-semibold">
                {(["annual", "quarterly"] as const).map(m => (
                  <button key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1 rounded transition-colors ${viewMode === m ? "bg-white text-[#8C3B32] shadow-sm" : "text-[#6B7280]"}`}
                  >
                    {m === "annual" ? "سنوي" : "ربعي"}
                  </button>
                ))}
              </div>
            )}

            {/* Sector template (shown on ratios tab) */}
            {tab === "ratios" && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#374151]">القالب القطاعي:</span>
                <select
                  value={template}
                  onChange={e => setTemplate(e.target.value as SectorTemplate)}
                  className="px-2 py-1 text-[11px] bg-[#F8FAFC] border border-[#D1D5DB] rounded-[4px] outline-none font-semibold text-[#1A1A1A]"
                >
                  {Object.entries(SECTOR_TEMPLATES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Formula toggle */}
            <button
              onClick={() => setShowFormulas(!showFormulas)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-[11px] font-semibold transition-colors ${
                showFormulas ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"
              }`}
            >
              <BookOpen size={12} />
              <span>الصيغ والمصادر</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ━━ INCOME STATEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "is" && (
          <div className="space-y-5">
            {/* Audit note */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] px-4 py-3 text-xs text-[#92400E] flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5 text-[#D97706]" />
              <span>
                بيانات مستخرجة بشكل آلي من ملفات XBRL المنشورة على موقع تداول · وحدة العرض: مليون ريال سعودي · الأرقام السالبة تُشير إلى مصاريف
                {data.is_bank && " · البنوك تستخدم بنود دخل مختلفة — العمود الأول يعكس هامش الفائدة الصافي NIM"}
              </span>
            </div>

            {/* IS Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-2.5 text-right font-bold text-[#475569] min-w-[180px]">البند</th>
                      {(viewMode === "annual" ? isData.periods || [] : data.quarters?.periods || []).map((p: string, i: number) => (
                        <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                      ))}
                      <th className="p-2.5 text-right font-mono font-bold text-[#D97706] whitespace-nowrap">TTM</th>
                      <th className="p-2.5 text-right font-bold text-[#475569] w-16">تغيّر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {viewMode === "annual" ? <>
                      <StatRow label="الإيرادات / المبيعات" values={isData.rev || []}   periods={isData.periods||[]} source="قائمة الدخل XBRL" verdict={classifyRatio("g_rev", ratios?.g_rev ?? null)} isTotal onClick={() => router.push(`/rebh/studio/${symbol}?preset=revenue_margin_health`)} />
                      <StatRow label="تكلفة المبيعات (COGS)" values={isData.cogs||[]}   periods={isData.periods||[]} source="قائمة الدخل" indent />
                      <StatRow label="إجمالي الربح" values={isData.gp || []}    periods={isData.periods||[]} source="الإيرادات − تكلفة المبيعات" verdict="green" isTotal />
                      <StatRow label="المصاريف العمومية والإدارية" values={isData.ga||[]}  periods={isData.periods||[]} source="قائمة الدخل XBRL" indent />
                      <StatRow label="الربح التشغيلي (EBIT)" values={isData.op || []}  periods={isData.periods||[]} source="إجمالي الربح − المصاريف" isTotal onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} />
                      <StatRow label="تكاليف التمويل والفوائد" values={isData.fin_cost||[]} periods={isData.periods||[]} source="قائمة الدخل XBRL" indent />
                      <StatRow label="حصة الشركات التابعة والمشتركة" values={isData.jv||[]} periods={isData.periods||[]} source="قائمة الدخل XBRL" indent />
                      <StatRow label="الدخل (المصروف) الآخر" values={isData.other_inc||[]} periods={isData.periods||[]} source="قائمة الدخل XBRL" indent />
                      <StatRow label="الربح قبل الزكاة والضريبة (PBT)" values={isData.pbt||[]} periods={isData.periods||[]} source="مشتق — قبل الزكاة" isTotal />
                      <StatRow label="مصروف الزكاة والضريبة" values={isData.zakat||[]} periods={isData.periods||[]} source="قائمة الدخل XBRL" indent />
                      <StatRow label="صافي الربح للفترة" values={isData.net||[]} periods={isData.periods||[]} source="PBT − الزكاة" verdict={classifyRatio("nm", ratios?.nm ?? null)} isTotal onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} />
                      <StatRow label="ربحية السهم (EPS)" values={isData.eps||[]} periods={isData.periods||[]} source="صافي الربح ÷ عدد الأسهم" unit="SAR" />
                    </> : <>
                      <StatRow label="الإيرادات الربعية"     values={data.quarters?.rev||[]} periods={data.quarters?.periods||[]} isTotal />
                      <StatRow label="إجمالي الربح الربعي"   values={data.quarters?.gp||[]}  periods={data.quarters?.periods||[]} />
                      <StatRow label="الربح التشغيلي الربعي" values={data.quarters?.op||[]}  periods={data.quarters?.periods||[]} />
                      <StatRow label="صافي الربح الربعي"     values={data.quarters?.net||[]} periods={data.quarters?.periods||[]} isTotal />
                    </>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TTM Summary */}
            {viewMode === "annual" && isTTM.rev > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <h4 className="text-xs font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Activity size={13} className="text-[#8C3B32]" />
                  ملخص الأداء TTM (آخر 12 شهر)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "الإيرادات TTM",    val: isTTM.rev,  unit: "M SAR" },
                    { label: "إجمالي الربح TTM",  val: isTTM.gp,   unit: "M SAR" },
                    { label: "صافي الربح TTM",    val: isTTM.net,  unit: "M SAR" },
                    { label: "ربحية السهم TTM",   val: isTTM.eps,  unit: "SAR" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2">
                      <span className="block text-[10px] text-[#64748B]">{s.label}</span>
                      <span className="block font-black font-mono text-sm text-[#0F172A]">
                        {(s.val ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} {s.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━ BALANCE SHEET ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "bs" && (
          <div className="space-y-5">
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] px-4 py-3 text-xs text-[#92400E] flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5 text-[#D97706]" />
              <span>
                الميزانية العمومية المُجمَّعة من XBRL · الوحدة: مليون ريال ·
                <strong> فحص الهوية: </strong> يُتحقق من أن إجمالي الأصول = إجمالي الالتزامات + حقوق المساهمين
              </span>
            </div>

            {/* Assets */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#374151]">الأصول (Assets)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-2.5 text-right font-bold text-[#475569] min-w-[180px]">البند</th>
                      {(bsData.periods || []).map((p: string, i: number) => (
                        <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                      ))}
                      <th className="p-2.5 text-right font-bold text-[#475569] w-16">تغيّر</th>
                    </tr>
                  </thead>
                  <tbody>
                    <StatRow label="النقد وما في حكمه" values={bsData.cash||[]}     periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="الذمم المدينة"      values={bsData.receivables||[]} periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="إجمالي الأصول المتداولة" values={bsData.current_assets||[]} periods={bsData.periods||[]} isTotal source="مجموع الأصول المتداولة" />
                    <StatRow label="العقارات والآلات والمعدات (PPE)" values={bsData.ppe||[]} periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="إجمالي الأصول" values={bsData.total_assets||[]} periods={bsData.periods||[]} isTotal source="مُحقَّق: يجب أن يساوي (الالتزامات + حقوق الملكية)" verdict="green" />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liabilities + Equity */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#374151]">الالتزامات وحقوق المساهمين</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-2.5 text-right font-bold text-[#475569] min-w-[180px]">البند</th>
                      {(bsData.periods || []).map((p: string, i: number) => (
                        <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                      ))}
                      <th className="p-2.5 text-right font-bold text-[#475569] w-16">تغيّر</th>
                    </tr>
                  </thead>
                  <tbody>
                    <StatRow label="الديون قصيرة الأجل"     values={bsData.short_debt||[]}         periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="إجمالي الالتزامات المتداولة" values={bsData.current_liabilities||[]} periods={bsData.periods||[]} isTotal source="مجموع الالتزامات المتداولة" />
                    <StatRow label="الديون طويلة الأجل"     values={bsData.long_debt||[]}          periods={bsData.periods||[]} source="الميزانية XBRL — قد تشمل الصكوك والمرابحات" indent />
                    <StatRow label="إجمالي الالتزامات"      values={bsData.total_liabilities||[]}  periods={bsData.periods||[]} isTotal />
                    <StatRow label="رأس المال المدفوع"       values={bsData.capital||[]}            periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="الأرباح المُبقاة / (الخسائر المُرحَّلة)" values={bsData.retained_earnings||[]} periods={bsData.periods||[]} source="الميزانية XBRL" indent />
                    <StatRow label="إجمالي حقوق المساهمين" values={bsData.total_equity||[]}       periods={bsData.periods||[]} isTotal source="مُحقَّق: الأصول − الالتزامات" verdict={classifyRatio("roe", ratios?.roe ?? null)} />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Identity check */}
            {bsData.total_assets && bsData.total_liabilities && bsData.total_equity && (() => {
              const ta = bsData.total_assets.at(-1) ?? 0;
              const tl = bsData.total_liabilities.at(-1) ?? 0;
              const te = bsData.total_equity.at(-1) ?? 0;
              const diff = Math.abs(ta - (tl + te));
              const ok   = diff < 1;
              return (
                <div className={`rounded-[6px] border px-4 py-3 text-xs flex items-start gap-2 ${ok ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]" : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"}`}>
                  {ok ? <CheckCircle2 size={14} className="shrink-0" /> : <XCircle size={14} className="shrink-0" />}
                  <span>
                    <strong>فحص الهوية المحاسبية (A = L + E):</strong>{" "}
                    {ok
                      ? `مُجتاز ✓ — الأصول (${ta.toLocaleString()} M) = الالتزامات + حقوق الملكية (${(tl + te).toLocaleString(undefined, {maximumFractionDigits:1})} M) · الفارق: ${diff.toFixed(2)} M`
                      : `فشل ✗ — الفارق ${diff.toLocaleString(undefined, {maximumFractionDigits:1})} M — قد يكون بسبب أقليات أو تعديلات IFRS — تم وسمه للمراجعة`
                    }
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ━━ CASH FLOW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "cf" && (
          <div className="space-y-5">
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] px-4 py-3 text-xs text-[#92400E] flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5 text-[#D97706]" />
              <span>
                التدفقات النقدية: CFO = النشاط التشغيلي · CFI = الاستثماري · CFF = التمويلي
                · <strong>فحص:</strong> CFO + CFI + CFF = صافي تغير النقد
                · FCF = CFO − |CapEx|
              </span>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-2.5 text-right font-bold text-[#475569] min-w-[200px]">البند</th>
                      {(cfData.periods || []).map((p: string, i: number) => (
                        <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                      ))}
                      <th className="p-2.5 text-right font-bold text-[#475569] w-16">تغيّر</th>
                    </tr>
                  </thead>
                  <tbody>
                    <StatRow label="صافي التدفق التشغيلي (CFO)" values={cfData.cfo||[]}  periods={cfData.periods||[]} isTotal source="قائمة التدفقات XBRL" verdict={classifyRatio("cfo_nm", ratios?.cfo_nm ?? null)} onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} />
                    <StatRow label="التغير في رأس المال العامل"  values={cfData.inventory||[]} periods={cfData.periods||[]} indent source="قائمة التدفقات XBRL" />
                    <StatRow label="الفوائد المدفوعة"            values={cfData.finance_paid||[]} periods={cfData.periods||[]} indent source="قائمة التدفقات XBRL" />
                    <StatRow label="النفقات الرأسمالية (CapEx)"  values={cfData.capex||[]} periods={cfData.periods||[]} isTotal source="الأنشطة الاستثمارية XBRL" onClick={() => router.push(`/rebh/studio/${symbol}?preset=fcf_conversion`)} />
                    <StatRow label="إجمالي الاستثمارات (CFI)"    values={cfData.cfi||[]}   periods={cfData.periods||[]} source="قائمة التدفقات XBRL" />
                    <StatRow label="صافي الاقتراض وإعادة التمويل" values={cfData.borrowings||[]} periods={cfData.periods||[]} indent source="الأنشطة التمويلية XBRL" />
                    <StatRow label="إجمالي التمويل (CFF)"         values={cfData.cff||[]}   periods={cfData.periods||[]} source="قائمة التدفقات XBRL" />
                    <StatRow label="التدفق الحر (FCF = CFO − CapEx)" values={cfData.fcf||[]} periods={cfData.periods||[]} isTotal source="محسوب: CFO − abs(CapEx)" verdict={classifyRatio("cfo_nm", ratios?.cfo_nm ?? null)} onClick={() => router.push(`/rebh/studio/${symbol}?preset=fcf_conversion`)} />
                    <StatRow label="صافي تغير النقد"              values={cfData.net_change||[]} periods={cfData.periods||[]} isTotal source="CFO + CFI + CFF" />
                  </tbody>
                </table>
              </div>
            </div>

            {/* CFO/NI check */}
            {ratios?.cfo_nm != null && (
              <div className={`rounded-[6px] border px-4 py-3 text-xs flex items-start gap-2 ${LIGHT_CSS[classifyRatio("cfo_nm", ratios.cfo_nm)]}`}>
                <Activity size={14} className="shrink-0 mt-0.5" />
                <span>
                  <strong>فحص تحويل الأرباح إلى كاش (CFO/NI):</strong>{" "}
                  CFO/NI = {ratios.cfo_nm.toFixed(1)}%
                  {ratios.cfo_nm >= 100
                    ? " ✓ — الأرباح المحاسبية مُترجَمة بالكامل إلى تدفق نقدي حقيقي"
                    : ratios.cfo_nm >= 60
                    ? " ◑ — تحويل جزئي — راجع التغيرات في رأس المال العامل"
                    : " ✗ — فجوة مرتفعة بين الأرباح والكاش — تحقق من الذمم والمخزون"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ━━ RATIOS & ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "ratios" && ratios && (
          <div className="space-y-6">

            {/* Sector template notes */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-2">
              <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <BookOpen size={13} className="text-[#8C3B32]" />
                ملاحظات القالب — {SECTOR_TEMPLATES[template].label}
              </h4>
              <ul className="space-y-1">
                {SECTOR_TEMPLATES[template].notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#374151]">
                    <ChevronRight size={11} className="shrink-0 mt-0.5 text-[#8C3B32]" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Profitability */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <TrendingUp size={14} className="text-[#8C3B32]" />
                الربحية (Profitability)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <RatioCard id="roe" label="العائد على حقوق المساهمين (ROE)" value={ratios.roe} unit="%" percentile={ratios.pct?.roe} template={template} />
                <RatioCard id="nm"  label="هامش صافي الربح"  value={ratios.nm}  unit="%" percentile={ratios.pct?.nm} template={template} />
                <RatioCard id="gm"  label="هامش إجمالي الربح" value={ratios.gm} unit="%" percentile={ratios.pct?.gm} template={template} />
                <RatioCard id="opm" label="هامش التشغيل (EBIT)" value={ratios.opm} unit="%" template={template} />
              </div>
            </div>

            {/* Growth */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Activity size={14} className="text-[#8C3B32]" />
                النمو (Growth — YoY)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <RatioCard id="g_net" label="نمو صافي الربح (YoY)" value={ratios.g_net} unit="%" percentile={ratios.pct?.g_net} template={template} />
                <RatioCard id="g_rev" label="نمو الإيرادات (YoY)"  value={ratios.g_rev} unit="%" percentile={ratios.pct?.g_rev} template={template} />
                <RatioCard id="peg"   label="مضاعف النمو (PEG)"    value={ratios.peg}   unit="×"  template={template} />
              </div>
            </div>

            {/* Valuation */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Layers size={14} className="text-[#8C3B32]" />
                التقييم (Valuation)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <RatioCard id="pe" label="مضاعف السعر/الربح (P/E)"      value={ratios.pe} unit="×" percentile={ratios.pct?.pe} template={template} />
                <RatioCard id="pb" label="مضاعف السعر/الدفاتر (P/B)"    value={ratios.pb} unit="×" percentile={ratios.pct?.pb} template={template} />
              </div>
            </div>

            {/* Safety */}
            {!isBank && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                  <ShieldCheck size={14} className="text-[#8C3B32]" />
                  السيولة والملاءة (Liquidity / Leverage)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <RatioCard id="current" label="نسبة التداول (Current Ratio)" value={ratios.cur}    unit="×" template={template} />
                  <RatioCard id="debt_eq" label="الدين / حقوق الملكية"         value={ratios.de}     unit="×" template={template} />
                  <RatioCard id="cfo_nm"  label="تحويل الأرباح إلى كاش (CFO/NI)" value={ratios.cfo_nm} unit="%" template={template} />
                </div>
              </div>
            )}

            {/* Formula reference table */}
            {showFormulas && (
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2.5 flex items-center gap-2">
                  <BookOpen size={13} className="text-[#8C3B32]" />
                  <span className="text-xs font-bold text-[#374151]">مرجع الصيغ والمصادر الكاملة</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <th className="p-2.5 text-right font-bold text-[#475569]">النسبة</th>
                        <th className="p-2.5 text-right font-bold text-[#475569]">الصيغة</th>
                        <th className="p-2.5 text-right font-bold text-[#475569]">المصدر</th>
                        <th className="p-2.5 text-right font-bold text-[#475569]">ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {Object.entries(FORMULAS).map(([id, f]) => (
                        <tr key={id} className="hover:bg-[#F8FAFC]">
                          <td className="p-2.5 font-mono font-bold text-[#8C3B32]">{id.toUpperCase()}</td>
                          <td className="p-2.5 font-mono text-[#1E293B]">{f.formula}</td>
                          <td className="p-2.5 text-[#64748B]">{f.source}</td>
                          <td className="p-2.5 text-[#64748B] max-w-[220px]">{f.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Peer comparison strip */}
            {data.peers?.peers?.roe?.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
                <h4 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                  <BarChart3 size={13} className="text-[#8C3B32]" />
                  مقارنة ROE بمنافسي القطاع
                  <span className="text-[10px] font-normal text-[#64748B]">({data.peers?.n_sec || 0} شركة في القطاع)</span>
                </h4>
                <div className="space-y-1.5">
                  {data.peers.peers.roe.slice(0, 8).map(([sym, name, roe]: [string, string, number]) => {
                    const isCurrent = sym === symbol;
                    const max = Math.max(...data.peers.peers.roe.map((r: any) => r[2]));
                    const pct = max > 0 ? (roe / max) * 100 : 0;
                    return (
                      <div key={sym} className={`flex items-center gap-3 p-2 rounded-[4px] ${isCurrent ? "bg-[#FFF1EF] border border-[#FECACA]" : "hover:bg-[#F8FAFC]"}`}>
                        <span className={`font-mono text-[11px] font-bold w-12 shrink-0 ${isCurrent ? "text-[#8C3B32]" : "text-[#0F172A]"}`}>{sym}</span>
                        <span className="text-[11px] text-[#374151] w-32 shrink-0 truncate">{name}</span>
                        <div className="flex-1 bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${isCurrent ? "bg-[#8C3B32]" : "bg-[#94A3B8]"}`} style={{ width: `${Math.max(2, pct)}%` }} />
                        </div>
                        <span className={`font-mono text-[11px] font-bold w-14 text-right ${roe >= 15 ? "text-[#16A34A]" : roe >= 8 ? "text-[#D97706]" : "text-[#DC2626]"}`}>
                          {roe.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CROSS-LINK FOOTER ───────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-[#0F172A]">تعمّق أكثر مع هذا الرمز</p>
            <p className="text-[#64748B] mt-0.5">الانتقال لاستوديو الرسوم أو صفحة الشركة الكاملة</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href={`/rebh/studio/${symbol}?preset=revenue_margin_health`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              رسم الإيرادات والهوامش →
            </Link>
            <Link href={`/rebh/studio/${symbol}?preset=fcf_conversion`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              رسم FCF vs CapEx →
            </Link>
            <Link href={`/rebh/company/${symbol}`} className="px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] font-semibold transition-colors">
              صفحة الشركة الكاملة →
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB]">
        منصة REBH — Statements · Analyst · {symbol} · {name} · بيانات XBRL مُدقَّقة
      </footer>
    </div>
  );
}
