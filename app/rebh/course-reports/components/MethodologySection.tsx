"use client";

import React from "react";

interface Props {
  sectionId: string;
}

const METHODOLOGY_SECTIONS: Record<string, {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}> = {
  m1: {
    title: "Method Selection Map",
    subtitle: "Decision tree — where do I start?",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280] leading-relaxed">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Question 1: Is the company profitable?</h4>
          <div className="space-y-1.5">
            <p><span className="text-[#16A34A] font-bold">✓ Yes →</span> go to Question 2.</p>
            <p><span className="text-[#DC2626] font-bold">✗ No →</span> <span className="text-[#8C3B32]">P/S (see Chapter 6)</span> if it is selling. If it has not sold yet: <span className="text-[#8C3B32]">rNPV or the reality-based assumption</span>.</p>
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Question 2: What type of company is it?</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {[
              { type: "Bank or insurer", path: "Al-Asiri toolkit (NII, NIM, CASA, LDR, provisions/revenue) — Chapter 4" },
              { type: "Cyclical (commodity/cement)", path: "Historical ranges + P/BV + exit signal — Chapter 3" },
              { type: "Real estate", path: "Perpetuity value + NAV + FFO — Chapter 1" },
              { type: "Defensive or growth", path: "The nine equations (no growth / Gordon / transitional) — Chapter 2" },
            ].map((item, i) => (
              <div key={i} className="bg-[#F3F4F6] rounded p-3 border border-[#E5E7EB]">
                <div className="text-[#1A1A1A] font-bold">{item.type}</div>
                <div className="text-[#9CA3AF] mt-1">{item.path}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#16A34A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">The Golden Rule — Order of Authority</h4>
          <p>The IRR over your horizon versus your threshold (required R) is the decider above all tools. DCF and fair value are supporting tools, not deciders.</p>
        </div>
      </div>
    ),
  },
  m2: {
    title: "Ordinary & Growth Companies",
    subtitle: "The nine equations, zones and Lynch",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">The Nine Equations — The Square (3 lenses × 3 rhythms)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#9CA3AF]">
                  <th className="py-1.5 px-2 text-left">Lens</th>
                  <th className="py-1.5 px-2 text-left font-mono">No Growth X/R</th>
                  <th className="py-1.5 px-2 text-left font-mono">Gordon X(1+GL)/(R−GL)</th>
                  <th className="py-1.5 px-2 text-left font-mono">Transitional + X(N/2)(GS−GL)/(R−GL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {["Dividends", "Earnings", "Free Cash Flow (net debt°)"].map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 text-[#1A1A1A] font-bold">{row}</td>
                    <td className="py-1.5 px-2 text-left font-mono text-[#8C3B32]">Gold Price</td>
                    <td className="py-1.5 px-2 text-left font-mono text-[#8C3B32]">Silver Price</td>
                    <td className="py-1.5 px-2 text-left font-mono text-[#8C3B32]">Bronze Price</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { zone: "Gold", color: "text-[#16A34A]", border: "border-l-[#16A34A]", desc: "Price ≤ No Growth — the largest margin of safety" },
            { zone: "Silver", color: "text-[#8C3B32]", border: "border-l-[#8C3B32]", desc: "No Growth < Price ≤ Gordon" },
            { zone: "Bronze", color: "text-[#8C3B32]", border: "border-l-[#8C3B32]", desc: "Gordon < Price ≤ Transitional — GS-only entry point" },
          ].map((z, i) => (
            <div key={i} className={`bg-[#FFFFFF] border border-[#E5E7EB] border-l-2 ${z.border} rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]`}>
              <div className={`font-bold ${z.color}`}>{z.zone}</div>
              <div className="text-[#9CA3AF] mt-1">{z.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Lynch Opportunity Meter</h4>
          <p>1–2 opportunities per hundred companies = market top. 20–30% opportunities = market bottom. Used as a collective psychological gauge, not as a direct entry tool.</p>
        </div>
      </div>
    ),
  },
  m3: {
    title: "Cyclical Companies",
    subtitle: "Ranges and the exit signal",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Why do growth equations fail with cyclicals?</h4>
          <p>Earnings at the cycle peak inflate the forward multiple and make the stock look cheap — and the reverse at the trough. The rule: a low multiple at the peak = exit signal, and a high multiple at the trough = entry signal.</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">Cyclical Tools</h4>
          <div className="space-y-2">
            {[
              { tool: "Historical P/BV", usage: "Buy in the lower part of the historical range (e.g., 0.8–1.5× for cement)" },
              { tool: "Mid-Cycle P/S", usage: "Compare price to mid-cycle revenue, not peak revenue" },
              { tool: "Normalized EPS", usage: "Average earnings over a full cycle (5–7 years), not the last quarter" },
              { tool: "Exit Signal", usage: "P/BV rising to the top third of its historical range + improving margins = sell and wait" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 border-b border-[#E5E7EB]/50 pb-2 last:border-0 last:pb-0">
                <span className="text-[#8C3B32] font-bold shrink-0">{item.tool}:</span>
                <span>{item.usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m4: {
    title: "Banks & Insurance",
    subtitle: "The complete Al-Asiri toolkit",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">Key Bank Metrics (Al-Asiri Toolkit)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#9CA3AF]">
                  <th className="py-1.5 px-2 text-left">Metric</th>
                  <th className="py-1.5 px-2 text-left">Formula</th>
                  <th className="py-1.5 px-2 text-left">Reference Thresholds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { m: "NIM (Net Financing Margin)", f: "Net financing income / earning assets", t: "≥3% excellent · 2–3% good" },
                  { m: "CASA %", f: "Current and savings accounts / total deposits", t: "Higher = lower cost of funds" },
                  { m: "LDR (Financing-to-Deposits Ratio)", f: "Total financing / total deposits", t: "80–90% ideal · >100% risky" },
                  { m: "Provisions / Revenue", f: "Financing loss provisions / total income", t: "Lower = better · >30% heavy pressure" },
                  { m: "CAR (Capital Adequacy Ratio)", f: "Tier 1 capital / risk-weighted assets", t: "≥12% strong" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#F3F4F6]">
                    <td className="py-2 px-2 text-[#1A1A1A] font-bold">{row.m}</td>
                    <td className="py-2 px-2 font-mono text-[#8C3B32]">{row.f}</td>
                    <td className="py-2 px-2 text-[#9CA3AF]">{row.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Why don't industrial safety elements apply to banks?</h4>
          <p>A bank naturally carries high debt/assets ratios ({"<"}80%) because deposits are liabilities, not debt in the industrial sense. Course rule: 100% premium weight on Porter for banks.</p>
        </div>
      </div>
    ),
  },
  m5: {
    title: "Statements & Ratios",
    subtitle: "Safety, efficiency and red flags",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">The Five Safety Elements — Literal Thresholds</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#9CA3AF]">
                  <th className="py-1.5 px-2 text-left">Element</th>
                  <th className="py-1.5 px-2 text-left">+1 (Excellent)</th>
                  <th className="py-1.5 px-2 text-left">0 (Acceptable)</th>
                  <th className="py-1.5 px-2 text-left">−1 (Weak)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { el: "ROE", good: "≥15%", ok: "10–15%", bad: "<10%" },
                  { el: "ROA", good: "≥10%", ok: "6–10%", bad: "≤6%" },
                  { el: "Current Ratio", good: "≥2×", ok: "1–2×", bad: "≤1×" },
                  { el: "Debt/Assets", good: "≤40%", ok: "40–60%", bad: "≥60%" },
                  { el: "Interest Coverage", good: "≥10×", ok: "6–10×", bad: "≤6×" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#F3F4F6]">
                    <td className="py-1.5 px-2 text-[#1A1A1A] font-bold">{row.el}</td>
                    <td className="py-1.5 px-2 text-[#16A34A]">{row.good}</td>
                    <td className="py-1.5 px-2 text-[#8C3B32]">{row.ok}</td>
                    <td className="py-1.5 px-2 text-[#DC2626]">{row.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#DC2626] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Computational Red Flags°</h4>
          <div className="space-y-1.5">
            {[
              "Receivables growing faster than revenue — a sign of paper profits",
              "Negative operating cash flow with positive net income — a quality gap",
              "Falling inventory with rising cost — possible earnings management",
              "Dividends above free cash flow — borrowing to distribute",
              "Sudden provision inflation or reversal — Beneish M-Score",
            ].map((flag, i) => (
              <div key={i} className="flex items-start gap-2 border-l-2 border-l-[#DC2626]/60 pl-2 py-0.5">
                <span className="text-[#DC2626] font-bold shrink-0">⚑</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m6: {
    title: "Unprofitable or Not Yet Selling",
    subtitle: "P/S, reality-based assumption and rNPV",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">When to use P/S?</h4>
          <p className="mb-2">The company sells but is not yet profitable (negative or near-zero net margins). Condition of use: <span className="text-[#8C3B32]">a clear path to profitability</span>.</p>
          <div className="font-mono bg-[#F3F4F6] rounded p-3 text-[#8C3B32] border border-[#E5E7EB]">
            Target P/S = (Target net margin ÷ Sector average net margin) × Sector P/S
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">rNPV — Risk-Adjusted Net Present Value</h4>
          <p className="mb-2">For companies with undisclosed or staged assets (biotech, large government contracts):</p>
          <div className="font-mono bg-[#F3F4F6] rounded p-3 text-[#8C3B32] border border-[#E5E7EB]">
            rNPV = Σ (PV of each stage × probability of success) − Σ (probability-weighted PV of costs)
          </div>
          <p className="mt-2 text-[#9CA3AF]">Common mistake: naive NPV ignores the probability of failure, which reaches 88% in the early stages of biotech.</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#DC2626] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-2">Reality-Based Assumption (the company has not sold yet)</h4>
          <div className="font-mono bg-[#F3F4F6] rounded p-3 text-[#8C3B32] border border-[#E5E7EB]">
            Measured sector × 1–2% reasoned and defensible market share → hypothetical revenue → sector margin → profit → valuation
          </div>
          <p className="mt-2 text-[#9CA3AF]">Applied only to what is contractually signed — not to forecasts and wishes.</p>
        </div>
      </div>
    ),
  },
  m7: {
    title: "Abu Saad's Own Methodology",
    subtitle: "Creed, decision and discipline",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-[#1A1A1A] font-bold mb-3">Investment Creed — The Ten Principles</h4>
          <div className="space-y-1.5">
            {[
              "Invest only in what you understand — a basket mixing what you understand with what you don't is a danger",
              "The IRR decides — not the DCF and not fair value directly",
              "A horizon of 3–5 years — anything shorter is speculation, not investing",
              "Transitional growth GS — never price extraordinary growth whose source you don't know",
              "You are not a value investor until you buy below the gold zone",
              "The bronze zone is the last entry point — anything above it is cost",
              "The buy gate: IRR > required R + insider buying + technical breakout",
              "The 3% rule: never risk more than 3% of capital on a single trade",
              "Diversification vs. concentration: the number of stocks you know well",
              "Patience is a virtue — the platform displays and does not recommend; the decision is yours alone",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="text-[#8C3B32] font-mono shrink-0">{i + 1}.</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m8: {
    title: "All Methods — The Master Table",
    subtitle: "Each method: when, when not, and where it lives",
    content: (
      <div className="space-y-4 text-xs text-[#6B7280]">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]">
                  <th className="py-2 px-3 text-left">Method</th>
                  <th className="py-2 px-3 text-left">Rule / Formula</th>
                  <th className="py-2 px-3 text-left">When to Use</th>
                  <th className="py-2 px-3 text-left">When Not to Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { m: "Nine-Box Square", f: "X/R · Gordon · Transitional", w: "Profitable defensive & growth companies", nw: "Cyclicals and banks" },
                  { m: "Historical P/BV", f: "Price ÷ book value", w: "Cyclicals at the cycle trough", nw: "Growth companies (assets don't reflect value)" },
                  { m: "Banking Toolkit", f: "NII · NIM · CASA · LDR", w: "Banks and insurance only", nw: "Any non-financial company" },
                  { m: "P/S", f: "Price ÷ revenue per share", w: "Loss-making with a clear path to profit", nw: "Loss-making with no path to profit" },
                  { m: "rNPV", f: "Σ(PV × probability) − costs", w: "Staged businesses (biotech/contracts)", nw: "Mature profitable companies" },
                  { m: "Beneish M°", f: ">−1.78 = manipulation probability", w: "Continuous reading for every company", nw: "As the sole entry indicator" },
                  { m: "Altman Z°", f: "Composite bankruptcy scores", w: "Assessing credit strength", nw: "Banks (different model)" },
                  { m: "Piotroski F°", f: "9-point financial quality score", w: "Screening acceptable statements", nw: "As the sole valuation tool" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#F3F4F6]">
                    <td className="py-2 px-3 text-[#1A1A1A] font-bold">{row.m}</td>
                    <td className="py-2 px-3 font-mono text-[#8C3B32]">{row.f}</td>
                    <td className="py-2 px-3 text-[#16A34A]">{row.w}</td>
                    <td className="py-2 px-3 text-[#DC2626]">{row.nw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 border-l-2 border-l-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[#1A1A1A]">Every method in this table either runs live on the platform now (° from the verified pull), or is declared with its place in the curriculum — <b>no method mentioned in the course lacks a declared fate.</b></p>
          <p className="mt-2 text-[#9CA3AF]">And the one decider above them all: the IRR over your horizon versus your threshold — the platform displays and does not recommend.</p>
        </div>
      </div>
    ),
  },
};

// UX note: METHODOLOGY_SECTIONS is missing keys "m1"–"m8" alignment safety —
// if SIDEBAR_METHODOLOGY in page.tsx ever adds/removes an id, this map needs
// a matching entry or the section silently renders nothing (see the `if
// (!section) return null;` below). Worth a fallback/error state if this grows.

export default function MethodologySection({ sectionId }: Props) {
  const section = METHODOLOGY_SECTIONS[sectionId];
  if (!section) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-6 text-center text-xs text-[#9CA3AF] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        This chapter is not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[4px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-base font-black text-[#1A1A1A]">{section.title}</h2>
        <p className="text-xs text-[#9CA3AF] mt-1">{section.subtitle}</p>
      </div>
      <div>{section.content}</div>
    </div>
  );
}