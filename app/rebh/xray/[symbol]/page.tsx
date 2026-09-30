"use client";

import React, { useEffect, useState, useMemo, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { XRayStory, AlignedMetrics } from "./components/types";
import { XRayHeader } from "./components/XRayHeader";
import { StoryNarrativeSection } from "./components/StoryCards";
import { MoneyRiverSection } from "./components/MoneyRiver";
import { BalanceSheetBreathingSection } from "./components/BalanceSheetBreathing";
import { CashConversionCycleSection } from "./components/CashConversionCycle";
import { TrendAndRiskSection } from "./components/TrendAndRisk";

// ─── Story Engine ─────────────────────────────────────────────────────────────
// Generates narrative sentences from pre-aligned, verified numbers.
function buildStory(metrics: AlignedMetrics): XRayStory {
  const {
    rev, net, gp, cfo, fcf, capex, cff, borrowings: borr,
    deRatio, cfoNi,
    fScore: piotroski, beneish, nm, gm, nmPrev
  } = metrics;

  // ── Cash & FCF story ──────────────────────────────────────────────────────
  let cashText: string, cashSignal: "green" | "amber" | "red";
  if (fcf > 0 && cfoNi != null && cfoNi >= 80) {
    cashText = `A strong cash generator — positive FCF (${fcf.toFixed(0)} M SAR) with ${cfoNi.toFixed(0)}% of net income converting into operating cash flow.`;
    cashSignal = "green";
  } else if (fcf > 0) {
    cashText = `Free cash flow is positive (${fcf.toFixed(0)} M SAR), but a CFO/NI ratio of ${cfoNi != null ? cfoNi.toFixed(0) + "%" : "—"} warrants monitoring.`;
    cashSignal = "amber";
  } else if (cfo > 0 && fcf <= 0) {
    cashText = `Operating cash flow is positive (${cfo.toFixed(0)} M), but capital expenditure (${capex.toFixed(0)} M) is draining free cash flow — an expansion phase or structural pressure.`;
    cashSignal = "amber";
  } else {
    cashText = `Negative cash flow — CFO (${cfo.toFixed(0)} M) and FCF (${fcf.toFixed(0)} M). The company is consuming cash rather than generating it.`;
    cashSignal = "red";
  }

  // ── Margin story ──────────────────────────────────────────────────────────
  let marginText: string, marginSignal: "green" | "amber" | "red";
  if (nm != null && nm >= 15) {
    marginText = `Strong net margin of ${nm.toFixed(1)}% (gross: ${gm?.toFixed(1) ?? "—"}%). ${nmPrev != null
      ? nmPrev >= 0
        ? `Up ${nmPrev.toFixed(1)}% versus last year.`
        : `Down ${Math.abs(nmPrev).toFixed(1)}% — a compression signal worth monitoring.`
      : ""
      }`;
    marginSignal = "green";
  } else if (nm != null && nm >= 5) {
    marginText = `Moderate net margin of ${nm.toFixed(1)}%. ${nmPrev != null && nmPrev < 0
      ? `Margin is trending down (${nmPrev.toFixed(1)}% YoY) — review cost of sales and pricing pressure.`
      : "Margin is stable within an acceptable range."
      }`;
    marginSignal = "amber";
  } else if (nm != null) {
    marginText = `Weak net margin of ${nm.toFixed(1)}%. This may reflect pricing pressure or rising costs. Gross margin is ${gm?.toFixed(1) ?? "—"
      }% — the gap between gross and net margin reveals the weight of operating expenses.`;
    marginSignal = "red";
  } else {
    marginText = "Insufficient data to compute profit margins.";
    marginSignal = "amber";
  }

  // ── Leverage story (Using unified totalDebt/eq) ───────────────────────────
  let leverageText: string, leverageSignal: "green" | "amber" | "red";
  if (deRatio != null && deRatio <= 0.5) {
    leverageText = `Conservative balance sheet — debt-to-equity of ${deRatio.toFixed(2)}×. Strong solvency with ample financing flexibility.`;
    leverageSignal = "green";
  } else if (deRatio != null && deRatio <= 1.5) {
    leverageText = `Moderate financial leverage — D/E of ${deRatio.toFixed(2)}×. Acceptable in capital-intensive sectors, but interest costs need monitoring.`;
    leverageSignal = "amber";
  } else if (deRatio != null) {
    leverageText = `High financial leverage — D/E of ${deRatio.toFixed(2)}×. Solvency risk is present, especially in a rising-rate environment. Review the debt maturity schedule.`;
    leverageSignal = "red";
  } else {
    leverageText = "Debt and shareholders' equity data are unavailable, so leverage cannot be computed.";
    leverageSignal = "amber";
  }

  // ── Quality story ─────────────────────────────────────────────────────────
  let qualityText: string, qualitySignal: "green" | "amber" | "red";
  if (piotroski != null && piotroski >= 7) {
    qualityText = `High financial quality — Piotroski F-Score ${piotroski}/9. ${beneish != null
      ? `Beneish M-Score ${beneish.toFixed(2)} — ${beneish < -1.78
        ? "no evidence of accounting manipulation (< −1.78)."
        : "above the −1.78 risk threshold — review the components of earnings carefully."
      }`
      : ""
      }`;
    qualitySignal = "green";
  } else if (piotroski != null && piotroski >= 4) {
    qualityText = `Moderate financial quality — Piotroski F-Score ${piotroski}/9. ${beneish != null ? `Beneish M-Score ${beneish.toFixed(2)}.` : ""
      } Improving profitability and efficiency would strengthen the score.`;
    qualitySignal = "amber";
  } else if (piotroski != null) {
    qualityText = `Signs of financial weakness — Piotroski F-Score ${piotroski}/9. This may reflect declining profitability or deteriorating liquidity, and warrants review.`;
    qualitySignal = "red";
  } else {
    qualityText =
      cfoNi != null
        ? `CFO/NI = ${cfoNi.toFixed(0)}% — ${cfoNi >= 100
          ? "accounting earnings are converting into real cash (high quality)."
          : "a gap between earnings and cash — review receivables and inventory."
        }`
        : "Piotroski data is unavailable.";
    qualitySignal = cfoNi != null && cfoNi >= 80 ? "green" : "amber";
  }

  // ── Funding story ─────────────────────────────────────────────────────────
  let fundingText: string, fundingSignal: "green" | "amber" | "red";
  if (cff < 0 && fcf > 0) {
    fundingText = `The company is returning cash to shareholders (negative CFF of ${cff.toFixed(0)} M) — a positive: it is repaying debt or paying dividends out of genuine free cash flow.`;
    fundingSignal = "green";
  } else if (borr > 0 && fcf > 0) {
    fundingText = `New external financing (${borr.toFixed(0)} M) alongside positive free cash flow — borrowing to expand, not to survive.`;
    fundingSignal = "amber";
  } else if (borr > 0 && fcf <= 0) {
    fundingText = `The company relies on borrowing (${borr.toFixed(0)} M) to fund operations or a cash-flow gap — free cash flow is negative (${fcf.toFixed(0)} M). A warning signal.`;
    fundingSignal = "red";
  } else {
    fundingText = `Funding data: CFF ${cff.toFixed(0)} M. The company is in a ${cff > 0 ? "capital-raising" : "repayment or distribution"
      } phase.`;
    fundingSignal = cff < 0 ? "green" : "amber";
  }

  // ── Headline ──────────────────────────────────────────────────────────────
  const signals = [cashSignal, marginSignal, leverageSignal, qualitySignal, fundingSignal];
  const greens = signals.filter((s) => s === "green").length;
  const reds = signals.filter((s) => s === "red").length;

  let headline: string, subtitle: string;
  if (greens >= 4) {
    headline = "Strong cash generation and excellent financial quality";
    subtitle = "Earnings are real · Cash flow supports them · Balance sheet is sound · Growth is sustainable";
  } else if (greens >= 3 && reds === 0) {
    headline = "Solid financial performance with points to monitor";
    subtitle = "A firm financial base with specific, trackable pressures";
  } else if (reds >= 3) {
    headline = "Multiple financial pressures — caution and scrutiny required";
    subtitle = "Several indicators are in the red zone — review liquidity, quality, and leverage";
  } else {
    headline = "Mixed financial picture — strength in one area, pressure in another";
    subtitle = "Some strengths are offset by specific risks — a deeper read is required";
  }

  return {
    cash: {
      text: cashText,
      signal: cashSignal,
      formula: "FCF = CFO − |CapEx| · CFO/NI = Operating Cash Flow ÷ Net Income",
    },
    margin: {
      text: marginText,
      signal: marginSignal,
      formula: "NM% = Net Income ÷ Revenue · GM% = Gross Profit ÷ Revenue",
    },
    leverage: {
      text: leverageText,
      signal: leverageSignal,
      formula: "D/E = Total Debt ÷ Shareholders' Equity",
    },
    quality: {
      text: qualityText,
      signal: qualitySignal,
      // NOTE: Beneish M-Score above −1.78 is the manipulation-risk zone (below −1.78 = unlikely manipulator),
      // consistent with the narrative text above.
      formula: "Piotroski 9-point checklist · Beneish M-Score > −1.78 = manipulation risk (platform-standard threshold)",
    },
    funding: {
      text: fundingText,
      signal: fundingSignal,
      formula: "CFF = Net Financing Cash Flow · Borrowings = Net New Borrowing",
    },
    headline,
    subtitle,
  };
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function RebhStoryXRayPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = ((params?.symbol as string) || "2222").toUpperCase();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(-1);
  const [isChangingPeriod, startPeriodTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [stmtRes, engRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/rebh/statements/${symbol}`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/rebh/company/${symbol}`, { signal: controller.signal }),
        ]);

        let merged: any = {};
        let hasStatements = false;
        let hasEngineData = false;

        if (stmtRes.status === "fulfilled" && stmtRes.value.ok) {
          const stmtData = await stmtRes.value.json();
          if (stmtData && (stmtData.income_statement || stmtData.bs || stmtData.cf)) {
            merged = { ...merged, ...stmtData };
            hasStatements = true;
          }
        }
        if (engRes.status === "fulfilled" && engRes.value.ok) {
          const eng = await engRes.value.json();
          if (eng && typeof eng === "object") {
            hasEngineData = true;
            merged.f_score = eng.f_score;
            merged.beneish = eng.beneish;
            merged.altman = eng.altman;
            merged.piotroski = eng.f_score;
            merged.red_flags = eng.red_flags;
            merged.buy_gate = eng.buy_gate;
            merged.TTM = eng.TTM;
            merged.safety = eng.safety;
            merged.grades = eng.grades;
            merged.bcg_stage = eng.bcg_stage;
            merged.quarantine_reason = eng.quarantine_reason;
            merged.wl = eng.wl;
            merged.fv = eng.fv;
            merged.khurafshi = eng.khurafshi;
            merged.px = merged.px || eng.px;
            merged.mc = merged.mc || eng.mc;
            merged.pe = eng.pe;
            merged.pb = eng.pb;
            if (!merged.name && eng.name) merged.name = eng.name;
            if (!merged.en && eng.en) merged.en = eng.en;
            if (!merged.sec && eng.sec) merged.sec = eng.sec;
            // English sector name, if the backend provides one (used for display only)
            if (!merged.sec_en && eng.sec_en) merged.sec_en = eng.sec_en;
          }
        }

        if (!hasStatements && !hasEngineData) {
          throw new Error("Unable to fetch the company's financial data from the server");
        }

        if (!cancelled) setData(merged);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "An unexpected error occurred while loading data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol, retryCount]);

  const handleNav = (e: React.FormEvent) => {
    e.preventDefault();
    const s = search.trim().replace(/\D/g, "").slice(0, 4);
    if (s.length === 4) router.push(`/rebh/xray/${s}`);
  };

  const handleSelectPeriod = (index: number) => {
    startPeriodTransition(() => {
      setSelectedPeriodIndex(index);
    });
  };

  // Derived data
  const periods: string[] = data?.income_statement?.periods || [];
  const activePeriodIndex =
    selectedPeriodIndex >= 0 && selectedPeriodIndex < periods.length
      ? selectedPeriodIndex
      : Math.max(periods.length - 1, 0);

  const valueAt = (values: any[] = []) => values[activePeriodIndex] ?? values.at(-1) ?? 0;

  const is = data?.income_statement || {};
  const cf = data?.cf || {};
  const bs = data?.bs || {};

  // Flow river values (selected/latest period)
  const rev = valueAt(is.rev);
  const cogs = valueAt(is.cogs);
  const gp = valueAt(is.gp);
  const op = valueAt(is.op);
  const net = valueAt(is.net);
  const cfo = valueAt(cf.cfo);
  const capex = Math.abs(valueAt(cf.capex));
  const fcf = valueAt(cf.fcf);
  const cff = valueAt(cf.cff);
  const borrowings = valueAt(cf.borrowings);

  // Period label
  const activePeriod = periods[activePeriodIndex] ?? "";

  // Helper to resolve BS value: try matching period date with bs.periods, fallback to activePeriodIndex
  const bsPeriods: string[] = bs.periods || [];
  const bsIndex =
    bsPeriods.indexOf(activePeriod) >= 0
      ? bsPeriods.indexOf(activePeriod)
      : activePeriodIndex < bsPeriods.length
        ? activePeriodIndex
        : bsPeriods.length - 1;

  const valueAtBs = (values: any[] = []) => {
    if (!values || !values.length) return 0;
    if (bsIndex >= 0 && bsIndex < values.length && values[bsIndex] != null) return values[bsIndex];
    return values.at(-1) ?? 0;
  };

  const ta = valueAtBs(bs.total_assets);
  const ca = valueAtBs(bs.current_assets);
  const cl = valueAtBs(bs.current_liabilities);
  const eq = valueAtBs(bs.total_equity);
  const sd = valueAtBs(bs.short_debt);
  const ld = valueAtBs(bs.long_debt);
  const tl = valueAtBs(bs.total_liabilities);
  const re = valueAtBs(bs.retained_earnings);
  const cash = valueAtBs(bs.cash);

  // Unified Total debt
  const totalDebt = sd + ld > 0 ? sd + ld : valueAtBs(bs.total_debt);

  // Profitability and leverage metrics
  const nm = rev > 0 ? (net / rev) * 100 : null;
  const gm = rev > 0 ? (gp / rev) * 100 : null;
  const opm = rev > 0 ? (op / rev) * 100 : null;
  const curRatio = cl > 0 ? ca / cl : null;
  const deRatio = eq > 0 ? totalDebt / eq : eq !== 0 ? 0 : null;
  const cfoNi = net !== 0 ? (cfo / net) * 100 : null;
  const debtCover = cfo > 0 && totalDebt > 0 ? totalDebt / cfo : null;
  const fcfYield = ta > 0 ? (fcf / ta) * 100 : null;

  // YoY Net Margin Change
  const nmPrev =
    (is.net || []).length >= 2
      ? (((is.net || [])[activePeriodIndex] ?? (is.net || []).at(-1) ?? 0) -
        ((is.net || [])[Math.max(0, activePeriodIndex - 1)] ?? 0)) /
      Math.abs((is.net || [])[Math.max(0, activePeriodIndex - 1)] || 1) *
      100
      : null;

  // Build story with exactly aligned, unified metrics
  const story = useMemo(() => {
    if (!data) return null;
    return buildStory({
      rev,
      net,
      gp,
      cfo,
      fcf,
      capex,
      cff,
      borrowings,
      ca,
      cl,
      eq,
      ta,
      totalDebt,
      nm,
      gm,
      curRatio,
      deRatio,
      cfoNi,
      fcfYield,
      fScore: data?.f_score ?? null,
      beneish: data?.beneish ?? null,
      nmPrev,
    });
  }, [
    data,
    rev,
    net,
    gp,
    cfo,
    fcf,
    capex,
    cff,
    borrowings,
    ca,
    cl,
    eq,
    ta,
    totalDebt,
    nm,
    gm,
    curRatio,
    deRatio,
    cfoNi,
    fcfYield,
    nmPrev,
  ]);

  // Working Capital & cycle metrics
  const workingCapital = ca - cl;
  const wcTrend = useMemo(() => {
    return (bs.current_assets || [])
      .map((cav: number, i: number) => {
        const clv: number = (bs.current_liabilities || [])[i] ?? 0;
        return cav - clv;
      })
      .slice(-5);
  }, [bs.current_assets, bs.current_liabilities]);

  const receivables: number = valueAtBs(bs.receivables);
  const dso: number | null =
    rev > 0 && receivables > 0 ? Math.round((receivables / rev) * 365) : null;

  const inventory: number = valueAtBs(bs.inventory);
  const cogsAbs = Math.abs(cogs);
  const dIO: number | null =
    cogsAbs > 0 && inventory > 0 ? Math.round((inventory / cogsAbs) * 365) : null;

  const payables: number = valueAtBs(bs.payables) || valueAtBs(bs.accounts_payable);
  const dPO: number | null =
    cogsAbs > 0 && payables > 0 ? Math.round((payables / cogsAbs) * 365) : null;

  // Trend series for mini sparklines (last 5 years)
  const revTrend = (is.rev || []).slice(-5);
  const netTrend = (is.net || []).slice(-5);
  const cfoTrend = (cf.cfo || []).slice(-5);
  const fcfTrend = (cf.fcf || []).slice(-5);
  const eqTrend = (bs.total_equity || []).slice(-5);

  // Dynamic Chart 1: Money River Waterfall
  const waterfallData = useMemo(() => {
    return [
      { name: "Revenue", val: rev, fill: "#2563EB", type: "inflow", desc: "Total sales recognized" },
      { name: "COGS", val: -cogs, fill: "#64748B", type: "outflow", desc: "Direct production and merchandise costs (Cost of Goods Sold)" },
      { name: "Gross Profit", val: gp, fill: "#16A34A", type: "subtotal", desc: "Profit remaining after direct costs" },
      { name: "OpEx", val: -(gp - op), fill: "#F59E0B", type: "outflow", desc: "Selling, marketing, and administrative expenses" },
      { name: "EBIT", val: op, fill: "#8C3B32", type: "subtotal", desc: "Operating Profit (EBIT) — profit from core operations" },
      { name: "Interest & Tax", val: -(op - net), fill: "#EF4444", type: "outflow", desc: "Financing costs plus Zakat and tax provisions" },
      { name: "Net Income", val: net, fill: net >= 0 ? "#10B981" : "#DC2626", type: "bottomline", desc: "Final net income attributable to shareholders" },
      { name: "CFO", val: cfo, fill: "#059669", type: "cash", desc: "Actual cash generated by operations (Operating Cash Flow, CFO)" },
      { name: "CapEx", val: -capex, fill: "#D97706", type: "capex", desc: "Investment in assets and plants (Capital Expenditure, CapEx)" },
      { name: "FCF", val: fcf, fill: fcf >= 0 ? "#0D9488" : "#B91C1C", type: "fcf", desc: "Real cash available for growth and distributions (Free Cash Flow, FCF)" },
    ];
  }, [rev, cogs, gp, op, net, cfo, capex, fcf]);

  // Dynamic Chart 2: Multi-Period Balance Sheet Evolution Data
  // IMPORTANT: Use bsPeriods (bs.periods) not IS periods to keep indexing aligned with BS arrays
  const balanceEvolutionData = useMemo(() => {
    const bsPeriodsArr: string[] = bs.periods || periods; // fallback to IS periods if bs.periods missing
    if (!bsPeriodsArr.length) return [];
    const count = Math.min(bsPeriodsArr.length, 5);
    const startIdx = Math.max(0, bsPeriodsArr.length - count);

    return bsPeriodsArr.slice(startIdx).map((p, i) => {
      const idx = startIdx + i;
      const pTa = (bs.total_assets || [])[idx] ?? 0;
      const pCash = (bs.cash || [])[idx] ?? 0;
      const pCa = (bs.current_assets || [])[idx] ?? 0;
      const pEq = (bs.total_equity || [])[idx] ?? 0;
      const pTl = (bs.total_liabilities || [])[idx] ?? 0;
      const pDebt = ((bs.short_debt || [])[idx] ?? 0) + ((bs.long_debt || [])[idx] ?? 0);

      return {
        period: p,
        cash: pCash,
        otherCurrent: Math.max(0, pCa - pCash),
        nonCurrent: Math.max(0, pTa - pCa),
        totalAssets: pTa,
        equity: pEq,
        debt: pDebt,
        otherLiabilities: Math.max(0, pTl - pDebt),
        totalLiabAndEq: pTl + pEq,
      };
    });
  }, [bs, periods]);

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-11 h-11 border-[3px] border-[#8C3B32] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ─── Error State (With functional retry triggering useEffect) ───────────────
  if (error || !data) {
    return (
      <div dir="ltr" className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8">
        <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
          <h2 className="text-base font-bold text-[#0F172A]">
            Unable to load X-Ray — {symbol}
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed">{error}</p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[6px] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C3B32]/30 transition-all"
            >
              Retry
            </button>
            <Link
              href="/rebh/xray"
              className="px-4 py-2 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[6px] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C3B32] focus:ring-offset-2 transition-all"
            >
              Try another ticker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prefer English names when the backend provides them (data.en || data.name, data.sec_en || data.sec).
  // The Arabic name is intentionally not shown as a secondary label, so the UI stays English-only.
  const name = data.en || data.name || symbol;
  const nameEn = "";
  const sector = data.sec_en || data.sec || "—";
  const flags = data.red_flags || [];

  return (
    <div dir="ltr" id="xray-report-content" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28">
      {/* ── HEADER, SNAPSHOT & ACCESSIBLE HEADLINE ─────────────────────── */}
      <XRayHeader
        symbol={symbol}
        name={name}
        nameEn={nameEn}
        sector={sector}
        activePeriod={activePeriod}
        periods={periods}
        activePeriodIndex={activePeriodIndex}
        onSelectPeriod={handleSelectPeriod}
        search={search}
        setSearch={setSearch}
        onSearch={handleNav}
        showFormulas={showFormulas}
        setShowFormulas={setShowFormulas}
        px={data.px}
        pe={data.pe}
        pb={data.pb}
        fScore={data.f_score}
        story={story}
        isChangingPeriod={isChangingPeriod}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* ── STORY NARRATIVE CARDS ─────────────────────────────────────── */}
        {story && (
          <StoryNarrativeSection story={story} showFormulas={showFormulas} />
        )}

        {/* ── MONEY RIVER SECTION ───────────────────────────────────────── */}
        <MoneyRiverSection
          activePeriod={activePeriod}
          waterfallData={waterfallData}
          rev={rev}
          cogs={cogs}
          gp={gp}
          op={op}
          net={net}
          cfo={cfo}
          capex={capex}
          fcf={fcf}
          showFormulas={showFormulas}
        />

        {/* ── BALANCE SHEET BREATHING SECTION ───────────────────────────── */}
        <BalanceSheetBreathingSection
          activePeriod={activePeriod}
          activePeriodIndex={bsIndex}
          ta={ta}
          ca={ca}
          tl={tl}
          eq={eq}
          cash={cash}
          re={re}
          curRatio={curRatio}
          deRatio={deRatio}
          balanceEvolutionData={balanceEvolutionData}
          showFormulas={showFormulas}
        />

        {/* ── CASH CONVERSION CYCLE SECTION ─────────────────────────────── */}
        <CashConversionCycleSection
          dso={dso}
          dIO={dIO}
          dPO={dPO}
          cfoNi={cfoNi}
          ta={ta}
          fcf={fcf}
          debtCover={debtCover}
          opm={opm}
          workingCapital={workingCapital}
          showFormulas={showFormulas}
        />

        {/* ── TREND SPARKLINES & RED FLAGS ─────────────────────────────── */}
        <TrendAndRiskSection
          revTrend={revTrend}
          netTrend={netTrend}
          cfoTrend={cfoTrend}
          fcfTrend={fcfTrend}
          eqTrend={eqTrend}
          wcTrend={wcTrend}
          flags={flags}
        />
      </main>
    </div>
  );
}