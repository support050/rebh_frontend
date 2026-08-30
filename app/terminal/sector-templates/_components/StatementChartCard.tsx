"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import type { RowData, StmtView } from "../types";
import { fmtM, fmtEPS, toDiscrete } from "../utils";

interface Props {
  chartRow: RowData | null;
  curStmt: StmtView;
  isReal: boolean;
}

export default function StatementChartCard({ chartRow, curStmt, isReal }: Props) {
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

  const n = vals.length;
  const prior = vals.slice(Math.max(0, n - 5), Math.max(0, n - 1)).filter((v): v is number => v != null);

  const chartData = vals.map((v, i) => {
    let inBand = "";
    if (prior.length === 4 && i === n - 1 && v != null) {
      const maxP = Math.max(...prior);
      const minP = Math.min(...prior);
      inBand = v > maxP ? " · فوق مدى آخر 4 أرباع°" : v < minP ? " · تحت المدى°" : " · داخل المدى°";
    }

    return {
      periodEn: perEn[i] || `P${i + 1}`,
      periodAr: perAr[i] || `الفترة ${i + 1}`,
      value: v,
      isEst: isReal && i < 3 && Boolean(chartRow.est3) && !isCum,
      inBand,
    };
  });

  const hasNegative = vals.some((v) => v != null && v < 0);

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
          اضغط أي بند في الجدول لتغيير الشارت · تفاعلي Hover
        </span>
      </div>

      <div className="mt-2 h-[210px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 18, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

            <XAxis
              dataKey="periodEn"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10.5, fontWeight: 500 }}
              dy={4}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              tickFormatter={(v) =>
                chartRow.eps
                  ? v.toFixed(2)
                  : v >= 1000
                  ? `${(v / 1000).toFixed(1)}B`
                  : Math.abs(v) >= 1
                  ? `${Math.round(v)}M`
                  : v.toFixed(1)
              }
              domain={["auto", "auto"]}
            />

            {hasNegative && <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1.5} />}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div
                      dir="rtl"
                      className="rounded border border-[#E5E7EB] bg-white p-2.5 shadow-lg text-[12px]"
                    >
                      <div className="font-bold text-[#1A1A1A]">
                        {d.periodAr} ({d.periodEn})
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-4 text-[#6B7280]">
                        <span>القيمة:</span>
                        <b className="text-[#8C3B32] tabular-nums" dir="ltr">
                          {chartRow.eps ? fmtEPS(d.value) : `${fmtM(d.value)} مليون ر.س`}
                        </b>
                      </div>
                      {d.inBand && (
                        <div className="text-[11px] text-[#6B7280]">{d.inBand}</div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: any) =>
                  v == null
                    ? ""
                    : chartRow.eps
                    ? Number(v).toFixed(2)
                    : Math.abs(Number(v)) >= 1000
                    ? `${(Number(v) / 1000).toFixed(1)}B`
                    : fmtM(Number(v))
                }
                style={{ fill: "#6B7280", fontSize: 10, fontWeight: 600 }}
              />
              {chartData.map((entry, index) => {
                const isPositive = (entry.value ?? 0) >= 0;
                const fill = isPositive ? "#8C3B32" : "#DC2626";
                const opacity = entry.isEst ? 0.45 : 1;
                return <Cell key={`cell-${index}`} fill={fill} fillOpacity={opacity} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}