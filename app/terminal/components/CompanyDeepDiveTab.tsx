import React from "react";

const CO_DATA: Record<string, {
  title: string;
  kpis: [string, string, string, string][];
  isTitle: string;
  isHead: string[];
  isRows: string[][];
  isFoot: string;
  ratios: [string, string, string | null, boolean | null, number | null][];
  read: [string, string][];
}> = {
  "4300": {
    title: "DAR ALARKAN 4300",
    kpis: [
      ["1,134m", "FY25 net profit — +40.5% YoY°", "TTM through Q1-26: 1,185m°", "up"],
      ["0.98", "P/B — trading at book value", "P/E TTM 18.5° · mkt cap 21,978m", ""],
      ["−3,319m", "FY25 operating cash flow°", "4.1bn land/development build via working capital", "down"],
      ["1.5×", "interest coverage° — the watchlist", "net debt jumped 4.7 → 8.4bn (+78%) funded by sukuk", "down"]
    ],
    isTitle: "Income Statement — 6 audited fiscal years",
    isHead: ["Line", "2020", "2021", "2022", "2023", "2024", "2025", "TTM°"],
    isRows: [
      ["Revenue", "1,945", "2,493", "3,925", "2,707", "3,759", "3,900", "4,131"],
      ["Gross profit · margin", "675 · 34.7%", "897 · 36.0%", "1,458 · 37.1%", "1,070 · 39.5%", "1,600 · 42.6%", "1,844 · 47.3%", "1,970 · 47.7%"],
      ["Operating profit", "503", "685", "1,100", "865", "1,334", "1,587", "1,733"],
      ["Finance costs", "(646)", "(663)", "(682)", "(764)", "(854)", "(1,037)", "(1,110)"],
      ["Zakat · effective", "(1) · 3.0%", "(3) · 2.2%", "(147) · 24.9%", "(16) · 2.5%", "(21) · 2.5%", "(220) · 16.3% ⚑", "(273)"],
      ["Net profit · margin", "19 · 1.0%", "133 · 5.3%", "442 · 11.3%", "611 · 22.6%", "807 · 21.5%", "1,134 · 29.1%", "1,185"],
      ["EPS (SAR)", "0.02", "0.12", "0.41", "0.57", "0.75", "1.05", "1.10"]
    ],
    isFoot: "Gross margin has climbed six straight years (34.7% → 47.7%). ⚑ 2025 zakat spike (220m, incl. 161m in Q3 alone) deserves a read of the notes — without it profit growth exceeds +40.5%. Balance sheet & cash-flow checks: A=L+E exact all 7 dates · CFO+CFI+CFF=Δcash exact all 6 years.",
    ratios: [
      ["Gross margin°", "47.7%", null, null, 75],
      ["Net margin°", "28.7%", "≥15%", true, 58],
      ["ROE°", "5.3%", "≥15%", false, 33],
      ["ROIC°", "≈5.6%", ">WACC", false, null],
      ["Current°", "1.54", "≥1.5", true, null],
      ["Quick°", "1.53", "≥1.0", true, null],
      ["D/E° (incl. sukuk)", "0.65", null, null, null],
      ["Interest coverage°", "1.5×", "≥3×", false, null],
      ["FCF/Revenue° (2024/2025)", "+21% / −85%", "≥5%", false, null],
      ["P/E TTM°", "18.5", null, null, 33],
      ["P/B°", "0.98", null, null, 77],
      ["PEG (Lynch)°", "0.76", "<1.0", true, null]
    ],
    read: [
      ["Fundamental — mixed", "Margin machine improving six straight years and profit compounding +37%/3yr off a tiny base, but Dupont shows the constraint: 29.1% margin × 0.10 asset turnover × 1.81 leverage = 5.2% ROE. The value case rests on converting 25bn of development inventory into sales."],
      ["Balance sheet — expansion bet", "2025 was a deliberate releveraging: 4.1bn into land/development through working capital, funded by 4.4bn of sukuk issuance. Net debt +78% in one year with 1.5× coverage — the cycle decides whether this was the right year."],
      ["Valuation — discount with a reason", "Book value discount (P/B 0.98, sector percentile 77) against bottom-quartile ROE. PEG 0.76 says the growth is not being paid for; coverage 1.5× says why."],
      ["Zakat flag ⚑", "The 2025 zakat line (220m, effective 16.3% vs a 2.5% norm, 161m of it in Q3 alone) reads like a settlement — the single most important note to read in the FY25 filing."]
    ]
  },
  "1010": {
    title: "RIYAD BANK 1010",
    kpis: [
      ["10,539m", "TTM net profit°", "9 quarters pulled, complete through Q1-26", "up"],
      ["7.7", "P/E TTM°", "P/B 1.02° · mkt cap 80,640m", ""],
      ["13.3%", "ROE TTM°", "sector percentile 80 of 10 banks", "up"],
      ["537bn", "total assets°", "part of the 4.7tn listed-bank credit machine", ""]
    ],
    isTitle: "Quarterly Net Profit — last 9 quarters (bank template)",
    isHead: ["Line", "Q1-24", "Q2-24", "Q3-24", "Q4-24°", "Q1-25", "Q2-25", "Q3-25", "Q4-25°", "Q1-26"],
    isRows: [
      ["Operating income", "5,669", "5,805", "6,200", "6,508", "6,351", "6,568", "7,043", "7,121", "6,807"],
      ["Net profit", "2,073", "2,338", "2,654", "2,257", "2,486", "2,597", "2,687", "2,641", "2,614"],
      ["EPS (SAR)", "0.66", "0.75", "0.85", "0.74", "0.79", "0.82", "0.85", "0.83", "0.83"]
    ],
    isFoot: "Bank template: commission income structure, provisions watch and SAIBOR sensitivity ship with the sector-template rollout (reference implementation already built). Earnings breadth across all 10 banks: 100% growing TTM.",
    ratios: [
      ["ROE TTM°", "13.3%", "≥15%", false, 80],
      ["P/E TTM°", "7.7", null, null, 70],
      ["P/B°", "1.02", null, null, 60],
      ["Net margin°", "38.9%", null, null, 55]
    ],
    read: [
      ["Fundamental — steady compounder", "Nine straight quarters of profit within a rising channel; TTM 10.5bn on 27.1bn operating income. The bank grows with the credit machine it belongs to."],
      ["Sector context", "All 10 listed banks grew TTM profit — the strongest earnings breadth of any sector. Bank-specific NIM sensitivity to SAIBOR ships in Sprint 6."],
      ["Valuation", "P/E 7.7 near sector median; the price of a sector where everything is working."]
    ]
  },
  "1831": {
    title: "MAHARAH 1831",
    kpis: [
      ["273m", "FY25 net profit°", "TTM margin trend positive", "up"],
      ["+30%", "revenue growth — a real fast grower", "Lynch class: Fast Grower (>25% TTM)", "up"],
      ["3,112m", "FY25 revenue°", "human-capital services — asset-light model", ""],
      ["10.2", "P/E TTM°", "PEG < 1 — growth cheaper than its multiple", ""]
    ],
    isTitle: "Growth profile — FY2025",
    isHead: ["Line", "FY25", "Note"],
    isRows: [
      ["Revenue", "3,112", "+30% YoY° — fastest growth cohort on TASI (23 names >25%)"],
      ["Operating profit", "201", "services margin structure"],
      ["Net profit", "273", "includes associates/JV contribution"],
      ["CFO", "210", "positive conversion"]
    ],
    isFoot: "General template with growth-first ratio set. Full 9-quarter series in the market dataset.",
    ratios: [
      ["Revenue growth°", "+30%", null, null, 90],
      ["Net margin°", "8.8%", "≥15%", false, 45],
      ["ROE°", "29%", "≥15%", true, 85],
      ["PEG°", "<1", "<1.0", true, null]
    ],
    read: [
      ["Fundamental — fast grower", "Lynch classification: Fast Grower. +30% revenue growth with ROE ~29% on an asset-light model."],
      ["Watch", "Margin thinner than the absolute threshold — scale story, not margin story. Growth durability is the question that matters."]
    ]
  }
};

