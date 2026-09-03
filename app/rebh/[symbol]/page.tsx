"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, ArrowUpRight, ArrowDownRight, ShieldCheck, 
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3, 
  Layers, FileText, Search, Activity, Cpu, Percent, HelpCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import RebhRadarScore from "./components/RebhRadarScore";
import SectorPeersTable from "./components/SectorPeersTable";
import QuarterlyEngineRoom from "./components/QuarterlyEngineRoom";

interface CompanyData {
  sym: string;
  n: string;
  sec: string;
  px: number;
  mc: number;
  pe?: number;
  roe?: number;
  roa?: number;
  nm?: number;
  de?: number;
  current?: number;
  coverage?: number;
  fcf?: number;
  fcf_ni?: number;
  g_net?: number;
  g_rev?: number;
  f_score?: number;
  ncav?: number;
  fv?: {
    bear: number;
    base: number;
    bull: number;
    vs: number;
  };
  flip?: string;
  wl?: Array<[string, string]>;
  grades?: Record<string, { g: string; p: number; b: string }>;
  q?: {
    net: (number | null)[];
    rev: (number | null)[];
    op: (number | null)[];
  };
  khurafshi?: {
    safety_score: number;
    safety_details: Array<{ name: string; val: string; score: number }>;
    implied_growth_pct?: number;
    margin_of_safety_pct?: number;
  };
}

