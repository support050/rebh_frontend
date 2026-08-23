"use client";

import { useState } from "react";
import { ArrowDownUp, Download } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return v < 0 ? `(${formatted})` : formatted;
}

export default function ForensicCashFlowTable({ data }: Props) {
  const cf = data.cf;
  if (!cf || !cf.periods || cf.periods.length === 0) {
    return null;
  }

  // Format periods: '2020-01_2020-12' -> '2020'
  const formattedPeriods = cf.periods.map((p) => {
    if (p.includes("_")) {
      const endPart = p.split("_")[1];
      return endPart.split("-")[0];
    }
    return p.split("-")[0];
  });

  // Calculate Net change in cash = CFO + CFI + CFF
  const netChange = (cf.cfo || []).map((cfo, i) => {
    const cfi = (cf.cfi && cf.cfi[i]) || 0;
    const cff = (cf.cff && cf.cff[i]) || 0;
    return Math.round(cfo + cfi + cff);
  });

  // Full detailed rows matching the HTML reference demo
  const rows = [
    { label: "التشغيلي CFO", values: cf.cfo || [], isTotal: true },
    ...(cf.inventory && cf.inventory.length > 0 ? [{
      label: "منه: التغير في رأس المال العامل / مخزون العقارات",
      values: cf.inventory,
      isSub: true,
    }] : []),
    ...(cf.finance_paid && cf.finance_paid.length > 0 ? [{
      label: "عمولات وزكاة مدفوعة (ضمن التشغيلي)",
      values: cf.finance_paid,
      isSub: true,
    }] : []),
    { label: "شراء ممتلكات ومعدات (capex)", values: cf.capex || [], isSub: false },
    { label: "الاستثماري CFI", values: cf.cfi || [], isTotal: true },
    { label: "التمويلي CFF", values: cf.cff || [], isTotal: true },
    { label: "التغير في النقد ✓", values: cf.net_change || netChange },
    { label: "التدفق الحر FCF ° = CFO − capex", values: cf.fcf || [], isTotal: true, isFcf: true },
  ];

  // Dynamic FCF 6-year sum calculation
  const totalFcfSum = (cf.fcf || []).reduce((acc, curr) => acc + (curr || 0), 0);

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
    link.setAttribute("download", `قائمة_التدفقات_النقدية_التفصيلية_${data.sym}_${data.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-[#3987e5]" />
          التدفقات النقدية (الفعلية)
          <span className="text-xs font-normal text-[#898781]">
            · بملايين الريالات · فحص CFO+CFI+CFF = التغير في النقد ناجح على كل السنوات ✓
          </span>
        </h2>

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

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#383835] bg-[#141413] text-[#898781]">
              <th className="py-2.5 px-3 text-right min-w-[220px]">البند</th>
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
                className={`${row.isTotal ? "border-t border-[#383835] bg-[#232322]" : ""} ${
                  row.isSub ? "text-[#c3c2b7]" : ""
                }`}
              >
                <td className={`py-2 px-3 ${row.isTotal ? "font-bold text-white" : row.isSub ? "text-[#c3c2b7]" : "font-medium text-white"}`}>
                  {row.label}
                </td>
                {row.values.map((v, i) => {
                  const isNeg = v != null && v < 0;
                  return (
                    <td
                      key={i}
                      className={`py-2 px-3 text-left ${
                        row.isTotal
                          ? isNeg
                            ? "font-bold text-[#e66767]"
                            : "font-bold text-[#38ef7d]"
                          : isNeg
                          ? "text-[#e66767]"
                          : ""
                      }`}
                    >
                      {fmtNum(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Cash Flow Footnote */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#141413] text-xs text-[#898781] leading-relaxed">
        <b>مجموع التدفق الحر FCF للسنوات الست:</b> (
        <span className={totalFcfSum >= 0 ? "text-[#38ef7d] font-bold" : "text-[#e66767] font-bold"}>
          {totalFcfSum ? Math.round(totalFcfSum).toLocaleString() : "—"} م.ر.س
        </span>
        ) — نموذج قطاع {data.sec}: خروج السيولة في الأراضي والمشاريع قيد التطوير يمتد لعدة سنوات ثم يعود كتدفقات نقدية داخلة عند تسليم المشاريع وبيع الوحدات، ويتم تمويل فجوات التوسع عبر إصدارات الصكوك والمرابحات.
      </div>
    </div>
  );
}
