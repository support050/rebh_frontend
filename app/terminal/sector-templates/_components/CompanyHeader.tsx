"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function CompanyHeader({ C }: Props) {
  return (
    <header className="border-b border-[#E5E7EB] dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] px-7 py-3.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="text-[20px] font-bold text-[#1A1A1A] dark:text-[#f2f1ed]">
          {C.name}
          {C.en && C.en !== C.name && (
            <span className="mr-1.5 text-[13px] font-normal text-[#6B7280] dark:text-[#888]">{C.en}</span>
          )}
        </div>
        <span className="rounded-full bg-[#F3F4F6] dark:bg-[#1a1a19] px-3 py-0.5 text-[12px] text-[#6B7280] dark:text-[#aaa]">{C.symbol}</span>
        <span className="rounded-full bg-[#F3F4F6] dark:bg-[#1a1a19] px-3 py-0.5 text-[12px] text-[#6B7280] dark:text-[#aaa]">تداول</span>
        <span className="rounded-full bg-[#F3F4F6] dark:bg-[#1a1a19] px-3 py-0.5 text-[12px] text-[#6B7280] dark:text-[#aaa]">{C.sector}</span>
        <span className="rounded-full border border-dashed border-[#E5E7EB] dark:border-[#333] px-3 py-0.5 text-[12px] text-[#6B7280] dark:text-[#888]">
          {C.tmpl}
        </span>
        {C.real ? (
          <span className="rounded-full bg-[#16A34A]/10 px-3 py-0.5 text-[12px] font-semibold text-[#16A34A]">
            ✓ بيانات XBRL حقيقية (2025-2026)
          </span>
        ) : (
          <span className="rounded-full bg-[#FEF2F2] dark:bg-[#DC2626]/10 border border-[#FECACA] dark:border-[#DC2626]/30 px-3 py-0.5 text-[12px] font-semibold text-[#DC2626]">
            ⚠ بيانات توضيحية للعرض
          </span>
        )}
        {C.verified && (
          <span className="rounded-full bg-[#8C3B32]/10 border border-[#8C3B32]/25 px-3 py-0.5 text-[12px] font-semibold text-[#8C3B32] flex items-center gap-1">
            <span className="text-[#16A34A]">✓</span> تم التدقيق الجنائي آلياً (A = L + E)
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
        <div className="text-[23px] font-bold tabular-nums text-[#1A1A1A] dark:text-[#f2f1ed]" dir="ltr">
          {C.price} <small className="text-[12px] font-normal text-[#6B7280] dark:text-[#888]">ر.س</small>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${
            C.chgDown ? "bg-[#FEF2F2] dark:bg-[#DC2626]/10 text-[#DC2626]" : "bg-[#16A34A]/10 text-[#16A34A]"
          }`}
        >
          {C.chg}
        </span>
        <span className="text-[12px] text-[#6B7280] dark:text-[#888]">آخر إغلاق — توقيت السعودية · ريال سعودي</span>
      </div>
    </header>
  );
}