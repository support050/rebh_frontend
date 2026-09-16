"use client";

import React from "react";
import { Scale, TrendingUp } from "lucide-react";

interface ValuationBandsAndMosProps {
  pe?: number | string | null;
  pb?: number | string | null;
  roe?: string | number | null;
  netMargin?: string | number | null;
  fcfYield?: string | number | null;
  irrDecision?: { irr_pct?: number | null };
  zones?: {
    current_zone?: string | null;
    gold_max?: number | string | null;
    silver_max?: number | string | null;
    bronze_max?: number | string | null;
  };
  marginOfSafety?: number | null;
  reverseDcf?: { implied_growth_pct?: number | null };
  buildUp?: {
    risk_free_rate_pct?: number | null;
    required_return_r_pct?: number | null;
  };
}

export default function ValuationBandsAndMos({
  pe,
  pb,
  roe,
  netMargin,
  fcfYield,
  irrDecision = {},
  zones = {},
  marginOfSafety = null,
  reverseDcf = {},
  buildUp = {}
}: ValuationBandsAndMosProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Col 1 & 2: مضاعفات التقييم ونطاقات الأسعار العادلة */}
      <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#8C3B32]" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">مضاعفات التقييم ونطاقات الأسعار العادلة</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#F3F4F6] text-[#8C3B32] rounded border border-[#E5E7EB]">
            {zones.current_zone ? `المنطقة: ${zones.current_zone}` : "نطاقات التسعير"}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">P/E مكرر الأرباح</span>
            <span className="font-mono font-bold text-xs text-[#8C3B32]">{pe ? `${pe}x` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">P/B القيمة الدفترية</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{pb ? `${pb}x` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">ROE العائد على الملكية</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{roe ?? "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">صافي الهامش NPM</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{netMargin ? `${netMargin}%` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">عائد التدفق FCF Yield</span>
            <span className="font-mono font-bold text-xs text-[#16A34A]">{fcfYield ? `${fcfYield}%` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">العائد الداخلي IRR</span>
            <span className="font-mono font-bold text-xs text-[#8C3B32]">
              {irrDecision?.irr_pct != null ? `${irrDecision.irr_pct}%` : "—"}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-[#374151] block">نطاقات القيمة العادلة المشتقة:</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
              <span className="text-[10px] font-bold text-[#16A34A] block">المنطقة الذهبية (Gold)</span>
              <span className="text-sm font-black font-mono text-[#16A34A]">
                {zones.gold_max ? `≤ ${zones.gold_max} ر.س` : "—"}
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-3 rounded-[4px] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#475569] block">المنطقة الفضية (Silver)</span>
              <span className="text-sm font-black font-mono text-[#0F172A]">
                {zones.silver_max ? `≤ ${zones.silver_max} ر.س` : "—"}
              </span>
            </div>
            <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
              <span className="text-[10px] font-bold text-[#DC2626] block">المنطقة البرونزية (Bronze)</span>
              <span className="text-sm font-black font-mono text-[#DC2626]">
                {zones.bronze_max ? `≤ ${zones.bronze_max} ر.س` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Col 3: هامش الأمان والنمو الضمني */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            هامش الأمان والنمو الضمني
          </h3>
          <p className="text-[11px] text-[#6B7280]">Margin of Safety &amp; Reverse DCF</p>
        </div>

        <div className="bg-[#F8FAFC] p-4 rounded-[4px] border border-[#E2E8F0] text-center space-y-1">
          <span className="text-xs text-[#64748B]">هامش الأمان الحالي مقابل القيمة العادلة</span>
          <div className={`text-3xl font-black font-mono ${marginOfSafety && marginOfSafety >= 20 ? "text-[#16A34A]" : marginOfSafety && marginOfSafety >= 0 ? "text-[#8C3B32]" : "text-[#DC2626]"}`}>
            {marginOfSafety != null ? `${marginOfSafety}%` : "—"}
          </div>
          <span className="text-[10px] text-[#94A3B8]">
            {marginOfSafety && marginOfSafety >= 25 ? "هامش مريح يفوق مستهدف الخرفشي (25%)" : "أقل من هامش الأمان المستهدف"}
          </span>
        </div>

        <div className="space-y-2 text-xs text-[#475569]">
          <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
            <span>النمو الضمني المسعر (Reverse DCF):</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {reverseDcf?.implied_growth_pct != null ? `${reverseDcf.implied_growth_pct}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
            <span>العائد الخالي من المخاطر (صكوك):</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {buildUp?.risk_free_rate_pct != null ? `${buildUp.risk_free_rate_pct}%` : "5.5%"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>معدل الخصم المطلوب R:</span>
            <span className="font-mono font-bold text-[#8C3B32]">
              {buildUp?.required_return_r_pct != null ? `${buildUp.required_return_r_pct}%` : "8.0%"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}