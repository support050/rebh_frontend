import React from "react";
import { Layers } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { SectionPanel, KpiCard } from "./CommonCards";

interface BalanceSheetBreathingProps {
  activePeriod: string;
  activePeriodIndex: number;
  ta: number;
  ca: number;
  tl: number;
  eq: number;
  cash: number;
  re: number;
  curRatio: number | null;
  deRatio: number | null;
  balanceEvolutionData: Array<{
    period: string;
    cash: number;
    otherCurrent: number;
    nonCurrent: number;
    totalAssets: number;
    equity: number;
    debt: number;
    otherLiabilities: number;
    totalLiabAndEq: number;
  }>;
  showFormulas: boolean;
}

export function BalanceSheetBreathingSection({
  activePeriod,
  activePeriodIndex,
  ta,
  ca,
  tl,
  eq,
  cash,
  re,
  curRatio,
  deRatio,
  balanceEvolutionData,
  showFormulas,
}: BalanceSheetBreathingProps) {
  // Find which bar in the chart corresponds to the currently selected period.
  // balanceEvolutionData is a slice of the last N BS periods.
  // activePeriodIndex = bsIndex (index in full bs.periods array).
  // The chart data starts at offset = (fullBsLength - sliceLength).
  // We use string matching as the reliable method (works even if lengths differ).
  const chartActiveIdx = (() => {
    // Primary: string match on period label
    const byStr = balanceEvolutionData.findIndex((d) => d.period === activePeriod);
    if (byStr >= 0) return byStr;
    // Fallback: index-based — activePeriodIndex relative to the slice start
    const sliceStart = Math.max(0, balanceEvolutionData.length - 5);
    const relIdx = activePeriodIndex - sliceStart;
    return relIdx >= 0 && relIdx < balanceEvolutionData.length ? relIdx : -1;
  })();
  return (
    <SectionPanel className="space-y-5">
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <Layers size={15} className="text-[#8C3B32]" />
            Balance Sheet Breathing — Capital Structure Evolution
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Asset growth and funding structure (Shareholders&apos; Equity vs. Debt) across prior periods
          </p>
        </div>
        <span className="font-mono text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] tabular-nums">
          Current Total Assets: {ta.toLocaleString(undefined, { maximumFractionDigits: 0 })} M SAR
        </span>
      </div>

      {/* Dynamic Recharts Stacked Bar: Evolution across periods */}
      {balanceEvolutionData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceEvolutionData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="period"
                tick={({ x, y, payload, index }: any) => (
                  <text
                    x={Number(x)}
                    y={Number(y) + 10}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={index === chartActiveIdx ? 800 : 400}
                    fill={index === chartActiveIdx ? "#8C3B32" : "#475569"}
                  >
                    {payload?.value}
                    {index === chartActiveIdx ? " ◀" : ""}
                  </text>
                )}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B" }}
                tickFormatter={(val) => `${Number(val).toLocaleString()}M`}
                orientation="left"
              />
              {/* Highlight active period with a vertical reference band */}
              {chartActiveIdx >= 0 && (
                <ReferenceLine
                  x={activePeriod}
                  stroke="#8C3B32"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={{
                    value: "Selected period",
                    position: "top",
                    fontSize: 9,
                    fill: "#8C3B32",
                    fontWeight: 700,
                  }}
                />
              )}
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const isActive = label === activePeriod;
                    return (
                      <div className={`bg-[#0F172A] text-white p-3 rounded-[8px] shadow-xl text-xs font-sans space-y-1.5 z-50 ${isActive ? "ring-1 ring-[#8C3B32]" : ""}`}>
                        <div className="font-bold border-b border-white/10 pb-1 flex justify-between gap-4">
                          <span>
                            Period: {label}
                            {isActive && <span className="ml-1 text-[#8C3B32]"> ◀ Selected</span>}
                          </span>
                          <span className="text-[#38BDF8] font-mono tabular-nums">
                            Assets: {payload[0]?.payload?.totalAssets?.toLocaleString()} M
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px] tabular-nums">
                          <div className="flex justify-between gap-3 text-[#60A5FA]">
                            <span>Cash &amp; equivalents:</span>
                            <span>{payload[0]?.payload?.cash?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#34D399]">
                            <span>Other current assets:</span>
                            <span>{payload[0]?.payload?.otherCurrent?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#94A3B8]">
                            <span>Non-current assets:</span>
                            <span>{payload[0]?.payload?.nonCurrent?.toLocaleString()} M</span>
                          </div>
                          <div className="border-t border-white/10 pt-1 flex justify-between gap-3 text-[#38BDF8]">
                            <span>Shareholders&apos; Equity:</span>
                            <span>{payload[0]?.payload?.equity?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#F87171]">
                            <span>Total debt:</span>
                            <span>{payload[0]?.payload?.debt?.toLocaleString()} M</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                content={() => {
                  const items = [
                    { key: "cash", label: "Cash", color: "#2563EB" },
                    { key: "otherCurrent", label: "Other current", color: "#10B981" },
                    { key: "nonCurrent", label: "Non-current assets", color: "#94A3B8" },
                    { key: "equity", label: "Shareholders' equity", color: "#0EA5E9" },
                    { key: "debt", label: "Debt & borrowings", color: "#DC2626" },
                  ];
                  return (
                    <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
                      {items.map((item) => (
                        <div key={item.key} className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: item.color }}
                            className="w-3 h-3 rounded-sm shrink-0 inline-block"
                          />
                          <span className="text-[11px] text-[#374151] font-sans">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {/* Assets stack — dim non-active bars */}
              <Bar dataKey="cash" stackId="assets" name="cash" radius={[0, 0, 0, 0]}>
                {balanceEvolutionData.map((_, i) => (
                  <Cell
                    key={`cash-${i}`}
                    fill="#2563EB"
                    opacity={chartActiveIdx < 0 || i === chartActiveIdx ? 1 : 0.35}
                  />
                ))}
              </Bar>
              <Bar dataKey="otherCurrent" stackId="assets" name="otherCurrent">
                {balanceEvolutionData.map((_, i) => (
                  <Cell
                    key={`oc-${i}`}
                    fill="#10B981"
                    opacity={chartActiveIdx < 0 || i === chartActiveIdx ? 1 : 0.35}
                  />
                ))}
              </Bar>
              <Bar dataKey="nonCurrent" stackId="assets" name="nonCurrent" radius={[3, 3, 0, 0]}>
                {balanceEvolutionData.map((_, i) => (
                  <Cell
                    key={`nc-${i}`}
                    fill="#94A3B8"
                    opacity={chartActiveIdx < 0 || i === chartActiveIdx ? 1 : 0.35}
                  />
                ))}
              </Bar>
              {/* Funding stack */}
              <Bar dataKey="equity" stackId="funding" name="equity">
                {balanceEvolutionData.map((_, i) => (
                  <Cell
                    key={`eq-${i}`}
                    fill="#0EA5E9"
                    opacity={chartActiveIdx < 0 || i === chartActiveIdx ? 1 : 0.35}
                  />
                ))}
              </Bar>
              <Bar dataKey="debt" stackId="funding" name="debt" radius={[3, 3, 0, 0]}>
                {balanceEvolutionData.map((_, i) => (
                  <Cell
                    key={`debt-${i}`}
                    fill="#DC2626"
                    opacity={chartActiveIdx < 0 || i === chartActiveIdx ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-[#6B7280]">
          Historical balance sheet data is unavailable for this ticker
        </div>
      )}

      {/* Current Period Snapshot Bars */}
      {ta > 0 && (
        <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8C3B32]"></span>
              Capital structure &amp; balance sheet composition for the selected period ({activePeriod})
            </span>
            <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
              Total: {ta.toLocaleString(undefined, { maximumFractionDigits: 0 })} M
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Assets side */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-[#475569]">
                <span>Assets</span>
                <span className="font-mono text-[10px] text-[#64748B] tabular-nums">100%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex w-full bg-[#E2E8F0] p-0.5 gap-0.5">
                {ta > 0 && (
                  <>
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (cash / ta) * 100)}%` }}
                      title={`Cash: ${cash.toFixed(0)} M (${((cash / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${Math.max(2, ((ca - cash) / ta) * 100)}%` }}
                      title={`Other current assets: ${(ca - cash).toFixed(0)} M (${(((ca - cash) / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#94A3B8] rounded-full transition-all"
                      style={{ width: `${Math.max(2, ((ta - ca) / ta) * 100)}%` }}
                      title={`Non-current assets: ${(ta - ca).toFixed(0)} M (${(((ta - ca) / ta) * 100).toFixed(1)}%)`}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  Cash: {((cash / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Other current: {(((ca - cash) / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  Non-current: {(((ta - ca) / ta) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Funding side: Liabilities & Equity */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-[#475569]">
                <span>Funding structure (Liabilities &amp; Equity)</span>
                <span className="font-mono text-[10px] text-[#64748B] tabular-nums">100%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex w-full bg-[#E2E8F0] p-0.5 gap-0.5">
                {ta > 0 && (
                  <>
                    <div
                      className="h-full bg-[#0EA5E9] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (eq / ta) * 100)}%` }}
                      title={`Shareholders' Equity: ${eq.toFixed(0)} M (${((eq / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#DC2626] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (tl / ta) * 100)}%` }}
                      title={`Liabilities: ${tl.toFixed(0)} M (${((tl / ta) * 100).toFixed(1)}%)`}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                  Shareholders&apos; Equity: {((eq / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Total liabilities: {((tl / ta) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI grid with unified KpiCard component */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        <KpiCard
          label="Current Ratio"
          val={curRatio}
          unit="×"
          color={curRatio != null && curRatio >= 1.5 ? "#166534" : "#991B1B"}
          note={curRatio != null ? (curRatio >= 1.5 ? "✓ Adequate coverage" : "✗ Liquidity squeezed") : undefined}
          formula="Current Assets ÷ Current Liabilities"
          showFormula={showFormulas}
          tooltipText="Ability to meet short-term obligations from current assets"
          maxFractionDigits={2}
        />
        <KpiCard
          label="D/E Leverage"
          val={deRatio}
          unit="×"
          color={deRatio != null && deRatio <= 1.5 ? "#166534" : "#991B1B"}
          note={deRatio != null ? (deRatio <= 1.5 ? "✓ Moderate leverage" : "✗ Heavy reliance on debt") : undefined}
          formula="Total Debt ÷ Shareholders' Equity"
          showFormula={showFormulas}
          tooltipText="Debt financing relative to Shareholders' Equity"
          maxFractionDigits={2}
        />
        <KpiCard
          label="Cash & Equivalents"
          val={cash}
          unit="M SAR"
          color={cash > 0 ? "#166534" : "#991B1B"}
          note={cash > 0 ? "✓ Cash liquidity available" : "✗ Insufficient cash"}
          formula="Cash and cash equivalents per the Balance Sheet"
          showFormula={showFormulas}
          tooltipText="Ready cash and cash equivalents available immediately"
          maxFractionDigits={0}
        />
        <KpiCard
          label="Retained Earnings"
          val={re}
          unit="M SAR"
          color={re >= 0 ? "#166534" : "#991B1B"}
          note={re >= 0 ? "✓ Positive historical accumulation" : "✗ Accumulated losses"}
          formula="Cumulative undistributed earnings across the years"
          showFormula={showFormulas}
          tooltipText="Cumulative net income retained in the company and not paid out as dividends"
          maxFractionDigits={0}
        />
      </div>
    </SectionPanel>
  );
}