"use client";

import { ShieldCheck } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

export default function ForensicSheetHeader({ data }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#3987e5]" />
            ورقة التدقيق المالي — {data.name} ({data.sym})
          </h1>
          <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-[#184f95] text-[#64b5f6]">
            {data.sec || "السوق الرئيسي"}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0ca30c]/15 text-[#0ca30c]">
            ✓ بيانات XBRL تداول رسمية
          </span>
        </div>
        <p className="text-xs text-[#898781] mt-2 leading-relaxed max-w-3xl">
          توليد آلي كامل من إفصاحات XBRL الرسمية · السعر: {data.px || "—"} ر.س · القيمة السوقية التقديرية: {data.mc ? data.mc.toLocaleString() : "—"} م.ر.س · الحكم مزدوج: المعيار المطلق + ترتيب المئين وسط القطاع · <b>6 سنوات مالية + آخر ربع</b>
        </p>
      </div>
    </header>
  );
}
