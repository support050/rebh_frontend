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
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Live Stock Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1a1a19] p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/terminal/sector-templates"
              className="flex items-center gap-1.5 text-xs text-[#898781] hover:text-white bg-[#222220] px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> القوالب القطاعية
            </Link>
            <span className="text-xs text-[#898781]">|</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#898781]">الشركات الشائعة:</span>
              {POPULAR_SYMBOLS.map((item) => (
                <button
                  key={item.sym}
                  onClick={() => {
                    setInputSym(item.sym);
                    setSymbol(item.sym);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    symbol === item.sym
                      ? "bg-[#3987e5] text-white font-bold"
                      : "bg-[#262624] text-[#c3c2b7] hover:text-white"
                  }`}
                >
                  {item.name} ({item.sym})
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="أدخل رمز الشركة (مثلاً: 4300)"
                value={inputSym}
                onChange={(e) => setInputSym(e.target.value)}
                className="bg-[#141413] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#898781] focus:outline-none focus:border-[#3987e5] w-52"
              />
            </div>
            <button
              type="submit"
              className="bg-[#3987e5] hover:bg-[#2a78d6] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> فحص
            </button>
          </form>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-12 text-center text-[#898781] text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#3987e5] border-t-transparent rounded-full mb-3" />
            <p>جاري استرجاع القوائم المالية وإجراء الفحوصات الجنائية لـ ({symbol})...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#e66767]/30 bg-[#3a1818]/30 p-6 text-center text-[#e66767] text-sm">
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
