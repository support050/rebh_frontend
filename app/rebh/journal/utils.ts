import { Trade } from "@/lib/api/journal";

export const BENCHMARKS = {
    DEFAULT_CAPITAL: 100_000,
    POSITION_SIZE_RATIO: 0.1, // 10% assumption for expectancy SAR
    MAX_LOSS_PCT: 0.03, // 3% rule per Al-Amer methodology
    MIN_WIN_RATE: 0.60, // 60%
    MIN_WIN_RATE_FAIR: 0.50, // 50%
    MIN_RR_TARGET: 3.0, // 3x
    MIN_RR_ACCEPTABLE: 2.0, // 2x
    MIN_SAMPLE_SIZE: 5, // minimum closed trades before marking stats as statistically robust (otherwise warning mark)
};

export interface ComputedTrade extends Trade {
    ret: number | null;
    pnl: number | null;
    amt: number;
    sizePct: number | null;
    isOversizedLoss: boolean;
}

export interface JournalStats {
    totalTrades: number;
    closedCount: number;
    activeCount: number;
    wins: number;
    losses: number;
    winRate: number | null;
    lossRate: number | null;
    avgGain: number | null;
    avgLoss: number | null;
    rr: number | null;
    expectancyPct: number | null;
    expectancySar: number | null;
    netPnl: number;
    oversizedLosses: ComputedTrade[];
    hasLowSample: boolean;
}

export function computeTrade(t: Trade, currentCapital: number): ComputedTrade {
    const isClosed = t.status === "closed" && t.sellPrice != null;
    const amt = t.shares * t.buyPrice;
    const ret = isClosed ? (t.sellPrice! - t.buyPrice) / t.buyPrice : null;
    const pnl = isClosed ? t.shares * (t.sellPrice! - t.buyPrice) : null;
    const sizePct = (pnl != null && currentCapital > 0) ? Math.abs(pnl) / currentCapital : null;
    const isOversizedLoss = pnl != null && pnl < 0 && sizePct != null && sizePct > BENCHMARKS.MAX_LOSS_PCT;

    return {
        ...t,
        ret,
        pnl,
        amt,
        sizePct,
        isOversizedLoss,
    };
}

export function computeJournalStats(computedTrades: ComputedTrade[], capital: number): JournalStats {
    const effectiveCap = capital > 0 ? capital : BENCHMARKS.DEFAULT_CAPITAL;
    const closed = computedTrades.filter((t) => t.status === "closed" && t.pnl != null);

    const wins = closed.filter((t) => t.pnl! > 0);
    const losses = closed.filter((t) => t.pnl! < 0);

    const closedCount = closed.length;
    const hasClosed = closedCount > 0;

    const winRate = hasClosed ? wins.length / closedCount : null;
    const lossRate = hasClosed ? losses.length / closedCount : null;

    const avgGain = wins.length > 0 ? wins.reduce((s, t) => s + (t.ret || 0), 0) / wins.length : null;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.ret || 0), 0) / losses.length) : null;

    const rr = (avgLoss != null && avgLoss > 0 && avgGain != null) ? avgGain / avgLoss : null;

    let expectancyPct: number | null = null;
    let expectancySar: number | null = null;

    if (winRate != null && lossRate != null && avgGain != null && avgLoss != null) {
        expectancyPct = (winRate * avgGain) - (lossRate * avgLoss);
        expectancySar = expectancyPct * (effectiveCap * BENCHMARKS.POSITION_SIZE_RATIO);
    }

    const netPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
    const oversizedLosses = closed.filter((t) => t.isOversizedLoss);

    return {
        totalTrades: computedTrades.length,
        closedCount,
        activeCount: computedTrades.filter((t) => t.status === "active").length,
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
        hasLowSample: closedCount > 0 && closedCount < BENCHMARKS.MIN_SAMPLE_SIZE,
    };
}

export function formatNum(v: number | null | undefined, d = 1): string {
    if (v == null || Number.isNaN(v)) return "—";
    const s = Number(v).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
    return s === "-0" || s === "-0.0" ? "0" : s;
}

export function formatPct(v: number | null | undefined, d = 1, signed = true): string {
    if (v == null || Number.isNaN(v)) return "—";
    const txt = formatNum(v, d);
    if (txt === "—") return "—";
    const isZero = txt === "0" || Number(txt.replace(/,/g, "")) === 0;
    const sign = signed && v > 0 && !isZero ? "+" : "";
    return `${sign}${txt}%`;
}

export function formatSar(v: number | null | undefined, d = 0, signed = true): string {
    if (v == null || Number.isNaN(v)) return "—";
    const txt = formatNum(v, d);
    if (txt === "—") return "—";
    const isZero = txt === "0" || Number(txt.replace(/,/g, "")) === 0;
    const sign = signed && v > 0 && !isZero ? "+" : "";
    return `${sign}${txt} SAR`;
}
