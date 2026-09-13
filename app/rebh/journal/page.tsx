"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    PlusCircle,
    CheckCircle2,
    TrendingUp,
    DollarSign,
    Trash2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

/* ============================================================
   REBH · Trade Journal — the discipline machine
   Ahmed Al-Amer's trade-registration method + Minervini's
   expectancy mathematics, ported to Next.js / TypeScript.
   ============================================================ */

type TradeStatus = "active" | "closed";
type TradeType = "buy" | "sell";

interface Trade {
    id: string;
    symbol: string;
    type: TradeType;
    shares: number;
    buyPrice: number;
    sellPrice: number | null; // null while active
    reason: string;
    status: TradeStatus;
    createdAt: string;
}

const STORAGE_KEY = "rebh-trade-journal-v1";
const CAPITAL_KEY = "rebh-trade-journal-capital-v1";

const DEMO_TRADES: Trade[] = [
    { id: "d1", symbol: "1120", type: "buy", shares: 200, buyPrice: 58, sellPrice: 64.4, reason: "تسارع أرباح ربعي + دخول عند المنطقة الفضية", status: "closed", createdAt: "2026-05-02" },
    { id: "d2", symbol: "7010", type: "buy", shares: 300, buyPrice: 39, sellPrice: 43.7, reason: "دخول عند المنطقة الفضية — نمو مستدام", status: "closed", createdAt: "2026-05-10" },
    { id: "d3", symbol: "4300", type: "buy", shares: 500, buyPrice: 22, sellPrice: 20.3, reason: "خروج: تغطية الفوائد أقل من 2× — كسر عنصر أمان", status: "closed", createdAt: "2026-05-18" },
    { id: "d4", symbol: "2030", type: "buy", shares: 150, buyPrice: 48, sellPrice: 51.2, reason: "شراء عند نطاق قاع الدورة (14-16× أرباح القاع)", status: "closed", createdAt: "2026-06-01" },
    { id: "d5", symbol: "1010", type: "buy", shares: 400, buyPrice: 18.5, sellPrice: 20.2, reason: "قصة تحسن هامش الفائدة الصافي (NIM)", status: "closed", createdAt: "2026-06-12" },
    { id: "d6", symbol: "2222", type: "buy", shares: 250, buyPrice: 28, sellPrice: 26.6, reason: "خروج: القوائم المالية غير محدّثة (stale)", status: "closed", createdAt: "2026-06-20" },
    { id: "d7", symbol: "1211", type: "buy", shares: 100, buyPrice: 72, sellPrice: null, reason: "مركز نشط — بانتظار نتائج الربع القادم", status: "active", createdAt: "2026-07-15" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function fmt(v: number, d = 1) {
    if (v == null || Number.isNaN(v)) return "—";
    return v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
function pct(v: number, d = 1) {
    if (v == null || Number.isNaN(v)) return "—";
    return `${fmt(v, d)}%`;
}

export default function TradeJournalPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [capital, setCapital] = useState<number>(100000);
    const [showForm, setShowForm] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // form state
    const [symbol, setSymbol] = useState("");
    const [type, setType] = useState<TradeType>("buy");
    const [shares, setShares] = useState("");
    const [buyPrice, setBuyPrice] = useState("");
    const [sellPrice, setSellPrice] = useState("");
    const [reason, setReason] = useState("");

    // ---- load / persist from backend API ----
    useEffect(() => {
        async function fetchJournal() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const serverTrades = await res.json();
                    if (Array.isArray(serverTrades) && serverTrades.length > 0) {
                        setTrades(serverTrades.map((t: any) => ({
                            id: String(t.id),
                            symbol: t.symbol || t.sym,
                            type: t.type || "buy",
                            shares: t.shares,
                            buyPrice: t.buy_price ?? t.buyPx,
                            sellPrice: t.sell_price ?? t.sellPx,
                            status: t.status,
                            reason: t.reason,
                            createdAt: t.trade_date || t.tradeDate
                        })));
                    } else {
                        // fallback to localStorage if server empty
                        const raw = localStorage.getItem(STORAGE_KEY);
                        if (raw) {
                            const localTrades = JSON.parse(raw);
                            if (Array.isArray(localTrades)) setTrades(localTrades);
                        }
                    }
                }
                const rawCap = localStorage.getItem(CAPITAL_KEY);
                if (rawCap) setCapital(Number(rawCap));
            } catch (e) {
                console.error("Failed to load trade journal from API", e);
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) setTrades(JSON.parse(raw));
            } finally {
                setHydrated(true);
            }
        }
        fetchJournal();
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
        } catch (e) {
            console.error("Failed to persist trade journal to localStorage", e);
        }
    }, [trades, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(CAPITAL_KEY, String(capital));
        } catch (e) {
            console.error("Failed to persist capital", e);
        }
    }, [capital, hydrated]);

    // ---- derived math (Al-Amer / Minervini) ----
    const stats = useMemo(() => {
        const closed = trades.filter((t) => t.status === "closed" && t.sellPrice != null);
        const withMath = closed.map((t) => {
            const ret = (t.sellPrice! - t.buyPrice) / t.buyPrice; // return %
            const amt = t.shares * t.buyPrice;
            const pnl = t.shares * (t.sellPrice! - t.buyPrice);
            return { ...t, ret, amt, pnl };
        });

        const wins = withMath.filter((t) => t.pnl > 0);
        const losses = withMath.filter((t) => t.pnl < 0);

        const winRate = withMath.length > 0 ? wins.length / withMath.length : 0;
        const lossRate = withMath.length > 0 ? losses.length / withMath.length : 0;

        const avgGain = wins.length > 0 ? wins.reduce((s, t) => s + t.ret, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.ret, 0) / losses.length) : 0;

        const rr = avgLoss > 0 ? avgGain / avgLoss : null;
        // Expectancy = (Win% * Avg Win) - (Loss% * Avg Loss)
        const expectancyPct = (winRate * avgGain) - (lossRate * avgLoss);
        const expectancySar = expectancyPct * (capital > 0 ? capital * 0.1 : 10000); // normalized to 10% position size

        const netPnl = withMath.reduce((s, t) => s + t.pnl, 0);

        // 3% max loss check per Al-Amer rule
        const oversizedLosses = withMath.filter((t) => {
            if (t.pnl >= 0) return false;
            return Math.abs(t.pnl) > capital * 0.03;
        });

        return {
            totalTrades: trades.length,
            closedCount: withMath.length,
            activeCount: trades.filter((t) => t.status === "active").length,
            wins: wins.length,
            losses: losses.length,
            winRate,
            lossRate,
            avgGain,
            avgLoss,
            rr,
            expectancyPct,
            expectancySar,
            netPnl,
            oversizedLosses,
        };
    }, [trades, capital]);

    // ---- actions ----
    function resetForm() {
        setSymbol("");
        setType("buy");
        setShares("");
        setBuyPrice("");
        setSellPrice("");
        setReason("");
    }

    async function addTrade(e: React.FormEvent) {
        e.preventDefault();
        const sh = Number(shares);
        const bp = Number(buyPrice);
        const sp = sellPrice.trim() === "" ? null : Number(sellPrice);
        if (!symbol.trim() || !sh || !bp || !reason.trim()) return; // reason mandatory per course methodology

        const payload = {
            symbol: symbol.trim().toUpperCase(),
            trade_type: type,
            shares: sh,
            buy_price: bp,
            sell_price: sp,
            reason: reason.trim(),
            status: sp != null ? "closed" : "active",
            trade_date: new Date().toISOString().slice(0, 10),
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                const serverId = data.id || uid();
                const newTrade: Trade = {
                    id: String(serverId),
                    symbol: payload.symbol,
                    type,
                    shares: sh,
                    buyPrice: bp,
                    sellPrice: sp,
                    reason: payload.reason,
                    status: payload.status as TradeStatus,
                    createdAt: payload.trade_date,
                };
                setTrades((prev) => [newTrade, ...prev]);
            } else {
                // fallback local
                const newTrade: Trade = {
                    id: uid(),
                    symbol: payload.symbol,
                    type,
                    shares: sh,
                    buyPrice: bp,
                    sellPrice: sp,
                    reason: payload.reason,
                    status: payload.status as TradeStatus,
                    createdAt: payload.trade_date,
                };
                setTrades((prev) => [newTrade, ...prev]);
            }
        } catch (_) {
            const newTrade: Trade = {
                id: uid(),
                symbol: payload.symbol,
                type,
                shares: sh,
                buyPrice: bp,
                sellPrice: sp,
                reason: payload.reason,
                status: payload.status as TradeStatus,
                createdAt: payload.trade_date,
            };
            setTrades((prev) => [newTrade, ...prev]);
        }
        resetForm();
        setShowForm(false);
    }

    async function closeTrade(id: string, sp: number) {
        setTrades((prev) =>
            prev.map((t) => (t.id === id ? { ...t, sellPrice: sp, status: "closed" } : t))
        );
        const target = trades.find((t) => t.id === id);
        if (target && !id.startsWith("d")) {
            try {
                await fetch(`${API_BASE_URL}/api/rebh/journal/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        symbol: target.symbol,
                        trade_type: target.type,
                        shares: target.shares,
                        buy_price: target.buyPrice,
                        sell_price: sp,
                        status: "closed",
                        reason: target.reason,
                        trade_date: target.createdAt
                    })
                });
            } catch (_) { }
        }
    }

    async function removeTrade(id: string) {
        setTrades((prev) => prev.filter((t) => t.id !== id));
        if (!id.startsWith("d")) {
            try {
                await fetch(`${API_BASE_URL}/api/rebh/journal/${id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            } catch (_) { }
        }
    }

    function loadDemo() {
        setTrades(DEMO_TRADES);
    }

    function clearAll() {
        setTrades([]);
    }

    return (
        <div style={styles.page}>
            <style>{globalCss}</style>

            <header style={styles.header}>
                <div style={styles.headerTitleRow}>
                    <BookOpen size={26} color="#8C3B32" />
                    <h1 style={styles.h1}>
                        REBH <span style={{ color: "#8C3B32" }}>دفتر الصفقات</span>
                    </h1>
                </div>
                <p style={styles.sub}>
                    آلة الانضباط — من جلسة تسجيل الصفقات لأحمد العامر + رياضيات التوقع
                    (Expectancy) لمينرفيني. معدل ربح ≥ 60% ممتاز · R/R ≥ 3× · التوقّع
                    يجب أن يكون موجباً · خسارة الصفقة الواحدة ≈3% من رأس المال عبر
                    الحجم لا وقف الخسارة.
                </p>
            </header>

            {/* ---------------- KPI BAR ---------------- */}
            <section style={styles.kpiBar}>
                <KpiCard
                    icon={<CheckCircle2 size={18} color={stats.winRate >= 0.6 ? "#16A34A" : "#B45309"} />}
                    label="معدل الربح (Win Rate)"
                    value={pct(stats.winRate * 100, 0)}
                    valueColor={stats.winRate >= 0.6 ? "#16A34A" : stats.winRate >= 0.5 ? "#B45309" : "#DC2626"}
                    badge={stats.winRate >= 0.6 ? "ممتاز" : undefined}
                    footnote={`${stats.wins} رابحة / ${stats.losses} خاسرة من ${stats.closedCount}`}
                />
                <KpiCard
                    icon={<TrendingUp size={18} color="#2563EB" />}
                    label="المكافأة/المخاطرة (R/R)"
                    value={stats.rr != null ? `${fmt(stats.rr, 2)}×` : "—"}
                    valueColor={stats.rr != null && stats.rr >= 3 ? "#16A34A" : stats.rr != null && stats.rr >= 2 ? "#B45309" : "#DC2626"}
                    badge={stats.rr != null && stats.rr >= 3 ? "الهدف ≥3×" : undefined}
                    footnote={`متوسط ربح ${pct(stats.avgGain * 100, 1)} / متوسط خسارة ${pct(stats.avgLoss * 100, 1)}`}
                />
                <KpiCard
                    icon={<DollarSign size={18} color={stats.expectancyPct > 0 ? "#16A34A" : "#DC2626"} />}
                    label="التوقّع (Expectancy)"
                    value={pct(stats.expectancyPct * 100, 2)}
                    valueColor={stats.expectancyPct > 0 ? "#16A34A" : "#DC2626"}
                    footnote={`${fmt(stats.expectancySar, 0)} SAR / صفقة مغلقة`}
                />
                <KpiCard
                    icon={<DollarSign size={18} color={stats.netPnl >= 0 ? "#16A34A" : "#DC2626"} />}
                    label="صافي الربح والخسارة"
                    value={`${fmt(stats.netPnl, 0)} SAR`}
                    valueColor={stats.netPnl >= 0 ? "#16A34A" : "#DC2626"}
                    footnote={`${stats.activeCount} مركز نشط حالياً`}
                />
            </section>

            {stats.oversizedLosses.length > 0 && (
                <div style={styles.warnBanner}>
                    ⚑ {stats.oversizedLosses.length} صفقة تجاوزت خسارتها 3% من رأس
                    المال ({fmt(capital, 0)} SAR) — قاعدة الحجم، لا وقف الخسارة، هي ما
                    يحمي المحفظة.
                </div>
            )}

            {/* ---------------- CONTROLS ---------------- */}
            <section style={styles.controlsRow}>
                <label style={styles.capitalLabel}>
                    رأس المال الإجمالي (SAR)
                    <input
                        type="number"
                        value={capital}
                        onChange={(e) => setCapital(Number(e.target.value) || 0)}
                        style={styles.capitalInput}
                    />
                </label>
                <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
                    <PlusCircle size={16} style={{ marginInlineEnd: 6 }} />
                    {showForm ? "إغلاق النموذج" : "تسجيل صفقة جديدة"}
                </button>
                <button style={styles.ghostBtn} onClick={loadDemo}>
                    تحميل بيانات تجريبية
                </button>
                <button style={styles.ghostDangerBtn} onClick={clearAll}>
                    مسح الكل
                </button>
            </section>

            {/* ---------------- ADD TRADE FORM ---------------- */}
            {showForm && (
                <form onSubmit={addTrade} style={styles.formPanel}>
                    <div style={styles.formGrid}>
                        <Field label="الرمز (Symbol)">
                            <input
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder="مثال: 1120"
                                style={styles.input}
                            />
                        </Field>
                        <Field label="النوع">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TradeType)}
                                style={styles.input}
                            >
                                <option value="buy">شراء</option>
                                <option value="sell">بيع</option>
                            </select>
                        </Field>
                        <Field label="عدد الأسهم">
                            <input
                                type="number"
                                value={shares}
                                onChange={(e) => setShares(e.target.value)}
                                placeholder="200"
                                style={styles.input}
                            />
                        </Field>
                        <Field label="سعر الدخول">
                            <input
                                type="number"
                                step="0.01"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                placeholder="58.00"
                                style={styles.input}
                            />
                        </Field>
                        <Field label="سعر الخروج / المستهدف (اتركه فارغاً إن كان المركز نشطاً)">
                            <input
                                type="number"
                                step="0.01"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                placeholder="64.40"
                                style={styles.input}
                            />
                        </Field>
                    </div>
                    <Field label="سبب الدخول / الاستراتيجية — إلزامي بمنهجية الدورة">
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="مثال: دخول عند المنطقة الفضية + تسارع أرباح ربعي..."
                            style={{ ...styles.input, minHeight: 60, resize: "vertical" as const }}
                        />
                    </Field>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button type="submit" style={styles.primaryBtn}>
                            حفظ الصفقة
                        </button>
                        <button
                            type="button"
                            style={styles.ghostBtn}
                            onClick={() => {
                                resetForm();
                                setShowForm(false);
                            }}
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            )}

            {/* ---------------- TRADE LOG TABLE ---------------- */}
            <section style={styles.panel}>
                <h3 style={styles.panelTitle}>سجل الصفقات</h3>
                {trades.length === 0 ? (
                    <div style={styles.empty}>لا توجد صفقات مسجّلة بعد — أضف صفقة أو حمّل البيانات التجريبية</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>الرمز</th>
                                    <th style={styles.th}>الحالة</th>
                                    <th style={styles.th}>الأسهم</th>
                                    <th style={styles.th}>سعر الدخول</th>
                                    <th style={styles.th}>سعر الخروج</th>
                                    <th style={styles.th}>العائد %</th>
                                    <th style={styles.th}>ربح/خسارة SAR</th>
                                    <th style={{ ...styles.th, textAlign: "right" }}>السبب</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((t) => {
                                    const ret =
                                        t.sellPrice != null ? (t.sellPrice - t.buyPrice) / t.buyPrice : null;
                                    const pnl = t.sellPrice != null ? t.shares * (t.sellPrice - t.buyPrice) : null;
                                    const sizePct = pnl != null && capital ? Math.abs(pnl) / capital : null;
                                    return (
                                        <tr key={t.id}>
                                            <td style={{ ...styles.td, fontWeight: 700, textAlign: "left" }}>{t.symbol}</td>
                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        background:
                                                            t.status === "active" ? "#EFF6FF" : "#F3F4F6",
                                                        color: t.status === "active" ? "#2563EB" : "#6B7280",
                                                        border: `1px solid ${t.status === "active" ? "#BFDBFE" : "#E5E7EB"}`,
                                                    }}
                                                >
                                                    {t.status === "active" ? "نشطة" : "مغلقة"}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{fmt(t.shares, 0)}</td>
                                            <td style={styles.td}>{fmt(t.buyPrice, 2)}</td>
                                            <td style={styles.td}>{t.sellPrice != null ? fmt(t.sellPrice, 2) : "—"}</td>
                                            <td style={{ ...styles.td, color: ret == null ? "#9CA3AF" : ret > 0 ? "#16A34A" : "#DC2626", fontWeight: ret == null ? 400 : 600 }}>
                                                {ret != null ? pct(ret * 100, 1) : "—"}
                                            </td>
                                            <td style={{ ...styles.td, color: pnl == null ? "#9CA3AF" : pnl >= 0 ? "#16A34A" : "#DC2626", fontWeight: pnl == null ? 400 : 600 }}>
                                                {pnl != null ? fmt(pnl, 0) : "—"}
                                                {sizePct != null && sizePct > 0.03 && pnl! < 0 ? " ⚑>3%" : ""}
                                            </td>
                                            <td style={{ ...styles.td, textAlign: "right", fontSize: 11.5, color: "#6B7280" }}>
                                                {t.reason}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                    {t.status === "active" && (
                                                        <button
                                                            style={styles.smallGhostBtn}
                                                            onClick={() => {
                                                                const val = window.prompt("سعر الخروج / الإغلاق:");
                                                                const num = val ? Number(val) : NaN;
                                                                if (!Number.isNaN(num) && num > 0) closeTrade(t.id, num);
                                                            }}
                                                        >
                                                            إغلاق
                                                        </button>
                                                    )}
                                                    <button style={styles.smallDangerBtn} onClick={() => removeTrade(t.id)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <footer style={styles.footer}>
                REBH Tools · محفوظ محلياً على هذا الجهاز (localStorage) · مراجعة كل
                2-3 أشهر لا سنوياً · هذه المنصة تعرض الأرقام ولا توصي بالشراء أو
                البيع
            </footer>
        </div>
    );
}

/* ================= sub-components ================= */

function KpiCard({
    icon,
    label,
    value,
    valueColor,
    badge,
    footnote,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
    badge?: string;
    footnote?: string;
}) {
    return (
        <div style={styles.kpiCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={styles.kpiIconWrap}>{icon}</div>
                {badge && <span style={styles.kpiBadge}>{badge}</span>}
            </div>
            <div style={{ ...styles.kpiValue, color: valueColor || "#1A1A1A" }}>{value}</div>
            <div style={styles.kpiLabel}>{label}</div>
            {footnote && <div style={styles.kpiFoot}>{footnote}</div>}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#6B7280" }}>
            {label}
            {children}
        </label>
    );
}

/* ================= styles ================= */

// NOTE: kept as inline style objects (matching the original implementation's approach)
// rather than converting to Tailwind classes, to minimize risk of behavioral drift —
// only color/radius/shadow VALUES changed to match the new light design system.
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#F7F8FA",
        color: "#1A1A1A",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "26px 24px 60px",
        direction: "rtl",
    },
    header: { marginBottom: 22, borderBottom: "1px solid #E5E7EB", paddingBottom: 16 },
    headerTitleRow: { display: "flex", alignItems: "center", gap: 10 },
    h1: { fontSize: 22, fontWeight: 900, margin: 0, color: "#1A1A1A" },
    sub: { color: "#6B7280", fontSize: 12.5, marginTop: 8, maxWidth: 900, lineHeight: 1.7 },
    kpiBar: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 12,
        marginBottom: 16,
    },
    kpiCard: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    kpiIconWrap: { display: "flex", alignItems: "center" },
    kpiBadge: {
        fontSize: 10.5,
        fontWeight: 800,
        color: "#8C3B32",
        background: "#FBEAE8",
        border: "1px solid #F0CFC9",
        borderRadius: 20,
        padding: "2px 9px",
    },
    kpiValue: { fontSize: 24, fontWeight: 900, marginTop: 10, fontFamily: "Consolas, monospace" },
    kpiLabel: { fontSize: 11, color: "#6B7280", marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" },
    kpiFoot: { fontSize: 10.5, color: "#9CA3AF", marginTop: 6 },
    warnBanner: {
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderInlineStart: "3px solid #DC2626",
        borderRadius: 4,
        padding: "10px 14px",
        fontSize: 12.5,
        color: "#DC2626",
        marginBottom: 16,
    },
    controlsRow: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 16,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    capitalLabel: { display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#6B7280" },
    capitalInput: {
        background: "#F7F8FA",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#1A1A1A",
        padding: "8px 12px",
        fontSize: 13,
        width: 160,
    },
    primaryBtn: {
        background: "#8C3B32",
        border: "none",
        borderRadius: 4,
        color: "#fff",
        padding: "9px 18px",
        fontSize: 12.5,
        fontWeight: 800,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
    },
    ghostBtn: {
        background: "transparent",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#6B7280",
        padding: "9px 16px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
    },
    ghostDangerBtn: {
        background: "transparent",
        border: "1px solid #FECACA",
        borderRadius: 4,
        color: "#DC2626",
        padding: "9px 16px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
    },
    formPanel: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        padding: "18px 20px",
        marginBottom: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        borderInlineStart: "3px solid #8C3B32",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginBottom: 12,
    },
    input: {
        background: "#F7F8FA",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#1A1A1A",
        padding: "8px 12px",
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
    },
    panel: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    panelTitle: {
        fontSize: 12,
        color: "#6B7280",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginBottom: 12,
        fontWeight: 700,
    },
    empty: { color: "#9CA3AF", fontSize: 12.5, padding: 18, textAlign: "center" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
    th: {
        fontSize: 10,
        color: "#6B7280",
        textAlign: "center",
        padding: "7px 9px",
        borderBottom: "1px solid #E5E7EB",
        background: "#F3F4F6",
        letterSpacing: 0.6,
        whiteSpace: "nowrap",
    },
    td: {
        padding: "6.5px 9px",
        borderBottom: "1px solid #E5E7EB",
        textAlign: "center",
        whiteSpace: "nowrap",
        color: "#1A1A1A",
    },
    statusBadge: {
        display: "inline-block",
        borderRadius: 20,
        padding: "2px 8px",
        fontSize: 10.5,
        fontWeight: 800,
    },
    smallGhostBtn: {
        background: "transparent",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#2563EB",
        padding: "3px 9px",
        fontSize: 10.5,
        cursor: "pointer",
    },
    smallDangerBtn: {
        background: "transparent",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#DC2626",
        padding: "3px 8px",
        fontSize: 10.5,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
    },
    footer: {
        color: "#9CA3AF",
        fontSize: 10.5,
        textAlign: "center",
        padding: "30px 0 0",
    },
};

const globalCss = `
  input:focus, select:focus, textarea:focus { border-color: #8C3B32 !important; box-shadow: 0 0 0 2px rgba(140,59,50,0.1); }
  table tr:hover td { background: #F7F8FA; }
  button:hover { filter: brightness(0.97); }
`;