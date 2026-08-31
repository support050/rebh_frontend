"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function RatiosTiles({ C }: Props) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold text-[#6B7280] dark:text-[#898781]">
        نسب {C.sector} المشتقة ° <span className="font-normal">· مرّر على أي نسبة لرؤية معادلتها — لا صناديق سوداء</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
        {C.ratios.map((r, idx) => (
          <div
            key={idx}
            className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] p-2.5 cursor-help shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors"
            title={`المعادلة: ${r.f}`}
          >
            <h5 className="text-[11px] font-semibold text-[#6B7280] dark:text-[#898781]">{r.h}</h5>
            <div className="text-[16.5px] font-bold tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]" dir="ltr">
              {r.v}
            </div>
            <div
              className={`text-[10.5px] ${r.dir === "up" ? "text-[#16A34A]" : r.dir === "down" ? "text-[#DC2626]" : "text-[#9CA3AF] dark:text-[#898781]"
                }`}
            >
              {r.s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}