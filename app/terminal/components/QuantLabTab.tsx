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

// UX note: the original table had no way to find a single name in a long
// cross-sectional ranking, and only ever sorted by composite rank. Added a
// symbol/company search box and click-to-sort columns (matching the pattern
// used on the Ratios — All Market tab) so this behaves consistently with the
// rest of the terminal.

type SortKey = "rank" | "composite" | "value" | "quality" | "cash" | "growth" | "balance" | "coverage" | "sym";

export function QuantLabTab({ quantData }: QuantLabTabProps) {
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = React.useState(true);

  const allFactors = React.useMemo(
    () => Object.entries(quantData.factors),
    [quantData.factors]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q ? allFactors.filter(([sym]) => sym.toLowerCase().includes(q)) : allFactors;
    return [...rows].sort((a, b) => {
      const [symA, fA] = a;
      const [symB, fB] = b;
      let x: number | string;
      let y: number | string;
      if (sortKey === "sym") {
        x = symA;
        y = symB;
      } else {
        x = (fA as any)[sortKey];
        y = (fB as any)[sortKey];
      }
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === "number" && typeof y === "number") {
        return sortAsc ? x - y : y - x;
      }
      return sortAsc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
    });
  }, [allFactors, query, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "sym");
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const top = filtered[0];
    if (!top) return;
    const el = document.getElementById(`quant-row-${top[0]}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("bg-[#F3F4F6]");
    window.setTimeout(() => el?.classList.remove("bg-[#F3F4F6]"), 900);
  }

  const zc = (v: number | null | undefined) => {
    if (v === null || v === undefined) {
      return <td className="px-2.5 py-1.5 text-[#9CA3AF]">—</td>;
    }
    const cls = v > 0.5 ? "text-[#16A34A] font-semibold" : v < -0.5 ? "text-[#DC2626]" : "text-[#1A1A1A]";
    return <td className={`px-2.5 py-1.5 ${cls}`}>{v.toFixed(2)}</td>;
  };

  const cols: [string, SortKey][] = [
    ["Composite z", "composite"],
    ["Value", "value"],
    ["Quality", "quality"],
    ["Cash", "cash"],
    ["Growth", "growth"],
    ["Balance", "balance"],
  ];

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#9CA3AF]">
        Quant Lab — cross-sectional factor model · Asness/Shaw layer
      </div>

      {/* 4 Quant KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard value={`${quantData.quant.scored_n}`} label={`companies scored (of ${quantData.quant.pool_n} eligible non-financials)`} sub="excluded names are listed, never silent" />
        <KpiCard value="5" label="orthogonal factors" sub="value · quality · cash · growth · balance" />
        <KpiCard value="±3" label="z-score clipping" sub="outliers are data risk, not alpha" />
        <KpiCard value="Sprint 5" label="backtest & hit-rates" sub="a rank without a published hit-rate is a hypothesis — declared" />
      </div>

      {/* Factor Ranking Table */}
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="font-bold text-[12.5px] text-[#1A1A1A]">
            Composite Factor Ranking{" "}
            <span className="font-normal text-[10px] text-[#9CA3AF]">
              · equal-weight z-scores: Value (−EV/EBIT) · Quality (ROIC) · Cash (FCF yield) · Growth (net YoY) · Balance (−D/E)
            </span>
          </h3>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search symbol…"
            className="w-full max-w-[200px] rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-[11.5px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15"
          />
        </div>

        <div className="mx-4 my-3 rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-[11px] leading-relaxed text-[#6B7280]">
          ⚠ <b className="text-[#1A1A1A]">Declared limits (the quant panel&apos;s own demand):</b> scores are cross-sectional on latest data only —{" "}
          <b className="text-[#1A1A1A]">no backtest has been run yet</b> (Sprint 5), factor weights are equal by design until calibration, and coverage per name is shown. A rank without a published hit-rate is a hypothesis, not an edge — Thorp.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11.8px] tabular-nums">
            <thead>
              <tr className="bg-[#F3F4F6] text-[9.8px] text-[#6B7280]">
                <th
                  onClick={() => handleSort("rank")}
                  className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-2 text-left font-semibold ${sortKey === "rank" ? "text-[#8C3B32]" : ""}`}
                >
                  #
                </th>
                <th
                  onClick={() => handleSort("sym")}
                  className={`sticky left-0 z-10 cursor-pointer select-none whitespace-nowrap bg-[#F3F4F6] px-2.5 py-2 text-left font-semibold ${sortKey === "sym" ? "text-[#8C3B32]" : ""}`}
                >
                  Symbol
                </th>
                {cols.map(([label, key]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-2 font-semibold ${sortKey === key ? "text-[#8C3B32]" : ""}`}
                  >
                    {label}
                  </th>
                ))}
                <th className="px-2.5 py-2 font-semibold">Factors</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(([sym, f]) => (
                <tr key={sym} id={`quant-row-${sym}`} className="border-b border-[#E5E7EB] transition-colors hover:bg-[#F3F4F6]">
                  <td className="px-2.5 py-1.5 text-left font-bold text-[#1A1A1A]">{f.rank}</td>
                  <td className="sticky left-0 z-10 bg-white px-2.5 py-1.5 text-left font-semibold text-[#1A1A1A]">
                    {sym}
                  </td>
                  <td className="px-2.5 py-1.5 font-bold text-[#8C3B32]">{f.composite.toFixed(2)}</td>
                  {zc(f.value)}
                  {zc(f.quality)}
                  {zc(f.cash)}
                  {zc(f.growth)}
                  {zc(f.balance)}
                  <td className="px-2.5 py-1.5 text-[#9CA3AF]">{f.coverage}/5</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[#9CA3AF]">
                    No symbols match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10.5px] leading-relaxed text-[#6B7280]">
          {quantData.quant.scored_n} non-financial companies scored (of {quantData.quant.pool_n} eligible — names with corrupted cores excluded, never silently). z-scores clipped at ±3.
        </div>

      </div>
    </div>
  );
}

function KpiCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="text-[22px] font-extrabold text-[#1A1A1A]">{value}</div>
      <div className="mt-1 text-[11px] text-[#1A1A1A]">{label}</div>
      <div className="text-[10px] text-[#9CA3AF]">{sub}</div>
    </div>
  );
}