"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sliders, BarChart3, Layers, Calendar,
  ArrowUpRight, Cpu,
  PieChart, Bell, BookOpen,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import type { CompanyItem } from "./types";

// Modular Sub-Components
import MarketMonitorTab from "./components/MarketMonitorTab";
import TradeJournalTab from "./components/TradeJournalTab";
import CourseLabsTab from "./components/CourseLabsTab";
import FvLabTab from "./components/FvLabTab";
import PortfolioXrayTab from "./components/PortfolioXrayTab";
import AlertBuilderTab from "./components/AlertBuilderTab";
import EarningsCalendarTab from "./components/EarningsCalendarTab";


// ---------------------------------------------------------------------------
// Shared style tokens (kept local to this file — no shared UI primitives
// were found elsewhere in the project to reuse; these are used consistently
// across every card/input/button below).
// ---------------------------------------------------------------------------
const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

export default function RebhToolsPage() {
  const [activeTab, setActiveTab] = useState<"fv_lab" | "portfolio_xray" | "alerts" | "calendar" | "market_monitor" | "trade_journal" | "course_labs">("fv_lab");

  // Market universe data
  const [universe, setUniverse] = useState<CompanyItem[]>([]);
  const [loadingUniverse, setLoadingUniverse] = useState(false);
  const [universeError, setUniverseError] = useState<string | null>(null);

  // Real Tadawul Corporate Actions & Dividends Feed
  const [corporateActions, setCorporateActions] = useState<any[]>([]);
  const [calendarSubTab, setCalendarSubTab] = useState<"cma_deadlines" | "corporate_actions">("corporate_actions");

  // In-flight control for the market-universe fetch: abort on unmount and
  // ignore stale responses when a newer request (or retry) has started.
  const universeAbortRef = useRef<AbortController | null>(null);
  const universeReqIdRef = useRef(0);

  const loadUniverse = async () => {
    universeAbortRef.current?.abort();
    const controller = new AbortController();
    universeAbortRef.current = controller;
    const reqId = ++universeReqIdRef.current;
    const isStale = () => reqId !== universeReqIdRef.current || controller.signal.aborted;
    try {
      setLoadingUniverse(true);
      setUniverseError(null);
      const res = await fetch(`${API_BASE_URL}/api/rebh/universe`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (!isStale() && Array.isArray(data)) {
          setUniverse(data);
        }
      } else if (!isStale()) {
        setUniverseError(`تعذر جلب بيانات السوق (${res.status})`);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Failed to load market universe:", err);
      if (!isStale()) setUniverseError("تعذر الاتصال بخادم بيانات السوق المالي");
    } finally {
      if (!isStale()) setLoadingUniverse(false);
    }
  };

  useEffect(() => {
    async function loadCorporateActions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/corporate-actions?limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.actions)) {
            setCorporateActions(data.actions);
          }
        }
      } catch (err) {
        console.error("Failed to load corporate actions:", err);
      }
    }
    loadUniverse();
    loadCorporateActions();
    return () => {
      universeAbortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FV Lab State
  const [discountRate, setDiscountRate] = useState<number>(8.0);
  const [growthRate, setGrowthRate] = useState<number>(4.0);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(2.0);
  const [baseEps, setBaseEps] = useState<number>(3.5);

  // FV Lab Symbol lookup
  const [fvSymbolInput, setFvSymbolInput] = useState<string>("");
  const [fvLoadingSymbol, setFvLoadingSymbol] = useState<boolean>(false);
  const [fvSymbolMeta, setFvSymbolMeta] = useState<{ sym: string; name: string; px?: number; pe?: number; error?: string } | null>(null);

  const fetchSymbolEps = async (symbolToFetch?: string) => {
    const rawSym = (symbolToFetch || fvSymbolInput).trim();
    if (!rawSym) return;

    // Check in local universe first for immediate response
    const localMatch = universe.find(c => c.sym === rawSym || c.sym === `${rawSym}.SR`);
    if (localMatch && localMatch.pe && localMatch.pe > 0 && localMatch.px) {
      const derivedEps = Math.round((localMatch.px / localMatch.pe) * 100) / 100;
      setBaseEps(derivedEps);
      setFvSymbolMeta({
        sym: localMatch.sym,
        name: localMatch.n,
        px: localMatch.px,
        pe: localMatch.pe,
      });
      return;
    }

    setFvLoadingSymbol(true);
    setFvSymbolMeta(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/company/${rawSym}`);
      if (res.ok) {
        const data = await res.json();
        // Priority 1: TTM net profit / shares if available, or px / pe
        let epsVal: number | null = null;
        if (data.TTM?.net_profit && data.mc && data.px) {
          const sharesCount = data.mc / data.px;
          if (sharesCount > 0) {
            epsVal = (data.TTM.net_profit / 1_000_000) / sharesCount;
          }
        }
        if (!epsVal && data.px && data.pe && data.pe > 0) {
          epsVal = data.px / data.pe;
        }

        if (epsVal && epsVal > 0) {
          const roundedEps = Math.round(epsVal * 100) / 100;
          setBaseEps(roundedEps);
          setFvSymbolMeta({
            sym: data.sym || rawSym,
            name: data.n || data.name || rawSym,
            px: data.px,
            pe: data.pe,
          });
        } else {
          setFvSymbolMeta({
            sym: rawSym,
            name: data.n || rawSym,
            error: "الشركة خاسرة أو ليس لها أرباح موجبة TTM لحساب ربحية السهم",
          });
        }
      } else {
        setFvSymbolMeta({ sym: rawSym, name: rawSym, error: "لم يتم العثور على بيانات هذا الرمز" });
      }
    } catch {
      setFvSymbolMeta({ sym: rawSym, name: rawSym, error: "تعذر الاتصال بالخادم لجلب بيانات السهم" });
    } finally {
      setFvLoadingSymbol(false);
    }
  };

  const dcfValidation = React.useMemo(() => {
    const r = discountRate / 100.0;
    const g = growthRate / 100.0;
    const gTerm = terminalGrowth / 100.0;

    const reasons: string[] = [];
    if (r <= gTerm) {
      reasons.push(`معدل العائد المطلوب (${discountRate}%) يجب أن يكون أكبر قطيعاً من معدل النمو النهائي (${terminalGrowth}%). رياضيّاً، المقام (R − g_term) يصبح صفراً أو سالباً فتؤول القيمة إلى ما لا نهاية.`);
    }
    if (baseEps <= 0) {
      reasons.push("ربحية السهم (EPS) صفرية أو سالبة. نموذج التدفقات المخصومة التقليدي لا يمكن تطبيقه على شركات خاسرة.");
    }
    const isGrowthHigh = g > r;

    return {
      isValid: reasons.length === 0,
      reasons,
      isGrowthHigh,
    };
  }, [discountRate, growthRate, terminalGrowth, baseEps]);

  const calculatedFv = React.useMemo(() => {
    const r = discountRate / 100.0;
    const g = growthRate / 100.0;
    const gTerm = terminalGrowth / 100.0;
    if (r <= gTerm || baseEps <= 0) return 0;

    let pvSum = 0;
    let currentE = baseEps;
    for (let yr = 1; yr <= 5; yr++) {
      currentE = currentE * (1 + g);
      pvSum += currentE / Math.pow(1 + r, yr);
    }
    const terminalVal = (currentE * (1 + gTerm)) / (r - gTerm);
    const pvTerminal = terminalVal / Math.pow(1 + r, 5);
    return Math.round((pvSum + pvTerminal) * 100) / 100;
  }, [discountRate, growthRate, terminalGrowth, baseEps]);

  // Portfolio X-Ray State
  const STORAGE_KEY_PORTFOLIO = "rebh_tools_portfolio_xray_v1";

  const DEFAULT_HOLDINGS: { sym: string; amount: number }[] = [
    { sym: "1120", amount: 40000 },
    { sym: "2222", amount: 30000 },
    { sym: "7010", amount: 20000 },
    { sym: "4300", amount: 15000 },
  ];

  interface Holding {
    sym: string;
    amount: number;
  }

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PORTFOLIO);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to load portfolio from localStorage", e);
      }
    }
    return DEFAULT_HOLDINGS;
  });

  const [newSym, setNewSym] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [holdingError, setHoldingError] = useState<string | null>(null);

  // Sync holdings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(holdings));
    } catch (e) {
      console.error("Failed to persist portfolio holdings:", e);
    }
  }, [holdings]);

  const addHolding = () => {
    setHoldingError(null);
    const s = newSym.trim();
    const a = parseFloat(newAmount);

    if (!s) {
      setHoldingError("يرجى إدخال رمز السهم");
      return;
    }
    if (isNaN(a) || a <= 0) {
      setHoldingError("يرجى إدخال مبلغ استثماري صحيح أكبر من صفر");
      return;
    }

    // Validate symbol existence against universe if universe is available
    if (universe.length > 0) {
      const exists = universe.some(c => c.sym === s || c.sym === `${s}.SR`);
      if (!exists) {
        setHoldingError(`الرمز [${s}] غير مدرج في السوق أو لم يتم العثور عليه`);
        return;
      }
    }

    setHoldings(prev => {
      const idx = prev.findIndex(h => h.sym === s);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].amount += a;
        return next;
      }
      return [...prev, { sym: s, amount: a }];
    });
    setNewSym("");
    setNewAmount("");
    setHoldingError(null);
  };

  const removeHolding = (sym: string) => {
    setHoldings(prev => prev.filter(h => h.sym !== sym));
  };

  const resetDefaultHoldings = () => {
    if (confirm("هل تريد استعادة المحفظة النموذجية الافتراضية؟")) {
      setHoldings(DEFAULT_HOLDINGS);
      setHoldingError(null);
    }
  };

  const xrayMetrics = React.useMemo(() => {
    const totalAmount = holdings.reduce((sum, h) => sum + h.amount, 0);
    if (totalAmount === 0 || universe.length === 0) {
      return {
        totalAmount: 0,
        weightedPe: null,
        weightedPb: null,
        weightedRoe: null,
        sectorHhi: 0,
        stockHhi: 0,
        sectorMix: [],
        missingPeCount: 0,
        negativePeCount: 0,
        coveredPeWeightPct: 0
      };
    }

    const sectorWeights: Record<string, number> = {};
    let weightedPeInverseSum = 0;
    let peWeightSum = 0;
    let weightedPbSum = 0;
    let pbWeightSum = 0;
    let weightedRoeSum = 0;
    let roeWeightSum = 0;

    let stockHhiSum = 0;
    let missingPeCount = 0;
    let negativePeCount = 0;

    holdings.forEach(h => {
      const co = universe.find(c => c.sym === h.sym || c.sym === `${h.sym}.SR`);
      const weight = h.amount / totalAmount;
      const sec = co?.sec || "أخرى";
      sectorWeights[sec] = (sectorWeights[sec] || 0) + weight;

      // Stock HHI: sum of squared weights of individual holdings
      stockHhiSum += (weight * 100) * (weight * 100);

      // Track P/E availability & negativity
      if (!co || co.pe == null) {
        missingPeCount++;
      } else if (co.pe <= 0) {
        negativePeCount++;
      } else {
        weightedPeInverseSum += weight / co.pe;
        peWeightSum += weight;
      }

      if (co?.pb && co.pb > 0) {
        weightedPbSum += weight * co.pb;
        pbWeightSum += weight;
      }
      if (co?.roe != null) {
        weightedRoeSum += weight * co.roe;
        roeWeightSum += weight;
      }
    });

    const harmonicPe = peWeightSum > 0 && weightedPeInverseSum > 0 ? (peWeightSum / weightedPeInverseSum) : null;
    const avgPb = pbWeightSum > 0 ? (weightedPbSum / pbWeightSum) : null;
    const avgRoe = roeWeightSum > 0 ? (weightedRoeSum / roeWeightSum) : null;

    // Sector HHI
    const sectorHhiSum = Object.values(sectorWeights).reduce((sum, w) => sum + ((w * 100) * (w * 100)), 0);

    const sectorMix = Object.entries(sectorWeights)
      .map(([name, weight]) => ({ name, pct: Math.round(weight * 1000) / 10 }))
      .sort((a, b) => b.pct - a.pct);

    return {
      totalAmount,
      weightedPe: harmonicPe ? Math.round(harmonicPe * 10) / 10 : null,
      weightedPb: avgPb ? Math.round(avgPb * 100) / 100 : null,
      weightedRoe: avgRoe ? Math.round(avgRoe * 10) / 10 : null,
      sectorHhi: Math.round(sectorHhiSum),
      stockHhi: Math.round(stockHhiSum),
      sectorMix,
      missingPeCount,
      negativePeCount,
      coveredPeWeightPct: Math.round(peWeightSum * 1000) / 10
    };
  }, [holdings, universe]);

  // Alerts State
  interface Rule {
    metric: keyof CompanyItem;
    label: string;
    op: "<" | ">";
    val: number;
  }
  const [rules, setRules] = useState<Rule[]>([
    { metric: "pe", label: "مكرر الأرباح P/E", op: "<", val: 15 },
    { metric: "roe", label: "العائد على الملكية ROE", op: ">", val: 12 },
  ]);
  const [selectedMetric, setSelectedMetric] = useState<keyof CompanyItem>("pe");
  const [selectedOp, setSelectedOp] = useState<"<" | ">">("<");
  const [ruleVal, setRuleVal] = useState<string>("");

  const METRIC_OPTIONS: { key: keyof CompanyItem; label: string }[] = [
    { key: "pe", label: "مكرر الأرباح P/E" },
    { key: "pb", label: "مكرر القيمة الدفترية P/B" },
    { key: "roe", label: "العائد على حقوق الملكية ROE %" },
    { key: "f_score", label: "جودة بيوتروسكي F-Score (0-9)" },
    { key: "g_net", label: "نمو الأرباح السنوي YoY %" },
    { key: "pncav", label: "مكرر الأصول الصافية P/NCAV (Graham)" },
  ];

  const addRule = () => {
    if (!ruleVal) return;
    const v = parseFloat(ruleVal);
    const mInfo = METRIC_OPTIONS.find(o => o.key === selectedMetric);
    setRules(prev => [...prev, { metric: selectedMetric, label: mInfo?.label || "", op: selectedOp, val: v }]);
    setRuleVal("");
  };

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const alertHits = React.useMemo(() => {
    if (rules.length === 0 || universe.length === 0) return [];
    return universe.filter(c => {
      return rules.every(r => {
        const val = c[r.metric] as number | undefined;
        if (val == null) return false;
        return r.op === "<" ? val < r.val : val > r.val;
      });
    });
  }, [rules, universe]);

  // Calendar State: Strict Regulatory Rule: Expected Filing Date = Actual Period End + 45 days (or 90 days for annual)
  const calendarItems = React.useMemo(() => {
    if (universe.length === 0) return [];

    const today = new Date();

    return universe
      .filter(c => c.fresh)
      .slice(0, 50)
      .map((c) => {
        // Derive company's actual period from contract data (c.period / c.end)
        const actualPeriodStr = c.period || c.end || "2024-Q3";

        // Derive exact period end date from contract (c.end / c.period_end or dynamic parse)
        let pEndDate: Date;
        if (c.end && /^\d{4}-\d{2}-\d{2}$/.test(c.end)) {
          pEndDate = new Date(c.end);
        } else if (c.period_end && /^\d{4}-\d{2}-\d{2}$/.test(c.period_end)) {
          pEndDate = new Date(c.period_end);
        } else {
          // Dynamic fallback based on period label if not already formatted
          const up = actualPeriodStr.toUpperCase();
          const yMatch = actualPeriodStr.match(/(20\d{2})/);
          const y = yMatch ? parseInt(yMatch[1], 10) : 2024;
          if (up.includes("Q1") || actualPeriodStr.includes("-03")) {
            pEndDate = new Date(`${y}-03-31`);
          } else if (up.includes("Q2") || actualPeriodStr.includes("-06")) {
            pEndDate = new Date(`${y}-06-30`);
          } else if (up.includes("Q3") || actualPeriodStr.includes("-09")) {
            pEndDate = new Date(`${y}-09-30`);
          } else {
            pEndDate = new Date(`${y}-12-31`);
          }
        }

        // Determine if annual statement
        const isAnnual = actualPeriodStr.includes("FY") ||
          actualPeriodStr.includes("Q4") ||
          (pEndDate.getMonth() === 11 && pEndDate.getDate() === 31);

        // Statutory deadline: Period End + 45 calendar days (90 days for annual FY)
        const deadlineDays = isAnnual ? 90 : 45;
        const filingDeadline = new Date(pEndDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);

        // Since this record comes from already-published financial statements in universe (fresh === true):
        // The company HAS already disclosed this period. Marking it overdue just because today > filingDeadline
        // is mathematically & regulatory wrong.
        const diffDays = Math.round((filingDeadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

        let status = "تم الإفصاح نظامياً ✓";
        let statusColor = "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]";

        return {
          sym: c.sym,
          name: c.n,
          sec: c.sec,
          period: actualPeriodStr,
          periodEnd: pEndDate.toISOString().slice(0, 10),
          expectedDate: filingDeadline.toISOString().slice(0, 10),
          deadlineDays,
          lastEps: c.pe && c.pe > 0 ? (c.px / c.pe).toFixed(2) : "—",
          status,
          statusColor,
          daysLeft: diffDays
        };
      });
  }, [universe]);

  const TABS = [
    { id: "fv_lab", label: "مختبر القيمة العادلة (FV Lab)", icon: Sliders },
    { id: "portfolio_xray", label: "أشعة المحفظة (Portfolio X-Ray)", icon: PieChart },
    { id: "alerts", label: "فلتر الأسهم المتقدم (Screener)", icon: Bell },
    { id: "calendar", label: "رزنامة النتائج (Earnings Calendar)", icon: Calendar },
    { id: "market_monitor", label: "مراقب تقييم السوق (Market Monitor)", icon: BarChart3 },
    { id: "trade_journal", label: "سجل الصفقات (Trade Journal)", icon: BookOpen },
    { id: "course_labs", label: "مختبرات الدورة (18 Labs)", icon: Layers },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/rebh" className="flex items-center gap-2 text-[#8C3B32] font-black tracking-wide text-base">
            <Cpu className="w-5 h-5 text-[#8C3B32]" />
            REBH — أدوات ومنصة العمل
          </Link>
          <span className="text-xs text-[#6B7280] hidden sm:inline">أدوات التقييم، فحص المحفظة، المنبهات، وسجل الصفقات</span>
        </div>
        <Link href="/rebh/watchlist" className="text-xs font-semibold text-[#8C3B32] hover:underline flex items-center gap-1">
          قائمة المتابعة
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Tab group — restructured from an underlined nav into a bordered
            segmented-control card so all seven views read as one grouped
            control, matching the toggle/filter pattern used everywhere else. */}
        <div className={`${CARD} p-1.5 flex gap-1 flex-wrap`}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isOn = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-bold whitespace-nowrap transition ${isOn
                  ? "border border-[#8C3B32] text-[#8C3B32] bg-[#8C3B32]/5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "border border-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Fair Value Lab */}
        {activeTab === "fv_lab" && (
          <FvLabTab
            baseEps={baseEps}
            setBaseEps={setBaseEps}
            discountRate={discountRate}
            setDiscountRate={setDiscountRate}
            growthRate={growthRate}
            setGrowthRate={setGrowthRate}
            terminalGrowth={terminalGrowth}
            setTerminalGrowth={setTerminalGrowth}
            fvSymbolInput={fvSymbolInput}
            setFvSymbolInput={setFvSymbolInput}
            fvLoadingSymbol={fvLoadingSymbol}
            fvSymbolMeta={fvSymbolMeta}
            fetchSymbolEps={fetchSymbolEps}
            dcfValidation={dcfValidation}
            calculatedFv={calculatedFv}
          />
        )}

        {/* Tab 2: Portfolio X-Ray */}
        {activeTab === "portfolio_xray" && (
          <PortfolioXrayTab
            universe={universe}
            universeError={universeError}
            loadUniverse={loadUniverse}
            holdings={holdings}
            newSym={newSym}
            setNewSym={setNewSym}
            newAmount={newAmount}
            setNewAmount={setNewAmount}
            holdingError={holdingError}
            setHoldingError={setHoldingError}
            addHolding={addHolding}
            removeHolding={removeHolding}
            resetDefaultHoldings={resetDefaultHoldings}
            xrayMetrics={xrayMetrics}
          />
        )}

        {/* Tab 3: Advanced Stock Screener */}
        {activeTab === "alerts" && (
          <AlertBuilderTab
            rules={rules}
            setRules={setRules}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            selectedOp={selectedOp}
            setSelectedOp={setSelectedOp}
            ruleVal={ruleVal}
            setRuleVal={setRuleVal}
            metricOptions={METRIC_OPTIONS}
            addRule={addRule}
            removeRule={removeRule}
            alertHits={alertHits}
          />
        )}

        {/* Tab 4: Earnings & Corporate Actions Calendar */}
        {activeTab === "calendar" && (
          <EarningsCalendarTab
            corporateActions={corporateActions}
            calendarSubTab={calendarSubTab}
            setCalendarSubTab={setCalendarSubTab}
            calendarItems={calendarItems}
          />
        )}

        {/* Tab 5: Market Monitor Component */}
        {activeTab === "market_monitor" && (
          <MarketMonitorTab universe={universe} />
        )}

        {/* Tab 6: Trade Journal Component */}
        {activeTab === "trade_journal" && (
          <TradeJournalTab />
        )}

        {/* Tab 7: Course Labs Component */}
        {activeTab === "course_labs" && (
          <CourseLabsTab />
        )}
      </div>
    </div>
  );
}

/*
UX notes (not implemented, flagged for follow-up):
- The market-universe fetch has no error state surfaced to the user — if
  `/api/rebh/universe` fails, `universe` silently stays empty and every tab
  that depends on it (Alerts, Portfolio X-Ray, Calendar, Market Monitor)
  quietly shows "no data" with no indication a fetch failed. Worth adding
  an error flag alongside `loadingUniverse` and a retry affordance.
- `loadingUniverse` is tracked but never rendered anywhere in this file —
  tabs that depend on `universe` (Alerts, Calendar, Portfolio X-Ray) show
  an empty/zero state during the initial load instead of a loading state,
  which can read as "no matches" rather than "still loading".
- Seven tabs in one bar is a lot to scan; consider grouping into two rows
  (e.g. "Tools" vs "Data") if more are added later.
*/