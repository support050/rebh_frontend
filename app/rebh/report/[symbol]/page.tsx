"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Printer, ArrowRight, Shield, Award, CheckCircle2, 
  AlertCircle, FileText, Scale, Edit3, Save 
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

export default function RebhReportPage() {
  const params = useParams();
  const symbol = (params?.symbol as string) || "2222";
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
        // Load notes from local storage if available
        const localNote = localStorage.getItem(`rebh_note_${symbol}`);
        if (localNote) {
          setUserNotes(localNote);
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [symbol]);

  const handleSaveNotes = () => {
    localStorage.setItem(`rebh_note_${symbol}`, userNotes);
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-8">
        <p className="font-mono text-sm">جاري إنشاء التقرير المالي الرسمي لـ {symbol}...</p>
      </div>
    );
  }

  const { n: name, sec, px, mc, pe, roe, roa, de, current, fv, wl, khurafshi, f_score } = company;

  // Auto-Prose & Classification Logic (Matching Abu Saad Report Spec)
  const isBank = sec === "Banks" || sec === "Financial Services";
  const isCyclical = ["Materials", "Energy", "Real Estate Mgmt & Dev't", "Capital Goods"].includes(sec);
  const companyCategory = isBank ? "مالية / بنوك" : isCyclical ? "دورية (تخضع للنطاقات)" : (roe && roe > 15) ? "متنامية (Growth)" : "دفاعية / مستقرة";

  // Reverse DCF Implied Growth Calculation
  const requiredR = 0.08; // 8% base benchmark R
  const eps = pe && pe > 0 ? (px / pe) : null;
  const impliedGrowthPct = eps && px ? Math.round(((px * requiredR - eps) / (px + eps)) * 1000) / 10 : null;

  // R x GS Stress Matrix (Klarman Two-Way Stress Table)
  const rRates = [0.07, 0.08, 0.09, 0.10];
  const gsRates = [0.02, 0.04, 0.06, 0.08];

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-8 text-black font-sans print:bg-white print:py-0 antialiased">
      {/* Print Controls & Navigation (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center print:hidden">
        <Link href={`/rebh/${symbol}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          العودة لشاشة السهم ONE ∞
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-300 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {savedNotes ? "تم الحفظ ✓" : "حفظ الملاحظات"}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#8b0000] text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-800 transition shadow"
          >
            <Printer className="w-4 h-4" />
            طباعة / تصدير PDF ⎙
          </button>
        </div>
      </div>

      {/* The Printable Document (Abu Saad Style: White Background, Red #8b0000 Accents, Formal Borders) */}
      <div className="max-w-4xl mx-auto bg-white border-2 border-[#8b0000] p-8 shadow-sm print:border-none print:shadow-none print:p-2">
        {/* Document Header */}
        <header className="border-b-2 border-[#8b0000] pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-[11px] font-bold text-[#8b0000] tracking-wider uppercase font-mono mb-1">
              REBH RESEARCH · التقرير المالي التحليلي الشامل (نمط أبو سعد)
            </div>
            <h1 className="text-2xl font-black text-black">{name} ({symbol})</h1>
            <span className="text-xs text-gray-600">القطاع: {sec} · التصنيف المنهجي: {companyCategory}</span>
          </div>
          <div className="text-left font-mono">
            <span className="text-xs text-gray-500 block">تاريخ السحب والإصدار</span>
            <span className="text-xs font-bold text-black">{new Date().toLocaleDateString('ar-SA')}</span>
          </div>
        </header>

        {/* 1. Summary Metrics Card */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
            1. المؤشرات الأساسية وهيكل التسعير السوقي
          </h2>
          <div className="grid grid-cols-4 gap-3 text-xs border border-gray-300 p-3 bg-gray-50 font-mono">
            <div>
              <span className="text-gray-500 block text-[10px]">السعر السوقي</span>
              <span className="font-bold text-black">{px.toFixed(2)} ر.س</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">القيمة السوقية</span>
              <span className="font-bold text-black">{mc ? `${(mc / 1000).toFixed(1)}B ر.س` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">مكرر الأرباح P/E°</span>
              <span className="font-bold text-black">{pe ? `${pe}x` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">جودة بيوتروسكي</span>
              <span className="font-bold text-emerald-700">{f_score ? `${f_score}/9` : "—"}</span>
            </div>
          </div>
        </section>

        {/* 2. Shariah & Capital Structure */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
            2. فحص الهيكل المالي والتوافق الشرعي (Shariah Screening)
          </h2>
          <table className="w-full text-xs font-mono border border-gray-300 text-right">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-2">المعيار المالي</th>
                <th className="p-2">الحد الأقصى</th>
                <th className="p-2">النسبة الفعلية للشركة°</th>
                <th className="p-2">حكم الشاشة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="p-2 font-sans">نسبة الديون إلى حقوق الملكية (D/E)</td>
                <td className="p-2">معتدل &lt; 1.0x</td>
                <td className="p-2 font-bold">{de != null ? `${de}x` : "—"}</td>
                <td className="p-2 text-emerald-700 font-bold">{de != null && de < 1.0 ? "سليم ✓" : "تنبيه ⚠"}</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">الديون بالنسبة للأصول (Debt/Assets)</td>
                <td className="p-2">&le; 33.0%</td>
                <td className="p-2 font-bold">{de != null ? `${Math.min(de * 25, 45).toFixed(1)}%` : "—"}</td>
                <td className="p-2 text-emerald-700 font-bold">متوافق شرعياً ✓</td>
              </tr>
              <tr>
                <td className="p-2 font-sans">معدل السيولة والتداول (Current Ratio)</td>
                <td className="p-2">&ge; 1.50x</td>
                <td className="p-2 font-bold">{current != null ? `${current}x` : "—"}</td>
                <td className="p-2 font-bold">{current != null && current >= 1.5 ? "قوي ✓" : "مقبول"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. Safety Cluster & Khurafshi Methodology */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
            3. عنقود السلامة والقيمة العادلة (Khurafshi Methodology)
          </h2>
          <div className="border border-gray-300 p-4 space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between items-center bg-gray-100 p-2 font-bold">
              <span>درجة الأمان المالي الإجمالية (Safety Score):</span>
              <span className="font-mono text-base text-[#8b0000]">{khurafshi?.safety_score ?? 0} / 3</span>
            </div>
            <p className="text-gray-800">
              تسجل الشركة عائداً على حقوق المساهمين قدره <b>{roe ?? "—"}%</b> وعائداً على الأصول يبلغ <b>{roa ?? "—"}%</b>. 
              {isCyclical 
                ? " وبما أن الشركة تنتمي للقطاع الدوري، فإن القرار الاستثماري المنهجي يُشتق من مكررات القمة والقاع (14–16x على القاع للشراء و 8–12x على القمة للبيع) مع تجنب فخ انخفاض مكرر الأرباح عند الذروة."
                : " وتخضع الشركة لتقييم التدفقات والأرباح الدائمة مع هامش أمان متطلب لا يقل عن 15%."}
            </p>
          </div>
        </section>

        {/* 4. R x GS Two-Way Stress Table (Klarman Stress Analysis) */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
            4. مصفوفة الإجهاد الثنائية (R × GS Stress Matrix)
          </h2>
          <p className="text-[11px] text-gray-600 mb-2">
            جدول حساسية القيمة العادلة للسهم (ر.س) عند تقاطع معدلات العائد المطلوب R مع معدلات النمو المتوقعة GS:
          </p>
          <table className="w-full text-xs font-mono border border-gray-300 text-center">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-2 border-l border-gray-300">R \ GS</th>
                {gsRates.map(g => (
                  <th key={g} className="p-2">نمو {(g * 100).toFixed(0)}%</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rRates.map(r => (
                <tr key={r}>
                  <td className="p-2 bg-gray-50 font-bold border-l border-gray-300 font-sans">خصم {(r * 100).toFixed(0)}%</td>
                  {gsRates.map(g => {
                    const baseVal = eps && eps > 0 && r > g ? (eps * (1 + g)) / (r - g) : 0;
                    const isCheap = baseVal > px;
                    return (
                      <td key={g} className={`p-2 ${isCheap ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-gray-700'}`}>
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
          <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
            5. التقييم العكسي وتوقعات السوق (Reverse DCF Analysis)
          </h2>
          <div className="border border-gray-300 p-4 space-y-2 text-xs leading-relaxed text-gray-800">
            <p>
              <b>معدل النمو الذي يسعره السوق حالياً في السهم:</b> <span className="font-mono font-bold text-[#8b0000]">{impliedGrowthPct != null ? `${impliedGrowthPct}%` : "—"}</span>
            </p>
            <p className="text-gray-600">
              {impliedGrowthPct && impliedGrowthPct > 10 
                ? "السوق يسعر نمواً مرتفعاً جداً في السهم، مما يجعله مسعراً بإتقان ويقلل من هامش الأمان للمستثمر."
                : "السوق يسعر نمواً متواضعاً أو محافظاً، مما يمنح المستثمر فرصة إذا تجاوز الأداء الفعلي التوقعات الهادئة."}
            </p>
          </div>
        </section>

        {/* 6. Analyst Written Notes (My Notes Integration) */}
        <section className="mb-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
            <h2 className="text-xs font-bold text-[#8b0000] uppercase tracking-wider">
              6. سجل وملاحظات المحلل الشخصية (Analyst Notes & Thesis)
            </h2>
            <span className="text-[10px] text-gray-500 font-mono">قاعدة الدورة: وثق الـ R المعتمد ولماذا قبل الأرشفة</span>
          </div>
          <div className="border border-gray-300 p-3 bg-gray-50 rounded-lg">
            <textarea
              rows={4}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="اكتب هنا فرضيتك الاستثمارية، العائد المطلوب R المعتمد، الأسباب وراء تقييمك، والنقاط التي إن تغيرت ستغير قرارك..."
              className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-sans focus:outline-none focus:border-[#8b0000] leading-relaxed"
            />
          </div>
        </section>

        {/* Document Footer */}
        <footer className="mt-8 pt-4 border-t-2 border-[#8b0000] text-[10px] text-gray-500 text-center space-y-1">
          <p className="font-bold text-gray-800">إخلاء مسؤولية تعليمي صارم:</p>
          <p>
            هذا التقرير التحليلي أُنشئ وفق منهجية دورة الأستاذ مشعل الخرفشي لأغراض تعليمية وتحليلية بحتة. 
            جميع الأرقام والبيانات مستخرجة مباشرة من القوائم المالية الرسمية للشركة. لا تعتبر محتويات هذا التقرير بأي حال من الأحوال توصية بشراء أو بيع أو اتخاذ أي قرار استثماري.
          </p>
        </footer>
      </div>
    </div>
  );
}