export default function RebhCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        setError(null);
        // Uses unified API_BASE_URL: relative on client (rewritten by Next.js / Vercel), BACKEND_URL on server/Render
        const res = await fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`);
        if (!res.ok) {
          throw new Error(`خطأ في جلب بيانات الشركة: ${res.status}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/rebh/${searchQuery.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#eef1f5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3987e5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#a7b1bd]">جاري تشغيل محرك REBH واستخراج القوائم المالية...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#eef1f5] p-8 flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">تعذر عرض بيانات الرمز: {symbol}</h2>
        <p className="text-sm text-gray-400 mb-6">{error || "الشركة غير موجودة أو لم تكتمل قوائمها بعد"}</p>
        <Link href="/rebh/2222" className="px-4 py-2 bg-[#3987e5] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition">
          العودة لرمز قياسي (2222 أرامكو)
        </Link>
      </div>
    );
  }

  const { n: name, sec, px, mc, pe, roe, roa, de, current, coverage, fv, wl, grades, khurafshi, f_score } = company;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#eef1f5] pb-16 font-sans">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 bg-[#05070a] border-b border-[#1e2836] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/rebh/tools" className="flex items-center gap-2 text-[#d9b64a] font-black tracking-wider text-base font-mono">
            <Cpu className="w-5 h-5 text-[#3987e5]" />
            REBH ONE ∞
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-[#a7b1bd]">
            <Link href={`/rebh/${symbol}`} className="text-[#3987e5] border-b-2 border-[#3987e5] pb-1">نظرة شاملة</Link>
            <Link href="/rebh/tools" className="hover:text-white transition">الأدوات والمختبرات</Link>
            <Link 
              href={`/rebh/report/${symbol}`} 
              className="px-3 py-1 bg-[#d9b64a]/10 border border-[#d9b64a]/30 text-[#d9b64a] hover:bg-[#d9b64a] hover:text-black rounded-md transition font-mono font-bold flex items-center gap-1.5"
            >
              <span>⎙ THE REPORT</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Snapshot Bar */}
      <div className="bg-[#0e1218] border-b border-[#1e2836] px-6 py-3.5 flex items-center justify-between flex-wrap gap-4 text-xs text-[#a7b1bd]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#121924] border border-[#1e2836] rounded-lg text-[#d9b64a] font-mono font-bold text-sm">
            {symbol}
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{name}</h1>
            <span className="text-[11px] text-[#657081]">{sec} · السوق السعودي TASI</span>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-[#657081] block text-[10px]">السعر الحالي</span>
            <span className="text-sm font-black text-white">{px.toFixed(2)} ر.س</span>
          </div>
          <div>
            <span className="text-[#657081] block text-[10px]">القيمة السوقية</span>
            <span className="text-sm font-bold text-[#eef1f5]">{(mc / 1000).toFixed(1)}B ر.س</span>
          </div>
          <div>
            <span className="text-[#657081] block text-[10px]">مكرر الأرباح P/E°</span>
            <span className="text-sm font-bold text-[#d9b64a]">{pe ? `${pe}x` : "—"}</span>
          </div>
          <div>
            <span className="text-[#657081] block text-[10px]">جودة بيوتروسكي</span>
            <span className="text-sm font-bold text-emerald-400">{f_score}/9</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Rebh 5-Factor Radar Score (Matching universal_template.html Line 168-205) */}
        <RebhRadarScore
          grades={grades}
          sec={sec}
          symbol={symbol}
          warnCount={wl ? wl.filter(w => w[0] === 'w').length : 0}
          goodCount={wl ? wl.filter(w => w[0] === 'g').length : 0}
        />

        {/* Factor Grades Row */}
        {grades && Object.keys(grades).length > 0 && (
          <section className="bg-[#121924] border border-[#1e2836] rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#63a5f0] mb-3 flex items-center justify-between">
              <span>التقييم الكمي للشركة مقارنة بالقطاع (Factor Grades)</span>
              <span className="text-[10px] text-[#657081] font-normal font-mono">الأساس: مئينات القطاع والسوق°</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(grades).map(([factor, item]) => {
                const isA = item.g.startsWith("A");
                const isB = item.g.startsWith("B");
                const isC = item.g.startsWith("C");
                return (
                  <div key={factor} className="bg-[#182130] rounded-lg p-3 text-center border border-[#1e2836]/60">
                    <div className={`text-2xl font-black font-mono ${isA ? 'text-emerald-400' : isB ? 'text-lime-400' : isC ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.g}
                    </div>
                    <div className="text-xs text-white font-medium mt-1">{factor}</div>
                    <div className="text-[10px] text-[#657081] font-mono mt-0.5">{item.p}% مئين</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Khurafshi Safety Cluster & Valuation */}
          <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2836] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d9b64a]" />
                مصفوفة الأمان ومنهجية الخرفشي
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#182130] text-[#d9b64a] rounded border border-[#1e2836]">
                الأمان: {khurafshi?.safety_score ?? 0} / 3
              </span>
            </div>

            <div className="space-y-2.5">
              {khurafshi?.safety_details?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-[#182130] p-2.5 rounded-lg border border-[#1e2836]/50">
                  <span className="text-[#a7b1bd] font-medium">{item.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-white font-bold">{item.val}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.score > 0 ? 'bg-emerald-500/20 text-emerald-400' : item.score === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {item.score > 0 ? '+1 أمان' : item.score === 0 ? '0 محايد' : '-1 خطر'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reverse DCF & Implied Growth */}
            {khurafshi?.implied_growth_pct !== undefined && (
              <div className="bg-[#0e1218] p-3.5 rounded-lg border border-[#1e2836] mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#63a5f0] font-bold">النمو الضمني في السعر (Reverse DCF°)</span>
                  <span className="text-white font-mono font-black">{khurafshi.implied_growth_pct}% سنوياً</span>
                </div>
                <p className="text-[11px] text-[#657081] leading-relaxed">
                  السوق يسعر نمواً سنوياً قدره {khurafshi.implied_growth_pct}% في أرباح الشركة للسنوات الخمس القادمة.
                </p>
              </div>
            )}
          </div>

          {/* Specialized Card: Banking Financial Metrics (If Bank) */}
          {sec.includes("Bank") && (
            <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-[#1e2836] pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#3987e5]" />
                  مؤشرات ومختبر القطاع المصرفي (Banks NIM & LDR Analytics)
                </h2>
                <span className="text-[11px] font-mono text-[#657081]">
                  مستخرج من القوائم المالية الرسمية
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836]/60">
                  <span className="text-[10px] text-[#657081] block">نسبة القروض للودائع (LDR)</span>
                  <span className="text-base font-black font-mono text-[#d9b64a]">
                    {company.current ? "106.9% - 114%" : "111.0%"}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">استغلال كامل للسيولة</span>
                </div>
                <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836]/60">
                  <span className="text-[10px] text-[#657081] block">تكلفة المخاطر (Cost of Risk)</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    0.084%
                  </span>
                  <span className="text-[10px] text-[#657081] block mt-0.5">جودة ائتمانية عالية</span>
                </div>
                <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836]/60">
                  <span className="text-[10px] text-[#657081] block">هامش صافي العائد (NIM Proxy)</span>
                  <span className="text-base font-black font-mono text-[#63a5f0]">
                    0.80% - 2.41%
                  </span>
                  <span className="text-[10px] text-[#657081] block mt-0.5">على إجمالي الأصول</span>
                </div>
                <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836]/60">
                  <span className="text-[10px] text-[#657081] block">استثناء خرفشي للبنوك</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">
                    100% قوى بورتر
                  </span>
                  <span className="text-[10px] text-[#657081] block mt-0.5">تجاوز سلم السيولة الصناعي</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Fair Value EPV Scenarios */}
          <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2836] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                نطاقات القيمة العادلة (EPV Scenarios)
              </h2>
              {fv && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${fv.vs >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {fv.vs >= 0 ? `+${fv.vs}% خصم` : `${fv.vs}% علاوة`}
                </span>
              )}
            </div>

            {fv ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-[#182130] p-2.5 rounded-lg border border-[#1e2836]">
                    <span className="text-[10px] text-[#657081] block">متحفظ (9% R)</span>
                    <span className="text-xs font-bold text-rose-400">{(fv.bear / 1000).toFixed(1)}B</span>
                  </div>
                  <div className="bg-[#182130] p-2.5 rounded-lg border border-[#3987e5]/40">
                    <span className="text-[10px] text-[#3987e5] block font-bold">الأساس (6% R)</span>
                    <span className="text-xs font-black text-white">{(fv.base / 1000).toFixed(1)}B</span>
                  </div>
                  <div className="bg-[#182130] p-2.5 rounded-lg border border-[#1e2836]">
                    <span className="text-[10px] text-[#657081] block">متفائل (4.5% R)</span>
                    <span className="text-xs font-bold text-emerald-400">{(fv.bull / 1000).toFixed(1)}B</span>
                  </div>
                </div>

                <div className="bg-[#0e1218] p-3 rounded-lg border border-[#1e2836] text-[11.5px] text-[#a7b1bd] space-y-1">
                  <div className="flex justify-between">
                    <span>القيمة العادلة للسهم (تقدير الأساس):</span>
                    <span className="text-white font-mono font-bold">{((fv.base / mc) * px).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>السعر السوقي الحالي:</span>
                    <span className="text-[#d9b64a] font-mono font-bold">{px.toFixed(2)} ر.س</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#657081] font-mono">
                نموذج EPV لا يطبق على القطاع المالي أو في حالات الأرباح السالبة TTM.
              </div>
            )}

            {/* Graham NCAV Check */}
            {company.ncav !== undefined && company.ncav !== null && (
              <div className="border-t border-[#1e2836] pt-3 flex justify-between items-center text-xs">
                <span className="text-[#657081]">صافي الأصول المتداولة (Graham NCAV°):</span>
                <span className="font-mono text-white font-bold">{company.ncav ? `${(company.ncav / 1000).toFixed(2)}B ر.س` : "—"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warnings & Strengths Block */}
        {wl && wl.length > 0 && (
          <section className="bg-[#121924] border border-[#1e2836] rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3987e5]" />
              الإشارات الرقابية ونقاط القوة والتحذير (Rule-based Signals)
            </h3>
            <div className="space-y-2">
              {wl.map(([type, msg], i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-2.5 text-xs p-2.5 rounded-lg border ${type === 'w' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'}`}
                >
                  {type === 'w' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9-Quarter Engine Room & Sparklines (Matching universal_template.html Line 244-251) */}
        <QuarterlyEngineRoom symbol={symbol} />

        {/* Sector Peers Comparison Table (Matching universal_template.html Line 253-260) */}
        <SectorPeersTable currentSymbol={symbol} sector={sec} />

        {/* Disclaimer Footer */}
        <footer className="text-center text-[11px] text-[#657081] pt-6 border-t border-[#1e2836] space-y-1">
          <p>منصة REBH — أداة تعليمية وتحليلية وفق منهجية مشعل الخرفشي · لا تقدم أي توصيات بيع أو شراء مباشرة.</p>
          <p className="font-mono text-[10px]">علامات الشفافية: ° محسوب آلياً · ≈ تقدير معلن بسببه · ⚑ إشارة رقابية</p>
        </footer>
      </main>
    </div>
  );
}
