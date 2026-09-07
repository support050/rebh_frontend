"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ArrowUpRight, ArrowDownRight, ShieldCheck,
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3,
  Layers, FileText, Search, Activity, Cpu, Percent, HelpCircle,
  Clock, ShieldAlert, Sparkles, Edit3, X, Check
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import RebhRadarScore from "../../[symbol]/components/RebhRadarScore";
import SectorPeersTable from "../../[symbol]/components/SectorPeersTable";
import QuarterlyEngineRoom from "../../[symbol]/components/QuarterlyEngineRoom";

export default function RebhCompanyOfficialPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 7-Pillar Classification Modal State
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
            throw new Error(`خطأ في جلب بيانات الشركة: ${compatRes.status}`);
          }
          const compatData = await compatRes.json();
          setCompany(compatData);
          return;
        }
        const data = await res.json();
        setCompany(data);
      } catch (err: any) {
        setError(err.message || "حدث خطأ في الاتصال بالخادم");
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
      } catch (err) {
        console.error("Failed to load classification:", err);
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
          <p className="text-sm text-[#6B7280]">جاري تشغيل محرك REBH واستخراج القوائم المالية الموحدة...</p>
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
            <h2 className="text-lg font-bold mb-1.5">تعذر عرض بيانات الرمز: {symbol}</h2>
            <p className="text-sm text-[#6B7280]">{error || "الشركة غير موجودة أو لم تكتمل قوائمها بعد"}</p>
          </div>
          <Link
            href="/rebh/company/2222"
            className="inline-block px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-sm font-semibold hover:bg-[#752f28] transition-colors"
          >
            العودة لرمز قياسي (2222 أرامكو)
          </Link>
        </div>
      </div>
    );
  }

  // Contract data mapping (supporting both RebhUniversalContract and legacy fields)
  const name = company.name || company.n || symbol;
  const sec = company.sector || company.sec || "—";
  const indClass = company.industry_class || "—";
  const px = Number(company.price ?? company.px ?? 0);
  const mc = Number(company.market_cap ?? company.mc ?? 0);
  const isFresh = company.fresh !== false;
  const staleReason = company.stale_reason;
  const quarantineReason = company.quarantine_reason;
  const isQuarantined = Boolean(quarantineReason || (!company.balance_identity?.is_valid && company.balance_identity));

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

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-16">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/rebh/tools" className="flex items-center gap-2 text-[#1A1A1A] font-bold tracking-tight text-base">
            <Cpu className="w-5 h-5 text-[#8C3B32]" />
            REBH ONE
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-[#6B7280]">
            <Link href={`/rebh/company/${symbol}`} className="text-[#8C3B32] border-b-2 border-[#8C3B32] pb-1 font-semibold">نظرة شاملة</Link>
            <Link href="/rebh/tools" className="hover:text-[#1A1A1A] transition-colors">الأدوات والمختبرات</Link>
            <Link
              href={`/rebh/report/${symbol}`}
              className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] text-[#1A1A1A] hover:border-[#8C3B32] hover:text-[#8C3B32] rounded-[4px] transition-colors font-semibold flex items-center gap-1.5"
            >
              <span>عرض التقرير الرسمي</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Freshness / Quarantine Alert Bar (Rule #1 & #10) */}
      {isQuarantined && (
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-3 flex items-center gap-3 text-xs text-[#DC2626]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">تم عزل السهم في سلة الحجر المالي (Quarantine): </span>
            <span>{quarantineReason || company.balance_identity?.reason || "فشل التحقق من الهوية المحاسبية للميزانية العمومية"}</span>
          </div>
          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#FECACA]">حظر التسعير الآلي ⚑</span>
        </div>
      )}

      {!isFresh && !isQuarantined && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-6 py-2.5 flex items-center gap-3 text-xs text-[#B45309]">
          <Clock className="w-4 h-4 shrink-0" />
          <span>تنبيه حداثة البيانات: {staleReason || "القوائم المالية للشركة تجاوزت المدة النظامية دون تحديث"} (≈ تقدير معلن)</span>
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
              <button
                onClick={() => setIsClassModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-[#8C3B32] hover:text-[#752f28] font-medium border border-[#E5E7EB] hover:border-[#8C3B32] bg-[#F7F8FA] px-2 py-0.5 rounded transition-colors"
                title="تعديل تصنيف الشركة (7 ركائز)"
              >
                <Edit3 size={11} />
                <span>{classData?.is_override ? "تعديل المالك" : "تخصيص التصنيف"}</span>
              </button>
            </div>
            <span className="text-xs text-[#6B7280]">{sec} · السوق السعودي TASI</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">السعر الحالي</span>
            <span className="text-sm font-bold text-[#1A1A1A] font-mono">{px.toFixed(2)} ر.س</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">القيمة السوقية</span>
            <span className="text-sm font-bold text-[#1A1A1A] font-mono">{(mc / 1000).toFixed(1)}B ر.س</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">مكرر الأرباح P/E°</span>
            <span className="text-sm font-bold text-[#8C3B32] font-mono">{pe ? `${pe}x` : "—"}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase tracking-wide mb-0.5">جودة بيوتروسكي</span>
            <span className="text-sm font-bold text-[#16A34A] font-mono">{f_score}/9</span>
          </div>
        </div>
      </div>

      {/* 7-Pillars Classification Strip */}
      {classData && (
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-2.5 text-[11.5px] text-[#475569] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-[#1E293B]">تصنيف ركائز العمل:</span>
            <span>هيكل السوق: <strong className="text-[#0F172A]">{classData.market_form || "—"}</strong></span>
            <span>المرونة السعرية: <strong className="text-[#0F172A]">{classData.price_elasticity || "—"}</strong></span>
            <span>مصفوفة BCG: <strong className="text-[#0F172A]">{classData.bcg_position || "—"}</strong></span>
            <span>الهيمنة: <strong className="text-[#0F172A]">{classData.dominance || "—"}</strong></span>
            <span>مسار التجزئة: <strong className="text-[#0F172A]">{classData.retail_path || "—"}</strong></span>
          </div>
          <div className="font-mono text-[10.5px] text-[#64748B]">
            {classData.source}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Rebh 5-Factor Radar Score */}
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

        {/* Factor Grades Row */}
        {grades && Object.keys(grades).length > 0 && (
          <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1A1A1A]">التقييم الكمي مقارنة بالقطاع</h3>
              <span className="text-[11px] text-[#9CA3AF] font-mono">الأساس: مئينات القطاع والسوق°</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(grades).map(([factor, item]: [string, any]) => {
                const isA = item.g.startsWith("A");
                const isB = item.g.startsWith("B");
                const isC = item.g.startsWith("C");
                const gradeColor = isA ? 'text-[#16A34A]' : isB ? 'text-[#8C3B32]' : isC ? 'text-[#B8863F]' : 'text-[#DC2626]';
                return (
                  <div key={factor} className="bg-[#F7F8FA] rounded-[4px] p-3.5 text-center border border-[#E5E7EB]">
                    <div className={`text-2xl font-black font-mono ${gradeColor}`}>
                      {item.g}
                    </div>
                    <div className="text-xs text-[#1A1A1A] font-medium mt-1">{factor}</div>
                    <div className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">{item.p}% مئين</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Two-Column Valuation & Core Methodology */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Khurafshi Safety Cluster & Build-Up R */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
                عنقود السلامة والعائد المطلوب R°
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#F3F4F6] text-[#8C3B32] rounded-full border border-[#E5E7EB]">
                R = {buildUp?.required_return_r_pct ? `${buildUp.required_return_r_pct}%` : "8.0%"}
              </span>
            </div>

            {/* Safety Items */}
            <div className="space-y-2">
              {safety?.details ? (
                safety.details.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                    <span className="text-[#6B7280] font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1A1A1A] font-bold font-mono">{item.val}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.score > 0 ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : item.score === 0 ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}`}>
                        {item.score > 0 ? '+1 أمان' : item.score === 0 ? '0 محايد' : '-1 خطر'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B7280]">عناصر السلامة تخضع لنموذج القطاع المعتمد.</p>
              )}
            </div>

            {/* Build-Up Decomposition */}
            {buildUp && (
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
                <div className="flex justify-between">
                  <span>عائد الصك الأساس ({buildUp.rate_source}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{buildUp.risk_free_rate_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>تعويض قوى بورتر ({buildUp.porter_compensation_pct}% × {buildUp.porter_weight}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{(buildUp.porter_compensation_pct * buildUp.porter_weight).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>تعويض الأمان المالي ({buildUp.safety_compensation_pct}% × {buildUp.safety_weight}):</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{(buildUp.safety_compensation_pct * buildUp.safety_weight).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Nine-Box & Valuation Bands */}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                نطاقات الأسعار ومصفوفة الصناديق التسعة
              </h2>
              {zones?.current_zone && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#8C3B32] border border-[#E5E7EB]">
                  المنطقة الحالية: {zones.current_zone}
                </span>
              )}
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
                <span className="text-[10px] text-[#16A34A] block font-bold">المنطقة الذهبية</span>
                <span className="text-xs font-black text-[#16A34A] font-mono">
                  {zones?.gold_max ? `≤ ${zones.gold_max} ر.س` : "—"}
                </span>
              </div>
              <div className="bg-[#F3F4F6] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#8C3B32] block font-bold">المنطقة الفضية</span>
                <span className="text-xs font-black text-[#1A1A1A] font-mono">
                  {zones?.silver_max ? `≤ ${zones.silver_max} ر.س` : "—"}
                </span>
              </div>
              <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
                <span className="text-[10px] text-[#DC2626] block font-bold">المنطقة البرونزية</span>
                <span className="text-xs font-black text-[#DC2626] font-mono">
                  {zones?.bronze_max ? `≤ ${zones.bronze_max} ر.س` : "—"}
                </span>
              </div>
            </div>

            {/* IRR Decision & Margin of Safety */}
            <div className="bg-[#F7F8FA] p-3.5 rounded-[4px] border border-[#E5E7EB] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>العائد الداخلي المتوقع (IRR على 5 سنوات):</span>
                <span className="text-[#1A1A1A] font-mono font-bold">
                  {irrDecision?.irr_pct != null ? `${irrDecision.irr_pct}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>هامش الأمان الحالي (Margin of Safety):</span>
                <span className="text-[#16A34A] font-mono font-bold">
                  {company.margin_of_safety != null ? `${company.margin_of_safety}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>النمو الضمني المسعر (Reverse DCF):</span>
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
                مختبر وعدة التحليل المصرفي المتخصص (Banks Toolkit)
              </h2>
              <span className="text-[11px] text-[#16A34A] font-mono">NIM على متوسط الأصول المدرة°</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">هامش الفائدة الصافي NIM</span>
                <span className="text-base font-black font-mono text-[#1A1A1A]">
                  {bankMetrics.nim_pct != null ? `${bankMetrics.nim_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">الودائع الجارية CASA</span>
                <span className="text-base font-black font-mono text-[#1A1A1A]">
                  {bankMetrics.casa_pct != null ? `${bankMetrics.casa_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">القروض للودائع LDR</span>
                <span className={`text-base font-black font-mono ${bankMetrics.ldr_pct && bankMetrics.ldr_pct >= 95 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {bankMetrics.ldr_pct != null ? `${bankMetrics.ldr_pct}%` : "—"}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#9CA3AF] block">تكلفة المخاطر COR</span>
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
            <h3 className="text-sm font-bold text-[#1A1A1A]">نطاقات الأسهم الدورية (Cyclical Bands Rule)</h3>
            <p className="text-xs text-[#6B7280]">
              شراء القاع الدقيق: 14–16x على أقل ربح دوري واضح ({cyclicalBands.lowest_cycle_eps ?? "—"} ر.س) = {cyclicalBands.buy_band_min ?? "—"} إلى {cyclicalBands.buy_band_max ?? "—"} ر.س.
            </p>
          </div>
        )}

        {psLadder && psLadder.is_loss_maker && (
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">سلم مضاعف المبيعات للشركات غير الرابحة (P/S Ladder)</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
                <span className="text-[10px] text-[#16A34A] block">نطاق رخيص</span>
                <span className="font-mono font-bold text-[#16A34A]">{psLadder.cheap_ps ?? "—"}x P/S</span>
              </div>
              <div className="bg-[#F3F4F6] p-3 rounded-[4px] border border-[#E5E7EB]">
                <span className="text-[10px] text-[#8C3B32] block">نطاق معتدل</span>
                <span className="font-mono font-bold text-[#1A1A1A]">{psLadder.medium_ps ?? "—"}x P/S</span>
              </div>
              <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
                <span className="text-[10px] text-[#DC2626] block">نطاق الخطر</span>
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
              الرايات المحاسبية والضوابط الشرعية (Forensic Red Flags &amp; Shariah)
            </h3>
            {shariah && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                {shariah.is_compliant ? "متوافق كمياً مع الضوابط الشرعية ✓" : "تحت المراجعة الشرعية"}
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
                    <span className="font-bold">{flag.title_ar}: </span>
                    <span>{flag.detail}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs p-3 rounded-[4px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532d]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>لا توجد رايات حمراء محاسبية مكتشفة في القوائم المالية الأخيرة.</span>
              </div>
            )}
          </div>
        </section>

        {/* 9-Quarter Engine Room */}
        <QuarterlyEngineRoom symbol={symbol} />

        {/* Sector Peers Comparison Table */}
        <SectorPeersTable currentSymbol={symbol} sector={sec} />

        {/* Disclaimer Footer */}
        <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB] space-y-1">
          <p>منصة REBH — أداة تعليمية وتحليلية وفق منهجية مشعل الخرفشي · لا تقدم أي توصيات بيع أو شراء مباشرة.</p>
          <p className="font-mono text-[10px]">علامات الشفافية: ° محسوب آلياً · ≈ تقدير معلن بسببه · ⚑ إشارة رقابية</p>
        </footer>
      </main>

      {/* 7-Pillar Classification Edit Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[4px] border border-[#E5E7EB] bg-white p-6 shadow-xl">
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

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">1. تصنيف الصناعة (Industry Class)</label>
                <input
                  type="text"
                  value={classForm.industry_class}
                  onChange={(e) => setClassForm({ ...classForm, industry_class: e.target.value })}
                  placeholder="مثال: Cyclical (دورية) / Growing (متنامية) / Defensive"
                  className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">2. هيكل وشكل السوق (Market Form)</label>
                <input
                  type="text"
                  value={classForm.market_form}
                  onChange={(e) => setClassForm({ ...classForm, market_form: e.target.value })}
                  placeholder="مثال: Oligopoly (احتكار قلة) / Monopoly / Monopolistic Competition"
                  className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">3. المرونة السعرية (Elasticity)</label>
                  <input
                    type="text"
                    value={classForm.price_elasticity}
                    onChange={(e) => setClassForm({ ...classForm, price_elasticity: e.target.value })}
                    placeholder="مثال: Inelastic / Elastic"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">4. مصفوفة BCG (BCG Stage)</label>
                  <input
                    type="text"
                    value={classForm.bcg_position}
                    onChange={(e) => setClassForm({ ...classForm, bcg_position: e.target.value })}
                    placeholder="مثال: Cash Cows / Stars / Question Marks"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">5. الهيمنة التنافسية (Dominance)</label>
                  <input
                    type="text"
                    value={classForm.dominance}
                    onChange={(e) => setClassForm({ ...classForm, dominance: e.target.value })}
                    placeholder="مثال: Market Leader / Strong Challenger"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">6. مسار التجزئة وقوة التسعير</label>
                  <input
                    type="text"
                    value={classForm.retail_path}
                    onChange={(e) => setClassForm({ ...classForm, retail_path: e.target.value })}
                    placeholder="مثال: Retail Brand Power / B2B Contractual"
                    className="w-full rounded border border-[#D1D5DB] px-3 py-1.5 text-xs outline-none focus:border-[#8C3B32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">7. مذكرات ومبررات التعديل (Notes)</label>
                <textarea
                  value={classForm.notes}
                  onChange={(e) => setClassForm({ ...classForm, notes: e.target.value })}
                  rows={2}
                  placeholder="أسباب التعديل أو الاستثناء الخاص بالسهم..."
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
