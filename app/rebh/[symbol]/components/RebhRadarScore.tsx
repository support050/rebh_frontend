"use client";

import React, { useMemo } from "react";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

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
  predictabilityStars?: number | null;
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
  predictabilityStars = null,
}: RebhRadarScoreProps) {
  const dims = ["Valuation", "Growth", "Profitability", "Balance", "Cash"];
  // NOTE: variable name kept as `dimsAr` to avoid renaming; values are now English display labels.
  const dimsAr: Record<string, string> = {
    Valuation: "Valuation",
    Growth: "Growth",
    Profitability: "Profitability",
    Balance: "Balance Sheet",
    Cash: "Cash Flow",
  };

  const ps = dims.map(k => (grades[k] ? grades[k].p : null));
  const have = ps.filter((x): x is number => x != null);

  const comp = have.length > 0 ? have.reduce((a, b) => a + b, 0) / have.length : 50;
  // Formula from universal_template.html line 173: Math.round(40 + comp * 0.6)
  const calculatedScore = Math.round(40 + comp * 0.6);
  const score = scoreOverride != null ? scoreOverride : calculatedScore;

  // Dynamic Recharts Radar Data (Five Pillars)
  const radarData = useMemo(() => {
    return dims.map(d => ({
      subject: dimsAr[d] || d,
      score: grades[d]?.p ?? 40,
      fullMark: 100,
      grade: grades[d]?.g ?? "—",
    }));
  }, [grades]);

  const statusLabel = score >= 70 ? "Strong Investment Quality" : score >= 50 ? "Balanced Financial Performance" : "Under Watch";

  return (
    <div dir="ltr" className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            REBH Score — Five-Pillar Company Quality Gauge
          </h3>
          <span className="text-[11px] text-[#6B7280]">
            Factor coverage: {have.length} of 5 pillars {isStaleOrFallback ? "≈ disclosed estimate" : "° verified"}
          </span>
        </div>
        <span className="text-[11px] text-[#6B7280] font-mono">Blends GF-Score &amp; SA Quant algorithms</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Dynamic Recharts Pentagon Radar Chart */}
        <div className="shrink-0 w-[240px] h-[210px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#4B5563", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="REBH Pillar Score"
                dataKey="score"
                stroke="#8C3B32"
                strokeWidth={2}
                fill="#8C3B32"
                fillOpacity={0.25}
                isAnimationActive={true}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1E293B] text-white text-[11px] px-2.5 py-1.5 rounded shadow-lg font-mono">
                        <div className="font-bold text-[#F8FAFC]">{d.subject}</div>
                        <div className="text-[#93C5FD]">Score: {d.score}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score & Ranking Details */}
        <div className="flex-1 space-y-3 text-left w-full">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-black text-[#1A1A1A]">{score}</span>
            <span className="text-sm text-[#9CA3AF]">/ 100{isStaleOrFallback ? "≈" : "°"}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#8C3B32] font-semibold border border-[#E5E7EB] ml-auto">
              {statusLabel}
            </span>
          </div>

          <div className="text-xs text-[#6B7280] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-4">
              {sectorRank != null && (
                <span>Sector Rank: <b className="text-[#1A1A1A] font-mono">#{sectorRank}</b> in ({sec})</span>
              )}
              {marketRank != null && (
                <span>TASI Rank: <b className="text-[#1A1A1A] font-mono">#{marketRank}</b></span>
              )}
              <span>Sector Percentile: <b className="text-[#1A1A1A] font-mono">{comp.toFixed(0)}%</b></span>
            </div>

            {predictabilityStars != null && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[#4B5563] font-medium">Earnings Stability (Predictability°):</span>
                <span className="text-[#F59E0B] tracking-widest text-sm">
                  {"★".repeat(Math.max(1, Math.min(5, predictabilityStars)))}
                  {"☆".repeat(Math.max(0, 5 - Math.max(1, Math.min(5, predictabilityStars))))}
                </span>
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  (GF Stars · 9-quarter window)
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#9CA3AF]">
              Composite of five factors: valuation, growth rates, profitability, financial leverage, and free cash flow.
            </p>
          </div>

          {/* Warning and Good chips */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E5E7EB]">
            {goodCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                {goodCount} positive signals
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                {warnCount} risk alerts
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
              Statements update: {isStaleOrFallback ? "Freshness warning" : "Audited & reconciled°"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}