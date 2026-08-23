"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function CompanyHeader({ C }: Props) {
  return (
    <header className="border-b border-white/10 bg-[#1a1a19] px-7 py-3.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="text-[20px] font-bold">
          {C.name} <span className="mr-1.5 text-[13px] font-normal text-[#898781]">{C.en}</span>
        </div>
        <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[12px] text-[#c3c2b7]">{C.symbol}</span>
        <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[12px] text-[#c3c2b7]">تداول</span>
        <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[12px] text-[#c3c2b7]">{C.sector}</span>
        <span className="rounded-full border border-dashed border-[#383835] px-3 py-0.5 text-[12px] text-[#c3c2b7]">
          {C.tmpl}
        </span>
        {C.real ? (
          <span className="rounded-full bg-[#0ca30c]/15 px-3 py-0.5 text-[12px] font-semibold text-[#0ca30c]">
            ✓ بيانات XBRL رسمية
          </span>
        ) : (
          <span className="rounded-full bg-[#38301a] px-3 py-0.5 text-[12px] font-semibold text-[#e8c464]">
            ⚠ بيانات توضيحية للعرض
          </span>
        )}
        {C.verified && (
          <span className="rounded-full bg-[#185adb]/20 border border-[#185adb]/40 px-3 py-0.5 text-[12px] font-semibold text-[#64b5f6] flex items-center gap-1">
            <span className="text-[#38ef7d]">✓</span> تم التدقيق الجنائي آلياً (A = L + E)
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
        <div className="text-[23px] font-bold tabular-nums" dir="ltr">
          {C.price} <small className="text-[12px] font-normal text-[#898781]">ر.س</small>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${
            C.chgDown ? "bg-[#e66767]/15 text-[#e66767]" : "bg-[#0ca30c]/15 text-[#0ca30c]"
          }`}
        >
          {C.chg}
        </span>
        <span className="text-[12px] text-[#898781]">آخر إغلاق — توقيت السعودية · ريال سعودي</span>
      </div>
    </header>
  );
}
