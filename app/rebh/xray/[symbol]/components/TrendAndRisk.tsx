import React from "react";
import { BarChart3, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from "recharts";
import { SectionPanel } from "./CommonCards";
import { RedFlag } from "./types";

interface SparklineProps {
  vals: number[];
  color: string;
}

function Sparkline({ vals, color }: SparklineProps) {
  if (!vals.length) return null;
  const chartData = vals.map((v, i) => ({ i, v }));
  const gradientId = `spark-gradient-${color.replace("#", "")}`;

  return (
    <div className="w-20 h-8 inline-block align-middle">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 3, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 2, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 3, fill: color, stroke: "#fff", strokeWidth: 1 }}
            isAnimationActive={true}
          />
          <RechartsTooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "2 2" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length && payload[0].value != null) {
                return (
                  <div className="bg-[#0F172A]/95 text-white text-[10px] px-2 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.25)] font-mono tabular-nums border border-white/10">
                    {Number(payload[0].value).toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </div>
                );
              }
              return null;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendAndRiskSectionProps {
  revTrend: number[];
  netTrend: number[];
  cfoTrend: number[];
  fcfTrend: number[];
  eqTrend: number[];
  wcTrend: number[];
  flags: RedFlag[];
}

export function TrendAndRiskSection({
  revTrend,
  netTrend,
  cfoTrend,
  fcfTrend,
  eqTrend,
  wcTrend,
  flags,
}: TrendAndRiskSectionProps) {
  return (
    <div className="space-y-8">
      {/* ── TREND SPARKLINES ─────────────────────────────────────────── */}
      <SectionPanel>
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-4">
          <BarChart3 size={15} className="text-[#8C3B32]" />
          Trend Trajectory — Last 5 Financial Periods
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Revenue", vals: revTrend, color: "#2563EB" },
            { label: "Net Income", vals: netTrend, color: "#16A34A" },
            { label: "Operating CF (CFO)", vals: cfoTrend, color: "#059669" },
            { label: "Free CF (FCF)", vals: fcfTrend, color: "#0D9488" },
            { label: "Shareholders' Equity", vals: eqTrend, color: "#0EA5E9" },
            { label: "Working Capital", vals: wcTrend, color: "#8C3B32" },
          ].map((s, i) => {
            const latest = s.vals.at(-1) ?? 0;
            const prev = s.vals.at(-2) ?? 0;
            const chg = prev !== 0 ? ((latest - prev) / Math.abs(prev)) * 100 : null;
            const isUp = chg !== null && chg >= 0;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 rounded-[8px] px-2 py-2 border border-transparent transition-colors duration-200 hover:bg-[#F8FAFC] hover:border-[#E2E8F0]"
              >
                <span className="text-[10px] font-semibold text-[#64748B] text-center">{s.label}</span>
                <Sparkline vals={s.vals} color={s.color} />
                <span className="font-mono font-bold text-[11px] text-[#0F172A] tabular-nums">
                  {latest.toLocaleString(undefined, { maximumFractionDigits: 0 })} M
                </span>
                {chg != null && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-0.5 tabular-nums px-1.5 py-[1px] rounded-full ${isUp
                      ? "text-[#16A34A] bg-[#16A34A]/10"
                      : "text-[#DC2626] bg-[#DC2626]/10"
                      }`}
                  >
                    {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(chg).toFixed(1)}% YoY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* ── RED FLAGS ────────────────────────────────────────────────── */}
      {flags.length > 0 && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
          <h3 className="text-sm font-bold text-[#92400E] flex items-center gap-2">
            <AlertTriangle size={15} className="text-[#D97706]" />
            Warning Signals &amp; Risks ({flags.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {flags.map((f, i) => (
              <div
                key={i}
                className={`rounded-[6px] border px-3 py-2 text-xs flex items-start gap-2 ${f.severity === "critical"
                  ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                  : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                  }`}
              >
                <span className="shrink-0 font-bold mt-0.5">{f.status_symbol || "⚑"}</span>
                <div>
                  <span className="font-bold block">{f.title_en || f.title_ar}</span>
                  <span className="text-[10px] block mt-0.5">{f.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}