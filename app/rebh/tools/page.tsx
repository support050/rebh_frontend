"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders, Shield, BarChart3, Layers, Calendar,
  HelpCircle, Eye, RefreshCw, ArrowUpRight, Cpu,
  PieChart, Bell, BookOpen, Plus, X, Loader2, AlertTriangle,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

// Modular Sub-Components
import MarketMonitorTab from "./components/MarketMonitorTab";
import TradeJournalTab from "./components/TradeJournalTab";
import CourseLabsTab from "./components/CourseLabsTab";

interface CompanyItem {
  sym: string;
  n: string;
  sec: string;
  px: number;
  mc: number;
  pe?: number;
  pb?: number;
  roe?: number;
  g_net?: number;
  g_rev?: number;
  f_score?: number;
  fresh?: boolean;
  ncav?: number;
  pncav?: number;
  peg?: number;
}

// ---------------------------------------------------------------------------
// Shared style tokens (kept local to this file — no shared UI primitives
// were found elsewhere in the project to reuse; these are used consistently
// across every card/input/button below).
// ---------------------------------------------------------------------------
const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const INPUT =
  "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";
const BTN_PRIMARY =
  "px-4 py-2 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition inline-flex items-center gap-1.5";
const KPI_LABEL = "text-[10px] text-[#6B7280] uppercase tracking-wide block mb-1";

