"use client";

import React, { useMemo } from "react";

interface GradeItem {
  g: string;
  p: number;
  b: string;
}

interface RebhRadarScoreProps {
  grades?: Record<string, GradeItem>;
  sec: string;
  symbol: string;
  warnCount: number;
  goodCount: number;
  marketRank?: number | null;
  sectorRank?: number | null;
  scoreOverride?: number | null;
  isStaleOrFallback?: boolean;
}

export default function RebhRadarScore({
  grades = {},
  sec,
  symbol,
  warnCount,
  goodCount,
  marketRank,
  sectorRank,
  scoreOverride,
  isStaleOrFallback = false,
}: RebhRadarScoreProps) {
  const dims = ["Valuation", "Growth", "Profitability", "Balance", "Cash"];
  const dimsAr: Record<string, string> = {
    Valuation: "التقييم",
    Growth: "النمو",
    Profitability: "الربحية",
    Balance: "الميزانية",
    Cash: "التدفقات",
  };

  const ps = dims.map(k => (grades[k] ? grades[k].p : null));
  const have = ps.filter((x): x is number => x != null);

  const comp = have.length > 0 ? have.reduce((a, b) => a + b, 0) / have.length : 50;
  // Formula from universal_template.html line 173: Math.round(40 + comp * 0.6)
  const calculatedScore = Math.round(40 + comp * 0.6);
  const score = scoreOverride != null ? scoreOverride : calculatedScore;

  // SVG Radar Geometry (cx=70, cy=70, R=55)
  const cx = 70;
  const cy = 70;
  const R = 55;

  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  };

  const ringPoints = (factor: number) => dims.map((_, i) => pt(i, R * factor)).join(" ");
  const polyPoints = ps.map((p, i) => pt(i, R * (Math.max(p ?? 40, 5) / 100))).join(" ");

  const labels = dims.map((d, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx + (R + 13) * Math.cos(a);
    const y = cy + (R + 13) * Math.sin(a);
    return {
      text: dimsAr[d] || d,
      x: Number(x.toFixed(0)),
      y: Number(y.toFixed(0)),
      val: grades[d]?.p ?? "—",
    };
  });

  const statusLabel = score >= 70 ? "قوة استثمارية مرتفعة" : score >= 50 ? "أداء مالي متزن" : "تحت المراقبة";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            REBH Score — مقياس جودة الشركة الخماسي
          </h3>
          <span className="text-[11px] text-[#6B7280]">
            تغطية العوامل: {have.length} من 5 محاور {isStaleOrFallback ? "≈ تقدير معلن" : "° موثق"}
          </span>
        </div>
        <span className="text-[11px] text-[#6B7280] font-mono">دمج خوارزميات GF-Score &amp; SA Quant</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Radar SVG */}
        <div className="shrink-0 relative">
          <svg width="170" height="165" viewBox="0 0 140 140" className="overflow-visible">
            {/* Background Polygon Rings */}
            <polygon points={ringPoints(1)} fill="none" stroke="#E5E7EB" strokeWidth="1" />
            <polygon points={ringPoints(2 / 3)} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
            <polygon points={ringPoints(1 / 3)} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />

            {/* Value Area */}
            <polygon points={polyPoints} fill="rgba(140,59,50,0.12)" stroke="#8C3B32" strokeWidth="2" />

            {/* Axis Labels */}
            {labels.map((lbl, i) => (
              <text
                key={i}
                x={lbl.x}
                y={lbl.y}
                fontSize="7.5"
                fill="#6B7280"
                textAnchor="middle"
                className="font-sans font-semibold"
              >
                {lbl.text} ({lbl.val}%)
              </text>
            ))}
          </svg>
        </div>

        {/* Score & Ranking Details */}
        <div className="flex-1 space-y-3 text-right w-full">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-black text-[#1A1A1A]">{score}</span>
            <span className="text-sm text-[#9CA3AF]">/ 100{isStaleOrFallback ? "≈" : "°"}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#8C3B32] font-semibold border border-[#E5E7EB] mr-auto">
              {statusLabel}
            </span>
          </div>

          <div className="text-xs text-[#6B7280] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-4">
              {sectorRank != null && (
                <span>الرتبة القطاعية: <b className="text-[#1A1A1A] font-mono">#{sectorRank}</b> في ({sec})</span>
              )}
              {marketRank != null && (
                <span>الرتبة في تاسي: <b className="text-[#1A1A1A] font-mono">#{marketRank}</b></span>
              )}
              <span>المئين القطاعي: <b className="text-[#1A1A1A] font-mono">{comp.toFixed(0)}%</b></span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              توليد مركب من العوامل الخمسة: التقييم ومعدلات النمو والربحية والرافعة المالية والتدفق النقدي الحر.
            </p>
          </div>

          {/* Warning and Good chips */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E5E7EB]">
            {goodCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                {goodCount} إشارة إيجابية
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                {warnCount} تنبيهات مخاطر
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
              تحديث القوائم: {isStaleOrFallback ? "تنبيه حداثة" : "مدقق ومطابق°"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}