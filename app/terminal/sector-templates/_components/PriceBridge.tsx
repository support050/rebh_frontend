"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { yoySeries } from "../utils";
import type { CompanyTemplate } from "../types";

interface Props {
  priceData: number[];
  priceLoading?: boolean;
  C: CompanyTemplate;
}

export default function PriceBridge({ priceData, priceLoading, C }: Props) {
  const earnIdx = [18, 42, 66, 92];

  const { chartData, isPriceAboveMa, accelBadge, hasData } = useMemo(() => {
    const p = priceData;
    const n = p.length;
    if (n < 2) {
      return {
        chartData: [],
        isPriceAboveMa: null,
        accelBadge: { text: "", up: true },
        hasData: false,
      };
    }

    const data = [];
    const ma: number[] = [];

    for (let i = 0; i < n; i++) {
      const s = Math.max(0, i - 49);
      const seg = p.slice(s, i + 1);
      const currentMa = seg.reduce((a, b) => a + b, 0) / seg.length;
      ma.push(currentMa);

      data.push({
        index: i + 1,
        price: Number(p[i].toFixed(2)),
        ma50: Number(currentMa.toFixed(2)),
        isEarnings: earnIdx.includes(i),
      });
    }

    const above = n >= 51 ? p[n - 1] > ma[n - 1] : null;

    // Acceleration badge from net income row
    const net = C.rows.find((r) => r.net) || C.rows.find((r) => r.ar === "صافي ربح الفترة");
    let badgeText = "";
    let badgeUp = true;
    if (net?.v) {
      const ys = yoySeries(net.v).filter((x): x is number => x != null);
      if (ys.length >= 2) {
        const lastg = ys[ys.length - 1];
        const accel = ys.length >= 2 && lastg > ys[ys.length - 2];
        badgeUp = lastg >= 0;
        badgeText = `أرباح ${lastg >= 0 ? "+" : "−"}${Math.abs(lastg).toFixed(0)}% ${
          accel ? "متسارعة ↑" : "— الوتيرة تتباطأ"
        }`;
      }
    }

    return {
      chartData: data,
      isPriceAboveMa: above,
      accelBadge: { text: badgeText, up: badgeUp },
      hasData: true,
    };
  }, [priceData, C.rows]);

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-[#6B7280]">
        <b className="text-[13px] text-[#1A1A1A]">جسر السعر</b>
        <span>· ▮ علامات إعلان النتائج على السعر</span>

        {accelBadge.text && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11.5px] font-bold ${
              accelBadge.up ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"
            }`}
          >
            {accelBadge.text}
          </span>
        )}

        {isPriceAboveMa !== null && (
          <span
            className={`text-[11.5px] font-semibold ${
              isPriceAboveMa ? "text-[#16A34A]" : "text-[#DC2626]"
            }`}
          >
            {isPriceAboveMa ? "✓ السعر فوق MA50 — يؤكد" : "✗ السعر تحت MA50 — لا يؤكد بعد"}
          </span>
        )}

        <span className="mr-auto text-[10.5px]">
          MA50 <span style={{ borderBottom: "2px dashed #E5E7EB" }}>— —</span> · بيانات سعر حقيقية · تفاعلي Hover
        </span>
      </div>

      {priceLoading ? (
        <div className="mt-3 h-[120px] animate-pulse rounded bg-[#F3F4F6]" />
      ) : !hasData ? (
        <div className="mt-3 flex h-[120px] items-center justify-center text-[12px] text-[#9CA3AF]">
          لا تتوفر بيانات سعر تاريخية لهذه الشركة
        </div>
      ) : (
        <div className="mt-3 h-[130px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sectorPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C3B32" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#8C3B32" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

              <XAxis dataKey="index" hide />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => Number(v).toFixed(1)}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div
                        dir="rtl"
                        className="rounded border border-[#E5E7EB] bg-white p-2.5 shadow-lg text-[11.5px]"
                      >
                        <div className="font-semibold text-[#1A1A1A]">
                          جلسة تداول #{d.index}{" "}
                          {d.isEarnings && (
                            <span className="mr-1 rounded bg-[#8C3B32] px-1 py-0.5 text-[9.5px] text-white">
                              إعلان نتائج
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 text-[#6B7280]">
                          <span>سعر الإغلاق:</span>
                          <b className="text-[#8C3B32] tabular-nums" dir="ltr">
                            {d.price.toFixed(2)} ر.س
                          </b>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#6B7280]">
                          <span>متوسط 50 يوم (MA50):</span>
                          <b className="text-[#6B7280] tabular-nums" dir="ltr">
                            {d.ma50.toFixed(2)} ر.س
                          </b>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Price Area */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="#8C3B32"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sectorPriceGrad)"
                dot={false}
              />

              {/* MA50 Line */}
              <Line
                type="monotone"
                dataKey="ma50"
                stroke="#9CA3AF"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export { PriceBridge };