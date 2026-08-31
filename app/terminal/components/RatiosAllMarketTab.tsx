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
  const [query, setQuery] = React.useState("");

  function handleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.sym.toLowerCase().includes(q) || r.sector.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
  }, [filtered, sortKey, sortAsc]);

  // UX note: this table has ~220 rows and previously offered no way to jump
  // to a specific company — added a search box (filters name/symbol/sector,
  // Enter jumps to and briefly highlights the top match) plus a sticky
  // header row and sticky first column so long scrolls keep their bearings.

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const top = sorted[0];
    if (!top) return;
    const el = document.getElementById(`ratio-row-${top.sym}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("bg-[#F3F4F6]");
    window.setTimeout(() => el?.classList.remove("bg-[#F3F4F6]"), 900);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="font-bold text-[12.5px] text-[#1A1A1A]">
            Full Ratio Table{" "}
            <span className="font-normal text-[10px] text-[#9CA3AF]">
              · {sorted.length} of {rows.length} companies with pulled balance sheets · click any column to sort · percentile vs sector peers
            </span>
          </h3>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search company, symbol or sector…"
            className="w-full max-w-[260px] rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-[11.5px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15"
          />
        </div>

        <div className="mx-4 my-3 rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-[11px] leading-relaxed text-[#6B7280]">
          Every cell is computed from the filings pulled today — valuation (P/E, P/B), profitability (ROE, net margin, ROIC°), liquidity (current, quick), solvency (D/E, interest coverage°), and cash (FCF yield°, FCF/NI°). Stale statements are never priced (blocked cells show —). Sector percentile shown for ROE where the sector has ≥3 fresh peers.
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-right text-[11.8px] tabular-nums">
            <thead>
              <tr className="sticky top-0 z-20 bg-[#F3F4F6] text-[9.8px] text-[#6B7280]">
                {COLS.map(([label, key], i) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-2 font-semibold ${i === 0 ? "sticky left-0 z-30 bg-[#F3F4F6] text-left" : key === "sector" ? "text-left" : ""
                      } ${sortKey === key ? "text-[#8C3B32]" : ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.sym} id={`ratio-row-${r.sym}`} className="border-b border-[#E5E7EB] transition-colors hover:bg-[#F3F4F6]">
                  {COLS.map(([, key], i) => {
                    if (key === "name") {
                      return (
                        <td key={key} className="sticky left-0 z-10 whitespace-nowrap bg-white px-2.5 py-1.5 text-left font-semibold text-[#1A1A1A]">
                          {r.name} <small className="font-normal text-[#9CA3AF]">{r.sym}</small>
                          {renderBadges(r)}
                        </td>
                      );
                    }
                    if (key === "sector") {
                      return <td key={key} className="whitespace-nowrap px-2.5 py-1.5 text-left text-[10px] text-[#6B7280]">{r.sector}</td>;
                    }
                    if (key === "p_roe") {
                      return (
                        <td key={key} className="px-2.5 py-1.5">
                          {r.p_roe != null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="inline-block h-[6px] w-14 overflow-hidden rounded-full bg-[#F3F4F6] align-middle">
                                <i className="block h-full bg-[#8C3B32]" style={{ width: `${r.p_roe}%` }} />
                              </span>
                              <span className="text-[#6B7280]">{r.p_roe}</span>
                            </span>
                          ) : <span className="text-[#9CA3AF]">—</span>}
                        </td>
                      );
                    }
                    if (key === "mc") {
                      return <td key={key} className="px-2.5 py-1.5 text-[#1A1A1A]">{fmt(r.mc, 0)}</td>;
                    }
                    const v = (r as any)[key];
                    const colorCls =
                      (key === "g_net" || key === "fcf_yield") && typeof v === "number"
                        ? v > 0 ? "text-[#16A34A]" : v < 0 ? "text-[#DC2626]" : "text-[#1A1A1A]"
                        : "text-[#1A1A1A]";
                    return <td key={key} className={`px-2.5 py-1.5 ${colorCls}`}>{fmt(v)}</td>;
                  })}
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} className="px-3 py-8 text-center text-[#9CA3AF]">
                    No companies match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
          ° computed · ≈ declared estimate (sukuk/murabaha debt approximated until source mapping fixed) · ⚑ fields withheld · banks/insurers show only the ratios that mean anything for them (no current ratio on a bank — by design, not omission)
        </div>
      </div>
    </div>
  );
}

function renderBadges(r: any) {
  const badges: React.ReactNode[] = [];
  if ((r.flags || []).includes("≈debt")) {
    badges.push(<span key="approx" className="ml-1 inline-block rounded-full bg-[#F3F4F6] px-1.5 text-[9px] text-[#6B7280]" title="LT debt approximated">≈</span>);
  }
  if ((r.flags || []).some((f: string) => f.startsWith("⚑"))) {
    badges.push(<span key="flag" className="ml-1 inline-block rounded-full bg-[#FEF2F2] px-1.5 text-[9px] text-[#DC2626]">⚑</span>);
  }
  if (!r.fresh) {
    badges.push(<span key="stale" className="ml-1 inline-block rounded-full bg-[#FEF2F2] px-1.5 text-[9px] text-[#DC2626]">stale {String(r.end || "").slice(0, 7)}</span>);
  }
  return badges;
}