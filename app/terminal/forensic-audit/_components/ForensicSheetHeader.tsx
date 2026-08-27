"use client";

import { ShieldCheck } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

export default function ForensicSheetHeader({ data }: Props) {
  return (
    <header className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-[#1A1A1A]">
          <ShieldCheck className="w-5 h-5 text-[#8C3B32]" />
          ورقة التدقيق المالي — {data.name} ({data.sym})
        </h1>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
          {data.sec || "السوق الرئيسي"}
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
          ✓ بيانات XBRL تداول رسمية
        </span>
      </div>
      <p className="text-xs text-[#6B7280] mt-2.5 leading-relaxed max-w-3xl">
        توليد آلي كامل من إفصاحات XBRL الرسمية · السعر: {data.px || "—"} ر.س · القيمة السوقية التقديرية:{" "}
        {data.mc ? data.mc.toLocaleString() : "—"} م.ر.س · الحكم مزدوج: المعيار المطلق + ترتيب المئين وسط القطاع ·{" "}
        <b className="text-[#1A1A1A] font-semibold">6 سنوات مالية + آخر ربع</b>
      </p>
    </header>
  );
}