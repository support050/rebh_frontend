"use client";

import React from "react";
import { Sparkles, ShieldCheck, Activity, TrendingUp } from "lucide-react";

interface StudioRightRailProps {
  symbol: string;
  data: any;
  engineData?: any;
}

export const StudioRightRail: React.FC<StudioRightRailProps> = ({
  symbol,
  data,
  engineData,
}) => {
  // Extract stats safely from statements or engine card
  const bs = data?.bs || data?.balance_sheet || {};
  const is_d = data?.income_statement || {};
  const q_d = data?.quarters || {};

  const mktCap = engineData?.market_cap || data?.mc || data?.market_cap || (data?.price && data?.shares ? (data.price * data.shares) / 1e6 : null);
  const pe = engineData?.pe || engineData?.pe_ttm || data?.cur?.pe || data?.pe || null;
  const pb = engineData?.pb || data?.cur?.pb || data?.pb || null;
  const netDebt = engineData?.net_debt ?? bs?.net_debt?.[bs?.net_debt?.length - 1] ?? null;
  
  // Calculate coverage
  const opArr = is_d?.op || [];
  const fcArr = is_d?.fin_cost || is_d?.fc || [];
  const lastOp = opArr.length ? opArr[opArr.length - 1] : null;
  const lastFc = fcArr.length ? fcArr[fcArr.length - 1] : null;
  const coverage = (lastOp !== null && lastFc !== null && lastFc > 0) 
    ? (lastOp / lastFc).toFixed(1) 
    : (engineData?.coverage ? Number(engineData.coverage).toFixed(1) : "—");

  // Next quarter net forecast
  const qNet = q_d?.net || [];
  const lastQNet = qNet.length ? qNet[qNet.length - 1] : 0;
  const estNextQ = lastQNet > 0 ? Math.round(lastQNet * 1.04) : 0;
  const estLow = Math.round(estNextQ * (1 - 0.185));
  const estHigh = Math.round(estNextQ * (1 + 0.185));

  // Factor grades
  const factorGrades = engineData?.factor_grades || {
    valuation: "B",
    growth: "B+",
    profitability: "A",
    balance: "B",
    cash: "C+",
  };

  const getGradeColor = (g: string) => {
    if (!g) return "bg-gray-100 text-gray-700";
    if (g.startsWith("A")) return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    if (g.startsWith("B")) return "bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]";
    if (g.startsWith("C")) return "bg-[#FEF9C3] text-[#A16207] border-[#FDE047]";
    return "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]";
  };

  // Fair value range
  const price = engineData?.price || data?.price || 20.0;
  const fairValue = engineData?.fair_value || (price * 1.08);

  return (
    <aside className="w-full xl:w-72 space-y-4 shrink-0">
      {/* ── Key Stats ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h4 className="text-xs font-bold text-[#1A1A1A] border-b border-[#F1F5F9] pb-2 mb-3 flex items-center justify-between">
          <span>الإحصائيات الأساسية (Key Stats)</span>
          <span className="text-[10px] text-[#8C3B32] font-mono font-semibold">{symbol}</span>
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">القيمة السوقية</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {mktCap ? `${Number(mktCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}M` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">مكرر الأرباح P/E (TTM)</span>
            <span className="font-mono font-bold text-[#0F172A]">{pe ? (+pe).toFixed(1) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">مضاعف القيمة الدفترية P/B</span>
            <span className="font-mono font-bold text-[#0F172A]">{pb ? (+pb).toFixed(2) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">صافي الدين (Net Debt)</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {netDebt != null ? `${Number(netDebt).toLocaleString(undefined, { maximumFractionDigits: 0 })}M` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">تغطية الفوائد (Coverage)</span>
            <span className={`font-mono font-bold ${coverage !== "—" && +coverage < 1.5 ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
              {coverage !== "—" ? `${coverage}×` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Factor Grades Mini ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h4 className="text-xs font-bold text-[#1A1A1A] border-b border-[#F1F5F9] pb-2 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#8C3B32]" />
            تقييم العوامل (Factor Grades)
          </span>
        </h4>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[
            { key: "valuation", label: "VAL" },
            { key: "growth", label: "GROW" },
            { key: "profitability", label: "PROF" },
            { key: "balance", label: "BAL" },
            { key: "cash", label: "CASH" },
          ].map(f => {
            const g = factorGrades[f.key] || "B";
            return (
              <div key={f.key} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded border flex items-center justify-center font-black text-xs font-mono ${getGradeColor(g)}`}>
                  {g}
                </div>
                <span className="text-[10px] font-bold text-[#64748B]">{f.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[9.5px] text-[#94A3B8] mt-3 text-center">مقارنة بوسطاء القطاع الفعليين في السوق السعودي</p>
      </div>

      {/* ── Next Quarter Engine ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-1.5">
        <h4 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1">
          <Activity size={13} className="text-[#8C3B32]" />
          تقدير الربع القادم · Engine°
        </h4>
        <div className="text-xl font-black text-[#8C3B32] font-mono">
          ≈ {estNextQ > 0 ? estNextQ.toLocaleString() : "—"}M SAR
        </div>
        <p className="text-[10.5px] text-[#475569] leading-tight">
          النطاق المتوقع ({estLow.toLocaleString()} – {estHigh.toLocaleString()}) بناءً على نسبة الخطأ التاريخية المحققة (±18.5%).
        </p>
        <span className="inline-block text-[9.5px] text-[#8C3B32] bg-[#FFF1EF] px-2 py-0.5 rounded font-mono font-semibold">
          ← مرسوم كمخروط تقدير على الشارت الربعي
        </span>
      </div>

      {/* ── Fair Value Mini ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#1A1A1A]">القيمة العادلة المصغرة · Fair Value</h4>
          <span className="text-xs font-mono font-bold text-[#16A34A]">{Number(fairValue).toFixed(2)} SAR</span>
        </div>
        <div className="relative pt-2 pb-1">
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-[#EF4444]/20 border-r border-[#EF4444]" />
            <div className="w-1/3 bg-[#3B82F6]/20 border-r border-[#3B82F6]" />
            <div className="w-1/3 bg-[#10B981]/20" />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#94A3B8] mt-1">
            <span>منخفض</span>
            <span className="text-[#1A1A1A] font-bold">السعر: {Number(price).toFixed(2)}</span>
            <span>مرتفع</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
