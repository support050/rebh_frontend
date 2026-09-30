import React from "react";
import { TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { SectionPanel } from "./CommonCards";

// ─── FlowBar (detail rows below chart) ──────────────────────────────────────
interface FlowBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

export function FlowBar({ label, value, max, color, unit = "M SAR" }: FlowBarProps) {
  const pct = max !== 0 ? Math.min(100, Math.abs(value / max) * 100) : 0;
  const isNeg = value < 0;

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-[11px] font-semibold text-[#374151] w-44 shrink-0 text-left flex items-center justify-start gap-1">
        {label}
      </span>
      {/* Bidirectional visual cue */}
      <div className="flex-1 h-5 bg-[#F1F5F9] rounded-full overflow-hidden relative flex items-center">
        <div
          className={`h-full rounded-full transition-all duration-300 flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${isNeg ? "justify-end pr-1.5 border border-[#F87171]/50" : "border border-black/5"
            }`}
          style={{
            width: `${pct}%`,
            backgroundImage: isNeg
              ? "linear-gradient(to right, #DC2626, #FCA5A5)"
              : `linear-gradient(to right, ${color}, ${color}CC)`,
          }}
        >
          {pct > 12 &&
            (isNeg ? (
              <ArrowDownRight size={10} className="text-white/95" strokeWidth={2.5} />
            ) : (
              <ArrowUpRight size={10} className="text-white/90 ml-1" strokeWidth={2.5} />
            ))}
        </div>
      </div>
      <span
        className={`font-mono text-[11px] font-bold w-24 text-right tabular-nums ${isNeg ? "text-[#DC2626]" : "text-[#1E293B]"
          }`}
      >
        {value >= 0 ? "+" : ""}
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit}
      </span>
    </div>
  );
}

// ─── True Waterfall Computation ───────────────────────────────────────────────
/**
 * Converts raw waterfall entries into recharts-compatible stacked data.
 * Each bar = invisible "base" spacer + visible "bar" value.
 * For outflows (negative val), the bar goes DOWN from the running total.
 */
function buildWaterfallChartData(
  entries: Array<{ name: string; val: number; fill: string; type: string; desc: string }>
) {
  let runningTotal = 0;
  return entries.map((entry) => {
    const isNeg = entry.val < 0;
    const absVal = Math.abs(entry.val);

    let base: number;
    let barVal: number;

    if (entry.type === "inflow" || entry.type === "subtotal" || entry.type === "bottomline" || entry.type === "cash" || entry.type === "fcf") {
      // Positive bars: start from current runningTotal
      base = runningTotal;
      barVal = absVal;
      if (entry.type !== "subtotal" && entry.type !== "bottomline") {
        // subtotals/bottomlines reset or show absolute — don't accumulate
      }
    } else {
      // Outflow: bar drops DOWN from runningTotal
      base = runningTotal + entry.val; // = runningTotal - absVal
      barVal = absVal;
    }

    // For subtotals and bottomlines, show absolute value from 0
    if (entry.type === "subtotal" || entry.type === "bottomline") {
      base = 0;
      barVal = entry.val >= 0 ? entry.val : -entry.val;
    }

    // For cash/fcf sections, they're independent — show from 0
    if (entry.type === "cash" || entry.type === "capex" || entry.type === "fcf") {
      base = 0;
      barVal = entry.val >= 0 ? entry.val : -entry.val;
    }

    // Advance running total
    if (entry.type === "inflow") runningTotal += entry.val;
    else if (entry.type === "outflow") runningTotal += entry.val; // val is already negative

    return {
      name: entry.name,
      base: Math.max(0, base),
      barVal: Math.max(0, barVal),
      rawVal: entry.val,
      fill: entry.fill,
      type: entry.type,
      desc: entry.desc,
      // Flag if truly a subtotal/reset
      isReset: entry.type === "subtotal" || entry.type === "bottomline",
    };
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface MoneyRiverProps {
  activePeriod: string;
  waterfallData: Array<{
    name: string;
    val: number;
    fill: string;
    type: string;
    desc: string;
  }>;
  rev: number;
  cogs: number;
  gp: number;
  op: number;
  net: number;
  cfo: number;
  capex: number;
  fcf: number;
  showFormulas: boolean;
}

export function MoneyRiverSection({
  activePeriod,
  waterfallData,
  rev,
  cogs,
  gp,
  op,
  net,
  cfo,
  capex,
  fcf,
  showFormulas,
}: MoneyRiverProps) {
  const chartData = buildWaterfallChartData(waterfallData);

  return (
    <SectionPanel className="space-y-5">
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <TrendingUp size={15} className="text-[#8C3B32]" />
            Interactive Money River ({activePeriod})
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            How value is generated and distributed, from total revenue down to final Free Cash Flow (FCF).
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[6px]">
          Unit: SAR millions
        </span>
      </div>

      {/* True Waterfall Chart using stacked bars with invisible spacer */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: 10, bottom: 25 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#475569" }}
              interval={0}
              angle={0}
              dy={8}
              textAnchor="middle"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickFormatter={(val) => `${Number(val).toLocaleString()}M`}
              orientation="left"
            />
            <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  const isPositive = d.rawVal >= 0;
                  return (
                    <div className="bg-[#0F172A] text-white p-3 rounded-[8px] shadow-xl text-xs font-sans space-y-1 z-50">
                      <div className="font-bold flex items-center justify-between gap-4 border-b border-white/10 pb-1">
                        <span>{d.name}</span>
                        <span className="font-mono tabular-nums" style={{ color: d.fill }}>
                          {isPositive ? "+" : ""}
                          {d.rawVal.toLocaleString()} M SAR
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">{d.desc}</p>
                      {rev > 0 && (
                        <div className="text-[10px] font-mono text-[#CBD5E1] pt-1 tabular-nums">
                          Represents {Math.abs((d.rawVal / rev) * 100).toFixed(1)}% of total revenue
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Invisible spacer bar (lifts the visible bar to correct position) */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" radius={[0, 0, 0, 0]} legendType="none" />
            {/* Visible value bar */}
            <Bar dataKey="barVal" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  opacity={entry.rawVal === 0 ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Metric Rows */}
      <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
        <FlowBar label="Revenue" value={rev} max={rev} color="#2563EB" />
        <FlowBar label="Cost of Goods Sold (COGS)" value={-cogs} max={rev} color="#94A3B8" />
        <FlowBar label="Gross Profit (GP)" value={gp} max={rev} color="#16A34A" />
        <FlowBar label="Operating Profit (EBIT)" value={op} max={rev} color="#8C3B32" />
        <FlowBar label="Net Income" value={net} max={rev} color="#DC2626" />
        <div className="border-t border-dashed border-[#E5E7EB] pt-1" />
        <FlowBar label="Operating Cash Flow (CFO)" value={cfo} max={Math.abs(rev)} color="#059669" />
        <FlowBar label="Capital Expenditure (CapEx)" value={-capex} max={Math.abs(rev)} color="#D97706" />
        <FlowBar label="Free Cash Flow (FCF)" value={fcf} max={Math.abs(rev)} color="#0D9488" />
      </div>

      {showFormulas && (
        <div className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 py-2 mt-1">
          GP = Rev − COGS · EBIT = GP − OpEx · FCF = CFO − |CapEx| · Red bars marked ▼ = negative values
        </div>
      )}
    </SectionPanel>
  );
}