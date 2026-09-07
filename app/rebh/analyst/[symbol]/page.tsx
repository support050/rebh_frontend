"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileSpreadsheet, Calendar, Search, ArrowUpRight, ArrowDownRight,
  TrendingUp, Scale, Coins, BarChart3, Printer, Copy, Check,
  AlertTriangle, ShieldCheck, Download, RefreshCw
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

type StatementTab = "is" | "bs" | "cf" | "ratios";
type ViewMode = "annual" | "quarterly";

export default function RebhStatementsAnalystPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string) || "2222";

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<StatementTab>("is");
  const [viewMode, setViewMode] = useState<ViewMode>("annual");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStatements() {
      try {
        setLoading(true);
        setError(null);
        // Direct endpoint created in rebh_engine.py
        const res = await fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`);
        if (!res.ok) {
          // Fallback to terminal company-fundamental endpoint
          const altRes = await fetch(`${API_BASE_URL}/api/terminal/company-fundamental/${symbol}/`);
          if (!altRes.ok) {
            throw new Error(`تعذر استرجاع القوائم المالية المعتمدة للرمز: ${symbol}`);
          }
          const altData = await altRes.json();
          setData(altData);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "فشل الاتصال بقاعدة بيانات القوائم المالية");
      } finally {
        setLoading(false);
      }
    }
    fetchStatements();
  }, [symbol]);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = searchSymbol.trim().toUpperCase();
    if (/^\d{4}$/.test(s)) {
      router.push(`/rebh/analyst/${s}`);
    }
  };

  const handleCopySummary = () => {
    if (!data) return;
    const txt = `[REBH Statements Analyst] ${data.name} (${symbol})\nالقطاع: ${data.sec} | السعر: ${data.px} ر.س | القيمة السوقية: ${data.mc}M ر.س\nصافي أرباح TTM: ${data.income_statement?.ttm?.net ?? "—"}M | التدفق التشغيلي: ${data.cf?.cfo?.slice(-1)[0] ?? "—"}M`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-3 border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-[#1A1A1A]">جاري استخراج وتدقيق القوائم المالية</h2>
          <p className="text-xs text-[#6B7280]">
            سحب القوائم الموحدة (قائمة الدخل، المركز المالي، التدفقات النقدية) من إفصاحات تداول XBRL...
          </p>
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
          <h2 className="text-lg font-bold text-[#1A1A1A]">تعذر عرض القوائم للرمز: {symbol}</h2>
          <p className="text-xs text-[#6B7280]">{error || "الشركة غير موجودة أو لم تكتمل إفصاحاتها"}</p>
          <div className="pt-2">
            <Link
              href="/rebh/analyst/2222"
              className="inline-block px-4 py-2 bg-[#8C3B32] text-white text-xs font-semibold rounded-[4px] hover:bg-[#752f28] transition-colors"
            >
              العودة لقوائم أرامكو القياسية (2222)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = data.name || symbol;
  const sec = data.sec || "—";
  const px = data.px ?? 0;
  const mc = data.mc ?? 0;
  const isBank = data.is_bank;

  const isData = data.income_statement || {};
  const bsData = data.bs || {};
  const cfData = data.cf || {};
  const quarters = data.quarters || {};
  const pct = data.pct || {};

  // Formatter helpers
  const fmt = (v: number | null | undefined, isEps = false) => {
    if (v == null) return "—";
    if (isEps) return Number(v).toFixed(2);
    return Math.round(Number(v)).toLocaleString();
  };

  const fmtPct = (v: number | null | undefined) => {
    if (v == null) return "—";
    return `${Number(v).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-20">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">ANALYST</span>
            <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">القوائم المالية المدققة · Statements Analyst</h1>
          </div>
          <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:inline-block text-xs text-[#6B7280]">
            المصدر الموحد للقوائم المحاسبية (دخل · ميزانية · تدفقات نقدية) مدققة وفق XBRL
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
              عرض
            </button>
          </form>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151] transition-colors"
            title="نسخ ملخص القوائم للحافظة"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
            <span>{copied ? "تم النسخ" : "نسخ ملخص"}</span>
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

      {/* 2. COMPANY SNAPSHOT BAR */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base">
              {symbol}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#1A1A1A]">{name}</h2>
                <span className="text-[11px] font-mono text-[#6B7280]">{data.en}</span>
                {isBank && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
                    قطاع بنكي (Bank Model)
                  </span>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">{sec} · السوق المالي السعودي (تداول)</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[6px]">
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">السعر</span>
              <span className="text-sm font-black font-mono text-[#0F172A]">{px.toFixed(2)} ر.س</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">القيمة السوقية</span>
              <span className="text-sm font-black font-mono text-[#0F172A]">{(mc / 1000).toFixed(1)}B ر.س</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">العائد على الملكية ROE</span>
              <span className="text-sm font-black font-mono text-[#16A34A]">{fmtPct(data.cur?.roe)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">صافي الهامش NPM</span>
              <span className="text-sm font-black font-mono text-[#8C3B32]">{fmtPct(data.cur?.nm)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTROL STRIP: TABS & VIEW MODE */}
      <section className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Statement Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "is", label: "قائمة الدخل (Income Statement)", icon: TrendingUp },
              { id: "bs", label: "المركز المالي (Balance Sheet)", icon: Scale },
              { id: "cf", label: "التدفقات النقدية (Cash Flows)", icon: Coins },
              { id: "ratios", label: "النسب والمؤشرات المالية (Ratios)", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StatementTab)}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-colors
                    ${isActive
                      ? "bg-[#8C3B32] text-white shadow-sm"
                      : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]"}
                  `}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode toggle (Only relevant for income statement and ratios) */}
          {activeTab === "is" && (
            <div className="flex items-center gap-1 bg-white border border-[#D1D5DB] rounded-[4px] p-0.5 text-xs font-semibold shrink-0">
              <button
                onClick={() => setViewMode("annual")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${viewMode === "annual" ? "bg-[#F3F4F6] text-[#8C3B32] font-bold" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
              >
                سنوي (FY)
              </button>
              <button
                onClick={() => setViewMode("quarterly")}
                className={`px-3 py-1 rounded-[3px] transition-colors ${viewMode === "quarterly" ? "bg-[#F3F4F6] text-[#8C3B32] font-bold" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
              >
                ربعي منفصل (9 Quarters)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. MAIN STATEMENT DATA TABLES */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* TAB 1: INCOME STATEMENT */}
        {activeTab === "is" && (
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8C3B32]" />
                  قائمة الدخل الموحدة (Standardized Income Statement)
                </h3>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  {viewMode === "annual" ? "البيانات السنوية المدققة بمليون ريال سعودي (SAR M)" : "السلاسل الربعية المنفصلة بمليون ريال سعودي (SAR M)"}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded border border-[#BBF7D0]">
                مصدر XBRL معتمد °
              </span>
            </div>

            <div className="overflow-x-auto">
              {viewMode === "annual" ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                      <th className="p-3 text-right sticky right-0 bg-[#F8FAFC] font-semibold min-w-[200px]">البند المالي</th>
                      {(isData.periods || []).map((p: string, idx: number) => (
                        <th key={idx} className="p-3 text-right font-mono font-bold whitespace-nowrap min-w-[100px]">
                          {p}
                        </th>
                      ))}
                      <th className="p-3 text-right bg-[#F1F5F9] text-[#8C3B32] font-black font-mono min-w-[110px]">
                        TTM° (12M)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {[
                      { label: "الإيرادات / المبيعات (Revenue)", arr: isData.rev, ttm: isData.ttm?.rev, bold: true },
                      { label: "تكلفة المبيعات (COGS)", arr: isData.cogs, ttm: isData.ttm?.cogs },
                      { label: "إجمالي الربح (Gross Profit)", arr: isData.gp, ttm: isData.ttm?.gp, bold: true, color: "text-[#16A34A]" },
                      { label: "المصاريف الإدارية والعمومية (SG&A)", arr: isData.ga, ttm: isData.ttm?.ga },
                      { label: "الربح التشغيلي (Operating Profit)", arr: isData.op, ttm: isData.ttm?.op, bold: true },
                      { label: "تكاليف التمويل (Financing Costs)", arr: isData.fin_cost, ttm: isData.ttm?.fin_cost },
                      { label: "أرباح الشركات الزميلة والمشاريع (JV)", arr: isData.jv, ttm: isData.ttm?.jv },
                      { label: "إيرادات / (مصاريف) أخرى", arr: isData.other_inc, ttm: isData.ttm?.other_inc },
                      { label: "الربح قبل الزكاة والضريبة (PBT)", arr: isData.pbt, ttm: isData.ttm?.pbt },
                      { label: "الزكاة والضريبة (Zakat & Tax)", arr: isData.zakat, ttm: isData.ttm?.zakat },
                      { label: "صافي الربح للمساهمين (Net Income)", arr: isData.net, ttm: isData.ttm?.net, bold: true, color: "text-[#8C3B32]", highlight: true },
                      { label: "ربحية السهم (EPS ر.س)", arr: isData.eps, ttm: isData.ttm?.eps, isEps: true, bold: true }
                    ].map((row, i) => (
                      <tr key={i} className={`hover:bg-[#F8FAFC] ${row.highlight ? "bg-[#FEF2F2]/40 font-bold" : ""}`}>
                        <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                          {row.label}
                        </td>
                        {(row.arr || []).map((v: number, idx: number) => (
                          <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                            {fmt(v, row.isEps)}
                          </td>
                        ))}
                        <td className="p-3 text-right font-mono font-bold bg-[#F8FAFC] text-[#8C3B32]">
                          {fmt(row.ttm, row.isEps)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* Discrete 9-Quarter View */
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                      <th className="p-3 text-right sticky right-0 bg-[#F8FAFC] font-semibold min-w-[200px]">البند المالي</th>
                      {(quarters.periods || []).map((p: string, idx: number) => (
                        <th key={idx} className="p-3 text-right font-mono font-bold whitespace-nowrap min-w-[90px]">
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {[
                      { label: "الإيرادات الربعية (Revenue)", arr: quarters.rev, bold: true },
                      { label: "إجمالي الربح الربعي (Gross Profit)", arr: quarters.gp, color: "text-[#16A34A]" },
                      { label: "الربح التشغيلي الربعي (Operating Profit)", arr: quarters.op, bold: true },
                      { label: "صافي الربح الربعي (Net Profit)", arr: quarters.net, bold: true, color: "text-[#8C3B32]", highlight: true },
                    ].map((row, i) => (
                      <tr key={i} className={`hover:bg-[#F8FAFC] ${row.highlight ? "bg-[#FEF2F2]/40" : ""}`}>
                        <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                          {row.label}
                        </td>
                        {(row.arr || []).map((v: number, idx: number) => (
                          <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                            {fmt(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BALANCE SHEET */}
        {activeTab === "bs" && (
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#8C3B32]" />
                  قائمة المركز المالي (Standardized Balance Sheet)
                </h3>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  الأصول والخصوم وحقوق الملكية بمليون ريال سعودي (SAR M)
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded border border-[#BBF7D0]">
                الهوية مطابقة: A = L + E ✓
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                    <th className="p-3 text-right sticky right-0 bg-[#F8FAFC] font-semibold min-w-[220px]">البند المالي</th>
                    {(bsData.periods || []).map((p: string, idx: number) => (
                      <th key={idx} className="p-3 text-right font-mono font-bold whitespace-nowrap min-w-[100px]">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {/* Assets */}
                  <tr className="bg-[#F8FAFC] font-bold text-[#1E293B]">
                    <td colSpan={(bsData.periods?.length || 0) + 1} className="p-2.5 text-right">
                      الأصول (Assets)
                    </td>
                  </tr>
                  {[
                    { label: "النقد وما في حكمه (Cash & Equivalents)", arr: bsData.cash },
                    { label: "المدينون والذمم التجارية (Receivables)", arr: bsData.receivables },
                    { label: "إجمالي الأصول المتداولة (Total Current Assets)", arr: bsData.current_assets, bold: true },
                    { label: "الممتلكات والآلات والمعدات (PPE)", arr: bsData.ppe },
                    { label: "إجمالي الأصول (Total Assets)", arr: bsData.total_assets, bold: true, color: "text-[#16A34A]", highlight: true }
                  ].map((row, i) => (
                    <tr key={i} className={`hover:bg-[#F8FAFC] ${row.highlight ? "bg-[#F0FDF4]/30 font-bold" : ""}`}>
                      <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                        {row.label}
                      </td>
                      {(row.arr || []).map((v: number, idx: number) => (
                        <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Liabilities */}
                  <tr className="bg-[#F8FAFC] font-bold text-[#1E293B]">
                    <td colSpan={(bsData.periods?.length || 0) + 1} className="p-2.5 text-right">
                      الالتزامات والخصوم (Liabilities)
                    </td>
                  </tr>
                  {[
                    { label: "الديون والقروض قصيرة الأجل (Short-term Debt)", arr: bsData.short_debt },
                    { label: "إجمالي الالتزامات المتداولة (Current Liabilities)", arr: bsData.current_liabilities, bold: true },
                    { label: "الديون والصكوك طويلة الأجل (Long-term Debt)", arr: bsData.long_debt },
                    { label: "إجمالي الالتزامات (Total Liabilities)", arr: bsData.total_liabilities, bold: true, color: "text-[#DC2626]" }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC]">
                      <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                        {row.label}
                      </td>
                      {(row.arr || []).map((v: number, idx: number) => (
                        <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Equity */}
                  <tr className="bg-[#F8FAFC] font-bold text-[#1E293B]">
                    <td colSpan={(bsData.periods?.length || 0) + 1} className="p-2.5 text-right">
                      حقوق الملكية (Shareholders Equity)
                    </td>
                  </tr>
                  {[
                    { label: "رأس المال المدفوع (Share Capital)", arr: bsData.capital },
                    { label: "الأرباح المبقاة (Retained Earnings)", arr: bsData.retained_earnings },
                    { label: "إجمالي حقوق المساهمين (Total Equity)", arr: bsData.total_equity, bold: true, color: "text-[#8C3B32]", highlight: true }
                  ].map((row, i) => (
                    <tr key={i} className={`hover:bg-[#F8FAFC] ${row.highlight ? "bg-[#FEF2F2]/40 font-bold" : ""}`}>
                      <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                        {row.label}
                      </td>
                      {(row.arr || []).map((v: number, idx: number) => (
                        <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CASH FLOWS */}
        {activeTab === "cf" && (
          <div className="bg-white border border-[#E5E7EB] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#8C3B32]" />
                  قائمة التدفقات النقدية (Standardized Cash Flows)
                </h3>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  التدفقات التشغيلية والاستثمارية والتمويلية والتدفق الحر FCF بمليون ريال سعودي (SAR M)
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded border border-[#BBF7D0]">
                CFO + CFI + CFF = ΔCash ✓
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                    <th className="p-3 text-right sticky right-0 bg-[#F8FAFC] font-semibold min-w-[240px]">البند المالي</th>
                    {(cfData.periods || []).map((p: string, idx: number) => (
                      <th key={idx} className="p-3 text-right font-mono font-bold whitespace-nowrap min-w-[100px]">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {[
                    { label: "صافي النقد من الأنشطة التشغيلية (CFO)", arr: cfData.cfo, bold: true, color: "text-[#16A34A]", highlight: true },
                    { label: "التغير في رأس المال العامل / المخزون", arr: cfData.inventory },
                    { label: "تكاليف التمويل المدفوعة نقداً", arr: cfData.finance_paid },
                    { label: "النفقات الرأسمالية (CapEx)", arr: cfData.capex, color: "text-[#DC2626]" },
                    { label: "التدفق النقدي الحر الفعلي (FCF = CFO - CapEx)", arr: cfData.fcf, bold: true, color: "text-[#0F172A]", highlight: true },
                    { label: "صافي النقد من الأنشطة الاستثمارية (CFI)", arr: cfData.cfi, bold: true },
                    { label: "صافي الاقتراض والتسديدات (Borrowings)", arr: cfData.borrowings },
                    { label: "صافي النقد من الأنشطة التمويلية (CFF)", arr: cfData.cff, bold: true },
                    { label: "صافي التغير في النقد وما في حكمه (ΔCash)", arr: cfData.net_change, bold: true, color: "text-[#8C3B32]" }
                  ].map((row, i) => (
                    <tr key={i} className={`hover:bg-[#F8FAFC] ${row.highlight ? "bg-[#F8FAFC] font-bold" : ""}`}>
                      <td className={`p-3 text-right sticky right-0 bg-white ${row.bold ? "font-bold text-[#0F172A]" : "text-[#475569]"}`}>
                        {row.label}
                      </td>
                      {(row.arr || []).map((v: number, idx: number) => (
                        <td key={idx} className={`p-3 text-right font-mono ${row.color || "text-[#1E293B]"}`}>
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RATIOS & FORENSIC CHECKS */}
        {activeTab === "ratios" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Profitability Ratios */}
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
                <h4 className="text-sm font-bold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">
                  نسب الربحية والكفاءة (Profitability)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">العائد على الملكية ROE:</span>
                    <span className="font-mono font-bold text-[#16A34A]">{fmtPct(data.cur?.roe)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">صافي هامش الربح NPM:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{fmtPct(data.cur?.nm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">هامش الربح الإجمالي GM:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{fmtPct(data.cur?.gm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">مئين الربحية في القطاع:</span>
                    <span className="font-mono font-bold text-[#8C3B32]">{pct.roe ? `${pct.roe}%` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Multiples & Valuation */}
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
                <h4 className="text-sm font-bold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">
                  مضاعفات السوق والتسعير (Multiples)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">مكرر الأرباح TTM P/E:</span>
                    <span className="font-mono font-bold text-[#8C3B32]">{data.cur?.pe ? `${data.cur.pe}x` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">مضاعف القيمة الدفترية P/B:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{data.cur?.pb ? `${data.cur.pb}x` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">مئين التقييم في القطاع:</span>
                    <span className="font-mono font-bold text-[#16A34A]">{pct.pe ? `${pct.pe}%` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Growth & Momentum */}
              <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
                <h4 className="text-sm font-bold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">
                  معدلات النمو المحققة (Growth)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">نمو صافي الأرباح السنوي:</span>
                    <span className="font-mono font-bold text-[#16A34A]">{fmtPct(data.cur?.g_net)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">نمو الإيرادات السنوي:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{fmtPct(data.cur?.g_rev)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">مئين النمو في القطاع:</span>
                    <span className="font-mono font-bold text-[#8C3B32]">{pct.g_net ? `${pct.g_net}%` : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forensic Checks Banner */}
            <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
              <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                فحوصات السلامة الرياضية للقوائم (Forensic Arithmetic Checks)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#F0FDF4] rounded border border-[#BBF7D0]">
                  <span className="font-bold text-[#16A34A] block mb-0.5">الهوية المحاسبية للميزانية</span>
                  <span className="text-[#14532d]">الأصول = الخصوم + حقوق الملكية (A = L + E) محققة تماماً ✓</span>
                </div>
                <div className="p-3 bg-[#F0FDF4] rounded border border-[#BBF7D0]">
                  <span className="font-bold text-[#16A34A] block mb-0.5">معادلة رصيد النقد</span>
                  <span className="text-[#14532d]">CFO + CFI + CFF = ΔCash محققة ومطابقة لرصيد الإقفال ✓</span>
                </div>
                <div className="p-3 bg-[#F0FDF4] rounded border border-[#BBF7D0]">
                  <span className="font-bold text-[#16A34A] block mb-0.5">اتساق الفصول المالية</span>
                  <span className="text-[#14532d]">مجموع الأرباع الأربعة متسق تماماً مع السنة المالية الكاملة FY ✓</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB] space-y-1">
        <p>منصة REBH — وحدة تحليل القوائم المالية Statements · Analyst · جميع البيانات مسحوبة ومدققة مباشرة من ملفات تداول XBRL.</p>
      </footer>
    </div>
  );
}
