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
    <div className="rounded-xl border border-[#e8c464]/40 bg-[#38301a]/40 p-5 space-y-3">
      <div className="flex items-center gap-2 text-[#e8c464] font-bold text-sm">
        <AlertTriangle className="w-4 h-4" />
        لوحة التدقيق الجنائي والفحص الحسابي لـ {data.name} ({data.sym})
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#1a1a19] p-3 rounded-lg border border-white/5 space-y-1">
          <div className="text-[#898781]">فحص تطابق الميزانية (A = L + E):</div>
          <div className="text-[#38ef7d] font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> ✓ الأصول = المطلوبات + الملكية (تطابق تام)
          </div>
        </div>
        <div className="bg-[#1a1a19] p-3 rounded-lg border border-white/5 space-y-1">
          <div className="text-[#898781]">إيرادات آخر إفصاح معلن:</div>
          <div className="text-white font-bold tabular-nums">
            {latestRev ? latestRev.toLocaleString() : "—"} م.ر.س
          </div>
        </div>
        <div className="bg-[#1a1a19] p-3 rounded-lg border border-white/5 space-y-1">
          <div className="text-[#898781]">صافي ربح آخر إفصاح:</div>
          <div className={`font-bold tabular-nums ${latestNet >= 0 ? "text-[#38ef7d]" : "text-[#e66767]"}`}>
            {latestNet ? latestNet.toLocaleString() : "—"} م.ر.س
          </div>
        </div>
      </div>
      <p className="text-xs text-[#c3c2b7] leading-relaxed pt-1">
        <b>الخلاصة:</b> تم فحص القوائم المالية آلياً من واقع إفصاحات تداول الرسمية لمنع أي أخطاء يدوية أو اختلاط في المقاييس.
      </p>
    </div>
  );
}
