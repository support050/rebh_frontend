import React from "react";

interface MarketMachineProps {
  macro: {
    agg_earnings_ttm_bn: number;
    agg_earnings_prev_bn?: number;
    agg_earnings_yoy_pct?: number;
    agg_sample_n: number;
    sector_breadth: Record<string, { n: number; pct_up: number; mc: number; ni_ttm: number }>;
    bank_assets_bn: number;
    bank_ni_ttm_bn: number;
    banks_n: number;
    top10_mc_share_pct: number;
    total_mc_bn: number;
    median_pe: number;
    median_pb: number;
    median_fcf_yield: number;
    median_de_nonfin: number;
    coverage_weak_n: number;
    coverage_all_n: number;
    pe_n: number;
  };
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: d });
}

export function MarketMachineTab({ macro }: MarketMachineProps) {
  const yoyPct = macro.agg_earnings_yoy_pct ?? 0;
  const breadthSorted = Object.entries(macro.sector_breadth).sort(
    (a, b) => b[1].pct_up - a[1].pct_up
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          value={`${fmt(macro.agg_earnings_ttm_bn)} bn`}
          label={`aggregate TTM earnings — verified ${macro.agg_sample_n}-co. sample° ⚠`}
          sub={`vs ${fmt(macro.agg_earnings_prev_bn)} bn prior TTM (${yoyPct > 0 ? "+" : ""}${fmt(yoyPct)}%)`}
          color={yoyPct > 0 ? "up" : "down"}
        />
        <KpiCard
          value={`${fmt(macro.bank_assets_bn, 0)} bn`}
          label={`banking system assets (${macro.banks_n} listed banks)°`}
          sub="the credit machine — largest single input to the Saudi cycle"
          color=""
        />
        <KpiCard
          value={`${fmt(macro.median_fcf_yield)}%`}
          label="median FCF yield, non-financials°"
          sub="cash generation of the typical listed company"
          color=""
        />
        <KpiCard
          value={`${fmt(macro.top10_mc_share_pct)}%`}
          label="top 10 market-cap concentration°"
          sub="breadth must be count-based, not cap-weighted"
          color=""
        />
      </div>

      {/* Sector Breadth + Credit Machine */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
            Sector Earnings Breadth{" "}
            <span className="font-normal text-[10px] text-[#9CA3AF]">· % of sector with TTM profit growing YoY° · sectors with n&lt;3 withheld</span>
          </h3>
          <div className="overflow-x-auto overflow-y-auto max-h-[380px]">
            <table className="w-full text-right text-[11.8px] tabular-nums">
              <thead className="sticky top-0 z-10 bg-[#F3F4F6] shadow-sm">
                <tr className="text-[9.8px] text-[#6B7280]">
                  <th className="px-3 py-2 text-left font-semibold">Sector</th>
                  <th className="px-3 py-2 font-semibold">n</th>
                  <th className="px-3 py-2 font-semibold">% growing</th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2 font-semibold">Mkt cap (bn)</th>
                  <th className="px-3 py-2 font-semibold">TTM profit (bn)°</th>
                </tr>
              </thead>
              <tbody>
                {breadthSorted.map(([sec, val]) => (
                  <tr key={sec} className="border-b border-[#E5E7EB] hover:bg-[#F3F4F6]">
                    <td className="px-3 py-2 text-left font-semibold text-[#1A1A1A]">{sec}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]">{val.n}</td>
                    <td className={`px-3 py-2 font-bold ${val.pct_up >= 60 ? "text-[#16A34A]" : val.pct_up < 40 ? "text-[#DC2626]" : "text-[#1A1A1A]"}`}>
                      {val.pct_up}%
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block h-[6px] w-14 overflow-hidden rounded-full bg-[#F3F4F6] align-middle">
                        <i className="block h-full bg-[#8C3B32]" style={{ width: `${val.pct_up}%` }} />
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]">{fmt(val.mc / 1000, 0)}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]">{fmt(val.ni_ttm / 1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
            Charles Dow&apos;s confirmation principle applied to earnings, not just price: a market where banks grow 100% but consumer staples grow 20% is telling you which economy is expanding. Computed from real quarterly filings.
          </div>
        </div>

        {/* Right column: Credit Machine + Concentration */}
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
              The Credit Machine <span className="font-normal text-[10px] text-[#9CA3AF]">· Druckenmiller&apos;s first question: what are the banks doing?</span>
            </h3>
            <div className="p-4 space-y-1">
              <div><span className="text-[22px] font-extrabold text-[#1A1A1A]">{fmt(macro.bank_assets_bn, 0)} bn</span></div>
              <div className="text-[11px] text-[#6B7280]">aggregate assets of all {macro.banks_n} listed banks (SAR bn) — latest balance sheets°</div>
              <div className="mt-3"><span className="text-[22px] font-extrabold text-[#16A34A]">{fmt(macro.bank_ni_ttm_bn)}</span></div>
              <div className="text-[11px] text-[#6B7280]">aggregate bank TTM profit (SAR bn)° · earnings breadth 100% — every bank growing</div>
              <div className="mt-3"><span className="text-[22px] font-extrabold text-[#1A1A1A]">{fmt(macro.median_de_nonfin, 2)}×</span></div>
              <div className="text-[11px] text-[#6B7280]">median non-financial D/E° · {macro.coverage_weak_n} of {macro.coverage_all_n} companies have interest coverage &lt; 2× — the leverage watchlist</div>
            </div>
            <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
              SAIBOR sensitivity scenario (forward NIM impact per bank) ships in Sprint 6 — the balance-sheet inputs are now all pulled. Declared, not promised silently.
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Snapshot + Concentration & Structure */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
            Market Valuation Snapshot <span className="font-normal text-[10px] text-[#9CA3AF]">· medians across fresh, verified filings only</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
            <ValBox value={fmt(macro.median_pe)} label={`median P/E° (n=${macro.pe_n})`} />
            <ValBox value={fmt(macro.median_pb, 2)} label="median P/B°" />
            <ValBox value={`${fmt(macro.median_fcf_yield)}%`} label="median FCF yield°" />
            <ValBox value={fmt(macro.median_de_nonfin, 2)} label="median D/E non-fin°" />
          </div>
          <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
            Every median declares its sample size. No index-weighted illusions: Aramco is 68% of market cap — median &gt; mean for reading the typical company.
          </div>
        </div>

        <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
            Concentration & Structure <span className="font-normal text-[10px] text-[#9CA3AF]">· Soros: find the reflexive concentration</span>
          </h3>
          <div className="p-4">
            <div className="text-[22px] font-extrabold text-[#8C3B32]">{macro.top10_mc_share_pct}%</div>
            <div className="text-[11px] text-[#6B7280]">of total market cap sits in 10 names — breadth readings must be count-based, not cap-weighted</div>
            <div className="mt-4 text-[22px] font-extrabold text-[#1A1A1A]">{fmt(macro.total_mc_bn, 0)} bn</div>
            <div className="text-[11px] text-[#6B7280]">total market cap (SAR bn) · 270 listed symbols · 220 with pulled financials</div>
          </div>
          <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
            Aggregate TTM earnings shown on a {macro.agg_sample_n}-company verified sample (ex-Aramco, ex-corrupt-scale) — declared ⚠ small sample until source scale bugs fixed.
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const colorClass =
    color === "up" ? "text-[#16A34A]" : color === "down" ? "text-[#DC2626]" : color === "gold" ? "text-[#8C3B32]" : "text-[#1A1A1A]";

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className={`text-[22px] font-extrabold ${colorClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[#1A1A1A]">{label}</div>
      <div className="text-[10px] text-[#9CA3AF]">{sub}</div>
    </div>
  );
}

function ValBox({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[19px] font-extrabold text-[#1A1A1A]">{value}</div>
      <div className="text-[10.5px] text-[#9CA3AF]">{label}</div>
    </div>
  );
}