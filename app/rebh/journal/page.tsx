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

    // ---- load / persist ----
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const rawCap = localStorage.getItem(CAPITAL_KEY);
            if (raw) setTrades(JSON.parse(raw));
            if (rawCap) setCapital(Number(rawCap));
        } catch (e) {
            console.error("Failed to load trade journal from storage", e);
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
        } catch (e) {
            console.error("Failed to persist trade journal", e);
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

        const wins = withMath.filter((t) => t.ret > 0);
        const losses = withMath.filter((t) => t.ret <= 0);

        const winRate = withMath.length ? wins.length / withMath.length : 0;
        const lossRate = 1 - winRate;

        const avgGain = wins.length ? wins.reduce((a, t) => a + t.ret, 0) / wins.length : 0;
        const avgLoss = losses.length
            ? Math.abs(losses.reduce((a, t) => a + t.ret, 0) / losses.length)
            : 0;

        // Reward/Risk = Avg Gain % / Avg Loss %
        const rr = avgLoss > 0 ? avgGain / avgLoss : null;

        // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)  — expressed as % return
        const expectancyPct = winRate * avgGain - lossRate * avgLoss;

        const netPnl = withMath.reduce((a, t) => a + t.pnl, 0);
        const expectancySar =
            withMath.length > 0 ? netPnl / withMath.length : 0;

        // sizing check: any single closed trade whose loss exceeded 3% of capital
        const oversizedLosses = withMath.filter(
            (t) => t.pnl < 0 && Math.abs(t.pnl) / capital > 0.03
        );

        return {
            closedCount: withMath.length,
            activeCount: trades.filter((t) => t.status === "active").length,
            wins: wins.length,
            losses: losses.length,
            winRate,
            avgGain,
            avgLoss,
            rr,
            expectancyPct,
            expectancySar,
            netPnl,
            oversizedLosses,
            withMath,
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

    function addTrade(e: React.FormEvent) {
        e.preventDefault();
        const sh = Number(shares);
        const bp = Number(buyPrice);
        const sp = sellPrice.trim() === "" ? null : Number(sellPrice);
        if (!symbol.trim() || !sh || !bp || !reason.trim()) return; // reason mandatory per course methodology

        const newTrade: Trade = {
            id: uid(),
            symbol: symbol.trim().toUpperCase(),
            type,
            shares: sh,
            buyPrice: bp,
            sellPrice: sp,
            reason: reason.trim(),
            status: sp != null ? "closed" : "active",
            createdAt: new Date().toISOString().slice(0, 10),
        };
        setTrades((prev) => [newTrade, ...prev]);
        resetForm();
        setShowForm(false);
    }

    function closeTrade(id: string, sp: number) {
        setTrades((prev) =>
            prev.map((t) => (t.id === id ? { ...t, sellPrice: sp, status: "closed" } : t))
        );
    }

    function removeTrade(id: string) {
        setTrades((prev) => prev.filter((t) => t.id !== id));
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
                    <BookOpen size={26} color="#63a5f0" />
                    <h1 style={styles.h1}>
                        REBH <span style={{ color: "#63a5f0" }}>TRADE JOURNAL</span>
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
                    icon={<CheckCircle2 size={18} color={stats.winRate >= 0.6 ? "#2ecc71" : "#e8c464"} />}
                    label="معدل الربح (Win Rate)"
                    value={pct(stats.winRate * 100, 0)}
                    valueColor={stats.winRate >= 0.6 ? "#2ecc71" : stats.winRate >= 0.5 ? "#e8c464" : "#e85d5d"}
                    badge={stats.winRate >= 0.6 ? "ممتاز" : undefined}
                    footnote={`${stats.wins} رابحة / ${stats.losses} خاسرة من ${stats.closedCount}`}
                />
                <KpiCard
                    icon={<TrendingUp size={18} color="#63a5f0" />}
                    label="المكافأة/المخاطرة (R/R)"
                    value={stats.rr != null ? `${fmt(stats.rr, 2)}×` : "—"}
                    valueColor={stats.rr != null && stats.rr >= 3 ? "#2ecc71" : stats.rr != null && stats.rr >= 2 ? "#e8c464" : "#e85d5d"}
                    badge={stats.rr != null && stats.rr >= 3 ? "الهدف ≥3×" : undefined}
                    footnote={`متوسط ربح ${pct(stats.avgGain * 100, 1)} / متوسط خسارة ${pct(stats.avgLoss * 100, 1)}`}
                />
                <KpiCard
                    icon={<DollarSign size={18} color={stats.expectancyPct > 0 ? "#2ecc71" : "#e85d5d"} />}
                    label="التوقّع (Expectancy)"
                    value={pct(stats.expectancyPct * 100, 2)}
                    valueColor={stats.expectancyPct > 0 ? "#2ecc71" : "#e85d5d"}
                    footnote={`${fmt(stats.expectancySar, 0)} SAR / صفقة مغلقة`}
                />
                <KpiCard
                    icon={<DollarSign size={18} color={stats.netPnl >= 0 ? "#2ecc71" : "#e85d5d"} />}
                    label="صافي الربح والخسارة"
                    value={`${fmt(stats.netPnl, 0)} SAR`}
                    valueColor={stats.netPnl >= 0 ? "#2ecc71" : "#e85d5d"}
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
                                                            t.status === "active" ? "rgba(99,165,240,.15)" : "rgba(255,255,255,.06)",
                                                        color: t.status === "active" ? "#63a5f0" : "#aab6c6",
                                                    }}
                                                >
                                                    {t.status === "active" ? "نشطة" : "مغلقة"}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{fmt(t.shares, 0)}</td>
                                            <td style={styles.td}>{fmt(t.buyPrice, 2)}</td>
                                            <td style={styles.td}>{t.sellPrice != null ? fmt(t.sellPrice, 2) : "—"}</td>
                                            <td style={{ ...styles.td, color: ret == null ? "#5f6d80" : ret > 0 ? "#2ecc71" : "#e85d5d" }}>
                                                {ret != null ? pct(ret * 100, 1) : "—"}
                                            </td>
                                            <td style={{ ...styles.td, color: pnl == null ? "#5f6d80" : pnl >= 0 ? "#2ecc71" : "#e85d5d" }}>
                                                {pnl != null ? fmt(pnl, 0) : "—"}
                                                {sizePct != null && sizePct > 0.03 && pnl! < 0 ? " ⚑>3%" : ""}
                                            </td>
                                            <td style={{ ...styles.td, textAlign: "right", fontSize: 11.5, color: "#aab6c6" }}>
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
            <div style={{ ...styles.kpiValue, color: valueColor || "#e8edf4" }}>{value}</div>
            <div style={styles.kpiLabel}>{label}</div>
            {footnote && <div style={styles.kpiFoot}>{footnote}</div>}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#aab6c6" }}>
            {label}
            {children}
        </label>
    );
}

