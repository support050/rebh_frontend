"use client";

import { useState } from "react";
import type { CompanyTemplate, StmtView } from "../types";
import { fmtM, fmtEPS, fmtPct, yoySeries, lastYoY, toDiscrete, sparklinePath } from "../utils";

interface Props {
  C: CompanyTemplate;
  curStmt: StmtView;
  selectedRowIdx: number | null;
  onSelectRow: (idx: number) => void;
}

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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a19]">
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2c2c2a] px-4 py-2.5 bg-[#171716]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#898781]">عرض الجدول:</span>
          <button
            onClick={() => setIsCommonSize(false)}
            className={`rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              !isCommonSize
                ? "bg-[#2c2c2a] text-white"
                : "text-[#898781] hover:text-white"
            }`}
          >
            القيم الفعلية (ر.س)
          </button>
          <button
            onClick={() => setIsCommonSize(true)}
            className={`rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              isCommonSize
                ? "bg-[#2c2c2a] text-white"
                : "text-[#898781] hover:text-white"
            }`}
          >
            نسبة مئوية من الإجمالي (%) Common-size
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 rounded border border-white/10 bg-[#222220] px-3 py-1 text-[11.5px] text-[#c3c2b7] transition-colors hover:bg-[#2c2c2a] hover:text-white"
          >
            <span>📥</span> تصدير Excel / CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b-[1.5px] border-[#383835]">
              <th className="sticky inset-inline-start-0 z-20 bg-[#1a1a19] px-3 py-2 text-right text-[11.5px] font-semibold text-[#898781] shadow-[-1px_0_0_#2c2c2a_inset]">
                البند
              </th>
              {curStmt.periods.map((p, i) => (
                <th
                  key={i}
                  title={curStmt.periodsEn[i]}
                  className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#898781]"
                >
                  {p}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#898781]">
                النمو السنوي
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[11.5px] font-semibold text-[#898781]">
                الاتجاه
              </th>
            </tr>
          </thead>
          <tbody>
            {curStmt.rows.map((r, ri) => {
              if (r.t === "section") {
                return (
                  <tr key={ri} className="bg-[#1a1a19]">
                    <td
                      colSpan={nCols + 3}
                      className="border-0 pt-3 pb-1 text-right text-[11px] font-bold tracking-wider text-[#898781]"
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
                  ? "font-bold border-t-2 border-white bg-[#232322]"
                  : r.t === "subtotal"
                  ? "font-bold border-t-[1.5px] border-[#383835]"
                  : "hover:bg-[#222220]";

              return (
                <tr
                  key={ri}
                  onClick={() => onSelectRow(ri)}
                  className={`cursor-pointer border-b border-[#2c2c2a] transition-colors ${
                    isSel ? "bg-[#184f95]/30" : trClass
                  }`}
                >
                  <td className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-[#1a1a19] px-3 py-2 text-right text-[#fff] shadow-[-1px_0_0_#2c2c2a_inset]">
                    {r.ar}
                  </td>
                  {vals.map((v, i) => {
                    const estCls = C.real && i < 3 && r.est3 ? "italic text-[#898781]" : "";
                    
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
                        className={`whitespace-nowrap px-3 py-2 text-left tabular-nums ${estCls} ${
                          isSel ? "text-white font-semibold" : ""
                        }`}
                        dir="ltr"
                      >
                        {cellDisplay}
                      </td>
                    );
                  })}
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-left font-semibold tabular-nums ${
                      isGoodGrowth === null ? "text-[#898781]" : isGoodGrowth ? "text-[#0ca30c]" : "text-[#e66767]"
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
                            stroke="#383835"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        )}
                        <polyline
                          points={spk.pts}
                          fill="none"
                          stroke="#3987e5"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx={spk.last[0]} cy={spk.last[1]} r="2.5" fill="#3987e5" />
                      </svg>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes & Forensic Auditing Strip */}
      <div className="flex flex-wrap items-center gap-3.5 border-t border-[#2c2c2a] px-4 py-3 text-[11.5px] text-[#898781]">
        {C.foot.map((f, i) =>
          i === 1 && C.real ? (
            <span
              key={i}
              onClick={() => setShowChecks(!showChecks)}
              className="cursor-pointer border-b border-dotted border-[#898781] text-[#3987e5] hover:underline"
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
          className="mr-auto rounded-lg border border-white/10 bg-[#1a1a19] px-3 py-1 text-[12px] text-[#3987e5] transition-colors hover:bg-[#222220]"
        >
          ⚲ افرز السوق على أي بند
        </button>

        {showChecks && (
          <div className="basis-full rounded-lg border border-[#2c2c2a] bg-[#141413] p-3 text-[11.5px] leading-relaxed text-[#c3c2b7]">
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
