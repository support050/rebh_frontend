"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Search, Droplets, Flame, Anchor, Zap, Wind, BarChart3, Loader2, ArrowLeft
} from "lucide-react";

interface QuickSymbol {
  sym: string;
  name: string;
  sec: string;
}

const QUICK_SYMBOLS: QuickSymbol[] = [
  { sym: "2222", name: "أرامكو السعودية", sec: "طاقة" },
  { sym: "1120", name: "الراجحي", sec: "بنوك" },
  { sym: "2010", name: "سابك", sec: "بتروكيماويات" },
  { sym: "7010", name: "STC", sec: "اتصالات" },
  { sym: "1180", name: "الأهلي", sec: "بنوك" },
  { sym: "4030", name: "دار الأركان", sec: "عقارات" },
  { sym: "2380", name: "بترو رابغ", sec: "طاقة" },
  { sym: "4200", name: "الأندلس", sec: "تجزئة" },
];

const WHAT_INSIDE = [
  { icon: <Droplets size={16} />, title: "قصة التدفق النقدي", desc: "FCF · CFO/NI · مرحلة التوسع أو الانكماش" },
  { icon: <Flame size={16} />, title: "قصة الهوامش", desc: "ضغط التسعير · انضغاط الإجمالي/التشغيلي/الصافي" },
  { icon: <Anchor size={16} />, title: "قصة الديون والرافعة", desc: "D/E · تغطية الفائدة · جدول الاستحقاق" },
  { icon: <Zap size={16} />, title: "قصة جودة الأرباح", desc: "Piotroski · Beneish · CFO/NI مقابل الأرباح" },
  { icon: <Wind size={16} />, title: "قصة التمويل والتوزيعات", desc: "CFF · إعادة الكاش للمساهمين · اقتراض جديد" },
  { icon: <BarChart3 size={16} />, title: "لوحة البيانات المرئية", desc: "نهر المال · تنفّس الميزانية · دورة التحويل النقدي" },
];

// Unified Card Shell styling
const CARD_SHELL = "bg-white border border-[#E5E7EB] rounded-[8px] transition-all";
const FOCUS_RING = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32] focus-visible:ring-offset-2";

/**
 * Normalizes any raw symbol input strictly to 4 numeric digits.
 */
function normalizeSymbol(raw: string): string {
  return (raw || "").trim().replace(/\D/g, "").slice(0, 4);
}

