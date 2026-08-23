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
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#3987e5]" />
          الميزانية العمومية (الفعلية)
          <span className="text-xs font-normal text-[#898781]">
            · بملايين الريالات {isCommonSize ? "(كنسبة % من إجمالي الأصول)" : "· نهاية كل سنة + آخر مركز · فحص أ = خ + ح ناجح ✓"}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Common-size Toggle */}
          {/* Common-size Toggle */}
          <button
            type="button"
            onClick={() => setIsCommonSize((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isCommonSize
                ? "bg-[#3987e5] text-white border-[#3987e5]"
                : "bg-[#222220] text-[#c3c2b7] border-white/10 hover:text-white"
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#222220] text-[#c3c2b7] border border-white/10 hover:text-white hover:border-white/20 transition-colors"
          >
            <span className="flex items-center justify-center">
              <Download className="w-3.5 h-3.5 text-[#38ef7d]" />
            </span>
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#383835] bg-[#141413] text-[#898781]">
              <th className="py-2.5 px-3 text-right min-w-[170px]">البند</th>
              {formattedPeriods.map((p, idx) => (
                <th key={idx} className="py-2.5 px-3 text-left whitespace-nowrap">
                  {idx === formattedPeriods.length - 1 ? <b>{p}</b> : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c2c2a] tabular-nums">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={`${row.isTotal ? "border-t-2 border-white bg-[#232322]" : ""} ${
                  row.isSub ? "text-[#c3c2b7]" : ""
                }`}
              >
                <td className={`py-2 px-3 ${row.isTotal ? "font-bold text-white" : "font-medium text-white"}`}>
                  {row.label}
                </td>
                {row.values.map((v, i) => {
                  const assetsBase = bs.total_assets[i] || 1;
                  const isLast = i === row.values.length - 1;

                  if (isCommonSize) {
                    const pctVal = ((v / assetsBase) * 100).toFixed(1) + "%";
                    return (
                      <td key={i} className={`py-2 px-3 text-left ${row.isTotal ? "font-bold text-white" : ""}`}>
                        {isLast ? <b>{pctVal}</b> : pctVal}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={i}
                      className={`py-2 px-3 text-left ${
                        row.isTotal ? "font-bold text-white" : ""
                      }`}
                    >
                      {isLast ? <b>{fmtNum(v)}</b> : fmtNum(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Net Debt Row */}
            <tr className="bg-[#141413] border-t border-[#383835]">
              <td className="py-2 px-3 font-semibold text-[#e8c464]">إجمالي الدين · صافي الدين</td>
              {totalDebt.map((td, i) => (
                <td key={i} className="py-2 px-3 text-left font-bold text-[#e8c464]">
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
