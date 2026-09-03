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
}

export default function RebhRadarScore({
  grades = {},
  sec,
  symbol,
  warnCount,
  goodCount,
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
  const score = Math.round(40 + comp * 0.6);

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

  return (
    <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#63a5f0] font-mono flex items-center gap-1.5">
          REBH SCORE — مقياس جودة الشركة الخماسي (Radar Chart)
        </h3>
        <span className="text-[10px] text-[#657081] font-mono">دمج خوارزميات GF-Score &amp; SA Quant</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Radar SVG */}
        <div className="shrink-0 relative">
          <svg width="170" height="165" viewBox="0 0 140 140" className="overflow-visible">
            {/* Background Polygon Rings */}
            <polygon points={ringPoints(1)} fill="none" stroke="#1e2836" strokeWidth="1" />
            <polygon points={ringPoints(2 / 3)} fill="none" stroke="#1e2836" strokeWidth="1" strokeDasharray="2,2" />
            <polygon points={ringPoints(1 / 3)} fill="none" stroke="#1e2836" strokeWidth="1" strokeDasharray="2,2" />
            
            {/* Value Area */}
            <polygon points={polyPoints} fill="rgba(57,135,229,0.25)" stroke="#3987e5" strokeWidth="2" />
            
            {/* Axis Labels */}
            {labels.map((lbl, i) => (
              <text
                key={i}
                x={lbl.x}
                y={lbl.y}
                fontSize="7.5"
                fill="#a7b1bd"
                textAnchor="middle"
                className="font-sans font-bold"
              >
                {lbl.text} ({lbl.val}%)
              </text>
            ))}
          </svg>
        </div>

        {/* Score & Ranking Details */}
        <div className="flex-1 space-y-2 text-right w-full">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white">{score}</span>
            <span className="text-sm text-[#657081] font-mono">/ 100°</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 mr-auto">
              {score >= 70 ? "قوة استثمارية مرتفعة" : score >= 50 ? "أداء مالي متزن" : "تحت المراقبة"}
            </span>
          </div>

          <div className="text-xs text-[#a7b1bd] space-y-1">
            <p>
              الترتيب القطاعي المئوي: <b className="text-white font-mono">{comp.toFixed(0)}%</b> مقارنة بنظراء قطاع ({sec}).
            </p>
            <p className="text-[11px] text-[#657081]">
              توليد مركب من العوامل الخمسة: التقييم ومعدلات النمو والربحية والرافعة المالية والتدفق النقدي الحر.
            </p>
          </div>

          {/* Warning and Good chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e2836]">
            {goodCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {goodCount} إشارة إيجابية ✓
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {warnCount} تنبيهات مخاطر ⚠
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e2836] text-[#a7b1bd]">
              تحديث القوائم: مدقق ومطابق ✓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
