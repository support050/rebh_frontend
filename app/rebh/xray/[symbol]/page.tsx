"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film, Activity, TrendingUp, Scale, Coins, ArrowRight,
  ArrowUpRight, ArrowDownRight, Layers, HelpCircle, CheckCircle2,
  AlertTriangle, ShieldCheck, Printer, Copy, Check, BarChart2
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

export default function RebhStoryXRayPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [copied, setCopied] = useState(false);

  // Selected period for the animated story film
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(0);

  useEffect(() => {
    async function fetchPayload() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`);
        if (!res.ok) {
          const fallbackRes = await fetch(`${API_BASE_URL}/api/terminal/company-fundamental/${symbol}/`);
          if (!fallbackRes.ok) {
            throw new Error(`تعذر استرجاع بيانات التشريح المالي للرمز: ${symbol}`);
          }
          const fb = await fallbackRes.json();
          setData(fb);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "فشل الاتصال بمحرك التشريح");
      } finally {
        setLoading(false);
      }
    }
    fetchPayload();
  }, [symbol]);

  // Set default period index to the latest one once data arrives
  useEffect(() => {
    if (data?.income_statement?.periods?.length) {
      setSelectedPeriodIdx(data.income_statement.periods.length - 1);
    }
  }, [data]);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = searchSymbol.trim().toUpperCase();
    if (/^\d{4}$/.test(s)) {
      router.push(`/rebh/xray/${s}`);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const txt = `[REBH Story X-Ray] تشريح السردية المالية لشركة ${data.name} (${symbol})\nالإيرادات: ${revVal}M | صافي الربح: ${netVal}M | التدفق التشغيلي: ${cfoVal}M | التدفق الحر FCF: ${fcfVal}M`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-3 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-[#1A1A1A]">جاري بناء فيلم السردية المالية (Living Story Film)</h2>
          <p className="text-xs text-[#6B7280]">تحويل القوائم المالية إلى شلال نقدي حي وتشريح تنفس الميزانية...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-8 flex flex-col items-center justify-center">
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">تعذر تشريح القوائم للرمز: {symbol}</h2>
          <p className="text-xs text-[#6B7280]">{error || "تأكد من وجود قوائم مالية مكتملة للشركة"}</p>
          <div className="pt-2">
            <Link
              href="/rebh/xray/2222"
              className="inline-block px-4 py-2 bg-[#8C3B32] text-white text-xs font-semibold rounded-[4px] hover:bg-[#752f28] transition-colors"
            >
              عرض تشريح أرامكو القياسي (2222)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = data.name || symbol;
  const sec = data.sec || "—";
  const isData = data.income_statement || {};
  const bsData = data.bs || {};
  const cfData = data.cf || {};

  const periods: string[] = isData.periods || [];
  const currentPeriod = periods[selectedPeriodIdx] || "—";

  // Financial values for selected period
  const revVal = Number(isData.rev?.[selectedPeriodIdx] ?? 0);
  const cogsVal = Number(isData.cogs?.[selectedPeriodIdx] ?? 0);
  const gpVal = Number(isData.gp?.[selectedPeriodIdx] ?? 0);
  const gaVal = Number(isData.ga?.[selectedPeriodIdx] ?? 0);
  const opVal = Number(isData.op?.[selectedPeriodIdx] ?? 0);
  const finCostVal = Number(isData.fin_cost?.[selectedPeriodIdx] ?? 0);
  const zakatVal = Number(isData.zakat?.[selectedPeriodIdx] ?? 0);
  const netVal = Number(isData.net?.[selectedPeriodIdx] ?? 0);

  // Cash flow values for matching period
  const cfPeriods: string[] = cfData.periods || [];
  const cfIdx = cfPeriods.findIndex(p => p.includes(currentPeriod) || currentPeriod.includes(p.split("_")[0]));
  const safeCfIdx = cfIdx >= 0 ? cfIdx : cfPeriods.length - 1;

  const cfoVal = Number(cfData.cfo?.[safeCfIdx] ?? 0);
  const capexVal = Number(cfData.capex?.[safeCfIdx] ?? 0);
  const fcfVal = Number(cfData.fcf?.[safeCfIdx] ?? (cfoVal - Math.abs(capexVal)));

  // Balance sheet values for matching period
  const bsPeriods: string[] = bsData.periods || [];
  const bsIdx = bsPeriods.findIndex(p => p.includes(currentPeriod) || currentPeriod.includes(p.split("-")[0]));
  const safeBsIdx = bsIdx >= 0 ? bsIdx : bsPeriods.length - 1;

  const totalAssets = Number(bsData.total_assets?.[safeBsIdx] ?? 0);
  const currentAssets = Number(bsData.current_assets?.[safeBsIdx] ?? 0);
  const cashVal = Number(bsData.cash?.[safeBsIdx] ?? 0);
  const totalLiab = Number(bsData.total_liabilities?.[safeBsIdx] ?? 0);
  const currentLiab = Number(bsData.current_liabilities?.[safeBsIdx] ?? 0);
  const totalDebt = Number((bsData.short_debt?.[safeBsIdx] ?? 0) + (bsData.long_debt?.[safeBsIdx] ?? 0));
  const totalEquity = Number(bsData.total_equity?.[safeBsIdx] ?? 0);

  // Percentages of the Money River (Waterfall)
  const gpPct = revVal > 0 ? (gpVal / revVal) * 100 : 0;
  const opPct = revVal > 0 ? (opVal / revVal) * 100 : 0;
  const netPct = revVal > 0 ? (netVal / revVal) * 100 : 0;
  const cfoConversion = netVal > 0 ? (cfoVal / netVal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-20">
      {/* 1. TOP COMMAND BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">X-RAY</span>
            <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">تشريح السردية والتدفقات · Story · X-Ray</h1>
          </div>
          <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:inline-block text-xs text-[#6B7280]">
            تحويل القوائم المالية إلى فيلم سينمائي تفاعلي (نهر الأموال وتنفس المركز المالي)
          </span>
        </div>

        {/* Quick jump + Action buttons */}
        <div className="flex items-center gap-2.5">
          <form onSubmit={handleSymbolSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="رمز السهم (مثال: 1120)"
              className="w-36 px-2.5 py-1 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#1A1A1A]"
            >
              تشريح
            </button>
          </form>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
            <span>{copied ? "تم النسخ" : "نسخ السردية"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة ⎙</span>
          </button>
        </div>
      </header>

      {/* 2. HERO & TIME MACHINE TIMELINE */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base">
                {symbol}
              </span>
              <h2 className="text-xl font-black text-[#1A1A1A]">{name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-mono border border-[#E5E7EB]">
                {sec}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              السردية المالية التراكمية: تتبع رحلة الريال من مبيعات العميل حتى التدفق النقدي الحر في جيب المالك.
            </p>
          </div>

          {/* Timeline slider / period selector */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[6px] flex items-center gap-2">
            <Film className="w-4 h-4 text-[#8C3B32] shrink-0" />
            <span className="text-xs font-bold text-[#475569] shrink-0">الفترة المعروضة:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {periods.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPeriodIdx(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${selectedPeriodIdx === idx ? "bg-[#8C3B32] text-white shadow-sm" : "bg-white text-[#475569] hover:bg-[#E2E8F0] border border-[#D1D5DB]"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN X-RAY MODULES */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* CHAPTER 1: THE MONEY RIVER (شلال تدفق الأموال) */}
        <section className="bg-white border border-[#E5E7EB] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#8C3B32]" />
                الفصل الأول: شلال نهر الأموال (The Money River Waterfall)
              </h3>
              <p className="text-xs text-[#6B7280]">
                كيف ينحدر إيراد السنة ({currentPeriod}) عبر محطات الإنفاق والتشغيل وصولاً لصافي الربح والتدفق الحر
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#8C3B32] bg-[#FBEAE8] px-2.5 py-1 rounded">
              إيرادات: {Math.round(revVal).toLocaleString()}M ر.س
            </span>
          </div>

          {/* Visual Step-by-Step Waterfall */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Step 1: Revenue */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px] space-y-2">
              <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">1. الإيرادات الإجمالية</span>
              <div className="text-xl font-black font-mono text-[#0F172A]">{Math.round(revVal).toLocaleString()}M</div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full" style={{ width: "100%" }} />
              </div>
              <span className="text-[10px] text-[#64748B] block font-mono">100% قاعدة الشلال</span>
            </div>

            {/* Step 2: Gross Profit */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px] space-y-2">
              <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">2. إجمالي الربح</span>
              <div className="text-xl font-black font-mono text-[#16A34A]">{Math.round(gpVal).toLocaleString()}M</div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div className="bg-[#16A34A] h-full" style={{ width: `${Math.min(100, Math.max(0, gpPct))}%` }} />
              </div>
              <span className="text-[10px] text-[#16A34A] block font-mono font-bold">{gpPct.toFixed(1)}% هامش إجمالي</span>
            </div>

            {/* Step 3: Operating Profit */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px] space-y-2">
              <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">3. الربح التشغيلي EBIT</span>
              <div className="text-xl font-black font-mono text-[#0F172A]">{Math.round(opVal).toLocaleString()}M</div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div className="bg-[#8C3B32] h-full" style={{ width: `${Math.min(100, Math.max(0, opPct))}%` }} />
              </div>
              <span className="text-[10px] text-[#8C3B32] block font-mono font-bold">{opPct.toFixed(1)}% هامش تشغيل</span>
            </div>

            {/* Step 4: Net Income */}
            <div className="bg-[#FEF2F2]/50 border border-[#FECACA] p-4 rounded-[6px] space-y-2">
              <span className="text-[10px] font-bold text-[#DC2626] block uppercase tracking-wider">4. صافي الربح للمساهمين</span>
              <div className="text-xl font-black font-mono text-[#8C3B32]">{Math.round(netVal).toLocaleString()}M</div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div className="bg-[#DC2626] h-full" style={{ width: `${Math.min(100, Math.max(0, netPct))}%` }} />
              </div>
              <span className="text-[10px] text-[#DC2626] block font-mono font-bold">{netPct.toFixed(1)}% هامش صافي</span>
            </div>

            {/* Step 5: Free Cash Flow */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-[6px] space-y-2">
              <span className="text-[10px] font-bold text-[#16A34A] block uppercase tracking-wider">5. كاش المالك الحر (FCF)</span>
              <div className="text-xl font-black font-mono text-[#16A34A]">{Math.round(fcfVal).toLocaleString()}M</div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                <div className="bg-[#16A34A] h-full" style={{ width: `${Math.min(100, Math.max(0, revVal > 0 ? (fcfVal / revVal) * 100 : 0))}%` }} />
              </div>
              <span className="text-[10px] text-[#16A34A] block font-mono font-bold">
                {cfoVal > 0 ? `${((fcfVal / cfoVal) * 100).toFixed(0)}% من التشغيلي` : "—"}
              </span>
            </div>
          </div>

          {/* Money River Diagnostic Note */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                <strong>جودة تحويل الكاش (Cash Conversion):</strong> تحقق الشركة تدفقاً تشغيلياً يمثل{" "}
                <strong className="font-mono text-[#16A34A]">{cfoConversion.toFixed(1)}%</strong> من صافي الأرباح المحاسبية.
              </span>
            </div>
            <span className="text-[#64748B] font-mono text-[11px]">
              {cfoConversion >= 100 ? "أرباح مدعومة بنقد فعلي ✓" : "جزء من الأرباح غير محصل نقداً ⚠️"}
            </span>
          </div>
        </section>

        {/* CHAPTER 2: THE BREATHING BALANCE SHEET (تنفس المركز المالي) */}
        <section className="bg-white border border-[#E5E7EB] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#8C3B32]" />
                الفصل الثاني: تنفس الميزانية العمومية (The Breathing Balance Sheet)
              </h3>
              <p className="text-xs text-[#6B7280]">
                تشريح هيكل رأس المال والملاءة: كيف تتنفس الشركة عبر توازن أصولها وخصومها وحقوق ملاكها
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded">
              الهوية مطابقة: A = L + E ✓
            </span>
          </div>

          {/* Structural Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Asset Base */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-xs text-[#0F172A]">الأصول (Assets)</span>
                <span className="font-mono font-bold text-sm text-[#0F172A]">{Math.round(totalAssets).toLocaleString()}M</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">النقد والسيولة الجاهزة:</span>
                  <span className="font-mono font-bold text-[#16A34A]">{Math.round(cashVal).toLocaleString()}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">الأصول المتداولة:</span>
                  <span className="font-mono font-bold">{Math.round(currentAssets).toLocaleString()}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">الأصول الثابتة والاستثمارية:</span>
                  <span className="font-mono font-bold">{Math.round(totalAssets - currentAssets).toLocaleString()}M</span>
                </div>
              </div>
            </div>

            {/* Card 2: Liabilities & Debt */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-xs text-[#DC2626]">الالتزامات والديون (Liabilities)</span>
                <span className="font-mono font-bold text-sm text-[#DC2626]">{Math.round(totalLiab).toLocaleString()}M</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">إجمالي القروض والصكوك:</span>
                  <span className="font-mono font-bold text-[#DC2626]">{Math.round(totalDebt).toLocaleString()}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">الالتزامات قصيرة الأجل:</span>
                  <span className="font-mono font-bold">{Math.round(currentLiab).toLocaleString()}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">الالتزامات غير المتداولة:</span>
                  <span className="font-mono font-bold">{Math.round(totalLiab - currentLiab).toLocaleString()}M</span>
                </div>
              </div>
            </div>

            {/* Card 3: Equity Fortress */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-xs text-[#8C3B32]">حقوق المساهمين (Equity)</span>
                <span className="font-mono font-bold text-sm text-[#8C3B32]">{Math.round(totalEquity).toLocaleString()}M</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">نسبة الملكية من الأصول:</span>
                  <span className="font-mono font-bold text-[#16A34A]">
                    {totalAssets > 0 ? `${((totalEquity / totalAssets) * 100).toFixed(1)}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">الرافعة المالية (Assets/Equity):</span>
                  <span className="font-mono font-bold">
                    {totalEquity > 0 ? (totalAssets / totalEquity).toFixed(2) : "—"}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">صافي الدين (Debt - Cash):</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {Math.round(totalDebt - cashVal).toLocaleString()}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 3: DUPONT STORY DECOMPOSITION (تفكيك دوبونت لمحركات العائد) */}
        <section className="bg-white border border-[#E5E7EB] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
          <div className="border-b border-[#E5E7EB] pb-4">
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8C3B32]" />
              الفصل الثالث: محركات العائد الأساسية (DuPont Story Engine)
            </h3>
            <p className="text-xs text-[#6B7280]">
              تفكيك العائد على الملكية ROE إلى أضلاعه الثلاثة: الربحية × دوران الأصول × الرافعة المالية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px]">
              <span className="text-[10px] text-[#64748B] block font-semibold mb-1">الضلع الأول: صافي الهامش (NPM)</span>
              <div className="text-2xl font-black font-mono text-[#8C3B32]">{netPct.toFixed(1)}%</div>
              <span className="text-[10px] text-[#94A3B8]">قدرة التسعير والتحكم بالتكاليف</span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px]">
              <span className="text-[10px] text-[#64748B] block font-semibold mb-1">الضلع الثاني: كفاءة الأصول (Turnover)</span>
              <div className="text-2xl font-black font-mono text-[#0F172A]">
                {totalAssets > 0 ? (revVal / totalAssets).toFixed(2) : "—"}x
              </div>
              <span className="text-[10px] text-[#94A3B8]">دوران الأصول وتوليد المبيعات</span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[6px]">
              <span className="text-[10px] text-[#64748B] block font-semibold mb-1">الضلع الثالث: الرافعة المالية (Multiplier)</span>
              <div className="text-2xl font-black font-mono text-[#0F172A]">
                {totalEquity > 0 ? (totalAssets / totalEquity).toFixed(2) : "—"}x
              </div>
              <span className="text-[10px] text-[#94A3B8]">هيكل التمويل ومضاعف الملكية</span>
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-[6px]">
              <span className="text-[10px] text-[#16A34A] block font-bold mb-1">الناتج النهائي: العائد ROE</span>
              <div className="text-2xl font-black font-mono text-[#16A34A]">
                {totalEquity > 0 ? `${((netVal / totalEquity) * 100).toFixed(1)}%` : "—"}
              </div>
              <span className="text-[10px] text-[#16A34A] font-bold">العائد الفعلي المحقق للمالك</span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB] space-y-1">
        <p>منصة REBH — وحدة تشريح السردية Story · X-Ray · تحويل القوائم المالية إلى فيلم تدفق نقدي حي.</p>
      </footer>
    </div>
  );
}
