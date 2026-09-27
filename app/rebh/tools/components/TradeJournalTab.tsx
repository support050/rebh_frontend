"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
    PlusCircle,
    CheckCircle2,
    TrendingUp,
    DollarSign,
    RefreshCw,
    AlertTriangle,
    ShieldAlert,
    ExternalLink,
    Download,
    RotateCcw,
} from "lucide-react";
import {
    Trade,
    TradeType,
    fetchJournalApi,
    createTradeApi,
    updateTradeApi,
    deleteTradeApi,
    toPayload,
    getRiyadhDateIso,
} from "@/lib/api/journal";
import {
    BENCHMARKS,
    computeJournalStats,
    computeTrade,
    formatNum,
    formatPct,
    formatSar,
} from "@/app/rebh/journal/utils";
import { KpiCard, Card, Button } from "@/app/rebh/journal/components/JournalUI";
import { TradeForm, CloseTradeDialog, ConfirmDialog } from "@/app/rebh/journal/components/TradeForm";
import { TradeTable } from "@/app/rebh/journal/components/TradeTable";

const STORAGE_KEY = "rebh-trade-journal-v2";
const CAPITAL_KEY = "rebh-trade-journal-capital-v2";

const DEMO_TRADES: Trade[] = [
    { id: "demo-1", symbol: "1120", type: "buy", shares: 200, buyPrice: 58, sellPrice: 64.4, reason: "تسارع أرباح ربعي + دخول عند المنطقة الفضية", status: "closed", createdAt: "2026-05-02", isLocalOnly: false },
    { id: "demo-2", symbol: "7010", type: "buy", shares: 300, buyPrice: 39, sellPrice: 43.7, reason: "دخول عند المنطقة الفضية — نمو مستدام", status: "closed", createdAt: "2026-05-10", isLocalOnly: false },
    { id: "demo-3", symbol: "4300", type: "buy", shares: 500, buyPrice: 22, sellPrice: 20.3, reason: "خروج: تغطية الفوائد أقل من 2× — كسر عنصر أمان", status: "closed", createdAt: "2026-05-18", isLocalOnly: false },
    { id: "demo-4", symbol: "2030", type: "buy", shares: 150, buyPrice: 48, sellPrice: 51.2, reason: "شراء عند نطاق قاع الدورة (14-16× أرباح القاع)", status: "closed", createdAt: "2026-06-01", isLocalOnly: false },
    { id: "demo-5", symbol: "1010", type: "buy", shares: 400, buyPrice: 18.5, sellPrice: 20.2, reason: "قصة تحسن هامش الفائدة الصافي (NIM)", status: "closed", createdAt: "2026-06-12", isLocalOnly: false },
    { id: "demo-6", symbol: "2222", type: "buy", shares: 250, buyPrice: 28, sellPrice: 26.6, reason: "خروج: القوائم المالية غير محدّثة (stale)", status: "closed", createdAt: "2026-06-20", isLocalOnly: false },
    { id: "demo-7", symbol: "1211", type: "buy", shares: 100, buyPrice: 72, sellPrice: null, reason: "مركز نشط — بانتظار نتائج الربع القادم", status: "active", createdAt: "2026-07-15", isLocalOnly: false },
];

