"use client";

import React from "react";

interface Props {
  isBank: boolean;
  rev: number[];
  op: number[];
  net: number[];
  eps: number[];
  gp?: number[] | null;
  periodsQ: string[];
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const MUTED_BAND = "bg-[#F3F4F6]";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function pctS(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

function yoy(a: number[]) {
  return a.map((v, i) =>
    i >= 4 && a[i - 4] && v != null && Math.sign(a[i - 4]) === Math.sign(v)
      ? (Math.abs(v) / Math.abs(a[i - 4]) - 1) * 100
      : null
  );
}

export default function QuarterlyIncomeStatementsTab({
  isBank,
  rev,
  op,
  net,
  eps,
  gp,
  periodsQ,
}: Props) {
  const rows = isBank
    ? [
        ["دخل العمولات الخاصة", rev, ""],
        ["الربح من النشاطات التشغيلية", op, "font-bold border-t border-[#E5E7EB]"],
        ["صافي ربح الفترة", net, `font-bold border-t border-b ${MUTED_BAND}`],
        ["ربحية السهم (ريال)", eps, ""],
      ]
    : [
        ["الإيرادات", rev, ""],
        ["إجمالي الربح", gp || [], "font-bold border-t border-[#E5E7EB]"],
        ["ربح العمليات", op, "font-bold border-t border-[#E5E7EB]"],
        ["صافي ربح الفترة", net, `font-bold border-t border-b ${MUTED_BAND}`],
        ["ربحية السهم (ريال)", eps, ""],
      ];

  return (
    <div className={`${PANEL} overflow-hidden`}>
      <h3 className="px-4 pt-3 text-[13px] font-bold text-[#1A1A1A]">قائمة الدخل — ربعي (9 أرباع حقيقية)</h3>
      <div className="px-4 pb-2 text-[10.5px] text-[#6B7280]">
        القيم بملايين الريالات · الصف المميز = بند التسارع · النسخة الكاملة للقوائم الأربعة في نموذج القوائم
        التفصيلي
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className={`border-b border-[#E5E7EB] ${MUTED_BAND}`}>
              <th
                className={`sticky inset-inline-start-0 z-10 ${MUTED_BAND} px-3 py-2 text-right text-[10.5px] font-semibold text-[#6B7280]`}
              >
                البند
              </th>
              {periodsQ.map((p) => (
                <th key={p} className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#6B7280]">
                  {p}
                </th>
              ))}
              <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#6B7280]">YoY أخير</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([lbl, series, cls], idx) => {
              const sArr = series as number[];
              const gArr = yoy(sArr);
              const lastG = gArr[gArr.length - 1];

              return (
                <tr key={idx} className={`border-b border-[#E5E7EB] hover:bg-[#F3F4F6] ${cls}`}>
                  <td className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-right text-[#1A1A1A] shadow-[-1px_0_0_#E5E7EB_inset]">
                    {lbl as string}
                  </td>
                  {sArr.map((v, sIdx) => (
                    <td
                      key={sIdx}
                      className={`whitespace-nowrap px-2.5 py-2 text-left tabular-nums ${
                        v < 0 ? "text-[#DC2626]" : "text-[#1A1A1A]"
                      }`}
                      dir="ltr"
                    >
                      {v == null ? "—" : Math.abs(v) < 50 ? Number(v).toFixed(2) : fmt(v, 0)}
                    </td>
                  ))}
                  <td
                    className={`whitespace-nowrap px-2.5 py-2 text-left font-bold tabular-nums ${
                      lastG != null && lastG >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                    }`}
                    dir="ltr"
                  >
                    {lastG == null ? "—" : pctS(lastG)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
