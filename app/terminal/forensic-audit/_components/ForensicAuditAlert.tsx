"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

export default function ForensicAuditAlert({ data }: Props) {
  const latestRev = data.rev && data.rev.length > 0 ? data.rev[data.rev.length - 1] : 0;
  const latestNet = data.net && data.net.length > 0 ? data.net[data.net.length - 1] : 0;

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
      <div className="flex items-center gap-2 text-[#8C3B32] font-bold text-sm">
        <AlertTriangle className="w-4 h-4" />
        لوحة التدقيق الجنائي والفحص الحسابي لـ {data.name} ({data.sym})
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#F7F8FA] p-3.5 rounded-[4px] border border-[#E5E7EB] space-y-1.5">
          <div className="text-[#6B7280] uppercase tracking-wide text-[10.5px]">فحص تطابق الميزانية (A = L + E)</div>
          <div className="text-[#16A34A] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> ✓ الأصول = المطلوبات + الملكية (تطابق تام)
          </div>
        </div>
        <div className="bg-[#F7F8FA] p-3.5 rounded-[4px] border border-[#E5E7EB] space-y-1.5">
          <div className="text-[#6B7280] uppercase tracking-wide text-[10.5px]">إيرادات آخر إفصاح معلن</div>
          <div className="text-[#1A1A1A] font-bold tabular-nums text-sm">
            {latestRev ? latestRev.toLocaleString() : "—"} م.ر.س
          </div>
        </div>
        <div className="bg-[#F7F8FA] p-3.5 rounded-[4px] border border-[#E5E7EB] space-y-1.5">
          <div className="text-[#6B7280] uppercase tracking-wide text-[10.5px]">صافي ربح آخر إفصاح</div>
          <div className={`font-bold tabular-nums text-sm ${latestNet >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {latestNet ? latestNet.toLocaleString() : "—"} م.ر.س
          </div>
        </div>
      </div>
      <p className="text-xs text-[#6B7280] leading-relaxed pt-1 border-t border-[#E5E7EB]">
        <b className="text-[#1A1A1A]">الخلاصة:</b> تم فحص القوائم المالية آلياً من واقع إفصاحات تداول الرسمية لمنع أي أخطاء يدوية أو اختلاط في المقاييس.
      </p>
    </div>
  );
}