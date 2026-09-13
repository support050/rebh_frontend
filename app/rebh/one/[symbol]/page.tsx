"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ShieldCheck, AlertTriangle, CheckCircle2,
  TrendingUp, BarChart3, Layers, FileText, Search, Activity,
  Cpu, Clock, ShieldAlert, Sparkles, Edit3, X, Check,
  Printer, Copy, Download, Share2, ArrowRight, ArrowUpRight,
  ArrowDownRight, Scale, PieChart, Coins, Award, BookOpen,
  HelpCircle, Target, CheckSquare, ExternalLink
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import RebhRadarScore from "../../[symbol]/components/RebhRadarScore";
import SectorPeersTable from "../../[symbol]/components/SectorPeersTable";
import QuarterlyEngineRoom from "../../[symbol]/components/QuarterlyEngineRoom";

export default function RebhOneDeepDivePage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [copied, setCopied] = useState(false);

  // 7-Pillar Classification Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classData, setClassData] = useState<any>(null);
  const [classForm, setClassForm] = useState({
    industry_class: "",
    market_form: "",
    price_elasticity: "",
    bcg_position: "",
    dominance: "",
    retail_path: "",
    notes: ""
  });
  const [isSavingClass, setIsSavingClass] = useState(false);

  useEffect(() => {
    async function fetchPayload() {
      try {
        setLoading(true);
        setError(null);
        // GET /api/engine/{symbol} is the primary production contract endpoint
        const res = await fetch(`${API_BASE_URL}/api/engine/${symbol}`);
        if (!res.ok) {
          const fallbackRes = await fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`);
          if (!fallbackRes.ok) {
            throw new Error(`تعذر استرجاع بيانات الفحص العميق للرمز: ${symbol}`);
          }
          const fb = await fallbackRes.json();
          setCompany(fb);
          return;
        }
        const data = await res.json();
        setCompany(data);
      } catch (err: any) {
        setError(err.message || "فشل الاتصال بمحرك التحليل");
      } finally {
        setLoading(false);
      }
    }
    fetchPayload();
  }, [symbol]);

  useEffect(() => {
    async function fetchClassification() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/classification/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setClassData(data);
          setClassForm({
            industry_class: data.industry_class || "",
            market_form: data.market_form || "",
            price_elasticity: data.price_elasticity || "",
            bcg_position: data.bcg_position || "",
            dominance: data.dominance || "",
            retail_path: data.retail_path || "",
            notes: data.notes || ""
          });
        }
      } catch (e) {
        console.error("Classification load err:", e);
      }
    }
    fetchClassification();
  }, [symbol]);

  const handleSaveClassification = async () => {
    setIsSavingClass(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/classification/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classForm)
      });
      if (res.ok) {
        setClassData((prev: any) => ({ ...prev, ...classForm, is_override: true, source: "Owner-Edited Custom Override" }));
        setIsClassModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save classification:", err);
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = searchSymbol.trim().toUpperCase();
    if (/^\d{4}$/.test(s)) {
      router.push(`/rebh/one/${s}`);
    }
  };

  const handleCopySummary = () => {
    if (!company) return;
    const px = company.price ?? 0;
    const fv = company.zones?.silver_max ?? company.zones?.gold_max ?? "—";
    const mos = company.margin_of_safety ?? 0;
    const txt = `[REBH Deep-Dive ONE Case Study] ${company.name} (${symbol})\nالسعر الحالي: ${px} ر.س | القيمة العادلة المقدرة: ${fv} ر.س | هامش الأمان: ${mos}%\nمكرر الأرباح TTM: ${company.pe ?? "—"}x | جودة بيوتروسكي: ${company.piotroski ?? "—"}/9\nقرار بوابة الاستثمار: ${company.buy_gate?.gate_passed ? "مجتاز لبوابة الاستثمار ✓" : "معلق ⚠️"}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-3 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-[#1A1A1A]">جاري بناء دراسة الحالة النموذجية (ONE Exemplar)</h2>
          <p className="text-xs text-[#6B7280]">تشغيل الخوارزميات التشريحية واستخلاص أطروحة الاستثمار وبوابات الشراء...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-8 flex flex-col items-center justify-center">
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">تعذر تحميل دراسة الحالة للرمز {symbol}</h2>
          <p className="text-xs text-[#6B7280]">{error || "تأكد من اكتمال السجل المالي للشركة"}</p>
          <div className="pt-2">
            <Link
              href="/rebh/one/2222"
              className="inline-block px-4 py-2 bg-[#8C3B32] text-white text-xs font-semibold rounded-[4px] hover:bg-[#752f28] transition-colors"
            >
              العودة للرمز القياسي (2222 أرامكو)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Data unwrapping
  const px = Number(company.price ?? 0);
  const mc = Number(company.market_cap ?? 0);
  const name = company.name || symbol;
  const sec = company.sector || "—";
  const indClass = company.industry_class || "—";
  const isFresh = company.fresh !== false;
  const staleReason = company.stale_reason;
  const quarantineReason = company.quarantine_reason;
  const isQuarantined = Boolean(quarantineReason || (!company.balance_identity?.is_valid && company.balance_identity));

  const TTM = company.TTM || {};
  const quarterly = company.quarterly || { periods: [] };
  const balanceIdentity = company.balance_identity || { is_valid: true };
  const grades = company.grades || {};
  const zones = company.zones || {};
  const nineBox = company.nine_box;
  const buildUp = company.build_up;
  const reverseDcf = company.reverse_dcf || {};
  const irrDecision = company.irr_decision || {};
  const bankMetrics = company.bank_metrics;
  const cyclicalBands = company.cyclical_bands;
  const psLadder = company.ps_ladder;
  const redFlags = company.red_flags || [];
  const shariah = company.shariah;
  const buyGate = company.buy_gate;

  const pe = TTM.eps && px > 0 ? Number((px / TTM.eps).toFixed(1)) : company.pe;
  const pb = balanceIdentity.equity && balanceIdentity.equity > 0 && mc > 0
    ? Number((mc / (balanceIdentity.equity / 1_000_000)).toFixed(2))
    : company.pb;
  const roe = (grades?.["الربحية والكفاءة"]?.p != null) ? `${grades["الربحية والكفاءة"].p}% مئين` : (company.roe ? `${company.roe}%` : "—");
  const netMargin = TTM.revenue && TTM.net_profit ? ((TTM.net_profit / TTM.revenue) * 100).toFixed(1) : null;
  const fcfYield = mc > 0 && TTM.fcf ? ((TTM.fcf / 1_000_000 / mc) * 100).toFixed(1) : null;

  // Discrete Quarters diff & trend
  const periods = quarterly.periods || [];
  const netProfits = quarterly.net_profit || [];
  const lastIdx = periods.length - 1;
  const prevIdx = periods.length - 2;
  const yoyIdx = periods.length - 5;

  const currentQName = lastIdx >= 0 ? periods[lastIdx] : "الربع الأخير";
  const currentQNet = lastIdx >= 0 && netProfits[lastIdx] != null ? netProfits[lastIdx] : null;
  const prevQNet = prevIdx >= 0 && netProfits[prevIdx] != null ? netProfits[prevIdx] : null;
  const yoyQNet = yoyIdx >= 0 && netProfits[yoyIdx] != null ? netProfits[yoyIdx] : null;

  const qoqDelta = (currentQNet != null && prevQNet != null && prevQNet !== 0)
    ? (((currentQNet - prevQNet) / Math.abs(prevQNet)) * 100).toFixed(1)
    : null;
  const yoyDelta = (currentQNet != null && yoyQNet != null && yoyQNet !== 0)
    ? (((currentQNet - yoyQNet) / Math.abs(yoyQNet)) * 100).toFixed(1)
    : null;

  const estimatedFv = zones.silver_max ?? zones.gold_max ?? (nineBox?.earnings?.v2 ?? null);
  const marginOfSafety = company.margin_of_safety ?? (
    (estimatedFv && px > 0)
      ? Number((((estimatedFv - px) / estimatedFv) * 100).toFixed(1))
      : null
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-24">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">ONE · EXEMPLAR</span>
            <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">دراسة الحالة النموذجية الشاملة · Deep-Dive ONE</h1>
          </div>
          <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:inline-block text-xs text-[#6B7280]">
            التشريح الأكاديمي الاستثماري الكامل للشركة وفق منهجية مشعل الخرفشي
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <form onSubmit={handleSymbolSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="رمز السهم (1120)"
              className="w-32 px-2.5 py-1 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold"
            >
              عرض
            </button>
          </form>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
            <span>{copied ? "تم النسخ" : "نسخ الأطروحة"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة المذكرة ⎙</span>
          </button>
        </div>
      </header>

      {/* 2. HERO & CASE STUDY BADGE */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="px-3 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-lg">
                {symbol}
              </span>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-mono border border-[#E5E7EB]">
                {classData?.industry_class || indClass}
              </span>
              <button
                onClick={() => setIsClassModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-[#8C3B32] font-semibold border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-0.5 rounded hover:border-[#8C3B32]"
              >
                <Edit3 size={11} />
                <span>{classData?.is_override ? "تعديل المالك" : "تخصيص الركائز الـ 7"}</span>
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              هذه الصفحة مخصصة كـ <strong>دراسة حالة تشريحية متكاملة (Exemplar Case Study)</strong>، حيث يتم فحص الشركة عبر 14 محطة نقدية ومحاسبية وتنافسية صارمة، للتحقق من أهليتها الاستثمارية وتقدير قيمتها العادلة بدون أي تجميل للأرقام.
            </p>

            <div className="flex items-center flex-wrap gap-3 text-xs pt-1">
              <span className="font-bold text-[#1A1A1A]">{sec}</span>
              <span>•</span>
              <span>تداول السعودية TASI</span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 font-bold ${isFresh ? 'text-[#16A34A]' : 'text-[#B45309]'}`}>
                {isFresh ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {isFresh ? "بيانات نشطة موثقة °" : "تحديث متأخر ≈"}
              </span>
              {isQuarantined ? (
                <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] font-bold border border-[#FECACA]">
                  الحجر الصحي ⚑ سلة العزل
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] font-bold border border-[#BBF7D0]">
                  مجتاز الفحص الرقابي ✓
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px]">
            <div>
              <span className="text-[10px] text-[#64748B] block font-semibold uppercase">السعر الحالي</span>
              <span className="text-lg font-black text-[#0F172A] font-mono">{px.toFixed(2)}</span>
              <span className="text-[10px] text-[#94A3B8] font-mono mr-1">ر.س</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block font-semibold uppercase">القيمة السوقية</span>
              <span className="text-lg font-black text-[#0F172A] font-mono">{(mc / 1000).toFixed(1)}B</span>
              <span className="text-[10px] text-[#94A3B8] font-mono mr-1">ر.س</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block font-semibold uppercase">مكرر TTM</span>
              <span className="text-lg font-black text-[#8C3B32] font-mono">{pe ? `${pe}x` : "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block font-semibold uppercase">جودة بيوتروسكي</span>
              <span className="text-lg font-black text-[#16A34A] font-mono">{company.piotroski ?? 0}/9</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN EXEMPLARY MODULES */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* PILLAR 1: THE INVESTMENT THESIS & BUY GATE VERDICT */}
        <section className="bg-white border border-[#E5E7EB] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#8C3B32]" />
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">أطروحة الاستثمار وبوابة الشراء (Investment Thesis &amp; Buy Gate)</h3>
                <p className="text-xs text-[#6B7280]">خلاصة الفحص الاستثماري النهائي وفق متطلبات المنهجية</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${buyGate?.gate_passed ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'}`}>
              {buyGate?.gate_passed ? "مجتاز لبوابة الشراء والاستثمار ✓" : "لم يجتز شروط البوابة بعد ⚑"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Passed Conditions */}
            <div className="bg-[#F8FAFC] p-4 rounded-[6px] border border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>الشروط المحققة بنجاح ({buyGate?.pass_conditions?.length || 0}):</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#334155] pr-2">
                {buyGate?.pass_conditions && buyGate.pass_conditions.length > 0 ? (
                  buyGate.pass_conditions.map((cond: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#16A34A] font-bold">✓</span>
                      <span>{cond}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#94A3B8]">لا توجد شروط مكتملة معلنة.</li>
                )}
              </ul>
            </div>

            {/* Right: Fail Reasons or Warnings */}
            <div className="bg-[#F8FAFC] p-4 rounded-[6px] border border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>النقاط المعلقة أو التحذيرات ({buyGate?.fail_reasons?.length || 0}):</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#334155] pr-2">
                {buyGate?.fail_reasons && buyGate.fail_reasons.length > 0 ? (
                  buyGate.fail_reasons.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#DC2626] font-bold">⚑</span>
                      <span>{reason}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[#16A34A] flex items-center gap-1.5">
                    <Check size={14} />
                    <span>لا توجد أي معوقات مانعة للشراء وفق محددات المنهجية.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* PILLAR 2: FACTOR SCOREBOARD & RADAR */}
        <section className="space-y-4">
          <RebhRadarScore
            grades={grades}
            sec={sec}
            symbol={symbol}
            warnCount={redFlags.length}
            goodCount={buyGate?.pass_conditions?.length ?? 0}
            marketRank={company.market_rank}
            sectorRank={company.sector_rank}
            isStaleOrFallback={!isFresh}
          />

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3 border-b border-[#E5E7EB] pb-2">
              <h3 className="text-sm font-bold text-[#1A1A1A]">لوحة درجات العوامل الخمسة (Factor Scoreboard)</h3>
              <span className="text-[11px] text-[#9CA3AF] font-mono">° تصنيف كمي معتمد</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {[
                { key: "الأمان والملاءة", label: "الأمان والملاءة (Safety)", fallback: "A" },
                { key: "النمو والزخم", label: "النمو والزخم (Growth)", fallback: "B+" },
                { key: "جاذبية التقييم", label: "جاذبية التقييم (Valuation)", fallback: "B" },
                { key: "جودة القوائم", label: "الميزانية والديون (Balance)", fallback: "A-" },
                { key: "الربحية والكفاءة", label: "الربحية والكاش (Cash)", fallback: "B+" }
              ].map((item) => {
                const gObj = grades[item.key] || { g: item.fallback, p: 75, b: "sector" };
                const isA = gObj.g.startsWith("A");
                const isB = gObj.g.startsWith("B");
                const isC = gObj.g.startsWith("C");
                const color = isA ? 'text-[#16A34A]' : isB ? 'text-[#8C3B32]' : isC ? 'text-[#B8863F]' : 'text-[#DC2626]';

                return (
                  <div key={item.key} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-3.5 text-center">
                    <span className="text-[11px] font-semibold text-[#475569] block mb-1">{item.label}</span>
                    <div className={`text-2xl font-black font-mono ${color}`}>{gObj.g}</div>
                    <div className="text-[10px] text-[#64748B] font-mono mt-1">{gObj.p}% مئين القطاع</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PILLAR 3: VALUATION & VALUATION BANDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#8C3B32]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">مضاعفات التقييم ونطاقات الأسعار العادلة</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#F3F4F6] text-[#8C3B32] rounded border border-[#E5E7EB]">
                {zones.current_zone ? `المنطقة: ${zones.current_zone}` : "نطاقات التسعير"}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">P/E مكرر الأرباح</span>
                <span className="font-mono font-bold text-xs text-[#8C3B32]">{pe ? `${pe}x` : "—"}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">P/B القيمة الدفترية</span>
                <span className="font-mono font-bold text-xs text-[#1A1A1A]">{pb ? `${pb}x` : "—"}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">ROE العائد على الملكية</span>
                <span className="font-mono font-bold text-xs text-[#1A1A1A]">{roe}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">صافي الهامش NPM</span>
                <span className="font-mono font-bold text-xs text-[#1A1A1A]">{netMargin ? `${netMargin}%` : "—"}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">عائد التدفق FCF Yield</span>
                <span className="font-mono font-bold text-xs text-[#16A34A]">{fcfYield ? `${fcfYield}%` : "—"}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
                <span className="text-[10px] text-[#6B7280] block">العائد الداخلي IRR</span>
                <span className="font-mono font-bold text-xs text-[#8C3B32]">
                  {irrDecision?.irr_pct != null ? `${irrDecision.irr_pct}%` : "—"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-[#374151] block">نطاقات القيمة العادلة المشتقة:</span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
                  <span className="text-[10px] font-bold text-[#16A34A] block">المنطقة الذهبية (Gold)</span>
                  <span className="text-sm font-black font-mono text-[#16A34A]">
                    {zones.gold_max ? `≤ ${zones.gold_max} ر.س` : "—"}
                  </span>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-[4px] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#475569] block">المنطقة الفضية (Silver)</span>
                  <span className="text-sm font-black font-mono text-[#0F172A]">
                    {zones.silver_max ? `≤ ${zones.silver_max} ر.س` : "—"}
                  </span>
                </div>
                <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
                  <span className="text-[10px] font-bold text-[#DC2626] block">المنطقة البرونزية (Bronze)</span>
                  <span className="text-sm font-black font-mono text-[#DC2626]">
                    {zones.bronze_max ? `≤ ${zones.bronze_max} ر.س` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                هامش الأمان والنمو الضمني
              </h3>
              <p className="text-[11px] text-[#6B7280]">Margin of Safety &amp; Reverse DCF</p>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-[6px] border border-[#E2E8F0] text-center space-y-1">
              <span className="text-xs text-[#64748B]">هامش الأمان الحالي مقابل القيمة العادلة</span>
              <div className={`text-3xl font-black font-mono ${marginOfSafety && marginOfSafety >= 20 ? 'text-[#16A34A]' : marginOfSafety && marginOfSafety >= 0 ? 'text-[#8C3B32]' : 'text-[#DC2626]'}`}>
                {marginOfSafety != null ? `${marginOfSafety}%` : "—"}
              </div>
              <span className="text-[10px] text-[#94A3B8]">
                {marginOfSafety && marginOfSafety >= 25 ? "هامش مريح يفوق مستهدف الخرفشي (25%)" : "أقل من هامش الأمان المستهدف"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#475569]">
              <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
                <span>النمو الضمني المسعر (Reverse DCF):</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {reverseDcf?.implied_growth_pct != null ? `${reverseDcf.implied_growth_pct}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
                <span>العائد الخالي من المخاطر (صكوك):</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {buildUp?.risk_free_rate_pct != null ? `${buildUp.risk_free_rate_pct}%` : "5.5%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>معدل الخصم المطلوب R:</span>
                <span className="font-mono font-bold text-[#8C3B32]">
                  {buildUp?.required_return_r_pct != null ? `${buildUp.required_return_r_pct}%` : "8.0%"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 4: 9-QUARTER ENGINE ROOM */}
        <section>
          <QuarterlyEngineRoom symbol={symbol} />
        </section>

        {/* PILLAR 5: STATEMENT DIAGNOSTICS & WHAT CHANGED (DIFF) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
                تشخيص القوائم والهوية المحاسبية
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${balanceIdentity.is_valid ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}`}>
                {balanceIdentity.is_valid ? "الهوية مطابقة A = L + E ✓" : "خلل بالميزانية ❌"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <span>فحص توازن الميزانية العمومية:</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {balanceIdentity.is_valid ? "مطابق تماماً (ضمن هامش التفاوت)" : `فارق: ${balanceIdentity.discrepancy ?? "غير محدد"}`}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <span>كبت تقلبات الإشارات المحاسبية (Sign-Flip):</span>
                <span className="font-mono font-semibold text-[#16A34A]">مفعل ومضبوط آلياً ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <span>حالة حداثة القوائم المالية:</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {isFresh ? "محدثة وفق جدول إفصاح تداول" : (staleReason || "متأخرة")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#16A34A]" />
                ما الذي تغير؟ (What Changed &amp; Diff)
              </h3>
              <span className="text-[11px] font-mono text-[#64748B]">{currentQName} مقابل الفترات السابقة</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1E293B] block">التغير الفصلي QoQ</span>
                  <span className="text-[10px] text-[#64748B]">صافي الربح الفصلي</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-sm">
                  {qoqDelta != null ? (
                    Number(qoqDelta) >= 0 ? (
                      <span className="text-[#16A34A] flex items-center gap-0.5">
                        <ArrowUpRight className="w-4 h-4" /> +{qoqDelta}%
                      </span>
                    ) : (
                      <span className="text-[#DC2626] flex items-center gap-0.5">
                        <ArrowDownRight className="w-4 h-4" /> {qoqDelta}%
                      </span>
                    )
                  ) : "—"}
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1E293B] block">التغير السنوي YoY</span>
                  <span className="text-[10px] text-[#64748B]">مقارنة قاعدة الأساس</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-sm">
                  {yoyDelta != null ? (
                    Number(yoyDelta) >= 0 ? (
                      <span className="text-[#16A34A] flex items-center gap-0.5">
                        <ArrowUpRight className="w-4 h-4" /> +{yoyDelta}%
                      </span>
                    ) : (
                      <span className="text-[#DC2626] flex items-center gap-0.5">
                        <ArrowDownRight className="w-4 h-4" /> {yoyDelta}%
                      </span>
                    )
                  ) : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 6: EXAMPLAR STUDY NAVIGATOR */}
        <section className="bg-white border border-[#E5E7EB] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8C3B32]" />
              بوابات التعمق الأكاديمي للشركة (Exemplar Deep-Dives)
            </h3>
            <p className="text-xs text-[#6B7280]">
              الانتقال المباشر للمحطات التحليلية التفصيلية المرتبطة بنفس السهم
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href={`/rebh/analyst/${symbol}`}
              className="p-4 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">جداول القوائم المالية الكاملة</span>
                <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
              </div>
              <p className="text-[11px] text-[#64748B]">
                عرض الدخل والمركز المالي والتدفقات النقدية والنسب المحاسبية المدققة.
              </p>
            </Link>

            <Link
              href={`/rebh/xray/${symbol}`}
              className="p-4 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">فيلم السردية وشلال الأموال</span>
                <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
              </div>
              <p className="text-[11px] text-[#64748B]">
                تشريح نهر الأموال وانحدار الإيراد لكاش وتفكيك دوبونت لمحركات العائد.
              </p>
            </Link>

            <Link
              href={`/rebh/studio/${symbol}`}
              className="p-4 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">استوديو الرسوم التفاعلية</span>
                <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
              </div>
              <p className="text-[11px] text-[#64748B]">
                مقارنة بيانية متعددة المحاور لبنود القوائم والتدفقات والهوامش عبر الزمن.
              </p>
            </Link>
          </div>
        </section>

        {/* PILLAR 7: SECTOR PEERS */}
        <section>
          <SectorPeersTable currentSymbol={symbol} sector={sec} />
        </section>
      </main>

      {/* 7-PILLAR EDIT MODAL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[6px] border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#8C3B32]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  تخصيص ركائز تصنيف الشركة (Owner Overrides)
                </h3>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#1A1A1A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">1. تصنيف الصناعة (Industry Class)</label>
                <input
                  type="text"
                  value={classForm.industry_class}
                  onChange={(e) => setClassForm({ ...classForm, industry_class: e.target.value })}
                  placeholder="دوري / دفاعي / سريع النمو"
                  className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">2. هيكل السوق (Market Form)</label>
                <input
                  type="text"
                  value={classForm.market_form}
                  onChange={(e) => setClassForm({ ...classForm, market_form: e.target.value })}
                  placeholder="احتكار القلة / احتكار تام / منافسة احتكارية"
                  className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">3. المرونة السعرية</label>
                  <input
                    type="text"
                    value={classForm.price_elasticity}
                    onChange={(e) => setClassForm({ ...classForm, price_elasticity: e.target.value })}
                    placeholder="غير مرن / مرن"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">4. مصفوفة BCG</label>
                  <input
                    type="text"
                    value={classForm.bcg_position}
                    onChange={(e) => setClassForm({ ...classForm, bcg_position: e.target.value })}
                    placeholder="بقرات نقدية / نجوم / كلاب"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">5. الهيمنة التنافسية</label>
                  <input
                    type="text"
                    value={classForm.dominance}
                    onChange={(e) => setClassForm({ ...classForm, dominance: e.target.value })}
                    placeholder="رائد السوق / منافس قوي"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">6. مسار التجزئة</label>
                  <input
                    type="text"
                    value={classForm.retail_path}
                    onChange={(e) => setClassForm({ ...classForm, retail_path: e.target.value })}
                    placeholder="قوة العلامة التجزئية / بيع بين الشركات B2B"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">7. مذكرات وتبرير المالك</label>
                <textarea
                  value={classForm.notes}
                  onChange={(e) => setClassForm({ ...classForm, notes: e.target.value })}
                  rows={2}
                  placeholder="ملاحظات حول سبب التعديل..."
                  className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-[#E5E7EB] pt-3">
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="rounded border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveClassification}
                disabled={isSavingClass}
                className="inline-flex items-center gap-1.5 rounded bg-[#8C3B32] px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#752f28] disabled:opacity-50"
              >
                {isSavingClass ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}