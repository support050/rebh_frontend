"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";

interface ReportData {
  sym: string;
  n: string;
  sec: string;
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
  return v.toLocaleString("ar-SA", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const fmtPct = (v: number | null | undefined) => {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
};

// Porter scores hardcoded from client HTML per company type (approximate)
const PORTER_BY_TYPE: Record<string, { items: { q: string; v: number; reason: string }[]; total: number; comp: number; label: string }> = {
  bank: {
    items: [
      { q: "تهديد الدخول", v: 0.80, reason: "رخص البنوك المركزية حاجز شبه مغلق" },
      { q: "قوة العملاء", v: 0.60, reason: "الأفراد مشتتون؛ الشركات تفاوض" },
      { q: "قوة الموردين", v: 0.70, reason: "المودعون مشتتون والجارية بلا كلفة" },
      { q: "البدائل", v: 0.50, reason: "الفنتك تقضم أطرافاً" },
      { q: "حدة المنافسة", v: 0.50, reason: "منافسة قوية في القطاع" },
    ],
    total: 3.10, comp: 3, label: "3% (≥3.5→2 · ≥2.5→3 · وإلا 4)",
  },
  defensive: {
    items: [
      { q: "تهديد الدخول", v: 0.75, reason: "رأس مال وشبكة توزيع عائق كبير" },
      { q: "قوة العملاء", v: 0.55, reason: "تجزئة كبرى تفاوض؛ المستهلك وفيّ" },
      { q: "قوة الموردين", v: 0.55, reason: "موردون متعددون — يخففها التملك الخارجي" },
      { q: "البدائل", v: 0.55, reason: "بدائل موجودة والولاء يحمي القلب" },
      { q: "حدة المنافسة", v: 0.45, reason: "منافسة محدودة في القلب" },
    ],
    total: 2.85, comp: 3, label: "3% (≥2.5→3 · وإلا 4)",
  },
  growth: {
    items: [
      { q: "تهديد الدخول", v: 0.65, reason: "علامة قوية وشبكة راسخة" },
      { q: "قوة العملاء", v: 0.60, reason: "عملاء متعددون؛ أفراد وشركات" },
      { q: "قوة الموردين", v: 0.65, reason: "تعاقد متنوع يقلل التركز" },
      { q: "البدائل", v: 0.60, reason: "الرقمنة تهدد الحواف — القلب محمي" },
      { q: "حدة المنافسة", v: 0.55, reason: "منافسة متصاعدة في النمو" },
    ],
    total: 3.05, comp: 3, label: "3% (≥2.5→3 · وإلا 4)",
  },
  cyclical: {
    items: [
      { q: "تهديد الدخول", v: 0.70, reason: "رأس مال ثقيل ورخصة تشغيل" },
      { q: "قوة العملاء", v: 0.45, reason: "مشترون كبار يفاوضون بشدة" },
      { q: "قوة الموردين", v: 0.50, reason: "مدخلات سلعية متقلبة" },
      { q: "البدائل", v: 0.55, reason: "بدائل المواد الإنشائية محدودة" },
      { q: "حدة المنافسة", v: 0.40, reason: "منافسة سعرية في القمم الدورية" },
    ],
    total: 2.60, comp: 4, label: "4% (< 2.5)",
  },
  realestate: {
    items: [
      { q: "تهديد الدخول", v: 0.65, reason: "أرض ورأس مال وعلاقات هي الحاجز" },
      { q: "قوة العملاء", v: 0.50, reason: "مشترون أفراد — الطلب يحرك" },
      { q: "قوة الموردين", v: 0.55, reason: "مواد بناء ومقاولون متعددون" },
      { q: "البدائل", v: 0.45, reason: "الإيجار بديل دائم" },
      { q: "حدة المنافسة", v: 0.40, reason: "حرب سعرية في التراجع الدوري" },
    ],
    total: 2.55, comp: 4, label: "4% (< 2.5)",
  },
};

const SAFETY_THRESHOLDS = [
  { key: "ROE", label: "ROE", field: "roe", thresholds: [15, 10], labels: ["≥15 / 10–15 / <10"] },
  { key: "ROA", label: "ROA°", field: "roa", thresholds: [10, 6], labels: ["≥10 / 6–10 / ≤6"] },
  { key: "Current", label: "نسبة التداول", field: "current", thresholds: [2, 1], labels: ["≥2 / 1–2 / ≤1"] },
  { key: "DeAssets", label: "الدين/الأصول°", field: "de_assets", reverse: true, thresholds: [40, 60], labels: ["≤40 / 40–60 / ≥60"] },
  { key: "Coverage", label: "تغطية الفائدة", field: "coverage", thresholds: [10, 6], labels: ["≥10 / 6–10 / ≤6"] },
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
  if (score > 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">+1 ✓</span>;
  if (score === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">0 محايد</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">−1 ✗</span>;
}

function TTM(vals: (number | null)[]): number | null {
  const last4 = vals.slice(-4);
  if (last4.length < 4 || !last4.every(x => x != null)) return null;
  return last4.reduce((a, b) => a + (b ?? 0), 0);
}

export default function CompanyReportView({ meta, data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3987e5] border-t-transparent rounded-full animate-spin" />
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
    if (px <= noGrowthV) zone = "ذهبية";
    else if (px <= (noGrowthV + gordonV) / 2) zone = "فضية";
    else if (px <= transitV) zone = "برونزية";
    else zone = "مكلفة";
  }

  const zoneColor = zone === "ذهبية" ? "text-emerald-400" : zone === "فضية" ? "text-[#d9b64a]" : zone === "برونزية" ? "text-orange-400" : "text-rose-400";

  const shariaDeAssets = data?.de_assets;
  const shariaOk = shariaDeAssets != null && shariaDeAssets < 33;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-[#0e141d] border border-[#1d2735] rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h2 className="text-lg font-black text-white font-mono">{data?.n || meta.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#aab6c6]">
            <span className="font-mono text-[#d9b64a] font-bold">{meta.sym}</span>
            <span>{data?.sec || "—"}</span>
            <span className="px-2 py-0.5 bg-[#1d2735] rounded text-[10px]">{meta.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {data?.px && <div className="text-center"><div className="text-[#aab6c6]">السعر</div><div className="text-white font-bold text-sm">{data.px.toFixed(2)}</div></div>}
          {data?.pe && <div className="text-center"><div className="text-[#aab6c6]">P/E</div><div className="text-white font-bold">{data.pe.toFixed(1)}×</div></div>}
          {data?.pb && <div className="text-center"><div className="text-[#aab6c6]">P/B</div><div className="text-white font-bold">{data.pb.toFixed(2)}×</div></div>}
          {data?.roe && <div className="text-center"><div className="text-[#aab6c6]">ROE%</div><div className="text-emerald-400 font-bold">{data.roe.toFixed(1)}%</div></div>}
        </div>
        <Link href={`/rebh/${meta.sym}`} className="flex items-center gap-1.5 text-[11px] text-[#3987e5] hover:text-white border border-[#3987e5]/30 px-3 py-1.5 rounded-lg hover:bg-[#3987e5]/10 transition">
          <span>فحص الشركة الكامل ONE ∞</span><ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Classification Row */}
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">البطاقة التصنيفية</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                <th className="px-4 py-2 text-right font-medium">تصنيف الصناعة</th>
                <th className="px-4 py-2 text-right font-medium">شكل السوق</th>
                <th className="px-4 py-2 text-right font-medium">مرحلة بوسطن</th>
                <th className="px-4 py-2 text-right font-medium">المخاطرة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1d2735] bg-[#182130]/40">
                <td className="px-4 py-2.5 text-white font-bold">{meta.label}</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">{meta.type === "bank" ? "احتكار قلة" : meta.type === "defensive" ? "احتكار قلة" : meta.type === "cyclical" ? "تنافسية" : "منافسة احتكارية"}</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">{meta.type === "growth" ? "الشباب / النمو" : "الرشد / الكهولة"}</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">{meta.type === "bank" || meta.type === "defensive" ? "منخفضة" : "متوسطة"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sharia */}
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">الشرعية <span className="text-[#5f6d80] font-normal normal-case">الفحص الكمي المحسوب</span></h3>
        </div>
        <div className="p-4 text-xs text-[#aab6c6] leading-relaxed">
          {data ? (
            <div className="space-y-1">
              <p>
                الدين/الأصول°{" "}
                <span className="font-mono font-bold text-white">{data.de_assets?.toFixed(1) ?? "—"}%</span>{" "}
                {shariaOk ? <span className="text-emerald-400">✅ &lt;33</span> : <span className="text-rose-400">❌ &gt;33</span>}
                {" · "}الدين/القيمة السوقية°{" "}
                <span className="font-mono text-white">{data.de?.toFixed(1) ?? "—"}%</span>
                {" · "}دخل الفوائد/الإيراد ≈🔌 (سطر القوائم — مستورد الملفات)
                {" · "}النقد والاستثمارات ≈🔌
              </p>
              <p className="text-[#3987e5] font-bold mt-2">الحكم النهائي للجنتك (المعايير تختلف بين اللجان — قاعدة الدورة).</p>
            </div>
          ) : (
            <span className="text-[#5f6d80]">يحتاج بيانات الشركة من قاعدة البيانات.</span>
          )}
        </div>
      </div>

      {/* Porter 5 Forces */}
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">قواعد مايكل بورتر الخمس <span className="text-[#5f6d80] font-normal normal-case">0–1 لكل قوة — لا صفر ولا واحد أبداً (قاعدة الدورة)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                <th className="px-4 py-2 text-right">القوة</th>
                <th className="px-4 py-2 text-left font-mono">التقييم</th>
                <th className="px-4 py-2 text-right">السبب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2735]">
              {porter.items.map((item, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white font-medium">{item.q}</td>
                  <td className="px-4 py-2.5 text-left font-mono text-[#63a5f0] font-bold">{item.v.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[#aab6c6]">{item.reason}</td>
                </tr>
              ))}
              <tr className="bg-[#182130]/60">
                <td className="px-4 py-2.5 text-[#d9b64a] font-black">الإجمالي → التعويض</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#d9b64a] font-black">{porter.total.toFixed(2)}/5</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">{porter.label}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 9 Quarters Financials */}
      {qPeriods.length > 0 && (
        <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
          <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
            <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">
              القوائم المالية — الأرباع المتحققة° <span className="text-[#5f6d80] font-normal normal-case">9 أرباع منفصلة محققة بفحص الهويات · بالمليون ريال</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                  <th className="px-3 py-2 text-right min-w-[110px]">البند</th>
                  {qPeriods.map((p, i) => <th key={i} className="px-3 py-2 text-right whitespace-nowrap">{i === qPeriods.length - 1 ? <b className="text-white">{p}</b> : p}</th>)}
                  <th className="px-3 py-2 text-right bg-[#182130] text-[#d9b64a] font-bold">TTM°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]/60">
                {[
                  { label: "الإيرادات", vals: qRev, ttm: ttmRev },
                  ...(qGp.length > 0 ? [{ label: "إجمالي الربح", vals: qGp, ttm: null }] : []),
                  ...(qOp.length > 0 ? [{ label: "التشغيلي", vals: qOp, ttm: ttmOp }] : []),
                  { label: "صافي الربح", vals: qNet, ttm: ttmNet },
                ].map((row, ri) => (
                  <tr key={ri} className={`hover:bg-white/[0.02] ${ri === 3 ? "bg-[#182130]/30" : ""}`}>
                    <td className="px-3 py-2 text-white font-bold font-sans">{row.label}</td>
                    {row.vals.map((v, vi) => (
                      <td key={vi} className={`px-3 py-2 text-right tabular-nums ${v != null && v < 0 ? "text-rose-400" : "text-[#aab6c6]"}`}>
                        {v != null ? Math.round(v).toLocaleString() : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-bold text-white bg-[#182130]">
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
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">النمو <span className="text-[#5f6d80] font-normal normal-case">التحديد أولاً بالاستبعاد — قاعدة محاضرة 16</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                <th className="px-4 py-2 text-right">النوع</th>
                <th className="px-4 py-2 text-left font-mono">القيمة</th>
                <th className="px-4 py-2 text-right">القراءة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2735]">
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">البسيط (اللحظة الأخيرة)</td>
                <td className={`px-4 py-2.5 text-left font-mono font-bold ${data?.g_net != null && data.g_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(data?.g_net)}</td>
                <td className="px-4 py-2.5 text-[#5f6d80]">صافي سنوي/سنوي</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">المركب CAGR 3–6 سنوات</td>
                <td className="px-4 py-2.5 text-left font-mono text-amber-300">🔌</td>
                <td className="px-4 py-2.5 text-[#5f6d80]">يحتاج تعميق التاريخ لما قبل 2020 — في أوامر المبرمج</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">القدرة° (DuPont)</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#63a5f0]">
                  {data?.roe ? `${data.roe.toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-2.5 text-[#5f6d80]">
                  NPM {data?.nm?.toFixed(1) ?? "—"}% × دوران محسوب × رافعة مالية
                </td>
              </tr>
              <tr className="bg-[#182130]/60">
                <td className="px-4 py-2.5 text-[#d9b64a] font-black">GS المعتمد</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#d9b64a] font-black">{GS}.0%</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">نمو عابر محافظ معتمد وفق نوع الشركة ومنهجية الدورة</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Elements */}
      {meta.type !== "bank" && (
        <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
          <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
            <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">عناصر السلامة المالية <span className="text-[#5f6d80] font-normal normal-case">التقييم اللوني +1/0/−1 بحدود الدورة الحرفية</span></h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                  <th className="px-4 py-2 text-right">العنصر</th>
                  <th className="px-4 py-2 text-left font-mono">القيمة</th>
                  <th className="px-4 py-2 text-right">الحدود</th>
                  <th className="px-4 py-2 text-center">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]">
                {safetyItems.map((item, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-[#aab6c6]">{item.label}</td>
                    <td className={`px-4 py-2.5 text-left font-mono font-bold ${item.score > 0 ? "text-emerald-400" : item.score === 0 ? "text-amber-300" : "text-rose-400"}`}>
                      {item.v != null ? item.v.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#5f6d80]">{item.labels[0]}</td>
                    <td className="px-4 py-2.5 text-center"><ScoreChip score={item.score} /></td>
                  </tr>
                ))}
                <tr className="bg-[#182130]/60">
                  <td colSpan={2} className="px-4 py-2.5 text-[#d9b64a] font-black">الإجمالي → التعويض</td>
                  <td colSpan={2} className="px-4 py-2.5 text-left font-mono text-[#d9b64a] font-black">{totalSafety} → {safetyComp}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Build-Up R */}
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">العائد المناسب — Build-Up <span className="text-[#5f6d80] font-normal normal-case">عائد السند بالتصنيف + التعويضات الموزونة · نطاق الدورة 4–12%</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                <th className="px-4 py-2 text-right">البيان</th>
                <th className="px-4 py-2 text-left font-mono">الوزن</th>
                <th className="px-4 py-2 text-left font-mono">التعويض</th>
                <th className="px-4 py-2 text-left font-mono">الناتج</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2735]">
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">قواعد بورتر ({porter.total.toFixed(2)}/5)</td>
                <td className="px-4 py-2.5 text-left font-mono text-white">{(porterWeight * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-left font-mono text-white">{porter.comp}%</td>
                <td className="px-4 py-2.5 text-left font-mono text-white">{(porterWeight * porter.comp).toFixed(2)}%</td>
              </tr>
              {meta.type !== "bank" && (
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-[#aab6c6]">عناصر السلامة ({totalSafety})</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{(safetyWeight * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{safetyComp}%</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{(safetyWeight * safetyComp).toFixed(2)}%</td>
                </tr>
              )}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">عائد السند (A/BBB ≈)</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#5f6d80]">—</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#5f6d80]">—</td>
                <td className="px-4 py-2.5 text-left font-mono text-white">{bondRate}%</td>
              </tr>
              <tr className="bg-[#182130]/60">
                <td colSpan={3} className="px-4 py-2.5 text-[#d9b64a] font-black">R المطلوب</td>
                <td className="px-4 py-2.5 text-left font-mono text-[#d9b64a] font-black">{R}% ✅ ضمن 4–12</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3 text-[10px] text-[#5f6d80]">
          GL={GL}% (خليجي 3–5) · N={N}: أفق الاستراتيجية المعلنة · مرساة السند ريالية تقريبية — عائد صكوك الشركة نفسها أولى حين يتوفر 🔌
        </div>
      </div>

      {/* 9-Box Matrix */}
      {data?.epv && (
        <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
          <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
            <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">المربع التسعة — مناطق الأسعار° <span className="text-[#5f6d80] font-normal normal-case">معادلات الدورة الحرفية</span></h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#5f6d80] bg-[#0e141d] border-b border-[#1d2735]">
                  <th className="px-4 py-2 text-right">العدسة (للسهم، ريال)</th>
                  <th className="px-4 py-2 text-left font-mono">بدون نمو X/R</th>
                  <th className="px-4 py-2 text-left font-mono">جوردون GL</th>
                  <th className="px-4 py-2 text-left font-mono">عابر GS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]">
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-[#aab6c6]">من EPV (ستاتيك)</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{fmt(data.epv.bear, 2)}</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{fmt(data.epv.base, 2)}</td>
                  <td className="px-4 py-2.5 text-left font-mono text-white">{fmt(data.epv.bull, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1d2735] flex flex-wrap gap-4 items-center text-xs">
            <div>
              <span className="text-[#5f6d80]">السعر الحالي: </span>
              <span className="text-white font-mono font-bold">{data.px?.toFixed(2) ?? "—"}</span>
            </div>
            {zone && (
              <div>
                <span className="text-[#5f6d80]">المنطقة: </span>
                <span className={`font-bold ${zoneColor}`}>{zone}</span>
              </div>
            )}
            <div>
              <span className="text-[#5f6d80]">مقارنة بـ EPV Base: </span>
              <span className={`font-mono font-bold ${(data.epv.vs ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmtPct(data.epv.vs)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {data?.wl && data.wl.length > 0 && (
        <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
          <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
            <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">الأعلام الحمراء° وبوابة الشراء</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.wl.map(([type, msg], i) => (
              <div key={i} className={`flex items-start gap-2.5 text-xs p-2.5 rounded-lg border ${type === "w" ? "bg-amber-500/8 border-amber-500/20 text-amber-200" : "bg-emerald-500/8 border-emerald-500/20 text-emerald-200"}`}>
                <span className="font-bold">{type === "w" ? "⚑" : "✓"}</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="bg-[#121924] border border-[#1d2735] rounded-xl overflow-hidden">
        <div className="bg-[#0e141d] px-4 py-2 border-b border-[#1d2735]">
          <h3 className="text-xs font-bold text-[#d9b64a] uppercase tracking-wider">الخلاصة والقرار <span className="text-[#5f6d80] font-normal normal-case">بصيغة الدورة — تحليل تعليمي وليس توصية استثمارية</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#1d2735]">
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">العائد المطلوب R</td>
                <td className="px-4 py-2.5 text-left font-mono text-white font-bold">{R}%</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[#aab6c6]">GS النمو العابر المعتمد</td>
                <td className="px-4 py-2.5 text-left font-mono text-white font-bold">{GS}.0%</td>
              </tr>
              {zone && (
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-[#aab6c6]">المنطقة السعرية</td>
                  <td className={`px-4 py-2.5 text-left font-mono font-bold ${zoneColor}`}>{zone}</td>
                </tr>
              )}
              <tr className="bg-[#182130]/60">
                <td className="px-4 py-2.5 text-[#d9b64a] font-black">الحكم</td>
                <td className="px-4 py-2.5 text-[#aab6c6]">
                  {meta.type === "bank" ? "بنك يُقرأ بعدة البنوك (NII/NIM/CASA) — القرار رهن اكتمال البيانات." :
                   zone === "ذهبية" ? "سعر ذهبي أدنى من القيمة بلا نمو — هامش أمان ممتاز." :
                   zone === "فضية" ? "منطقة فضية — يستحق المتابعة والتحليل التفصيلي." :
                   zone === "برونزية" ? "منطقة برونزية — السعر يقترب من العادل وفق GS." :
                   "تحليل تعليمي وفق منهجية الدورة وليس توصية استثمارية."}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3 text-[10px] text-[#5f6d80]">هذا تحليل تعليمي وفق منهجية الدورة وليس توصية استثمارية.</div>
      </div>
    </div>
  );
}
