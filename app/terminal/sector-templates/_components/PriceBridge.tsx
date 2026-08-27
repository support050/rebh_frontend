"use client";

import { useMemo } from "react";
import { yoySeries } from "../utils";
import type { CompanyTemplate } from "../types";

interface Props {
  priceData: number[];
  priceLoading?: boolean;
  C: CompanyTemplate;
}

export default function PriceBridge({ priceData, priceLoading, C }: Props) {
  const PW = 1180;
  const PH = 110;
  const padB = 16;
  const padT = 8;
  const padS = 6;
  const padE = 52;
  const earnIdx = [18, 42, 66, 92];

  const { ma50, isPriceAboveMa, accelBadge } = useMemo(() => {
    const p = priceData;
    const n = p.length;
    if (n < 2) return { ma50: [], isPriceAboveMa: null, accelBadge: { text: "", up: true } };
    const ma: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = Math.max(0, i - 49);
      const seg = p.slice(s, i + 1);
      ma.push(seg.reduce((a, b) => a + b, 0) / seg.length);
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
        badgeText = `أرباح ${lastg >= 0 ? "+" : "−"}${Math.abs(lastg).toFixed(0)}% ${accel ? "متسارعة ↑" : "— الوتيرة تتباطأ"}`;
      }
    }

    return { ma50: ma, isPriceAboveMa: above, accelBadge: { text: badgeText, up: badgeUp } };
  }, [priceData, C.rows]);

  const hasData = priceData.length >= 2;
  const pMin = hasData ? Math.min(...priceData) : 0;
  const pMax = hasData ? Math.max(...priceData) : 1;
  const pRng = pMax - pMin || 1;
  const pX = (i: number) => padS + (i / (priceData.length - 1)) * (PW - padS - padE);
  const pY = (v: number) => padT + (1 - (v - pMin) / pRng) * (PH - padT - padB);

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-[#6B7280]">
        <b className="text-[13px] text-[#1A1A1A]">جسر السعر</b>
        <span>· ▮ علامات إعلان النتائج على السعر</span>

        {accelBadge.text && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11.5px] font-bold ${accelBadge.up ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"
              }`}
          >
            {accelBadge.text}
          </span>
        )}

        {isPriceAboveMa !== null && (
          <span className={`text-[11.5px] font-semibold ${isPriceAboveMa ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {isPriceAboveMa ? "✓ السعر فوق MA50 — يؤكد" : "✗ السعر تحت MA50 — لا يؤكد بعد"}
          </span>
        )}

        <span className="mr-auto text-[10.5px]">
          MA50 <span style={{ borderBottom: "2px dashed #E5E7EB" }}>— —</span> · بيانات سعر حقيقية من قاعدة البيانات
        </span>
      </div>

      {priceLoading ? (
        <div className="mt-3 h-[110px] animate-pulse rounded bg-[#F3F4F6]" />
      ) : !hasData ? (
        <div className="mt-3 flex h-[110px] items-center justify-center text-[12px] text-[#9CA3AF]">
          لا تتوفر بيانات سعر تاريخية لهذه الشركة
        </div>
      ) : (
        <svg width="100%" height="110" viewBox={`0 0 ${PW} ${PH}`} className="mt-2">
          {/* MA50 dashed line */}
          <polyline
            points={ma50.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Price line */}
          <polyline
            points={priceData.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
            fill="none"
            stroke="#8C3B32"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Earnings announcement markers */}
          {earnIdx.filter((ei) => ei < priceData.length).map((ei) => (
            <g key={ei}>
              <line x1={pX(ei)} x2={pX(ei)} y1={padT} y2={PH - padB} stroke="#E5E7EB" />
              <rect
                x={pX(ei) - 7}
                y={pY(priceData[ei]) - 16}
                width="14"
                height="12"
                rx="3"
                fill="#FEF2F2"
                stroke="#FECACA"
              />
              <text
                x={pX(ei)}
                y={pY(priceData[ei]) - 6.5}
                textAnchor="middle"
                fontSize="8.5"
                fill="#DC2626"
                fontWeight="bold"
              >
                ن
              </text>
            </g>
          ))}
          {/* End price label */}
          <text
            x={PW - padE + 8}
            y={pY(priceData[priceData.length - 1]) + 4}
            fill="#1A1A1A"
            fontSize="11"
            fontWeight="700"
          >
            {priceData[priceData.length - 1].toFixed(2)}
          </text>
        </svg>
      )}
    </div>
  );
}

export { PriceBridge };