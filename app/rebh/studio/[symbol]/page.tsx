"use client";

import React, { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, TrendingUp, Search, Printer, AlertTriangle,
  Layers, ArrowUpRight, ArrowDownRight, Sparkles,
  CandlestickChart, Activity, RefreshCw, Table2,
  CheckCircle2, XCircle, ChevronDown, Minus
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MetricSeries {
  id: string;
  name: string;
  nameEn: string;
  group: "income" | "cash" | "margin" | "balance" | "valuation";
  unit: string;
  color: string;
  data: number[];
  yoy?: (number | null)[];   // YoY % change per period
}

type ModeType = "fundamental" | "price_action";
type ChartStyle = "bar" | "line" | "area";
type Timeframe = "annual" | "quarterly";

// ─── Presets ─────────────────────────────────────────────────────────────────
const PRESETS: Record<string, { mode: ModeType; tf: Timeframe; primary: string; secondary: string | null; style: ChartStyle }> = {
  profitability_divergence: { mode: "fundamental", tf: "annual",    primary: "net",  secondary: "cfo",    style: "line" },
  revenue_margin_health:    { mode: "fundamental", tf: "quarterly", primary: "rev",  secondary: "npm",    style: "bar"  },
  fcf_conversion:           { mode: "fundamental", tf: "annual",    primary: "fcf",  secondary: "capex",  style: "bar"  },
  price_trend:              { mode: "price_action",tf: "annual",    primary: "px",   secondary: null,     style: "line" },
  balance_strength:         { mode: "fundamental", tf: "annual",    primary: "roe",  secondary: "nd",     style: "line" },
  valuation_bands:          { mode: "fundamental", tf: "annual",    primary: "pe",   secondary: "pb",     style: "line" },
};

// ─── SVG chart helpers ────────────────────────────────────────────────────────
const W = 720, H = 268, PX = 44, PY = 28, UW = W - PX * 2, UH = H - PY * 2;

function scaleY(val: number, min: number, max: number) {
  const range = max - min || 1;
  return H - PY - ((val - min) / range) * UH;
}
function scaleX(idx: number, total: number) {
  if (total <= 1) return W / 2;
  return PX + (idx / (total - 1)) * UW;
}

// ─── Main component ───────────────────────────────────────────────────────────
function StudioInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = ((params?.symbol as string) || "2222").toUpperCase();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // ── Studio controls ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ModeType>("fundamental");
  const [timeframe, setTimeframe] = useState<Timeframe>("annual");
  const [primaryId, setPrimaryId] = useState("rev");
  const [secondaryId, setSecondaryId] = useState<string | null>("net");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("bar");
  const [showYoY, setShowYoY] = useState(false);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [sectorCompare, setSectorCompare] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; v1: string; v2: string } | null>(null);

  // ── Apply URL preset on load ───────────────────────────────────────────────
  useEffect(() => {
    const preset = searchParams?.get("preset");
    if (preset && PRESETS[preset]) {
      const p = PRESETS[preset];
      setMode(p.mode); setTimeframe(p.tf);
      setPrimaryId(p.primary); setSecondaryId(p.secondary);
      setChartStyle(p.style); setActivePreset(preset);
    }
  }, [searchParams]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`);
        if (!res.ok) throw new Error(`لم يُعثر على بيانات الرمز: ${symbol}`);
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
    const s = searchInput.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) router.push(`/rebh/studio/${s}`);
  };

  const applyPreset = (id: string) => {
    const p = PRESETS[id];
    if (!p) return;
    setMode(p.mode); setTimeframe(p.tf);
    setPrimaryId(p.primary); setSecondaryId(p.secondary);
    setChartStyle(p.style); setActivePreset(id);
  };

  // ── Derive data slices ─────────────────────────────────────────────────────
  const isData = data?.income_statement || {};
  const cfData = data?.cf || {};
  const bsData = data?.balance_sheet || {};
  const qData  = data?.quarters || {};
  const priceHistory: any[] = data?.price_history || [];

  const periods: string[] = timeframe === "annual"
    ? (isData.periods || [])
    : (qData.periods || []);

  // YoY helper
  function toYoY(arr: number[]): (number | null)[] {
    return arr.map((v, i) => {
      if (i === 0 || arr[i - 1] === 0) return null;
      return Math.round(((v - arr[i - 1]) / Math.abs(arr[i - 1])) * 1000) / 10;
    });
  }

  const metrics: MetricSeries[] = useMemo(() => {
    if (!data) return [];
    const get = (key: string, src: Record<string, any[]>) =>
      (src[key] || []).map((v: any) => Number(v) || 0);

    if (timeframe === "annual") {
      const rev   = get("rev",   isData);
      const gp    = get("gp",    isData);
      const op    = get("op",    isData);
      const net   = get("net",   isData);
      const eps   = (isData.eps || []).map((v: any) => Number(v) || 0);
      const cfo   = get("cfo",   cfData);
      const fcf   = get("fcf",   cfData);
      const capex = get("capex", cfData).map(Math.abs);
      const ta    = get("total_assets", bsData);
      const eq    = get("equity",       bsData);
      const nd    = get("net_debt",     bsData);

      const npm  = rev.map((r, i) => r > 0 ? +((net[i]  / r) * 100).toFixed(1) : 0);
      const gpm  = rev.map((r, i) => r > 0 ? +((gp[i]   / r) * 100).toFixed(1) : 0);
      const opm  = rev.map((r, i) => r > 0 ? +((op[i]   / r) * 100).toFixed(1) : 0);
      const roe  = ta.map((_, i) => eq[i] > 0 ? +((net[i]  / eq[i]) * 100).toFixed(1) : 0);
      const roic = ta.map((a, i) => {
        const invested = (eq[i] || 0) + Math.max(0, nd[i] || 0);
        return invested > 0 ? +((op[i] / invested) * 100).toFixed(1) : 0;
      });

      // Valuation from latest price × shares — fallback to data.pe/pb if present
      const pe  = (data?.valuation_annual?.pe  || []).map((v: any) => Number(v) || 0);
      const pb  = (data?.valuation_annual?.pb  || []).map((v: any) => Number(v) || 0);
      const div = (data?.valuation_annual?.div || []).map((v: any) => Number(v) || 0);

      const list: MetricSeries[] = [
        { id:"rev",   name:"الإيرادات",           nameEn:"Revenue",         group:"income",    unit:"M SAR", color:"#2563EB", data:rev,   yoy: toYoY(rev)   },
        { id:"gp",    name:"إجمالي الربح",         nameEn:"Gross Profit",    group:"income",    unit:"M SAR", color:"#16A34A", data:gp,    yoy: toYoY(gp)    },
        { id:"op",    name:"الربح التشغيلي",       nameEn:"EBIT",            group:"income",    unit:"M SAR", color:"#8C3B32", data:op,    yoy: toYoY(op)    },
        { id:"net",   name:"صافي الربح",           nameEn:"Net Income",      group:"income",    unit:"M SAR", color:"#DC2626", data:net,   yoy: toYoY(net)   },
        { id:"eps",   name:"ربحية السهم (EPS)",    nameEn:"EPS",             group:"income",    unit:"SAR",   color:"#7C3AED", data:eps,   yoy: toYoY(eps)   },
        { id:"cfo",   name:"التدفق التشغيلي",      nameEn:"CFO",             group:"cash",      unit:"M SAR", color:"#059669", data:cfo,   yoy: toYoY(cfo)   },
        { id:"fcf",   name:"التدفق الحر (FCF)",    nameEn:"FCF",             group:"cash",      unit:"M SAR", color:"#0D9488", data:fcf,   yoy: toYoY(fcf)   },
        { id:"capex", name:"الإنفاق الرأسمالي",    nameEn:"CapEx",           group:"cash",      unit:"M SAR", color:"#D97706", data:capex, yoy: toYoY(capex) },
        { id:"nd",    name:"صافي الدين",           nameEn:"Net Debt",        group:"balance",   unit:"M SAR", color:"#9333EA", data:nd,    yoy: toYoY(nd)    },
        { id:"roe",   name:"عائد حقوق المساهمين",  nameEn:"ROE",             group:"balance",   unit:"%",     color:"#0EA5E9", data:roe,   yoy: toYoY(roe)   },
        { id:"roic",  name:"عائد رأس المال المستثمر",nameEn:"ROIC",          group:"balance",   unit:"%",     color:"#6366F1", data:roic,  yoy: toYoY(roic)  },
        { id:"npm",   name:"هامش صافي الربح",      nameEn:"Net Margin",      group:"margin",    unit:"%",     color:"#A21CAF", data:npm,   yoy: toYoY(npm)   },
        { id:"gpm",   name:"هامش إجمالي الربح",    nameEn:"Gross Margin",    group:"margin",    unit:"%",     color:"#10B981", data:gpm,   yoy: toYoY(gpm)   },
        { id:"opm",   name:"هامش التشغيل",         nameEn:"EBIT Margin",     group:"margin",    unit:"%",     color:"#EA580C", data:opm,   yoy: toYoY(opm)   },
      ];
      if (pe.length)  list.push({ id:"pe",  name:"مضاعف السعر/الربح",  nameEn:"P/E",  group:"valuation", unit:"×", color:"#F43F5E", data:pe,  yoy: toYoY(pe)  });
      if (pb.length)  list.push({ id:"pb",  name:"مضاعف السعر/الدفاتر",nameEn:"P/B",  group:"valuation", unit:"×", color:"#EC4899", data:pb,  yoy: toYoY(pb)  });
      if (div.length) list.push({ id:"div", name:"عائد التوزيعات",     nameEn:"Div%", group:"valuation", unit:"%", color:"#14B8A6", data:div, yoy: toYoY(div) });
      return list;
    } else {
      // Quarterly
      const rev  = get("rev",  qData);
      const gp   = get("gp",   qData);
      const op   = get("op",   qData);
      const net  = get("net",  qData);
      const npm  = rev.map((r, i) => r > 0 ? +((net[i] / r) * 100).toFixed(1) : 0);
      const gpm  = rev.map((r, i) => r > 0 ? +((gp[i]  / r) * 100).toFixed(1) : 0);
      return [
        { id:"rev",  name:"الإيرادات الربعية",        nameEn:"Quarterly Revenue",  group:"income", unit:"M SAR", color:"#2563EB", data:rev,  yoy: toYoY(rev)  },
        { id:"gp",   name:"إجمالي الربح الربعي",      nameEn:"Quarterly GP",       group:"income", unit:"M SAR", color:"#16A34A", data:gp,   yoy: toYoY(gp)   },
        { id:"op",   name:"الربح التشغيلي الربعي",    nameEn:"Quarterly EBIT",     group:"income", unit:"M SAR", color:"#8C3B32", data:op,   yoy: toYoY(op)   },
        { id:"net",  name:"صافي الربح الربعي",        nameEn:"Quarterly Net",      group:"income", unit:"M SAR", color:"#DC2626", data:net,  yoy: toYoY(net)  },
        { id:"npm",  name:"هامش الربح الربعي",        nameEn:"Quarterly Margin",   group:"margin", unit:"%",     color:"#7C3AED", data:npm,  yoy: toYoY(npm)  },
        { id:"gpm",  name:"هامش إجمالي الربح الربعي", nameEn:"Quarterly GPM",      group:"margin", unit:"%",     color:"#10B981", data:gpm,  yoy: toYoY(gpm)  },
      ];
    }
  }, [data, timeframe, isData, cfData, bsData, qData]);

  const primary   = metrics.find(m => m.id === primaryId)   || metrics[0];
  const secondary = secondaryId ? metrics.find(m => m.id === secondaryId) : null;

  // SMA-20 for price action
  const sma20 = useMemo(() => {
    const closes = priceHistory.map(p => p.close);
    return closes.map((_, i) => {
      if (i < 4) return null;
      const w = closes.slice(Math.max(0, i - 19), i + 1);
      return +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(2);
    });
  }, [priceHistory]);

  // ── Chart scales ───────────────────────────────────────────────────────────
  const allVals  = [...(primary?.data || []), ...(secondary?.data || [])];
  const maxVal   = allVals.length ? Math.max(...allVals, 0.001) : 1;
  const minVal   = allVals.length ? Math.min(...allVals, 0) : 0;

  const pxCloses = priceHistory.map(p => p.close);
  const maxPx    = pxCloses.length ? Math.max(...priceHistory.map(p => p.high || p.close)) * 1.02 : 100;
  const minPx    = pxCloses.length ? Math.min(...priceHistory.map(p => p.low  || p.close)) * 0.98 : 0;

  const gY = (v: number) => scaleY(v, minVal, maxVal);
  const gX = (i: number, n: number) => scaleX(i, n);
  const pxY = (v: number) => scaleY(v, minPx, maxPx);

  // ── Sector comparison stub — uses sector median from universe stats ─────────
  // This will be enriched if backend exposes sector medians; for now we show ± vs self-average.
  const selfMedian = useMemo(() => {
    const d = primary?.data || [];
    if (!d.length) return null;
    const sorted = [...d].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, [primary]);

  // ── Group labels for metric picker ─────────────────────────────────────────
  const GROUPS: Array<{ id: string; label: string; color: string }> = [
    { id: "income",    label: "قائمة الدخل",    color: "#2563EB" },
    { id: "cash",      label: "التدفقات النقدية", color: "#059669" },
    { id: "balance",   label: "الميزانية",       color: "#0EA5E9" },
    { id: "margin",    label: "الهوامش",         color: "#A21CAF" },
    { id: "valuation", label: "التقييم",         color: "#F43F5E" },
  ];

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">
        <div className="w-11 h-11 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-sm font-bold text-[#1A1A1A]">جاري تحميل بيانات الاستوديو</h2>
        <p className="text-xs text-[#6B7280]">استدعاء القوائم المالية والأسعار التاريخية…</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#F7F8FA] p-8 flex items-center justify-center">
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1A1A1A]">تعذر فتح الاستوديو — {symbol}</h2>
        <p className="text-xs text-[#6B7280]">{error || "تأكد من وجود سجل مالي للرمز"}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setLoading(true); setError(null); }}
            className="px-4 py-2 bg-[#F3F4F6] border border-[#D1D5DB] text-xs font-semibold rounded-[4px]"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/rebh/studio"
            className="px-4 py-2 bg-[#8C3B32] text-white text-xs font-semibold rounded-[4px] hover:bg-[#752f28]"
          >
            اختر رمزاً آخر
          </Link>
        </div>
      </div>
    </div>
  );

  const name    = data.name || symbol;
  const nameEn  = data.en   || "";
  const sector  = data.sec  || "—";
  const primaryVals   = primary?.data  || [];
  const secondaryVals = secondary?.data || [];

  const latestPrimary   = primaryVals[primaryVals.length - 1] ?? 0;
  const prevPrimary     = primaryVals[primaryVals.length - 2] ?? 0;
  const latestChg       = prevPrimary !== 0 ? ((latestPrimary - prevPrimary) / Math.abs(prevPrimary)) * 100 : 0;
  const isUp            = latestChg >= 0;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <Link href="/rebh/studio">
            <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs cursor-pointer hover:bg-[#752f28]">
              STUDIO
            </span>
          </Link>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">
            Chart Studio — <span className="font-mono text-[#8C3B32]">{symbol}</span>
          </h1>
          <span className="hidden sm:block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:block text-xs text-[#6B7280] truncate max-w-[200px]">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleNav} className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value.replace(/\D/g, ""))}
              placeholder="رمز (4 أرقام)"
              className="w-28 px-2.5 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]"
            />
            <button type="submit" className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold">عرض</button>
          </form>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold"
          >
            <Printer size={13} />طباعة
          </button>
        </div>
      </header>

      {/* ── COMPANY SNAPSHOT ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base">
              {symbol}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1A1A1A]">{name}</h2>
                {nameEn && <span className="text-[11px] font-mono text-[#6B7280]">{nameEn}</span>}
              </div>
              <p className="text-xs text-[#6B7280]">{sector} · السوق المالي السعودي (تداول)</p>
            </div>
          </div>

          {/* Latest metric KPI */}
          {primary && primaryVals.length > 0 && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="block text-[10px] text-[#64748B]">{primary.nameEn} (آخر فترة)</span>
                <span className="block text-lg font-black text-[#0F172A]">
                  {latestPrimary.toLocaleString(undefined, { maximumFractionDigits: 1 })} {primary.unit}
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-[4px] font-bold text-xs ${isUp ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(latestChg).toFixed(1)}% YoY
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded-[6px] border border-[#E5E7EB] text-xs font-semibold">
            {([["fundamental", "التحليل المحاسبي", BarChart3], ["price_action", "حركة السعر", TrendingUp]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m as ModeType)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] transition-all ${mode === m ? "bg-white text-[#8C3B32] font-bold shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRESET TEMPLATES STRIP ───────────────────────────────────────── */}
      <section className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#475569] flex items-center gap-1 shrink-0">
            <Sparkles size={12} className="text-[#8C3B32]" />قوالب:
          </span>
          {Object.entries({
            profitability_divergence: "NI vs CFO",
            revenue_margin_health:   "إيراد + هوامش",
            fcf_conversion:          "FCF vs CapEx",
            price_trend:             "مسار السعر",
            balance_strength:        "ROE / ROIC",
            valuation_bands:         "P/E & P/B",
          }).map(([id, label]) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className={`px-2.5 py-0.5 rounded-[4px] border text-[11px] font-semibold whitespace-nowrap transition-colors
                ${activePreset === id ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#334155] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── MAIN CANVAS ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ━━ FUNDAMENTAL MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {mode === "fundamental" && primary && (
          <div className="space-y-5">

            {/* METRIC PICKER */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">

              {/* Controls row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                <span className="text-xs font-bold text-[#1A1A1A]">اختر البند الأساسي:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Timeframe */}
                  <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB] text-[11px] font-semibold">
                    {(["annual", "quarterly"] as const).map(tf => (
                      <button key={tf}
                        onClick={() => { setTimeframe(tf); setPrimaryId("rev"); setSecondaryId(tf === "annual" ? "net" : null); }}
                        className={`px-3 py-1 rounded transition-colors ${timeframe === tf ? "bg-white text-[#8C3B32] shadow-sm" : "text-[#6B7280]"}`}
                      >
                        {tf === "annual" ? "سنوي" : "ربعي منفصل"}
                      </button>
                    ))}
                  </div>
                  {/* Chart style */}
                  <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB] text-[11px] font-semibold">
                    {(["bar", "line", "area"] as const).map(s => (
                      <button key={s}
                        onClick={() => setChartStyle(s)}
                        className={`px-3 py-1 rounded transition-colors ${chartStyle === s ? "bg-white text-[#8C3B32] shadow-sm" : "text-[#6B7280]"}`}
                      >
                        {s === "bar" ? "أعمدة" : s === "line" ? "خطي" : "مساحة"}
                      </button>
                    ))}
                  </div>
                  {/* YoY toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#374151]">
                    <input type="checkbox" checked={showYoY} onChange={e => setShowYoY(e.target.checked)} className="rounded" />
                    <span>YoY %</span>
                  </label>
                </div>
              </div>

              {/* Metric buttons grouped */}
              <div className="space-y-2.5">
                {GROUPS.map(g => {
                  const gMetrics = metrics.filter(m => m.group === g.id);
                  if (!gMetrics.length) return null;
                  return (
                    <div key={g.id} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#94A3B8] w-16 shrink-0 text-right">{g.label}</span>
                      {gMetrics.map(m => {
                        const isPrimary = primaryId === m.id;
                        const isSec    = secondaryId === m.id;
                        return (
                          <button key={m.id}
                            onClick={() => {
                              if (isSec) { setSecondaryId(null); return; }
                              if (isPrimary) return;
                              setPrimaryId(m.id); setActivePreset(null);
                            }}
                            onContextMenu={e => { e.preventDefault(); setSecondaryId(isPrimary ? null : m.id); setActivePreset(null); }}
                            title="نقر = أساسي · نقر يمين = ثانوي"
                            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold border transition-all flex items-center gap-1.5
                              ${isPrimary ? "bg-[#8C3B32] text-white border-[#8C3B32]"
                                : isSec ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                                : "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]"}`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                            {m.name}
                            {isPrimary && <span className="text-[9px] font-mono bg-white/20 px-1 rounded">●</span>}
                            {isSec    && <span className="text-[9px] font-mono bg-[#BFDBFE] px-1 rounded">○</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Secondary dropdown */}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-[#8C3B32]" />
                  <span>مقارنة ثانوية (Dual-Wave):</span>
                  <select
                    value={secondaryId || ""}
                    onChange={e => setSecondaryId(e.target.value || null)}
                    className="px-2 py-0.5 text-xs bg-[#F8FAFC] border border-[#D1D5DB] rounded-[4px] outline-none text-[#1A1A1A] font-semibold"
                  >
                    <option value="">(بلا مقارنة)</option>
                    {metrics.filter(m => m.id !== primaryId).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>
                <span className="font-mono text-[11px] text-[#9CA3AF]">{periods.length} فترة · XBRL ✓</span>
              </div>
            </div>

            {/* CHART PANEL */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
              {/* Legend */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primary.color }} />
                    <span className="text-xs font-bold text-[#0F172A]">{primary.name}</span>
                    <span className="text-[11px] font-mono text-[#64748B]">({primary.unit})</span>
                  </div>
                  {secondary && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: secondary.color, backgroundColor: "transparent" }} />
                      <span className="text-xs font-semibold text-[#0F172A]">{secondary.name}</span>
                      <span className="text-[11px] font-mono text-[#64748B]">({secondary.unit})</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sectorCompare && (
                    <span className="text-[11px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      وسيط الشركة ذاتها: {selfMedian?.toLocaleString(undefined, { maximumFractionDigits: 1 })} {primary.unit}
                    </span>
                  )}
                  <button
                    onClick={() => setSectorCompare(!sectorCompare)}
                    className={`text-[11px] px-2.5 py-0.5 rounded border font-semibold transition-colors ${sectorCompare ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
                  >
                    مقارنة الوسيط
                  </button>
                </div>
              </div>

              {/* SVG */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible select-none">

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                      const y = PY + pct * UH;
                      const v = maxVal - pct * (maxVal - minVal);
                      return (
                        <g key={i}>
                          <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                          <text x={PX - 6} y={y + 3} fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">
                            {Math.round(v).toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* Zero line */}
                    {minVal < 0 && maxVal > 0 && (
                      <line x1={PX} y1={gY(0)} x2={W - PX} y2={gY(0)} stroke="#CBD5E1" strokeWidth="1.5" />
                    )}

                    {/* Self-median line */}
                    {sectorCompare && selfMedian != null && (
                      <line x1={PX} y1={gY(selfMedian)} x2={W - PX} y2={gY(selfMedian)}
                        stroke="#D97706" strokeWidth="1.5" strokeDasharray="5,3" />
                    )}

                    {/* BAR chart */}
                    {chartStyle === "bar" && periods.map((_: string, i: number) => {
                      const v1 = primaryVals[i] ?? 0;
                      const v2 = secondary ? (secondaryVals[i] ?? 0) : null;
                      const x  = gX(i, periods.length);
                      const bw = secondary ? 16 : 24;
                      const y0 = gY(0);
                      const y1 = gY(v1);
                      const h1 = Math.abs(y1 - y0);
                      return (
                        <g key={i}
                          onMouseEnter={() => setTooltip({ x, y: y1 - 12, label: periods[i], v1: v1.toLocaleString(undefined, {maximumFractionDigits:1}), v2: v2 != null ? v2.toLocaleString(undefined, {maximumFractionDigits:1}) : "" })}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <rect x={secondary ? x - bw - 1 : x - bw / 2} y={v1 >= 0 ? y1 : y0} width={bw} height={Math.max(2, h1)}
                            fill={primary.color} rx="2" opacity="0.9" className="hover:opacity-70 cursor-pointer" />
                          {v2 != null && (() => {
                            const y2 = gY(v2); const h2 = Math.abs(y2 - y0);
                            return <rect x={x + 1} y={v2 >= 0 ? y2 : y0} width={bw} height={Math.max(2, h2)}
                              fill={secondary!.color} rx="2" opacity="0.8" className="hover:opacity-70 cursor-pointer" />;
                          })()}
                        </g>
                      );
                    })}

                    {/* LINE / AREA chart */}
                    {(chartStyle === "line" || chartStyle === "area") && (() => {
                      const pts1 = primaryVals.map((v, i) => `${gX(i, periods.length)},${gY(v)}`).join(" ");
                      const pts2 = secondary ? secondaryVals.map((v, i) => `${gX(i, periods.length)},${gY(v)}`).join(" ") : null;
                      const areaPath = `M${gX(0, periods.length)},${gY(0)} ` +
                        primaryVals.map((v, i) => `L${gX(i, periods.length)},${gY(v)}`).join(" ") +
                        ` L${gX(periods.length - 1, periods.length)},${gY(0)} Z`;
                      return (
                        <>
                          {chartStyle === "area" && (
                            <path d={areaPath} fill={primary.color} opacity="0.12" />
                          )}
                          <polyline points={pts1} fill="none" stroke={primary.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {primaryVals.map((v, i) => (
                            <circle key={i} cx={gX(i, periods.length)} cy={gY(v)} r="4" fill="#fff" stroke={primary.color} strokeWidth="2"
                              onMouseEnter={() => setTooltip({ x: gX(i, periods.length), y: gY(v) - 12, label: periods[i], v1: v.toLocaleString(undefined,{maximumFractionDigits:1}), v2: secondary ? (secondaryVals[i] ?? 0).toLocaleString(undefined,{maximumFractionDigits:1}) : "" })}
                              onMouseLeave={() => setTooltip(null)}
                              className="cursor-pointer"
                            />
                          ))}
                          {pts2 && (
                            <polyline points={pts2} fill="none" stroke={secondary!.color} strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          {secondary && secondaryVals.map((v, i) => (
                            <circle key={i} cx={gX(i, periods.length)} cy={gY(v)} r="3.5" fill="#fff" stroke={secondary.color} strokeWidth="2" className="cursor-pointer" />
                          ))}
                        </>
                      );
                    })()}

                    {/* X-axis labels */}
                    {periods.map((p: string, i: number) => (
                      <text key={i} x={gX(i, periods.length)} y={H - 6} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="600">
                        {p}
                      </text>
                    ))}

                    {/* Tooltip */}
                    {tooltip && (
                      <g>
                        <rect x={tooltip.x - 55} y={tooltip.y - 22} width={110} height={tooltip.v2 ? 42 : 24} rx="4" fill="#1E293B" opacity="0.9" />
                        <text x={tooltip.x} y={tooltip.y - 6} fill="#F8FAFC" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{tooltip.label}</text>
                        <text x={tooltip.x} y={tooltip.y + 6} fill={primary.color} fontSize="10" fontFamily="monospace" textAnchor="middle">{tooltip.v1} {primary.unit}</text>
                        {tooltip.v2 && secondary && (
                          <text x={tooltip.x} y={tooltip.y + 18} fill={secondary.color} fontSize="10" fontFamily="monospace" textAnchor="middle">{tooltip.v2} {secondary.unit}</text>
                        )}
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* YoY DELTA TABLE */}
            {showYoY && primary.yoy && (
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <h4 className="text-xs font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Activity size={13} className="text-[#8C3B32]" />
                  نسبة التغيير YoY لـ {primary.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {periods.map((p: string, i: number) => {
                    const chg = primary.yoy![i];
                    if (chg == null) return <span key={i} className="text-[11px] font-mono text-[#94A3B8] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">{p}: —</span>;
                    return (
                      <span key={i} className={`text-[11px] font-mono px-2.5 py-1 rounded border flex items-center gap-1 ${chg >= 0 ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]" : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"}`}>
                        {chg >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        <span>{p}: {chg > 0 ? "+" : ""}{chg.toFixed(1)}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DATA TABLE */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="border-b border-[#E5E7EB] px-5 py-3 flex items-center gap-2">
                <Table2 size={13} className="text-[#8C3B32]" />
                <h4 className="text-xs font-bold text-[#1A1A1A]">الجدول التفصيلي — القيم الرقمية الكاملة</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="p-2.5 text-right font-bold text-[#475569] whitespace-nowrap">المؤشر</th>
                      {periods.map((p: string, i: number) => (
                        <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {[primary, secondary].filter(Boolean).map(m => m && (
                      <tr key={m.id} className="hover:bg-[#F8FAFC]">
                        <td className="p-2.5 text-right font-bold text-[#0F172A] flex items-center gap-1.5 whitespace-nowrap">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                          {m.name} ({m.unit})
                        </td>
                        {m.data.map((v: number, i: number) => {
                          const yoy = m.yoy?.[i];
                          return (
                            <td key={i} className="p-2.5 text-right font-mono text-[#1E293B]">
                              <span className="font-semibold">{v.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                              {showYoY && yoy != null && (
                                <span className={`block text-[10px] ${yoy >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                                  {yoy > 0 ? "+" : ""}{yoy.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ━━ PRICE ACTION MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {mode === "price_action" && (
          <div className="space-y-5">
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#8C3B32]" />
                  <span className="text-xs font-bold text-[#1A1A1A]">مسار السعر اليومي ({priceHistory.length} يوم)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {([["showSMA20", showSMA20, setShowSMA20, "SMA-20 (أزرق)"], ["showVol", showVolume, setShowVolume, "أحجام التداول"]] as any[]).map(([key, val, setter, label]: any) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#374151]">
                      <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} className="rounded" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {priceHistory.length > 0 ? (
                <>
                  {/* Price stats */}
                  <div className="flex flex-wrap gap-4 text-xs font-mono">
                    {[
                      { label: "آخر إغلاق", val: priceHistory[priceHistory.length-1]?.close?.toFixed(2) },
                      { label: "أعلى 120 يوم", val: Math.max(...priceHistory.map(p => p.high || p.close)).toFixed(2) },
                      { label: "أدنى 120 يوم", val: Math.min(...priceHistory.map(p => p.low || p.close)).toFixed(2) },
                      { label: "متوسط الحجم", val: Math.round(priceHistory.reduce((a, p) => a + (p.volume || 0), 0) / priceHistory.length).toLocaleString() },
                    ].map(s => (
                      <div key={s.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-1.5">
                        <span className="block text-[10px] text-[#64748B]">{s.label}</span>
                        <span className="block font-bold text-[#0F172A]">{s.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[600px]">
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible select-none">
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                          const y = PY + pct * UH;
                          const v = maxPx - pct * (maxPx - minPx);
                          return (
                            <g key={i}>
                              <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                              <text x={PX - 6} y={y + 3} fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">{v.toFixed(1)}</text>
                            </g>
                          );
                        })}

                        {/* Volume bars */}
                        {showVolume && (() => {
                          const maxV = Math.max(...priceHistory.map(p => p.volume || 1), 1);
                          return priceHistory.map((p, i) => {
                            const vh = ((p.volume || 0) / maxV) * 50;
                            return <rect key={i} x={gX(i, priceHistory.length) - 1.5} y={H - PY - vh} width="3" height={Math.max(1, vh)} fill="#CBD5E1" opacity="0.5" />;
                          });
                        })()}

                        {/* Price line */}
                        <polyline
                          points={priceHistory.map((p, i) => `${gX(i, priceHistory.length)},${pxY(p.close)}`).join(" ")}
                          fill="none" stroke="#8C3B32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        />

                        {/* SMA-20 */}
                        {showSMA20 && sma20.length > 0 && (
                          <polyline
                            points={sma20.filter((v): v is number => v != null).map((v, i) => {
                              const actualIdx = sma20.indexOf(v, i === 0 ? 0 : sma20.indexOf(sma20.filter(x => x != null)[i - 1] as number) + 1);
                              return `${gX(actualIdx, priceHistory.length)},${pxY(v)}`;
                            }).join(" ")}
                            fill="none" stroke="#2563EB" strokeWidth="1.8" strokeDasharray="3,2"
                          />
                        )}

                        {/* X-axis dates */}
                        {priceHistory.filter((_, i) => i % Math.max(1, Math.floor(priceHistory.length / 7)) === 0).map((p, idx) => {
                          const oi = priceHistory.indexOf(p);
                          return (
                            <text key={idx} x={gX(oi, priceHistory.length)} y={H - 6} fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle">
                              {p.date}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B7280]">
                  لا تتوفر بيانات أسعار تاريخية مسجلة لهذا الرمز.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTOR COMPARISON NOTICE ───────────────────────────────────── */}
        {mode === "fundamental" && sectorCompare && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] p-4 text-xs text-[#92400E]">
            <strong>ملاحظة مقارنة الوسيط:</strong> تُعرض القيمة الوسيطة لأداء الشركة ذاتها عبر الفترات كخط مرجعي ذهبي على الرسم.
            مقارنة وسيط القطاع الحقيقية ستكون متاحة عند ربط نقطة نهاية sector-stats بالمنصة.
          </div>
        )}

        {/* ── CROSS-LINK: ROW-CLICK FROM COMPANY PAGE ───────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-[#0F172A]">هل أتيت من صفحة الشركة بالنقر على بند؟</p>
            <p className="text-[#64748B] mt-0.5">يمكن لأي صفحة ترسلك للاستوديو عبر رابط مثل: <code className="font-mono text-[#8C3B32] bg-[#FFF1EF] px-1 rounded">/rebh/studio/{symbol}?preset=revenue_margin_health</code></p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/rebh/company/${symbol}`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              صفحة الشركة ←
            </Link>
            <Link href={`/rebh/analyst/${symbol}`} className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] font-semibold text-[#374151] transition-colors">
              القوائم المالية ←
            </Link>
          </div>
        </div>

      </main>

      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB]">
        منصة REBH — Chart Studio Pro · {symbol} · {name}
      </footer>
    </div>
  );
}

export default function RebhChartStudioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StudioInner />
    </Suspense>
  );
}
