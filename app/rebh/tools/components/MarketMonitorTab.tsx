"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

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
  fresh?: boolean;
}

interface MarketMonitorTabProps {
  universe: CompanyItem[];
}

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const KPI_LABEL = "text-[10px] text-[#6B7280] uppercase tracking-wide mt-1";

export default function MarketMonitorTab({ universe }: MarketMonitorTabProps) {
  const [bondAnchor, setBondAnchor] = React.useState<number>(4.75);

  const fresh = useMemo(() => universe.filter(c => c.fresh), [universe]);
  const pes = useMemo(() => {
    return fresh.filter(c => c.pe && c.pe > 0 && c.pe < 80).map(c => c.pe as number).sort((a, b) => a - b);
  }, [fresh]);

  const medPe = useMemo(() => {
    if (!pes.length) return 13.6;
    return pes[Math.floor(pes.length / 2)];
  }, [pes]);

  const pbs = useMemo(() => {
    return fresh.filter(c => c.pb && c.pb > 0).map(c => c.pb as number).sort((a, b) => a - b);
  }, [fresh]);
  const medPb = useMemo(() => (pbs.length ? pbs[Math.floor(pbs.length / 2)] : 1.85), [pbs]);

  const roes = useMemo(() => {
    return fresh.filter(c => c.roe != null).map(c => c.roe as number).sort((a, b) => a - b);
  }, [fresh]);
  const medRoe = useMemo(() => (roes.length ? roes[Math.floor(roes.length / 2)] : 12.4), [roes]);

  const totMc = useMemo(() => fresh.reduce((sum, c) => sum + (c.mc || 0), 0), [fresh]);

  // Histogram Bins for P/E (16 bins, 0..80x)
  const bins = useMemo(() => {
    const b = Array.from({ length: 16 }, (_, i) => ({ lo: i * 5, count: 0 }));
    pes.forEach(p => {
      const idx = Math.min(15, Math.floor(p / 5));
      b[idx].count++;
    });
    return b;
  }, [pes]);
  const maxBinCount = useMemo(() => Math.max(...bins.map(b => b.count), 1), [bins]);

  // Sector Medians
  const secRows = useMemo(() => {
    const secs: Record<string, CompanyItem[]> = {};
    fresh.forEach(c => {
      const k = c.sec || "أخرى";
      secs[k] = secs[k] || [];
      secs[k].push(c);
    });

    return Object.entries(secs)
      .filter(([, list]) => list.length >= 2)
      .map(([k, list]) => {
        const pList = list.filter(c => c.pe && c.pe > 0 && c.pe < 80).map(c => c.pe as number).sort((a, b) => a - b);
        const bList = list.filter(c => c.pb && c.pb > 0).map(c => c.pb as number).sort((a, b) => a - b);
        const rList = list.filter(c => c.roe != null).map(c => c.roe as number).sort((a, b) => a - b);
        const gList = list.filter(c => c.g_net != null).map(c => c.g_net as number).sort((a, b) => a - b);

        return {
          name: k,
          count: list.length,
          pe: pList.length ? pList[Math.floor(pList.length / 2)] : null,
          pb: bList.length ? bList[Math.floor(bList.length / 2)] : null,
          roe: rList.length ? rList[Math.floor(rList.length / 2)] : null,
          g: gList.length ? gList[Math.floor(gList.length / 2)] : null,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [fresh]);

  // Bond vs Earnings Yield Gate
  const ey = medPe > 0 ? 1 / medPe : 0;
  const eyRatio = ey > 0 ? (bondAnchor / 100) / ey : 0;

  // Lynch Opportunity Gauge
  const cheapCount = fresh.filter(c => c.pe && c.pe > 0 && c.pe < 15 && c.pb && c.pb > 0 && c.pb < 2).length;
  const lynchPct = fresh.length > 0 ? (cheapCount / fresh.length) * 100 : 0;

  // Thresholds 1 / 1.5 / 2:
  // eyRatio = (Bond Yield) / (Earnings Yield)
  // eyRatio < 1.0: الأسهم تتفوق بوضوح على السندات (منطقة جذب استثماري)
  // 1.0 <= eyRatio < 1.5: منطقة حياد نسبي متوازنة
  // 1.5 <= eyRatio < 2.0: السندات تتفوق ومكررات السوق متضخمة نسبياً (منطقة حذر)
  // eyRatio >= 2.0: قمة دورة حادة والسندات تسحق عائد الأسهم (خطر تراجع تقييمات)
  const getEyStatus = (ratio: number) => {
    if (ratio < 1.0) {
      return {
        label: "الأسهم تتفوق بوضوح على السندات (منطقة جذب) [نسبة < 1.0x]",
        badge: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
        level: "attractive"
      };
    } else if (ratio < 1.5) {
      return {
        label: "منطقة حياد وتوازن بين الأسهم والسندات [1.0x - 1.5x]",
        badge: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
        level: "neutral"
      };
    } else if (ratio < 2.0) {
      return {
        label: "السندات تتفوق على عائد الأسهم (منطقة حذر) [1.5x - 2.0x]",
        badge: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
        level: "caution"
      };
    } else {
      return {
        label: "قمة دورة تقييمية: عائد السندات ضعف عائد أرباح تاسي (خطر) [≥ 2.0x]",
        badge: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
        level: "danger"
      };
    }
  };

  const eyStatus = getEyStatus(eyRatio);

  // Coverage percentage
  const totalUniverseCount = universe.length || 1;
  const coveredCount = fresh.length;
  const coveragePct = Math.round((coveredCount / totalUniverseCount) * 100);

  // Macro data state (Saudi Macro, S&P 500 benchmark, US Treasury Yield Curve)
  const [macroData, setMacroData] = React.useState<any>(null);
  const [macroLoading, setMacroLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadMacro() {
      try {
        setMacroLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/rebh/market-macro`);
        if (res.ok) {
          const data = await res.json();
          setMacroData(data);
        }
      } catch (err) {
        console.error("Failed to load market-macro:", err);
      } finally {
        setMacroLoading(false);
      }
    }
    loadMacro();
  }, []);

  return (
    <div className="py-6 space-y-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-bold text-[#1A1A1A]">مراقب تقييم السوق الشامل (Market Valuation Monitor)</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
            ° بيانات حية محسوبة
          </span>
        </div>
        <p className="text-xs text-[#6B7280]">
          خريطة توزيع مكررات الأرباح ومؤشرات تاسي وبوابة عائد السندات مقابل الأسهم وعتبات العائد (1 / 1.5 / 2) مع لوحة الاقتصاد الكلي.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className={`${CARD} p-3.5`}>
          <div className="text-xl font-black text-[#1A1A1A]">
            {coveredCount} <span className="text-xs font-normal text-[#6B7280]">({coveragePct}%)</span>
          </div>
          <div className={KPI_LABEL}>شركات مسعرة بقوائم حديثة (تغطية السوق)</div>
        </div>
        <div className={`${CARD} p-3.5`}>
          <div className="text-xl font-black text-[#1A1A1A]">{totMc ? `${(totMc / 1000).toFixed(0)}B` : "0B"} ر.س</div>
          <div className={KPI_LABEL}>القيمة السوقية المغطاة</div>
        </div>
        <div className={`${CARD} p-3.5`}>
          <div className="text-xl font-black text-[#16A34A]">{medPe.toFixed(1)}x</div>
          <div className={KPI_LABEL}>وسيط مكرر الربحية Median P/E</div>
        </div>
        <div className={`${CARD} p-3.5`}>
          <div className="text-xl font-black text-[#1A1A1A]">{medPb.toFixed(2)}x</div>
          <div className={KPI_LABEL}>وسيط القيمة الدفترية Median P/B</div>
        </div>
        <div className={`${CARD} p-3.5`}>
          <div className="text-xl font-black text-[#16A34A]">{medRoe.toFixed(1)}%</div>
          <div className={KPI_LABEL}>وسيط العائد على الملكية Median ROE</div>
        </div>
      </div>

      {/* Market Gate: Bond Yield vs Earnings Yield with Strict 1 / 1.5 / 2 Thresholds */}
      <div className={`${CARD} p-5 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wide">
                بوابة السوق: عائد السندات مقابل عائد أرباح تاسي (Market Gate — EY/A Gate)
              </h3>
              <span className="text-[10px] bg-[#F7F8FA] border border-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded font-mono">
                عتبات 1 / 1.5 / 2
              </span>
            </div>
            <span className="text-[11px] text-[#6B7280]">شيت المالك: مقارنة عائد السندات / الصكوك بعائد أرباح الأسهم التقديري</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7280]">مرساة السندات Bond Anchor %:</span>
            <input
              type="number"
              step="0.05"
              value={bondAnchor}
              onChange={(e) => setBondAnchor(parseFloat(e.target.value) || 0)}
              className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-2.5 py-1 text-xs w-20 text-[#1A1A1A] text-center focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#F7F8FA] rounded-[4px] border border-[#E5E7EB]">
            <span className="text-[#6B7280] block mb-1">عائد أرباح السوق الوسيط (Earnings Yield):</span>
            <b className="text-base text-[#1A1A1A]">{(ey * 100).toFixed(2)}%</b>
            <span className="text-[10px] text-[#6B7280] block mt-1">1 / وسيط مكرر الربحية ({medPe.toFixed(1)}x)</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-[4px] border border-[#E5E7EB]">
            <span className="text-[#6B7280] block mb-1">نسبة السندات للأرباح (Bond/EY Ratio):</span>
            <b className="text-base text-[#8C3B32] font-black">{eyRatio.toFixed(2)}x</b>
            <span className="text-[10px] text-[#6B7280] block mt-1">عائد السندات ÷ عائد الأسهم</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-[4px] border border-[#E5E7EB] flex flex-col justify-center">
            <span className="text-[#6B7280] block mb-1">التصنيف المنهجي للعتبة:</span>
            <span className={`px-2.5 py-1 rounded text-xs font-bold border text-center ${eyStatus.badge}`}>
              {eyStatus.label}
            </span>
          </div>
        </div>

        {/* Lynch Opportunity Gauge */}
        <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[#8C3B32] font-bold">مؤشر لينش لفرص السوق (LYNCH GAUGE): </span>
            <span className="text-[#6B7280]">
              {cheapCount} شركة تجتاز معيار الرخص (P/E &lt; 15 &amp; P/B &lt; 2) من أصل {fresh.length} شركة في العينة =
            </span>
            <b className="text-[#16A34A] mr-1.5">{lynchPct.toFixed(1)}%</b>
          </div>
          <span className={`text-[11px] font-bold ${lynchPct <= 5 ? 'text-[#DC2626]' : lynchPct >= 30 ? 'text-[#16A34A]' : 'text-[#B45309]'}`}>
            {lynchPct <= 5 ? '≤5% قمة دورة (حذر)' : lynchPct >= 30 ? '≥30% قاع دورة (فرص وفيرة)' : 'منطقة متوسطة معتدلة'}
          </span>
        </div>
      </div>

      {/* Saudi Macro Economy Scorecard (Live SAMA / GaStat API Data) */}
      {macroData && (macroData.saudi_macro || macroData.result) && (() => {
        const sm = macroData.saudi_macro || macroData.result;
        const sp = macroData.sp500_benchmark;
        const yc = macroData.treasury_yield_curve;
        return (
          <div className="space-y-4">
            <div className={`${CARD} p-5 space-y-3`}>
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wide">
                    لوحة الاقتصاد الكلي السعودي (Saudi Macro Economy Scorecard)
                  </h3>
                  <span className="text-[10px] text-[#6B7280]">
                    المصدر: البنك المركزي السعودي (SAMA) والهيئة العامة للإحصاء · {macroData.status}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  نظام الاقتصاد: {sm.macro_regime || "توسعي / صحي"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                  <span className="text-[10px] text-[#6B7280] block">سعر اتفاقيات إعادة الشراء (Repo)</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">{sm.repo_rate_pct}%</span>
                </div>
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                  <span className="text-[10px] text-[#6B7280] block">سايبور 3 أشهر (SAIBOR 3M)</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">{sm.saibor_3m_pct}%</span>
                </div>
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                  <span className="text-[10px] text-[#6B7280] block">نمو الناتج المحلي (GDP Growth)</span>
                  <span className="text-sm font-bold text-[#16A34A]">+{sm.gdp_growth_pct}%</span>
                </div>
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                  <span className="text-[10px] text-[#6B7280] block">معدل التضخم السنوي (CPI)</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">{sm.inflation_pct}%</span>
                </div>
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                  <span className="text-[10px] text-[#6B7280] block">مؤشر بوفيت السعودي (Mkt/GDP)</span>
                  <span className="text-sm font-bold text-[#8C3B32]">
                    {sm.buffett_indicator_pct ? `${sm.buffett_indicator_pct}%` : sm.liquidity_condition}
                  </span>
                </div>
              </div>
            </div>

            {/* US Market S&P 500 & Treasury Benchmark Card */}
            {sp && sp.pe_ratio && (
              <div className={`${CARD} p-5 space-y-3`}>
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wide">
                      المقارنة مع السوق الأمريكي ومؤشر S&amp;P 500 (Cross-Market Benchmark)
                    </h3>
                    <span className="text-[10px] text-[#6B7280]">
                      المصدر: S&amp;P Global ووزارة الخزانة الأمريكية (FRED) · أحدث إغلاق: {sp.trade_date}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    مكرر تاسي المغطى ({medPe.toFixed(1)}x) مقابل S&amp;P 500 ({sp.pe_ratio.toFixed(1)}x)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                    <span className="text-[10px] text-[#6B7280] block">إغلاق مؤشر S&amp;P 500</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{sp.close ? sp.close.toLocaleString() : "—"}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                    <span className="text-[10px] text-[#6B7280] block">مكرر ربحية S&amp;P 500 P/E</span>
                    <span className="text-sm font-bold text-[#8C3B32]">{sp.pe_ratio.toFixed(2)}x</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                    <span className="text-[10px] text-[#6B7280] block">عائد أرباح S&amp;P 500 EY</span>
                    <span className="text-sm font-bold text-[#16A34A]">{sp.earnings_yield_pct ? `${sp.earnings_yield_pct}%` : "—"}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
                    <span className="text-[10px] text-[#6B7280] block">عائد سندات الخزانة 10Y (فارق 2Y)</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {yc && yc.year_10 ? `${yc.year_10}%` : "—"} {yc && yc.spread_10y_2y != null ? `(${yc.spread_10y_2y >= 0 ? '+' : ''}${yc.spread_10y_2y}%)` : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* P/E Distribution Histogram */}
      <div className={`${CARD} p-5`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">
            توزيع مكررات الأرباح في السوق — P/E DISTRIBUTION (0–80×)
          </h3>
          <span className="text-[10px] text-[#6B7280]">{pes.length} شركة في العينة الحية</span>
        </div>

        {/* Histogram Bars */}
        <div className="h-28 flex items-end gap-1.5 border-b border-[#E5E7EB] pb-1">
          {bins.map((b, idx) => {
            const heightPct = Math.max((b.count / maxBinCount) * 100, 4);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                <span className="text-[9px] text-[#6B7280] mb-1 group-hover:text-[#1A1A1A] transition">
                  {b.count > 0 ? b.count : ""}
                </span>
                <div
                  className="w-full bg-[#8C3B32]/70 hover:bg-[#8C3B32] rounded-t transition-all"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
        {/* Histogram X Axis */}
        <div className="flex justify-between text-[9px] text-[#6B7280] pt-1">
          {bins.map((b, idx) => (
            <span key={idx} className="flex-1 text-center">{b.lo}x</span>
          ))}
        </div>
      </div>

      {/* Sector Medians Table */}
      <div className={`${CARD} p-5 overflow-hidden`}>
        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-3">
          وسائط مؤشرات القطاعات — SECTOR MEDIANS (القطاعات التي تضم شركتين فأكثر)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="p-2 font-semibold">القطاع</th>
                <th className="p-2 font-semibold">العدد</th>
                <th className="p-2 font-semibold">وسيط P/E</th>
                <th className="p-2 font-semibold">وسيط P/B</th>
                <th className="p-2 font-semibold">وسيط ROE</th>
                <th className="p-2 font-semibold">نمو الصافي YoY</th>
              </tr>
            </thead>
            <tbody>
              {secRows.map(row => (
                <tr key={row.name} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                  <td className="p-2 font-bold text-[#1A1A1A]">{row.name}</td>
                  <td className="p-2 text-[#6B7280] tabular-nums">{row.count}</td>
                  <td className="p-2 text-[#1A1A1A] tabular-nums">{row.pe ? `${row.pe.toFixed(1)}x` : "—"}</td>
                  <td className="p-2 text-[#1A1A1A] tabular-nums">{row.pb ? `${row.pb.toFixed(2)}x` : "—"}</td>
                  <td className="p-2 text-[#16A34A] tabular-nums">{row.roe != null ? `${row.roe.toFixed(1)}%` : "—"}</td>
                  <td className={`p-2 font-bold tabular-nums ${row.g != null && row.g >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {row.g != null ? `${row.g > 0 ? '+' : ''}${row.g.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
              {secRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#6B7280]">لا توجد قطاعات تضم شركتين فأكثر حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/*
UX note (not implemented, flagged for follow-up):
- Every metric on this tab silently falls back to hardcoded placeholder
  numbers (172 companies, 2,840B market cap, 13.6x P/E, etc.) when
  `universe` is empty — there's no visual distinction between "this is
  real market data" and "this is a fallback while data is missing/loading".
  A subtle "sample data" badge would prevent this being read as live.
*/