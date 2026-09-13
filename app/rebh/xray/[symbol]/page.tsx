"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Layers, ShieldCheck, AlertTriangle, Printer, Search,
  Droplets, Zap, Wind, Flame, Anchor, BarChart3, Info
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, CartesianGrid, Cell, Legend
} from "recharts";
import { API_BASE_URL } from "@/lib/api/config";

// ─── Story Engine ─────────────────────────────────────────────────────────────
// Generates narrative sentences from real numbers.

function buildStory(d: any, periodIndex = -1): {
  cash: { text: string; signal: "green" | "amber" | "red"; formula: string };
  margin: { text: string; signal: "green" | "amber" | "red"; formula: string };
  leverage: { text: string; signal: "green" | "amber" | "red"; formula: string };
  quality: { text: string; signal: "green" | "amber" | "red"; formula: string };
  funding: { text: string; signal: "green" | "amber" | "red"; formula: string };
  headline: string;
  subtitle: string;
} {
  const is = d?.income_statement || {};
  const cf = d?.cf || {};
  const bs = d?.bs || {};
  const cur = d?.cur || {};
  const valueAt = (values: any[] = []) => values[periodIndex] ?? values.at(-1) ?? 0;

  const rev = valueAt(is.rev);
  const net = valueAt(is.net);
  const gp = valueAt(is.gp);
  const cfo = valueAt(cf.cfo);
  const fcf = valueAt(cf.fcf);
  const capex = Math.abs(valueAt(cf.capex));
  const ca = valueAt(bs.current_assets);
  const cl = valueAt(bs.current_liabilities);
  const sd = valueAt(bs.short_debt);
  const ld = valueAt(bs.long_debt);
  const eq = valueAt(bs.total_equity);
  const ta = valueAt(bs.total_assets);

  const nm = rev > 0 ? (net / rev) * 100 : null;
  const gm = rev > 0 ? (gp / rev) * 100 : null;
  const curRatio = cl > 0 ? ca / cl : null;
  const deRatio = eq > 0 ? (sd + ld) / eq : null;
  const cfoNi = net !== 0 ? (cfo / net) * 100 : null;
  const fcfYield = ta > 0 ? (fcf / ta) * 100 : null;

  // ── Cash & FCF story ──────────────────────────────────────────────────────
  let cashText: string, cashSignal: "green" | "amber" | "red";
  if (fcf > 0 && cfoNi != null && cfoNi >= 80) {
    cashText = `الشركة مُولِّدة للكاش بامتياز — FCF إيجابي (${fcf.toFixed(0)} M SAR) وتحويل الأرباح إلى كاش ${cfoNi.toFixed(0)}% من صافي الربح.`;
    cashSignal = "green";
  } else if (fcf > 0) {
    cashText = `التدفق الحر إيجابي (${fcf.toFixed(0)} M SAR) لكن نسبة CFO/NI ${cfoNi != null ? cfoNi.toFixed(0) + "%" : "—"} تستحق المتابعة.`;
    cashSignal = "amber";
  } else if (cfo > 0 && fcf <= 0) {
    cashText = `التدفق التشغيلي إيجابي (${cfo.toFixed(0)} M) لكن النفقات الرأسمالية (${capex.toFixed(0)} M) تستنزف التدفق الحر — مرحلة توسع أو ضغط هيكلي.`;
    cashSignal = "amber";
  } else {
    cashText = `تدفق نقدي سلبي — CFO (${cfo.toFixed(0)} M) وFCF (${fcf.toFixed(0)} M). الشركة تستهلك النقد ولا تُولِّده.`;
    cashSignal = "red";
  }

  // ── Margin story ──────────────────────────────────────────────────────────
  let marginText: string, marginSignal: "green" | "amber" | "red";
  const nmPrev = (is.net || []).length >= 2
    ? ((is.net || []).at(-1) - (is.net || []).at(-2)) / Math.abs((is.net || []).at(-2) || 1) * 100
    : null;

  if (nm != null && nm >= 15) {
    marginText = `هامش صافي ربح قوي ${nm.toFixed(1)}% (إجمالي: ${gm?.toFixed(1) ?? "—"}%). ${nmPrev != null ? (nmPrev >= 0 ? `تحسّن ${nmPrev.toFixed(1)}% عن العام الماضي.` : `تراجع ${Math.abs(nmPrev).toFixed(1)}% — مؤشر انضغاط يستحق المتابعة.`) : ""}`;
    marginSignal = "green";
  } else if (nm != null && nm >= 5) {
    marginText = `هامش صافي ربح متوسط ${nm.toFixed(1)}%. ${nmPrev != null && nmPrev < 0 ? `الهامش في منحنى تراجع (${nmPrev.toFixed(1)}% YoY) — راجع تكاليف المبيعات وضغط التسعير.` : "الهامش مستقر في النطاق المقبول."}`;
    marginSignal = "amber";
  } else if (nm != null) {
    marginText = `هامش صافي ربح ضعيف ${nm.toFixed(1)}%. قد يعكس ضغطاً تسعيرياً أو ارتفاعاً في التكاليف. الإجمالي ${gm?.toFixed(1) ?? "—"}% — الفارق بين الإجمالي والصافي يكشف حجم المصاريف التشغيلية.`;
    marginSignal = "red";
  } else {
    marginText = "لا تتوفر بيانات كافية لحساب هوامش الربح.";
    marginSignal = "amber";
  }

  // ── Leverage story ────────────────────────────────────────────────────────
  let leverageText: string, leverageSignal: "green" | "amber" | "red";
  if (deRatio != null && deRatio <= 0.5) {
    leverageText = `ميزانية محافظة — نسبة الدين/حقوق الملكية ${deRatio.toFixed(2)}×. الشركة ذات ملاءة عالية مع مرونة تمويلية كبيرة.`;
    leverageSignal = "green";
  } else if (deRatio != null && deRatio <= 1.5) {
    leverageText = `رافعة مالية معتدلة — D/E ${deRatio.toFixed(2)}×. مقبول في قطاعات رأسمال المال، لكن يستوجب متابعة تكاليف الفائدة.`;
    leverageSignal = "amber";
  } else if (deRatio != null) {
    leverageText = `رافعة مالية مرتفعة — D/E ${deRatio.toFixed(2)}×. خطر الملاءة قائم خاصة في بيئة رفع الفائدة. راجع جدول استحقاق الديون.`;
    leverageSignal = "red";
  } else {
    leverageText = "لا تتوفر بيانات الدين وحقوق الملكية لحساب الرافعة.";
    leverageSignal = "amber";
  }

  // ── Quality story ─────────────────────────────────────────────────────────
  const piotroski = d?.f_score ?? null;
  const beneish = d?.beneish ?? null;
  let qualityText: string, qualitySignal: "green" | "amber" | "red";

  if (piotroski != null && piotroski >= 7) {
    qualityText = `جودة مالية عالية — Piotroski F-Score ${piotroski}/9. ${beneish != null ? `Beneish M-Score ${beneish.toFixed(2)} — ${beneish < -1.78 ? "لا دلائل على تلاعب محاسبي (< −1.78)." : "أعلى من عتبة الخطر −1.78 — راجع مكونات الأرباح بعناية."}` : ""}`;
    qualitySignal = "green";
  } else if (piotroski != null && piotroski >= 4) {
    qualityText = `جودة مالية متوسطة — Piotroski F-Score ${piotroski}/9. ${beneish != null ? `Beneish M-Score ${beneish.toFixed(2)}.` : ""} تحسن الربحية والكفاءة يعزز الدرجة.`;
    qualitySignal = "amber";
  } else if (piotroski != null) {
    qualityText = `إشارات ضعف مالي — Piotroski F-Score ${piotroski}/9. قد يعكس تراجع الربحية أو تدهور السيولة. إشارة ضعف تستحق المراجعة.`;
    qualitySignal = "red";
  } else {
    qualityText = cfoNi != null
      ? `CFO/NI = ${cfoNi.toFixed(0)}% — ${cfoNi >= 100 ? "أرباح محاسبية مُترجَمة لكاش حقيقي (جودة عالية)." : "فجوة بين الأرباح والكاش — راجع الذمم المدينة والمخزون."}`
      : "بيانات Piotroski غير متاحة.";
    qualitySignal = cfoNi != null && cfoNi >= 80 ? "green" : "amber";
  }

  // ── Funding story ─────────────────────────────────────────────────────────
  const cff = valueAt(cf.cff);
  const borr = valueAt(cf.borrowings);
  let fundingText: string, fundingSignal: "green" | "amber" | "red";

  if (cff < 0 && fcf > 0) {
    fundingText = `الشركة تُعيد الكاش للمساهمين (CFF سلبي ${cff.toFixed(0)} M) — ممتاز: تُسدد ديوناً أو توزع أرباحاً من تدفق حر حقيقي.`;
    fundingSignal = "green";
  } else if (borr > 0 && fcf > 0) {
    fundingText = `تمويل خارجي جديد (${borr.toFixed(0)} M) مع تدفق حر إيجابي — الاقتراض للتوسع لا للبقاء.`;
    fundingSignal = "amber";
  } else if (borr > 0 && fcf <= 0) {
    fundingText = `الشركة تعتمد على الاقتراض (${borr.toFixed(0)} M) لتمويل عمليات أو فجوة تدفق نقدي — تدفق حر سلبي (${fcf.toFixed(0)} M). إشارة تحذيرية.`;
    fundingSignal = "red";
  } else {
    fundingText = `بيانات التمويل: CFF ${cff.toFixed(0)} M. الشركة في مرحلة ${cff > 0 ? "استقطاب تمويل" : "سداد أو توزيع"}.`;
    fundingSignal = cff < 0 ? "green" : "amber";
  }

  // ── Headline ──────────────────────────────────────────────────────────────
  const signals = [cashSignal, marginSignal, leverageSignal, qualitySignal, fundingSignal];
  const greens = signals.filter(s => s === "green").length;
  const reds = signals.filter(s => s === "red").length;

  let headline: string, subtitle: string;
  if (greens >= 4) {
    headline = "شركة ذات كاش قوي ونوعية مالية ممتازة";
    subtitle = "الأرباح حقيقية · التدفق النقدي يدعمها · الميزانية سليمة · النمو مستدام";
  } else if (greens >= 3 && reds === 0) {
    headline = "أداء مالي جيد مع نقاط تستحق المتابعة";
    subtitle = "قاعدة مالية صلبة مع ضغوط محددة قابلة للتتبع";
  } else if (reds >= 3) {
    headline = "ضغوط مالية متعددة — يستوجب الحذر والتمحيص";
    subtitle = "عدة مؤشرات في المنطقة الحمراء — راجع السيولة والجودة والرافعة";
  } else {
    headline = "صورة مالية مختلطة — قوة في جانب وضغط في آخر";
    subtitle = "بعض نقاط القوة موازية لمخاطر محددة — قراءة تعمقية مطلوبة";
  }

  return {
    cash: { text: cashText, signal: cashSignal, formula: "FCF = CFO − |CapEx| · CFO/NI = التدفق التشغيلي ÷ صافي الربح" },
    margin: { text: marginText, signal: marginSignal, formula: "NM% = صافي الربح ÷ الإيرادات · GM% = إجمالي الربح ÷ الإيرادات" },
    leverage: { text: leverageText, signal: leverageSignal, formula: "D/E = (ديون قصيرة + طويلة) ÷ حقوق المساهمين" },
    quality: { text: qualityText, signal: qualitySignal, formula: "Piotroski 9-point checklist · Beneish M-Score < −1.78 = خطر تلاعب (المعيار المعتمد داخل المنصة)" },
    funding: { text: fundingText, signal: fundingSignal, formula: "CFF = صافي التدفق التمويلي · Borrowings = صافي الاقتراض الجديد" },
    headline,
    subtitle,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SIG_COLOR = {
  green: { bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]", text: "text-[#166534]", dot: "bg-[#16A34A]", badge: "bg-[#BBF7D0] text-[#166534]" },
  amber: { bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", text: "text-[#92400E]", dot: "bg-[#D97706]", badge: "bg-[#FDE68A] text-[#92400E]" },
  red: { bg: "bg-[#FEF2F2]", border: "border-[#FECACA]", text: "text-[#991B1B]", dot: "bg-[#DC2626]", badge: "bg-[#FECACA] text-[#991B1B]" },
  neutral: { bg: "bg-[#F8FAFC]", border: "border-[#E2E8F0]", text: "text-[#475569]", dot: "bg-[#94A3B8]", badge: "bg-[#E2E8F0] text-[#475569]" },
};

function FlowBar({ label, value, max, color, unit = "M SAR" }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = max !== 0 ? Math.min(100, Math.abs(value / max) * 100) : 0;
  const isNeg = value < 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold text-[#374151] w-36 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-5 bg-[#F1F5F9] rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all ${isNeg ? "bg-[#FECACA]" : ""}`}
          style={{ width: `${pct}%`, backgroundColor: isNeg ? undefined : color }}
        />
      </div>
      <span className={`font-mono text-[11px] font-bold w-24 text-right ${isNeg ? "text-[#DC2626]" : "text-[#1E293B]"}`}>
        {value >= 0 ? "+" : ""}{value.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit}
      </span>
    </div>
  );
}

function StoryCard({
  icon, title, entry, showFormula
}: {
  icon: React.ReactNode;
  title: string;
  entry: { text: string; signal: "green" | "amber" | "red"; formula: string };
  showFormula: boolean;
}) {
  const c = SIG_COLOR[entry.signal];
  return (
    <div className={`rounded-[6px] border ${c.border} ${c.bg} p-4 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`${c.text}`}>{icon}</span>
          <span className="text-xs font-bold text-[#0F172A]">{title}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
          {entry.signal === "green" ? "✓ إيجابي" : entry.signal === "amber" ? "◑ انتبه" : "✗ سلبي"}
        </span>
      </div>
      <p className="text-xs text-[#374151] leading-relaxed">{entry.text}</p>
      {showFormula && (
        <div className="border-t border-current/10 pt-2 text-[10px] font-mono text-[#64748B]">
          <Info size={10} className="inline-block mr-1" />
          {entry.formula}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RebhStoryXRayPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = ((params?.symbol as string) || "2222").toUpperCase();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        // Fetch both payloads in parallel
        const [stmtRes, engRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`),
          fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`),
        ]);
        let merged: any = {};
        if (stmtRes.status === "fulfilled" && stmtRes.value.ok) {
          merged = { ...merged, ...await stmtRes.value.json() };
        }
        if (engRes.status === "fulfilled" && engRes.value.ok) {
          const eng = await engRes.value.json();
          // Merge in engine-specific fields without overwriting statement data
          merged.f_score = eng.f_score;
          merged.beneish = eng.beneish;
          merged.altman = eng.altman;
          merged.piotroski = eng.f_score;
          merged.red_flags = eng.red_flags;
          merged.buy_gate = eng.buy_gate;
          merged.TTM = eng.TTM;
          merged.safety = eng.safety;
          merged.grades = eng.grades;
          merged.bcg_stage = eng.bcg_stage;
          merged.quarantine_reason = eng.quarantine_reason;
          merged.wl = eng.wl;
          merged.fv = eng.fv;
          merged.khurafshi = eng.khurafshi;
          merged.px = merged.px || eng.px;
          merged.mc = merged.mc || eng.mc;
          merged.pe = eng.pe;
          merged.pb = eng.pb;
        }
        if (!cancelled) setData(merged);
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
    if (s.length === 4) router.push(`/rebh/xray/${s}`);
  };

  // Derived data
  const periods: string[] = data?.income_statement?.periods || [];
  const activePeriodIndex = selectedPeriodIndex >= 0 && selectedPeriodIndex < periods.length
    ? selectedPeriodIndex
    : Math.max(periods.length - 1, 0);
  const valueAt = (values: any[] = []) => values[activePeriodIndex] ?? values.at(-1) ?? 0;
  const story = useMemo(() => data ? buildStory(data, activePeriodIndex) : null, [data, activePeriodIndex]);

  const is = data?.income_statement || {};
  const cf = data?.cf || {};
  const bs = data?.bs || {};

  // Flow river values (latest period)
  const rev = valueAt(is.rev);
  const cogs = valueAt(is.cogs);
  const gp = valueAt(is.gp);
  const op = valueAt(is.op);
  const net = valueAt(is.net);
  const cfo = valueAt(cf.cfo);
  const capex = Math.abs(valueAt(cf.capex));
  const fcf = valueAt(cf.fcf);
  const cfi = valueAt(cf.cfi);
  const cff = valueAt(cf.cff);

  const ta = valueAt(bs.total_assets);
  const ca = valueAt(bs.current_assets);
  const cl = valueAt(bs.current_liabilities);
  const eq = valueAt(bs.total_equity);
  const sd = valueAt(bs.short_debt);
  const ld = valueAt(bs.long_debt);
  const tl = valueAt(bs.total_liabilities);
  const re = valueAt(bs.retained_earnings);
  const cash = valueAt(bs.cash);

  // Operating cycle proxies
  const nm = rev > 0 ? (net / rev) * 100 : null;
  const gm = rev > 0 ? (gp / rev) * 100 : null;
  const opm = rev > 0 ? (op / rev) * 100 : null;
  const curRatio = cl > 0 ? ca / cl : null;
  const deRatio = eq > 0 ? (sd + ld) / eq : null;
  const cfoNi = net !== 0 ? (cfo / net) * 100 : null;
  const debtCover = cfo > 0 && (sd + ld) > 0 ? (sd + ld) / cfo : null;

  // Working Capital = Current Assets − Current Liabilities
  const workingCapital = ca - cl;
  const wcTrend = (bs.current_assets || []).map((cav: number, i: number) => {
    const clv: number = (bs.current_liabilities || [])[i] ?? 0;
    return cav - clv;
  }).slice(-5);

  // DSO proxy: Receivables ÷ (Revenue / 365)
  const receivables: number = (bs.receivables || []).at(-1) ?? 0;
  const dso: number | null = rev > 0 && receivables > 0
    ? Math.round((receivables / rev) * 365) : null;

  // DIO proxy: Inventory ÷ (COGS / 365)
  const inventory: number = (bs.inventory || []).at(-1) ?? 0;
  const dIO: number | null = cogs > 0 && inventory > 0
    ? Math.round((inventory / cogs) * 365) : null;

  // DPO proxy: Payables ÷ (COGS / 365)
  const payables: number = (bs.payables ?? bs.accounts_payable ?? []).at?.(-1) ?? 0;
  const dPO: number | null = cogs > 0 && payables > 0
    ? Math.round((payables / cogs) * 365) : null;

  // Period label
  const latestPeriod = periods[activePeriodIndex] ?? "";

  // Trend series for mini sparklines (last 5 years)
  const revTrend = (is.rev || []).slice(-5);
  const netTrend = (is.net || []).slice(-5);
  const cfoTrend = (cf.cfo || []).slice(-5);
  const fcfTrend = (cf.fcf || []).slice(-5);
  const eqTrend = (bs.total_equity || []).slice(-5);

  // Dynamic Chart 1: Money River Waterfall / Bridge Data
  const waterfallData = useMemo(() => {
    return [
      { name: "الإيرادات", val: rev, fill: "#2563EB", type: "inflow", desc: "إجمالي المبيعات المحققة" },
      { name: "تكلفة المبيعات", val: -cogs, fill: "#64748B", type: "outflow", desc: "تكاليف الإنتاج والبضاعة المباشرة" },
      { name: "إجمالي الربح", val: gp, fill: "#16A34A", type: "subtotal", desc: "مجمل الربح بعد استبعاد التكلفة المباشرة" },
      { name: "المصاريف التشغيلية", val: -(gp - op), fill: "#F59E0B", type: "outflow", desc: "مصاريف البيع والتسويق والإدارة" },
      { name: "الربح التشغيلي", val: op, fill: "#8C3B32", type: "subtotal", desc: "EBIT - ربح النشاط الأساسي" },
      { name: "الفوائد والزكاة", val: -(op - net), fill: "#EF4444", type: "outflow", desc: "تكاليف التمويل ومخصصات الزكاة والضرائب" },
      { name: "صافي الربح", val: net, fill: net >= 0 ? "#10B981" : "#DC2626", type: "bottomline", desc: "صافي دخل المساهمين النهائي" },
      { name: "التدفق التشغيلي", val: cfo, fill: "#059669", type: "cash", desc: "الكاش الفعلي الداخل من العمليات (CFO)" },
      { name: "الإنفاق الرأسمالي", val: -capex, fill: "#D97706", type: "capex", desc: "الاستثمار في الأصول والمصانع (CapEx)" },
      { name: "التدفق الحر", val: fcf, fill: fcf >= 0 ? "#0D9488" : "#B91C1C", type: "fcf", desc: "كاش النمو والتوزيعات الحقيقي (FCF)" }
    ];
  }, [rev, cogs, gp, op, net, cfo, capex, fcf]);

  // Dynamic Chart 2: Multi-Period Balance Sheet Evolution Data (Last 5 periods)
  const balanceEvolutionData = useMemo(() => {
    if (!periods.length) return [];
    const count = Math.min(periods.length, 5);
    const startIdx = Math.max(0, periods.length - count);
    
    return periods.slice(startIdx).map((p, i) => {
      const idx = startIdx + i;
      const pTa = (bs.total_assets || [])[idx] ?? 0;
      const pCash = (bs.cash || [])[idx] ?? 0;
      const pCa = (bs.current_assets || [])[idx] ?? 0;
      const pEq = (bs.total_equity || [])[idx] ?? 0;
      const pTl = (bs.total_liabilities || [])[idx] ?? 0;
      const pDebt = ((bs.short_debt || [])[idx] ?? 0) + ((bs.long_debt || [])[idx] ?? 0);

      return {
        period: p,
        cash: pCash,
        otherCurrent: Math.max(0, pCa - pCash),
        nonCurrent: Math.max(0, pTa - pCa),
        totalAssets: pTa,
        equity: pEq,
        debt: pDebt,
        otherLiabilities: Math.max(0, pTl - pDebt),
        totalLiabAndEq: pTl + pEq
      };
    });
  }, [periods, bs]);

  function Sparkline({ vals, color }: { vals: number[]; color: string }) {
    if (!vals.length) return null;
    const chartData = vals.map((v, i) => ({ i, v }));

    return (
      <div className="w-20 h-7 inline-block align-middle">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2, fill: color }}
              isAnimationActive={true}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length && payload[0].value != null) {
                  return (
                    <div className="bg-[#1E293B] text-white text-[10px] px-1.5 py-0.5 rounded shadow font-mono">
                      {Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-xs">
        <div className="w-11 h-11 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-sm font-bold text-[#1A1A1A]">جاري تشغيل محرك X-Ray</h2>
        <p className="text-xs text-[#6B7280]">
          استخراج القوائم · حساب النسب · بناء القصة المالية…
        </p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8">
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
        <h2 className="text-base font-bold">تعذر تحميل X-Ray — {symbol}</h2>
        <p className="text-xs text-[#6B7280]">{error}</p>
        <div className="flex justify-center gap-2">
          <button onClick={() => { setLoading(true); setError(null); }} className="px-4 py-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold">إعادة المحاولة</button>
          <Link href="/rebh/xray" className="px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#752f28]">رمز آخر</Link>
        </div>
      </div>
    </div>
  );

  const name = data.name || symbol;
  const nameEn = data.en || "";
  const sector = data.sec || "—";
  const flags: any[] = data.red_flags || [];
  const sigColor = SIG_COLOR;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <Link href="/rebh/xray">
            <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs cursor-pointer hover:bg-[#752f28]">
              X-RAY
            </span>
          </Link>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">
            قصة الشركة المالية · X-Ray — <span className="font-mono text-[#8C3B32]">{symbol}</span>
          </h1>
          <span className="hidden sm:block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:block text-xs text-[#6B7280] truncate max-w-[200px]">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleNav} className="flex items-center gap-1.5">
            <input type="text" inputMode="numeric" maxLength={4} value={search}
              onChange={e => setSearch(e.target.value.replace(/\D/g, ""))}
              placeholder="رمز" className="w-24 px-2.5 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]" />
            <button type="submit" className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold">عرض</button>
          </form>
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 rounded-[4px] border text-xs font-semibold transition-colors ${showFormulas ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
          >
            الصيغ
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold">
            <Printer size={13} />طباعة
          </button>
        </div>
      </header>

      {/* ── COMPANY SNAPSHOT ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base shrink-0">{symbol}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#1A1A1A]">{name}</h2>
                {nameEn && <span className="text-[11px] font-mono text-[#6B7280]">{nameEn}</span>}
              </div>
              <p className="text-xs text-[#6B7280]">{sector} · فترة التحليل: {latestPeriod}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
              <span>الفترة:</span>
              <select
                value={activePeriodIndex}
                onChange={e => setSelectedPeriodIndex(Number(e.target.value))}
                className="px-2 py-1.5 bg-[#F8FAFC] border border-[#D1D5DB] rounded-[4px] text-xs font-mono outline-none focus:border-[#8C3B32]"
              >
                {periods.map((period, index) => (
                  <option key={`${period}-${index}`} value={index}>{period}</option>
                ))}
              </select>
            </label>
            {[
              { label: "السعر", val: data.px ? `${data.px} SAR` : "—" },
              { label: "P/E", val: data.pe ? `${data.pe}×` : "—" },
              { label: "P/B", val: data.pb ? `${data.pb}×` : "—" },
              { label: "Piotroski", val: data.f_score != null ? `${data.f_score}/9` : "—" },
            ].map(s => (
              <div key={s.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-1.5 text-center">
                <span className="block text-[10px] text-[#64748B]">{s.label}</span>
                <span className="block font-mono font-black text-xs text-[#0F172A]">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEADLINE ─────────────────────────────────────────────────────── */}
      {story && (
        <section className="bg-[#0F172A] text-white px-6 py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono text-[#94A3B8] mb-1">القصة المالية المُشتقة من البيانات</p>
              <h2 className="text-xl font-black tracking-tight">{story.headline}</h2>
              <p className="text-sm text-[#94A3B8] mt-1">{story.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {[
                { k: "cash", l: "الكاش" },
                { k: "margin", l: "الهوامش" },
                { k: "leverage", l: "الرافعة" },
                { k: "quality", l: "الجودة" },
                { k: "funding", l: "التمويل" },
              ].map(({ k, l }) => {
                const sig = story[k as keyof typeof story] as any;
                const s = sig?.signal ?? "neutral";
                const col = s === "green" ? "#16A34A" : s === "amber" ? "#D97706" : "#DC2626";
                return (
                  <div key={k} className="flex flex-col items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col }} />
                    <span className="text-[9px] font-bold text-[#94A3B8]">{l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── STORY NARRATIVE CARDS ─────────────────────────────────────── */}
        {story && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Activity size={14} className="text-[#8C3B32]" />
              قصة X-Ray — بطاقات القراءة السردية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <StoryCard icon={<Droplets size={14} />} title="قصة التدفق النقدي" entry={story.cash} showFormula={showFormulas} />
              <StoryCard icon={<Flame size={14} />} title="قصة الهوامش" entry={story.margin} showFormula={showFormulas} />
              <StoryCard icon={<Anchor size={14} />} title="قصة الرافعة والديون" entry={story.leverage} showFormula={showFormulas} />
              <StoryCard icon={<Zap size={14} />} title="قصة جودة الأرباح" entry={story.quality} showFormula={showFormulas} />
              <StoryCard icon={<Wind size={14} />} title="قصة التمويل والتوزيعات" entry={story.funding} showFormula={showFormulas} />
            </div>
          </div>
        )}

        {/* ── MONEY RIVER — DYNAMIC WATERFALL & FLOW PANEL ──────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp size={14} className="text-[#8C3B32]" />
                نهر المال التفاعلي — Interactive Money River ({latestPeriod})
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                تدرج توليد وتوزيع القيمة من إجمالي الإيرادات حتى الكاش الحر النهائي (FCF).
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded">
              وحدة: مليون SAR
            </span>
          </div>

          {/* Dynamic Recharts Bar Waterfall Visual */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 15, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#475569" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  tickFormatter={(val) => `${Number(val).toLocaleString()}M`}
                  orientation="right"
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const isPositive = d.val >= 0;
                      return (
                        <div className="bg-[#0F172A] text-white p-3 rounded-[6px] shadow-xl text-xs font-sans space-y-1 z-50">
                          <div className="font-bold flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                            <span>{d.name}</span>
                            <span className="font-mono" style={{ color: d.fill }}>
                              {isPositive ? "+" : ""}{d.val.toLocaleString()} M SAR
                            </span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8]">{d.desc}</p>
                          {rev > 0 && (
                            <div className="text-[10px] font-mono text-[#CBD5E1] pt-1">
                              يمثل {Math.abs((d.val / rev) * 100).toFixed(1)}% من إجمالي الإيراد
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Metric Rows */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <FlowBar label="الإيرادات (Revenue)" value={rev} max={rev} color="#2563EB" />
            <FlowBar label="تكلفة المبيعات (COGS)" value={-cogs} max={rev} color="#94A3B8" />
            <FlowBar label="إجمالي الربح (GP)" value={gp} max={rev} color="#16A34A" />
            <FlowBar label="الربح التشغيلي (EBIT)" value={op} max={rev} color="#8C3B32" />
            <FlowBar label="صافي الربح (Net Income)" value={net} max={rev} color="#DC2626" />
            <div className="border-t border-dashed border-[#E5E7EB] pt-1" />
            <FlowBar label="التدفق التشغيلي (CFO)" value={cfo} max={Math.abs(rev)} color="#059669" />
            <FlowBar label="الإنفاق الرأسمالي (CapEx)" value={-capex} max={Math.abs(rev)} color="#D97706" />
            <FlowBar label="التدفق الحر (FCF)" value={fcf} max={Math.abs(rev)} color="#0D9488" />
          </div>

          {showFormulas && (
            <div className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2 mt-1">
              GP = Rev − COGS · EBIT = GP − OpEx · FCF = CFO − |CapEx| · الأشرطة الحمراء = قيم سالبة
            </div>
          )}
        </div>

        {/* ── BALANCE SHEET BREATHING — MULTI-PERIOD DYNAMIC STACKED CHART ──────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Layers size={14} className="text-[#8C3B32]" />
                تنفّس الميزانية وتطور هيكل رأس المال — Balance Sheet Evolution
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                توسع الأصول وهيكل التمويل (حقوق المساهمين vs الديون) عبر الفترات السابقة
              </p>
            </div>
            <span className="font-mono text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded">
              إجمالي الأصول الحالية: {ta.toLocaleString(undefined, { maximumFractionDigits: 0 })} M SAR
            </span>
          </div>

          {/* Dynamic Recharts Stacked Bar: Evolution across periods */}
          {balanceEvolutionData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceEvolutionData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    tickFormatter={(val) => `${Number(val).toLocaleString()}M`}
                    orientation="right"
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0F172A] text-white p-3 rounded-[6px] shadow-xl text-xs font-sans space-y-1.5 z-50">
                            <div className="font-bold border-b border-white/10 pb-1 flex justify-between gap-4">
                              <span>فترة: {label}</span>
                              <span className="text-[#38BDF8] font-mono">
                                الأصول: {payload[0]?.payload?.totalAssets?.toLocaleString()} M
                              </span>
                            </div>
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between gap-3 text-[#60A5FA]">
                                <span>نقد ومعادلات:</span>
                                <span>{payload[0]?.payload?.cash?.toLocaleString()} M</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[#34D399]">
                                <span>أصول متداولة أخرى:</span>
                                <span>{payload[0]?.payload?.otherCurrent?.toLocaleString()} M</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[#94A3B8]">
                                <span>أصول طويلة الأجل:</span>
                                <span>{payload[0]?.payload?.nonCurrent?.toLocaleString()} M</span>
                              </div>
                              <div className="border-t border-white/10 pt-1 flex justify-between gap-3 text-[#38BDF8]">
                                <span>حقوق المساهمين:</span>
                                <span>{payload[0]?.payload?.equity?.toLocaleString()} M</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[#F87171]">
                                <span>إجمالي الديون:</span>
                                <span>{payload[0]?.payload?.debt?.toLocaleString()} M</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    formatter={(val) => {
                      const map: Record<string, string> = {
                        cash: "نقد كاش",
                        otherCurrent: "متداول أخرى",
                        nonCurrent: "أصول ثابتة",
                        equity: "حقوق ملكية",
                        debt: "ديون وقروض",
                      };
                      return <span className="text-[#374151] font-sans">{map[val] || val}</span>;
                    }}
                  />
                  <Bar dataKey="cash" stackId="assets" fill="#2563EB" name="cash" />
                  <Bar dataKey="otherCurrent" stackId="assets" fill="#10B981" name="otherCurrent" />
                  <Bar dataKey="nonCurrent" stackId="assets" fill="#94A3B8" name="nonCurrent" />
                  <Bar dataKey="equity" stackId="funding" fill="#0EA5E9" name="equity" />
                  <Bar dataKey="debt" stackId="funding" fill="#DC2626" name="debt" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#6B7280]">
              بيانات الميزانية التاريخية غير متوفرة لهذا الرمز
            </div>
          )}

          {/* Current Period Snapshot Bars */}
          {ta > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#374151]">
                <span>توزيع هيكل الفترة الحالية ({latestPeriod})</span>
              </div>
              <div className="h-6 rounded-full overflow-hidden flex w-full">
                <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${ta > 0 ? (cash / ta) * 100 : 0}%` }} title={`نقد: ${cash.toFixed(0)} M`} />
                <div className="h-full bg-[#10B981] transition-all" style={{ width: `${ta > 0 ? ((ca - cash) / ta) * 100 : 0}%` }} title={`أصول متداولة أخرى`} />
                <div className="h-full bg-[#94A3B8] transition-all" style={{ width: `${ta > 0 ? ((ta - ca) / ta) * 100 : 0}%` }} title={`أصول طويلة الأجل`} />
              </div>
              <div className="h-6 rounded-full overflow-hidden flex w-full mt-2">
                <div className="h-full bg-[#DC2626]" style={{ width: `${ta > 0 ? (tl / ta) * 100 : 0}%` }} title={`التزامات: ${tl.toFixed(0)} M`} />
                <div className="h-full bg-[#0EA5E9]" style={{ width: `${ta > 0 ? (eq / ta) * 100 : 0}%` }} title={`حقوق: ${eq.toFixed(0)} M`} />
              </div>
            </div>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {[
              { label: "نسبة التداول", val: curRatio, unit: "×", ok: curRatio != null && curRatio >= 1.5, formula: "الأصول المتداولة ÷ الالتزامات المتداولة" },
              { label: "D/E الرافعة", val: deRatio, unit: "×", ok: deRatio != null && deRatio <= 1.5, formula: "(قصير + طويل) ÷ حقوق الملكية" },
              { label: "نقد لدى الشركة", val: cash, unit: "M", ok: cash > 0, formula: "النقد والمعادل في الميزانية" },
              { label: "أرباح مُبقاة", val: re, unit: "M", ok: re >= 0, formula: "الأرباح التراكمية غير الموزعة" },
            ].map((k, i) => (
              <div key={i} className={`rounded-[6px] border p-3 ${k.ok ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FEF2F2] border-[#FECACA]"}`}>
                <span className="block text-[10px] text-[#64748B]">{k.label}</span>
                <span className="block font-mono font-black text-sm text-[#0F172A] mt-0.5">
                  {k.val != null ? k.val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} {k.unit}
                </span>
                {showFormulas && <span className="block text-[9px] text-[#94A3B8] mt-1 font-mono">{k.formula}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── CASH CONVERSION CYCLE VISUAL ────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Zap size={14} className="text-[#8C3B32]" />
                دورة التحويل النقدي المباشرة — Cash Conversion Cycle (CCC)
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                كم يوماً يحتاج الريال من خروجه كمخزون حتى عودته كاش في الحساب البنكي
              </p>
            </div>
            {dso != null && dIO != null && dPO != null && (
              <span className="text-xs font-bold font-mono px-3 py-1 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                CCC: {Math.max(0, dso + dIO - dPO)} يوم عمل
              </span>
            )}
          </div>

          {/* Horizontal Cycle Stage Indicator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-bold text-[#64748B] block">فترة التحصيل (DSO)</span>
              <span className="text-lg font-black font-mono text-[#D97706] block mt-1">
                {dso != null ? `${dso} يوم` : "—"}
              </span>
              <span className="text-[10px] text-[#94A3B8]">الذمم المدينة ÷ الإيراد × 365</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-bold text-[#64748B] block">فترة بقاء المخزون (DIO)</span>
              <span className="text-lg font-black font-mono text-[#2563EB] block mt-1">
                {dIO != null ? `${dIO} يوم` : "—"}
              </span>
              <span className="text-[10px] text-[#94A3B8]">المخزون ÷ تكلفة المبيعات × 365</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-bold text-[#64748B] block">فترة سداد الموردين (DPO)</span>
              <span className="text-lg font-black font-mono text-[#16A34A] block mt-1">
                {dPO != null ? `${dPO} يوم` : "—"}
              </span>
              <span className="text-[10px] text-[#94A3B8]">الدائنون ÷ تكلفة المبيعات × 365</span>
            </div>
          </div>

          {/* Additional Working Capital & Quality KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {[
              {
                label: "CFO/NI (تحويل الأرباح)",
                val: cfoNi,
                unit: "%",
                note: cfoNi != null ? (cfoNi >= 100 ? "✓ ممتاز" : cfoNi >= 60 ? "◑ مقبول" : "✗ ضعيف") : "—",
                color: cfoNi != null ? (cfoNi >= 100 ? "#16A34A" : cfoNi >= 60 ? "#D97706" : "#DC2626") : "#94A3B8",
                formula: "CFO ÷ صافي الربح × 100",
              },
              {
                label: "FCF Yield على الأصول",
                val: ta > 0 ? (fcf / ta) * 100 : null,
                unit: "%",
                note: ta > 0 ? ((fcf / ta) * 100 > 5 ? "✓ قوي" : (fcf / ta) * 100 > 0 ? "◑ معقول" : "✗ سلبي") : "—",
                color: ta > 0 ? ((fcf / ta) * 100 > 5 ? "#16A34A" : (fcf / ta) * 100 > 0 ? "#D97706" : "#DC2626") : "#94A3B8",
                formula: "FCF ÷ إجمالي الأصول × 100",
              },
              {
                label: "تغطية الدين بالتشغيل",
                val: debtCover,
                unit: "× سنوات",
                note: debtCover != null ? (debtCover <= 3 ? "✓ جيد" : debtCover <= 6 ? "◑ متوسط" : "✗ مرتفع") : "—",
                color: debtCover != null ? (debtCover <= 3 ? "#16A34A" : debtCover <= 6 ? "#D97706" : "#DC2626") : "#94A3B8",
                formula: "إجمالي الديون ÷ CFO",
              },
              {
                label: "هامش التشغيل (EBIT%)",
                val: opm,
                unit: "%",
                note: opm != null ? (opm >= 15 ? "✓ قوي" : opm >= 5 ? "◑ معقول" : "✗ ضيق") : "—",
                color: opm != null ? (opm >= 15 ? "#16A34A" : opm >= 5 ? "#D97706" : "#DC2626") : "#94A3B8",
                formula: "الربح التشغيلي ÷ الإيرادات × 100",
              },
              {
                label: "رأس المال العامل",
                val: workingCapital,
                unit: "M SAR",
                note: "≈ من الأصول والالتزامات المتداولة",
                color: workingCapital >= 0 ? "#16A34A" : "#DC2626",
                formula: "رأس المال العامل = الأصول المتداولة − الالتزامات المتداولة",
              },
              {
                label: "DSO ≈",
                val: dso,
                unit: "يوم",
                note: dso != null ? "≈ ذمم ÷ إيراد سنوي × 365" : "🔌 لا مصدر",
                color: "#D97706",
                formula: "DSO التقريبي = الذمم المدينة ÷ الإيرادات × 365؛ ليس بديلاً عن بيانات المبيعات الآجلة",
              },
              {
                label: "DIO / DPO",
                val: dIO != null && dPO != null ? dIO + dPO : null,
                unit: "يوم",
                note: dIO != null && dPO != null ? `DIO ${dIO} · DPO ${dPO}` : "🔌 بيانات المخزون/الموردين غير متاحة",
                color: "#94A3B8",
                formula: "DIO = المخزون ÷ COGS × 365 · DPO = الدائنون ÷ COGS × 365؛ محجوب عند غياب المصدر",
              },
            ].map((k, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-3 space-y-1">
                <span className="block text-[10px] font-semibold text-[#64748B]">{k.label}</span>
                <span className="block font-mono font-black text-lg" style={{ color: k.color }}>
                  {k.val != null ? k.val.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}
                  <span className="text-xs font-normal ml-1 text-[#64748B]">{k.unit}</span>
                </span>
                <span className="block text-[11px] font-semibold" style={{ color: k.color }}>{k.note}</span>
                {showFormulas && <span className="block text-[9px] font-mono text-[#94A3B8] mt-1">{k.formula}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── TREND SPARKLINES ─────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-4">
            <BarChart3 size={14} className="text-[#8C3B32]" />
            مسار الاتجاه — آخر 5 سنوات
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "الإيرادات", vals: revTrend, color: "#2563EB" },
              { label: "صافي الربح", vals: netTrend, color: "#16A34A" },
              { label: "التدفق التشغيلي", vals: cfoTrend, color: "#059669" },
              { label: "التدفق الحر", vals: fcfTrend, color: "#0D9488" },
              { label: "حقوق الملكية", vals: eqTrend, color: "#0EA5E9" },
              { label: "رأس المال العامل", vals: wcTrend, color: "#8C3B32" },
            ].map((s, i) => {
              const latest = s.vals.at(-1) ?? 0;
              const prev = s.vals.at(-2) ?? 0;
              const chg = prev !== 0 ? ((latest - prev) / Math.abs(prev)) * 100 : null;
              const isUp = chg !== null && chg >= 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[#64748B]">{s.label}</span>
                  <Sparkline vals={s.vals} color={s.color} />
                  <span className="font-mono font-bold text-[11px] text-[#0F172A]">
                    {latest.toLocaleString(undefined, { maximumFractionDigits: 0 })} M
                  </span>
                  {chg != null && (
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isUp ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {Math.abs(chg).toFixed(1)}% YoY
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RED FLAGS ────────────────────────────────────────────────── */}
        {flags.length > 0 && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
            <h3 className="text-sm font-bold text-[#92400E] flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#D97706]" />
              إشارات التحذير والمخاطر ({flags.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {flags.map((f, i) => (
                <div key={i} className={`rounded-[4px] border px-3 py-2 text-xs flex items-start gap-2 ${f.severity === "critical" ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]" : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"}`}>
                  <span className="shrink-0 font-bold mt-0.5">{f.status_symbol || "⚑"}</span>
                  <div>
                    <span className="font-bold block">{f.title_ar || f.title_en}</span>
                    <span className="text-[10px] block mt-0.5">{f.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CROSS-LINK ───────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-[#0F172A]">تعمّق أكثر</p>
            <p className="text-[#64748B] mt-0.5">القوائم التفصيلية أو الرسوم البيانية التفاعلية</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link href={`/rebh/analyst/${symbol}`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              القوائم المالية ←
            </Link>
            <Link href={`/rebh/studio/${symbol}?preset=fcf_conversion`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              استوديو الرسوم ←
            </Link>
            <Link href={`/rebh/company/${symbol}`} className="px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] font-semibold transition-colors">
              صفحة الشركة ←
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB]">
        منصة REBH — Story · X-Ray · {symbol} · {name} · القصة مُشتقة آلياً من البيانات
      </footer>
    </div>
  );
}