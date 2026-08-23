import React from "react";

export interface RatioRow {
  sym: string;
  name: string;
  sector: string;
  mc: number;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  nm: number | null;
  roic: number | null;
  ev_ebit: number | null;
  current: number | null;
  quick: number | null;
  de: number | null;
  coverage: number | null;
  fcf_yield: number | null;
  fcf_ni: number | null;
  div_yield: number | null;
  g_net: number | null;
  owner_yield: number | null;
  p_roe?: number | null;
  fresh: boolean;
  flags: string[];
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: d });
}

const COLS: [string, string][] = [
  ["Company", "name"],
  ["Sector", "sector"],
  ["Mkt cap (m)", "mc"],
  ["P/E°", "pe"],
  ["P/B°", "pb"],
  ["ROE%°", "roe"],
  ["ROE vs sector", "p_roe"],
  ["Net mgn%°", "nm"],
  ["ROIC%°", "roic"],
  ["EV/EBIT°", "ev_ebit"],
  ["Current°", "current"],
  ["Quick°", "quick"],
  ["D/E°", "de"],
  ["Coverage°", "coverage"],
  ["FCF yld%°", "fcf_yield"],
  ["FCF/NI%°", "fcf_ni"],
  ["Div yld%°", "div_yield"],
  ["NI gr%°", "g_net"],
];

export function RatiosAllMarketTab({ rows }: { rows: RatioRow[] }) {
  const [sortKey, setSortKey] = React.useState<string>("mc");
  const [sortAsc, setSortAsc] = React.useState(false);

  function handleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = React.useMemo(() => {
    return [...rows].sort((a: any, b: any) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
  }, [rows, sortKey, sortAsc]);

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        FINANCIAL RATIOS — ALL MARKET · every ratio computed° from pulled statements, nothing imported
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          Full Ratio Table{" "}
          <span className="font-normal text-[10px] text-[#898781]">
            · {rows.length} companies with pulled balance sheets · click any column to sort · percentile vs sector peers
          </span>
        </h3>

        <div className="rounded-lg bg-[#222220] mx-3.5 my-2.5 p-2.5 text-[11px] text-[#c3c2b7]">
          Every cell is computed from the filings pulled today — valuation (P/E, P/B), profitability (ROE, net margin, ROIC°), liquidity (current, quick), solvency (D/E, interest coverage°), and cash (FCF yield°, FCF/NI°). Stale statements are never priced (blocked cells show —). Sector percentile shown for ROE where the sector has ≥3 fresh peers.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11.8px]">
            <thead>
              <tr className="border-b border-[#383835] text-[9.8px] text-[#898781]">
                {COLS.map(([label, key]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-1.5 ${key === "name" || key === "sector" ? "text-left" : ""} ${sortKey === key ? "text-[#3987e5]" : ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.sym} className="border-b border-[#2c2c2a] hover:bg-[#222220]">
                  {COLS.map(([, key]) => {
                    if (key === "name") {
                      return (
                        <td key={key} className="whitespace-nowrap px-2.5 py-1 text-left font-semibold">
                          {r.name} <small className="text-[#898781] font-normal">{r.sym}</small>
                          {renderBadges(r)}
                        </td>
                      );
                    }
                    if (key === "sector") {
                      return <td key={key} className="whitespace-nowrap px-2.5 py-1 text-left text-[10px] text-[#898781]">{r.sector}</td>;
                    }
                    if (key === "p_roe") {
                      return (
                        <td key={key} className="px-2.5 py-1">
                          {r.p_roe != null ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-[6px] w-14 overflow-hidden rounded-full bg-[#262624] align-middle">
                                <i className="block h-full bg-[#3987e5]" style={{ width: `${r.p_roe}%` }} />
                              </span>
                              {" "}{r.p_roe}
                            </span>
                          ) : "—"}
                        </td>
                      );
                    }
                    if (key === "mc") {
                      return <td key={key} className="px-2.5 py-1">{fmt(r.mc, 0)}</td>;
                    }
                    const v = (r as any)[key];
                    const colorCls =
                      (key === "g_net" || key === "fcf_yield") && typeof v === "number"
                        ? v > 0 ? "text-[#0ca30c]" : v < 0 ? "text-[#e66767]" : ""
                        : "";
                    return <td key={key} className={`px-2.5 py-1 ${colorCls}`}>{fmt(v)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#2c2c2a] px-3.5 py-2 text-[10px] text-[#898781]">
          ° computed · ≈ declared estimate (sukuk/murabaha debt approximated until source mapping fixed) · ⚑ fields withheld · banks/insurers show only the ratios that mean anything for them (no current ratio on a bank — by design, not omission)
        </div>
      </div>
    </div>
  );
}

function renderBadges(r: any) {
  const badges: React.ReactNode[] = [];
  if ((r.flags || []).includes("≈debt")) {
    badges.push(<span key="approx" className="ml-1 inline-block rounded bg-[#262624] px-1 text-[9px] text-[#898781]" title="LT debt approximated">≈</span>);
  }
  if ((r.flags || []).some((f: string) => f.startsWith("⚑"))) {
    badges.push(<span key="flag" className="ml-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9px] text-[#e66767]">⚑</span>);
  }
  if (!r.fresh) {
    badges.push(<span key="stale" className="ml-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9px] text-[#e66767]">stale {String(r.end || "").slice(0, 7)}</span>);
  }
  return badges;
}
