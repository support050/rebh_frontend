"use client";

import React from "react";
import { Award, CheckCircle2, AlertTriangle, Check } from "lucide-react";

interface BuyGateProps {
  buyGate?: {
    gate_passed?: boolean;
    pass_conditions?: string[];
    fail_reasons?: string[];
  };
}

export default function InvestmentThesisBuyGate({ buyGate }: BuyGateProps) {
  if (!buyGate) return null;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-[#8C3B32]" />
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              أطروحة الاستثمار وبوابة الشراء (Investment Thesis &amp; Buy Gate)
            </h3>
            <p className="text-[11px] text-[#6B7280]">خلاصة الفحص الاستثماري النهائي وفق محددات المنهجية</p>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            buyGate.gate_passed
              ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
              : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
          }`}
        >
          {buyGate.gate_passed ? "مجتاز لبوابة الشراء والاستثمار ✓" : "لم يجتز شروط البوابة بعد ⚑"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Passed Conditions */}
        <div className="bg-[#F8FAFC] p-3.5 rounded-[4px] border border-[#E2E8F0] space-y-2">
          <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>الشروط المحققة بنجاح ({buyGate.pass_conditions?.length || 0}):</span>
          </span>
          <ul className="space-y-1.5 text-xs text-[#334155] pr-1">
            {buyGate.pass_conditions && buyGate.pass_conditions.length > 0 ? (
              buyGate.pass_conditions.map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#16A34A] font-bold">✓</span>
                  <span>{cond}</span>
                </li>
              ))
            ) : (
              <li className="text-[#94A3B8]">لا توجد شروط مكتملة معلنة.</li>
            )}
          </ul>
        </div>

        {/* Right: Fail Reasons or Warnings */}
        <div className="bg-[#F8FAFC] p-3.5 rounded-[4px] border border-[#E2E8F0] space-y-2">
          <span className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5">
            <AlertTriangle size={14} />
            <span>النقاط المعلقة أو التحذيرات ({buyGate.fail_reasons?.length || 0}):</span>
          </span>
          <ul className="space-y-1.5 text-xs text-[#334155] pr-1">
            {buyGate.fail_reasons && buyGate.fail_reasons.length > 0 ? (
              buyGate.fail_reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#DC2626] font-bold">⚑</span>
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-[#16A34A] flex items-center gap-1.5">
                <Check size={14} />
                <span>لا توجد أي معوقات مانعة للشراء وفق محددات المنهجية.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
