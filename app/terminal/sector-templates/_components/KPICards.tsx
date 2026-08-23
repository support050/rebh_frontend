"use client";

import type { CompanyTemplate } from "../types";
import { fmtM, fmtEPS, fmtPct, sparklinePath } from "../utils";

interface Props {
  C: CompanyTemplate;
}

export default function KPICards({ C }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {C.kpis.items.map((k, idx) => {
        const r = C.rows.find((row) => row.ar === k.name);
        const vals = r?.v || [];
        const vLast = vals[vals.length - 1];
        const vPrev = vals[vals.length - 5];

        // YoY calculation
        let yoyText = "";
        let yoyGood = true;
        if (
          vLast != null &&
          vPrev != null &&
          vPrev !== 0 &&
          Math.sign(vPrev as number) === Math.sign(vLast as number)
        ) {
          const g = ((vLast as number) / (vPrev as number) - 1) * 100;
          yoyGood = k.invert ? g < 0 : g >= 0;
          yoyText = fmtPct(g);
        } else if (vLast != null) {
          yoyGood = (vLast as number) > 0;
          yoyText = yoyGood ? "تحوّل إلى موجب ↑" : "تحوّل إلى سالب ↓";
        }

        // Sparkline
        const spk = sparklinePath(vals as number[], 100, 24);

        return (
          <div key={idx} className="relative rounded-xl border border-white/10 bg-[#1a1a19] p-3.5 pb-10">
            <h4 className="text-[12px] font-semibold text-[#c3c2b7]">{k.short || k.name}</h4>
            <div className="text-[21px] font-bold tabular-nums" dir="ltr">
              {vLast == null
                ? "—"
                : k.eps
                ? fmtEPS(vLast as number)
                : fmtM(Math.abs(vLast as number))}{" "}
              <small className="text-[11.5px] font-normal text-[#898781]">
                {k.eps ? "ريال" : "مليون ر.س"}
              </small>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {yoyText && (
                <span className={`text-[12px] font-bold ${yoyGood ? "text-[#0ca30c]" : "text-[#e66767]"}`}>
                  {yoyText}
                </span>
              )}
              <span className="text-[10.5px] text-[#898781]">على أساس سنوي ({C.kpis.cmp})</span>
            </div>

            {/* Sparkline SVG */}
            {spk.pts && (
              <svg
                width="100"
                height="24"
                viewBox="0 0 100 24"
                className="absolute bottom-[11px] start-[15px] opacity-90"
                aria-hidden="true"
              >
                {spk.zero != null && (
                  <line
                    x1="2"
                    x2="98"
                    y1={spk.zero}
                    y2={spk.zero}
                    stroke="#383835"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <polyline
                  points={spk.pts}
                  fill="none"
                  stroke="#3987e5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={spk.last[0]} cy={spk.last[1]} r="3" fill="#3987e5" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
