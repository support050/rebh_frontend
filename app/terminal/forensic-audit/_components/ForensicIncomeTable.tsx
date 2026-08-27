"use client";

import { useState } from "react";
import { BarChart3, Download, Percent, Hash } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

function fmtNum(v: number | null | undefined, showSign = false): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (v < 0) return `(${formatted})`;
  if (showSign && v > 0) return `+${formatted}`;
  return formatted;
}

function yoy(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  if ((cur > 0) !== (prev > 0)) return null;
  return ((Math.abs(cur) / Math.abs(prev)) - 1) * 100;
}

export default function ForensicIncomeTable({ data }: Props) {
  const [isCommonSize, setIsCommonSize] = useState(false);

  const isObj = data.income_statement;
  const periods = isObj?.periods || data.periods_ar || data.periods_q || [];
  const pSlice = periods.slice(-6);

  // Extract arrays for 6 periods
  const revSlice = (isObj?.rev || data.rev || []).slice(-pSlice.length);
  const cogsSlice = (isObj?.cogs || []).slice(-pSlice.length);
  const gpSlice = (isObj?.gp || data.gp || []).slice(-pSlice.length);
  const gaSlice = (isObj?.ga || []).slice(-pSlice.length);
  const opSlice = (isObj?.op || data.op || []).slice(-pSlice.length);
  const finCostSlice = (isObj?.fin_cost || []).slice(-pSlice.length);
  const jvSlice = (isObj?.jv || []).slice(-pSlice.length);
  const otherIncSlice = (isObj?.other_inc || []).slice(-pSlice.length);
  const pbtSlice = (isObj?.pbt || []).slice(-pSlice.length);
  const zakatSlice = (isObj?.zakat || []).slice(-pSlice.length);
  const netSlice = (isObj?.net || data.net || []).slice(-pSlice.length);
  const epsSlice = (isObj?.eps || data.eps || []).slice(-pSlice.length);

  // TTM values
  const ttmObj = isObj?.ttm;
  const ttmRev = ttmObj?.rev ?? revSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmCogs = ttmObj?.cogs ?? cogsSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmGp = ttmObj?.gp ?? gpSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmGa = ttmObj?.ga ?? gaSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmOp = ttmObj?.op ?? opSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmFinCost = ttmObj?.fin_cost ?? finCostSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmJv = ttmObj?.jv ?? jvSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmOtherInc = ttmObj?.other_inc ?? otherIncSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmPbt = ttmObj?.pbt ?? pbtSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmZakat = ttmObj?.zakat ?? zakatSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmNet = ttmObj?.net ?? netSlice.slice(-4).reduce((a, b) => a + b, 0);
  const ttmEps = ttmObj?.eps ?? (epsSlice.length > 0 ? epsSlice.slice(-4).reduce((a, b) => a + b, 0) : 0);

  const allPeriods = [...pSlice, "TTM°"];
  const allRev = [...revSlice, ttmRev];
  const allCogs = [...cogsSlice, ttmCogs];
  const allGp = [...gpSlice, ttmGp];
  const allGa = [...gaSlice, ttmGa];
  const allOp = [...opSlice, ttmOp];
  const allFinCost = [...finCostSlice, ttmFinCost];
  const allJv = [...jvSlice, ttmJv];
  const allOtherInc = [...otherIncSlice, ttmOtherInc];
  const allPbt = [...pbtSlice, ttmPbt];
  const allZakat = [...zakatSlice, ttmZakat];
  const allNet = [...netSlice, ttmNet];
  const allEps = [...epsSlice, ttmEps];

  const rows = [
    { label: "الإيرادات", values: allRev, isBase: true },
    { label: "تكلفة المبيعات", values: allCogs, isSub: true },
    { label: "إجمالي الربح · الهامش", values: allGp, hasMargin: true, baseArr: allRev },
    { label: "مصاريف عمومية وإدارية", values: allGa, isSub: true },
    { label: "ربح العمليات", values: allOp },
    { label: "تكلفة التمويل", values: allFinCost, isSub: true, isNegText: true },
    { label: "حصة مشاريع مشتركة وزميلة", values: allJv, isSub: true },
    { label: "إيرادات أخرى، صافي", values: allOtherInc, isSub: true },
    { label: "الربح قبل الزكاة", values: allPbt },
    { label: "الزكاة · النسبة الفعلية", values: allZakat, isSub: true, hasEffRate: true, pbtArr: allPbt },
    { label: "صافي الربح · الهامش", values: allNet, isTotal: true, hasMargin: true, baseArr: allRev },
    { label: "ربحية السهم (ريال)", values: allEps, isEps: true },
  ];

  // Dynamic Zakat Footnote calculation
  const latestIdx = allZakat.length - 2; // Last full financial year (2025)
  const prevIdx = latestIdx - 1; // 2024
  const latestZakatVal = latestIdx >= 0 ? Math.abs(allZakat[latestIdx]) : 220;
  const latestPbtVal = latestIdx >= 0 ? allPbt[latestIdx] : 1354;
  const prevZakatVal = prevIdx >= 0 ? Math.abs(allZakat[prevIdx]) : 21;
  const prevPbtVal = prevIdx >= 0 ? allPbt[prevIdx] : 809;

  const latestEffRate = latestPbtVal > 0 ? ((latestZakatVal / latestPbtVal) * 100).toFixed(1) : "16.3";
  const prevEffRate = prevPbtVal > 0 ? ((prevZakatVal / prevPbtVal) * 100).toFixed(1) : "2.5";
  const netGrowthVal = latestIdx >= 0 && prevIdx >= 0 ? yoy(allNet[latestIdx], allNet[prevIdx]) : 40.5;

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ["البند", ...allPeriods].join(",");
    const csvRows = rows.map((r) => {
      const vals = r.values.map((v) => (v != null ? v : "")).join(",");
      return `"${r.label}",${vals}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `قائمة_الدخل_التفصيلية_${data.sym}_${data.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-[#1A1A1A]">
          <BarChart3 className="w-4 h-4 text-[#8C3B32]" />
          قائمة الدخل السنوية (الفعلية)
          <span className="text-xs font-normal text-[#6B7280]">
            · بملايين الريالات {isCommonSize ? "(كنسبة % من الإيرادات)" : "· 2020–2025 من إفصاحات XBRL + TTM حتى Q1'26 محسوب°"}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Common-size Toggle */}
          <button
            type="button"
            onClick={() => setIsCommonSize((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium border transition-colors ${isCommonSize
              ? "bg-white text-[#8C3B32] border-[#8C3B32] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#1A1A1A] hover:border-[#D1D5DB]"
              }`}
          >
            <span className="flex items-center justify-center">
              {isCommonSize ? <Hash className="w-3.5 h-3.5" /> : <Percent className="w-3.5 h-3.5" />}
            </span>
            <span>{isCommonSize ? "عرض بالريال" : "تحليل نسبي (Common-size %)"}</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A] hover:border-[#D1D5DB] transition-colors"
          >
            <span className="flex items-center justify-center">
              <Download className="w-3.5 h-3.5 text-[#16A34A]" />
            </span>
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]">
              <th className="py-2.5 px-3 text-right min-w-[180px] sticky right-0 bg-[#F3F4F6] z-10">البند</th>
              {allPeriods.map((p, idx) => (
                <th key={idx} className="py-2.5 px-3 text-left whitespace-nowrap">
                  {idx === allPeriods.length - 1 ? <b className="text-[#1A1A1A]">{p}</b> : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] tabular-nums">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={`${row.isTotal ? "bg-[#F3F4F6]" : "hover:bg-[#F7F8FA]"}`}
              >
                <td
                  className={`py-2 px-3 sticky right-0 z-10 ${row.isTotal ? "bg-[#F3F4F6]" : "bg-white"} ${row.isTotal ? "font-bold text-[#1A1A1A]" : row.isSub ? "text-[#6B7280]" : "font-medium text-[#1A1A1A]"
                    }`}
                >
                  {row.label}
                </td>
                {row.values.map((v, i) => {
                  const revBase = allRev[i] || 1;
                  const isLast = i === row.values.length - 1;
                  const isNeg = v != null && v < 0;

                  // Render common-size percentage
                  if (isCommonSize && !row.isEps) {
                    const pctVal = ((v / revBase) * 100).toFixed(1) + "%";
                    return (
                      <td key={i} className={`py-2 px-3 text-left ${row.isTotal ? "font-bold text-[#16A34A]" : "text-[#1A1A1A]"}`}>
                        {isLast ? <b>{pctVal}</b> : pctVal}
                      </td>
                    );
                  }

                  // Default Nominal Values
                  const yoyVal = (row.isBase || row.isTotal) && i > 0 && i < row.values.length - 1 ? yoy(v, row.values[i - 1]) : null;

                  // Display format for margins or effective zakat rates
                  let marginStr = "";
                  if (row.hasMargin && row.baseArr && row.baseArr[i] > 0 && v != null) {
                    marginStr = ` · ${((v / row.baseArr[i]) * 100).toFixed(1)}%`;
                  }
                  if (row.hasEffRate && row.pbtArr && row.pbtArr[i] > 0 && v != null) {
                    marginStr = ` · ${((Math.abs(v) / row.pbtArr[i]) * 100).toFixed(1)}%`;
                    if (i === row.values.length - 2 && Math.abs(v) > 50) {
                      marginStr += " ⚑";
                    }
                  }

                  return (
                    <td
                      key={i}
                      className={`py-2 px-3 text-left ${row.isTotal
                        ? isNeg
                          ? "font-bold text-[#DC2626]"
                          : "font-bold text-[#1A1A1A]"
                        : row.isNegText
                          ? "text-[#DC2626]"
                          : isNeg
                            ? "text-[#DC2626]"
                            : "text-[#1A1A1A]"
                        }`}
                    >
                      {isLast ? (
                        <b>
                          {row.isEps ? v?.toFixed(2) : fmtNum(v)}
                          {marginStr}
                        </b>
                      ) : (
                        <span>
                          {row.isEps ? v?.toFixed(2) : fmtNum(v)}
                          {marginStr}
                        </span>
                      )}
                      {yoyVal != null && (
                        <span className={`text-[10px] mr-1 ${yoyVal >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                          {yoyVal >= 0 ? "+" : ""}{yoyVal.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Zakat Footnote */}
      <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#F3F4F6] text-xs text-[#6B7280] leading-relaxed">
        ⚑ <b className="text-[#1A1A1A]">قفزة الزكاة لـ ({data.name}) في آخر دورة معلنة:</b> ارتفعت إلى ({Math.round(latestZakatVal)} م.ر.س) مما رفع النسبة الفعلية للزكاة من {prevEffRate}% إلى {latestEffRate}% من الربح قبل الزكاة — بند يستحق قراءة إيضاحات القوائم المالية (تسويات مع هيئة الزكاة والضريبة والجمارك). لولا هذا الأثر لكان نمو صافي الربح السنوي أعلى بكثير من {netGrowthVal ? (netGrowthVal >= 0 ? `+${netGrowthVal.toFixed(1)}%` : `${netGrowthVal.toFixed(1)}%`) : "+40.5%"}.
      </div>
    </div>
  );
}