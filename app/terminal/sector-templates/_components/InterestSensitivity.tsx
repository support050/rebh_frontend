"use client";

interface Props {
  hasSens?: boolean;
  sensBp: number;
  onSelectBp: (bp: number) => void;
}

export default function InterestSensitivity({ hasSens, sensBp, onSelectBp }: Props) {
  if (!hasSens) return null;

  // نموذج مبسط: أثر سنوي = |bp|/100 × (ودائع 352.6مليار×0.60 − أصول مدرة 477مليار×0.40)
  const eff = (Math.abs(sensBp) / 100) * (352567 * 0.60 - 477387 * 0.40) / 1000; // مليون ر.س
  const nim = (Math.abs(sensBp) / 100) * 4.6;

  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
      <h4 className="text-[13px] font-bold text-[#fff]">حساسية الفائدة °</h4>
      <div className="flex gap-1 rounded-lg bg-[#262624] p-1">
        {[0, -50, -100].map((bp) => (
          <button
            key={bp}
            onClick={() => onSelectBp(bp)}
            className={`rounded-md px-3 py-1 text-[12px] font-sans transition-colors ${
              sensBp === bp ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7] hover:text-[#fff]"
            }`}
          >
            {bp === 0 ? "ثبات ساما" : `خفض ${Math.abs(bp)} نقطة`}
          </button>
        ))}
      </div>
      <div className="text-[13px]">
        {sensBp === 0 ? (
          <span>لا تغيير مفترض — NIM الحالي °2.94%</span>
        ) : (
          <span>
            الأثر السنوي المقدر°:{" "}
            <b className="font-bold text-[#0ca30c] tabular-nums">+{Math.round(eff)} مليون ر.س</b> على صافي دخل
            العمولات · NIM +{nim.toFixed(1)} نقطة أساس (الودائع تتسعّر أسرع من الأصول)
          </span>
        )}
      </div>
      <div className="basis-full text-[10.5px] text-[#898781]">
        نموذج مبسط°: حساسية إعادة التسعير — β الودائع 0.60 (تتسعّر أسرع) مقابل β الأصول 0.40 · المدخلات: أرصدة المركز المالي الحقيقية · ربط مباشر بموديول الماكرو M6 (توقعات CME FedWatch)
      </div>
    </div>
  );
}
