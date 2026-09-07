"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, BarChart3, TrendingUp, Search, Sparkles,
  ArrowRight, Activity, CandlestickChart, Layers
} from "lucide-react";

const QUICK_SYMBOLS = [
  { sym: "2222", name: "أرامكو السعودية", sec: "طاقة" },
  { sym: "1120", name: "الراجحي", sec: "بنوك" },
  { sym: "2010", name: "سابك", sec: "بتروكيماويات" },
  { sym: "7010", name: "STC", sec: "اتصالات" },
  { sym: "1180", name: "الأهلي", sec: "بنوك" },
  { sym: "4030", name: "دار الأركان", sec: "عقارات" },
  { sym: "2380", name: "بترو رابغ", sec: "طاقة" },
  { sym: "4200", name: "الأندلس", sec: "تجزئة" },
];

const PRESETS = [
  {
    id: "profitability_divergence",
    label: "تباعد الربحية والكاش (NI vs CFO)",
    icon: <Activity size={14} />,
    desc: "هل الأرباح المحاسبية تُترجم إلى كاش حقيقي؟",
    params: "?preset=profitability_divergence"
  },
  {
    id: "revenue_margin_health",
    label: "صحة الإيراد وهوامش الربح الربعية",
    icon: <BarChart3 size={14} />,
    desc: "مسار الإيرادات وهوامش الربح الإجمالي فصلاً بفصل",
    params: "?preset=revenue_margin_health"
  },
  {
    id: "fcf_conversion",
    label: "FCF مقابل CapEx (كاش المالك)",
    icon: <Layers size={14} />,
    desc: "التدفق الحر الحقيقي بعد خصم الإنفاق الرأسمالي",
    params: "?preset=fcf_conversion"
  },
  {
    id: "price_trend",
    label: "مسار السعر مع SMA-20 والحجم",
    icon: <CandlestickChart size={14} />,
    desc: "تحليل حركة السعر اليومي مع متوسط متحرك 20 يوم",
    params: "?preset=price_trend"
  },
  {
    id: "balance_strength",
    label: "قوة الميزانية — ROE / ROIC / صافي الدين",
    icon: <TrendingUp size={14} />,
    desc: "عوائد التوظيف ومستوى الدين عبر السنوات",
    params: "?preset=balance_strength"
  },
  {
    id: "valuation_bands",
    label: "نطاقات التقييم — PE / PB / عائد التوزيعات",
    icon: <Sparkles size={14} />,
    desc: "مضاعفات التقييم الحالية مقارنةً بالمتوسط التاريخي",
    params: "?preset=valuation_bands"
  },
];

export default function RebhStudioLandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const go = (sym: string, extra = "") => {
    router.push(`/rebh/studio/${sym.trim().toUpperCase()}${extra}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) go(s);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">
          STUDIO PRO
        </span>
        <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">
          استوديو الرسوم التفاعلي · Chart Studio
        </h1>
        <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
        <span className="hidden sm:inline-block text-xs text-[#6B7280]">
          ارسم أي بند مالي · قارن بين المقاييس · تحليل السعر والقوائم معاً
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* SEARCH */}
        <section className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
          <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">
            ابدأ برسم بيانات أي شركة سعودية مدرجة
          </h2>
          <p className="text-xs text-[#6B7280]">
            أدخل رمز السهم (4 أرقام) لفتح الاستوديو الكامل — اختر البند المالي، نوع الرسم، والفترة الزمنية.
          </p>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
                placeholder="مثال: 2222 أو 1120"
                className="w-full pr-8 pl-3 py-2.5 text-sm border border-[#D1D5DB] rounded-[6px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]"
              />
            </div>
            <button
              type="submit"
              disabled={input.length !== 4}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-40 text-white rounded-[6px] text-sm font-bold shadow-sm transition-colors"
            >
              <LineChart size={14} />
              فتح الاستوديو
            </button>
          </form>
        </section>

        {/* QUICK ACCESS */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
            <Activity size={15} className="text-[#8C3B32]" />
            وصول سريع — أبرز الأسهم
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_SYMBOLS.map((s) => (
              <button
                key={s.sym}
                onClick={() => go(s.sym)}
                className="bg-white border border-[#E5E7EB] rounded-[6px] p-3.5 text-right hover:border-[#8C3B32] hover:shadow-sm transition-all group"
              >
                <span className="block font-mono font-black text-[#8C3B32] text-base">
                  {s.sym}
                </span>
                <span className="block text-xs font-semibold text-[#0F172A] mt-0.5 truncate">
                  {s.name}
                </span>
                <span className="block text-[10px] text-[#64748B] mt-0.5">{s.sec}</span>
              </button>
            ))}
          </div>
        </section>

        {/* PRESET TEMPLATES */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
            <Sparkles size={15} className="text-[#8C3B32]" />
            قوالب التحليل الجاهزة — ابدأ بالسؤال لا بالرسمة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => go("2222", p.params)}
                className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 text-right hover:border-[#8C3B32] hover:shadow-sm transition-all group flex items-start gap-3"
              >
                <span className="shrink-0 w-8 h-8 rounded-[6px] bg-[#FFF1EF] border border-[#FECACA] flex items-center justify-center text-[#8C3B32] mt-0.5">
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#0F172A]">{p.label}</span>
                  <span className="block text-[11px] text-[#64748B] mt-0.5">{p.desc}</span>
                </div>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-[#CBD5E1] group-hover:text-[#8C3B32] mt-1 transition-colors rotate-180"
                />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#9CA3AF] text-center">
            القوالب تفتح أرامكو 2222 — يمكنك تغيير الرمز بعد الفتح من شريط البحث.
          </p>
        </section>
      </main>
    </div>
  );
}
