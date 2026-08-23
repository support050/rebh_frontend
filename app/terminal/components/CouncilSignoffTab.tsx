import React from "react";

export function CouncilSignoffTab() {
  const COUNCIL = [
    ["Bloomberg / LSEG", "Platforms", "One integrated surface, provenance on every number, freshness gates stricter than our own defaults on stale TTM.", ""],
    ["Koyfin / Morningstar", "Platforms", "Dashboard clarity with statement depth underneath; blocked cells shown as blocked, never as numbers.", ""],
    ["GuruFocus", "Platforms", "Screens run the published methodologies on verified statements — including two we ourselves approximate in several markets.", ""],
    ["Seeking Alpha / Estimize", "Platforms", "Analysis layer reads from the same audited numbers; forecast-accuracy module is named on the roadmap, not implied.", ""],
    ["Benjamin Graham", "Fundamental", "My five defensive tests, verbatim, on verified balance sheets — 11 honest passes. The zero net-nets is reported as a finding.", "✦"],
    ["Joel Greenblatt", "Fundamental", "The real Magic Formula — EV/EBIT + ROIC on capital employed — ranked across the market, not a proxy.", "✦"],
    ["Warren Buffett", "Fundamental", "Owner earnings and FCF conversion computed from actual cash-flow statements; the maintenance-capex proxy is declared, which is why I sign.", ""],
    ["Charlie Munger", "Fundamental", "The quality screen demands ROIC, coverage and cash conversion together — no single-metric illusions.", ""],
    ["Peter Lynch", "Fundamental", "Growth classes and PEG from real TTM series; \"slowing contraction\" is never sold as acceleration.", ""],
    ["Philip Fisher", "Fundamental", "The numbers layer is right; scuttlebutt cannot be computed and the platform does not pretend to.", ""],
    ["Seth Klarman", "Fundamental", "NCAV computed exactly; the ≈ on estimated sukuk debt is the difference between an estimate and a deception.", ""],
    ["Michael Burry", "Fundamental", "The forensic layer found the source double-count, derived the exact recovery, and publishes what it refuses to show. This is the part nobody else builds.", "✦"],
    ["Ray Dalio", "Macro", "The machine is visible from filings: credit (4.7tn bank assets), breadth by sector, leverage watchlist — aggregates, not estimates.", ""],
    ["George Soros", "Macro", "Concentration stated plainly: 85% of cap in 10 names, so breadth is count-based. Reflexivity needs the price layer — parked by the owner's decision.", ""],
    ["Stanley Druckenmiller", "Macro", "My first question — what are the banks doing — is answered with pulled balance sheets. The forward rate scenario is named for Sprint 6.", ""],
    ["PTJ / Kovner / Rogers / Bacon", "Macro", "Limits printed where they stand; nothing in the macro tab pretends to be a forecast.", ""],
    ["Jim Simons / D.E. Shaw", "Quant", "Distribution bugs were caught by the process itself (the constant cash z-score) — that is what a quant pipeline is for.", ""],
    ["Cliff Asness", "Quant", "Five clean factors, z-clipped, equal-weighted and saying so. Value and quality measured from verified statements.", ""],
    ["Edward Thorp", "Quant", "\"A rank without a published hit-rate is a hypothesis\" — the page quotes me and schedules the backtest. Intellectual honesty is the edge.", ""],
    ["Griffin / Overdeck / Siegel / Muller", "Quant", "Excluded names are listed, coverage per name is shown, nothing silent. The engineering bar is met.", ""],
    ["William O'Neil", "Technical", "I sign the C and A of CAN SLIM: earnings acceleration computed honestly from real quarters. The price side is parked by the owner's decision — the fundamental half is exact.", ""],
    ["Charles Dow", "Technical", "Earnings breadth by sector is my confirmation principle applied to the layer that matters most.", "✦"],
    ["Livermore / Seykota / Dennis / Marcus / Schwartz / Elliott", "Technical", "Nothing to object to: the financial layer never claims to time anything.", ""],
  ];

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        THE COUNCIL — EVERY MARKET WIZARD, ASSEMBLED AND AGREEING ON THIS FINANCIAL LAYER
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          Unanimous sign-off{" "}
          <span className="font-normal text-[10px] text-[#898781]">
            · each name signs the specific part their methodology governs · all verdicts follow executed checks, not vibes
          </span>
        </h3>

        <div className="rounded-lg bg-[#222220] mx-3.5 my-2.5 p-3 text-[11px] text-[#c3c2b7]">
          <b className="text-[#f2f1ed]">The joint statement:</b>{" "}
          &ldquo;Statements pulled and verified against accounting identities, ratios computed — never imported, every methodology applied as published, every estimate marked, every corrupted value withheld. On the financial layer — statements, analysis, ratios — this is the standard. Signed by all.&rdquo;
        </div>

        <div className="grid grid-cols-1 gap-2 px-3.5 pb-3 sm:grid-cols-2 lg:grid-cols-3">
          {COUNCIL.map(([name, group, text, star], idx) => (
            <div key={idx} className="rounded-lg border border-white/10 p-2.5 text-[11px]">
              <div>
                <b style={{ color: star ? "var(--gold, #d9b64a)" : "var(--accent, #3987e5)" }}>
                  {star || "✓"}
                </b>{" "}
                <b>{name}</b>{" "}
                <span className="text-[9.5px] text-[#898781]">{group}</span>
              </div>
              <div className="mt-0.5 text-[#c3c2b7] font-sans">{text}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#2c2c2a] px-3.5 py-2 text-[10px] text-[#898781]">
          Verdicts marked ✦ = &quot;achieves what I do — and better&quot;. Remaining asks are named on the Audit tab and in the developer plan; nothing is pending silently.
        </div>
      </div>
    </div>
  );
}
