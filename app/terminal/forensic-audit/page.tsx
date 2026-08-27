"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { useForensicSheetData } from "./_hooks/useForensicSheetData";
import ForensicSheetHeader from "./_components/ForensicSheetHeader";
import ForensicAuditAlert from "./_components/ForensicAuditAlert";
import ForensicIncomeTable from "./_components/ForensicIncomeTable";
import ForensicRecentQuartersTable from "./_components/ForensicRecentQuartersTable";
import ForensicBalanceSheetTable from "./_components/ForensicBalanceSheetTable";
import ForensicCashFlowTable from "./_components/ForensicCashFlowTable";
import DualJudgmentRatiosTable from "./_components/DualJudgmentRatiosTable";
import ForensicAuditChecksGrid from "./_components/ForensicAuditChecksGrid";
import ForensicChartsGrid from "./_components/ForensicChartsGrid";
import SectorPeersRank from "./_components/SectorPeersRank";

export default function ForensicSheetPage() {
  const [symbol, setSymbol] = useState("4300");
  const [inputSym, setInputSym] = useState("4300");

  const { data, loading, error } = useForensicSheetData(symbol);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSym.trim()) {
      setSymbol(inputSym.trim());
    }
  };

  const POPULAR_SYMBOLS = [
    { sym: "4300", name: "دار الأركان" },
    { sym: "1010", name: "بنك الرياض" },
    { sym: "2222", name: "أرامكو" },
    { sym: "2010", name: "سابك" },
    { sym: "1831", name: "مهارة" },
    { sym: "3030", name: "أسمنت السعودية" },
    { sym: "7010", name: "الاتصالات STC" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-4 md:p-6 lg:p-8 font-sans" dir="rtl">
      <div className="w-full space-y-6">
        {/* Navigation & Live Stock Search Toolbar */}
        {/* Structural note: back-link, popular symbols, and search were spread across one crowded
            row in the original. Grouped into two clear rows here (navigation / quick picks) so the
            search action doesn't compete visually with the symbol shortcuts. */}
        <div className="bg-white p-4 rounded-[4px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/terminal/sector-templates"
              className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1A1A1A] bg-[#F7F8FA] px-3 py-1.5 rounded-[4px] border border-[#E5E7EB] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> القوالب القطاعية
            </Link>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="أدخل رمز الشركة (مثلاً: 4300)"
                value={inputSym}
                onChange={(e) => setInputSym(e.target.value)}
                className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15 w-52 transition-colors"
              />
              <button
                type="submit"
                className="bg-[#8C3B32] hover:bg-[#78312A] text-white px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> فحص
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-3 border-t border-[#E5E7EB]">
            <span className="text-[#6B7280] ml-1">الشركات الشائعة:</span>
            {POPULAR_SYMBOLS.map((item) => (
              <button
                key={item.sym}
                onClick={() => {
                  setInputSym(item.sym);
                  setSymbol(item.sym);
                }}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${symbol === item.sym
                  ? "bg-white text-[#8C3B32] border-[#8C3B32] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "bg-[#F3F4F6] text-[#6B7280] border-transparent hover:text-[#1A1A1A] hover:border-[#E5E7EB]"
                  }`}
              >
                {item.name} ({item.sym})
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center text-[#6B7280] text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#8C3B32] border-t-transparent rounded-full mb-3" />
            <p>جاري استرجاع القوائم المالية وإجراء الفحوصات الجنائية لـ ({symbol})...</p>
          </div>
        )}

        {error && (
          <div className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-6 text-center text-[#DC2626] text-sm">
            <p>تعذر استرجاع بيانات الشركة {symbol}. يرجى التأكد من توفر رمز الشركة في قاعدة البيانات.</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* 1. Header Component */}
            <ForensicSheetHeader data={data} />

            {/* 2. Forensic Comparison Alert Component */}
            <ForensicAuditAlert data={data} />

            {/* 3. Annual Income Statement Component */}
            <ForensicIncomeTable data={data} />

            {/* 4. Recent Quarters Component (9 Quarters YoY) */}
            <ForensicRecentQuartersTable data={data} />

            {/* 5. Balance Sheet Component (6 Years + Latest Q) */}
            <ForensicBalanceSheetTable data={data} />

            {/* 6. Cash Flow Statement Component (6 Years + FCF) */}
            <ForensicCashFlowTable data={data} />

            {/* 7. Dual Judgment Ratios Component (with Dupont analysis) */}
            <DualJudgmentRatiosTable data={data} />

            {/* 8. Automated Forensic Verification Checklist Grid */}
            <ForensicAuditChecksGrid data={data} />

            {/* 9. 4 Trend Charts Grid (SVG) */}
            <ForensicChartsGrid data={data} />

            {/* 10. Peer Comparison in Sector Component */}
            <SectorPeersRank data={data} />
          </>
        )}
      </div>
    </div>
  );
}