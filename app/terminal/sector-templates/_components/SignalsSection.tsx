"use client";

import type { Signal } from "./SignalEngine";

interface Props {
  signals: Signal[];
}

export default function SignalsSection({ signals }: Props) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold text-[#898781]">
        إشارات مكتشفة آلياً{" "}
        <span className="font-normal">
          · محرك قواعد يحسب من أرقام هذه الصفحة مباشرة — كل إشارة تحمل اسم قاعدتها وتأكيدها السعري، وقابلة للفرز عبر السوق في M1
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {signals.length > 0 ? (
          signals.map((s, idx) => (
            <div
              key={idx}
              className={`rounded-xl border border-white/10 bg-[#1a1a19] p-3 text-[13px] ${
                s.neg ? "border-r-[3px] border-r-[#e66767]" : "border-r-[3px] border-r-[#3987e5]"
              }`}
            >
              <b className="text-[#fff]">{s.h}</b>
              <span className="mt-1 block text-[10.5px] text-[#898781]">{s.tag}</span>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-xl border border-white/10 bg-[#1a1a19] p-3 text-[13px] text-[#898781]">
            لا إشارات تتجاوز عتبات القواعد هذا الربع.
          </div>
        )}
      </div>
    </div>
  );
}
