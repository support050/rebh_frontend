"use client";

import React from "react";
import { Landmark, PieChart, Coins, ShieldCheck } from "lucide-react";

interface CapitalStructureProps {
  capitalStructure?: {
    market_cap?: number | null;
    total_debt?: number | null;
    cash?: number | null;
    enterprise_value?: number | null;
    debt_to_equity_pct?: number | null;
    net_debt?: number | null;
    source_status?: string;
  } | null;
  currency?: string;
}

export default function CapitalStructureCard({
  capitalStructure,
  currency = "SAR"
}: CapitalStructureProps) {
  if (!capitalStructure) return null;

  const mc = capitalStructure.market_cap;
  const debt = capitalStructure.total_debt;
  const cash = capitalStructure.cash;
  const ev = capitalStructure.enterprise_value;
  const netDebt = capitalStructure.net_debt;
  const de = capitalStructure.debt_to_equity_pct;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#8C3B32]" />
          Capital Structure &amp; Enterprise Value (EV)
        </h3>
        <span className="text-[11px] font-mono text-[#6B7280] bg-[#F3F4F6] px-2.5 py-0.5 rounded border border-[#E5E7EB]">
          Seeking Alpha model · {capitalStructure.source_status || "° Verified"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {/* 1. Market Cap */}
        <div className="bg-[#F7F8FA] rounded-[4px] p-3.5 border border-[#E5E7EB]">
          <span className="text-[11px] text-[#6B7280] block font-medium mb-1">Market Cap</span>
          <span className="text-base sm:text-lg font-black font-mono text-[#1A1A1A]">
            {mc != null ? `${mc.toLocaleString()} M` : "—"}
          </span>
          <span className="text-[10px] text-[#9CA3AF] block font-mono mt-0.5">{currency}</span>
        </div>

        {/* 2. Total Debt */}
        <div className="bg-[#F7F8FA] rounded-[4px] p-3.5 border border-[#E5E7EB]">
          <span className="text-[11px] text-[#6B7280] block font-medium mb-1">Total Debt</span>
          <span className="text-base sm:text-lg font-black font-mono text-[#8C3B32]">
            {debt != null ? `${debt.toLocaleString()} M` : "0 M"}
          </span>
          <span className="text-[10px] text-[#9CA3AF] block font-mono mt-0.5">
            {de != null ? `D/E: ${de}%` : "—"}
          </span>
        </div>

        {/* 3. Cash & Cash Equivalents */}
        <div className="bg-[#F7F8FA] rounded-[4px] p-3.5 border border-[#E5E7EB]">
          <span className="text-[11px] text-[#6B7280] block font-medium mb-1">Cash &amp; Cash Equivalents</span>
          <span className="text-base sm:text-lg font-black font-mono text-[#16A34A]">
            {cash != null ? `${cash.toLocaleString()} M` : "0 M"}
          </span>
          <span className="text-[10px] text-[#9CA3AF] block font-mono mt-0.5">
            {netDebt != null ? `Net Debt: ${netDebt.toLocaleString()} M` : "—"}
          </span>
        </div>

        {/* 4. Enterprise Value */}
        <div className="bg-[#F7F8FA] rounded-[4px] p-3.5 border border-[#E5E7EB]">
          <span className="text-[11px] text-[#6B7280] block font-medium mb-1">Enterprise Value (EV)</span>
          <span className="text-base sm:text-lg font-black font-mono text-[#1A1A1A]">
            {ev != null ? `${ev.toLocaleString()} M` : "—"}
          </span>
          <span className="text-[10px] text-[#6B7280] block font-mono mt-0.5">
            EV = Cap + Debt - Cash
          </span>
        </div>
      </div>
    </section>
  );
}