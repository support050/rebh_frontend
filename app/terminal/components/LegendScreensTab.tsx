import React from "react";

interface ScreenRow {
  sym: string;
  name: string;
  sector: string;
  mc: number;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  nm: number | null;
  current: number | null;
  de: number | null;
  fcf_yield: number | null;
  fcf_ni: number | null;
  owner_yield: number | null;
  roic: number | null;
  ev_ebit: number | null;
  magic_pos: number | null;
  ncav: number | null;
  netnet: boolean | null;
  coverage: number | null;
  div_yield: number | null;
  g_net: number | null;
  fresh: boolean;
  flags: string[];
  [key: string]: any;
}

function fmt(v: number | null | undefined, d = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: d });
}

const FIN = new Set(["Banks", "Insurance", "Financial Services", "REITs"]);

type ScreenKey = "magic" | "buffett" | "graham" | "quality" | "netnet" | "watch";

interface ScreenDef {
  t: string;
  d: string;
  cols: [string, string][];
  filter: (rows: ScreenRow[]) => ScreenRow[];
  cell?: (r: ScreenRow, k: string) => string | null;
}

const SCREENS: Record<ScreenKey, ScreenDef> = {
  magic: {
    t: "Magic Formula — Greenblatt, the real one",
    d: "Composite rank: EV/EBIT° cheapness + ROIC° on capital employed (equity + debt − cash). The formula from his book — possible today because balance sheets are pulled for the whole market. Non-financials, fresh, clean cores only.",
    cols: [["#", "magic_pos"], ["Company", "name"], ["Sector", "sector"], ["EV/EBIT°", "ev_ebit"], ["ROIC°", "roic"], ["P/E", "pe"], ["FCF yld%", "fcf_yield"], ["NI gr%", "g_net"]],
    filter: (rows) => rows.filter(r => r.fresh && r.magic_pos != null).sort((a, b) => (a.magic_pos || 999) - (b.magic_pos || 999)).slice(0, 25),
    cell: (r, k) => k === "magic_pos" ? `${r.magic_pos}` : null,
  },
  buffett: {
    t: "Buffett — Free Cash Flow & Owner Earnings",
    d: "FCF yield° = (CFO − capex) / mkt cap, FY2025 cash flows · FCF/NI° conversion quality (near 100% = profits are real cash) · Owner-earnings yield° = (NI + D&A − maintenance capex≈) / mkt cap. Sorted by FCF yield.",
    cols: [["Company", "name"], ["Sector", "sector"], ["FCF yld%°", "fcf_yield"], ["FCF/NI%°", "fcf_ni"], ["OwnerE yld%°", "owner_yield"], ["Div yld%°", "div_yield"], ["P/E", "pe"], ["ROE%", "roe"]],
    filter: (rows) => rows.filter(r => r.fresh && r.fcf_yield != null && r.fcf_yield > 0 && !FIN.has(r.sector)).sort((a, b) => (b.fcf_yield || 0) - (a.fcf_yield || 0)).slice(0, 25),
  },
  graham: {
    t: "Graham — Defensive Margin of Safety, literal",
    d: "His actual defensive-investor tests: current ratio ≥ 1.5 · D/E ≤ 0.5 · P/E ≤ 15 · P/B ≤ 1.5 (or P/E×P/B ≤ 22.5) · positive earnings. A company appears only if it passes all of them.",
    cols: [["Company", "name"], ["Sector", "sector"], ["P/E", "pe"], ["P/B", "pb"], ["Current°", "current"], ["D/E°", "de"], ["ROE%", "roe"], ["Div yld%", "div_yield"]],
    filter: (rows) => rows.filter(r => r.fresh && r.pe != null && r.pe <= 15 && r.pb != null && (r.pb <= 1.5 || r.pe * r.pb <= 22.5) && r.current != null && r.current >= 1.5 && r.de != null && r.de <= 0.5).sort((a, b) => (a.pe || 0) - (b.pe || 0)),
  },
  quality: {
    t: "Compounder Quality — Munger/Fisher lens",
    d: "ROIC° ≥ 15% + interest coverage° ≥ 5× + cash conversion FCF/NI ≥ 60% — businesses that earn their keep in cash on an unstressed balance sheet.",
    cols: [["Company", "name"], ["Sector", "sector"], ["ROIC%°", "roic"], ["Coverage°", "coverage"], ["FCF/NI%°", "fcf_ni"], ["EV/EBIT°", "ev_ebit"], ["P/E", "pe"], ["NI gr%", "g_net"]],
    filter: (rows) => rows.filter(r => r.fresh && r.roic != null && r.roic >= 15 && (r.coverage == null || r.coverage >= 5) && r.fcf_ni != null && r.fcf_ni >= 60).sort((a, b) => (b.roic || 0) - (a.roic || 0)),
  },
  netnet: {
    t: "Klarman / Graham Net-Net — the honest zero",
    d: "NCAV° = current assets − total liabilities; a net-net trades below that. After cleaning scale corruption: zero true net-nets on TASI today. The zero is the finding — the only prior candidate was a data artifact, not a bargain.",
    cols: [["Company", "name"], ["Sector", "sector"], ["NCAV (m)°", "ncav"], ["Mkt cap (m)", "mc"], ["P/B", "pb"], ["Current°", "current"]],
    filter: (rows) => rows.filter(r => r.fresh && r.netnet === true),
  },
  watch: {
    t: "Debt Watchlist — coverage < 2×",
    d: "Operating profit° ÷ finance costs° below 2 — not a verdict by itself (developers live here) but the first thing any credit analyst checks. Weakest first.",
    cols: [["Company", "name"], ["Sector", "sector"], ["Coverage°", "coverage"], ["D/E°", "de"], ["FCF yld%", "fcf_yield"], ["P/B", "pb"], ["NI gr%", "g_net"]],
    filter: (rows) => rows.filter(r => r.fresh && r.coverage != null && r.coverage > 0 && r.coverage < 2).sort((a, b) => (a.coverage || 0) - (b.coverage || 0)),
  },
};

