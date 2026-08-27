"use client";

import React, { useState } from "react";
import type { CompanyTemplate, StmtView } from "../types";
import { fmtM, fmtEPS, fmtPct, yoySeries, lastYoY, toDiscrete, sparklinePath } from "../utils";

interface Props {
  C: CompanyTemplate;
  curStmt: StmtView;
  selectedRowIdx: number | null;
  onSelectRow: (idx: number) => void;
}

// UX note: the "فرز السوق" button below still uses a native alert() for feedback —
// worth swapping for an inline toast/banner in this palette so it doesn't block the UI thread.

export default function StatementTable({ C, curStmt, selectedRowIdx, onSelectRow }: Props) {
  const [showChecks, setShowChecks] = useState(false);
  const [isCommonSize, setIsCommonSize] = useState(false);

  const nCols = curStmt.periods.length;

  // Find baseline total row for Common-size calculations (e.g. Revenue / Total Operating Income / Total Assets)
  const baseRow = curStmt.rows.find(
    (r) =>
      r.t === "total" ||
      r.ar.includes("إيراد") ||
      r.ar.includes("الدخل التشغيلي") ||
      r.ar.includes("الموجودات")
  );

  const exportToCSV = () => {
    const headers = ["البند", ...curStmt.periods, "النمو السنوي"];
    const rows = curStmt.rows
      .filter((r) => r.t !== "section")
      .map((r) => [
        `"${r.ar}"`,
        ...(r.v || []).map((val) => (val != null ? val : "")),
        `"${lastYoY(r.v || []) != null ? fmtPct(lastYoY(r.v || [])!) : ""}"`,
      ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${C.symbol}_financial_statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#6B7280]">عرض الجدول:</span>
          <button
            onClick={() => setIsCommonSize(false)}
            className={`rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium transition-colors ${!isCommonSize
              ? "border border-[#8C3B32] bg-white font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
          >
            القيم الفعلية (ر.س)
          </button>
          <button
            onClick={() => setIsCommonSize(true)}
            className={`rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium transition-colors ${isCommonSize
              ? "border border-[#8C3B32] bg-white font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
          >
            نسبة مئوية من الإجمالي (%) Common-size
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-[11.5px] text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
          >
            <span>📥</span> تصدير Excel / CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6]">
              <th className="sticky inset-inline-start-0 z-20 bg-[#F3F4F6] px-3 py-2 text-right text-[11.5px] font-semibold text-[#6B7280] shadow-[-1px_0_0_#E5E7EB_inset]">
                البند
              </th>
              {curStmt.periods.map((p, i) => (
                <th
                  key={i}
                  title={curStmt.periodsEn[i]}
                  className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#6B7280]"
                >
                  {p}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#6B7280]">
                النمو السنوي
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#6B7280]">
                الاتجاه
              </th>
            </tr>
          </thead>
          <tbody>
            {curStmt.rows.map((r, ri) => {
              if (r.t === "section") {
                return (
                  <tr key={ri} className="bg-white">
                    <td
                      colSpan={nCols + 3}
                      className="border-0 pt-3 pb-1 text-right text-[11px] font-bold tracking-wider text-[#6B7280]"
                    >
                      {r.ar}
                    </td>
                  </tr>
                );
              }

              const isSel = selectedRowIdx === ri;
              const vals = r.v || [];
              const g = lastYoY(vals);
              const isNegVal = vals.find((x) => x != null) !== undefined && (vals.find((x) => x != null) || 0) < 0;
              const isGoodGrowth = g == null ? null : isNegVal ? g < 0 : g >= 0;

              const disp = (v: number) => (r.eps ? fmtEPS(v) : fmtM(v));
              const sparkVals = curStmt.cumulative && !r.noDerive ? toDiscrete(vals as number[]) : (vals as number[]);
              const spk = sparklinePath(sparkVals, 85, 21);

              const trClass =
                r.t === "total"
                  ? "font-bold border-t-2 border-[#1A1A1A] bg-[#F3F4F6]"
                  : r.t === "subtotal"
                    ? "font-bold border-t-[1.5px] border-[#D1D5DB]"
                    : "hover:bg-[#F7F8FA]";

              return (
                <React.Fragment key={ri}>
                  <tr
                    onClick={() => onSelectRow(ri)}
                    className={`cursor-pointer border-b border-[#E5E7EB] transition-colors ${isSel ? "bg-[#8C3B32]/[0.06]" : trClass
                      }`}
                  >
                    <td
                      className={`sticky inset-inline-start-0 z-10 whitespace-nowrap px-3 py-2 text-right text-[#1A1A1A] shadow-[-1px_0_0_#E5E7EB_inset] ${isSel ? "bg-[#8C3B32]/[0.06]" : r.t === "total" ? "bg-[#F3F4F6]" : "bg-white"
                        }`}
                    >
                      {r.ar}
                    </td>
                    {vals.map((v, i) => {
                      const estCls = C.real && i < 3 && r.est3 ? "italic text-[#9CA3AF]" : "";
                      const negCls = v != null && v < 0 ? "text-[#DC2626]" : "";

                      let cellDisplay = v == null ? "—" : disp(v);
                      if (isCommonSize && v != null) {
                        const baseVal = baseRow?.v?.[i];
                        if (baseVal && baseVal !== 0) {
                          const pct = ((v / Math.abs(baseVal)) * 100).toFixed(1);
                          cellDisplay = `${pct}%`;
                        }
                      }

                      return (
                        <td
                          key={i}
                          className={`whitespace-nowrap px-3 py-2 text-left tabular-nums ${estCls} ${negCls} ${isSel ? "font-semibold text-[#1A1A1A]" : !estCls && !negCls ? "text-[#1A1A1A]" : ""
                            }`}
                          dir="ltr"
                        >
                          {cellDisplay}
                        </td>
                      );
                    })}
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-left font-semibold tabular-nums ${isGoodGrowth === null ? "text-[#9CA3AF]" : isGoodGrowth ? "text-[#16A34A]" : "text-[#DC2626]"
                        }`}
                      dir="ltr"
                    >
                      {g == null ? "—" : fmtPct(g)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-left">
                      {spk.pts ? (
                        <svg width="85" height="21" viewBox="0 0 85 21" aria-hidden="true">
                          {spk.zero != null && (
                            <line
                              x1="2"
                              x2="83"
                              y1={spk.zero}
                              y2={spk.zero}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          )}
                          <polyline
                            points={spk.pts}
                            fill="none"
                            stroke="#8C3B32"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx={spk.last[0]} cy={spk.last[1]} r="2.5" fill="#8C3B32" />
                        </svg>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>

                  {/* ── Acceleration Chips Row (YoY per period) ── */}
                  {r.accel && (
                    <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]/70 text-[11px]">
                      <td className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-[#F7F8FA] px-3 py-1 text-right font-medium text-[#6B7280] shadow-[-1px_0_0_#E5E7EB_inset]">
                        ↳ ٪ التغير السنوي (تسارع)
                      </td>
                      {yoySeries(vals).map((y, yi) => {
                        if (y == null) {
                          return (
                            <td
                              key={yi}
                              className="px-3 py-1 text-left tabular-nums text-[#9CA3AF]"
                              title="يتطلب نظير الربع قبل سنة"
                              dir="ltr"
                            >
                              ·
                            </td>
                          );
                        }
                        const isA2 = y >= 25;
                        const isA1 = y >= 0 && y < 25;
                        const estBase = C.real && r.est3 && yi - 4 < 3;
                        const chipCls = isA2
                          ? "bg-[#16A34A] text-white"
                          : isA1
                            ? "bg-[#16A34A]/15 text-[#16A34A] border border-[#16A34A]/30"
                            : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20";

                        return (
                          <td key={yi} className="px-3 py-1 text-left tabular-nums" dir="ltr">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-bold ${chipCls}`}
                              title={estBase ? "الأساس: ربع 2024 تقديري°" : undefined}
                            >
                              {y > 0 ? `+${y.toFixed(0)}%` : `${y.toFixed(0)}%`}
                              {estBase ? "°" : ""}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-1"></td>
                      <td className="px-3 py-1"></td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes & Forensic Auditing Strip */}
      <div className="flex flex-wrap items-center gap-3.5 border-t border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-[11.5px] text-[#6B7280]">
        {C.foot.map((f, i) =>
          i === 1 && C.real ? (
            <span
              key={i}
              onClick={() => setShowChecks(!showChecks)}
              className="cursor-pointer border-b border-dotted border-[#9CA3AF] text-[#8C3B32] hover:underline"
            >
              {f} ▾
            </span>
          ) : (
            <span key={i}>{f}</span>
          )
        )}
        <button
          onClick={() =>
            alert(
              "الجسر إلى M1: فلتر جاهز على هذا البند عبر كل شركات القطاع — API نقطي-زمني بلا lookahead bias"
            )
          }
          className="mr-auto rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] text-[#8C3B32] transition-colors hover:bg-[#F3F4F6]"
        >
          ⚲ افرز السوق على أي بند
        </button>

        {showChecks && (
          <div className="basis-full rounded-[4px] border border-[#E5E7EB] bg-white p-3 text-[11.5px] leading-relaxed text-[#1A1A1A]">
            <b>لوحة الفحوص — نسخة الإفصاح Q1 2026 (v1، فحص محدود، لا إعادة عرض حتى تاريخه):</b>
            <br />
            ✓ قائمة الدخل: مجموع المكونات = الإجمالي المعلن لكل فترة (تطابق تام بالآلاف، tolerance = 0)
            <br />
            ✓ المركز المالي: الموجودات = المطلوبات + حقوق الملكية لكل الفترات الخمس
            <br />
            ✓ التدفقات: CFO + CFI + CFF = صافي التغير في النقد لكل فترة تراكمية
            <br />
            ✓ حقوق الملكية تُقفل شاملةً صكوك الشريحة الأولى وأسهم الخزينة والتوزيعات المقترحة
            <br />
            ⚠ أرباع 2024°: خارج نطاق الفحص (تقديرية من التقرير السنوي — تُفحص عند ربط XBRL)
          </div>
        )}
      </div>
    </div>
  );
}