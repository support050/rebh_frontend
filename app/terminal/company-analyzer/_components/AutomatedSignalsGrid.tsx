"use client";

import React from "react";

interface SignalItem {
  neg: boolean;
  h: string;
  tag: string;
}

interface Props {
  signals: SignalItem[];
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

export default function AutomatedSignalsGrid({ signals }: Props) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold text-[#6B7280]">
        إشارات مكتشفة آلياً <span className="font-normal">· محرك قواعد يحسب من الأرقام الحقيقية</span>
      </div>
      {signals.length === 0 ? (
        <div className={`${PANEL} p-4 text-center text-[12px] text-[#9CA3AF]`}>
          لا توجد إشارات مكتشفة لهذا الرمز في الوقت الحالي
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {signals.map((s, idx) => (
            <div
              key={idx}
              className={`${PANEL} border-r-[3px] p-3 text-[12.5px] ${
                s.neg ? "border-r-[#DC2626]" : "border-r-[#8C3B32]"
              }`}
            >
              <div
                className="text-[#1A1A1A]"
                dangerouslySetInnerHTML={{ __html: s.h }}
              />
              <span className="mt-1 block text-[10px] text-[#9CA3AF]">{s.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
