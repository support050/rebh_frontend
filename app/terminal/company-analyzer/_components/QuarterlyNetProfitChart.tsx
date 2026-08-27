"use client";

import React from "react";

interface Props {
  netSeries: number[];
  lastGn: number | null;
  gN: (number | null)[];
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function pctS(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

export default function QuarterlyNetProfitChart({ netSeries, lastGn, gN }: Props) {
  const W = 1180;
  const H = 92;
  const pB = 16;
  const pT = 10;
  const pS = 20;
  const pE = 20;
  const mn = netSeries.length > 0 ? Math.min(...netSeries) : 0;
  const mx = netSeries.length > 0 ? Math.max(...netSeries) : 1;
  const rgVal = mx - mn || 1;
  const X = (i: number) => pS + (i / Math.max(netSeries.length - 1, 1)) * (W - pS - pE);
  const Y = (v: number) => pT + (1 - (v - mn) / rgVal) * (H - pT - pB);

  return (
    <div className={`${PANEL} p-3.5`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#6B7280]">
        <div>
          <b className="text-[13px] text-[#1A1A1A]">مسار صافي الربح الربعي (9 أرباع)</b>
          <span className="mr-2">
            نمو سنوي آخر ربع: <b className="text-[#1A1A1A] tabular-nums">{pctS(lastGn)}</b>{" "}
            {gN.length > 1 && (lastGn || 0) > (gN[gN.length - 2] || 0) ? "متسارع ↑" : "— في مسار متراجع/مستقر"}
          </span>
        </div>
        <span className="text-[10.5px] text-[#9CA3AF]">بيانات XBRL الرسمية · ملايين الريالات</span>
      </div>
      <svg width="100%" height="92" viewBox={`0 0 ${W} ${H}`} className="mt-2">
        {/* Horizontal zero line if applicable */}
        {mn < 0 && mx > 0 && (
          <line
            x1={pS}
            y1={Y(0)}
            x2={W - pE}
            y2={Y(0)}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
        {/* Real Net Profit Trend Line */}
        <polyline
          points={netSeries.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}
          fill="none"
          stroke="#8C3B32"
          strokeWidth="2.5"
        />
        {/* Data Points */}
        {netSeries.map((val, idx) => (
          <g key={idx}>
            <circle
              cx={X(idx)}
              cy={Y(val)}
              r="4"
              fill="#8C3B32"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x={X(idx)}
              y={Y(val) - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#1A1A1A"
              fontWeight="bold"
            >
              {fmt(val, 0)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
