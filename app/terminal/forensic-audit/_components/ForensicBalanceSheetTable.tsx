"use client";

import { useState } from "react";
import { Landmark, Download, Percent, Hash } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  return v < 0 ? `(${abs.toLocaleString()})` : abs.toLocaleString();
}

export default function ForensicBalanceSheetTable({ data }: Props) {
  const [isCommonSize, setIsCommonSize] = useState(false);

  const bs = data.bs;
  if (!bs || !bs.periods || bs.periods.length === 0) {
    return null;
  }

  const formattedPeriods = bs.periods.map((p) => {
    if (p.endsWith("-12")) return p.split("-")[0];
    if (p.endsWith("-03")) return `Q1'${p.slice(2, 4)}`;
    if (p.endsWith("-06")) return `Q2'${p.slice(2, 4)}`;
    if (p.endsWith("-09")) return `Q3'${p.slice(2, 4)}`;
    return p;
  });

  const totalDebt = (bs.short_debt || []).map((sd, i) => Math.round((sd || 0) + ((bs.long_debt && bs.long_debt[i]) || 0)));
  const netDebt = totalDebt.map((td, i) => Math.round(td - ((bs.cash && bs.cash[i]) || 0)));

  const rows = [
    { label: "النقد وأرصدة البنوك", values: bs.cash, isSub: true },
    { label: "مدينون تجاريون وذمم", values: bs.receivables, isSub: true },
    { label: "إجمالي الأصول المتداولة", values: bs.current_assets },
    { label: "ممتلكات وآلات وعقارات (PPE)", values: bs.ppe, isSub: true },
    { label: "إجمالي الأصول", values: bs.total_assets, isTotal: true },
    { label: "قروض والتزامات قصيرة الأجل", values: bs.short_debt, isSub: true },
    { label: "إجمالي المطلوبات المتداولة", values: bs.current_liabilities },
    { label: "قروض وصكوك طويلة الأجل", values: bs.long_debt, isSub: true },
    { label: "إجمالي المطلوبات", values: bs.total_liabilities, isTotal: true },
    { label: "رأس المال", values: bs.capital, isSub: true },
    { label: "أرباح مبقاة", values: bs.retained_earnings, isSub: true },
    { label: "إجمالي حقوق الملكية", values: bs.total_equity, isTotal: true },
  ];

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ["البند", ...formattedPeriods].join(",");
    const csvRows = rows.map((r) => {
      const vals = r.values.map((v) => (v != null ? v : "")).join(",");
      return `"${r.label}",${vals}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `الميزانية_العمومية_${data.sym}_${data.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-[#1A1A1A]">
          <Landmark className="w-4 h-4 text-[#8C3B32]" />
          الميزانية العمومية (الفعلية)
          <span className="text-xs font-normal text-[#6B7280]">
            · بملايين الريالات {isCommonSize ? "(كنسبة % من إجمالي الأصول)" : "· نهاية كل سنة + آخر مركز · فحص أ = خ + ح ناجح ✓"}
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
            <span>{isCommonSize ? "عرض بالريال" : "تحليل نسبي (% الأصول)"}</span>
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
              <th className="py-2.5 px-3 text-right min-w-[170px] sticky right-0 bg-[#F3F4F6] z-10">البند</th>
              {formattedPeriods.map((p, idx) => (
                <th key={idx} className="py-2.5 px-3 text-left whitespace-nowrap">
                  {idx === formattedPeriods.length - 1 ? <b className="text-[#1A1A1A]">{p}</b> : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] tabular-nums">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={row.isTotal ? "bg-[#F3F4F6]" : "hover:bg-[#F7F8FA]"}>
                <td
                  className={`py-2 px-3 sticky right-0 z-10 ${row.isTotal ? "bg-[#F3F4F6]" : "bg-white"} ${row.isTotal ? "font-bold text-[#1A1A1A]" : row.isSub ? "text-[#6B7280]" : "font-medium text-[#1A1A1A]"
                    }`}
                >
                  {row.label}
                </td>
                {row.values.map((v, i) => {
                  const assetsBase = bs.total_assets[i] || 1;
                  const isLast = i === row.values.length - 1;

                  if (isCommonSize) {
                    const pctVal = ((v / assetsBase) * 100).toFixed(1) + "%";
                    return (
                      <td key={i} className={`py-2 px-3 text-left ${row.isTotal ? "font-bold text-[#1A1A1A]" : "text-[#1A1A1A]"}`}>
                        {isLast ? <b>{pctVal}</b> : pctVal}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={i}
                      className={`py-2 px-3 text-left text-[#1A1A1A] ${row.isTotal ? "font-bold" : ""}`}
                    >
                      {isLast ? <b>{fmtNum(v)}</b> : fmtNum(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Net Debt Row */}
            <tr className="bg-[#FEF9EE] border-t border-[#E5E7EB]">
              <td className="py-2 px-3 font-semibold text-[#92400E] sticky right-0 z-10 bg-[#FEF9EE]">إجمالي الدين · صافي الدين</td>
              {totalDebt.map((td, i) => (
                <td key={i} className="py-2 px-3 text-left font-bold text-[#92400E]">
                  {fmtNum(td)} · {fmtNum(netDebt[i])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}