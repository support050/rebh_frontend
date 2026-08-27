"use client";

import type { Signal } from "./SignalEngine";

interface Props {
  signals: Signal[];
}

export default function SignalsSection({ signals }: Props) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold text-[#6B7280]">
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
              className={`rounded-[4px] border border-[#E5E7EB] bg-white p-3 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
                s.neg ? "border-r-[3px] border-r-[#DC2626]" : "border-r-[3px] border-r-[#8C3B32]"
              }`}
            >
              <div>
                <b className="text-[#1A1A1A]">{s.h}</b>
                {s.confText && (
                  <span
                    className={`mr-1 text-[11px] font-semibold ${
                      s.confOk ? "text-[#16A34A]" : "text-[#6B7280]"
                    }`}
                  >
                    .{s.confText}
                  </span>
                )}
              </div>
              <span className="mt-1 block text-[10.5px] text-[#9CA3AF]">{s.tag}</span>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-[4px] border border-[#E5E7EB] bg-white p-3 text-[13px] text-[#6B7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            لا إشارات تتجاوز عتبات القواعد هذا الربع.
          </div>
        )}
      </div>
    </div>
  );
}