/* ================= styles ================= */

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#0a0c10",
        color: "#e8edf4",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "26px 24px 60px",
        direction: "rtl",
    },
    header: { marginBottom: 22, borderBottom: "1px solid #1d2735", paddingBottom: 16 },
    headerTitleRow: { display: "flex", alignItems: "center", gap: 10 },
    h1: { fontSize: 22, fontWeight: 900, margin: 0 },
    sub: { color: "#aab6c6", fontSize: 12.5, marginTop: 8, maxWidth: 900, lineHeight: 1.7 },
    kpiBar: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 12,
        marginBottom: 16,
    },
    kpiCard: {
        background: "#121924",
        border: "1px solid #1d2735",
        borderRadius: 14,
        padding: "14px 16px",
    },
    kpiIconWrap: { display: "flex", alignItems: "center" },
    kpiBadge: {
        fontSize: 10.5,
        fontWeight: 800,
        color: "#d9b64a",
        background: "rgba(217,182,74,.12)",
        border: "1px solid #d9b64a",
        borderRadius: 20,
        padding: "2px 9px",
    },
    kpiValue: { fontSize: 24, fontWeight: 900, marginTop: 10, fontFamily: "Consolas, monospace" },
    kpiLabel: { fontSize: 11, color: "#5f6d80", marginTop: 4, letterSpacing: 0.3 },
    kpiFoot: { fontSize: 10.5, color: "#5f6d80", marginTop: 6 },
    warnBanner: {
        background: "rgba(232,93,93,.08)",
        borderInlineStart: "3px solid #e85d5d",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12.5,
        color: "#e8edf4",
        marginBottom: 16,
    },
    controlsRow: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 16,
    },
    capitalLabel: { display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#aab6c6" },
    capitalInput: {
        background: "#0e141d",
        border: "1px solid #1d2735",
        borderRadius: 9,
        color: "#e8edf4",
        padding: "8px 12px",
        fontSize: 13,
        width: 160,
    },
    primaryBtn: {
        background: "#3987e5",
        border: "none",
        borderRadius: 9,
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
        border: "1px solid #1d2735",
        borderRadius: 9,
        color: "#aab6c6",
        padding: "9px 16px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
    },
    ghostDangerBtn: {
        background: "transparent",
        border: "1px solid #1d2735",
        borderRadius: 9,
        color: "#e85d5d",
        padding: "9px 16px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
    },
    formPanel: {
        background: "#121924",
        border: "1px solid #d9b64a",
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 18,
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginBottom: 12,
    },
    input: {
        background: "#0e141d",
        border: "1px solid #1d2735",
        borderRadius: 9,
        color: "#e8edf4",
        padding: "8px 12px",
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
    },
    panel: {
        background: "#121924",
        border: "1px solid #1d2735",
        borderRadius: 14,
        padding: "18px 20px",
    },
    panelTitle: {
        fontSize: 12,
        color: "#5f6d80",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    empty: { color: "#5f6d80", fontSize: 12.5, padding: 18, textAlign: "center" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
    th: {
        fontSize: 10,
        color: "#5f6d80",
        textAlign: "center",
        padding: "7px 9px",
        borderBottom: "1.5px solid #1d2735",
        letterSpacing: 0.6,
        whiteSpace: "nowrap",
    },
    td: {
        padding: "6.5px 9px",
        borderBottom: "1px solid #1d2735",
        textAlign: "center",
        whiteSpace: "nowrap",
    },
    statusBadge: {
        display: "inline-block",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 10.5,
        fontWeight: 800,
    },
    smallGhostBtn: {
        background: "transparent",
        border: "1px solid #1d2735",
        borderRadius: 7,
        color: "#63a5f0",
        padding: "3px 9px",
        fontSize: 10.5,
        cursor: "pointer",
    },
    smallDangerBtn: {
        background: "transparent",
        border: "1px solid #1d2735",
        borderRadius: 7,
        color: "#e85d5d",
        padding: "3px 8px",
        fontSize: 10.5,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
    },
    footer: {
        color: "#5f6d80",
        fontSize: 10.5,
        textAlign: "center",
        padding: "30px 0 0",
    },
};

const globalCss = `
  input:focus, select:focus, textarea:focus { border-color: #3987e5 !important; }
  table tr:hover td { background: rgba(255,255,255,.02); }
  button:hover { filter: brightness(1.1); }
`;