function generateUuid(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TradeJournalTab() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [capital, setCapital] = useState<number>(BENCHMARKS.DEFAULT_CAPITAL);
    const [capitalInput, setCapitalInput] = useState<string>(String(BENCHMARKS.DEFAULT_CAPITAL));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncState, setSyncState] = useState<"synced" | "local" | "syncing">("syncing");

    // UI Dialog & Form States
    const [showForm, setShowForm] = useState(false);
    const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
    const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isInitialLoadRef = useRef(true);
    const activeAbortControllerRef = useRef<AbortController | null>(null);

    // Initial Load: Server primary with guarded fallback to localStorage & preserving local-only trades
    const loadJournal = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        setSyncState("syncing");

        try {
            // Read saved capital first (safe fallback)
            try {
                const rawCap = localStorage.getItem(CAPITAL_KEY);
                if (rawCap) {
                    const parsed = Number(rawCap);
                    if (!isNaN(parsed) && parsed > 0) {
                        setCapital(parsed);
                        setCapitalInput(String(parsed));
                    }
                }
            } catch {
                // Ignore localStorage errors
            }

            const res = await fetchJournalApi(signal);
            if (signal?.aborted) return;

            if (res.ok && res.trades) {
                // Read any pending local-only trades from localStorage and existing state
                let localUnsyncedFromStorage: Trade[] = [];
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            localUnsyncedFromStorage = parsed.filter(
                                (t: Trade) => t.isLocalOnly && !t.id.startsWith("demo-")
                            );
                        }
                    }
                } catch {
                    // Ignore parse error
                }

                setTrades((prev) => {
                    const currentLocal = prev.filter((t) => t.isLocalOnly && !t.id.startsWith("demo-"));
                    const allLocalCandidates = [...currentLocal, ...localUnsyncedFromStorage];
                    const serverIds = new Set(res.trades!.map((t) => t.id));

                    const seenLocalIds = new Set<string>();
                    const uniqueLocal: Trade[] = [];
                    for (const lt of allLocalCandidates) {
                        if (!serverIds.has(lt.id) && !seenLocalIds.has(lt.id)) {
                            seenLocalIds.add(lt.id);
                            uniqueLocal.push(lt);
                        }
                    }

                    return [...res.trades!, ...uniqueLocal];
                });
                setSyncState("synced");
            } else {
                setError(
                    res.status === 401
                        ? "جلسة غير مسجلة — يتم حفظ بيانات الصفقات على هذا المتصفح محلياً"
                        : "تعذر الاتصال بالخادم — يتم استخدام النسخة المحلية المخزنة"
                );
                setSyncState("local");
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            setTrades(parsed);
                        }
                    }
                } catch (e) {
                    console.error("Corrupt local storage data", e);
                }
            }
            isInitialLoadRef.current = false;
        } catch (e: unknown) {
            if ((e as Error)?.name === "AbortError") return;
            setError("حدث خطأ أثناء تحميل سجل الصفقات");
            setSyncState("local");
            isInitialLoadRef.current = false;
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const triggerRefresh = useCallback(() => {
        if (activeAbortControllerRef.current) {
            activeAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        activeAbortControllerRef.current = controller;
        loadJournal(controller.signal);
    }, [loadJournal]);

    useEffect(() => {
        const controller = new AbortController();
        activeAbortControllerRef.current = controller;
        loadJournal(controller.signal);
        return () => {
            activeAbortControllerRef.current?.abort();
        };
    }, [loadJournal]);

    // Persist to unified localStorage keys
    useEffect(() => {
        if (isInitialLoadRef.current) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
        } catch (e) {
            console.error("Failed to persist trades to localStorage", e);
        }
    }, [trades]);

    useEffect(() => {
        if (isInitialLoadRef.current) return;
        try {
            localStorage.setItem(CAPITAL_KEY, String(capital));
        } catch (e) {
            console.error("Failed to persist capital to localStorage", e);
        }
    }, [capital]);

    // Derived Computations & Stats
    const computedTrades = useMemo(() => {
        return trades.map((t) => computeTrade(t, capital));
    }, [trades, capital]);

    const stats = useMemo(() => {
        return computeJournalStats(computedTrades, capital);
    }, [computedTrades, capital]);

    // Actions
    async function handleAddTrade(newTradeData: {
        symbol: string;
        type: TradeType;
        shares: number;
        buyPrice: number;
        sellPrice: number | null;
        reason: string;
        createdAt?: string;
    }) {
        setIsSaving(true);
        const tradeDate = newTradeData.createdAt || getRiyadhDateIso();
        const payload = toPayload({
            ...newTradeData,
            status: newTradeData.sellPrice != null ? "closed" : "active",
            createdAt: tradeDate,
        });

        const tempId = generateUuid();
        const localTrade: Trade = {
            id: tempId,
            symbol: payload.symbol,
            type: payload.trade_type,
            shares: payload.shares,
            buyPrice: payload.buy_price,
            sellPrice: payload.sell_price,
            reason: payload.reason,
            status: payload.status,
            createdAt: payload.trade_date,
            isLocalOnly: true,
        };

        // Optimistic UI update
        setTrades((prev) => [localTrade, ...prev]);
        setShowForm(false);

        try {
            const res = await createTradeApi(payload);
            if (res.ok && res.serverId) {
                setTrades((prev) =>
                    prev.map((t) => (t.id === tempId ? { ...t, id: res.serverId!, isLocalOnly: false } : t))
                );
                setSyncState("synced");
            } else {
                setSyncState("local");
            }
        } catch (err) {
            console.error("Error creating trade on server", err);
            setSyncState("local");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleCloseTradeConfirm(exitPrice: number) {
        if (!closingTrade) return;
        const targetId = closingTrade.id;
        const original = trades.find((t) => t.id === targetId);
        if (!original) return;

        setTrades((prev) =>
            prev.map((t) => (t.id === targetId ? { ...t, sellPrice: exitPrice, status: "closed" } : t))
        );
        setClosingTrade(null);

        if (!original.isLocalOnly && !original.id.startsWith("demo-")) {
            try {
                const payload = toPayload({
                    ...original,
                    sellPrice: exitPrice,
                    status: "closed",
                });
                const res = await updateTradeApi(targetId, payload);
                if (!res.ok) {
                    setTrades((prev) => prev.map((t) => (t.id === targetId ? original : t)));
                    setError(`تعذر تحديث الصفقة على الخادم (${res.status}) — تم إلغاء الإغلاق`);
                }
            } catch (err) {
                console.error("Failed to update trade on server", err);
                setTrades((prev) => prev.map((t) => (t.id === targetId ? original : t)));
                setError("تعذر تحديث الصفقة بسبب انقطاع الاتصال — تم إلغاء الإغلاق");
            }
        }
    }

    async function handleDeleteTradeConfirm() {
        if (!tradeToDelete) return;
        const targetId = tradeToDelete.id;
        const target = trades.find((t) => t.id === targetId);
        if (!target) return;
        const targetIndex = trades.findIndex((t) => t.id === targetId);

        setTrades((prev) => prev.filter((t) => t.id !== targetId));
        setTradeToDelete(null);

        if (!target.isLocalOnly && !target.id.startsWith("demo-")) {
            try {
                const res = await deleteTradeApi(targetId);
                if (!res.ok) {
                    setTrades((prev) => {
                        const next = [...prev];
                        if (targetIndex >= 0 && targetIndex <= next.length) {
                            next.splice(targetIndex, 0, target);
                        } else {
                            next.push(target);
                        }
                        return next;
                    });
                    setError(`تعذر حذف الصفقة من الخادم (${res.status}) — تمت استعادة الصفقة`);
                }
            } catch (err) {
                console.error("Failed to delete trade on server", err);
                setTrades((prev) => {
                    const next = [...prev];
                    if (targetIndex >= 0 && targetIndex <= next.length) {
                        next.splice(targetIndex, 0, target);
                    } else {
                        next.push(target);
                    }
                    return next;
                });
                setError("تعذر حذف الصفقة بسبب انقطاع الاتصال — تمت استعادة الصفقة");
            }
        }
    }

    function handleLoadDemoConfirm() {
        setTrades(DEMO_TRADES);
        setShowDemoConfirm(false);
    }

    function handleClearConfirm() {
        setTrades([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore
        }
        setShowClearConfirm(false);
    }

    function handleCapitalBlur() {
        const val = Number(capitalInput);
        if (!isNaN(val) && val > 0) {
            setCapital(val);
        } else {
            setCapitalInput(String(capital));
        }
    }

    const exportJournalCSV = () => {
        if (computedTrades.length === 0) return;
        const headers = ["التاريخ", "الرمز", "النوع", "الحالة", "الكمية", "سعر الشراء", "سعر البيع", "العائد %", "الربح/الخسارة", "سبب الصفقة"];
        const rows = computedTrades.map((t) => {
            const retText = t.ret != null ? (t.ret * 100).toFixed(2) : "—";
            const pnlText = t.pnl != null ? t.pnl.toFixed(2) : "—";
            return [
                t.createdAt,
                t.symbol,
                t.type === "buy" ? "شراء" : "بيع",
                t.status === "closed" ? "مغلقة" : "نشطة",
                t.shares,
                t.buyPrice,
                t.sellPrice != null ? t.sellPrice : "—",
                retText,
                pnlText,
                `"${(t.reason || "").replace(/"/g, '""')}"`,
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

    return (
        <div className="py-6 space-y-6">
            {/* Tab Header & Direct Link to Full Journal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-base font-bold text-[#1A1A1A]">
                            سجل وانضباط الصفقات (Trade Journal — جلسة العامر + معادلة مينرفيني)
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                            قاعدة بيانات موحدة
                        </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                        تطبيق مباشر لمنهجية أحمد العامر في تسجيل الصفقات ومراقبة قاعدة قيد الخسارة ≤3% من رأس المال، وحساب الأمل الرياضي لمينرفيني.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Link to Full Page */}
                    <Link
                        href="/rebh/journal"
                        className="px-3 py-1.5 bg-[#FBEAE8] hover:bg-[#F7D8D3] text-[#8C3B32] border border-[#F0CFC9] rounded-[4px] text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                        <span>فتح الصفحة المستقلة الكاملة (مع دليل الباب 7)</span>
                        <ExternalLink size={13} />
                    </Link>

                    {/* Sync Indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono bg-white border border-[#E5E7EB] px-2.5 py-1.5 rounded-[4px]">
                        <span
                            className={`w-2 h-2 rounded-full ${syncState === "synced"
                                ? "bg-[#16A34A]"
                                : syncState === "local"
                                    ? "bg-[#B45309]"
                                    : "bg-[#2563EB] animate-pulse"
                                }`}
                        />
                        <span className="text-[#6B7280]">
                            {syncState === "synced"
                                ? "متصل ومُزامن"
                                : syncState === "local"
                                    ? "محلي (Local)"
                                    : "مزامنة…"}
                        </span>
                        <button
                            type="button"
                            onClick={triggerRefresh}
                            title="إعادة التحديث"
                            className="p-0.5 rounded text-[#6B7280] hover:text-[#1A1A1A] transition"
                        >
                            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Export CSV */}
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
                            onClick={() => setShowClearConfirm(true)}
                            className="p-1.5 text-[#6B7280] hover:text-[#DC2626] transition bg-white border border-[#E5E7EB] rounded-[4px]"
                            title="مسح الصفقات المحلية"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error or Alert banner */}
            {error && (
                <div
                    role="status"
                    className="p-3 rounded-[4px] bg-[#FFFBEB] border border-[#FDE68A] border-r-4 border-r-[#B45309] text-[12px] text-[#92400E] flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={15} />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-[11px] font-bold underline hover:text-[#78350F]"
                    >
                        تجاهل
                    </button>
                </div>
            )}

            {/* Oversized Losses Warning Banner */}
            {stats.oversizedLosses.length > 0 && (
                <div
                    role="status"
                    className="p-3.5 rounded-[4px] bg-[#FEF2F2] border border-[#FECACA] border-r-4 border-r-[#DC2626] text-[12.5px] text-[#DC2626] flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={18} className="shrink-0" />
                        <div>
                            <b>تنبيه انضباط ⚑:</b> يوجد {stats.oversizedLosses.length} صفقة تجاوزت خسارتها {BENCHMARKS.MAX_LOSS_PCT * 100}% من رأس المال الحالي ({formatNum(capital, 0)} SAR).
                            تذكر دائماً مبدأ أحمد العامر: <i>«حجم المركز، لا أمر وقف الخسارة، هو خط الدفاع الأول عن المحفظة»</i>.
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- KPI GRID ---------------- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <KpiCard
                    icon={<CheckCircle2 size={18} className={stats.winRate != null && stats.winRate >= BENCHMARKS.MIN_WIN_RATE ? "text-[#16A34A]" : "text-[#B45309]"} />}
                    label="معدل الربح (Win Rate)"
                    sublabel={`الهدف ≥ ${BENCHMARKS.MIN_WIN_RATE * 100}%`}
                    value={stats.winRate != null ? formatPct(stats.winRate * 100, 0, false) : "—"}
                    valueColor={
                        stats.winRate == null
                            ? "text-[#9CA3AF]"
                            : stats.winRate >= BENCHMARKS.MIN_WIN_RATE
                                ? "text-[#16A34A]"
                                : stats.winRate >= BENCHMARKS.MIN_WIN_RATE_FAIR
                                    ? "text-[#B45309]"
                                    : "text-[#DC2626]"
                    }
                    badge={stats.winRate != null && stats.winRate >= BENCHMARKS.MIN_WIN_RATE ? "ضمن معيار الدورة" : undefined}
                    honestyMark={stats.hasLowSample ? "⚠" : "°"}
                    honestyTooltip={stats.hasLowSample ? `⚠ عدد الصفقات المغلقة أقل من ${BENCHMARKS.MIN_SAMPLE_SIZE} صفقات` : "° محسوب من الصفقات المغلقة الفعلية"}
                    footnote={
                        stats.closedCount > 0
                            ? `${stats.wins} رابحة / ${stats.losses} خاسرة من إجمالي ${stats.closedCount} صفقة مغلقة`
                            : "لا توجد صفقات مغلقة بعد لاحتساب المعدل"
                    }
                />

                <KpiCard
                    icon={<TrendingUp size={18} className="text-[#2563EB]" />}
                    label="المكافأة / المخاطرة (R/R)"
                    sublabel={`الهدف ≥ ${BENCHMARKS.MIN_RR_TARGET.toFixed(1)}×`}
                    value={stats.rr != null ? `${formatNum(stats.rr, 2)}×` : "—"}
                    valueColor={
                        stats.rr == null
                            ? "text-[#9CA3AF]"
                            : stats.rr >= BENCHMARKS.MIN_RR_TARGET
                                ? "text-[#16A34A]"
                                : stats.rr >= BENCHMARKS.MIN_RR_ACCEPTABLE
                                    ? "text-[#B45309]"
                                    : "text-[#DC2626]"
                    }
                    badge={stats.rr != null && stats.rr >= BENCHMARKS.MIN_RR_TARGET ? `الهدف ≥ ${BENCHMARKS.MIN_RR_TARGET}×` : undefined}
                    honestyMark={stats.hasLowSample ? "⚠" : "°"}
                    honestyTooltip={
                        stats.hasLowSample
                            ? `⚠ عدد الصفقات المغلقة أقل من ${BENCHMARKS.MIN_SAMPLE_SIZE} صفقات`
                            : "° نسبة متوسط العائد في الصفقات الرابحة إلى متوسط الخسارة في الصفقات الخاسرة"
                    }
                    footnote={
                        stats.closedCount > 0
                            ? `متوسط ربح ${stats.avgGain != null ? formatPct(stats.avgGain * 100, 1) : "—"} / متوسط خسارة ${stats.avgLoss != null ? formatPct(-stats.avgLoss * 100, 1) : "لا توجد خسائر"}`
                            : "يتطلب صفقات رابحة وخاسرة لحساب النسبة"
                    }
                />

                <KpiCard
                    icon={<DollarSign size={18} className={stats.expectancyPct != null && stats.expectancyPct > 0 ? "text-[#16A34A]" : "text-[#DC2626]"} />}
                    label="التوقّع الرياضي (Expectancy)"
                    sublabel="رياضيات مينرفيني"
                    value={stats.expectancyPct != null ? formatPct(stats.expectancyPct * 100, 2) : "—"}
                    valueColor={
                        stats.expectancyPct == null
                            ? "text-[#9CA3AF]"
                            : stats.expectancyPct > 0
                                ? "text-[#16A34A]"
                                : "text-[#DC2626]"
                    }
                    honestyMark={stats.hasLowSample ? ["⚠", "≈"] : "≈"}
                    honestyTooltip={
                        stats.hasLowSample
                            ? `⚠ عدد الصفقات المغلقة أقل من ${BENCHMARKS.MIN_SAMPLE_SIZE} — ≈ تقدير بافتراض حجم مركز ${BENCHMARKS.POSITION_SIZE_RATIO * 100}% من رأس المال`
                            : `≈ تقدير القيمة النقدية بافتراض حجم مركز ${BENCHMARKS.POSITION_SIZE_RATIO * 100}% من رأس المال الحالي`
                    }
                    footnote={
                        stats.expectancySar != null
                            ? `${formatSar(stats.expectancySar, 0)} ≈ عائد متوقع لكل صفقة (بافتراض مركز ${BENCHMARKS.POSITION_SIZE_RATIO * 100}%)`
                            : stats.closedCount === 0
                                ? "لا توجد صفقات مغلقة بعد لاحتساب التوقع"
                                : stats.losses === 0
                                    ? "يتطلب وجود صفقات خاسرة مغلقة لتحديد متوسط الخسارة"
                                    : stats.wins === 0
                                        ? "يتطلب وجود صفقات رابحة مغلقة لتحديد متوسط الربح"
                                        : "المعادلة: (نسبة الربح × متوسط الربح) - (نسبة الخسارة × متوسط الخسارة)"
                    }
                />

                <KpiCard
                    icon={<DollarSign size={18} className={stats.netPnl >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"} />}
                    label="صافي الأرباح المحققة"
                    sublabel="الربح الفعلي"
                    value={formatSar(stats.netPnl, 0)}
                    valueColor={stats.netPnl > 0 ? "text-[#16A34A]" : stats.netPnl < 0 ? "text-[#DC2626]" : "text-[#1A1A1A]"}
                    honestyMark={stats.hasLowSample ? "⚠" : "°"}
                    honestyTooltip={
                        stats.hasLowSample
                            ? `⚠ عدد الصفقات المغلقة أقل من ${BENCHMARKS.MIN_SAMPLE_SIZE} صفقات`
                            : "° صافي ناتج الصفقات المغلقة بالريال السعودي"
                    }
                    footnote={`${stats.activeCount} مراكز نشطة حالياً تحت المتابعة`}
                />
            </section>

            {/* ---------------- CONTROLS ROW ---------------- */}
            <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[12px] text-[#4B5563]">
                        <span className="font-semibold whitespace-nowrap">رأس المال الإجمالي (SAR):</span>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={capitalInput}
                            onChange={(e) => setCapitalInput(e.target.value)}
                            onBlur={handleCapitalBlur}
                            className="w-36 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-[13px] font-mono tabular-nums font-bold text-[#1A1A1A] outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 dir-ltr text-right"
                            title="اضغط خارج الحقل لتحديث رأس المال"
                        />
                    </label>

                    <Button
                        variant="primary"
                        onClick={() => setShowForm((s) => !s)}
                    >
                        <PlusCircle size={15} className="ml-1.5" />
                        {showForm ? "إغلاق النموذج" : "تسجيل صفقة جديدة"}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowDemoConfirm(true)}>
                        تحميل بيانات تجريبية
                    </Button>
                </div>
            </Card>

            {/* ---------------- ADD TRADE FORM ---------------- */}
            {showForm && (
                <TradeForm
                    onSubmit={handleAddTrade}
                    onCancel={() => setShowForm(false)}
                    isSubmitting={isSaving}
                />
            )}

            {/* ---------------- TRADES TABLE ---------------- */}
            <TradeTable
                trades={computedTrades}
                onCloseTrade={(trade) => setClosingTrade(trade)}
                onDeleteTrade={(trade) => setTradeToDelete(trade)}
                onNewTradeClick={() => setShowForm(true)}
            />

            {/* Close Trade Modal */}
            {closingTrade && (
                <CloseTradeDialog
                    symbol={closingTrade.symbol}
                    buyPrice={closingTrade.buyPrice}
                    shares={closingTrade.shares}
                    onClose={handleCloseTradeConfirm}
                    onCancel={() => setClosingTrade(null)}
                />
            )}

            {/* Delete Single Trade Confirm Modal */}
            {tradeToDelete && (
                <ConfirmDialog
                    title={`حذف صفقة ${tradeToDelete.symbol}`}
                    message={`هل أنت متأكد من رغبتك في حذف صفقة ${tradeToDelete.symbol} (${tradeToDelete.shares} سهم)؟ لا يمكن التراجع عن هذا الإجراء.`}
                    confirmText="حذف الصفقة"
                    danger
                    onConfirm={handleDeleteTradeConfirm}
                    onCancel={() => setTradeToDelete(null)}
                />
            )}

            {/* Load Demo Data Confirm Modal */}
            {showDemoConfirm && (
                <ConfirmDialog
                    title="تحميل البيانات التجريبية"
                    message="هل أنت متأكد من رغبتك في تحميل البيانات التجريبية؟ سيؤدي ذلك إلى استبدال الصفقات الحالية المعروضة بنموذج بيانات توضيحي لمنهجية الدورة."
                    confirmText="تحميل النموذج التجريبي"
                    onConfirm={handleLoadDemoConfirm}
                    onCancel={() => setShowDemoConfirm(false)}
                />
            )}

            {/* Clear Confirm Modal */}
            {showClearConfirm && (
                <ConfirmDialog
                    title="مسح جميع الصفقات"
                    message="هل أنت متأكد من رغبتك في مسح جميع الصفقات المحلية؟ لا يمكن استرجاع الصفقات بعد مسحها."
                    confirmText="تأكيد المسح"
                    danger
                    onConfirm={handleClearConfirm}
                    onCancel={() => setShowClearConfirm(false)}
                />
            )}
        </div>
    );
}