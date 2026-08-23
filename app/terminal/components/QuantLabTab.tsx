import React from "react";

interface QuantLabTabProps {
  quantData: {
    factors: Record<string, {
      value: number | null;
      quality: number | null;
      cash: number | null;
      growth: number | null;
      balance: number | null;
      composite: number;
      coverage: number;
      rank: number;
    }>;
    quant: {
      pool_n: number;
      scored_n: number;
      declared_limits: string;
      top15?: any[];
    };
  };
  fmt: (v: number | null | undefined, digits?: number) => string;
}

export function QuantLabTab({ quantData }: QuantLabTabProps) {
  const sortedFactors = Object.entries(quantData.factors).sort((a, b) => a[1].rank - b[1].rank);

  const zc = (v: number | null | undefined) => {
    if (v === null || v === undefined) {
      return <td className="px-2.5 py-1 text-[#898781]">—</td>;
    }
    const cls = v > 0.5 ? "text-[#0ca30c] font-semibold" : v < -0.5 ? "text-[#e66767]" : "";
    return <td className={`px-2.5 py-1 ${cls}`}>{v.toFixed(2)}</td>;
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        QUANT LAB — CROSS-SECTIONAL FACTOR MODEL · Asness/Shaw layer
      </div>

      {/* 4 Quant KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
          <div className="text-[22px] font-extrabold text-[#f2f1ed]">{quantData.quant.scored_n}</div>
          <div className="text-[11px] text-[#c3c2b7] mt-0.5">companies scored (of {quantData.quant.pool_n} eligible non-financials)</div>
          <div className="text-[10px] text-[#898781]">excluded names are listed, never silent</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
          <div className="text-[22px] font-extrabold text-[#f2f1ed]">5</div>
          <div className="text-[11px] text-[#c3c2b7] mt-0.5">orthogonal factors</div>
          <div className="text-[10px] text-[#898781]">value · quality · cash · growth · balance</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
          <div className="text-[22px] font-extrabold text-[#f2f1ed]">±3</div>
          <div className="text-[11px] text-[#c3c2b7] mt-0.5">z-score clipping</div>
          <div className="text-[10px] text-[#898781]">outliers are data risk, not alpha</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
          <div className="text-[22px] font-extrabold text-[#f2f1ed]">Sprint 5</div>
          <div className="text-[11px] text-[#c3c2b7] mt-0.5">backtest & hit-rates</div>
          <div className="text-[10px] text-[#898781]">a rank without a published hit-rate is a hypothesis — declared</div>
        </div>
      </div>

      {/* Factor Ranking Table */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          Composite Factor Ranking{" "}
          <span className="font-normal text-[10px] text-[#898781]">
            · equal-weight z-scores: Value (−EV/EBIT) · Quality (ROIC) · Cash (FCF yield) · Growth (net YoY) · Balance (−D/E)
          </span>
        </h3>

        <div className="rounded-lg bg-[#222220] mx-3.5 my-2.5 p-3 text-[11px] text-[#c3c2b7]">
          ⚠ <b className="text-[#f2f1ed]">Declared limits (the quant panel&apos;s own demand):</b> scores are cross-sectional on latest data only —{" "}
          <b className="text-[#f2f1ed]">no backtest has been run yet</b> (Sprint 5), factor weights are equal by design until calibration, and coverage per name is shown. A rank without a published hit-rate is a hypothesis, not an edge — Thorp.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11.8px]">
            <thead>
              <tr className="border-b border-[#383835] text-[9.8px] text-[#898781]">
                <th className="px-2.5 py-1.5 text-left">#</th>
                <th className="px-2.5 py-1.5 text-left">Symbol</th>
                <th className="px-2.5 py-1.5">Composite z</th>
                <th className="px-2.5 py-1.5">Value</th>
                <th className="px-2.5 py-1.5">Quality</th>
                <th className="px-2.5 py-1.5">Cash</th>
                <th className="px-2.5 py-1.5">Growth</th>
                <th className="px-2.5 py-1.5">Balance</th>
                <th className="px-2.5 py-1.5">Factors</th>
              </tr>
            </thead>
            <tbody>
              {sortedFactors.map(([sym, f]) => (
                <tr key={sym} className="border-b border-[#2c2c2a] hover:bg-[#222220]">
                  <td className="px-2.5 py-1 text-left font-bold">{f.rank}</td>
                  <td className="px-2.5 py-1 text-left font-semibold text-[#f2f1ed]">
                    {sym}
                  </td>
                  <td className="px-2.5 py-1 font-bold text-[#3987e5]">{f.composite.toFixed(2)}</td>
                  {zc(f.value)}
                  {zc(f.quality)}
                  {zc(f.cash)}
                  {zc(f.growth)}
                  {zc(f.balance)}
                  <td className="px-2.5 py-1 text-[#898781]">{f.coverage}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#2c2c2a] px-3.5 py-2.5 text-[10.5px] leading-relaxed text-[#898781]">
          <b>Note:</b> {quantData.quant.scored_n} non-financial companies scored (of {quantData.quant.pool_n} eligible). <b>Insurance companies (80xx–83xx), Banks, and REITs are excluded by design</b> because traditional non-financial factor metrics (EV/EBIT, industrial ROIC, standard debt-to-equity) are not applicable to financial institutions under IFRS standards. z-scores clipped at ±3.
        </div>
      </div>
    </div>
  );
}