function renderBadges(r: ScreenRow) {
  const badges: React.ReactNode[] = [];
  if ((r.flags || []).includes("≈debt")) {
    badges.push(<span key="approx" className="ml-1 inline-block rounded bg-[#262624] px-1 text-[9px] text-[#898781]" title="LT debt approximated">≈</span>);
  }
  if ((r.flags || []).some(f => f.startsWith("⚑"))) {
    badges.push(<span key="flag" className="ml-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9px] text-[#e66767]">⚑</span>);
  }
  if (!r.fresh) {
    badges.push(<span key="stale" className="ml-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9px] text-[#e66767]">stale {String(r.end || "").slice(0, 7)}</span>);
  }
  return badges;
}

export function LegendScreensTab({ rows }: { rows: ScreenRow[] }) {
  const [curScr, setCurScr] = React.useState<ScreenKey>("magic");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);

  const screen = SCREENS[curScr];
  let filtered = screen.filter(rows);

  // Secondary sort on click
  if (sortKey) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const x = a[sortKey]; const y = b[sortKey];
      if (x == null) return 1; if (y == null) return -1;
      return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
  }

  function handleSort(k: string) {
    if (sortKey === k) setSortAsc(v => !v);
    else { setSortKey(k); setSortAsc(true); }
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        FUNDAMENTAL SCREENS — each applies its author&apos;s actual published methodology
      </div>

      {/* Screen Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(SCREENS) as [ScreenKey, ScreenDef][]).map(([key, s]) => (
          <button
            key={key}
            onClick={() => { setCurScr(key); setSortKey(null); }}
            className={`rounded-2xl border px-3 py-1 text-[11.5px] transition-colors ${
              curScr === key
                ? "border-[#3987e5] bg-[#184f95] font-bold text-[#3987e5]"
                : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
            }`}
          >
            {s.t.split(" — ")[0]}
          </button>
        ))}
      </div>

      {/* Screen Panel */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          {screen.t} <span className="font-normal text-[10px] text-[#898781]">· real data</span>
        </h3>
        <div className="px-3.5 py-1.5 text-[11px] text-[#c3c2b7]">{screen.d}</div>
        <div className="px-3.5 pb-2 text-[10.5px] text-[#898781]">{filtered.length} companies pass</div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11.8px]">
            <thead>
              <tr className="border-b border-[#383835] text-[9.8px] text-[#898781]">
                {screen.cols.map(([label, key]) => (
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
              {filtered.map((r) => (
                <tr key={r.sym} className="border-b border-[#2c2c2a] hover:bg-[#222220]">
                  {screen.cols.map(([, key]) => {
                    // Custom cell renderer
                    if (screen.cell) {
                      const custom = screen.cell(r, key);
                      if (custom !== null && key === "magic_pos") {
                        return (
                          <td key={key} className="px-2.5 py-1 font-bold">
                            {custom}
                            {(r.magic_pos || 999) <= 10 && (
                              <span className="ml-1 inline-block rounded bg-[#d9b64a]/15 border border-[#d9b64a] px-1 text-[9px] font-bold text-[#d9b64a]">✦</span>
                            )}
                          </td>
                        );
                      }
                    }
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={screen.cols.length} className="px-2.5 py-6 text-center text-[#898781]">
                    {curScr === "netnet" ? "Zero true net-nets on TASI today. The zero is the finding." : "No companies pass this screen."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#2c2c2a] px-3.5 py-2 text-[10px] text-[#898781]">
          ° computed from filings · ≈ declared estimate (sukuk/murabaha debt approximated from non-current liabilities until source mapping fixed) · ⚑ withheld field · stale statements never priced against today&apos;s market cap
        </div>
      </div>
    </div>
  );
}