export function CompanyDeepDiveTab({ symbol, onSelectCompany }: { symbol?: string; onSelectCompany?: (sym: string) => void }) {
  const [curCo, setCurCo] = React.useState(symbol && CO_DATA[symbol] ? symbol : "4300");
  const c = CO_DATA[curCo] || CO_DATA["4300"];

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        COMPANY DEEP-DIVE — the full financial workup, one page
      </div>

      {/* Switch Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(CO_DATA).map((sym) => (
          <button
            key={sym}
            onClick={() => {
              setCurCo(sym);
              if (onSelectCompany) onSelectCompany(sym);
            }}
            className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition-colors ${
              curCo === sym
                ? "border-[#3987e5] bg-[#184f95] text-[#3987e5]"
                : "border-white/10 bg-[#222220] text-[#c3c2b7] hover:bg-[#2c2c2a]"
            }`}
          >
            {CO_DATA[sym].title}
          </button>
        ))}
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {c.kpis.map(([val, label, sub, cl], idx) => {
          const colorCls = cl === "up" ? "text-[#0ca30c]" : cl === "down" ? "text-[#e66767]" : "";
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
              <div className={`text-[22px] font-extrabold ${colorCls}`}>{val}</div>
              <div className="text-[11px] text-[#c3c2b7] mt-0.5">{label}</div>
              <div className="text-[10px] text-[#898781]">{sub}</div>
            </div>
          );
        })}
      </div>

      {/* Multi-Year Audited Income Statement */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          {c.isTitle} <span className="font-normal text-[10px] text-[#898781]">· SAR millions · derived Q4° = FY − 9M</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11.8px]">
            <thead>
              <tr className="border-b border-[#383835] text-[9.8px] text-[#898781]">
                {c.isHead.map((h, i) => (
                  <th key={i} className={`px-2.5 py-1.5 ${i === 0 ? "text-left" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.isRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-[#2c2c2a] hover:bg-[#222220]">
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className={`px-2.5 py-1.5 ${cellIdx === 0 ? "text-left font-semibold text-[#f2f1ed]" : "font-mono"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#2c2c2a] px-3.5 py-2 text-[10px] text-[#898781]">
          {c.isFoot}
        </div>
      </div>

      {/* Dual-Verdict Ratios & Engine Read */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Dual Verdict Ratios */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
          <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
            Dual-Verdict Ratios <span className="font-normal text-[10px] text-[#898781]">· absolute threshold + real sector percentile</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[11.8px]">
              <thead>
                <tr className="border-b border-[#383835] text-[9.8px] text-[#898781]">
                  <th className="px-2.5 py-1.5 text-left">Ratio</th>
                  <th className="px-2.5 py-1.5">Actual</th>
                  <th className="px-2.5 py-1.5">Threshold</th>
                  <th className="px-2.5 py-1.5 text-center">Verdict</th>
                  <th className="px-2.5 py-1.5">vs Sector</th>
                </tr>
              </thead>
              <tbody>
                {c.ratios.map((r, i) => (
                  <tr key={i} className="border-b border-[#2c2c2a] hover:bg-[#222220]">
                    <td className="px-2.5 py-1.5 text-left font-semibold text-[#f2f1ed]">{r[0]}</td>
                    <td className="px-2.5 py-1.5 font-bold">{r[1]}</td>
                    <td className="px-2.5 py-1.5 text-[#898781]">{r[2] || "—"}</td>
                    <td className="px-2.5 py-1.5 text-center">
                      {r[3] === true ? (
                        <span className="text-[#0ca30c] font-bold">✓ pass</span>
                      ) : r[3] === false ? (
                        <span className="text-[#e66767] font-bold">✗ fail</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2.5 py-1.5">
                      {r[4] != null ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block h-[6px] w-14 overflow-hidden rounded-full bg-[#262624] align-middle">
                            <i className="block h-full bg-[#3987e5]" style={{ width: `${r[4]}%` }} />
                          </span>
                          {" "}{r[4]}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engine Read */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
          <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
            Engine Read <span className="font-normal text-[10px] text-[#898781]">· layered verdicts — never a buy/sell call</span>
          </h3>
          <div className="p-3.5 space-y-2.5 text-[12px] leading-[1.65] font-sans">
            {c.read.map(([heading, body], i) => (
              <div key={i} className="rounded-lg bg-[#222220] p-2.5">
                <b className="text-[#f2f1ed]">{heading}</b> — <span className="text-[#c3c2b7]">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
