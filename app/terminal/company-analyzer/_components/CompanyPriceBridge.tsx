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

interface Props {
  sym: string;
  isBank: boolean;
  netSeries: number[];
  priceData?: number[];
  priceLoading?: boolean;
}

function yoy(a: number[]) {
  return a.map((v, i) =>
    i >= 4 && a[i - 4] && v != null && Math.sign(a[i - 4]) === Math.sign(v)
      ? (Math.abs(v) / Math.abs(a[i - 4]) - 1) * 100
      : null
  );
}

function mkSyntheticPrice(b: number, t: number, a: number, c: number) {
  const r: number[] = [];
  for (let i = 0; i < 110; i++) {
    r.push(b + t * i + a * Math.sin(i / c) + ((i % 7) - 3) * b * 0.002);
  }
  return r;
}

export default function CompanyPriceBridge({
  isBank,
  netSeries,
  priceData,
  priceLoading,
}: Props) {
  const earnIdx = [18, 42, 66, 92];

  // If live priceData is provided and has points, use it; otherwise use exact synthetic formula
  const prices = useMemo(() => {
    if (priceData && priceData.length >= 10) {
      return priceData;
    }
    return isBank ? mkSyntheticPrice(17.5, 0.026, 0.55, 9) : mkSyntheticPrice(3.9, 0.007, 0.14, 9);
  }, [priceData, isBank]);

  const { chartData, isAboveMa, lastYoYVal, isAccelerating } = useMemo(() => {
    const p = prices;
    const n = p.length;
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

    const above = n > 0 && ma.length > 0 ? p[n - 1] > ma[n - 1] : true;
    const g = yoy(netSeries).filter((v): v is number => v != null);
    const lastG = g.length ? g[g.length - 1] : null;
    const accel = g.length > 1 && lastG != null && lastG > g[g.length - 2];

    return {
      chartData: data,
      isAboveMa: above,
      lastYoYVal: lastG,
      isAccelerating: accel,
    };
  }, [prices, netSeries]);

  const pctStr = (v: number | null) =>
    v == null ? "—" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[#6B7280]">
        <b className="text-[13px] text-[#1A1A1A]">جسر السعر</b>
        <span>
          أرباح{" "}
          <b className="tabular-nums text-[#1A1A1A]" dir="ltr">
            {pctStr(lastYoYVal)}
          </b>{" "}
          {isAccelerating ? "متسارعة ↑" : "— الوتيرة تتباطأ"} · السعر{" "}
          <span className={isAboveMa ? "font-semibold text-[#16A34A]" : "font-semibold text-[#DC2626]"}>
            {isAboveMa ? "فوق MA50 ✓ يؤكد" : "تحت MA50 ✗"}
          </span>
        </span>
        <span className="mr-auto text-[10.5px] text-[#9CA3AF]">
          ▮ = إعلان نتائج · شارت تفاعلي
        </span>
      </div>

      {priceLoading ? (
        <div className="mt-3 h-[120px] animate-pulse rounded bg-[#F3F4F6]" />
      ) : (
        <div className="mt-3 h-[130px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceBridgeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.0} />
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
                          اليوم #{d.index}{" "}
                          {d.isEarnings && (
                            <span className="mr-1 rounded bg-[#8C3B32] px-1 py-0.5 text-[9.5px] text-white">
                              إعلان نتائج
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 text-[#6B7280]">
                          <span>السعر:</span>
                          <b className="text-[#1E3A8A] tabular-nums" dir="ltr">
                            {d.price.toFixed(2)} ر.س
                          </b>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#6B7280]">
                          <span>متوسط MA50:</span>
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
                stroke="#1E3A8A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceBridgeGrad)"
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
