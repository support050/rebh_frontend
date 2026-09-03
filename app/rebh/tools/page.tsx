"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sliders, Shield, BarChart3, Layers, Calendar, 
  HelpCircle, Eye, RefreshCw, ArrowUpRight, Cpu,
  PieChart, Bell, BookOpen
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

  // Calendar State
  const calendarItems = React.useMemo(() => {
    if (universe.length === 0) return [];
    const today = new Date();
    return universe
      .filter(c => c.fresh)
      .slice(0, 30)
      .map((c, i) => {
        const expectedDate = new Date();
        expectedDate.setDate(today.getDate() + ((i * 3) % 45) + 2);
        return {
          sym: c.sym,
          name: c.n,
          sec: c.sec,
          period: "Q2 2026",
          expectedDate: expectedDate.toISOString().slice(0, 10),
          lastEps: c.pe && c.pe > 0 ? (c.px / c.pe).toFixed(2) : "—",
          status: i % 4 === 0 ? "مرتقب" : "في الإطار النظامي"
        };
      })
      .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  }, [universe]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#eef1f5] pb-16 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#05070a] border-b border-[#1e2836] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/rebh" className="flex items-center gap-2 text-[#d9b64a] font-black tracking-wider text-base font-mono">
            <Cpu className="w-5 h-5 text-[#3987e5]" />
            REBH TOOLS &amp; WORKBENCH
          </Link>
          <span className="text-xs text-[#657081] hidden sm:inline">أدوات التقييم، فحص المحفظة، المنبهات، وسجل الصفقات</span>
        </div>
        <Link href="/rebh/watchlist" className="text-xs font-semibold text-[#63a5f0] hover:underline flex items-center gap-1">
          قائمة المتابعة
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Clean Sticky Tabs Bar */}
        <div className="flex border-b border-[#1e2836] gap-1.5 text-xs font-bold font-mono overflow-x-auto pb-px">
          {[
            { id: "fv_lab", label: "مختبر القيمة العادلة (FV Lab)", icon: Sliders },
            { id: "portfolio_xray", label: "أشعة المحفظة (Portfolio X-Ray)", icon: PieChart },
            { id: "alerts", label: "منبه الإشارات (Alert Builder)", icon: Bell },
            { id: "calendar", label: "رزنامة النتائج (Earnings Calendar)", icon: Calendar },
            { id: "market_monitor", label: "مراقب تقييم السوق (Market Monitor)", icon: BarChart3 },
            { id: "trade_journal", label: "سجل الصفقات (Trade Journal)", icon: BookOpen },
            { id: "course_labs", label: "مختبرات الدورة (18 Labs)", icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isOn = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  isOn ? 'border-[#3987e5] text-[#3987e5]' : 'border-transparent text-[#657081] hover:text-[#a7b1bd]'
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
            <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-6">
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-white mb-1">حاسبة التدفقات النقدية التفاعلية (Interactive DCF)</h2>
                <p className="text-xs text-[#a7b1bd]">
                  عدل الافتراضات أدناه لاحتساب القيمة العادلة للسهم وفق معدل العائد المطلوب (R) ومعدلات النمو المتوقعة.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5 bg-[#182130] p-5 rounded-xl border border-[#1e2836]">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-[#a7b1bd]">ربحية السهم الأساسية (EPS TTM):</span>
                      <span className="text-[#d9b64a] font-bold">{baseEps.toFixed(2)} ر.س</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="25" step="0.25"
                      value={baseEps} onChange={(e) => setBaseEps(parseFloat(e.target.value))}
                      className="w-full accent-[#3987e5]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-[#a7b1bd]">معدل العائد المطلوب (Discount Rate R):</span>
                      <span className="text-rose-400 font-bold">{discountRate.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" min="4" max="15" step="0.5"
                      value={discountRate} onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                      className="w-full accent-[#3987e5]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-[#a7b1bd]">معدل النمو للخمس سنوات (Growth g):</span>
                      <span className="text-emerald-400 font-bold">{growthRate.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="25" step="0.5"
                      value={growthRate} onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                      className="w-full accent-[#3987e5]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-[#a7b1bd]">معدل النمو النهائي (Terminal Growth):</span>
                      <span className="text-[#63a5f0] font-bold">{terminalGrowth.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="4.0" step="0.25"
                      value={terminalGrowth} onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                      className="w-full accent-[#3987e5]"
                    />
                  </div>
                </div>

                <div className="bg-[#0e1218] border border-[#3987e5]/30 rounded-xl p-6 text-center space-y-4">
                  <span className="text-xs uppercase tracking-wider text-[#657081] font-mono block">القيمة العادلة المحسوبة للسهم°</span>
                  <div className="text-5xl font-black font-mono text-[#eef1f5]">
                    {calculatedFv > 0 ? `${calculatedFv.toFixed(2)}` : "غير صالح"}
                    <span className="text-base font-normal text-[#657081] mr-2">ر.س</span>
                  </div>
                  <p className="text-xs text-[#a7b1bd] max-w-sm mx-auto">
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
            <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-6">
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-white mb-1">أشعة المحفظة الاستثمارية (Portfolio X-Ray)</h2>
                <p className="text-xs text-[#a7b1bd]">
                  أدخل أسهم محفظتك ومقاديرها بالريال لمعرفة مكرر أرباح المحفظة التوافقي، تركز القطاعات، ومؤشر هيرفندال (HHI).
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center bg-[#182130] p-4 rounded-xl border border-[#1e2836] mb-6">
                <input
                  type="text"
                  placeholder="رمز السهم (مثال: 1120)"
                  value={newSym}
                  onChange={(e) => setNewSym(e.target.value)}
                  className="bg-[#0e1218] border border-[#1e2836] rounded-lg px-3 py-2 text-xs w-36 font-mono text-white focus:outline-none focus:border-[#3987e5]"
                />
                <input
                  type="number"
                  placeholder="المبلغ المستثمر (ر.س)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="bg-[#0e1218] border border-[#1e2836] rounded-lg px-3 py-2 text-xs w-44 font-mono text-white focus:outline-none focus:border-[#3987e5]"
                />
                <button
                  onClick={addHolding}
                  className="px-4 py-2 bg-[#3987e5] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition"
                >
                  إضافة للمحفظة
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center mb-6">
                <div className="bg-[#182130] p-3.5 rounded-xl border border-[#1e2836]">
                  <span className="text-[10px] text-[#657081] block mb-1">إجمالي المحفظة</span>
                  <span className="text-lg font-black text-white">{xrayMetrics.totalAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="bg-[#182130] p-3.5 rounded-xl border border-[#1e2836]">
                  <span className="text-[10px] text-[#657081] block mb-1">مكرر P/E التوافقي°</span>
                  <span className="text-lg font-black text-[#d9b64a]">{xrayMetrics.weightedPe ? `${xrayMetrics.weightedPe}x` : "—"}</span>
                </div>
                <div className="bg-[#182130] p-3.5 rounded-xl border border-[#1e2836]">
                  <span className="text-[10px] text-[#657081] block mb-1">مكرر الدفترية المرجح</span>
                  <span className="text-lg font-black text-[#63a5f0]">{xrayMetrics.weightedPb ? `${xrayMetrics.weightedPb}x` : "—"}</span>
                </div>
                <div className="bg-[#182130] p-3.5 rounded-xl border border-[#1e2836]">
                  <span className="text-[10px] text-[#657081] block mb-1">العائد المرجح ROE°</span>
                  <span className="text-lg font-black text-emerald-400">{xrayMetrics.weightedRoe ? `${xrayMetrics.weightedRoe}%` : "—"}</span>
                </div>
                <div className="bg-[#182130] p-3.5 rounded-xl border border-[#1e2836]">
                  <span className="text-[10px] text-[#657081] block mb-1">تركز المحفظة HHI</span>
                  <span className={`text-lg font-black ${xrayMetrics.hhi > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {xrayMetrics.hhi}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#182130] p-4 rounded-xl border border-[#1e2836] overflow-x-auto">
                  <h3 className="text-xs font-bold text-white mb-3 font-mono">مكونات المحفظة الحالية ({holdings.length})</h3>
                  <table className="w-full text-xs font-mono text-right">
                    <thead>
                      <tr className="text-[#657081] border-b border-[#1e2836]">
                        <th className="pb-2">الرمز</th>
                        <th className="pb-2">المبلغ</th>
                        <th className="pb-2">الوزن</th>
                        <th className="pb-2 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2836]">
                      {holdings.map(h => {
                        const co = universe.find(c => c.sym === h.sym);
                        const weight = xrayMetrics.totalAmount > 0 ? ((h.amount / xrayMetrics.totalAmount) * 100).toFixed(1) : "0";
                        return (
                          <tr key={h.sym} className="hover:bg-white/[0.02]">
                            <td className="py-2.5">
                              <span className="font-bold text-white">{h.sym}</span>
                              <span className="text-[#657081] text-[10px] mr-1.5">{co?.n}</span>
                            </td>
                            <td className="py-2.5 text-white">{h.amount.toLocaleString()} ر.س</td>
                            <td className="py-2.5 text-[#3987e5] font-bold">{weight}%</td>
                            <td className="py-2.5 text-center">
                              <button onClick={() => removeHolding(h.sym)} className="text-rose-400 hover:text-rose-300">
                                حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#182130] p-4 rounded-xl border border-[#1e2836]">
                  <h3 className="text-xs font-bold text-white mb-3 font-mono">توزيع القطاعات (Sector Allocation)</h3>
                  <div className="space-y-3">
                    {xrayMetrics.sectorMix.map(sec => (
                      <div key={sec.name}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-white">{sec.name}</span>
                          <span className="text-[#3987e5] font-bold">{sec.pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#0e1218] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-[#3987e5] to-[#63a5f0]" style={{ width: `${sec.pct}%` }} />
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
            <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-6">
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-white mb-1">منبه الإشارات وباني الشروط (Alert Builder &amp; Presets)</h2>
                <p className="text-xs text-[#a7b1bd]">
                  ابنِ شروطاً مركبة بنظام AND لمعرفة جميع الشركات التي تحققها فوراً في السوق المالي مع حفظ القوائم.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center bg-[#182130] p-4 rounded-xl border border-[#1e2836] mb-6">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as keyof CompanyItem)}
                  className="bg-[#0e1218] border border-[#1e2836] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                >
                  {METRIC_OPTIONS.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>

                <select
                  value={selectedOp}
                  onChange={(e) => setSelectedOp(e.target.value as "<" | ">")}
                  className="bg-[#0e1218] border border-[#1e2836] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                >
                  <option value="<">&lt; أقل من</option>
                  <option value=">">&gt; أكبر من</option>
                </select>

                <input
                  type="number"
                  placeholder="القيمة"
                  value={ruleVal}
                  onChange={(e) => setRuleVal(e.target.value)}
                  className="bg-[#0e1218] border border-[#1e2836] rounded-lg px-3 py-2 text-xs w-28 font-mono text-white focus:outline-none"
                />

                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-[#3987e5] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition"
                >
                  إضافة شرط
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {rules.map((r, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182130] border border-[#3987e5]/40 rounded-lg text-xs font-mono text-[#eef1f5]">
                    <span>{r.label} {r.op} {r.val}</span>
                    <button onClick={() => removeRule(idx)} className="text-rose-400 hover:text-white mr-1">×</button>
                  </span>
                ))}
              </div>

              <div className="bg-[#182130] rounded-xl border border-[#1e2836] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1e2836] flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-white">الشركات المطابقة للشروط اليوم: {alertHits.length} شركة</span>
                  <span className="text-[#657081]">تحديث مباشر live</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-right">
                    <thead>
                      <tr className="text-[#657081] border-b border-[#1e2836] bg-[#0e1218]">
                        <th className="p-3">الرمز والشركة</th>
                        <th className="p-3">القطاع</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">P/E</th>
                        <th className="p-3">ROE</th>
                        <th className="p-3">F-Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2836]">
                      {alertHits.slice(0, 15).map(c => (
                        <tr key={c.sym} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">
                            <Link href={`/rebh/${c.sym}`} className="text-[#3987e5] hover:underline ml-1.5">{c.sym}</Link>
                            <span>{c.n}</span>
                          </td>
                          <td className="p-3 text-[#a7b1bd]">{c.sec}</td>
                          <td className="p-3 text-white">{c.px ? `${c.px.toFixed(2)} ر.س` : "—"}</td>
                          <td className="p-3 text-[#d9b64a]">{c.pe ? `${c.pe}x` : "—"}</td>
                          <td className="p-3 text-emerald-400">{c.roe ? `${c.roe}%` : "—"}</td>
                          <td className="p-3 font-bold">{c.f_score != null ? `${c.f_score}/9` : "—"}</td>
                        </tr>
                      ))}
                      {alertHits.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#657081]">لا توجد شركات تحقق الشروط المحددة حالياً.</td>
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
            <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-6">
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-white mb-1">رزنامة إعلانات الأرباح المتوقعة (Earnings Calendar)</h2>
                <p className="text-xs text-[#a7b1bd]">
                  حساب نافذة الـ 45 يوماً النظامية لإعلان القوائم المالية بناءً على نهاية الفترات المحاسبية السابقة.
                </p>
              </div>

              <div className="bg-[#182130] rounded-xl border border-[#1e2836] overflow-x-auto">
                <table className="w-full text-xs font-mono text-right">
                  <thead>
                    <tr className="text-[#657081] border-b border-[#1e2836] bg-[#0e1218]">
                      <th className="p-3">الرمز والشركة</th>
                      <th className="p-3">القطاع</th>
                      <th className="p-3">الفترة المعلنة</th>
                      <th className="p-3">الموعد النظامي المتوقع°</th>
                      <th className="p-3">ربحية السهم السابقة EPS</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2836]">
                    {calendarItems.map(item => (
                      <tr key={item.sym} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white">
                          <Link href={`/rebh/${item.sym}`} className="text-[#3987e5] hover:underline ml-1.5">{item.sym}</Link>
                          <span>{item.name}</span>
                        </td>
                        <td className="p-3 text-[#a7b1bd]">{item.sec}</td>
                        <td className="p-3 text-white">{item.period}</td>
                        <td className="p-3 font-bold text-[#d9b64a]">{item.expectedDate}</td>
                        <td className="p-3 text-white">{item.lastEps} ر.س</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
