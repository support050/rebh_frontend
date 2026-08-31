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
        const kNameLower = (k.short || k.name).toLowerCase();
        const r = C.rows.find((row) => {
          if (row.ar === k.name || row.en === k.name) return true;
          const rAr = (row.ar || "").toLowerCase();
          const rEn = (row.en || "").toLowerCase();
          
          if (k.eps || kNameLower.includes("السهم") || kNameLower.includes("eps")) {
            return (
              rEn.includes("basic earnings per share") ||
              rAr.includes("ربحية السهم الأساسية") ||
              rAr.includes("ربحية السهم") ||
              rEn.includes("earnings per share")
            );
          }
          if (kNameLower.includes("صافي الربح") || kNameLower.includes("صافي ربح") || kNameLower.includes("net profit")) {
            return (
              rEn === "net profit for the period" ||
              rEn === "net profit attributable to shareholders of parent" ||
              rAr === "صافي الربح للفترة" ||
              rAr.includes("صافي الربح") ||
              rAr.includes("صافي ربح")
            );
          }
          if (kNameLower.includes("تشغيل") || kNameLower.includes("operating")) {
            return (
              rEn.includes("operating income") ||
              rAr.includes("الربح التشغيلي") ||
              rAr.includes("الدخل التشغيلي") ||
              rEn.includes("operating profit")
            );
          }
          if (kNameLower.includes("إيراد") || kNameLower.includes("دخل") || kNameLower.includes("revenue")) {
            return (
              rEn.includes("revenue") ||
              rAr.includes("إيراد") ||
              rAr.includes("مبيعات") ||
              rEn.includes("turnover") ||
              rAr.includes("عمولة خاصة")
            );
          }
          return false;
        }) || C.rows[idx];
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
          <div
            key={idx}
            className="relative rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] p-4 pb-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors"
          >
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] dark:text-[#898781]">{k.short || k.name}</h4>
            <div className="mt-1 text-[21px] font-bold tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]" dir="ltr">
              {vLast == null
                ? "—"
                : k.eps
                ? fmtEPS(vLast as number)
                : fmtM(Math.abs(vLast as number))}{" "}
              <small className="text-[11.5px] font-normal text-[#6B7280] dark:text-[#898781]">
                {k.eps ? "ريال" : "مليون ر.س"}
              </small>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {yoyText && (
                <span className={`text-[12px] font-bold ${yoyGood ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                  {yoyText}
                </span>
              )}
              <span className="text-[10.5px] text-[#9CA3AF] dark:text-[#898781]">على أساس سنوي ({C.kpis.cmp})</span>
            </div>

            {/* Sparkline SVG */}
            {spk.pts && (
              <svg
                width="100"
                height="24"
                viewBox="0 0 100 24"
                className="absolute bottom-[13px] start-[16px]"
                aria-hidden="true"
              >
                {spk.zero != null && (
                  <line
                    x1="2"
                    x2="98"
                    y1={spk.zero}
                    y2={spk.zero}
                    stroke="currentColor"
                    className="text-[#E5E7EB] dark:text-[#2C2C2A]"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <polyline
                  points={spk.pts}
                  fill="none"
                  stroke="#8C3B32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={spk.last[0]} cy={spk.last[1]} r="3" fill="#8C3B32" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}