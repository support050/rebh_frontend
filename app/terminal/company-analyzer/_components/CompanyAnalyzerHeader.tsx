"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";

interface Props {
  sym: string;
  onSelectSym: (s: string) => void;
  data: {
    sym: string;
    name: string;
    en: string;
    sec: string;
    px: number;
  };
}

export default function CompanyAnalyzerHeader({ sym, onSelectSym, data }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [inputSym, setInputSym] = useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputSym.trim();
    if (clean) {
      onSelectSym(clean);
      setInputSym("");
    }
  };

  return (
    <>
      {/* ── TOP SEARCH & ACTIONS TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-6 py-2.5">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md flex-1">
          <input
            type="text"
            value={inputSym}
            onChange={(e) => setInputSym(e.target.value)}
            placeholder="أدخل رمز الشركة أو اسم السهم (مثلاً: 2222، 1120، 2010)..."
            className="w-full rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15 transition-all"
          />
          <button
            type="submit"
            className="rounded-[4px] border border-[#8C3B32] bg-[#8C3B32] px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.05)] whitespace-nowrap"
          >
            تحليل الشركة
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-[4px] border border-[#E5E7EB] px-2.5 py-1 text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
          >
            {mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
          </button>
        </div>
      </div>

      {/* ── COMPANY HEADER ── */}
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-3.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <div className="text-[19px] font-bold text-[#1A1A1A]">
            {data.name} <span className="mr-1.5 text-[12.5px] font-normal text-[#6B7280]">{data.en}</span>
          </div>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-0.5 text-[11.5px] text-[#6B7280]">{data.sym}</span>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-0.5 text-[11.5px] text-[#6B7280]">تداول</span>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-0.5 text-[11.5px] text-[#6B7280]">{data.sec}</span>
          <span className="rounded-full border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-0.5 text-[11.5px] font-semibold text-[#16A34A]">
            ✓ بيانات XBRL حقيقية — 9 أرباع حتى Q1 2026
          </span>
          <span className="mr-auto text-[21px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
            {Number(data.px).toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
            <small className="text-[11.5px] font-normal text-[#6B7280]">ر.س (إغلاق فعلي)</small>
          </span>
        </div>
      </header>
    </>
  );
}
