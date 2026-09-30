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
    <section dir="ltr" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Col 1 & 2: Valuation multiples and fair value price bands */}
      <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#8C3B32]" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">Valuation Multiples &amp; Fair Value Price Bands</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#F3F4F6] text-[#8C3B32] rounded border border-[#E5E7EB]">
            {zones.current_zone ? `Zone: ${zones.current_zone}` : "Pricing Bands"}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">P/E Ratio</span>
            <span className="font-mono font-bold text-xs text-[#8C3B32]">{pe ? `${pe}x` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">P/B Ratio</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{pb ? `${pb}x` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">Return on Equity (ROE)</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{roe ?? "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">Net Profit Margin (NPM)</span>
            <span className="font-mono font-bold text-xs text-[#1A1A1A]">{netMargin ? `${netMargin}%` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">FCF Yield</span>
            <span className="font-mono font-bold text-xs text-[#16A34A]">{fcfYield ? `${fcfYield}%` : "—"}</span>
          </div>
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-[#6B7280] block">Internal Rate of Return (IRR)</span>
            <span className="font-mono font-bold text-xs text-[#8C3B32]">
              {irrDecision?.irr_pct != null ? `${irrDecision.irr_pct}%` : "—"}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-[#374151] block">Derived Fair Value bands:</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0]">
              <span className="text-[10px] font-bold text-[#16A34A] block">Gold Zone</span>
              <span className="text-sm font-black font-mono text-[#16A34A]">
                {zones.gold_max ? `≤ ${zones.gold_max} SAR` : "—"}
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-3 rounded-[4px] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#475569] block">Silver Zone</span>
              <span className="text-sm font-black font-mono text-[#0F172A]">
                {zones.silver_max ? `≤ ${zones.silver_max} SAR` : "—"}
              </span>
            </div>
            <div className="bg-[#FEF2F2] p-3 rounded-[4px] border border-[#FECACA]">
              <span className="text-[10px] font-bold text-[#DC2626] block">Bronze Zone</span>
              <span className="text-sm font-black font-mono text-[#DC2626]">
                {zones.bronze_max ? `≤ ${zones.bronze_max} SAR` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Col 3: Margin of safety and implied growth */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            Margin of Safety &amp; Implied Growth
          </h3>
          <p className="text-[11px] text-[#6B7280]">Margin of Safety &amp; Reverse DCF</p>
        </div>

        <div className="bg-[#F8FAFC] p-4 rounded-[4px] border border-[#E2E8F0] text-center space-y-1">
          <span className="text-xs text-[#64748B]">Current Margin of Safety vs. Fair Value</span>
          <div className={`text-3xl font-black font-mono ${marginOfSafety && marginOfSafety >= 20 ? "text-[#16A34A]" : marginOfSafety && marginOfSafety >= 0 ? "text-[#8C3B32]" : "text-[#DC2626]"}`}>
            {marginOfSafety != null ? `${marginOfSafety}%` : "—"}
          </div>
          <span className="text-[10px] text-[#94A3B8]">
            {marginOfSafety && marginOfSafety >= 25 ? "Comfortable margin above the Al-Kharfashi target (25%)" : "Below the target margin of safety"}
          </span>
        </div>

        <div className="space-y-2 text-xs text-[#475569]">
          <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
            <span>Priced-in Implied Growth (Reverse DCF):</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {reverseDcf?.implied_growth_pct != null ? `${reverseDcf.implied_growth_pct}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#F1F5F9] pb-1.5">
            <span>Risk-Free Rate (Sukuk):</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {buildUp?.risk_free_rate_pct != null ? `${buildUp.risk_free_rate_pct}%` : "5.5%"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Required Discount Rate (R):</span>
            <span className="font-mono font-bold text-[#8C3B32]">
              {buildUp?.required_return_r_pct != null ? `${buildUp.required_return_r_pct}%` : "8.0%"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}