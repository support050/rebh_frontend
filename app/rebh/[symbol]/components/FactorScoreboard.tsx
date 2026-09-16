"use client";

import React from "react";

interface FactorScoreboardProps {
  grades?: Record<string, { g: string; p: number; b?: string }>;
}

export default function FactorScoreboard({ grades = {} }: FactorScoreboardProps) {
  const entries = Object.entries(grades);

  if (entries.length === 0) return null;

  // Mapping from API keys to display names matching the reference design
  const factorLabels: Record<string, string> = {
    "Cash": "(Cash) الربحية والكاش",
    "الربحية والكفاءة": "(Cash) الربحية والكاش",
    "Balance": "(Balance) الميزانية والديون",
    "المتانة المالية والسيولة": "(Balance) الميزانية والديون",
    "Valuation": "(Valuation) جاذبية التقييم",
    "التقييم ومضاعفات السوق": "(Valuation) جاذبية التقييم",
    "Growth": "(Growth) النمو والزخم",
    "النمو وتوليد النقد": "(Growth) النمو والزخم",
    "Safety": "(Safety) الأمان والملاءة",
    "سلامة الأرباح والحوكمة": "(Safety) الأمان والملاءة",
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1A1A1A]">لوحة درجات العوامل الخمسة (Factor Scoreboard)</h3>
        <span className="text-[11px] text-[#9CA3AF] font-mono">تصنيف كمي معتمد °</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {entries.map(([factor, item]) => {
          const isA = item.g.startsWith("A");
          const isB = item.g.startsWith("B");
          const isC = item.g.startsWith("C");
          const gradeColor = isA
            ? "text-[#16A34A]"
            : isB
            ? "text-[#8C3B32]"
            : isC
            ? "text-[#B8863F]"
            : "text-[#DC2626]";

          const displayName = factorLabels[factor] || factor;

          return (
            <div
              key={factor}
              className="bg-[#F7F8FA] rounded-[4px] p-3.5 text-center border border-[#E5E7EB]"
            >
              <div className="text-xs text-[#4B5563] font-medium mb-2">{displayName}</div>
              <div className={`text-2xl font-black font-mono ${gradeColor}`}>
                {item.g}
              </div>
              <div className="text-[11px] text-[#9CA3AF] font-mono mt-2">
                مئين القطاع {item.p}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}