"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, Download, RotateCcw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface TradeRecord {
  id: string;
  sym: string;
  shares: number;
  buyPx: number;
  sellPx: number;
  tradeDate: string;
  why: string;
  exitReason?: string;
  rMultiple?: number;
}

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const INPUT = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";
const BTN_PRIMARY = "px-4 py-2 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition flex items-center gap-1.5";
const KPI_LABEL = "text-[10px] text-[#6B7280] uppercase tracking-wide mt-1";
const STORAGE_KEY = "rebh_trades_journal";

export default function TradeJournalTab() {
  // Empty production state by default, loaded from backend API & localStorage
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [portfolioCapital, setPortfolioCapital] = useState<number>(100000);

  useEffect(() => {
    async function loadJournal() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
          credentials: "include"
        });
        if (res.ok) {
          const serverTrades = await res.json();
          if (Array.isArray(serverTrades) && serverTrades.length > 0) {
            setTrades(serverTrades.map((t: any) => ({
              id: String(t.id),
              sym: t.symbol || t.sym,
              shares: t.shares,
              buyPx: t.buy_price ?? t.buyPx,
              sellPx: t.sell_price ?? t.sellPx,
              tradeDate: t.trade_date || t.tradeDate,
              why: t.reason || "صفقة تداول استثمارية منهجية",
              exitReason: t.exit_reason || t.exitReason || "تحقيق الهدف أو إعادة توازن"
            })));
            setIsLoaded(true);
            return;
          }
        }
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTrades(parsed);
          }
        }
        const savedCap = localStorage.getItem("rebh_portfolio_capital");
        if (savedCap) {
          setPortfolioCapital(parseFloat(savedCap) || 100000);
        }
      } catch (e) {
        console.error("Failed to load trades journal from API:", e);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTrades(parsed);
        }
      } finally {
        setIsLoaded(true);
      }
    }
    loadJournal();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error("Failed to persist trades:", e);
    }
  }, [trades, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("rebh_portfolio_capital", portfolioCapital.toString());
    } catch (e) {
      console.error("Failed to persist portfolio capital:", e);
    }
  }, [portfolioCapital, isLoaded]);

  const [sym, setSym] = useState("");
  const [shares, setShares] = useState("");
  const [buyPx, setBuyPx] = useState("");
  const [sellPx, setSellPx] = useState("");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [why, setWhy] = useState("");
  const [exitReason, setExitReason] = useState("");

  const addTrade = async () => {
    if (!sym || !shares || !buyPx || !sellPx) return;
    const s = parseFloat(shares);
    const b = parseFloat(buyPx);
    const sel = parseFloat(sellPx);
    if (s <= 0 || b <= 0 || sel <= 0) return;

    const payload = {
      symbol: sym.trim().toUpperCase(),
      trade_type: "buy",
      shares: s,
      buy_price: b,
      sell_price: sel,
      status: "closed",
      reason: why.trim() || "صفقة تداول استثمارية منهجية",
      exit_reason: exitReason.trim() || "تحقيق الهدف أو إعادة توازن",
      trade_date: tradeDate || new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = res.ok ? await res.json() : null;
      const recId = data?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const newRecord: TradeRecord = {
        id: String(recId),
        sym: payload.symbol,
        shares: s,
        buyPx: b,
        sellPx: sel,
        tradeDate: payload.trade_date,
        why: payload.reason,
        exitReason: payload.exit_reason,
      };

      setTrades(prev => [newRecord, ...prev]);
    } catch (_) {
      const newRecord: TradeRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sym: payload.symbol,
        shares: s,
        buyPx: b,
        sellPx: sel,
        tradeDate: payload.trade_date,
        why: payload.reason,
        exitReason: payload.exit_reason,
      };
      setTrades(prev => [newRecord, ...prev]);
    }

    setSym("");
    setShares("");
    setBuyPx("");
    setSellPx("");
    setWhy("");
    setExitReason("");
  };

  const removeTrade = async (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`${API_BASE_URL}/api/rebh/journal/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch (_) {}
  };

  const clearJournal = () => {
    if (confirm("هل أنت متأكد من مسح جميع الصفقات المسجلة في السجل؟")) {
      setTrades([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  };

  const exportJournalCSV = () => {
    if (trades.length === 0) return;
    const headers = ["التاريخ", "الرمز", "الكمية", "سعر الشراء", "سعر البيع", "العائد %", "الربح/الخسارة", "أطروحة الدخول", "سبب الخروج"];
    const rows = trades.map(t => {
      const pnl = t.shares * (t.sellPx - t.buyPx);
      const retPct = ((t.sellPx / t.buyPx) - 1) * 100;
      return [
        t.tradeDate,
        t.sym,
        t.shares,
        t.buyPx,
        t.sellPx,
        retPct.toFixed(2),
        pnl.toFixed(2),
        `"${t.why.replace(/"/g, '""')}"`,
        `"${(t.exitReason || "").replace(/"/g, '""')}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rebh_trade_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Minervini & Al-Amer Mathematical Formula Calculations:
  // Return = Sell / Buy - 1
  // P&L = Shares * (Sell - Buy)
  // Expectancy = Win% * Avg Win - Loss% * Avg Loss
  // 3% Risk Rule: Loss should not exceed 3% of actual portfolio capital
  const computedTrades = trades.map(t => {
    const amt = t.shares * t.buyPx;
    const pnl = t.shares * (t.sellPx - t.buyPx);
    const retPct = (t.sellPx / t.buyPx - 1) * 100;
    // Loss as % of actual total portfolio capital
    const lossVsPortfolioPct = pnl < 0 ? (Math.abs(pnl) / portfolioCapital) * 100 : 0;
    const isOver3PctRisk = lossVsPortfolioPct > 3.0;

    return { ...t, amt, pnl, retPct, lossVsPortfolioPct, isOver3PctRisk };
  });

  const totalCap = computedTrades.reduce((sum, t) => sum + t.amt, 0);
  const netPnl = computedTrades.reduce((sum, t) => sum + t.pnl, 0);

  const winning = computedTrades.filter(t => t.retPct > 0);
  const losing = computedTrades.filter(t => t.retPct <= 0);

  const winRate = computedTrades.length > 0 ? (winning.length / computedTrades.length) * 100 : 0;
  const avgWin = winning.length > 0 ? winning.reduce((sum, t) => sum + t.retPct, 0) / winning.length : 0;
  const avgLoss = losing.length > 0 ? Math.abs(losing.reduce((sum, t) => sum + t.retPct, 0) / losing.length) : 0;

  const rrRatio = avgLoss > 0 ? avgWin / avgLoss : null;
  // Mathematical Expectancy
  const expectancy = ((winRate / 100) * avgWin) - (((100 - winRate) / 100) * avgLoss);

  return (
    <div className="py-6 space-y-6">
      {/* Tab Header & Portfolio Setting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-[#1A1A1A]">سجل وانضباط الصفقات (Trade Journal — جلسة العامر + معادلة مينرفيني)</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              حفظ دائم للمحفظة
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            سجل صفقات حقيقي لحساب نسبة المصداقية Win Rate ومعدل العائد للمخاطرة R/R والأمل الرياضي Expectancy مع قاعدة قيد الخسارة ≤3% من رأس مال المحفظة الفعلي.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-[4px] text-xs">
            <span className="text-[#6B7280]">رأس مال المحفظة الفعلي:</span>
            <input
              type="number"
              value={portfolioCapital}
              onChange={(e) => setPortfolioCapital(parseFloat(e.target.value) || 1)}
              className="w-28 font-bold text-[#1A1A1A] bg-[#F7F8FA] border border-[#E5E7EB] rounded px-2 py-0.5 text-center focus:outline-none focus:border-[#8C3B32]"
            />
            <span className="text-[#6B7280]">ر.س</span>
          </div>

          <button
            onClick={exportJournalCSV}
            disabled={trades.length === 0}
            className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#1A1A1A] rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#6B7280]" />
            تصدير CSV
          </button>
          {trades.length > 0 && (
            <button
              onClick={clearJournal}
              className="p-1.5 text-[#6B7280] hover:text-[#DC2626] transition"
              title="مسح السجل"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Add Trade Bar */}
      <div className={`flex flex-wrap gap-2.5 items-center ${CARD} p-4`}>
        <input
          type="date"
          value={tradeDate}
          onChange={(e) => setTradeDate(e.target.value)}
          className={`${INPUT} w-36`}
        />
        <input
          type="text"
          placeholder="الرمز (مثال 1120)"
          value={sym}
          onChange={(e) => setSym(e.target.value)}
          className={`${INPUT} w-28 font-bold`}
        />
        <input
          type="number"
          placeholder="الكمية"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className={`${INPUT} w-24`}
        />
        <input
          type="number"
          step="0.01"
          placeholder="شراء (ر.س)"
          value={buyPx}
          onChange={(e) => setBuyPx(e.target.value)}
          className={`${INPUT} w-24`}
        />
        <input
          type="number"
          step="0.01"
          placeholder="بيع (ر.س)"
          value={sellPx}
          onChange={(e) => setSellPx(e.target.value)}
          className={`${INPUT} w-24`}
        />
        <input
          type="text"
          placeholder="أطروحة الدخول المنهجية (مثال: تسارع أرباح + هامش أمان)"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          className={`${INPUT} flex-1 min-w-[180px]`}
        />
        <input
          type="text"
          placeholder="سبب الخروج"
          value={exitReason}
          onChange={(e) => setExitReason(e.target.value)}
          className={`${INPUT} w-36`}
        />
        <button onClick={addTrade} className={BTN_PRIMARY}>
          <Plus className="w-3.5 h-3.5" />
          تسجيل الصفقة
        </button>
      </div>

      {/* KPIs Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
        <div className={`${CARD} p-3`}>
          <div className="text-lg font-black text-[#1A1A1A]">{trades.length}</div>
          <div className={KPI_LABEL}>الصفقات (ربح {winning.length} / خسارة {losing.length})</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className={`text-lg font-black ${winRate >= 60 ? 'text-[#16A34A]' : winRate >= 50 ? 'text-[#B45309]' : 'text-[#DC2626]'}`}>
            {winRate.toFixed(0)}%
          </div>
          <div className={KPI_LABEL}>نسبة النجاح Win Rate (≥60% ممتاز)</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className="text-lg font-black text-[#16A34A]">+{avgWin.toFixed(1)}%</div>
          <div className={KPI_LABEL}>متوسط ربح الرابحة (Avg Win)</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className="text-lg font-black text-[#DC2626]">-{avgLoss.toFixed(1)}%</div>
          <div className={KPI_LABEL}>متوسط خسارة الخاسرة (Avg Loss)</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className={`text-lg font-black ${rrRatio && rrRatio >= 2 ? 'text-[#16A34A]' : 'text-[#B45309]'}`}>
            {rrRatio ? `${rrRatio.toFixed(2)}x` : "—"}
          </div>
          <div className={KPI_LABEL}>معدل العائد/المخاطرة (R/R)</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className={`text-lg font-black ${expectancy > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {expectancy > 0 ? `+${expectancy.toFixed(2)}%` : `${expectancy.toFixed(2)}%`}
          </div>
          <div className={KPI_LABEL}>الأمل الرياضي للصفقة (Expectancy)</div>
        </div>
        <div className={`${CARD} p-3`}>
          <div className={`text-lg font-black ${netPnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {netPnl >= 0 ? `+${netPnl.toLocaleString()}` : netPnl.toLocaleString()} ر.س
          </div>
          <div className={KPI_LABEL}>صافي الأرباح المحققة</div>
        </div>
      </div>

      {/* Trades Table */}
      <div className={`${CARD} p-5 overflow-hidden`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">
            سجل الصفقات المنهجية وقيد المخاطرة (قاعدة 3% من رأس المال = {(portfolioCapital * 0.03).toLocaleString()} ر.س كحد أقصى للخسارة)
          </h3>
          <span className="text-[10px] text-[#6B7280]">
            المجموع المستثمر بالصفقات: {totalCap.toLocaleString()} ر.س
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="p-2 font-semibold">التاريخ</th>
                <th className="p-2 font-semibold">الرمز</th>
                <th className="p-2 font-semibold">الكمية</th>
                <th className="p-2 font-semibold">الشراء</th>
                <th className="p-2 font-semibold">البيع</th>
                <th className="p-2 font-semibold">العائد %</th>
                <th className="p-2 font-semibold">الربح/الخسارة</th>
                <th className="p-2 font-semibold">مخاطرة المحفظة</th>
                <th className="p-2 font-semibold text-right">أطروحة الدخول</th>
                <th className="p-2 font-semibold text-right">سبب الخروج</th>
                <th className="p-2 font-semibold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {computedTrades.map((t) => (
                <tr key={t.id} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                  <td className="p-2 text-[#6B7280] tabular-nums whitespace-nowrap">{t.tradeDate}</td>
                  <td className="p-2 font-bold text-[#1A1A1A]">{t.sym}</td>
                  <td className="p-2 text-[#6B7280] tabular-nums">{t.shares.toLocaleString()}</td>
                  <td className="p-2 text-[#1A1A1A] tabular-nums">{t.buyPx.toFixed(2)}</td>
                  <td className="p-2 text-[#1A1A1A] tabular-nums">{t.sellPx.toFixed(2)}</td>
                  <td className={`p-2 font-bold tabular-nums ${t.retPct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {t.retPct > 0 ? `+${t.retPct.toFixed(1)}%` : `${t.retPct.toFixed(1)}%`}
                  </td>
                  <td className={`p-2 font-bold tabular-nums ${t.pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {t.pnl > 0 ? `+${t.pnl.toLocaleString()}` : t.pnl.toLocaleString()} ر.س
                  </td>
                  <td className="p-2 tabular-nums">
                    {t.pnl < 0 ? (
                      <div className="flex items-center gap-1">
                        <span className={t.isOver3PctRisk ? "text-[#DC2626] font-bold" : "text-[#6B7280]"}>
                          {t.lossVsPortfolioPct.toFixed(2)}%
                        </span>
                        {t.isOver3PctRisk && (
                          <span className="inline-flex items-center gap-0.5 text-[#DC2626] text-[10px] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            خرق 3%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#16A34A]">آمن ✓</span>
                    )}
                  </td>
                  <td className="p-2 text-[#1A1A1A]">{t.why}</td>
                  <td className="p-2 text-[#6B7280]">{t.exitReason || "—"}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeTrade(t.id)}
                      aria-label="حذف الصفقة"
                      className="text-[#6B7280] hover:text-[#DC2626] transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {computedTrades.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-[#6B7280]">
                    لا توجد صفقات مسجلة حالياً. استخدم الشريط أعلاه لتسجيل صفقاتك ومراقبة انضباط المخاطرة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}