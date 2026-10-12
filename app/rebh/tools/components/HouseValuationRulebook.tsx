"use client";

/*
 * House Valuation — 📖 Rulebook Doors 1/2/3/5/8.
 * Verbatim port of the rulebook <details> blocks in tools_template.html
 * (lines ~155–365): Chapter 1 method-selection tree, Chapter 2 the complete
 * normal/growth method, Chapter 3 cyclicals, Chapter 5 statements & ratios,
 * Chapter 8 the master table of every recognised method.
 * Doors 4/6/7 belong to Course Labs per course-coverage-matrix.md; the
 * package ships their body only as a build placeholder (__RB__ in
 * universal_template.html), so they are not invented here.
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface RModule {
  h3: string;
  small?: string;
  formula?: string;
  paras?: string[];
  tables?: { cols: string[]; rows: string[][] }[];
  rules?: string[];
  cases?: string[];
  fn?: string;
}
interface RChapter {
  id: string;
  title: string;
  lead: string;
  source: string;
  modules: RModule[];
}

const CHAPTERS: RChapter[] = [
  {
    id: "c1",
    title: "Rulebook · Chapter 1 — Choosing the valuation method (the decision tree)",
    lead: "The decision tree that precedes any number: company type decides the method — value with the wrong method and you get a clean, wrong answer",
    source: "Lectures 15–16 + Stage 3 + applied workbook",
    modules: [
      {
        h3: "The complete decision tree",
        small: "First question, always: are there earnings, dividends, or cash flows?",
        tables: [{
          cols: ["Situation", "Next classification", "Adopted method", "Lives on REBH at"],
          rows: [
            ["Earnings / dividends / cash flows exist", "Growth or defensive industry", "Transient growth (the two equations) whenever GS > R and GS > GL — otherwise the long-term-growth model only. Defensives use the same tools but are denied the high-growth techniques", "Tools → House Valuation"],
            ["", "Hyper-growth 50–70%+", "The GS equations break down — use Peter Lynch's methods (PEG, target price)", "House Valuation → Reverse DCF + PEG"],
            ["", "Cyclical industry", "Cycle bands: buy at 14–16× trough EPS, sell at 8–12× peak EPS — no nine-box, no GS", "Report 3030 + every cyclical report"],
            ["", "Declining industry", "One method only: liquidation — or a revival bet on a new activity (turnaround, ≤5% of portfolio)", "Chapter 8 → Liquidation"],
            ["", "Bank / insurer", "The Assiry toolkit: NII, NIM, provisions — industrial safety elements do not apply", "Chapter 4 + Banks Lab"],
            ["No earnings — but sales exist", "Very high growth, or profitability starting this year / next", "Price-to-Sales with its ×1/×2/×3 ladder and the kill-switch", "Chapter 6 + report 1201"],
            ["No earnings and no sales", "Pre-revenue (biotech / emerging tech)", "\"Assumption grounded in fact\" + rNPV + VC method + real options", "Chapter 6 + rNPV Lab"],
            ["REITs", "Pay out ~90%", "Valued on permanent value and earnings — never on distributions", "Chapter 8"],
          ],
        }],
        rules: ["Trigger rule: whenever GS > R and GS > GL, the company has transient growth and must be valued that way (lectures 1–7)."],
      },
      {
        h3: "Before the tree: which column do you value on?",
        small: "Reading dividends vs earnings vs FCF against each other — lecture 16",
        tables: [{
          cols: ["Observed shape", "Ruling"],
          rows: [
            ["FCF around / slightly above earnings, dividends below both", "Normal — no discussion. The FCF value is the \"acquisition price\" — roughly what a buyer of the whole company would pay (haircut ~10% if uncomfortable)"],
            ["FCF clearly above earnings", "Normal for tech, medical, telecom — and for mature Gulf listings generally (they arrive fully expanded, little capex)"],
            ["FCF below earnings and the company is not expanding", "Do not use earnings — value on FCF: the earnings are likely inflated each year. If it IS expanding, the exception applies"],
            ["Earnings above FCF at a small/medium growth company", "Entirely normal"],
            ["Dividends above both earnings and FCF", "Never value on dividends — it is a special, borrowed, or next-year-bet payout (course cases: NBK, KFH, STC special distributions)"],
          ],
        }],
        rules: ["One-off gains (a land sale worth SAR 2/share) are never added to valuation earnings — subtract them from the price: a stock at 30 carrying a SAR 2 land gain is effectively priced at 28. Same for large idle cash. Sole exception: selling in order to redeploy into another deal — then treat it as if nothing happened.", "Raising the payout 10–20% is a positive signal; a \"dumped\" payout is not. Live at: ONE ∞ → cash-flow statement + column comparison"],
      },
      {
        h3: "Explicitly rejected methods",
        small: "What Abu Saad rejected by name — so nobody looks for it here",
        paras: [
          "1) Terminal-value-then-discount (TV → PV): rejected — \"leaves no room for error\", too many assumptions; the adopted alternative is the two summed equations.",
          "2) WACC as a valuation discount rate: \"I do not use WACC\" — only its golden rule survives: ROIC > WACC is the condition for value creation (Stage 3).",
          "3) Buying below book value as a rule: rejected on a statistical study of the Kuwaiti market — replacement: fair P/B° = ROE ÷ required return.",
          "4) Modelling inflation: never — valuation with and without it lands on the same fair value; sole exception: country inflation >25% → raise R itself.",
          "5) Adopting any website's valuation: value first, then compare — never adopt.",
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Rulebook · Chapter 2 — Normal & growth companies: the complete method",
    lead: "From the Build-Up required return to the nine-box, the three price zones and Lynch's four methods — in execution order",
    source: "Lectures 02, 13–16 + SYK/SKX/ULTA sessions + the Oct-2024 Excel",
    modules: [
      {
        h3: "1) Required return R — the Build-Up ladder",
        small: "This is where the work goes: a GL error is survivable, an R error ruins everything",
        formula: "R = the company's corporate-bond yield at its credit grade (BBB is the floor) + compensation (2–4%)",
        tables: [{
          cols: ["Component", "Rule"],
          rows: [
            ["Bond anchor", "The company's own bond/sukuk yield when one exists (Pepsi and Oracle in the applied reports) — otherwise the grade curve. \"Below triple-B is hard to accept.\" For an exceptional company: raise the grade used (A instead of BBB) and cut the compensation rather than breaking the ladder"],
            ["Splitting the compensation", "Porter + industry classification + BCG = 30% of the compensation; safety elements + profitability = 70%. For an exceptionally moated company Porter's slot rises to 40% (review sessions also used 50/50 and 60/40 — the split is declared judgment, not a formula)"],
            ["The Porter ladder (Excel sheet)", "Sum of the five forces (each 0.1–0.9): ≥3.5 excellent → 2% · 2.5–3.5 very good → 3% · <2.5 good → 4%. Never award a force 1 (only regulation/patents truly lock a market) and never 0 (a market can't be fully sealed — a big incumbent enters, or buys the entrant)"],
            ["Practical ceiling", "With strong Porter and a strong market form: never add more than ~2 points of compensation, never cut below ~1.75. An excellent safety history as a range (\"the eye's read, not the exact digit\") → lower the compensation"],
            ["The prohibition", "Never bend the compensation to force a number you want — document every choice. And excellent Porter in a cyclical industry never lowers R"],
          ],
        }],
        fn: "Live at: House Valuation → Build-Up table with GRADEY anchors (AA 4.30 / A 4.55 / BBB 4.85 / BB 5.60 / B 6.60 ≈)",
      },
      {
        h3: "2) Choosing GS — \"disqualify the problem first\"",
        small: "Three candidates, then eliminate the misleading one — lecture 16",
        paras: ["Candidates: last-instant / simple (latest annual print — a snapshot) · compound CAGR (five years, on net income, never EPS) · capacity° = actual ROE × (1 − payout)."],
        tables: [{
          cols: ["Disqualification rule", "Text"],
          rows: [
            ["Disqualify the CAGR", "When earnings zig-zag and have not made a new high in the last two years — the calculator will still return a clean 10%, and it is false: \"you haven't cleared your own peak\""],
            ["Disqualify the last-instant", "When sales are declining, or when a large/dominant company's margins are compressing"],
            ["Restore the disqualified", "A small / non-dominant company growing sales fast with lagging earnings = normal (below break-even, spending to reach the market) → take the higher number. Gross margin matters for the large, and can be ignored for the small high-grower"],
            ["The large company, inverted", "Sales growing faster than earnings at a large company = losing cost control and being competed against (falling gross margin is the proof) → reject the last-instant; use the CAGR or capacity — the Othaim rule in our report"],
          ],
        }],
        cases: ["The solved scenarios: simple 25 / CAGR 10 / capacity 10 + rising sales, small company → take 25. Simple 10 / CAGR 30 / capacity 20, no CAGR defect → fine; if 30 frightens you, sit between CAGR and capacity — never invent a number. Simple 30 / CAGR 15 / capacity 15 = acceleration → take 30 after finding its cause in the board report (AMD broke a 20-year record → take the highest immediately). Simple 10 / CAGR 20 / capacity 10 + falling sales → drop the simple, take capacity (10) since it is below the CAGR."],
        rules: ["Falling-sales rule (adopted in session): no transient growth at all until sales resume growing — or at minimum stabilise while earnings improve. Sole exception: one down year after a spike (post-boom normalisation, the Apple case), not a new downtrend."],
        fn: "Live at: House Valuation → growth menu (simple / CAGR 🔌 / capacity°) with the adoption reason",
      },
      {
        h3: "3) The equations — and the nine-box",
        small: "No-growth, long-term growth, transient growth × (dividends / earnings / FCF) — lectures 02 and 14",
        formula: "V1 = E / R · V2 = E × (1+GL) / (R − GL) · V3 = V2 + E × (1+GL) × (N/2) × (GS − GL) / (R − GL)",
        paras: ["Why N/2? It smooths GS's decay toward GL year by year and creates the margin for error. Why (GS − GL)? GL was already priced in the first equation, so it must be removed. One equation without the other = a wrong answer. On the FCF column: subtract borrowings (short + long term only — not total liabilities), divide by share count, and never subtract the debt twice in the transient part."],
        cases: ["Worked example 1: E=3, R=8%, GL=3%, GS=15%, N=10 → part one 3×1.03/0.05 = 61 · part two 3×1.03×5×0.12/0.05 = 36 · total ≈ 97.8. Worked example 2 (the zones example): EPS=4, R=7%, GL=3%, GS=20%, N=16 → no-growth 57 · long-term growth 103 · transient 239. FCF example (Almarai): FCF 902m − loans 341m ÷ 1.2bn shares at R=8/GL=4/GS=15/N=8 → 9.12 + 10.13 + 8.26 ≈ SAR 27.5."],
        tables: [{
          cols: ["Zone", "Bounds (on the 57/103/239 example)", "Ruling"],
          rows: [
            ["Golden", "At/below the no-growth value (57–80)", "Buying a genuine grower cheaper than its no-growth worth — rare, \"don't expect it.\" Entirely below the no-growth line = deep golden"],
            ["Silver", "From the long-term-growth value (103) to the midpoint (~170)", "The serious buyer's zone — you pay for some of the transient growth, not all of it"],
            ["Bronze", "From ~170 to the full transient value (239)", "At 240 still buyable; 270 = danger territory (next year's fair value is only ~280)"],
          ],
        }],
        rules: ["The zones are built on the earnings column — literally so in lecture 02 (57/103/239 come from the earnings column). Your certainty sets your position: high certainty → paying above the ordinary-growth price is permissible; high uncertainty → you must buy below it — and if competition appears: cancel the transient growth entirely and revalue."],
        fn: "Live at: House Valuation → nine-box + zones · Every growth/defensive report",
      },
      {
        h3: "4) Decay, update and decision rules",
        small: "After the number — lectures 02 and 16",
        tables: [{
          cols: ["Rule", "Text"],
          rows: [
            ["Annual GS decay", "Cut 10–15% relative each year (cap 20% relative; never two consecutive years at the cap; 40% → 34–36). No monotone 10-10-10 rhythm — vary: 20, 15, 15, 10. Roll the same multiplier across all three columns (240 ×1.18 ≈ 280, ×1.15 ≈ 322…). Stop compounding the moment growth stops"],
            ["Updating on results", "Actuals below your forecast → revise the model down immediately. Actuals above → do not revise up. Annual figures (last four quarters), never one quarter. Pattern broken after two years → rebuild the equation from scratch on the new numbers"],
            ["The five sources of N", "(1) the board's announced plan (2) analyst forecasts — \"that's their profession\"; you need the digit-count, not the decimal (3) the analogue case compressed 2–3× for modern information speed (Celsius↔Monster, iPhone↔BlackBerry) (4) accumulated experience (5) the assumption grounded in signed fact — on signed contracts and announced plans, never on \"if they sign\""],
            ["Duration discipline", "No 20-year N except for 8–15% growth. Never project 100%, 80%, or even 50–70% for ten years. A branch-opening jump affects 1–2 years then flattens — do not extrapolate it"],
            ["The decision = IRR", "IRR = (fair value ÷ price)^(1/N) − 1 — hurdle 15% over three years: mark in green the price that clears it; that, not fair value, is the buy point. The worked rejection: 280 → 360 in 3 years = under 10%/yr → reject. Buffett's gate: earnings yield + growth ≥ 10% with ROE ≥ 15%. Price reaches the future fair value early? Exit — it has consumed the coming years' returns (Zain 2007)"],
          ],
        }],
        rules: ["Earnings-release discipline: never enter a growth stock ahead of a release when your remaining upside to fair value is smaller than the growth the market expects in the print — any number below expectation destroys you (\"you've hung your own neck\"; the Deckers case at 35×)."],
      },
      {
        h3: "5) Peter Lynch's four methods",
        small: "For growth the GS equations cannot carry — and the two schools must never be mixed — lecture 16",
        tables: [{
          cols: ["Method", "Formula and rule"],
          rows: [
            ["1 — PEG", "PEG = P/E ÷ expected growth (3–5 years, never 1–2). <1 cheap · >2 expensive · in between \"it depends\": compare the fraction above 1 against the growth — PEG 1.1 at 70% growth falls under 1 within a year; PEG 2 needs 6–7 years → rejected. Tied at 0.90? Take the faster grower — the growth is what re-rates you"],
            ["2 — Target price", "Target = PEG × growth (whole number) × next year's EPS — the PEG itself is the market's risk premium (Lynch's substitute for R), so hold it constant. Worked: price 210, EPS 4, growth 40% → PEG 1.31 → 1.31 × 40 × 5.6 ≈ 294"],
            ["3 — The shortcut", "For >20% growers: buy at a P/E 15–30% below the growth rate, sell at double the multiple you paid — \"for people who want to be told what to do; I don't work this way\" (recorded for honesty, not recommended)"],
            ["4 — Slow-grower correction", "PEG punishes the 9–20% grower by ignoring permanent value → (P/E − 1/R) ÷ growth. Worked: P/E 20, growth 12% → raw PEG 1.7 \"expensive\"; after stripping the base (20−11)÷12 = 0.75 → actually fair/cheap. Applicability window: 9–20% growth only — never on a 22–25% grower"],
          ],
        }],
        fn: "Lynch never discounts at all — and mixing his methods with the GS equations is forbidden. Live at: Screener → Lynch PEG<1 preset · Course Labs → Lynch's six categories",
      },
    ],
  },
  {
    id: "c3",
    title: "Rulebook · Chapter 3 — Cyclicals: the complete method",
    lead: "The industry before the company, capacity before price, and the exit before the peak — a method fully independent of the growth equations",
    source: "2023 course (cyclicals in full) + lectures 14–15 (Lynch, cash flows)",
    modules: [
      {
        h3: "1) Identity of the method",
        small: "Why a cyclical never enters the nine-box machine",
        paras: ["With a cyclical you study the industry, not the company (the company itself matters only briefly): start with the industry's historical sales, then earnings (earnings lag sales), then global demand vs global supply vs production capacity. Cycle lengths: an ordinary cycle 3–4 years, the industry cycle 6–8, the minimum cycle that matters is 4 years, and an oil peak can sit 20 years from the last. Research sources: the sector's largest 3–4 companies + 30 years of revenue and earnings + Statista."],
        rules: ["The ignition rule: when demand approaches production capacity — not current output — the price explodes (oil, steel). The peak = the gap between capacity and demand has become very small."],
      },
      {
        h3: "2) The valuation rule — bands in riyals",
        small: "Buy on the trough, sell on the peak — and the Molodovsky warning",
        formula: "BUY = 14–16× (up to 18× for excellent names) × the LOWEST EPS of the last clear economic cycle · SELL = 8–12× × the HIGHEST EPS of that cycle",
        paras: ["The Molodovsky warning (Lynch's rule): a cyclical is bought when its P/E looks high (earnings at the trough) and sold when it looks low (earnings at the peak) — the inverse of every growth-stock instinct. The low P/E at the peak is a trap that looks like an opportunity and is not."],
        cases: ["SABIC, solved: valued early as an opportunity at 48–64, later 56–80 — and only two opportunities in ten years (2009–2016, 2016–2020): that is the true rhythm of a cyclical. XOM: revenue 395 (peak) → 196, market cap 344 → 192bn — the price back at 1997 levels. SLB is an indirect, lagging cyclical."],
        fn: "Live at: Report 3030 — bands computed in riyals · House Valuation → cyclical mode (auto for every cyclical in this file)",
      },
      {
        h3: "3) The exit signal and the inverted cash flows",
        small: "Graham & Lynch — and the capex exemption",
        tables: [{
          cols: ["Rule", "Text"],
          rows: [
            ["The exit signal", "The moment heavy factory/capacity expansion begins (100m → 150m tons) — get out; never ride to the peak. What follows is a violent collapse in which low P/Es look like opportunities and are not. In Lynch's terms: low capex and low inventory are required; rising capex + rising inventory + expanding capacity = you are about to be hit"],
            ["Cash flows are inverted", "A cyclical's cash flows explode at the top of the cycle (you will believe it is permanent) and turn negative two–three years later; the improvement arrives at the end of the cycle or just before it, not at the start of the rally. You must see the company at both peak and trough to judge whether this cycle is worse than the last"],
            ["Capex exemption", "The capex/revenue rule (Fisher 3% / Buffett 5% / >20% intensive) is not applied to cyclicals — their capex peaks at the top and troughs at the bottom"],
            ["Safety elements", "Not applied to cyclicals in the usual form — instead: their state at the cycle top and at the bottom, and versus peers (best-among-peers = good)"],
            ["Required return", "Excellent Porter in a cyclical industry never lowers R — cyclicality helps rank companies against each other, not cut the required return"],
          ],
        }],
      },
      {
        h3: "4) Execution and doctrine",
        small: "What presses the button — and who cyclicals are for",
        rules: ["The buy band may be entered, undershot, or never reached at all — what presses the button is the sector outlook (does it heal within the next 3 months?), not the price. Entry by cost averaging: scheduled monthly tranches or a laddered set of levels."],
        paras: ["Risk doctrine: any risk measured after investing is failed measurement; cyclicals suit states, large funds and 20–30-year horizons — most individuals belong in growth or defensive names. And the investment income with which cement companies mask their cyclical trouble is a red flag from the red-flags list (Chapter 5)."],
        fn: "Live at: Report 3030 → decision from the bands, not the boxes · TASI Lab → cycle position",
      },
    ],
  },
  {
    id: "c5",
    title: "Rulebook · Chapter 5 — Statements & ratios: the complete analysis",
    lead: "From reading the statement to the safety elements, operating efficiency and the flag lists — in the course's literal rules and numbers",
    source: "Lectures 08–15 + applied workbook + 2023 course",
    modules: [
      {
        h3: "1) Ground rules of reading",
        small: "What precedes any ratio",
        tables: [{
          cols: ["Rule", "Text"],
          rows: [
            ["Ratio construction", "Both numbers from the same statement → take them raw. Numerator from the income statement and denominator from the balance sheet → the denominator must be an average (opening + closing ÷ 2)"],
            ["TTM", "Four consecutive quarters — never a column, never a mix that double-counts the inflated seasonal quarter"],
            ["Growth on what", "Compute growth on net income, never EPS (issuance distorts EPS); CAGR over 5 years (4 for the young); periods = years − 1"],
            ["Shares", "Ignore basic, take diluted. Buyback effect = EPS growth − NI growth — judge whether the proportion is healthy. Debt-funded buybacks must generate growth above the cost of debt, else the company \"slaves for the loan\" (Kohl's vs Pepsi/Microsoft) — and chart market cap, not price, for heavy repurchasers"],
            ["Tax", "An effective rate far below the country benchmark → find the reason, classify it permanent vs temporary"],
            ["Ranking of lines", "EBIT and net margin matter most, then gross margin; EBITDA matters least — Buffett: \"a company that talks EBITDA and not real cash flows or ROE is hiding something.\" EBIT = net income + tax + zakat + finance cost"],
            ["Notes & the reserve", "Always read the numbered notes. Statutory reserve: 10% of profits until 30%, never below 15% of capital, not distributable; bonus shares come from retained earnings only. Annuals are audited, quarterlies are not; the annual report's opening statement belongs to the auditor, not the company"],
          ],
        }],
      },
      {
        h3: "2) Cash flows — \"I want nothing from all of this except the last number\"",
        small: "Lectures 13–14",
        paras: ["Three sections (operating / investing / financing). The four operating drivers: inventory inverse · receivables inverse · expenses by type · payables direct — and depreciation is not cash, always added back. Sign rule: a line with the same sign as the profit line above it → subtract; opposite → add back. In doubt, go to the balance sheet and compare the item's movement year over year."],
        tables: [{
          cols: ["Rule", "Text"],
          rows: [
            ["The last number", "Net cash from operating activities (CFO) is the only requirement of section one — compare with last year and hunt every jump. Did earnings growth show up in cash? A divergence of 5–10% of revenue is fine; what is unacceptable is −15/20/30% then a jump (lumpiness)"],
            ["Net capex", "Additions to property, plant & equipment minus disposals (84 − 14 = 70). Investment property, intangibles, goodwill, acquisitions are not capex. FCF = CFO − net capex"],
            ["The capex rule", "CAPEX ÷ Revenue — Fisher 3% · Buffett 5% · sub-1% exceptional · >20% capital-intensive → avoid. Exempt: new companies, growth companies, and cyclicals by name"],
            ["Judgments", "A young expander with negative CFO = normal. A stable company >10 years old with negative CFO = a question mark that must not pass (except one extraordinary event or a heavy expansion year). Five years of FCF stability alongside earnings (±20–30%) supports the safety score and lowers R"],
            ["Dividends", "Above FCF once, or by a modest amount with no/low debt = acceptable; sustained payouts above FCF are not"],
          ],
        }],
        cases: ["The Mobily case — the flagship flag: revenue 1.6 → 25bn and net income 3 → 6bn, but CFO fell two consecutive years while sales, gross profit and net income all grew >20%; capex flat (\"you aren't even expanding\"); dividends ~2bn above FCF. Verdict: \"I don't need to know what is wrong or where — not my job. It is wrong for me as an investor; valuing this on earnings is deceiving myself\" → skip. (This preceded the restatement.)"],
        fn: "Live at: ONE ∞ → cash flows + FCF/NI · Screener → fcf_yield / owner_yield",
      },
      {
        h3: "3) The five safety elements — with the numeric bands",
        small: "Group rules and exclusions — from the Excel, literally",
        tables: [{
          cols: ["Element", "Green +1", "Orange 0", "Red −1"],
          rows: [
            ["ROE (avg equity)", "≥15%", "10–15%", "<10%"],
            ["ROA (avg assets)", "≥10%", "6–10%", "≤6%"],
            ["Current ratio", "≥2", "1–2", "≤1"],
            ["Debt/assets (loans + leases)", "≤40%", "40–60%", "≥60%"],
            ["Interest coverage (EBIT ÷ interest)", "≥10", "6–10", "≤6"],
          ],
        }],
        paras: ["The total feeds the compensation ladder (≥3.5 → 2% · 2.5–3.5 → 3% · <2.5 → 4%). Group rules: profitability {ROE, ROA} vs debt {D/A, current, coverage}. Acceptable: debt group all green with profitability red; not acceptable: the reverse. One red never disqualifies; 3 green + 2 orange is fine. Always read ROA together with coverage and D/A as one cluster. Judge one year and 5–10 years (structure, not a snapshot). Coverage above 15 is \"very good\", a current ratio above 2 likewise."],
        rules: ["Exclusions, verbatim: not applied to newly established companies (look for improving ROE and falling debt instead), not to cyclicals (top, bottom, peers), not to banks (Chapter 4). An excellent history as a range lowers the compensation — management is clean and the policy explicit."],
        fn: "Live at: House Valuation → the colour-banded safety table with these exact bands",
      },
      {
        h3: "4) Operating efficiency — DuPont, Abu Saad's way",
        small: "The gap between computed and actual ROE — lecture 13",
        formula: "NPM × Asset turnover = ROA · × Leverage (assets ÷ equity) = computed ROE",
        paras: ["The use differs from the classic tree: compare the computed ROE with the actual. A gap ≤10% is healthy (companies must hold some cash) · >20% = a heavily idle asset (worked: 53 of 200m = 25% of assets not working) · actual above computed = no problem. This is \"efficiency\", not fraud — never read it as an accountant or a short-seller. Two of DuPont's three components are what move the raise/lower-R decision.", "Leverage judgments: margin 10% × leverage 2.5 = ROE 25%; leverage 1 on 12% margins → \"why aren't you borrowing?\"; leverage already 4–5 → the lever must be margins. Deleveraging a high-margin company is a negative for the growth case (not for the statements) — and the analysis breaks if the company is buying back its own shares. \"We will borrow to expand\" is strongly positive."],
        fn: "Live at: House Valuation → efficiency card° · Terry Smith Lab → ROCE",
      },
      {
        h3: "5) Reading margin trends",
        small: "When a falling gross margin is positive — Fisher and Lynch with their cases",
        tables: [{
          cols: ["Pattern", "Ruling", "Case"],
          rows: [
            ["GM falls with real expansion lifting sales (72→84→92)", "Positive", "Discounts opening a market"],
            ["GM falls with sales flat (72→73→73→76 over five years)", "Negative", "Discounting to survive — competition is eating you"],
            ["EBIT% in steady decline", "Fisher: stay away — no cost control", "BBBY: 14 → −6.85 with GM 41→35 = losing on two fronts"],
            ["Obsession with dressing EBIT via cost cuts in a growing economy", "Lynch: dangerous — it gets hit when the economy turns", "KSS: cosmetically flat EBIT in a decaying sector"],
            ["Growing with gross margin holding", "Excellent — a temporary dip in EBIT and net margin doesn't matter", "Lynch's corollary"],
          ],
        }],
        paras: ["Sector norms: medical starts above 60–80% and doesn't fall fast (ISRG held above 65% for 15+ years) · capital-intensive sectors are structurally low (Ford 13–17%) · a cyclical shows its cycle inside its gross margin (XOM 42 → 19 with small sub-cycles)."],
      },
      {
        h3: "6) Danger signs and red flags — complete",
        small: "Lecture 15 — the two lists, as delivered, plus verification",
        paras: [
          "The six danger signs (seven items as counted): 1) operating cash flow that was healthy and now declines 2) heavy selling without cash collection (receivables climbing) 3) recurring \"restructuring\" charges with no justification 4) serial acquisitions — course-cited research: the serial acquirer's stock stops appreciating for at least two years (exception: banks under regulatory supervision) 5) secondary offering / rights issue 6) accrued expenses growing year after year 7) changing credit covenants: tightening = immediately negative; and the euphemism \"reducing the payout to strengthen the balance sheet\" — go read the covenant, it is usually forced.",
          "The five red flags: 1) earnings from investments outside the core, appearing erratically (cement companies masking their cycle; the acceptable case: Jarir and the mall that serves the core operation) 2) pension risk — changing the discount rate every couple of years, and a pension fund invested in the company's own shares 3) vanishing cash flow with inventory pile-up 4) changing depreciation life (20 → 30 years lifts paper profit; the shorter life is the one that favours you — while a new CEO's \"big bath\" the other way is normal and expected) 5) deferring expenses to flatter costs while cash drains.",
          "Verification by phone: call investor relations about a specific line item (never future earnings — that is MNPI): a clean company answers in 5–8 minutes with the CFO on the line; a manipulator evades from the first call — escalate to the regulator, which guarantees fair disclosure and never certifies investment worth. And Beneish M-Score° is read ready-made: > −1.78 = probable manipulation (a persistent reading, not one print), alongside Altman and Piotroski.",
        ],
        rules: ["The capital-increase rule (absolute): any rights issue on a listed stock is negative by default — \"give me a reason to stop seeing it as negative\", never the reverse. Sole exception: a nascent company with no product yet (a biotech model that does not exist in the Gulf at all). Gulf Finance House raised capital in late 2007; the stock subsequently lost more than 99.9%."],
        fn: "Live at: Course Labs → the eight-variable Beneish calculator · ONE ∞ → Piotroski & Altman · House Valuation → computed trend flags° (Fisher / GM / Mobily)",
      },
    ],
  },
  {
    id: "c8",
    title: "Rulebook · Chapter 8 — Every recognised method: the master table",
    lead: "Every method taught in the course or recognised around it — its formula, when to use it, when it is forbidden, and where it lives on the platform. No exceptions",
    source: "No method without a declared fate",
    modules: [
      {
        h3: "A) Methods for profitable companies",
        small: "The main trunk",
        tables: [{
          cols: ["Method", "Formula / rule", "When to use", "When forbidden", "Lives at"],
          rows: [
            ["No-growth value", "V = E/R or D/R", "The permanent base — and the golden-zone line", "—", "House Valuation"],
            ["Long-term growth (Gordon)", "V = E(1+GL)/(R−GL)", "Mature names growing at country pace (GL: US 2–3% · Gulf 3–5%)", "GL ≥ R — GL must always be below R", "House Valuation"],
            ["Transient growth (two equations)", "V2 + E(1+GL)(N/2)(GS−GL)/(R−GL)", "Whenever GS > R and GS > GL", "Falling sales · 50–70% hyper-growth (go to Lynch) · cyclicals", "House Valuation → nine-box"],
            ["FCF valuation", "((FCF(1+g)/(R−g)) − loans) ÷ shares", "The third column always — the \"acquisition price\"", "Never subtract the debt twice in the transient part", "House Valuation + FV Lab"],
            ["Cyclical bands", "Buy 14–16× trough · sell 8–12× peak", "Cyclical industries exclusively", "On any non-cyclical", "Report 3030 + every cyclical"],
            ["Lynch PEG", "P/E ÷ 3–5yr growth", ">20% growers; <1 cheap, >2 expensive", "9–20% growers (use the correction)", "Screener → PEG"],
            ["Lynch target price", "PEG × growth × next EPS", "Hyper-growth — the PEG substitutes for R", "Mixing with the GS equations", "House Valuation"],
            ["Slow-grower correction", "(P/E − 1/R) ÷ growth", "9–20% growth", "Above 20–25%", "Lynch Lab"],
            ["The \"shortcut\"", "Buy P/E 15–30% below growth, sell at double", "Recorded for honesty", "Not recommended — \"I don't work this way\"", "This chapter only"],
            ["Fair P/E°", "P/E(1) = 1/R · modified Graham = 2.5g + 1/R", "A fast reference from R itself", "—", "Excel model → Evaluated"],
            ["Fair P/B°", "ROE ÷ required return", "The replacement for the rejected buy-below-book", "Buy-below-book as a rule — rejected by study", "Fair P/B Lab"],
            ["Cut-Cut", "I/Y = (FV/PV)^(1/N) − 1", "A sound company crushed by a crisis — before clean data", "Credibility ~20%: a placeholder corrected within two prints", "Cut-Cut Lab"],
            ["Reverse DCF°", "g = (price×R − EPS)/(price + EPS)", "What is the market pricing? — checked against your GS", "—", "House Valuation → above the decision table"],
            ["Growth DCF (three scenarios)", "Revenue×(1+g)^N × FCF margin × exit multiple", "Bear/base/bull vs a 20% hurdle", "Terminal-value-then-discount is rejected", "DCF Growth Lab"],
            ["IRR (the decision)", "RRI: (FV/PV)^(1/N) − 1 vs the 15% hurdle", "The final decider over every method", "Never a valuation without checking the IRR", "Every report → decision table"],
          ],
        }],
      },
      {
        h3: "B) Non-earners and special sectors",
        small: "The specialised branches",
        tables: [{
          cols: ["Method", "Formula / rule", "When to use", "When forbidden", "Lives at"],
          rows: [
            ["P/S with the ladder", "Fair° = NPM/R · base = NPM×g · ×1/×2/×3", "Sales without profits, or profitability starting now", "Above ×3 never · after margins realize (kill-switch)", "Report 1201 + P/S engine"],
            ["User-based", "$100–200 per active user · or users × spend", "Platforms and apps", "Mixing active with dormant", "Users Lab"],
            ["Assumption grounded in fact", "Measured sector × a reasoned 1–2% share", "No sales — on the signed only", "On \"if they sign\"", "Chapter 6"],
            ["rNPV", "PV × success probability − weighted costs", "Biotech/staged assets — the governing method", "Naive NPV (ignores the 88% failure)", "rNPV Lab"],
            ["VC method", "Exit value ÷ (1+hurdle 50–70%)^N", "Funding rounds and negotiation", "As a fair-value measure (structurally understates)", "Chapter 6"],
            ["Real options (CRR)", "Binomial tree × stage probability − stage cost", "The abandonment-option value — ordering: ≥ rNPV > VC", "—", "Chapter 6"],
            ["Replacement cost", "What would rebuilding the company cost?", "Temporarily loss-making with real assets", "—", "Chapter 6"],
            ["Asset play", "The balance sheet, not earnings — below cash/land", "Disasters only — rare", "Negative NCAV = book is a ceiling, not a floor (4300)", "Net-net screen + report 4300"],
            ["Liquidation", "Assets at sale value − liabilities", "The declining industry — its only method", "—", "Decision tree (Ch. 1)"],
            ["The banks toolkit", "NII · NIM · provisions/revenue · CASA · LDR", "Banks exclusively — 70–80% of the analysis", "Industrial safety elements on a bank", "Banks Lab + report 1120"],
            ["REITs", "Permanent value and earnings", "Property funds", "Valuing them on distributions (~90% payout)", "Chapter 1"],
            ["ROIC/ROCE (Stage 3)", "ROIC = NOPAT/invested capital > WACC", "The golden rule of value creation — read all three returns", "WACC as a valuation discount rate — \"I don't use WACC\"", "ROIC screen + Terry Smith Lab"],
          ],
        }],
      },
      {
        h3: "C) Whole-market tools and ready-made checks",
        small: "Index and scores",
        tables: [{
          cols: ["Tool", "Rule", "Thresholds", "Lives at"],
          rows: [
            ["Earnings yield ÷ single-A bond", "Index EY ÷ Single-A Effective", ">1.5 investable · ≥2 cheap · ~1 bad", "Market Monitor → EY gate"],
            ["Historical index P/E", "The weakest tool — a 5–7 year window only", "A spiking P/E in a crash = vanishing earnings, not a bubble (2009: 123×)", "Market Monitor"],
            ["The opportunity count (Lynch)", "1–2 opportunities in 100 = a top · >20–30% = a bottom", "Psychological — a signal, not proof", "Lynch gauge, Market Monitor"],
            ["The economy scorecard", "NFP >60k · claims <260k · 10Y−2Y >20bps", "An economy gauge, never an entry gauge — don't mix them", "Economy Lab"],
            ["Beneish M°", "> −1.78 = probable manipulation", "A persistent reading, not one print", "Beneish Lab"],
            ["Altman Z° / Piotroski F°", "Bankruptcy / strength — read ready-made", "Never hand-computed in the method", "ONE ∞ → grades"],
            ["Fisher 15 / Lynch 6 / Dorsey 5", "Quality points, categories, growth sources", "Qualitative screening that precedes the numbers", "Fisher & Lynch Labs"],
          ],
        }],
        rules: ["Chapter summary: every method in this table either runs live on the platform now (° from verified pulls) or is declared with its place in this curriculum — no method taught in the course is left without a stated fate. And above them all sits one decider: the IRR on your horizon against your hurdle — the platform presents, it never recommends."],
      },
    ],
  },
];

function RTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[11px] border border-[#E5E7EB] rounded-[4px]">
        <thead>
          <tr className="bg-[#F9FAFB]">
            {cols.map(h => <th key={h} className="text-left px-2 py-1.5 font-bold text-[#374151] border-b border-[#E5E7EB] whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#F3F4F6] align-top">
              {r.map((cell, j) => (
                <td key={j} className={`px-2 py-1.5 ${j === 0 ? "font-semibold text-[#1A1A1A]" : "text-[#4B5563]"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModuleBlock({ m }: { m: RModule }) {
  return (
    <div className="mb-3">
      <h4 className="text-[12px] font-extrabold text-[#1A1A1A]">
        {m.h3}{m.small && <span className="font-normal text-[10.5px] text-[#9CA3AF]">  — {m.small}</span>}
      </h4>
      {m.formula && (
        <div className="mt-1 px-3 py-2 bg-[#F3F4F6] border-l-2 border-[#8C3B32] rounded-r-[4px] font-mono text-[11px] text-[#1A1A1A]">{m.formula}</div>
      )}
      {m.paras?.map((p, i) => <p key={i} className="mt-1.5 text-[11.5px] text-[#4B5563] leading-relaxed">{p}</p>)}
      {m.tables?.map((t, i) => <RTable key={i} {...t} />)}
      {m.rules?.map((r, i) => (
        <div key={i} className="mt-1.5 px-3 py-2 border border-[#FCD34D] bg-[#FFFBEB] rounded-[4px] text-[11.5px] text-[#92400E] leading-relaxed">{r}</div>
      ))}
      {m.cases?.map((cc, i) => (
        <div key={i} className="mt-1.5 px-3 py-2 border border-[#E5E7EB] bg-white rounded-[4px] text-[11px] text-[#374151] leading-relaxed">{cc}</div>
      ))}
      {m.fn && <div className="mt-1.5 text-[10.5px] text-[#9CA3AF] italic">{m.fn}</div>}
    </div>
  );
}

export default function HouseValuationRulebook() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-4">
      {CHAPTERS.map(ch => {
        const isOpen = open === ch.id;
        return (
          <div key={ch.id} className="mb-2 border border-[#E5E7EB] rounded-[4px] overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : ch.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} className="text-[#8C3B32] shrink-0" />
                <div>
                  <div className="text-[12.5px] font-bold text-[#1A1A1A]">📖 {ch.title}</div>
                  <div className="text-[10.5px] text-[#9CA3AF]">{ch.lead} · Course source: {ch.source}</div>
                </div>
              </div>
              {isOpen ? <ChevronUp size={14} className="text-[#9CA3AF] shrink-0" /> : <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 bg-[#FAFAFA] border-t border-[#F3F4F6]">
                {ch.modules.map((m, i) => <ModuleBlock key={i} m={m} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
