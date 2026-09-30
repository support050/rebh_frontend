"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet, Search, ArrowRight,
  TrendingUp, Layers, Activity, ShieldCheck, BookOpen, BarChart3
} from "lucide-react";

const QUICK_SYMBOLS = [
  { sym: "2222", name: "Saudi Aramco", sec: "Energy" },
  { sym: "1120", name: "Al Rajhi Bank", sec: "Banks" },
  { sym: "2010", name: "SABIC", sec: "Petrochemicals" },
  { sym: "7010", name: "STC", sec: "Telecom" },
  { sym: "1180", name: "SNB (Al Ahli)", sec: "Banks" },
  { sym: "4030", name: "Dar Al Arkan", sec: "Real Estate" },
  { sym: "4200", name: "Al Andalus", sec: "Retail" },
  { sym: "2350", name: "SAFCO", sec: "Petrochemicals" },
];

const GUIDES = [
  { icon: <TrendingUp size={14} />, title: "Income Statement", desc: "Revenue · Three Margins · EPS · TTM" },
  { icon: <Layers size={14} />, title: "Balance Sheet", desc: "Assets · Liabilities · Shareholders' Equity · A = L + E check" },
  { icon: <Activity size={14} />, title: "Cash Flow Statement", desc: "CFO · CFI · CFF · FCF · Cash Conversion" },
  { icon: <BarChart3 size={14} />, title: "Financial Ratios", desc: "ROE · Margins · P/E · P/B · Leverage · Liquidity" },
  { icon: <ShieldCheck size={14} />, title: "Dual Verdict", desc: "Safe/At Risk (Solvency) + Good/Weak (Earnings Quality)" },
  { icon: <BookOpen size={14} />, title: "Formulas & Sources", desc: "XBRL-derived — every ratio with its formula and source" },
];

export default function RebhAnalystLandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const go = (sym: string) => router.push(`/rebh/analyst/${sym.trim().toUpperCase()}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) go(s);
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-24">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">ANALYST</span>
        <h1 className="font-bold text-sm tracking-tight text-[#1A1A1A]">Statements · Analyst</h1>
        <span className="hidden sm:inline-block text-xs text-[#9CA3AF]">|</span>
        <span className="hidden sm:inline-block text-xs text-[#6B7280]">
          Audited Financial Statements · Computed Ratios · Documented Formulas · Sector Templates
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Search */}
        <section className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
          <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">
            Financial Statement Analysis for Any Saudi-Listed Company
          </h2>
          <p className="text-xs text-[#6B7280]">
            Enter a ticker symbol to open the full page — Income Statement · Balance Sheet · Cash Flow · Ratios · Sector Template · Dual Verdict.
          </p>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
              <input
                type="text" inputMode="numeric" maxLength={4}
                value={input}
                onChange={e => setInput(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 2222 or 1120"
                className="w-full pl-8 pr-3 py-2.5 text-sm border border-[#D1D5DB] rounded-[6px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]"
              />
            </div>
            <button type="submit" disabled={input.length !== 4}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-40 text-white rounded-[6px] text-sm font-bold shadow-sm transition-colors">
              <FileSpreadsheet size={14} />
              Open Analysis
            </button>
          </form>
        </section>

        {/* Quick access */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
            <Activity size={15} className="text-[#8C3B32]" />
            Quick Access
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_SYMBOLS.map(s => (
              <button key={s.sym} onClick={() => go(s.sym)}
                className="bg-white border border-[#E5E7EB] rounded-[6px] p-3.5 text-left hover:border-[#8C3B32] hover:shadow-sm transition-all">
                <span className="block font-mono font-black text-[#8C3B32] text-base">{s.sym}</span>
                <span className="block text-xs font-semibold text-[#0F172A] mt-0.5 truncate">{s.name}</span>
                <span className="block text-[10px] text-[#64748B] mt-0.5">{s.sec}</span>
              </button>
            ))}
          </div>
        </section>

        {/* What's inside */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#374151] flex items-center gap-2">
            <BookOpen size={15} className="text-[#8C3B32]" />
            What's Included
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUIDES.map((g, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 flex items-start gap-3 hover:border-[#8C3B32] hover:shadow-sm transition-all">
                <span className="shrink-0 w-8 h-8 rounded-[6px] bg-[#FFF1EF] border border-[#FECACA] flex items-center justify-center text-[#8C3B32]">
                  {g.icon}
                </span>
                <div>
                  <span className="block text-xs font-bold text-[#0F172A]">{g.title}</span>
                  <span className="block text-[11px] text-[#64748B] mt-0.5">{g.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}