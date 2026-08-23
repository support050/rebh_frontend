"use client";

import { Calendar } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

/** Format number with commas */
function fmtNum(v: number | null | undefined): string {
  if (v == null) return "—";
  return v < 0 ? `(${Math.abs(v).toLocaleString()})` : v.toLocaleString();
}

/** Calculate YoY growth % — Q vs Q-4 */
function yoy(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  if ((cur > 0) !== (prev > 0)) return null;
  return ((Math.abs(cur) / Math.abs(prev)) - 1) * 100;
}

/**
 * Recent Quarters Table — shows last 9 quarters with YoY badges
 * Matches the HTML reference: Q1'24 through Q1'26
 */
export default function ForensicRecentQuartersTable({ data }: Props) {
  const qObj = data.quarters;
  const periods = qObj?.periods || data.periods_q || [];
  const revAll = qObj?.rev || data.rev || [];
  const gpAll = qObj?.gp || data.gp || [];
  const netAll = qObj?.net || data.net || [];

  // Take last 9 quarters (or whatever is available)
  const qCount = Math.min(9, periods.length);
  const qPeriods = periods.slice(-qCount);
  const qRev = revAll.slice(-qCount);
  const qGp = gpAll.length > 0 ? gpAll.slice(-qCount) : [];
  const qNet = netAll.slice(-qCount);

  if (qPeriods.length === 0) return null;

  const rows: { label: string; values: number[]; isTotal?: boolean }[] = [
    { label: "الإيرادات", values: qRev },
  ];
  if (qGp.length > 0) {
    rows.push({ label: "إجمالي الربح", values: qGp });
  }
  rows.push({ label: "صافي الربح", values: qNet, isTotal: true });

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3987e5]" />
          الأرباع الأخيرة (الفعلية)
          <span className="text-xs font-normal text-[#898781]">
            · بملايين الريالات · الربع الرابع محسوب°: السنة − 9 أشهر
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#383835] bg-[#141413] text-[#898781]">
              <th className="py-2.5 px-3 text-right min-w-[100px]">البند</th>
              {qPeriods.map((p, idx) => (
                <th key={idx} className="py-2.5 px-3 text-left whitespace-nowrap">
                  {idx === qPeriods.length - 1 ? <b>{p}</b> : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c2c2a] tabular-nums">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={row.isTotal ? "border-t-2 border-white bg-[#232322]" : ""}
              >
                <td className={`py-2.5 px-3 ${row.isTotal ? "font-bold text-white" : "font-medium text-white"}`}>
                  {row.label}
                </td>
                {row.values.map((v, i) => {
                  // YoY: compare with 4 quarters back
                  const yoyVal = i >= 4 ? yoy(v, row.values[i - 4]) : null;
                  const isLast = i === row.values.length - 1;

                  return (
                    <td
                      key={i}
                      className={`py-2.5 px-3 text-left ${
                        row.isTotal ? (v >= 0 ? "font-bold text-[#38ef7d]" : "font-bold text-[#e66767]") : ""
                      }`}
                    >
                      {isLast ? <b>{fmtNum(v)}</b> : fmtNum(v)}
                      {yoyVal != null && (
                        <span className={`text-[10px] mr-1 ${yoyVal >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"}`}>
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
      {/* Growth summary footer */}
      {qNet.length >= 5 && (
        <div className="px-4 py-2.5 border-t border-white/5 text-[11px] text-[#898781]">
          نمو آخر ربع سنوياً: إيرادات{" "}
          {(() => {
            const revYoY = yoy(qRev[qRev.length - 1], qRev.length >= 5 ? qRev[qRev.length - 5] : null);
            return revYoY != null ? (
              <b className={revYoY >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"}>
                {revYoY >= 0 ? "+" : ""}{revYoY.toFixed(1)}%
              </b>
            ) : "—";
          })()}{" "}
          · ربح{" "}
          {(() => {
            const netYoY = yoy(qNet[qNet.length - 1], qNet.length >= 5 ? qNet[qNet.length - 5] : null);
            return netYoY != null ? (
              <b className={netYoY >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"}>
                {netYoY >= 0 ? "+" : ""}{netYoY.toFixed(1)}%
              </b>
            ) : "—";
          })()}
        </div>
      )}
    </div>
  );
}