export default function RebhToolsPage() {
  const [activeTab, setActiveTab] = useState<"fv_lab" | "portfolio_xray" | "alerts" | "calendar" | "market_monitor" | "trade_journal" | "course_labs">("fv_lab");

  // Market universe data
  const [universe, setUniverse] = useState<CompanyItem[]>([]);
  const [loadingUniverse, setLoadingUniverse] = useState(false);

  useEffect(() => {
    async function loadUniverse() {
      try {
        setLoadingUniverse(true);
        const res = await fetch(`${API_BASE_URL}/api/rebh/universe`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setUniverse(data);
          }
        }
      } catch (err) {
        console.error("Failed to load market universe:", err);
      } finally {
        setLoadingUniverse(false);
      }
    }
    loadUniverse();
  }, []);

  // FV Lab State
  const [discountRate, setDiscountRate] = useState<number>(8.0);
  const [growthRate, setGrowthRate] = useState<number>(4.0);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(2.0);
  const [baseEps, setBaseEps] = useState<number>(3.5);

  const calculatedFv = React.useMemo(() => {
    const r = discountRate / 100.0;
    const g = growthRate / 100.0;
    const gTerm = terminalGrowth / 100.0;
    if (r <= gTerm) return 0;

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
  interface Holding {
    sym: string;
    amount: number;
  }
  const [holdings, setHoldings] = useState<Holding[]>([
    { sym: "1120", amount: 40000 },
    { sym: "2222", amount: 30000 },
    { sym: "7010", amount: 20000 },
    { sym: "4300", amount: 15000 },
  ]);
  const [newSym, setNewSym] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const addHolding = () => {
    if (!newSym || !newAmount || parseFloat(newAmount) <= 0) return;
    const s = newSym.trim();
    const a = parseFloat(newAmount);
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
  };

  const removeHolding = (sym: string) => {
    setHoldings(prev => prev.filter(h => h.sym !== sym));
  };

  const xrayMetrics = React.useMemo(() => {
    const totalAmount = holdings.reduce((sum, h) => sum + h.amount, 0);
    if (totalAmount === 0 || universe.length === 0) {
      return { totalAmount: 0, weightedPe: null, weightedPb: null, weightedRoe: null, hhi: 0, sectorMix: [] };
    }

    const sectorWeights: Record<string, number> = {};
    let weightedPeInverseSum = 0;
    let peWeightSum = 0;
    let weightedPbSum = 0;
    let pbWeightSum = 0;
    let weightedRoeSum = 0;
    let roeWeightSum = 0;

    holdings.forEach(h => {
      const co = universe.find(c => c.sym === h.sym);
      const weight = h.amount / totalAmount;
      const sec = co?.sec || "أخرى";
      sectorWeights[sec] = (sectorWeights[sec] || 0) + weight;

      if (co?.pe && co.pe > 0) {
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
    const hhi = Object.values(sectorWeights).reduce((sum, w) => sum + (w * w), 0);

    const sectorMix = Object.entries(sectorWeights)
      .map(([name, weight]) => ({ name, pct: Math.round(weight * 1000) / 10 }))
      .sort((a, b) => b.pct - a.pct);

    return {
      totalAmount,
      weightedPe: harmonicPe ? Math.round(harmonicPe * 10) / 10 : null,
      weightedPb: avgPb ? Math.round(avgPb * 100) / 100 : null,
      weightedRoe: avgRoe ? Math.round(avgRoe * 10) / 10 : null,
      hhi: Math.round(hhi * 10000) / 100,
      sectorMix
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
      .slice(0, 40)
      .map((c) => {
        // Derive company's actual period and period end date
        const actualPeriodStr = (c as any).end || (c as any).as_of || (c as any).period || "2024-Q3";
        const isAnnual = actualPeriodStr.includes("FY") || actualPeriodStr.includes("Q4") || actualPeriodStr.includes("12-31");
        
        // Parse actual period end date
        let pEndDate: Date;
        if (actualPeriodStr.includes("Q1") || actualPeriodStr.includes("-03-")) {
          pEndDate = new Date("2024-03-31");
        } else if (actualPeriodStr.includes("Q2") || actualPeriodStr.includes("-06-")) {
          pEndDate = new Date("2024-06-30");
        } else if (actualPeriodStr.includes("Q3") || actualPeriodStr.includes("-09-")) {
          pEndDate = new Date("2024-09-30");
        } else {
          pEndDate = new Date("2024-12-31");
        }

        // Statutory deadline: Period End + 45 days (90 days for annual FY)
        const deadlineDays = isAnnual ? 90 : 45;
        const filingDeadline = new Date(pEndDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
        
        const isOverdue = today > filingDeadline;
        const diffDays = Math.round((filingDeadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        let status = "في الإطار النظامي";
        let statusColor = "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]";
        if (isOverdue) {
          status = "متأخر عن المهلة ⚑";
          statusColor = "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
        } else if (diffDays <= 7 && diffDays >= 0) {
          status = "مرتقب خلال أسبوع ⏳";
          statusColor = "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
        }

        return {
          sym: c.sym,
          name: c.n,
          sec: c.sec,
          period: actualPeriodStr,
          periodEnd: pEndDate.toISOString().slice(0, 10),
          expectedDate: filingDeadline.toISOString().slice(0, 10),
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
    { id: "alerts", label: "منبه الإشارات (Alert Builder)", icon: Bell },
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
            REBH TOOLS &amp; WORKBENCH
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
          <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
              <div className="max-w-2xl mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-[#1A1A1A]">حاسبة التدفقات النقدية التقليدية (Conventional Terminal DCF Lab)</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    نموذج تقليدي أكاديمي — ليس منهج الخرافشي الأساسي
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  تنبيه منهجي: تعتمد دورة الخرافشي أسلوب تقييم العائد المتوقع وتفكيك مضاعفات النمو (Khurafshi Return Engine) وترفض الاعتماد المطلق على القيمة النهائية للتدفقات (Terminal Value). تم توفير هذه الحاسبة لأغراض المقارنة الأكاديمية فقط.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className={`space-y-5 ${SUBCARD} p-5`}>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#6B7280]">ربحية السهم الأساسية (EPS TTM):</span>
                      <span className="text-[#8C3B32] font-bold">{baseEps.toFixed(2)} ر.س</span>
                    </div>
                    <input
                      type="range" min="0.5" max="25" step="0.25"
                      value={baseEps} onChange={(e) => setBaseEps(parseFloat(e.target.value))}
                      className="w-full accent-[#8C3B32]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#6B7280]">معدل العائد المطلوب (Discount Rate R):</span>
                      <span className="text-[#DC2626] font-bold">{discountRate.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min="4" max="15" step="0.5"
                      value={discountRate} onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                      className="w-full accent-[#8C3B32]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#6B7280]">معدل النمو للخمس سنوات (Growth g):</span>
                      <span className="text-[#16A34A] font-bold">{growthRate.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="25" step="0.5"
                      value={growthRate} onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                      className="w-full accent-[#8C3B32]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#6B7280]">معدل النمو النهائي (Terminal Growth):</span>
                      <span className="text-[#1A1A1A] font-bold">{terminalGrowth.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min="0.5" max="4.0" step="0.25"
                      value={terminalGrowth} onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                      className="w-full accent-[#8C3B32]"
                    />
                  </div>
                </div>

                <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] p-6 text-center space-y-4">
                  <span className="text-xs uppercase tracking-wide text-[#6B7280] block">القيمة العادلة المحسوبة للسهم</span>
                  <div className="text-5xl font-black text-[#1A1A1A]">
                    {calculatedFv > 0 ? `${calculatedFv.toFixed(2)}` : "غير صالح"}
                    <span className="text-base font-normal text-[#6B7280] mr-2">ر.س</span>
                  </div>
                  <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                    بناءً على عائد مطلوب {discountRate}% ونمو متوقع {growthRate}% للسهم الواحد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Portfolio X-Ray */}
        {activeTab === "portfolio_xray" && (
          <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-[#1A1A1A] mb-1">أشعة المحفظة الاستثمارية (Portfolio X-Ray)</h2>
                <p className="text-xs text-[#6B7280]">
                  أدخل أسهم محفظتك ومقاديرها بالريال لمعرفة مكرر أرباح المحفظة التوافقي، تركز القطاعات، ومؤشر هيرفندال (HHI).
                </p>
              </div>

              <div className={`flex flex-wrap gap-3 items-center ${SUBCARD} p-4 mb-6`}>
                <input
                  type="text"
                  placeholder="رمز السهم (مثال: 1120)"
                  value={newSym}
                  onChange={(e) => setNewSym(e.target.value)}
                  className={`${INPUT} w-36`}
                />
                <input
                  type="number"
                  placeholder="المبلغ المستثمر (ر.س)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className={`${INPUT} w-44`}
                />
                <button onClick={addHolding} className={BTN_PRIMARY}>
                  <Plus className="w-3.5 h-3.5" />
                  إضافة للمحفظة
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-6">
                <div className={`${SUBCARD} p-3.5`}>
                  <span className={KPI_LABEL}>إجمالي المحفظة</span>
                  <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.totalAmount.toLocaleString()} ر.س</span>
                </div>
                <div className={`${SUBCARD} p-3.5`}>
                  <span className={KPI_LABEL}>مكرر P/E التوافقي</span>
                  <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.weightedPe ? `${xrayMetrics.weightedPe}x` : "—"}</span>
                </div>
                <div className={`${SUBCARD} p-3.5`}>
                  <span className={KPI_LABEL}>مكرر الدفترية المرجح</span>
                  <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.weightedPb ? `${xrayMetrics.weightedPb}x` : "—"}</span>
                </div>
                <div className={`${SUBCARD} p-3.5`}>
                  <span className={KPI_LABEL}>العائد المرجح ROE</span>
                  <span className="text-lg font-black text-[#16A34A]">{xrayMetrics.weightedRoe ? `${xrayMetrics.weightedRoe}%` : "—"}</span>
                </div>
                <div className={`${SUBCARD} p-3.5`}>
                  <span className={KPI_LABEL}>تركز المحفظة HHI</span>
                  <span className={`text-lg font-black ${xrayMetrics.hhi > 35 ? 'text-[#B45309]' : 'text-[#16A34A]'}`}>
                    {xrayMetrics.hhi}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${SUBCARD} p-4 overflow-x-auto`}>
                  <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">مكونات المحفظة الحالية ({holdings.length})</h3>
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="text-[#6B7280] bg-[#F3F4F6]">
                        <th className="p-2 font-semibold">الرمز</th>
                        <th className="p-2 font-semibold">المبلغ</th>
                        <th className="p-2 font-semibold">الوزن</th>
                        <th className="p-2 font-semibold text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map(h => {
                        const co = universe.find(c => c.sym === h.sym);
                        const weight = xrayMetrics.totalAmount > 0 ? ((h.amount / xrayMetrics.totalAmount) * 100).toFixed(1) : "0";
                        return (
                          <tr key={h.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                            <td className="p-2">
                              <span className="font-bold text-[#1A1A1A]">{h.sym}</span>
                              <span className="text-[#6B7280] text-[10px] mr-1.5">{co?.n}</span>
                            </td>
                            <td className="p-2 text-[#1A1A1A] tabular-nums">{h.amount.toLocaleString()} ر.س</td>
                            <td className="p-2 text-[#8C3B32] font-bold tabular-nums">{weight}%</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeHolding(h.sym)}
                                aria-label="حذف"
                                className="text-[#6B7280] hover:text-[#DC2626] transition"
                              >
                                <X className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={`${SUBCARD} p-4`}>
                  <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">توزيع القطاعات (Sector Allocation)</h3>
                  <div className="space-y-3">
                    {xrayMetrics.sectorMix.map(sec => (
                      <div key={sec.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#1A1A1A]">{sec.name}</span>
                          <span className="text-[#8C3B32] font-bold tabular-nums">{sec.pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full bg-[#8C3B32]" style={{ width: `${sec.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Alerts & Rule Builder */}
        {activeTab === "alerts" && (
          <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-[#1A1A1A] mb-1">منبه الإشارات وباني الشروط (Alert Builder &amp; Presets)</h2>
                <p className="text-xs text-[#6B7280]">
                  ابنِ شروطاً مركبة بنظام AND لمعرفة جميع الشركات التي تحققها فوراً في السوق المالي مع حفظ القوائم.
                </p>
              </div>

              <div className={`flex flex-wrap gap-2.5 items-center ${SUBCARD} p-4 mb-6`}>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as keyof CompanyItem)}
                  className={INPUT}
                >
                  {METRIC_OPTIONS.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>

                <select
                  value={selectedOp}
                  onChange={(e) => setSelectedOp(e.target.value as "<" | ">")}
                  className={INPUT}
                >
                  <option value="<">&lt; أقل من</option>
                  <option value=">">&gt; أكبر من</option>
                </select>

                <input
                  type="number"
                  placeholder="القيمة"
                  value={ruleVal}
                  onChange={(e) => setRuleVal(e.target.value)}
                  className={`${INPUT} w-28`}
                />

                <button onClick={addRule} className={BTN_PRIMARY}>
                  <Plus className="w-3.5 h-3.5" />
                  إضافة شرط
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {rules.map((r, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#8C3B32]/40 rounded-full text-xs text-[#1A1A1A]">
                    <span>{r.label} {r.op} {r.val}</span>
                    <button onClick={() => removeRule(idx)} aria-label="حذف الشرط" className="text-[#6B7280] hover:text-[#DC2626] transition">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className={`${SUBCARD} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-[#E5E7EB] flex justify-between items-center text-xs bg-[#F3F4F6]">
                  <span className="font-bold text-[#1A1A1A]">الشركات المطابقة للشروط اليوم: {alertHits.length} شركة</span>
                  <span className="text-[#6B7280]">تحديث مباشر</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                        <th className="p-3 font-semibold">الرمز والشركة</th>
                        <th className="p-3 font-semibold">القطاع</th>
                        <th className="p-3 font-semibold">السعر</th>
                        <th className="p-3 font-semibold">P/E</th>
                        <th className="p-3 font-semibold">ROE</th>
                        <th className="p-3 font-semibold">F-Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertHits.slice(0, 15).map(c => (
                        <tr key={c.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                          <td className="p-3 font-bold text-[#1A1A1A]">
                            <Link href={`/rebh/${c.sym}`} className="text-[#8C3B32] hover:underline ml-1.5">{c.sym}</Link>
                            <span>{c.n}</span>
                          </td>
                          <td className="p-3 text-[#6B7280]">{c.sec}</td>
                          <td className="p-3 text-[#1A1A1A] tabular-nums">{c.px ? `${c.px.toFixed(2)} ر.س` : "—"}</td>
                          <td className="p-3 tabular-nums">{c.pe ? `${c.pe}x` : "—"}</td>
                          <td className="p-3 text-[#16A34A] tabular-nums">{c.roe ? `${c.roe}%` : "—"}</td>
                          <td className="p-3 font-bold tabular-nums">{c.f_score != null ? `${c.f_score}/9` : "—"}</td>
                        </tr>
                      ))}
                      {alertHits.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#6B7280]">لا توجد شركات تحقق الشروط المحددة حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Earnings Calendar */}
        {activeTab === "calendar" && (
          <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-[#1A1A1A] mb-1">رزنامة إعلانات الأرباح المتوقعة (Earnings Calendar)</h2>
                <p className="text-xs text-[#6B7280]">
                  حساب نافذة الـ 45 يوماً النظامية لإعلان القوائم المالية بناءً على نهاية الفترات المحاسبية السابقة.
                </p>
              </div>

              <div className={`${SUBCARD} overflow-x-auto`}>
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                      <th className="p-3 font-semibold">الرمز والشركة</th>
                      <th className="p-3 font-semibold">القطاع</th>
                      <th className="p-3 font-semibold">الفترة المعلنة</th>
                      <th className="p-3 font-semibold">نهاية الفترة المحاسبية</th>
                      <th className="p-3 font-semibold">الموعد الأقصى النظامي (نهاية + 45 يوم)</th>
                      <th className="p-3 font-semibold">ربحية السهم السابقة EPS</th>
                      <th className="p-3 font-semibold">الحالة والمهلة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarItems.map(item => (
                      <tr key={item.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                        <td className="p-3 font-bold text-[#1A1A1A]">
                          <Link href={`/rebh/${item.sym}`} className="text-[#8C3B32] hover:underline ml-1.5">{item.sym}</Link>
                          <span>{item.name}</span>
                        </td>
                        <td className="p-3 text-[#6B7280]">{item.sec}</td>
                        <td className="p-3 text-[#1A1A1A]">{item.period}</td>
                        <td className="p-3 text-[#6B7280] tabular-nums">{item.periodEnd}</td>
                        <td className="p-3 font-bold text-[#8C3B32] tabular-nums">{item.expectedDate}</td>
                        <td className="p-3 text-[#1A1A1A] tabular-nums">{item.lastEps} ر.س</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.statusColor}`}>
                            {item.status} ({item.daysLeft > 0 ? `متبقي ${item.daysLeft} يوم` : `انتهت المهلة منذ ${Math.abs(item.daysLeft)} يوم`})
                          </span>
                        </td>
                      </tr>
                    ))}
                    {calendarItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#6B7280]">لا توجد بيانات كافية لعرض الرزنامة حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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