"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Props {
  netSeries: number[];
  lastGn: number | null;
  gN: (number | null)[];
  periods?: string[];
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

const DEFAULT_PERIODS = ["Q1'24", "Q2'24", "Q3'24", "Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26"];

export default function QuarterlyNetProfitChart({
  netSeries,
  lastGn,
  gN,
  periods = DEFAULT_PERIODS,
}: Props) {
  const chartData = netSeries.map((val, idx) => ({
    period: periods[idx] || `Q${idx + 1}`,
    net: val,
    yoy: gN[idx] ?? null,
  }));

  const hasNegative = netSeries.some((v) => v < 0);

  return (
    <div className={`${PANEL} p-3.5`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#6B7280]">
        <div>
          <b className="text-[13px] text-[#1A1A1A]">مسار صافي الربح الربعي (9 أرباع)</b>
          <span className="mr-2">
            نمو سنوي آخر ربع: <b className="text-[#1A1A1A] tabular-nums">{pctS(lastGn)}</b>{" "}
            <span
              className={`font-semibold ${
                gN.length > 1 && (lastGn || 0) > (gN[gN.length - 2] || 0)
                  ? "text-[#16A34A]"
                  : "text-[#DC2626]"
              }`}
            >
              {gN.length > 1 && (lastGn || 0) > (gN[gN.length - 2] || 0)
                ? "متسارع ↑"
                : "— في مسار متراجع/مستقر"}
            </span>
          </span>
        </div>
        <span className="text-[10.5px] text-[#9CA3AF]">
          بيانات XBRL الرسمية · ملايين الريالات · تفاعلي Hover
        </span>
      </div>

      <div className="mt-3 h-[130px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="netProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8C3B32" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#8C3B32" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10, fontWeight: 500 }}
              dy={4}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              tickFormatter={(v) => fmt(v, 0)}
              domain={["auto", "auto"]}
            />

            {hasNegative && <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="3 3" />}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div
                      dir="rtl"
                      className="rounded border border-[#E5E7EB] bg-white p-2.5 shadow-lg text-[11.5px]"
                    >
                      <div className="font-bold text-[#1A1A1A]">{d.period}</div>
                      <div className="mt-1 flex items-center justify-between gap-4 text-[#6B7280]">
                        <span>صافي الربح:</span>
                        <b className="text-[#8C3B32] tabular-nums" dir="ltr">
                          {fmt(d.net, 1)} م.ر
                        </b>
                      </div>
                      {d.yoy != null && (
                        <div className="flex items-center justify-between gap-4 text-[#6B7280]">
                          <span>النمو السنوي:</span>
                          <b
                            className={`tabular-nums ${
                              d.yoy >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                            }`}
                            dir="ltr"
                          >
                            {pctS(d.yoy)}
                          </b>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="net"
              stroke="#8C3B32"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#netProfitGrad)"
              activeDot={{
                r: 5,
                fill: "#8C3B32",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
              dot={{
                r: 3.5,
                fill: "#8C3B32",
                stroke: "#FFFFFF",
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
