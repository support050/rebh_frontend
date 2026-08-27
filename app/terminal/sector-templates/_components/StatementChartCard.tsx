"use client";

import { useState } from "react";
import type { RowData, StmtView } from "../types";
import { fmtM, fmtEPS, toDiscrete } from "../utils";

interface Props {
  chartRow: RowData | null;
  curStmt: StmtView;
  isReal: boolean;
}

export default function StatementChartCard({ chartRow, curStmt, isReal }: Props) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    textAr: string;
    inBand: string;
    valText: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    textAr: "",
    inBand: "",
    valText: "",
  });

  if (!chartRow || !chartRow.v) {
    return (
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 text-center text-[#6B7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        لا توجد بيانات متاحة لهذا البند
      </div>
    );
  }

  const isCum = curStmt.cumulative && !chartRow.noDerive;
  const vals: number[] = isCum
    ? toDiscrete(chartRow.v as number[])
    : (chartRow.v as number[]).slice();

  const perAr = isCum
    ? ["الربع الأول 2025", "الربع الثاني 2025", "الربع الثالث 2025", "الربع الرابع 2025", "الربع الأول 2026"]
    : curStmt.periods;
  const perEn = isCum
    ? ["Q1'25°", "Q2'25°", "Q3'25°", "Q4'25°", "Q1'26"]
    : curStmt.periodsEn;

  const CW = 1100;
  const CH = 215;
  const cPadT = 14;
  const cPadB = 28;
  const cPadS = 8;
  const cPadE = 60;

  const maxV = Math.max(...vals.map((v) => Math.abs(v ?? 0)), 1e-9);
  const hasNeg = vals.some((v) => v != null && v < 0);
  const hasPos = vals.some((v) => v != null && v > 0);
  const zeroY =
    hasNeg && hasPos
      ? cPadT + (CH - cPadT - cPadB) / 2
      : hasNeg && !hasPos
        ? cPadT
        : CH - cPadB;

  const scale = (v: number) =>
    (Math.abs(v) / maxV) * (CH - cPadT - cPadB) / (hasNeg && hasPos ? 2 : 1);

  const n = vals.length;
  const slotW = (CW - cPadS - cPadE) / (n || 1);
  const barW = Math.min(slotW * 0.5, 48);

  const axF = (g: number) =>
    chartRow.eps
      ? g.toFixed(2)
      : (g / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 });

  // Prior 4 quarters band (الشريط الرمادي على آخر عمود = مدى آخر 4 أرباع°)
  const prior = vals.slice(n - 5, n - 1).filter((v): v is number => v != null);
  const showBand = prior.length === 4 && !hasNeg;
  const lo = showBand ? Math.min(...prior) : 0;
  const hi = showBand ? Math.max(...prior) : 0;
  const bandX = cPadS + slotW * (n - 1) + (slotW - barW) / 2;
  const yHi = CH - cPadB - scale(hi);
  const yLo = CH - cPadB - scale(lo);

  return (
    <div className="relative rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center justify-between pb-2">
        <h3 className="text-[14px] font-bold text-[#1A1A1A]">
          {chartRow.ar}
          {isCum
            ? " — ربعي (محسوب° من التراكمي المعلن)"
            : curStmt.cumulative
              ? " — كما ورد"
              : " — ربعي"}
        </h3>
        <span className="text-[11.5px] text-[#9CA3AF]">
          اضغط أي بند لعرضه · الشريط الرمادي على آخر عمود = مدى آخر 4 أرباع° (بديل التقديرات)
        </span>
      </div>

      <div className="relative">
        {/* Interactive Tooltip */}
        {tooltip.visible && (
          <div
            className="pointer-events-none absolute z-20 whitespace-nowrap rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          >
            <div className="text-[#6B7280]">
              {tooltip.textAr}
              {tooltip.inBand}
            </div>
            <div className="text-[13px] font-bold tabular-nums" dir="ltr">
              {tooltip.valText}
            </div>
          </div>
        )}

        <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`}>
          {/* Grid lines & axis labels */}
          {[0, 1, 2].map((i) => {
            const gv = maxV * (1 - i / 2);
            const gy =
              hasNeg && hasPos
                ? zeroY - scale(gv)
                : CH - cPadB - scale(gv);
            return (
              <g key={i}>
                <line x1={cPadS} x2={CW - cPadE} y1={gy} y2={gy} stroke="#F3F4F6" />
                <text x={CW - cPadE + 8} y={gy + 4} fill="#9CA3AF" fontSize="10.5">
                  {axF(gv)}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={cPadS}
            x2={CW - cPadE}
            y1={zeroY}
            y2={zeroY}
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />

          {/* Range Band (Gray) */}
          {showBand && (
            <rect
              x={bandX - 6}
              y={yHi}
              width={barW + 12}
              height={Math.max(yLo - yHi, 2)}
              fill="#F3F4F6"
              rx="3"
            />
          )}

          {/* Bars */}
          {vals.map((v, i) => {
            if (v == null) return null;
            const x = cPadS + slotW * i + (slotW - barW) / 2;
            const h = Math.max(scale(v), 2);
            const est = isReal && i < 3 && chartRow.est3 && !isCum;
            const fill = v >= 0 ? "#8C3B32" : "#DC2626";
            const op = est ? 0.45 : 1;

            const d =
              v >= 0
                ? `M${x},${zeroY} L${x},${zeroY - h + 4} Q${x},${zeroY - h} ${x + 4},${zeroY - h} L${x + barW - 4},${zeroY - h} Q${x + barW},${zeroY - h} ${x + barW},${zeroY - h + 4} L${x + barW},${zeroY} Z`
                : `M${x},${zeroY} L${x},${zeroY + h - 4} Q${x},${zeroY + h} ${x + 4},${zeroY + h} L${x + barW - 4},${zeroY + h} Q${x + barW},${zeroY + h} ${x + barW},${zeroY + h - 4} L${x + barW},${zeroY} Z`;

            return (
              <g key={i}>
                <path
                  d={d}
                  fill={fill}
                  opacity={op}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    const inBand =
                      prior.length === 4 && i === n - 1
                        ? v > Math.max(...prior)
                          ? " · فوق مدى آخر 4 أرباع°"
                          : v < Math.min(...prior)
                            ? " · تحت المدى°"
                            : " · داخل المدى°"
                        : "";
                    setTooltip({
                      visible: true,
                      x: e.clientX - rect.left + 14,
                      y: e.clientY - rect.top - 14,
                      textAr: perAr[i],
                      inBand,
                      valText: chartRow.eps ? fmtEPS(v) : `${fmtM(v)} مليون ر.س`,
                    });
                  }}
                  onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                />
                <text
                  x={x + barW / 2}
                  y={CH - 7}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="10"
                >
                  {perEn[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}