"use client";

import { useMemo } from "react";
import { yoySeries } from "../utils";
import type { CompanyTemplate } from "../types";

interface Props {
  priceData: number[];
  C: CompanyTemplate;
}

export default function PriceBridge({ priceData, C }: Props) {
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
    const ma: number[] = [];
    for (let i = 0; i < n; i++) {
      const s = Math.max(0, i - 49);
      const seg = p.slice(s, i + 1);
      ma.push(seg.reduce((a, b) => a + b, 0) / seg.length);
    }
    const above = p[n - 1] > ma[n - 1];

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

  const pMin = Math.min(...priceData);
  const pMax = Math.max(...priceData);
  const pRng = pMax - pMin || 1;
  const pX = (i: number) => padS + (i / (priceData.length - 1)) * (PW - padS - padE);
  const pY = (v: number) => padT + (1 - (v - pMin) / pRng) * (PH - padT - padB);

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
      <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-[#898781]">
        <b className="text-[13px] text-[#fff]">جسر السعر</b>
        <span>· ▮ علامات إعلان النتائج على السعر</span>

        {accelBadge.text && (
          <span
            className={`rounded-md px-2 py-0.5 text-[11.5px] font-bold ${
              accelBadge.up ? "bg-[#0ca30c]/15 text-[#0ca30c]" : "bg-[#e66767]/15 text-[#e66767]"
            }`}
          >
            {accelBadge.text}
          </span>
        )}

        <span className={`text-[11.5px] font-semibold ${isPriceAboveMa ? "text-[#0ca30c]" : "text-[#e66767]"}`}>
          {isPriceAboveMa ? "✓ السعر فوق MA50 — يؤكد" : "✗ السعر تحت MA50 — لا يؤكد بعد"}
        </span>

        <span className="mr-auto">
          MA50 <span style={{ borderBottom: "2px dashed #383835" }}>— —</span> · بيانات سعر توضيحية
        </span>
      </div>

      <svg width="100%" height="110" viewBox={`0 0 ${PW} ${PH}`} className="mt-2">
        {/* MA50 dashed line */}
        <polyline
          points={ma50.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
          fill="none"
          stroke="#383835"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {/* Price line */}
        <polyline
          points={priceData.map((v, i) => `${pX(i)},${pY(v)}`).join(" ")}
          fill="none"
          stroke="#3987e5"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Earnings announcement markers */}
        {earnIdx.map((ei) => (
          <g key={ei}>
            <line x1={pX(ei)} x2={pX(ei)} y1={padT} y2={PH - padB} stroke="#2c2c2a" />
            <rect
              x={pX(ei) - 7}
              y={pY(priceData[ei]) - 16}
              width="14"
              height="12"
              rx="3"
              fill="#38301a"
              stroke="rgba(255,255,255,0.1)"
            />
            <text
              x={pX(ei)}
              y={pY(priceData[ei]) - 6.5}
              textAnchor="middle"
              fontSize="8.5"
              fill="#e8c464"
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
          fill="#fff"
          fontSize="11"
          fontWeight="700"
        >
          {priceData[priceData.length - 1].toFixed(2)}
        </text>
      </svg>
    </div>
  );
}

export { PriceBridge };
