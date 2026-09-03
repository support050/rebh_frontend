"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TradeRecord {
  sym: string;
  shares: number;
  buyPx: number;
  sellPx: number;
  why: string;
}

export default function TradeJournalTab() {
  const [trades, setTrades] = useState<TradeRecord[]>([
    { sym: "1120", shares: 200, buyPx: 58, sellPx: 64.4, why: "تسارع أرباح + دخول المنطقة الفضية" },
    { sym: "7010", shares: 300, buyPx: 39, sellPx: 43.7, why: "دخول منطقة الأمان وكسر فيشر" },
    { sym: "4300", shares: 500, buyPx: 22, sellPx: 20.3, why: "خروج: انخفاض التغطية تحت 2x" },
    { sym: "2030", shares: 150, buyPx: 48, sellPx: 51.2, why: "حزام قاع الدورة لمولودوفسكي" },
    { sym: "1010", shares: 400, buyPx: 18.5, sellPx: 20.2, why: "تحسن قصة هامش الفائدة NIM" },
    { sym: "2222", shares: 250, buyPx: 28, sellPx: 26.6, why: "خروج: توقف حداثة القوائم" },
  ]);

  const [sym, setSym] = useState("");
  const [shares, setShares] = useState("");
  const [buyPx, setBuyPx] = useState("");
  const [sellPx, setSellPx] = useState("");
  const [why, setWhy] = useState("");

  const addTrade = () => {
    if (!sym || !shares || !buyPx || !sellPx) return;
    setTrades(prev => [
      ...prev,
      {
        sym: sym.trim().toUpperCase(),
        shares: parseFloat(shares),
        buyPx: parseFloat(buyPx),
        sellPx: parseFloat(sellPx),
        why: why.trim() || "صفقة تداول منهجية",
      }
    ]);
    setSym("");
    setShares("");
    setBuyPx("");
    setSellPx("");
    setWhy("");
  };

  const removeTrade = (idx: number) => {
    setTrades(prev => prev.filter((_, i) => i !== idx));
  };

  // Minervini & Al-Amer Mathematical Formula Calculations
  const computedTrades = trades.map(t => {
    const amt = t.shares * t.buyPx;
    const pnl = t.shares * (t.sellPx - t.buyPx);
    const retPct = (t.sellPx / t.buyPx - 1) * 100;
    return { ...t, amt, pnl, retPct };
  });

  const totalCap = computedTrades.reduce((sum, t) => sum + t.amt, 0);
  const netPnl = computedTrades.reduce((sum, t) => sum + t.pnl, 0);

  const winning = computedTrades.filter(t => t.retPct > 0);
  const losing = computedTrades.filter(t => t.retPct <= 0);

  const winRate = computedTrades.length > 0 ? (winning.length / computedTrades.length) * 100 : 0;
  const avgGain = winning.length > 0 ? winning.reduce((sum, t) => sum + t.retPct, 0) / winning.length : 0;
  const avgLoss = losing.length > 0 ? Math.abs(losing.reduce((sum, t) => sum + t.retPct, 0) / losing.length) : 0;

  const rrRatio = avgLoss > 0 ? avgGain / avgLoss : null;
  // Expectancy = (Win% * AvgGain) - (Loss% * AvgLoss)
  const expectancy = (winRate / 100 * avgGain) - ((100 - winRate) / 100 * avgLoss);

  return (
    <div className="py-6 space-y-6">
      {/* Tab Header */}
      <div>
        <h2 className="text-base font-bold text-white mb-1">Trade Journal — سجل وانضباط الصفقات (جلسة العامر + معادلة مينرفيني)</h2>
        <p className="text-xs text-[#a7b1bd]">
          سجل صفقات حقيقي لحساب نسبة المصداقية Win Rate ومعدل العائد للمخاطرة R/R والأمل الرياضي Expectancy مع قاعدة قيد الخسارة ≤3%.
        </p>
      </div>

      {/* Add Trade Bar */}
      <div className="flex flex-wrap gap-2.5 items-center bg-[#121924] p-4 rounded-xl border border-[#1e2836]">
        <input
          type="text"
          placeholder="الرمز (مثال 1120)"
          value={sym}
          onChange={(e) => setSym(e.target.value)}
          className="bg-[#0e1218] border border-[#1e2836] rounded px-3 py-2 text-xs w-32 font-mono text-white focus:outline-none"
        />
        <input
          type="number"
          placeholder="الأسهم"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="bg-[#0e1218] border border-[#1e2836] rounded px-3 py-2 text-xs w-28 font-mono text-white focus:outline-none"
        />
        <input
          type="number"
          step="0.01"
          placeholder="سعر الشراء"
          value={buyPx}
          onChange={(e) => setBuyPx(e.target.value)}
          className="bg-[#0e1218] border border-[#1e2836] rounded px-3 py-2 text-xs w-28 font-mono text-white focus:outline-none"
        />
        <input
          type="number"
          step="0.01"
          placeholder="سعر البيع"
          value={sellPx}
          onChange={(e) => setSellPx(e.target.value)}
          className="bg-[#0e1218] border border-[#1e2836] rounded px-3 py-2 text-xs w-28 font-mono text-white focus:outline-none"
        />
        <input
          type="text"
          placeholder="سبب الدخول والخروج المنهجي (إلزامي)"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          className="bg-[#0e1218] border border-[#1e2836] rounded px-3 py-2 text-xs flex-1 min-w-[200px] text-white focus:outline-none"
        />
        <button
          onClick={addTrade}
          className="px-4 py-2 bg-[#3987e5] hover:bg-blue-600 text-white rounded text-xs font-bold font-mono transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          تسجيل الصفقة
        </button>
      </div>

      {/* KPIs Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-center">
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className="text-lg font-black text-white">{trades.length}</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">الصفقات (ربح {winning.length} / خسارة {losing.length})</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className={`text-lg font-black ${winRate >= 60 ? 'text-emerald-400' : winRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            {winRate.toFixed(0)}%
          </div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">نسبة النجاح Win Rate (≥60% ممتاز)</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className="text-lg font-black text-emerald-400">+{avgGain.toFixed(1)}%</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">متوسط الربح في الرابحة</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className="text-lg font-black text-rose-400">-{avgLoss.toFixed(1)}%</div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">متوسط الخسارة في الخاسرة</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className={`text-lg font-black ${rrRatio && rrRatio >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {rrRatio ? `${rrRatio.toFixed(2)}x` : "—"}
          </div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">معدل العائد/المخاطرة R/R (≥3)</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className={`text-lg font-black ${expectancy > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {expectancy > 0 ? `+${expectancy.toFixed(2)}%` : `${expectancy.toFixed(2)}%`}
          </div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">الأمل الرياضي Expectancy (&gt;0)</div>
        </div>
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-3">
          <div className={`text-lg font-black ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnl >= 0 ? `+${netPnl.toLocaleString()}` : netPnl.toLocaleString()} ر.س
          </div>
          <div className="text-[10px] text-[#657081] uppercase mt-1">صافي الأرباح المحققة P&amp;L</div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 overflow-hidden">
        <h3 className="text-xs font-bold text-[#657081] uppercase font-mono tracking-wider mb-3">
          سجل الصفقات الموثقة — TRADE LOG
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-right">
            <thead>
              <tr className="text-[#657081] border-b border-[#1e2836]">
                <th className="pb-2">الرمز</th>
                <th className="pb-2">الكمية</th>
                <th className="pb-2">الشراء</th>
                <th className="pb-2">البيع</th>
                <th className="pb-2">العائد %</th>
                <th className="pb-2">الربح/الخسارة</th>
                <th className="pb-2">نسبة رأس المال</th>
                <th className="pb-2 text-right">السبب المنهجي</th>
                <th className="pb-2 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2836]">
              {computedTrades.map((t, idx) => {
                const capPct = totalCap > 0 ? (t.amt / totalCap * 100).toFixed(1) : "0";
                const isTooBigLoss = t.pnl < 0 && (Math.abs(t.pnl) / totalCap) > 0.03;
                return (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-bold text-white">{t.sym}</td>
                    <td className="py-2.5 text-[#a7b1bd]">{t.shares}</td>
                    <td className="py-2.5 text-white">{t.buyPx.toFixed(2)}</td>
                    <td className="py-2.5 text-white">{t.sellPx.toFixed(2)}</td>
                    <td className={`py-2.5 font-bold ${t.retPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.retPct > 0 ? `+${t.retPct.toFixed(1)}%` : `${t.retPct.toFixed(1)}%`}
                    </td>
                    <td className={`py-2.5 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.pnl > 0 ? `+${t.pnl.toLocaleString()}` : t.pnl.toLocaleString()} ر.س
                    </td>
                    <td className="py-2.5 text-[#a7b1bd]">
                      <span>{capPct}%</span>
                      {isTooBigLoss && <span className="text-rose-400 text-[10px] mr-1">⚑&gt;3% خرق للقيد</span>}
                    </td>
                    <td className="py-2.5 text-[#657081] font-sans">{t.why}</td>
                    <td className="py-2.5 text-center">
                      <button onClick={() => removeTrade(idx)} className="text-[#657081] hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
