"use client";

import React from "react";
import { Table2, TrendingUp } from "lucide-react";

interface InteractiveStatementTableProps {
  periods: string[];
  metrics: Array<{
    id: string;
    name: string;
    unit: string;
    group: string;
    color: string;
    data: number[];
  }>;
  primaryId: string;
  secondaryId: string | null;
  onSelectRow: (metricId: string) => void;
}

export const InteractiveStatementTable: React.FC<InteractiveStatementTableProps> = ({
  periods,
  metrics,
  primaryId,
  secondaryId,
  onSelectRow,
}) => {
  const isMetrics = metrics.filter(m => m.group === "income");
  const cashMetrics = metrics.filter(m => m.group === "cash");
  const ratioMetrics = metrics.filter(m => m.group === "margin" || m.group === "balance" || m.group === "valuation");

  const renderTableSection = (title: string, items: typeof metrics) => {
    if (!items.length) return null;

    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="border-b border-[#E5E7EB] px-4 py-2.5 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Table2 size={13} className="text-[#8C3B32]" />
            <h4 className="text-xs font-bold text-[#1A1A1A]">{title}</h4>
          </div>
          <span className="text-[10px] text-[#64748B]">انقر على أي سطر لإضافته للرسم البياني ↥</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="p-2.5 text-right font-bold text-[#475569] whitespace-nowrap">البند / النسبة</th>
                {periods.map((p, i) => (
                  <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {items.map(m => {
                const isPrimary = m.id === primaryId;
                const isSecondary = m.id === secondaryId;
                const isCharted = isPrimary || isSecondary;

                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectRow(m.id)}
                    className={`cursor-pointer transition-colors ${
                      isPrimary
                        ? "bg-[#EFF6FF] font-semibold"
                        : isSecondary
                        ? "bg-[#FFF7ED] font-semibold"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <td className="p-2.5 text-right text-[#0F172A] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${isCharted ? "" : "opacity-30"}`}
                          style={{ backgroundColor: m.color }}
                        />
                        <span>{m.name}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">({m.unit})</span>
                        {isCharted && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isPrimary ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#FFEDD5] text-[#C2410C]"
                            }`}
                          >
                            <TrendingUp size={9} />
                            {isPrimary ? "أساسي" : "ثانوي"}
                          </span>
                        )}
                      </div>
                    </td>
                    {m.data.map((val, i) => (
                      <td
                        key={i}
                        className={`p-2.5 text-right font-mono ${
                          val < 0 ? "text-[#DC2626]" : "text-[#1E293B]"
                        }`}
                      >
                        {val != null && val !== 0
                          ? val.toLocaleString(undefined, { maximumFractionDigits: m.unit === "SAR" ? 2 : 1 })
                          : val === 0 ? "0" : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTableSection("قائمة الدخل (SAR Millions) — اضغط للرسم", isMetrics)}
      {renderTableSection("قائمة التدفقات النقدية (SAR Millions) — اضغط للرسم", cashMetrics)}
      {renderTableSection("النسب والمؤشرات المحاسبية (Ratios & Margins)", ratioMetrics)}
    </div>
  );
};