export default function RebhXRayLandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [targetSymbol, setTargetSymbol] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const navigateToSymbol = (rawSym: string) => {
    const clean = normalizeSymbol(rawSym);
    if (clean.length !== 4) {
      setInputError("يرجى إدخال رمز شركة سعودية مكون من 4 أرقام (مثال: 2222 أو 1120)");
      return;
    }
    setInputError(null);
    setTargetSymbol(clean);
    startTransition(() => {
      router.push(`/rebh/xray/${clean}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSymbol(input);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setInput(val);
    if (inputError && val.length === 4) {
      setInputError(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-24">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">
            X-RAY
          </span>
          <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">
            قصة الشركة المالية · X-Ray
          </h1>
          <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:inline-block text-xs text-[#6B7280]">
            القصة المالية مُشتقة آلياً من الأرقام — لا نصوص مكتوبة يدوياً
          </span>
        </div>

        {/* Global Honesty Mark */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6B7280] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[4px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>° استخراج جنائي مباشر</span>
        </div>
      </header>

      {/* ── Main Container (max-w-7xl aligned with detail view) ──────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Search & Intro Panel */}
        <section className={`${CARD_SHELL} p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-5 max-w-3xl mx-auto`}>
          <div>
            <span className="text-[11px] font-bold text-[#8C3B32] uppercase tracking-wider block mb-1">
              مختبر الفحص المالي المعمق
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight">
              تشريح القصة المالية لأي شركة سعودية مُدرجة
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 leading-relaxed">
              يُولِّد محرك REBH قصة مالية متكاملة من القوائم الحقيقية — شلال نهر المال · تنفّس الميزانية · ضغط الهوامش · الرافعة والديون · واختبارات التلاعب بجودة الأرباح.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="أدخل رمز الشركة (مثال: 2222 أو 1120)"
                  disabled={isPending}
                  className={`w-full pr-10 pl-3 py-3 text-sm border rounded-[6px] outline-none font-mono tabular-nums text-center bg-[#F9FAFB] transition-all ${
                    inputError
                      ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                      : "border-[#D1D5DB] focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10"
                  }`}
                  aria-label="رمز الشركة"
                />
              </div>

              <button
                type="submit"
                disabled={input.length !== 4 || isPending}
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-40 disabled:hover:bg-[#8C3B32] text-white rounded-[6px] text-sm font-bold shadow-sm transition-all ${FOCUS_RING}`}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري التشغيل ({targetSymbol})…</span>
                  </>
                ) : (
                  <>
                    <Activity size={16} />
                    <span>تشريح السهم بالأشعة</span>
                  </>
                )}
              </button>
            </div>

            {inputError && (
              <p className="text-xs text-[#DC2626] font-semibold pt-1">
                {inputError}
              </p>
            )}
          </form>
        </section>

        {/* Quick Access Symbols */}
        <section className="space-y-3.5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
              <Activity size={16} className="text-[#8C3B32]" />
              شركات قيادية نموذجية (وصول سريع)
            </h3>
            <span className="text-[10px] text-[#9CA3AF] font-mono">
              عينة استرشادية منتقاة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            {QUICK_SYMBOLS.map((s) => {
              const isLoadingThis = isPending && targetSymbol === s.sym;
              return (
                <button
                  key={s.sym}
                  onClick={() => navigateToSymbol(s.sym)}
                  disabled={isPending}
                  className={`${CARD_SHELL} p-4 text-right hover:border-[#8C3B32] hover:shadow-sm group relative ${FOCUS_RING} ${
                    isLoadingThis ? "border-[#8C3B32] bg-[#FFF5F4]" : "hover:bg-[#FDFBFB]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono tabular-nums font-black text-[#8C3B32] text-lg">
                      {s.sym}
                    </span>
                    {isLoadingThis ? (
                      <Loader2 size={14} className="animate-spin text-[#8C3B32]" />
                    ) : (
                      <ArrowLeft size={13} className="text-[#9CA3AF] group-hover:text-[#8C3B32] group-hover:-translate-x-0.5 transition-all" />
                    )}
                  </div>
                  <span className="block text-xs font-bold text-[#0F172A] truncate">
                    {s.name}
                  </span>
                  <span className="block text-[11px] text-[#64748B] mt-0.5">
                    {s.sec}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* What's Inside Section */}
        <section className="space-y-3.5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
              <Droplets size={16} className="text-[#8C3B32]" />
              محاور التشريح المالي بالتقرير
            </h3>
            <span className="text-[10px] text-[#9CA3AF] font-mono">
              6 قصص مالية مربوطة بالصيغ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {WHAT_INSIDE.map((w, i) => (
              <div
                key={i}
                className={`${CARD_SHELL} p-4 flex items-start gap-3 hover:border-[#8C3B32]/50 hover:shadow-sm`}
              >
                <span className="shrink-0 w-9 h-9 rounded-[8px] bg-[#FFF1EF] border border-[#FECACA] flex items-center justify-center text-[#8C3B32]">
                  {w.icon}
                </span>
                <div>
                  <span className="block text-xs font-bold text-[#0F172A]">
                    {w.title}
                  </span>
                  <span className="block text-[11.5px] text-[#64748B] mt-1 leading-relaxed">
                    {w.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="text-center text-[11px] text-[#9CA3AF] pt-8 border-t border-[#E5E7EB] max-w-5xl mx-auto">
        منصة REBH — Story &amp; X-Ray Engine · القصة المالية مشتقة آلياً بالكامل من القوائم المحاسبية المنشورة
      </footer>
    </div>
  );
}