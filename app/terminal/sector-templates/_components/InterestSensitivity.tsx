"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
  sensBp: number;
  onSelectBp: (bp: number) => void;
}

export default function InterestSensitivity({ C, sensBp, onSelectBp }: Props) {
  if (!C.hasSens) return null;

  const sp = C.sensParams;

  // Use real balance sheet params if available, otherwise show placeholder message
  const hasParams = sp != null;
  const eff = hasParams
    ? (Math.abs(sensBp) / 100) * (sp.deposits * sp.betaDeposits - sp.assets * sp.betaAssets) / 1000
    : null;
  const nim = hasParams ? (Math.abs(sensBp) / 100) * sp.nimCurrent : null;
  const nimCurrent = sp?.nimCurrent ?? null;

  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h4 className="text-[13px] font-bold text-[#1A1A1A]">حساسية الفائدة °</h4>
      <div className="flex gap-1 rounded-[4px] bg-[#F3F4F6] p-1">
        {[0, -50, -100].map((bp) => (
          <button
            key={bp}
            onClick={() => onSelectBp(bp)}
            className={`rounded-[4px] px-3 py-1 text-[12px] font-sans transition-colors ${sensBp === bp
              ? "border border-[#8C3B32] bg-white font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "border border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
          >
            {bp === 0 ? "ثبات ساما" : `خفض ${Math.abs(bp)} نقطة`}
          </button>
        ))}
      </div>
      <div className="text-[13px] text-[#1A1A1A]">
        {sensBp === 0 ? (
          <span>
            لا تغيير مفترض
            {nimCurrent != null ? ` — NIM الحالي °${nimCurrent.toFixed(2)}%` : ""}
          </span>
        ) : hasParams && eff != null && nim != null ? (
          <span>
            الأثر السنوي المقدر°:{" "}
            <b className="font-bold text-[#16A34A] tabular-nums">+{Math.round(eff)} مليون ر.س</b> على صافي دخل
            العمولات · NIM +{nim.toFixed(1)} نقطة أساس (الودائع تتسعّر أسرع من الأصول)
          </span>
        ) : (
          <span className="text-[#9CA3AF]">بيانات الحساسية غير متاحة لهذا الربع</span>
        )}
      </div>
      <div className="basis-full text-[10.5px] text-[#9CA3AF]">
        {hasParams
          ? `نموذج مبسط°: حساسية إعادة التسعير — β الودائع ${sp!.betaDeposits} (تتسعّر أسرع) مقابل β الأصول ${sp!.betaAssets} · المدخلات: أرصدة المركز المالي الحقيقية · ربط مباشر بموديول الماكرو M6 (توقعات CME FedWatch)`
          : "نموذج مبسط°: حساسية إعادة التسعير — β الودائع 0.60 مقابل β الأصول 0.40 · المدخلات قيد التحديث من البيانات الرسمية"}
      </div>
    </div>
  );
}