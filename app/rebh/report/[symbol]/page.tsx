"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer, ArrowRight, Shield, Award, CheckCircle2,
  AlertCircle, FileText, Scale, Edit3, Save, AlertTriangle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

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
          throw new Error(`تعذر جلب التقرير المالي (كود ${res.status})`);
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
        setError(err.message || "فشل الاتصال بخادم التقارير");
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B7280]">جاري إنشاء التقرير المالي الرسمي لـ {symbol} من محرك REBH...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-8 flex flex-col items-center justify-center">
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">تعذر تحميل التقرير</h2>
            <p className="text-xs text-[#6B7280] mt-1">{error || "البيانات غير متوفرة حالياً"}</p>
          </div>
          <Link
            href={`/rebh/${symbol}`}
            className="inline-block px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#7a332b] transition"
          >
            العودة لشاشة الشركة ONE ∞
          </Link>
        </div>
      </div>
    );
  }

  // Contract field extraction
  const name = company.name || company.n || symbol;
  const sec = company.sector || company.sec || "—";
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
  const companyCategory = isBank ? "مالية / بنوك (عدة العسيري)" : isCyclical ? "دورية (تخضع للنطاقات)" : isLossMaker ? "غير رابحة (مسار P/S)" : (roe && roe > 15) ? "متنامية (Growth)" : "دفاعية / مستقرة";

  // R x GS Stress Matrix
  const rRates = [0.06, 0.08, 0.10, 0.12];
  const gsRates = [0.02, 0.04, 0.06, 0.08];

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-8 text-[#1A1A1A] font-sans print:bg-white print:py-0 antialiased" dir="rtl">
      {/* Print Controls & Navigation (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center print:hidden">
        <Link href={`/rebh/company/${symbol}`} className="text-xs font-bold text-[#8C3B32] hover:underline flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          العودة لشاشة السهم ONE ∞
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-[4px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F3F4F6] transition"
          >
            <Save className="w-3.5 h-3.5" />
            {savedNotes ? "تم الحفظ ✓" : "حفظ الملاحظات"}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-bold flex items-center gap-2 hover:bg-[#7a332b] transition shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <Printer className="w-4 h-4" />
            طباعة / تصدير PDF ⎙
          </button>
        </div>
      </div>

      {/* The Printable Document */}
      <div className="max-w-4xl mx-auto bg-white border border-[#E5E7EB] rounded-[4px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] print:border-none print:shadow-none print:p-2">
        {/* Document Header */}
        <header className="border-b-2 border-[#8C3B32] pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-[11px] font-bold text-[#8C3B32] tracking-wide uppercase mb-1">
              REBH RESEARCH · التقرير المالي التحليلي الشامل (منهجية مشعل الخرفشي)
            </div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{name} ({symbol})</h1>
            <span className="text-xs text-[#6B7280]">القطاع: {sec} · التصنيف المنهجي: {companyCategory}</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-[#9CA3AF] block uppercase tracking-wider">تاريخ السحب والإصدار°</span>
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">{asOf}</span>
          </div>
        </header>

        {/* 1. Summary Metrics Card */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            1. المؤشرات الأساسية وهيكل التسعير السوقي (Market Pricing &amp; Scale)
          </h2>
          <div className="grid grid-cols-4 gap-3 text-xs border border-[#E5E7EB] rounded-[4px] p-3 bg-[#F3F4F6]">
            <div>
              <span className="text-[#6B7280] block text-[10px]">السعر السوقي</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{px.toFixed(2)} ر.س</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">القيمة السوقية</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{mc ? `${(mc / 1000).toFixed(1)}B ر.س` : "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">مكرر الأرباح P/E°</span>
              <span className="font-bold text-[#1A1A1A] font-mono">{pe ? `${pe.toFixed(1)}x` : "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">جودة بيوتروسكي</span>
              <span className="font-bold text-[#16A34A] font-mono">{f_score}/9</span>
            </div>
          </div>
        </section>

        {/* Quarterly Statements & Provenance Section */}
        {company.TTM && (
          <section className="mb-6">
            <h2 className={SECTION_TITLE}>
              1.1 توثيق القوائم المالية ربع السنوية (TTM Provenance &amp; Quarters)
            </h2>
            <div className="border border-[#E5E7EB] rounded-[4px] p-3 text-xs bg-white space-y-2">
              <div className="flex flex-wrap justify-between items-center text-[#6B7280] text-[11px] border-b border-[#E5E7EB] pb-2">
                <span>الفترات المشمولة في حساب TTM: <b className="text-[#1A1A1A]">{company.TTM.discrete_quarters_count || 4} فترات متتالية</b></span>
                <span>اكتمال القوائم: <b className={company.TTM.is_complete ? "text-[#16A34A]" : "text-[#B45309]"}>{company.TTM.is_complete ? "مكتملة ✓" : "تقدير جزئي ⚑"}</b></span>
                <span>الإيرادات السنوية TTM: <b className="text-[#1A1A1A]">{company.TTM.revenue ? `${(company.TTM.revenue / 1000).toFixed(1)}B ر.س` : "—"}</b></span>
                <span>صافي الدخل TTM: <b className="text-[#1A1A1A]">{company.TTM.net_profit ? `${(company.TTM.net_profit / 1000).toFixed(1)}B ر.س` : "—"}</b></span>
              </div>
            </div>
          </section>
        )}

        {/* 2. Shariah & Capital Structure */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            2. فحص الهيكل المالي والضوابط الشرعية الكمية (Shariah Quantitative Legs)
          </h2>
          <table className="w-full text-xs border border-[#E5E7EB] rounded-[4px] text-right border-collapse overflow-hidden">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="p-2 font-semibold text-[#6B7280]">المعيار المالي</th>
                <th className="p-2 font-semibold text-[#6B7280]">الحد الأقصى المرجعي</th>
                <th className="p-2 font-semibold text-[#6B7280]">النسبة الفعلية المحسوبة°</th>
                <th className="p-2 font-semibold text-[#6B7280]">حالة الشاشة الكمية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr>
                <td className="p-2">نسبة الديون إلى حقوق الملكية (D/E)</td>
                <td className="p-2 font-mono">معتدل &lt; 1.0x</td>
                <td className="p-2 font-bold font-mono">{de != null ? `${de}x` : "—"}</td>
                <td className="p-2 text-[#16A34A] font-bold">{de != null && de < 1.0 ? "سليم ✓" : "تنبيه ⚠"}</td>
              </tr>
              <tr>
                <td className="p-2">الديون بالنسبة للأصول (Debt / Assets)</td>
                <td className="p-2 font-mono">&le; 33.0%</td>
                <td className="p-2 font-bold font-mono">
                  {debtToAssetsPct != null ? `${debtToAssetsPct.toFixed(1)}%` : "🔌 مصدر غير متاح"}
                </td>
                <td className="p-2 text-[#16A34A] font-bold">
                  {debtToAssetsPct != null ? (debtToAssetsPct <= 33 ? "متوافق كمياً ✓" : "تجاوز السقف ⚑") : "قيد السحب"}
                </td>
              </tr>
              <tr>
                <td className="p-2">نسبة التداول والسيولة (Current Ratio)</td>
                <td className="p-2 font-mono">&ge; 1.50x</td>
                <td className="p-2 font-bold font-mono">{current != null ? `${Number(current).toFixed(2)}x` : "—"}</td>
                <td className="p-2 font-bold">{current != null && current >= 1.5 ? "قوي ✓" : "مقبول"}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">
            {company.shariah?.committee_disclaimer || "هذا الفحص كمي آلي ولا يغني عن اعتماد اللجان الشرعية المعتمدة."}
          </p>
        </section>

        {/* 3. Safety Cluster & Build-Up R */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            3. عنقود السلامة والعائد المطلوب (Khurafshi Build-Up R)
          </h2>
          <div className="border border-[#E5E7EB] rounded-[4px] p-4 space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between items-center bg-[#F3F4F6] p-2 rounded-[4px] font-bold">
              <span>العائد المطلوب المعتمد R° (Build-Up):</span>
              <span className="text-base text-[#8C3B32] font-mono">{requiredReturnPct}%</span>
            </div>
            {buildUp && (
              <div className="text-[11px] text-[#6B7280] space-y-1">
                <p>مكونات العائد المطلوب: {buildUp.formula_display}</p>
                <p className="text-[10px] text-[#9CA3AF]">مصدر الصك الأساسي: {buildUp.rate_source} ({buildUp.risk_free_rate_pct}%)</p>
              </div>
            )}
            <p className="text-[#1A1A1A]">
              تسجل الشركة عائداً على حقوق المساهمين قدره <b>{roe != null ? `${roe}%` : "—"}</b> وعائداً على الأصول يبلغ <b>{roa != null ? `${roa}%` : "—"}</b>.
              {isCyclical
                ? " وبما أن الشركة تنتمي للقطاع الدوري، فإن القرار الاستثماري المنهجي يُشتق من مكررات القمة والقاع الدورية مع تجنب فخ انخفاض مكرر الأرباح عند الذروة."
                : isBank
                  ? " وتخضع لمؤشرات التحليل المصرفي (NIM على متوسط الأصول المدرة، ونسبة CASA، وسلامة LDR)."
                  : " وتخضع الشركة لتقييم التدفقات والأرباح الدائمة مع هامش أمان متطلب لا يقل عن 15%."}
            </p>
          </div>
        </section>

        {/* 3.1 Nine-Box Valuation Matrix (Khurafshi Canonical 9-Box) */}
        {company.nine_box && (
          <section className="mb-6">
            <h2 className={SECTION_TITLE}>
              3.1 مصفوفة التقييم التساعية المعتمدة (Khurafshi 9-Box Matrix)
            </h2>
            <p className="text-[11px] text-[#6B7280] mb-2">
              تقييم السهم عبر الركائز الثلاث (الأرباح الموزعة، أرباح السهم، والتدفق النقدي الحر المخصوم منه صافي الدين) بمستويات النمو الثلاثة (صفر، طويل الأجل {company.nine_box.gl_pct}%، وقصير الأجل {company.nine_box.gs_pct}%):
            </p>
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-[4px]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th className="p-2 border-l border-[#E5E7EB] text-[#6B7280]">الركيزة المنهجية</th>
                    <th className="p-2 border-l border-[#E5E7EB] text-[#6B7280]">القيمة الأساسية X</th>
                    <th className="p-2 border-l border-[#E5E7EB] text-[#6B7280]">V1 (بدون نمو)</th>
                    <th className="p-2 border-l border-[#E5E7EB] text-[#6B7280]">V2 (نمو دائم {company.nine_box.gl_pct}%)</th>
                    <th className="p-2 text-[#6B7280]">V3 (نمو انتقالي {company.nine_box.gs_pct}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-l border-[#E5E7EB]">أرباح السهم (Earnings)</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.earnings?.x_value ?? "—"} ر.س</td>
                    <td className="p-2 font-mono font-bold text-[#8C3B32] border-l border-[#E5E7EB]">{company.nine_box.earnings?.v1 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.earnings?.v2 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono font-bold text-[#16A34A]">{company.nine_box.earnings?.v3 ?? "—"} ر.س</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-l border-[#E5E7EB]">التدفق الحر بعد الدين (FCF Net Debt)</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.x_value ?? "—"} ر.س</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.v1 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.fcf_net_debt?.v2 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono">{company.nine_box.fcf_net_debt?.v3 ?? "—"} ر.س</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-[#F3F4F6] border-l border-[#E5E7EB]">التوزيعات النقدية (Dividends)</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.dividends?.x_value ?? "—"} ر.س</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.dividends?.v1 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono border-l border-[#E5E7EB]">{company.nine_box.dividends?.v2 ?? "—"} ر.س</td>
                    <td className="p-2 font-mono">{company.nine_box.dividends?.v3 ?? "—"} ر.س</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {company.zones && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F7F8FA] rounded-[4px] border border-[#E5E7EB] text-[11px]">
                <span>المناطق السعرية: <b className="text-[#B45309]">الذهب &le; {company.zones.gold_max} ر.س</b> · <b className="text-[#6B7280]">الفضة &le; {company.zones.silver_max} ر.س</b> · <b className="text-[#1A1A1A]">البرونز &le; {company.zones.bronze_max} ر.س</b></span>
                <span>المنطقة الحالية للسعر ({px} ر.س): <b className="text-[#8C3B32]">{company.zones.current_zone}</b></span>
              </div>
            )}
          </section>
        )}

        {/* 4. R x GS Two-Way Stress Table */}
        <section className="mb-6">
          <h2 className={SECTION_TITLE}>
            4. مصفوفة الإجهاد الثنائية (R × GS Stress Matrix)
          </h2>
          <p className="text-[11px] text-[#6B7280] mb-2">
            جدول حساسية القيمة العادلة للسهم (ر.س) عند تقاطع معدلات العائد المطلوب R مع معدلات النمو المتوقعة GS:
          </p>
          <table className="w-full text-xs border border-[#E5E7EB] rounded-[4px] text-center border-collapse overflow-hidden">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="p-2 border-l border-[#E5E7EB] font-semibold text-[#6B7280]">R \ GS</th>
                {gsRates.map(g => (
                  <th key={g} className="p-2 font-semibold text-[#6B7280]">نمو {(g * 100).toFixed(0)}%</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {rRates.map(r => (
                <tr key={r}>
                  <td className="p-2 bg-[#F3F4F6] font-bold border-l border-[#E5E7EB]">خصم {(r * 100).toFixed(0)}%</td>
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
            5. التقييم العكسي وتوقعات السوق (Reverse DCF Analysis)
          </h2>
          <div className="border border-[#E5E7EB] rounded-[4px] p-4 space-y-2 text-xs leading-relaxed text-[#1A1A1A]">
            <p>
              <b>معدل النمو الذي يسعره السوق حالياً في السهم: </b>
              <span className="font-bold text-[#8C3B32] font-mono">{impliedGrowthPct != null ? `${impliedGrowthPct}%` : "—"}</span>
            </p>
            <p className="text-[#6B7280]">
              {impliedGrowthPct && impliedGrowthPct > 10
                ? "السوق يسعر نمواً مرتفعاً جداً في السهم، مما يجعله مسعراً بإتقان ويقلل من هامش الأمان للمستثمر."
                : "السوق يسعر نمواً متواضعاً أو محافظاً، مما يمنح المستثمر فرصة إذا تجاوز الأداء الفعلي التوقعات الهادئة."}
            </p>
          </div>
        </section>

        {/* 6. Analyst Written Notes */}
        <section className="mb-6">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-1 mb-2">
            <h2 className="text-xs font-bold text-[#8C3B32] uppercase tracking-wide">
              6. سجل وملاحظات المحلل الشخصية (Analyst Notes &amp; Thesis)
            </h2>
            <span className="text-[10px] text-[#9CA3AF]">قاعدة الدورة: وثق الـ R المعتمد ولماذا قبل الأرشفة</span>
          </div>
          <div className="border border-[#E5E7EB] rounded-[4px] p-3 bg-[#F3F4F6]">
            <textarea
              rows={4}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="اكتب هنا فرضيتك الاستثمارية، العائد المطلوب R المعتمد، الأسباب وراء تقييمك، والنقاط التي إن تغيرت ستغير قرارك..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[4px] p-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 leading-relaxed transition"
            />
          </div>
        </section>

        {/* Document Footer */}
        <footer className="mt-8 pt-4 border-t-2 border-[#8C3B32] text-[10px] text-[#6B7280] text-center space-y-1">
          <p className="font-bold text-[#1A1A1A]">إخلاء مسؤولية تعليمي صارم:</p>
          <p>
            هذا التقرير التحليلي أُنشئ وفق منهجية دورة الأستاذ مشعل الخرفشي لأغراض تعليمية وتحليلية بحتة.
            جميع الأرقام والبيانات مستخرجة مباشرة من القوائم المالية الرسمية للشركة. لا تعتبر محتويات هذا التقرير بأي حال من الأحوال توصية بشراء أو بيع أو اتخاذ أي قرار استثماري.
          </p>
        </footer>
      </div>
    </div>
  );
}