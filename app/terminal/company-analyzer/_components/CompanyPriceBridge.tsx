"use client";

import { useMemo } from "react";

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
  const PW = 1180;
  const PH = 92;
  const padB = 14;
  const padT = 6;
  const padS = 6;
  const padE = 48;
  const earnIdx = [18, 42, 66, 92];

  // If live priceData is provided and has points, use it; otherwise use exact synthetic formula
  const prices = useMemo(() => {
    if (priceData && priceData.length >= 10) {
      return priceData;
    }
    return isBank ? mkSyntheticPrice(17.5, 0.026, 0.55, 9) : mkSyntheticPrice(3.9, 0.007, 0.14, 9);
  }, [priceData, isBank]);

  const { ma50, isAboveMa, lastYoYVal, isAccelerating } = useMemo(() => {
    const p = prices;
    const n = p.length;
    const ma: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = Math.max(0, i - 49);
      const seg = p.slice(s, i + 1);
      ma.push(seg.reduce((a, b) => a + b, 0) / seg.length);
    }
    const above = n > 0 && ma.length > 0 ? p[n - 1] > ma[n - 1] : true;

    const g = yoy(netSeries).filter((v): v is number => v != null);
    const lastG = g.length ? g[g.length - 1] : null;
    const accel = g.length > 1 && lastG != null && lastG > g[g.length - 2];

    return {
      ma50: ma,
      isAboveMa: above,
      lastYoYVal: lastG,
      isAccelerating: accel,
    };
  }, [prices, netSeries]);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const rng = max - min || 1;
  const pX = (i: number) => padS + (i / (prices.length - 1)) * (PW - padS - padE);
  const pY = (v: number) => padT + (1 - (v - min) / rng) * (PH - padT - padB);

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
          ▮ = إعلان نتائج · بيانات سعر توضيحية — الحية في Sprint 3
        </span>
      </div>

      {/* SVG Chart */}
      {priceLoading ? (
        <div className="mt-2 h-[92px] animate-pulse rounded bg-[#F3F4F6]" />
      ) : (
        <svg width="100%" height="92" viewBox={`0 0 ${PW} ${PH}`} className="mt-1">
          {/* MA50 Line */}
          <polyline
            points={ma50.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
            fill="none"
            stroke="#C3C2B7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Price Line */}
          <polyline
            points={prices.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
            fill="none"
            stroke="#2A78D6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Earnings announcement markers [18,42,66,92] */}
          {earnIdx
            .filter((ei) => ei < prices.length)
            .map((ei) => (
              <g key={ei}>
                <line x1={pX(ei)} x2={pX(ei)} y1={padT} y2={PH - padB} stroke="#E1E0D9" />
                <rect
                  x={pX(ei) - 6}
                  y={pY(prices[ei]) - 14}
                  width="12"
                  height="10"
                  rx="2.5"
                  fill="#FDF3DD"
                  stroke="#E1E0D9"
                />
                <text
                  x={pX(ei)}
                  y={pY(prices[ei]) - 6}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#7A5B13"
                  fontWeight="bold"
                >
                  ن
                </text>
              </g>
            ))}
        </svg>
      )}
    </div>
  );
}
