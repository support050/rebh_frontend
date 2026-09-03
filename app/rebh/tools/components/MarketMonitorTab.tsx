"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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

  return (
    <div className="py-6 space-y-6">
      {/* Top Section Header */}
      <div>
        <h2 className="text-base font-bold text-white mb-1">Market Valuation Monitor — مراقب تقييم السوق الشامل</h2>
        <p className="text-xs text-[#a7b1bd]">
          خريطة توزيع مكررات الأرباح ومؤشرات تاسي وبوابة عائد السندات مقابل الأسهم (وفق شيت المالك وحزمة الكود الأصلي).
        </p>
      </div>

      {/* KPI Cards (Exact match to tools_template.html) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3.5">
          <div className="text-xl font-black text-white">{fresh.length || 172}</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">شركات مسعرة بقوائم حديثة</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3.5">
          <div className="text-xl font-black text-[#d9b64a]">{totMc ? `${(totMc / 1000).toFixed(0)}B` : "2,840B"} ر.س</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">القيمة السوقية المغطاة°</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3.5">
          <div className="text-xl font-black text-emerald-400">{medPe.toFixed(1)}x</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">وسيط مكرر الربحية Median P/E°</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3.5">
          <div className="text-xl font-black text-[#63a5f0]">{medPb.toFixed(2)}x</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">وسيط القيمة الدفترية Median P/B°</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3.5">
          <div className="text-xl font-black text-emerald-400">{medRoe.toFixed(1)}%</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">وسيط العائد على الملكية Median ROE°</div>
        </div>
      </div>

      {/* Market Gate: Bond Yield vs Earnings Yield (Yardeni / Khurafshi Sheet Gate) */}
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2836] pb-3">
          <div>
            <h3 className="text-xs font-bold font-mono text-[#d9b64a] uppercase tracking-wider">
              بوابة السوق: عائد السندات مقابل عائد أرباح تاسي (Market Gate — EY/A Gate)
            </h3>
            <span className="text-[11px] text-[#657081]">شيت المالك: مقارنة عائد السندات / الصكوك بعائد أرباح الأسهم التقديري</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#a7b1bd]">مرساة السندات Bond Anchor %:</span>
            <input
              type="number"
              step="0.05"
              value={bondAnchor}
              onChange={(e) => setBondAnchor(parseFloat(e.target.value) || 0)}
              className="bg-[#0e1218] border border-[#1e2836] rounded px-2.5 py-1 text-xs w-20 text-white text-center focus:outline-none focus:border-[#3987e5]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[#657081]">عائد أرباح السوق الوسيط (Earnings Yield°): </span>
            <b className="text-white">{(ey * 100).toFixed(2)}%</b>
          </div>
          <div>
            <span className="text-[#657081]">نسبة السندات للأرباح (Bond/EY Ratio°): </span>
            <b className={`text-sm ${eyRatio > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>{eyRatio.toFixed(2)}x</b>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${eyRatio > 1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
            {eyRatio > 1 ? 'السندات تتفوق على عائد الأسهم (حذر)' : 'الأسهم تتفوق على عائد السندات (منطقة جذب)'}
          </span>
        </div>

        {/* Lynch Opportunity Gauge */}
        <div className="pt-3 border-t border-[#1e2836] flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[#d9b64a] font-bold">مؤشر لينش لفرص السوق (LYNCH GAUGE°): </span>
            <span className="text-[#a7b1bd]">
              {cheapCount} شركة تجتاز معيار الرخص (P/E &lt; 15 &amp; P/B &lt; 2) من أصل {fresh.length} شركة = 
            </span>
            <b className="text-emerald-400 mr-1.5">{lynchPct.toFixed(1)}%</b>
          </div>
          <span className={`text-[11px] font-bold ${lynchPct <= 5 ? 'text-rose-400' : lynchPct >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {lynchPct <= 5 ? '≤5% قمة دورة (حذر)' : lynchPct >= 30 ? '≥30% قاع دورة (فرص وفيرة)' : 'منطقة متوسطة معتدلة'}
          </span>
        </div>
      </div>

      {/* P/E Distribution Histogram (Visual Chart directly matching template) */}
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#657081] uppercase font-mono tracking-wider">
            توزيع مكررات الأرباح في السوق — P/E DISTRIBUTION (0–80×)
          </h3>
          <span className="text-[10px] text-[#657081] font-mono">{pes.length} شركة في العينة الحية</span>
        </div>

        {/* Histogram Bars */}
        <div className="h-28 flex items-end gap-1.5 border-b border-[#1e2836] pb-1">
          {bins.map((b, idx) => {
            const heightPct = Math.max((b.count / maxBinCount) * 100, 4);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                <span className="text-[9px] font-mono text-[#657081] mb-1 group-hover:text-white transition">
                  {b.count > 0 ? b.count : ""}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-[#3987e5] to-[#63a5f0] hover:bg-[#d9b64a] rounded-t transition-all"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
        {/* Histogram X Axis */}
        <div className="flex justify-between text-[9px] font-mono text-[#657081] pt-1">
          {bins.map((b, idx) => (
            <span key={idx} className="flex-1 text-center">{b.lo}x</span>
          ))}
        </div>
      </div>

      {/* Sector Medians Table */}
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 overflow-hidden">
        <h3 className="text-xs font-bold text-[#657081] uppercase font-mono tracking-wider mb-3">
          وسائط مؤشرات القطاعات — SECTOR MEDIANS° (القطاعات التي تضم شركتين فأكثر)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-right">
            <thead>
              <tr className="text-[#657081] border-b border-[#1e2836]">
                <th className="pb-2">القطاع</th>
                <th className="pb-2">العدد</th>
                <th className="pb-2">وسيط P/E°</th>
                <th className="pb-2">وسيط P/B°</th>
                <th className="pb-2">وسيط ROE°</th>
                <th className="pb-2">نمو الصافي YoY°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2836]">
              {secRows.map(row => (
                <tr key={row.name} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 font-sans font-bold text-white">{row.name}</td>
                  <td className="py-2.5 text-[#657081]">{row.count}</td>
                  <td className="py-2.5 text-white">{row.pe ? `${row.pe.toFixed(1)}x` : "—"}</td>
                  <td className="py-2.5 text-white">{row.pb ? `${row.pb.toFixed(2)}x` : "—"}</td>
                  <td className="py-2.5 text-emerald-400">{row.roe != null ? `${row.roe.toFixed(1)}%` : "—"}</td>
                  <td className={`py-2.5 font-bold ${row.g != null && row.g >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.g != null ? `${row.g > 0 ? '+' : ''}${row.g.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
