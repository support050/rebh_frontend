"use client";

/*
 * House Valuation — the owner's methodology, live.
 * Port of `tools_template.html` §sec-method (the contract's 10-tab Tools bar,
 * tab id "method"): classification chips → 5 safety elements (+1/0/−1 course
 * bands) → Porter five forces → Build-Up required return → growth menu →
 * nine-box → golden/silver/bronze zones → Reverse DCF + decision table →
 * cyclical mode → computed red flags → buy-gate → Shariah screen → P/S ladder.
 * All numbers come from the production contract GET /api/engine/{symbol}
 * (RebhUniversalContract); the sliders re-execute the course's published
 * formulas client-side exactly as the demo template does.
 * Honesty marks are mandatory: ° computed · ≈ estimate · ⚑ flag · 🔌 source named-missing.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import { Loader2, Search } from "lucide-react";
import HouseValuationRulebook from "./HouseValuationRulebook";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const H3 = "text-[11px] text-[#8C3B32] tracking-[1.2px] font-extrabold uppercase mt-4 mb-1.5";

// ── Contract sub-shapes (mirror app/schemas/rebh_contract.py) ──────────────
interface SafetyItem { name: string; val: string; score: number; threshold: string; pass_flag: boolean }
interface Porter { supplier_power: number; buyer_power: number; threat_new_entrants: number; threat_substitutes: number; competitive_rivalry: number; total_score: number; compensation_pct: number }
interface BuildUp { risk_free_rate_pct: number; rate_source: string; sukuk_symbol?: string | null; porter_compensation_pct: number; porter_weight: number; safety_compensation_pct: number; safety_weight: number; required_return_r_pct: number; formula_display: string }
interface NineBoxCell { name: string; x_metric: string; x_value: number | null; r_pct: number; gl_pct: number; gs_pct: number; n_years: number; v1: number | null; v2: number | null; v3: number | null; source_status: string }
interface NineBox { r_pct: number; gl_pct: number; gs_pct: number; n_years: number; dividends: NineBoxCell; earnings: NineBoxCell; fcf_net_debt: NineBoxCell; net_debt_deducted?: number | null; debt_allocation_rule: string }
interface Zones { gold_max: number | null; silver_max: number | null; bronze_max: number | null; current_zone: string | null }
interface CyclicalBands { is_cyclical: boolean; lowest_cycle_eps?: number | null; highest_cycle_eps?: number | null; buy_band_min?: number | null; buy_band_max?: number | null; sell_band_min?: number | null; sell_band_max?: number | null; rule: string }
interface PsLadder { is_loss_maker: boolean; expected_npm_pct?: number | null; expected_growth_pct?: number | null; base_ps?: number | null; cheap_ps?: number | null; medium_ps?: number | null; danger_ps?: number | null }
interface RedFlag { code: string; severity: string; title_ar: string; title_en: string; detail: string; detail_en?: string | null; status_symbol: string }
interface BuyGate { gate_passed: boolean; fail_reasons: string[]; pass_conditions: string[] }
interface Shariah { is_compliant: boolean | null; source_status: string; debt_to_market_cap_pct: number | null; interest_income_pct: number | null; illiquid_assets_pct: number | null; committee_disclaimer: string }
interface BankMetrics { is_bank: boolean; nim_pct?: number | null; ldr_pct?: number | null; casa_pct?: number | null; cost_of_risk_pct?: number | null; provisions_to_revenue_pct?: number | null; nii?: number | null; flags?: string[] }

interface EngineContract {
  symbol: string; name: string; en?: string | null; sector: string; sec_en?: string | null;
  industry_class: string; market_form: string; elasticity?: string | null; bcg_stage?: string | null;
  price?: number | null; market_cap?: number | null; currency: string; as_of?: string | null;
  fresh: boolean; stale_reason?: string | null; quarantine_reason?: string | null;
  safety: { raw_score: number; norm_score: number; compensation_pct: number; items: SafetyItem[] };
  porter?: Porter | null; build_up?: BuildUp | null; required_return?: number | null;
  nine_box?: NineBox | null; zones?: Zones | null; cyclical_bands?: CyclicalBands | null;
  ps_ladder?: PsLadder | null;
  reverse_dcf?: { implied_growth_pct?: number; status?: string; formula?: string };
  irr_decision?: { irr_pct?: number; pv_at_15_pct?: number; margin_of_safety_pct?: number; fair_value_anchor?: number };
  margin_of_safety?: number | null;
  red_flags: RedFlag[]; buy_gate: BuyGate; shariah: Shariah; bank_metrics?: BankMetrics | null;
  piotroski?: number | null; altman?: number | null; beneish?: number | null;
}

interface UniverseRow { sym: string; name?: string; en?: string }

const P5NAMES: { key: keyof Porter; label: string }[] = [
  { key: "threat_new_entrants", label: "Threat of new entrants" },
  { key: "competitive_rivalry", label: "Competitive rivalry" },
  { key: "threat_substitutes", label: "Threat of substitutes" },
  { key: "buyer_power", label: "Buyer power" },
  { key: "supplier_power", label: "Supplier power" },
];

const compLadder = (t: number) => (t >= 3.5 ? 2 : t >= 2.5 ? 3 : 4);
const fmt = (v: number | null | undefined, d = 2) => (v == null || !isFinite(v) ? "—" : v.toLocaleString("en", { maximumFractionDigits: d }));

// The course's three equations, per share (FCF lens nets debt once, never twice)
function lens(x: number | null, R: number, GL: number, GS: number, N: number, isFcf: boolean, debtPs: number) {
  if (x == null || x <= 0 || R <= 0 || GL >= R) return [null, null, null] as (number | null)[];
  const adj = (v: number) => (isFcf ? v - debtPs : v);
  const v1 = adj(x / R);
  const v2 = adj((x * (1 + GL)) / (R - GL));
  const v3 = v2 + (x * (N / 2) * (GS - GL)) / (R - GL); // transient part never re-subtracts debt
  return [v1, v2, v3];
}

export default function HouseValuationTab({ universe }: { universe: UniverseRow[] }) {
  const [sym, setSym] = useState("2222");
  const [input, setInput] = useState("");
  const [c, setC] = useState<EngineContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Interactive methodology state (initialized from the contract on load)
  const [P5, setP5] = useState<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);
  const [bondYield, setBondYield] = useState(4.85);         // BBB floor ≈
  const [rateSource, setRateSource] = useState("govt_sukuk_benchmark");
  const [porterW, setPorterW] = useState(50);               // 30–70 declared split
  const [GL, setGL] = useState(2.5);                        // long-term growth %
  const [NY, setNY] = useState(5);                          // transient years
  const [gsMode, setGsMode] = useState<"engine" | "manual">("engine");
  const [gsManual, setGsManual] = useState(10);             // %

  const load = useCallback(async (symbolToFetch: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/engine/${encodeURIComponent(symbolToFetch)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Engine returned ${res.status} for ${symbolToFetch}`);
      const data: EngineContract = await res.json();
      if (ctrl.signal.aborted) return;
      setC(data);
      setSym(data.symbol);
      // seed interactive state from backend-computed contract values
      if (data.porter) {
        setP5(P5NAMES.map(p => Number(data.porter![p.key]) || 0.5));
      }
      if (data.build_up) {
        setBondYield(data.build_up.risk_free_rate_pct);
        setRateSource(data.build_up.rate_source);
        setPorterW(Math.round(data.build_up.porter_weight * 100));
      }
      if (data.nine_box) {
        setGL(data.nine_box.gl_pct);
        setNY(data.nine_box.n_years);
        setGsManual(data.nine_box.gs_pct);
        setGsMode("engine");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      // keep the previously rendered sheet visible — an error never hides working content
      setError(err?.message || "Unable to reach the REBH engine");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(sym);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = input.trim()
    ? universe.filter(u => (u.sym || "").includes(input.trim()) || (u.en || u.name || "").toLowerCase().includes(input.trim().toLowerCase())).slice(0, 12)
    : [];

  // ── derived methodology chain ────────────────────────────────────────────
  const pTot = P5.reduce((a, b) => a + b, 0);
  const pComp = compLadder(pTot);
  const sComp = c?.safety?.compensation_pct ?? 4;
  const wP = porterW / 100;
  const ERP = pComp * wP + sComp * (1 - wP);
  const R = (bondYield + ERP) / 100;
  const GLc = Math.min(GL, bondYield + ERP - 0.5) / 100;
  const GS = (gsMode === "engine" ? (c?.nine_box?.gs_pct ?? GL) : gsManual) / 100;
  const debtPs = c?.nine_box?.net_debt_deducted ?? 0;
  const px = c?.price ?? null;
  const stale = !!c && !c.fresh;

  const Ld = lens(c?.nine_box?.dividends?.x_value ?? null, R, GLc, GS, NY, false, 0);
  const Le = lens(c?.nine_box?.earnings?.x_value ?? null, R, GLc, GS, NY, false, 0);
  const Lf = lens(c?.nine_box?.fcf_net_debt?.x_value ?? null, R, GLc, GS, NY, true, debtPs);

  const isCyc = !!c?.cyclical_bands?.is_cyclical;
  const isFin = !!c?.bank_metrics?.is_bank;
  const cls = c ? [c.industry_class, c.market_form, c.elasticity || "—", c.bcg_stage || "—"] : ["—", "—", "—", "—"];

  const zoneOf = (v: number | null) => {
    if (v == null || !Le[0] || !Le[2]) return null;
    const mid = ((Le[1] ?? Le[0]) + Le[2]) / 2;
    return v <= Le[0] ? ["GOLDEN", "text-[#8C3B32]"] : v <= mid ? ["SILVER", "text-[#6B7280]"] : v <= Le[2] ? ["BRONZE", "text-[#B45309]"] : ["ABOVE FAIR — danger", "text-red-700"];
  };
  const zoneNow = px != null ? zoneOf(px) : null;

  // Decision rows (IRR vs 15% hurdle, PV@15, MoS) per positive nine-box cell
  const NAMES = ["No-growth", "Gordon GL", "Transient GS"];
  const decRows: { name: string; v: number; irr: number; pv15: number; mos: number }[] = [];
  if (!stale && px) {
    ([["Dividends", Ld], ["Earnings", Le], ["FCF (net of debt°)", Lf]] as [string, (number | null)[]][])
      .forEach(([nm2, L]) => L.forEach((v, i) => {
        if (v == null || v <= 0) return;
        const irr = Math.pow(v / px, 1 / NY) - 1;
        const pv15 = v / Math.pow(1.15, NY);
        decRows.push({ name: `${nm2} · ${NAMES[i]}`, v, irr, pv15, mos: pv15 > px ? (pv15 / px - 1) * 100 : 0 });
      }));
  }

  const barX = (v: number | null) => {
    if (v == null || !Le[0] || !Le[2] || px == null) return "0%";
    const lo = Math.min(Le[0], px) * 0.7, hi = Math.max(Le[2], px) * 1.15;
    return `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100)).toFixed(1)}%`;
  };

  return (
    <div className="mt-4">
      <div className={`${CARD} p-4`}>
        <h2 className="text-[15px] font-extrabold text-[#1A1A1A]">House Valuation — the owner&apos;s methodology, live</h2>
        <p className="text-[11.5px] text-[#6B7280] mt-1 leading-relaxed">
          The complete Khurafshi-course engine + the owner&apos;s sheet, on every company: sector classification (with the
          cyclical mode and its buy/sell bands), the 5 safety elements with the course&apos;s exact +1/0/−1 bands, Porter
          five-forces scoring, the Build-Up required return (bond grade + weighted compensations), the growth menu with its
          disqualification rules, the nine-box, the golden/silver/bronze price zones, IRR vs the 15% hurdle with PV and margin
          of safety, computed red flags (Fisher EBIT rule, fad-shape, Mobily dividend rule), the buy-gate, and the Shariah
          screen. <span className="font-semibold">° computed · ≈ estimate · 🔌 named source.</span>
        </p>

        {/* Company picker */}
        <div className="relative flex items-center gap-3 flex-wrap mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-2.5 top-2.5" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && input.trim()) load(input.trim()); }}
              placeholder="Company… e.g. 1120"
              className="w-[280px] border border-[#E5E7EB] rounded-[4px] py-2 pl-8 pr-3 text-[12.5px] focus:outline-none focus:border-[#8C3B32]"
            />
            {matches.length > 0 && (
              <div className="absolute z-20 top-9 left-0 w-[320px] max-h-56 overflow-auto bg-white border border-[#E5E7EB] rounded-[4px] shadow-lg">
                {matches.map(m => (
                  <button key={m.sym} type="button"
                    className="block w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F3F4F6]"
                    onClick={() => { setInput(""); load(m.sym); }}>
                    <b className="font-mono">{m.sym}</b> · {m.en || m.name || ""}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={() => load(input.trim() || sym)}
            className="px-3 py-2 bg-[#8C3B32] text-white text-[12px] font-bold rounded-[4px] hover:bg-[#742f28]">
            Run the engine
          </button>
          {c && <span className="text-[12.5px] font-extrabold">{c.symbol} · {c.en || c.name}</span>}
          {loading && <span className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280]"><Loader2 className="w-4 h-4 animate-spin" /> computing…</span>}
        </div>
        {error && (
          <div className="mt-2 px-3 py-2 bg-[#FEF3C7] border border-[#FCD34D] rounded-[4px] text-[11.5px] text-[#92400E]">
            ⚑ {error} {c ? "— showing the last computed sheet below." : ""}
          </div>
        )}
        {!c && !loading && !error && <div className="mt-3 text-[12px] text-[#9CA3AF]">Pick a company to run the full methodology.</div>}

        {c && (
          <div className="mt-3">
            {/* Classification chips + freshness */}
            <div className="flex gap-2 flex-wrap mb-3">
              {["Industry", "Market form", "Elasticity", "BCG stage"].map((t, i) => (
                <span key={t} className="px-2 py-1 border border-[#8C3B32]/40 rounded-full text-[10.5px] text-[#374151]">
                  <span className="text-[#9CA3AF]">{t}</span> <b>{cls[i]}</b>
                </span>
              ))}
              <span className={`px-2 py-1 border rounded-full text-[10.5px] font-bold ${stale ? "border-red-300 text-red-700" : "border-emerald-300 text-emerald-700"}`}>
                {stale ? `⚠ STALE — priced valuation suppressed by rule${c.stale_reason ? ` (${c.stale_reason})` : ""}` : `fresh ${c.as_of || ""}`}
              </span>
            </div>
            {c.quarantine_reason && (
              <div className="mb-3 px-3 py-2 border border-[#FCD34D] bg-[#FFFBEB] rounded-[4px] text-[11.5px] text-[#92400E]">⚑ Quarantine note: {c.quarantine_reason}</div>
            )}
            {isFin && (
              <div className="mb-3 px-3 py-2 border border-[#FCD34D] bg-[#FFFBEB] rounded-[4px] text-[11.5px] text-[#92400E]">
                <b>⚠ Financial-sector rule (course):</b> banks/insurance are excluded from the standard safety elements — they are
                read via NII, NIM, provisions/revenue, CASA and LDR. Standard panels below are shown for reference only.
                {c.bank_metrics && (
                  <span className="block mt-1">
                    NIM° {fmt(c.bank_metrics.nim_pct, 2)}% · LDR° {fmt(c.bank_metrics.ldr_pct, 0)}% · CASA° {fmt(c.bank_metrics.casa_pct, 0)}% · Cost of risk° {fmt(c.bank_metrics.cost_of_risk_pct, 2)}%
                  </span>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* 1 · Safety */}
              <div>
                <h3 className={H3}>1 · Financial safety — course bands (+1/0/−1)</h3>
                <table className="w-full text-[11.5px]">
                  <thead><tr className="text-[#9CA3AF] border-b border-[#E5E7EB]">
                    <th className="text-left py-1 font-semibold">Element</th><th className="text-right font-semibold">Value</th><th className="text-right font-semibold text-[#9CA3AF]">Bands</th><th className="text-right font-semibold">Score</th>
                  </tr></thead>
                  <tbody>
                    {(c.safety.items || []).map(it => (
                      <tr key={it.name} className="border-b border-[#F3F4F6]">
                        <td className="py-1 text-[#374151]">{it.name}</td>
                        <td className="py-1 text-right font-mono">{it.val}</td>
                        <td className="py-1 text-right text-[10px] text-[#9CA3AF]">{it.threshold}</td>
                        <td className={`py-1 text-right font-extrabold font-mono ${it.score === 1 ? "text-emerald-700" : it.score === 0 ? "text-amber-600" : "text-red-700"}`}>
                          {it.score > 0 ? "+1" : it.score}
                        </td>
                      </tr>
                    ))}
                    <tr><td className="py-1 font-bold">TOTAL → compensation</td><td></td><td></td>
                      <td className="py-1 text-right font-black font-mono">{c.safety.raw_score} → {c.safety.compensation_pct}%</td></tr>
                  </tbody>
                </table>
                <div className="text-[10px] text-[#9CA3AF] mt-1">
                  Judged as a group, never alone; not applied to new companies or cyclicals (course rule)
                  {isCyc ? " — this IS a cyclical: treat as reference" : ""}.
                </div>
              </div>

              {/* 2 · Porter */}
              <div>
                <h3 className={H3}>2 · Porter five forces (0.1–0.9 each — never 0, never 1)</h3>
                {P5NAMES.map((p, i) => (
                  <div key={p.key} className="grid items-center gap-2 my-1" style={{ gridTemplateColumns: "170px 1fr 46px" }}>
                    <label className="text-[11.5px] text-[#374151]">{p.label}</label>
                    <input type="range" min={0.1} max={0.9} step={0.05} value={P5[i]}
                      onChange={e => setP5(P5.map((v, j) => (j === i ? +e.target.value : v)))} />
                    <b className="text-[11.5px] font-mono text-right">{P5[i].toFixed(2)}</b>
                  </div>
                ))}
                <div className="text-[12px] mt-1">
                  Total <b className="font-mono">{pTot.toFixed(2)}</b>/5 → compensation <b className="font-mono">{pComp}%</b>{" "}
                  <span className="text-[10px] text-[#9CA3AF]">(≥3.5→2 · 2.5–3.5→3 · else 4)</span>
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-1">° seeded from the engine classification; sliders are your declared judgment on top of it — document every choice.</div>
              </div>
            </div>

            {/* 3 · Build-Up */}
            <h3 className={H3}>3 · Build-Up required return</h3>
            <div className="flex gap-4 items-center flex-wrap text-[12.5px]">
              <label className="flex items-center gap-1.5">Bond anchor {rateSource === "company_sukuk" ? "(company sukuk°)" : "(gov't benchmark≈)"}
                <input type="number" step={0.05} value={bondYield} onChange={e => setBondYield(+e.target.value)} className="w-[76px] border border-[#E5E7EB] rounded-[4px] px-2 py-1 font-mono text-[12px]" />%
              </label>
              <label className="flex items-center gap-1.5">Porter weight
                <input type="range" min={20} max={70} step={5} value={porterW} onChange={e => setPorterW(+e.target.value)} className="w-[110px]" />
                <b className="font-mono">{porterW}/{100 - porterW}</b>
              </label>
              <span>ERP° = {pComp}×{wP.toFixed(2)} + {sComp}×{(1 - wP).toFixed(2)} = <b className="font-mono">{ERP.toFixed(2)}%</b></span>
              <span className="font-black text-[#8C3B32]">R° = {bondYield.toFixed(2)} + {ERP.toFixed(2)} = {(R * 100).toFixed(2)}%</span>
              <span className="text-[10px] text-[#9CA3AF]">course range 4–12% {R * 100 >= 4 && R * 100 <= 12 ? "✔" : "⚠ outside"} · never bend it to force a number</span>
            </div>

            {/* 4 · Growth menu */}
            <h3 className={H3}>4 · Growth menu (GS) — disqualify first, then choose</h3>
            <div className="flex gap-4 flex-wrap items-center text-[12px]">
              <label className="flex items-center gap-1.5"><input type="radio" name="gsel" checked={gsMode === "engine"} onChange={() => setGsMode("engine")} />
                Adopted GS° (engine verdict) — <b className="font-mono">{fmt(c.nine_box?.gs_pct, 1)}%</b></label>
              <label className="flex items-center gap-1.5"><input type="radio" name="gsel" checked={gsMode === "manual"} onChange={() => setGsMode("manual")} />
                Your evaluation — sheet opt.7
                {gsMode === "manual" && <span className="inline-flex items-center gap-1 ml-1">
                  <input type="range" min={0} max={30} step={0.5} value={gsManual} onChange={e => setGsManual(+e.target.value)} className="w-[140px]" />
                  <b className="font-mono">{gsManual}%</b></span>}
              </label>
              <span className="text-[11px] text-[#9CA3AF]">CAGR 3–6Y (opts 2–5) 🔌 pre-2020 backfill</span>
            </div>
            <div className="text-[10.5px] text-[#9CA3AF] mt-1">
              {GS < GLc && <span className="text-red-700 font-bold">⚠ GS below GL — transient equations collapse; check the menu. </span>}
              GL {GL}% <input type="range" min={0} max={5} step={0.25} value={GL} onChange={e => setGL(+e.target.value)} className="w-[90px] align-middle" /> ·
              N {NY}y <input type="range" min={2} max={10} step={1} value={NY} onChange={e => setNY(+e.target.value)} className="w-[90px] align-middle" /> ·
              no 20-year N except 8–15% growth; never project 50–70% for ten years.
            </div>

            {/* 5 · Nine-box */}
            {stale ? (
              <div className="mt-4 px-3 py-2 border border-[#E5E7EB] bg-[#F9FAFB] rounded-[4px] text-[11.5px] text-[#6B7280]">
                Statements stale — the nine-box never prices yesterday against today (course + platform rule).
              </div>
            ) : (
              <>
                <h3 className={H3}>5 · The nine-box (per share, SAR)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead><tr className="text-[#9CA3AF] border-b border-[#E5E7EB]">
                      <th className="text-left py-1">Lens</th><th className="text-right">No-growth X/R</th><th className="text-right">Gordon X(1+GL)/(R−GL)</th><th className="text-right">Transient + X·(N/2)·(GS−GL)/(R−GL)</th>
                    </tr></thead>
                    <tbody>
                      {([["Dividends", Ld, c.nine_box?.dividends], ["Earnings", Le, c.nine_box?.earnings], ["FCF (net of debt°)", Lf, c.nine_box?.fcf_net_debt]] as [string, (number | null)[], NineBoxCell | undefined][])
                        .map(([nm2, L, cell]) => (
                          <tr key={nm2} className="border-b border-[#F3F4F6]">
                            <td className="py-1 text-[#374151]">{nm2}{cell?.source_status ? <span className="text-[9.5px] text-[#9CA3AF]"> {cell.source_status}</span> : null}</td>
                            {L.map((v, i) => (
                              <td key={i} className={`py-1 text-right font-mono ${v != null && px != null && v >= px ? "text-emerald-700" : "text-[#1A1A1A]"}`}>
                                {fmt(v)}{v != null && px ? <span className="text-[9.5px] block">{v >= px ? "+" : ""}{fmt((v / px - 1) * 100, 0)}%</span> : ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="text-[10px] text-[#9CA3AF] mt-1">{c.nine_box?.debt_allocation_rule} — never subtract the debt twice in the transient part.</div>
                </div>

                {/* Zones */}
                {Le[0] != null && Le[2] != null && px != null && (
                  <div className="mt-4">
                    <h3 className={`${H3} mb-8`}>Price zones — course rule (golden ≤ no-growth · silver ≤ midpoint · bronze ≤ transient fair)</h3>
                    <div className="relative h-2 bg-[#F3F4F6] rounded">
                      <div className="absolute h-2 bg-[#D9B64A]/40 rounded-l" style={{ left: 0, width: barX(Le[0]) }} />
                      <div className="absolute h-2 bg-[#B8C4D4]/40" style={{ left: barX(Le[0]), width: `calc(${barX(((Le[1] ?? Le[0]) + Le[2]) / 2)} - ${barX(Le[0])})` }} />
                      <div className="absolute h-2 bg-[#C98A4B]/40" style={{ left: barX(((Le[1] ?? Le[0]) + Le[2]) / 2), width: `calc(${barX(Le[2])} - ${barX(((Le[1] ?? Le[0]) + Le[2]) / 2)})` }} />
                      <div className="absolute -top-1 w-[2px] h-4 bg-[#8C3B32]" style={{ left: barX(px) }} />
                      <div className="absolute top-5 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-bold text-[#8C3B32]" style={{ left: barX(px) }}>
                        PRICE {fmt(px)} — <span className={zoneNow?.[1] || ""}>{zoneNow?.[0] || "—"}</span>
                      </div>
                      <div className="absolute -top-5 text-[9.5px] text-[#9CA3AF] -translate-x-1/2" style={{ left: barX(Le[0]) }}>no-growth {fmt(Le[0], 1)}</div>
                      <div className="absolute -top-5 text-[9.5px] text-[#9CA3AF] -translate-x-1/2" style={{ left: barX(Le[2]) }}>transient {fmt(Le[2], 1)}</div>
                    </div>
                  </div>
                )}

                {/* Reverse DCF + decision table */}
                {c.reverse_dcf?.implied_growth_pct != null && (
                  <div className="text-[12.5px] mt-4">
                    <b className="text-[#8C3B32]">REVERSE DCF°</b> — the growth the market is paying for at {fmt(px)}:{" "}
                    <b className="font-mono text-[#8C3B32]">{c.reverse_dcf.implied_growth_pct}%</b> vs your GS {(GS * 100).toFixed(1)}% →{" "}
                    <b className={c.reverse_dcf.implied_growth_pct > GS * 100 ? "text-red-700" : "text-emerald-700"}>
                      {c.reverse_dcf.implied_growth_pct > GS * 100 ? "market assumes MORE growth than you do — priced for perfection" : "market assumes LESS growth than you do — your edge if you are right"}
                    </b>
                  </div>
                )}
                {decRows.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <h3 className={H3}>Decision — IRR vs the 15% hurdle (mark in green the price that clears it)</h3>
                    <table className="w-full text-[11.5px]">
                      <thead><tr className="text-[#9CA3AF] border-b border-[#E5E7EB]">
                        <th className="text-left py-1">Lens · equation</th><th className="text-right">Fair (SAR)</th><th className="text-right">IRR/Ny</th><th className="text-right">PV@15%</th><th className="text-right">MoS</th>
                      </tr></thead>
                      <tbody>
                        {decRows.map(r => (
                          <tr key={r.name} className="border-b border-[#F3F4F6]">
                            <td className="py-1 text-[#374151]">{r.name}</td>
                            <td className="py-1 text-right font-mono">{fmt(r.v)}</td>
                            <td className={`py-1 text-right font-mono font-bold ${r.irr >= 0.15 ? "text-emerald-700" : r.irr >= R ? "text-amber-600" : "text-red-700"}`}>{(r.irr * 100).toFixed(1)}%</td>
                            <td className="py-1 text-right font-mono">{fmt(r.pv15)}</td>
                            <td className={`py-1 text-right font-mono ${r.mos > 0 ? "text-emerald-700" : "text-[#9CA3AF]"}`}>{r.mos > 0 ? `${fmt(r.mos, 0)}%` : "0"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Cyclical mode */}
            {isCyc && c.cyclical_bands && (
              <div className="mt-4 px-3 py-2 border border-amber-300 bg-[#FFFBEB] rounded-[4px] text-[11.5px] text-[#92400E] leading-relaxed">
                <b>⚠ CYCLICAL MODE (course rules):</b> low P/E here is a trap (Molodovsky) — cyclicals are bought at HIGH multiples
                on trough earnings and sold at LOW multiples on peak earnings. {c.cyclical_bands.rule}.{" "}
                Trough EPS° {fmt(c.cyclical_bands.lowest_cycle_eps, 2)} → <b>buy band° {fmt(c.cyclical_bands.buy_band_min, 1)}–{fmt(c.cyclical_bands.buy_band_max, 1)} SAR</b> ·{" "}
                peak EPS° {fmt(c.cyclical_bands.highest_cycle_eps, 2)} → <b>sell band° {fmt(c.cyclical_bands.sell_band_min, 1)}–{fmt(c.cyclical_bands.sell_band_max, 1)} SAR</b>.
                Watch SUPPLY: capacity expansion announcements = the exit signal. FCF explodes at cycle top — never trust it.
                Never lower R for a cyclical however good Porter looks.
              </div>
            )}

            {/* P/S ladder for loss-makers */}
            {c.ps_ladder?.is_loss_maker && (
              <div className="mt-4 text-[12px] text-[#374151]">
                <b className="text-[#8C3B32]">P/S ladder (course):</b> fair multiple° = NPM×g = {fmt(c.ps_ladder.base_ps, 1)}× →
                cheap {fmt(c.ps_ladder.cheap_ps, 1)} · medium {fmt(c.ps_ladder.medium_ps, 1)} ·{" "}
                <span className="text-red-700">danger {fmt(c.ps_ladder.danger_ps, 1)} SAR — never above ×3</span> ·
                kill-switch: once margins are realized, earnings methods take precedence.
              </div>
            )}

            {/* Red flags° */}
            <h3 className={H3}>Computed red flags°</h3>
            {c.red_flags.length === 0 ? (
              <div className="text-[11.5px] text-emerald-700">✔ No course-rule flags fired on the verified quarters.</div>
            ) : (
              <ul className="space-y-1">
                {c.red_flags.map(f => (
                  <li key={f.code} className={`px-3 py-1.5 rounded-[4px] text-[11.5px] border ${f.severity === "critical" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-[#FFFBEB] text-[#92400E]"}`}>
                    <b>{f.status_symbol} {f.title_en}</b> — {f.detail_en || f.detail}
                  </li>
                ))}
              </ul>
            )}

            {/* Buy gate */}
            <h3 className={H3}>Buy-gate (course: acceleration + insider + breakout)</h3>
            <div className={`px-3 py-2 rounded-[4px] text-[11.5px] border ${c.buy_gate.gate_passed ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>
              {c.buy_gate.gate_passed ? "✔ Gate passed" : "✘ Gate not passed"}
              {c.buy_gate.pass_conditions.length > 0 && <div className="mt-1 text-[#374151]">{c.buy_gate.pass_conditions.join(" · ")}</div>}
              {c.buy_gate.fail_reasons.length > 0 && <div className="mt-1"><b>Blocked:</b> {c.buy_gate.fail_reasons.join(" · ")}</div>}
              <div className="mt-1 text-[10.5px] text-[#9CA3AF]">Institutional/insider buying 🔌 ownership importer (Tadawul disclosures) · Technical breakout 🔌 price layer.</div>
            </div>

            {/* Grades + Shariah */}
            <h3 className={H3}>Shariah screen°</h3>
            <div className="text-[11.5px] text-[#374151]">
              Debt/mcap {fmt(c.shariah.debt_to_market_cap_pct, 1)}% · interest income {fmt(c.shariah.interest_income_pct, 1)}% · illiquid assets {fmt(c.shariah.illiquid_assets_pct, 0)}% →{" "}
              <b className={c.shariah.is_compliant ? "text-emerald-700" : c.shariah.is_compliant === false ? "text-red-700" : "text-amber-600"}>
                {c.shariah.is_compliant === true ? "PASSES" : c.shariah.is_compliant === false ? "FAILS" : "INCONCLUSIVE"} ({c.shariah.source_status})
              </b>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">{c.shariah.committee_disclaimer}</div>
            </div>
            <div className="text-[10.5px] text-[#9CA3AF] mt-2">
              Grades ready-made (never hand-computed in the method): Piotroski F° {c.piotroski ?? "—"} · Altman Z° {fmt(c.altman, 2)} · Beneish M° {fmt(c.beneish, 2)}
            </div>
          </div>
        )}
      </div>

      {/* 📖 Rulebook — Doors 1/2/3/5/8 (course-coverage-matrix: doors inside House Valuation) */}
      <HouseValuationRulebook />
    </div>
  );
}
