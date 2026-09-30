"use client";

import React, { useState } from "react";
import {
  BarChart3, Shield, Layers, RefreshCw, Calculator,
  PieChart, TrendingUp, AlertOctagon, CheckCircle2, ChevronDown,
  ChevronUp, RotateCcw, Building2, Landmark, Brain, Activity,
  Sliders, UserCheck, HelpCircle, ArrowRight
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const BADGE = "text-[10px] font-semibold px-2 py-0.5 rounded-full";
const INPUT = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/10 transition";
const BTN_ACTION = "px-3 py-1.5 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition inline-flex items-center gap-1";

export default function CourseLabsTab() {
  const [activeLabId, setActiveLabId] = useState<number>(1);

  // -------------------------------------------------------------
  // Lab 1: TASI Index Lab
  // -------------------------------------------------------------
  const [l1Pe, setL1Pe] = useState(13.6);
  const [l1Bond, setL1Bond] = useState(4.75);
  const [l1Result, setL1Result] = useState<any>(null);
  const [l1Loading, setL1Loading] = useState(false);
  const [l1Mode, setL1Mode] = useState<string>("constituents_aggregate");

  const calcL1 = async () => {
    setL1Loading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/tasi-index?pe=${l1Pe}&bond=${l1Bond}&mode=${l1Mode}`);
      if (res.ok) setL1Result(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setL1Loading(false);
    }
  };

  // -------------------------------------------------------------
  // Lab 2: Multibagger Matrix Lab
  // -------------------------------------------------------------
  const [l2EntryPe, setL2EntryPe] = useState(12);
  const [l2ExitPe, setL2ExitPe] = useState(24);
  const [l2Cagr, setL2Cagr] = useState(15);
  const [l2Years, setL2Years] = useState(5);
  const [l2Result, setL2Result] = useState<any>(null);

  const calcL2 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/multibagger?pe_entry=${l2EntryPe}&pe_exit=${l2ExitPe}&cagr=${l2Cagr}&years=${l2Years}`);
      if (res.ok) setL2Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 3: Cut-Cut Recovery Lab
  // -------------------------------------------------------------
  const [l3Peak, setL3Peak] = useState(5.0);
  const [l3Current, setL3Current] = useState(2.4);
  const [l3Years, setL3Years] = useState(4);
  const [l3Result, setL3Result] = useState<any>(null);

  const calcL3 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/cut-cut?peak_eps=${l3Peak}&current_eps=${l3Current}&years=${l3Years}`);
      if (res.ok) setL3Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 4: Fair P/B Lab
  // -------------------------------------------------------------
  const [l4Roe, setL4Roe] = useState(18.0);
  const [l4R, setL4R] = useState(9.0);
  const [l4Result, setL4Result] = useState<any>(null);

  const calcL4 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/fair-pb?roe=${l4Roe}&r=${l4R}`);
      if (res.ok) setL4Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 5: DCF Implied Growth Lab
  // -------------------------------------------------------------
  const [l5Px, setL5Px] = useState(50.0);
  const [l5Eps, setL5Eps] = useState(2.5);
  const [l5R, setL5R] = useState(8.0);
  const [l5Result, setL5Result] = useState<any>(null);

  const calcL5 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/dcf-growth?price=${l5Px}&eps=${l5Eps}&r=${l5R}`);
      if (res.ok) setL5Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 6: TVM / IRR Multi-Method Solver Lab
  // -------------------------------------------------------------
  const [l6Px, setL6Px] = useState(45.0);
  const [l6Fv, setL6Fv] = useState(90.0);
  const [l6Yrs, setL6Yrs] = useState(5);
  const [l6Hurdle, setL6Hurdle] = useState(15.0);
  const [l6Result, setL6Result] = useState<any>(null);

  const calcL6 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/tvm-irr?price=${l6Px}&fair_value=${l6Fv}&years=${l6Yrs}&hurdle=${l6Hurdle}`);
      if (res.ok) setL6Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 7: Dilution & Buyback Effect Lab
  // -------------------------------------------------------------
  const [l7S0, setL7S0] = useState(100.0);
  const [l7S1, setL7S1] = useState(95.0);
  const [l7Ni, setL7Ni] = useState(250.0);
  const [l7Result, setL7Result] = useState<any>(null);

  const calcL7 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/dilution-buyback?initial_shares=${l7S0}&current_shares=${l7S1}&net_income=${l7Ni}`);
      if (res.ok) setL7Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 8: Beneish M-Score
  // -------------------------------------------------------------
  const [l8Dsri, setL8Dsri] = useState(1.05);
  const [l8Gmi, setL8Gmi] = useState(0.98);
  const [l8Aqi, setL8Aqi] = useState(1.02);
  const [l8Sgi, setL8Sgi] = useState(1.12);
  const [l8Depi, setL8Depi] = useState(1.01);
  const [l8Sgai, setL8Sgai] = useState(0.95);
  const [l8Tata, setL8Tata] = useState(0.02);
  const [l8Lvgi, setL8Lvgi] = useState(0.99);
  const [l8Result, setL8Result] = useState<any>(null);

  const calcL8 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/beneish-m-score?dsri=${l8Dsri}&gmi=${l8Gmi}&aqi=${l8Aqi}&sgi=${l8Sgi}&depi=${l8Depi}&sgai=${l8Sgai}&tata=${l8Tata}&lvgi=${l8Lvgi}`);
      if (res.ok) setL8Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 9: rNPV Stage-Gate Lab
  // -------------------------------------------------------------
  const [l9Inv, setL9Inv] = useState(100.0);
  const [l9Cf, setL9Cf] = useState(50.0);
  const [l9Yrs, setL9Yrs] = useState(4);
  const [l9R, setL9R] = useState(10.0);
  const [l9Preset, setL9Preset] = useState("course_standard");
  const [l9P1, setL9P1] = useState(28.0);
  const [l9P2, setL9P2] = useState(17.0);
  const [l9P3, setL9P3] = useState(15.0);
  const [l9P4, setL9P4] = useState(13.5);
  const [l9Result, setL9Result] = useState<any>(null);

  const applyRnpvPreset = (p: string) => {
    setL9Preset(p);
    if (p === "dimasi") {
      setL9P1(59.5); setL9P2(35.5); setL9P3(62.0); setL9P4(90.0);
    } else {
      setL9P1(28.0); setL9P2(17.0); setL9P3(15.0); setL9P4(13.5);
    }
  };

  const calcL9 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/rnpv?investment=${l9Inv}&cash_flow=${l9Cf}&years=${l9Yrs}&r=${l9R}&preset=${l9Preset}&p1=${l9P1}&p2=${l9P2}&p3=${l9P3}&p4=${l9P4}`);
      if (res.ok) setL9Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 10: User-Based Valuation Lab
  // -------------------------------------------------------------
  const [l10Users, setL10Users] = useState(4.5);
  const [l10SarPerUser, setL10SarPerUser] = useState(500.0);
  const [l10Mc, setL10Mc] = useState(2500.0);
  const [l10Result, setL10Result] = useState<any>(null);

  const calcL10 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/user-valuation?users_m=${l10Users}&sar_per_user=${l10SarPerUser}&market_cap=${l10Mc}`);
      if (res.ok) setL10Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 11: Banks Toolkit Lab
  // -------------------------------------------------------------
  const [l11Symbol, setL11Symbol] = useState("1120");
  const [l11Nii, setL11Nii] = useState(6500.0);
  const [l11Ea, setL11Ea] = useState(720000.0);
  const [l11Prov, setL11Prov] = useState(450.0);
  const [l11Loans, setL11Loans] = useState(610000.0);
  const [l11Dep, setL11Dep] = useState(680000.0);
  const [l11Casa, setL11Casa] = useState(420000.0);
  const [l11Rev, setL11Rev] = useState(8500.0);
  const [l11Result, setL11Result] = useState<any>(null);

  const calcL11 = async (symOverride?: string) => {
    try {
      const sym = (symOverride !== undefined ? symOverride : l11Symbol).trim();
      const q = sym ? `symbol=${encodeURIComponent(sym)}` : `nii=${l11Nii}&earning_assets=${l11Ea}&provisions=${l11Prov}&loans=${l11Loans}&deposits=${l11Dep}&casa=${l11Casa}&revenue=${l11Rev}`;
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/banks-toolkit?${q}`);
      if (res.ok) {
        const data = await res.json();
        setL11Result(data);
        if (data.inputs) {
          if (data.inputs.nii_m) setL11Nii(data.inputs.nii_m);
          if (data.inputs.earning_assets_m) setL11Ea(data.inputs.earning_assets_m);
          if (data.inputs.provisions_m) setL11Prov(data.inputs.provisions_m);
          if (data.inputs.total_loans_m) setL11Loans(data.inputs.total_loans_m);
          if (data.inputs.total_deposits_m) setL11Dep(data.inputs.total_deposits_m);
          if (data.inputs.casa_deposits_m) setL11Casa(data.inputs.casa_deposits_m);
          if (data.inputs.operating_revenue_m) setL11Rev(data.inputs.operating_revenue_m);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 12: Economy Scorecard Lab
  // -------------------------------------------------------------
  const [l12Repo, setL12Repo] = useState(5.50);
  const [l12Saibor, setL12Saibor] = useState(5.80);
  const [l12Gdp, setL12Gdp] = useState(4.2);
  const [l12Inf, setL12Inf] = useState(1.6);
  const [l12Unemp, setL12Unemp] = useState(7.8);
  const [l12Result, setL12Result] = useState<any>(null);

  const calcL12 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/economy-scorecard?repo=${l12Repo}&saibor=${l12Saibor}&gdp=${l12Gdp}&inflation=${l12Inf}&unemployment=${l12Unemp}`);
      if (res.ok) setL12Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 13: Fisher 15 Scoring Lab
  // -------------------------------------------------------------
  const [fisherChecks, setFisherChecks] = useState<boolean[]>(Array(15).fill(true));
  const [l13Result, setL13Result] = useState<any>(null);

  const toggleFisher = (idx: number) => {
    const next = [...fisherChecks];
    next[idx] = !next[idx];
    setFisherChecks(next);
  };

  const calcL13 = async () => {
    try {
      const qParams = fisherChecks.map(c => `answers=${c}`).join("&");
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/fisher-15?${qParams}`);
      if (res.ok) setL13Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 14: Peter Lynch 6 Categories Lab
  // -------------------------------------------------------------
  const [l14Growth, setL14Growth] = useState(18.0);
  const [l14Pe, setL14Pe] = useState(14.0);
  const [l14Div, setL14Div] = useState(2.5);
  const [l14Cyc, setL14Cyc] = useState(false);
  const [l14Turn, setL14Turn] = useState(false);
  const [l14Asset, setL14Asset] = useState(false);
  const [l14Result, setL14Result] = useState<any>(null);

  const calcL14 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/peter-lynch?growth=${l14Growth}&pe=${l14Pe}&dividend_yield=${l14Div}&cyclical=${l14Cyc}&turnaround=${l14Turn}&asset_play=${l14Asset}`);
      if (res.ok) setL14Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 15: Governance Scorecard Lab
  // -------------------------------------------------------------
  const [l15Clean, setL15Clean] = useState(true);
  const [l15Indep, setL15Indep] = useState(50.0);
  const [l15RelParty, setL15RelParty] = useState(0.0);
  const [l15Sep, setL15Sep] = useState(true);
  const [l15RecGrow, setL15RecGrow] = useState(false);
  const [l15FcfDiv, setL15FcfDiv] = useState(true);
  const [l15Result, setL15Result] = useState<any>(null);

  const calcL15 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/governance?clean_audit=${l15Clean}&board_independence=${l15Indep}&related_parties_m=${l15RelParty}&separate_chair_ceo=${l15Sep}&receivables_outgrowing=${l15RecGrow}&fcf_covers_dividend=${l15FcfDiv}`);
      if (res.ok) setL15Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 16: Psychology Station Lab
  // -------------------------------------------------------------
  const [l16Fomo, setL16Fomo] = useState(2);
  const [l16LossAv, setL16LossAv] = useState(3);
  const [l16Anchor, setL16Anchor] = useState(2);
  const [l16Confirm, setL16Confirm] = useState(2);
  const [l16Disp, setL16Disp] = useState(3);
  const [l16Result, setL16Result] = useState<any>(null);

  const calcL16 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/psychology-station?fomo=${l16Fomo}&loss_aversion=${l16LossAv}&anchoring=${l16Anchor}&confirmation=${l16Confirm}&disposition=${l16Disp}`);
      if (res.ok) setL16Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 17: P/S Valuation Ladder Lab
  // -------------------------------------------------------------
  const [l17Npm, setL17Npm] = useState(12.0);
  const [l17R, setL17R] = useState(8.0);
  const [l17Growth, setL17Growth] = useState(20.0);
  const [l17Sps, setL17Sps] = useState(25.0);
  const [l17Result, setL17Result] = useState<any>(null);

  const calcL17 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/ps-ladder?npm=${l17Npm}&r=${l17R}&growth=${l17Growth}&sales_per_share=${l17Sps}`);
      if (res.ok) setL17Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Lab 18: Terry Smith ROCE Lab
  // -------------------------------------------------------------
  const [l18Ebit, setL18Ebit] = useState(1200.0);
  const [l18Ta, setL18Ta] = useState(4500.0);
  const [l18Cl, setL18Cl] = useState(750.0);
  const [l18Result, setL18Result] = useState<any>(null);

  const calcL18 = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/labs/terry-smith-roce?ebit=${l18Ebit}&total_assets=${l18Ta}&current_liabilities=${l18Cl}`);
      if (res.ok) setL18Result(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const LABS_LIST = [
    { id: 1, title: "1. TASI Index Lab", desc: "P/E 15-25 scenarios and the bond-yield rule × 1.5" },
    { id: 2, title: "2. Multibagger Matrix", desc: "Decompose multiple expansion and earnings growth to determine the return multiple" },
    { id: 3, title: "3. Crisis Recovery (Cut-Cut System)", desc: "Derive the temporary compensating growth rate (I/Y) for impacted companies" },
    { id: 4, title: "4. Fair Price-to-Book (Fair P/B)", desc: "P/B = ROE / R equation for capturing neglected asset-heavy stocks" },
    { id: 5, title: "5. Reverse DCF (DCF Implied Growth)", desc: "Infer the growth implied in the current share price" },
    { id: 6, title: "6. Time Value of Money & IRR (TVM / IRR)", desc: "Solve for the expected IRR and compare it to the 15% hurdle" },
    { id: 7, title: "7. Dilution & Buyback", desc: "Impact of share count changes on EPS growth" },
    { id: 8, title: "8. Earnings Manipulation Detection (Beneish M-Score)", desc: "Eight-variable statistical model for detecting earnings inflation and deferral" },
    { id: 9, title: "9. Stage-Gate Projects (rNPV Lab)", desc: "Discount healthcare-sector cash flows using DiMasi success probabilities" },
    { id: 10, title: "10. Platform & App Valuation (User-Based)", desc: "Value platforms by active user count (ready-made model)" },
    { id: 11, title: "11. Banks Toolkit", desc: "NIM, CASA, LDR, cost of risk, and provisions-to-revenue metrics" },
    { id: 12, title: "12. Macro Economy Scorecard", desc: "Repo rate, SAIBOR, GDP growth, inflation rate, and unemployment" },
    { id: 13, title: "13. Fisher 15 Checklist", desc: "Assess management quality, product leadership, and integrity point 15" },
    { id: 14, title: "14. Peter Lynch's Six Categories", desc: "Classify the stock: slow grower, stalwart, fast grower, cyclical, asset play, turnaround" },
    { id: 15, title: "15. Governance & Red Flags", desc: "The six red flags, the capital increase rule, and board independence" },
    { id: 16, title: "16. Investor Psychology (Psychology Radar)", desc: "Cognitive bias radar: FOMO, loss aversion, and anchoring" },
    { id: 17, title: "17. P/S Valuation Ladder", desc: "Value early-stage loss-making companies using a target net profit margin" },
    { id: 18, title: "18. Capital Efficiency (Terry Smith ROCE)", desc: "ROCE = EBIT / (TA - CL) with the 32% exceptional-quality benchmark" },
  ];

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-bold text-[#1A1A1A]">The 18 Interactive Methodology Labs (REBH Course Labs)</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
            Full interactive engines connected to the API
          </span>
        </div>
        <p className="text-xs text-[#6B7280]">
          All 18 Al-Kharafshi course labs are ready for live calculation, with formula display, source documentation, and a methodology verification mark.
        </p>
      </div>

      {/* Lab Selector Navigation */}
      <div className={`${CARD} p-3 overflow-x-auto`}>
        <div className="flex items-center gap-1.5 min-w-max">
          {LABS_LIST.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLabId(l.id)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition whitespace-nowrap ${activeLabId === l.id
                ? "bg-[#8C3B32] text-white shadow-sm"
                : "bg-[#F7F8FA] hover:bg-[#F3F4F6] text-[#6B7280]"
                }`}
            >
              Lab #{l.id}
            </button>
          ))}
        </div>
      </div>

      {/* Active Lab Viewport */}
      <div className={`${CARD} p-6 space-y-5`}>
        <div className="border-b border-[#E5E7EB] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#8C3B32] block mb-0.5">Lab #{activeLabId}</span>
            <h3 className="text-sm font-bold text-[#1A1A1A]">{LABS_LIST[activeLabId - 1].title}</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">{LABS_LIST[activeLabId - 1].desc}</p>
          </div>
          <span className={`${BADGE} bg-[#F0FDF4] text-[#16A34A] self-start sm:self-auto`}>
            ° verified engine
          </span>
        </div>

        {/* -------------------------------------------------------- */}
        {/* Lab 1 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#6B7280]">Calculation method:</span>
              <button
                type="button"
                onClick={() => setL1Mode("constituents_aggregate")}
                className={`px-2.5 py-1 text-xs rounded font-bold transition ${l1Mode === 'constituents_aggregate' ? 'bg-[#8C3B32] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
              >
                Live aggregate from TASI constituents (Market Machine)
              </button>
              <button
                type="button"
                onClick={() => setL1Mode("benchmark_pe")}
                className={`px-2.5 py-1 text-xs rounded font-bold transition ${l1Mode === 'benchmark_pe' ? 'bg-[#8C3B32] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
              >
                Manual index P/E override (Manual Override)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">TASI P/E Ratio:</label>
                <input
                  type="number"
                  step="0.1"
                  value={l1Pe}
                  onChange={e => setL1Pe(parseFloat(e.target.value) || 0)}
                  disabled={l1Mode === "constituents_aggregate"}
                  className={`${INPUT} w-full ${l1Mode === 'constituents_aggregate' ? 'opacity-70 bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {l1Mode === "constituents_aggregate" && (
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">Derived automatically from constituent weights capped at 10.22%</span>
                )}
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">10-Year Government Bond Yield (Bond Yield %):</label>
                <input type="number" step="0.05" value={l1Bond} onChange={e => setL1Bond(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL1} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Run the live TASI engine (Market Machine)
            </button>
            {l1Result && (
              <div className={`${SUBCARD} p-4 space-y-4`}>
                <div className="text-xs text-[#6B7280] flex justify-between items-center">
                  <span>Formula: <span className="font-mono text-[#1A1A1A]">{l1Result.formula}</span></span>
                  <span className="font-bold text-[#8C3B32]">{l1Result.status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Fair P/E (bond rule)</span>
                    <span className="text-base font-bold text-[#8C3B32]">{l1Result.result?.fair_pe_bond_rule}x</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Index earnings yield</span>
                    <span className="text-base font-bold text-[#1A1A1A]">{l1Result.result?.index_earnings_yield_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Required bond-based yield (×1.5)</span>
                    <span className="text-base font-bold text-[#1A1A1A]">{l1Result.result?.required_index_yield_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Fair value vs. current</span>
                    <span className="text-base font-bold text-[#16A34A]">{l1Result.result?.fair_vs_current_pct > 0 ? `+${l1Result.result?.fair_vs_current_pct}%` : `${l1Result.result?.fair_vs_current_pct}%`}</span>
                  </div>
                </div>

                {/* 10 Fair Value Scenarios Table with 2Y/3Y IRR */}
                {l1Result.result?.scenarios_10 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-xs font-bold text-[#1A1A1A] block">
                      Ten Index Scenarios Table (10 Fair Value Scenarios &amp; TVM IRR)
                    </span>
                    <div className="overflow-x-auto border border-[#E5E7EB] rounded bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#6B7280]">
                          <tr>
                            <th className="p-2">Scenario</th>
                            <th className="p-2 text-center">P/E Multiple</th>
                            <th className="p-2 text-center">Fair Index Level</th>
                            <th className="p-2 text-center">Premium/Discount %</th>
                            <th className="p-2 text-center text-[#8C3B32]">2-Year Return (2Y IRR)</th>
                            <th className="p-2 text-center text-[#8C3B32]">3-Year Return (3Y IRR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {l1Result.result.scenarios_10.map((s: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#F9FAFB]">
                              <td className="p-2 font-medium text-[#1A1A1A]">{s.name}</td>
                              <td className="p-2 text-center font-mono">{s.pe}x</td>
                              <td className="p-2 text-center font-bold">{Math.round(s.fair_index_level).toLocaleString()} pts</td>
                              <td className={`p-2 text-center font-bold ${s.upside_downside_pct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                                {s.upside_downside_pct >= 0 ? `+${s.upside_downside_pct}%` : `${s.upside_downside_pct}%`}
                              </td>
                              <td className="p-2 text-center font-bold text-[#1A1A1A]">
                                {s.return_2y_irr_pct !== null ? `${s.return_2y_irr_pct}%` : '—'}
                              </td>
                              <td className="p-2 text-center font-bold text-[#1A1A1A]">
                                {s.return_3y_irr_pct !== null ? `${s.return_3y_irr_pct}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 2 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Entry P/E:</label>
                <input type="number" step="0.5" value={l2EntryPe} onChange={e => setL2EntryPe(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Target Exit P/E:</label>
                <input type="number" step="0.5" value={l2ExitPe} onChange={e => setL2ExitPe(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Expected Annual Earnings Growth (CAGR %):</label>
                <input type="number" step="0.5" value={l2Cagr} onChange={e => setL2Cagr(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Investment Horizon (years):</label>
                <input type="number" step="1" value={l2Years} onChange={e => setL2Years(parseInt(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL2} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate the multibagger multiple
            </button>
            {l2Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l2Result.formula}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Total stock multiple</span>
                    <span className="text-lg font-black text-[#8C3B32]">{l2Result.result?.total_multiplier}x</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Total return realized</span>
                    <span className="text-lg font-black text-[#16A34A]">+{l2Result.result?.total_return_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Annualized IRR</span>
                    <span className="text-lg font-black text-[#1A1A1A]">{l2Result.result?.annualized_irr_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Earnings growth contribution</span>
                    <span className="text-lg font-black text-[#1A1A1A]">{l2Result.result?.earnings_factor}x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 3 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Peak-Cycle EPS (Peak EPS):</label>
                <input type="number" step="0.1" value={l3Peak} onChange={e => setL3Peak(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Current Post-Crisis EPS (Current EPS):</label>
                <input type="number" step="0.1" value={l3Current} onChange={e => setL3Current(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Expected Years to Recover to Peak:</label>
                <input type="number" step="1" value={l3Years} onChange={e => setL3Years(parseInt(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL3} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate the compensating growth rate
            </button>
            {l3Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l3Result.formula}</span></div>
                <div className="bg-white p-3 rounded border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Required annual growth rate for recovery (I/Y)</span>
                    <span className="text-xs text-[#6B7280]">Growth required from EPS {l3Current} to {l3Peak} over {l3Years} years</span>
                  </div>
                  <span className="text-xl font-black text-[#8C3B32]">{l3Result.result?.recovery_cagr_pct}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 4 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Sustainable Return on Equity (ROE %):</label>
                <input type="number" step="0.5" value={l4Roe} onChange={e => setL4Roe(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Required Rate of Return (R %):</label>
                <input type="number" step="0.5" value={l4R} onChange={e => setL4R(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL4} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate the fair P/B multiple
            </button>
            {l4Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l4Result.formula}</span></div>
                <div className="bg-white p-3 rounded border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Fair Price-to-Book (Fair P/B)</span>
                    <span className="text-xs text-[#6B7280]">ROE {l4Roe}% ÷ R {l4R}%</span>
                  </div>
                  <span className="text-2xl font-black text-[#8C3B32]">{l4Result.result?.fair_pb}x</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 5 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Current Market Share Price:</label>
                <input type="number" step="0.5" value={l5Px} onChange={e => setL5Px(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Earnings per Share (EPS):</label>
                <input type="number" step="0.1" value={l5Eps} onChange={e => setL5Eps(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Required Rate of Return (R %):</label>
                <input type="number" step="0.5" value={l5R} onChange={e => setL5R(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL5} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Infer implied growth via Reverse DCF
            </button>
            {l5Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l5Result.formula}</span></div>
                <div className="bg-white p-3 rounded border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Implied annual growth rate priced into the stock</span>
                    <span className="text-xs text-[#6B7280]">{l5Result.result?.interpretation}</span>
                  </div>
                  <span className="text-2xl font-black text-[#8C3B32]">{l5Result.result?.implied_growth_pct}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 6 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 6 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Current Purchase Price:</label>
                <input type="number" step="0.5" value={l6Px} onChange={e => setL6Px(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Target Fair Value:</label>
                <input type="number" step="0.5" value={l6Fv} onChange={e => setL6Fv(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Years to Realization:</label>
                <input type="number" step="1" value={l6Yrs} onChange={e => setL6Yrs(parseInt(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Target Return Hurdle %:</label>
                <input type="number" step="0.5" value={l6Hurdle} onChange={e => setL6Hurdle(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL6} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Solve the time value of money and IRR equation
            </button>
            {l6Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l6Result.formula}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Annualized IRR</span>
                    <span className="text-lg font-black text-[#8C3B32]">{l6Result.result?.annualized_irr_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Current margin of safety</span>
                    <span className="text-lg font-black text-[#16A34A]">+{l6Result.result?.margin_of_safety_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Clears target hurdle (15%)</span>
                    <span className={`text-sm font-bold ${l6Result.result?.exceeds_hurdle ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {l6Result.result?.exceeds_hurdle ? "Meets the standard ✓" : "Below the hurdle ⚑"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 7 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 7 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Initial Shares (millions of shares):</label>
                <input type="number" step="1" value={l7S0} onChange={e => setL7S0(parseFloat(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Shares After the Action (millions of shares):</label>
                <input type="number" step="1" value={l7S1} onChange={e => setL7S1(parseFloat(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Annual Net Income (SAR millions):</label>
                <input type="number" step="10" value={l7Ni} onChange={e => setL7Ni(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL7} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate the dilution and buyback effect
            </button>
            {l7Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l7Result.formula}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Action type</span>
                    <span className="text-xs font-bold text-[#8C3B32]">{l7Result.result?.action_type}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Change in share count</span>
                    <span className="text-base font-bold text-[#1A1A1A]">{l7Result.result?.shares_change_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">New EPS</span>
                    <span className="text-base font-bold text-[#16A34A]">{l7Result.result?.new_eps} SAR</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">EPS impact</span>
                    <span className="text-base font-bold text-[#16A34A]">{l7Result.result?.eps_impact_pct > 0 ? `+${l7Result.result?.eps_impact_pct}%` : `${l7Result.result?.eps_impact_pct}%`}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 8 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 8 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">DSRI (Days Sales in Receivables Index):</label>
                <input type="number" step="0.01" value={l8Dsri} onChange={e => setL8Dsri(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">GMI (Gross Margin Index):</label>
                <input type="number" step="0.01" value={l8Gmi} onChange={e => setL8Gmi(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">AQI (Asset Quality Index):</label>
                <input type="number" step="0.01" value={l8Aqi} onChange={e => setL8Aqi(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">SGI (Sales Growth Index):</label>
                <input type="number" step="0.01" value={l8Sgi} onChange={e => setL8Sgi(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">DEPI (Depreciation Index):</label>
                <input type="number" step="0.01" value={l8Depi} onChange={e => setL8Depi(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">SGAI (SG&amp;A Expense Index):</label>
                <input type="number" step="0.01" value={l8Sgai} onChange={e => setL8Sgai(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">TATA (Total Accruals to Total Assets):</label>
                <input type="number" step="0.01" value={l8Tata} onChange={e => setL8Tata(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">LVGI (Leverage Index):</label>
                <input type="number" step="0.01" value={l8Lvgi} onChange={e => setL8Lvgi(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL8} className={BTN_ACTION}>
              <Shield className="w-3.5 h-3.5" />
              Calculate Beneish M-Score
            </button>
            {l8Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Eight-variable formula: <span className="font-mono text-[#1A1A1A]">{l8Result.formula}</span></div>
                <div className="bg-white p-3 rounded border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">M-Score (risk threshold &gt; -1.78)</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{l8Result.result?.status}</span>
                  </div>
                  <span className={`text-2xl font-black tabular-nums ${l8Result.result?.is_manipulator_risk ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                    {l8Result.result?.m_score}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 9 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 9 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#6B7280]">Probability standard:</span>
              <button
                type="button"
                onClick={() => applyRnpvPreset("course_standard")}
                className={`px-2.5 py-1 text-xs rounded font-bold transition ${l9Preset === 'course_standard' ? 'bg-[#8C3B32] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
              >
                Course workbook standard (28% / 17% / 15% / 13.5%)
              </button>
              <button
                type="button"
                onClick={() => applyRnpvPreset("dimasi")}
                className={`px-2.5 py-1 text-xs rounded font-bold transition ${l9Preset === 'dimasi' ? 'bg-[#8C3B32] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
              >
                DiMasi clinical standard (59.5% / 35.5% / 62% / 90%)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Initial Investment (SAR millions):</label>
                <input type="number" value={l9Inv} onChange={e => setL9Inv(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Annual Cash Flow on Success:</label>
                <input type="number" value={l9Cf} onChange={e => setL9Cf(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Cash Flow Years (stages):</label>
                <input type="number" value={l9Yrs} onChange={e => setL9Yrs(parseInt(e.target.value) || 1)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Discount Rate R %:</label>
                <input type="number" value={l9R} onChange={e => setL9R(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Stage 1 Probability %:</label>
                <input type="number" value={l9P1} onChange={e => setL9P1(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Stage 2 Probability %:</label>
                <input type="number" value={l9P2} onChange={e => setL9P2(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Stage 3 Probability %:</label>
                <input type="number" value={l9P3} onChange={e => setL9P3(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Final Approval Probability %:</label>
                <input type="number" value={l9P4} onChange={e => setL9P4(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL9} className={BTN_ACTION}>
              <Layers className="w-3.5 h-3.5" />
              Calculate risk-adjusted rNPV
            </button>
            {l9Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280] flex justify-between items-center">
                  <span>Formula: <span className="font-mono text-[#1A1A1A]">{l9Result.formula}</span></span>
                  <span className="font-bold text-[#8C3B32]">{l9Result.source}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Plain NPV (naive, unadjusted)</span>
                    <span className="text-lg font-black text-[#16A34A]">+{l9Result.result?.plain_npv_m}M SAR</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Cumulative probability of success</span>
                    <span className="text-lg font-black text-[#1A1A1A]">{l9Result.result?.cumulative_success_probability_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">True risk-adjusted rNPV</span>
                    <span className={`text-lg font-black ${l9Result.result?.risk_adjusted_rnpv_m >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {l9Result.result?.risk_adjusted_rnpv_m}M SAR
                    </span>
                  </div>
                </div>
                {l9Result.result?.lesson_note && (
                  <div className="p-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#8C3B32] font-semibold">
                    {l9Result.result.lesson_note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 10 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 10 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Active Users (millions of users):</label>
                <input type="number" step="0.1" value={l10Users} onChange={e => setL10Users(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Target Valuation per User (SAR):</label>
                <input type="number" step="50" value={l10SarPerUser} onChange={e => setL10SarPerUser(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Current Market Cap (SAR millions):</label>
                <input type="number" step="50" value={l10Mc} onChange={e => setL10Mc(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL10} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Value the platform by user count
            </button>
            {l10Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l10Result.formula}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Computed platform fair value</span>
                    <span className="text-lg font-black text-[#8C3B32]">{l10Result.result?.implied_valuation_m}M SAR</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Currently implied price per user</span>
                    <span className="text-lg font-black text-[#1A1A1A]">{l10Result.result?.current_valuation_per_user_sar} SAR</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Valuation premium / discount</span>
                    <span className={`text-lg font-black ${l10Result.result?.premium_discount_pct <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {l10Result.result?.premium_discount_pct}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 11 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 11 && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-[#1A1A1A]">Fetch bank data from the financial statements:</span>
              <div className="flex items-center gap-1.5">
                {["1120.SR", "1180.SR", "1010.SR", "1050.SR"].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setL11Symbol(sym);
                      calcL11(sym);
                    }}
                    className={`px-2 py-0.5 text-xs rounded border transition ${l11Symbol === sym
                      ? "bg-[#8C3B32] text-white border-[#8C3B32]"
                      : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-gray-50"
                      }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="text"
                  placeholder="Another symbol (e.g. 1140.SR)"
                  value={l11Symbol}
                  onChange={(e) => setL11Symbol(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-xs w-36"
                />
                <button
                  type="button"
                  onClick={() => calcL11(l11Symbol)}
                  className="px-2.5 py-1 bg-gray-800 text-white rounded text-xs font-bold"
                >
                  Load
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Net Interest Income, NII (millions):</label>
                <input type="number" value={l11Nii} onChange={e => setL11Nii(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Earning Assets (millions):</label>
                <input type="number" value={l11Ea} onChange={e => setL11Ea(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Credit Provisions (millions):</label>
                <input type="number" value={l11Prov} onChange={e => setL11Prov(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Total Financing/Loans (millions):</label>
                <input type="number" value={l11Loans} onChange={e => setL11Loans(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Total Deposits (millions):</label>
                <input type="number" value={l11Dep} onChange={e => setL11Dep(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Low-Cost CASA Deposits (millions):</label>
                <input type="number" value={l11Casa} onChange={e => setL11Casa(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Total Operating Income (millions):</label>
                <input type="number" value={l11Rev} onChange={e => setL11Rev(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={() => calcL11()} className={BTN_ACTION}>
              <Landmark className="w-3.5 h-3.5" />
              Calculate bank metrics and run the 12-flag analysis
            </button>
            {l11Result && (
              <div className={`${SUBCARD} p-4 space-y-4`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#1A1A1A]">
                    {l11Result.result?.company_name} ({l11Result.result?.symbol || 'Manual model'})
                  </span>
                  <span className={`font-bold ${l11Result.result?.red_flags_count > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                    {l11Result.result?.status_label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Net Interest Margin (NIM)</span>
                    <span className="text-base font-bold text-[#8C3B32]">{l11Result.result?.nim_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">CASA deposit ratio</span>
                    <span className="text-base font-bold text-[#16A34A]">{l11Result.result?.casa_ratio_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Loan-to-Deposit Ratio, LDR (cap 95%)</span>
                    <span className={`text-base font-bold ${l11Result.result?.ldr_pct <= 95 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{l11Result.result?.ldr_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Provisions to operating income</span>
                    <span className="text-base font-bold text-[#1A1A1A]">{l11Result.result?.provisions_to_revenue_pct}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Cost of Risk</span>
                    <span className="text-base font-bold text-[#1A1A1A]">{l11Result.result?.cost_of_risk_pct}%</span>
                  </div>
                </div>

                {/* 12 Bank Red Flags Suite */}
                {l11Result.result?.flags_12 && l11Result.result.flags_12.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#E5E7EB]">
                    <span className="text-xs font-bold text-[#1A1A1A] block">
                      12 banking red-flag screen per the Al-Asiri methodology:
                    </span>
                    <div className="space-y-1.5">
                      {l11Result.result.flags_12.map((flg: string, fIdx: number) => (
                        <div
                          key={fIdx}
                          className={`p-2 rounded text-xs border ${flg.startsWith("⚑")
                            ? "bg-red-50 text-red-700 border-red-200 font-medium"
                            : "bg-green-50 text-green-700 border-green-200"
                            }`}
                        >
                          {flg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 12 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 12 && (
          <div className="space-y-4">
            <button onClick={calcL12} className={BTN_ACTION}>
              <Activity className="w-3.5 h-3.5" />
              Refresh the economy scorecard (Market Machine Live)
            </button>

            {l12Result && (
              <div className={`${SUBCARD} p-4 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                  <div>
                    <span className="text-xs text-[#6B7280] block">Global Market Machine regime:</span>
                    <span className="text-sm font-bold text-[#16A34A]">{l12Result.result?.market_machine_regime}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#6B7280] block">Positive gauges achieved:</span>
                    <span className="text-sm font-bold text-[#8C3B32]">
                      {l12Result.result?.positive_gauges_count} / {l12Result.result?.total_gauges_count} gauges
                    </span>
                  </div>
                </div>

                {/* 5 Market Machine Gauges */}
                {l12Result.result?.market_machine_gauges && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#1A1A1A] block">
                      The five governing pillars of the US and global economy (Course Standards):
                    </span>
                    <div className="overflow-x-auto border border-[#E5E7EB] rounded bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#6B7280]">
                          <tr>
                            <th className="p-2">Indicator</th>
                            <th className="p-2 text-center">Current Reading</th>
                            <th className="p-2 text-center">Lesson Threshold</th>
                            <th className="p-2 text-center">Verdict</th>
                            <th className="p-2">Economic Significance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {l12Result.result.market_machine_gauges.map((g: any, gIdx: number) => (
                            <tr key={gIdx} className="hover:bg-[#F9FAFB]">
                              <td className="p-2 font-medium text-[#1A1A1A]">{g.name}</td>
                              <td className="p-2 text-center font-bold font-mono">
                                {g.value !== null ? `${g.value} ${g.unit}` : '—'}
                              </td>
                              <td className="p-2 text-center font-mono text-[#6B7280]">{g.threshold}</td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.verdict === 'Positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {g.verdict === 'Positive' ? 'Positive' : 'Negative'}
                                </span>
                              </td>
                              <td className="p-2 text-[#6B7280] text-[11px]">{g.rule_note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Local Saudi Panel */}
                {l12Result.result?.saudi_macro && (
                  <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                    <span className="text-xs font-bold text-[#1A1A1A] block">
                      Saudi Macroeconomic Dashboard (SAMA &amp; GaStat Panel):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block">SAMA Repo Rate</span>
                        <span className="text-base font-bold text-[#1A1A1A]">{l12Result.result.saudi_macro.repo_rate_pct}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block">SAIBOR 3M</span>
                        <span className="text-base font-bold text-[#1A1A1A]">{l12Result.result.saudi_macro.saibor_3m_pct}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block">GDP Growth</span>
                        <span className="text-base font-bold text-[#16A34A]">+{l12Result.result.saudi_macro.gdp_growth_pct}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block">Annual Inflation (CPI)</span>
                        <span className="text-base font-bold text-[#1A1A1A]">{l12Result.result.saudi_macro.inflation_pct}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                        <span className="text-[10px] text-[#6B7280] block">Saudi Unemployment</span>
                        <span className="text-base font-bold text-[#8C3B32]">{l12Result.result.saudi_macro.unemployment_pct}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 13 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 13 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {fisherChecks.map((val, idx) => (
                <label key={idx} className="flex items-center gap-2 p-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] text-xs cursor-pointer hover:bg-[#F3F4F6]">
                  <input type="checkbox" checked={val} onChange={() => toggleFisher(idx)} className="accent-[#8C3B32]" />
                  <span>Fisher criterion #{idx + 1} {idx === 14 ? "(mandatory integrity condition)" : ""}</span>
                </label>
              ))}
            </div>
            <button onClick={calcL13} className={BTN_ACTION}>
              <UserCheck className="w-3.5 h-3.5" />
              Calculate the Fisher score
            </button>
            {l13Result && (
              <div className={`${SUBCARD} p-4 flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] text-[#6B7280] block">Fisher 15 score</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">{l13Result.result?.verdict}</span>
                </div>
                <span className="text-2xl font-black text-[#8C3B32]">{l13Result.result?.score} / 15 ({l13Result.result?.score_pct}%)</span>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 14 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 14 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Earnings or Revenue Growth %:</label>
                <input type="number" step="0.5" value={l14Growth} onChange={e => setL14Growth(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">P/E Ratio:</label>
                <input type="number" step="0.5" value={l14Pe} onChange={e => setL14Pe(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Dividend Yield %:</label>
                <input type="number" step="0.5" value={l14Div} onChange={e => setL14Div(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={l14Cyc} onChange={e => setL14Cyc(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Cyclical stock (Cyclical)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={l14Turn} onChange={e => setL14Turn(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Turnaround opportunity (Turnaround)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={l14Asset} onChange={e => setL14Asset(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Hidden assets (Asset Play)</span>
              </label>
            </div>
            <button onClick={calcL14} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Classify per Peter Lynch and compute PEG
            </button>
            {l14Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Lynch category</span>
                    <span className="text-sm font-bold text-[#8C3B32]">{l14Result.result?.category}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">PEG ratio</span>
                    <span className="text-lg font-black text-[#1A1A1A]">{l14Result.result?.peg_ratio}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Dividend-adjusted PEGY ratio</span>
                    <span className="text-lg font-black text-[#16A34A]">{l14Result.result?.pegy_ratio}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 15 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 15 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Board Independence Ratio %:</label>
                <input type="number" value={l15Indep} onChange={e => setL15Indep(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Related-Party Transactions (SAR millions):</label>
                <input type="number" value={l15RelParty} onChange={e => setL15RelParty(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-[#F7F8FA] rounded cursor-pointer">
                <input type="checkbox" checked={l15Clean} onChange={e => setL15Clean(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Auditor&apos;s report is clean with no qualifications</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#F7F8FA] rounded cursor-pointer">
                <input type="checkbox" checked={l15Sep} onChange={e => setL15Sep(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Board Chair and CEO roles are separated</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#F7F8FA] rounded cursor-pointer">
                <input type="checkbox" checked={l15RecGrow} onChange={e => setL15RecGrow(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Receivables growing faster than sales (risk)</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#F7F8FA] rounded cursor-pointer">
                <input type="checkbox" checked={l15FcfDiv} onChange={e => setL15FcfDiv(e.target.checked)} className="accent-[#8C3B32]" />
                <span>Free cash flow covers cash dividends</span>
              </label>
            </div>
            <button onClick={calcL15} className={BTN_ACTION}>
              <Shield className="w-3.5 h-3.5" />
              Screen governance and red flags
            </button>
            {l15Result && (
              <div className={`${SUBCARD} p-4 flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] text-[#6B7280] block">Governance rating</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">{l15Result.result?.status}</span>
                </div>
                <span className="text-2xl font-black text-[#8C3B32]">{l15Result.result?.score} / 100</span>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 16 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 16 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { label: "Fear of Missing Out (FOMO)", val: l16Fomo, set: setL16Fomo },
                { label: "Loss Aversion", val: l16LossAv, set: setL16LossAv },
                { label: "Mental Anchoring (Anchoring)", val: l16Anchor, set: setL16Anchor },
                { label: "Confirmation Bias (Confirmation)", val: l16Confirm, set: setL16Confirm },
                { label: "Disposition Effect & Haste (Disposition)", val: l16Disp, set: setL16Disp },
              ].map((item, i) => (
                <div key={i} className="p-2.5 bg-[#F7F8FA] rounded border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] block mb-1">{item.label}</span>
                  <input type="range" min="1" max="5" value={item.val} onChange={e => item.set(parseInt(e.target.value))} className="w-full accent-[#8C3B32]" />
                  <span className="text-xs font-bold text-[#1A1A1A] text-center block">{item.val} / 5</span>
                </div>
              ))}
            </div>
            <button onClick={calcL16} className={BTN_ACTION}>
              <Brain className="w-3.5 h-3.5" />
              Analyze investor psychology
            </button>
            {l16Result && (
              <div className={`${SUBCARD} p-4 flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] text-[#6B7280] block">Psychological risk level</span>
                  <span className="text-xs font-bold text-[#1A1A1A]">{l16Result.result?.risk_level}</span>
                </div>
                <span className="text-2xl font-black text-[#8C3B32]">{l16Result.result?.bias_index} / 100</span>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 17 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 17 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Target Net Profit Margin (NPM %):</label>
                <input type="number" step="0.5" value={l17Npm} onChange={e => setL17Npm(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Required Rate of Return (R %):</label>
                <input type="number" step="0.5" value={l17R} onChange={e => setL17R(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Expected Sales Growth %:</label>
                <input type="number" step="1" value={l17Growth} onChange={e => setL17Growth(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Sales per Share (SAR):</label>
                <input type="number" step="1" value={l17Sps} onChange={e => setL17Sps(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL17} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate P/S multiple and fair value
            </button>
            {l17Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l17Result.formula}</span></div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Fair Price-to-Sales Ratio (Fair P/S)</span>
                    <span className="text-xl font-black text-[#8C3B32]">{l17Result.result?.fair_ps}x</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] block">Fair value per share</span>
                    <span className="text-xl font-black text-[#16A34A]">{l17Result.result?.fair_value} SAR</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Lab 18 View */}
        {/* -------------------------------------------------------- */}
        {activeLabId === 18 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Operating Profit (EBIT) (SAR millions):</label>
                <input type="number" step="10" value={l18Ebit} onChange={e => setL18Ebit(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Total Assets (SAR millions):</label>
                <input type="number" step="50" value={l18Ta} onChange={e => setL18Ta(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Current Liabilities (SAR millions):</label>
                <input type="number" step="10" value={l18Cl} onChange={e => setL18Cl(parseFloat(e.target.value) || 0)} className={`${INPUT} w-full`} />
              </div>
            </div>
            <button onClick={calcL18} className={BTN_ACTION}>
              <Calculator className="w-3.5 h-3.5" />
              Calculate Terry Smith ROCE
            </button>
            {l18Result && (
              <div className={`${SUBCARD} p-4 space-y-3`}>
                <div className="text-xs text-[#6B7280]">Formula: <span className="font-mono text-[#1A1A1A]">{l18Result.formula}</span></div>
                <div className="bg-white p-3 rounded border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block">Return on Capital Employed, ROCE (Terry Smith 32% benchmark)</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{l18Result.result?.interpretation}</span>
                  </div>
                  <span className={`text-2xl font-black ${l18Result.result?.roce_pct >= 32 ? 'text-[#16A34A]' : 'text-[#8C3B32]'}`}>
                    {l18Result.result?.roce_pct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}