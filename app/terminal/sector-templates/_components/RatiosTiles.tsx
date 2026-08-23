"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function RatiosTiles({ C }: Props) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold text-[#898781]">
        نسب {C.sector} المشتقة ° <span className="font-normal">· مرّر على أي نسبة لرؤية معادلتها — لا صناديق سوداء</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
        {C.ratios.map((r, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/10 bg-[#1a1a19] p-2.5 cursor-help"
            title={`المعادلة: ${r.f}`}
          >
            <h5 className="text-[11px] font-semibold text-[#898781]">{r.h}</h5>
            <div className="text-[16.5px] font-bold tabular-nums" dir="ltr">
              {r.v}
            </div>
            <div
              className={`text-[10.5px] ${
                r.dir === "up" ? "text-[#0ca30c]" : r.dir === "down" ? "text-[#e66767]" : "text-[#898781]"
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
