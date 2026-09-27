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
            تنفّس الميزانية وتطور هيكل رأس المال — Balance Sheet Evolution
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            توسع الأصول وهيكل التمويل (حقوق المساهمين vs الديون) عبر الفترات السابقة
          </p>
        </div>
        <span className="font-mono text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[6px] tabular-nums">
          إجمالي الأصول الحالية: {ta.toLocaleString(undefined, { maximumFractionDigits: 0 })} M SAR
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
                orientation="right"
              />
              {/* Highlight active period with a vertical reference band */}
              {chartActiveIdx >= 0 && (
                <ReferenceLine
                  x={activePeriod}
                  stroke="#8C3B32"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={{
                    value: "الفترة المحددة",
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
                            فترة: {label}
                            {isActive && <span className="mr-1 text-[#8C3B32]"> ◀ محدد</span>}
                          </span>
                          <span className="text-[#38BDF8] font-mono tabular-nums">
                            الأصول: {payload[0]?.payload?.totalAssets?.toLocaleString()} M
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px] tabular-nums">
                          <div className="flex justify-between gap-3 text-[#60A5FA]">
                            <span>نقد ومعادلات:</span>
                            <span>{payload[0]?.payload?.cash?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#34D399]">
                            <span>أصول متداولة أخرى:</span>
                            <span>{payload[0]?.payload?.otherCurrent?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#94A3B8]">
                            <span>أصول طويلة الأجل:</span>
                            <span>{payload[0]?.payload?.nonCurrent?.toLocaleString()} M</span>
                          </div>
                          <div className="border-t border-white/10 pt-1 flex justify-between gap-3 text-[#38BDF8]">
                            <span>حقوق المساهمين:</span>
                            <span>{payload[0]?.payload?.equity?.toLocaleString()} M</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[#F87171]">
                            <span>إجمالي الديون:</span>
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
                    { key: "cash", label: "نقد كاش", color: "#2563EB" },
                    { key: "otherCurrent", label: "متداول أخرى", color: "#10B981" },
                    { key: "nonCurrent", label: "أصول ثابتة", color: "#94A3B8" },
                    { key: "equity", label: "حقوق ملكية", color: "#0EA5E9" },
                    { key: "debt", label: "ديون وقروض", color: "#DC2626" },
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
          بيانات الميزانية التاريخية غير متوفرة لهذا الرمز
        </div>
      )}

      {/* Current Period Snapshot Bars */}
      {ta > 0 && (
        <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8C3B32]"></span>
              توزيع هيكل رأس المال والميزانية للفترة المحددة ({activePeriod})
            </span>
            <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
              الإجمالي: {ta.toLocaleString(undefined, { maximumFractionDigits: 0 })} M
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* جانب الأصول Assets Side */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-[#475569]">
                <span>جانب الأصول (Assets)</span>
                <span className="font-mono text-[10px] text-[#64748B] tabular-nums">100%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex w-full bg-[#E2E8F0] p-0.5 gap-0.5">
                {ta > 0 && (
                  <>
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (cash / ta) * 100)}%` }}
                      title={`نقد: ${cash.toFixed(0)} M (${((cash / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${Math.max(2, ((ca - cash) / ta) * 100)}%` }}
                      title={`أصول متداولة أخرى: ${(ca - cash).toFixed(0)} M (${(((ca - cash) / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#94A3B8] rounded-full transition-all"
                      style={{ width: `${Math.max(2, ((ta - ca) / ta) * 100)}%` }}
                      title={`أصول غير متداولة: ${(ta - ca).toFixed(0)} M (${(((ta - ca) / ta) * 100).toFixed(1)}%)`}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  نقد: {((cash / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  متداولة أخرى: {(((ca - cash) / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  أصول ثابتة: {(((ta - ca) / ta) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* جانب التمويل Liabilities & Equity */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-[#475569]">
                <span>هيكل التمويل (Liabilities & Equity)</span>
                <span className="font-mono text-[10px] text-[#64748B] tabular-nums">100%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex w-full bg-[#E2E8F0] p-0.5 gap-0.5">
                {ta > 0 && (
                  <>
                    <div
                      className="h-full bg-[#0EA5E9] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (eq / ta) * 100)}%` }}
                      title={`حقوق المساهمين: ${eq.toFixed(0)} M (${((eq / ta) * 100).toFixed(1)}%)`}
                    />
                    <div
                      className="h-full bg-[#DC2626] rounded-full transition-all"
                      style={{ width: `${Math.max(2, (tl / ta) * 100)}%` }}
                      title={`التزامات: ${tl.toFixed(0)} M (${((tl / ta) * 100).toFixed(1)}%)`}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                  حقوق المساهمين: {((eq / ta) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  إجمالي الالتزامات: {((tl / ta) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI grid with unified KpiCard component */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        <KpiCard
          label="نسبة التداول"
          val={curRatio}
          unit="×"
          color={curRatio != null && curRatio >= 1.5 ? "#166534" : "#991B1B"}
          note={curRatio != null ? (curRatio >= 1.5 ? "✓ تغطية كافية" : "✗ سيولة مضغوطة") : undefined}
          formula="الأصول المتداولة ÷ الالتزامات المتداولة"
          showFormula={showFormulas}
          tooltipText="القدرة على سداد الالتزامات قصيرة الأجل من الأصول المتداولة"
          maxFractionDigits={2}
        />
        <KpiCard
          label="D/E الرافعة"
          val={deRatio}
          unit="×"
          color={deRatio != null && deRatio <= 1.5 ? "#166534" : "#991B1B"}
          note={deRatio != null ? (deRatio <= 1.5 ? "✓ رافعة معتدلة" : "✗ اعتماد عالي على الديون") : undefined}
          formula="إجمالي الديون ÷ حقوق المساهمين"
          showFormula={showFormulas}
          tooltipText="نسبة الديون الممولة للأصول مقارنة بحقوق المساهمين"
          maxFractionDigits={2}
        />
        <KpiCard
          label="نقد لدى الشركة"
          val={cash}
          unit="M SAR"
          color={cash > 0 ? "#166534" : "#991B1B"}
          note={cash > 0 ? "✓ سيولة نقدية متاحة" : "✗ لا كاش كافٍ"}
          formula="النقد وما في حكمه في الميزانية"
          showFormula={showFormulas}
          tooltipText="النقد الجاهز والمعادلات النقدية المتاحة فوراً"
          maxFractionDigits={0}
        />
        <KpiCard
          label="أرباح مُبقاة"
          val={re}
          unit="M SAR"
          color={re >= 0 ? "#166534" : "#991B1B"}
          note={re >= 0 ? "✓ تراكم تاريخي إيجابي" : "✗ خسائر متراكمة"}
          formula="الأرباح التراكمية غير الموزعة عبر السنوات"
          showFormula={showFormulas}
          tooltipText="صافي الدخل التراكمي المحتجز داخل الشركة ولم يوزع كأرباح"
          maxFractionDigits={0}
        />
      </div>
    </SectionPanel>
  );
}
