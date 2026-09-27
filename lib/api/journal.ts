import { API_BASE_URL } from "./config";

export type TradeStatus = "active" | "closed";
export type TradeType = "buy" | "sell";

export interface ServerTrade {
    id: string | number;
    sym?: string;
    symbol?: string;
    type?: TradeType;
    trade_type?: TradeType;
    shares: number;
    buyPx?: number;
    buy_price?: number;
    sellPx?: number | null;
    sell_price?: number | null;
    status: TradeStatus;
    reason?: string;
    exitReason?: string;
    exit_reason?: string;
    tradeDate?: string;
    trade_date?: string;
    created_at?: string;
}

export interface Trade {
    id: string;
    symbol: string;
    type: TradeType;
    shares: number;
    buyPrice: number;
    sellPrice: number | null;
    reason: string;
    exitReason?: string;
    status: TradeStatus;
    createdAt: string;
    isLocalOnly?: boolean;
}

export interface TradePayload {
    symbol: string;
    trade_type: TradeType;
    shares: number;
    buy_price: number;
    sell_price: number | null;
    status: TradeStatus;
    reason: string;
    exit_reason?: string;
    trade_date: string;
}

export function fromServer(t: ServerTrade): Trade {
    return {
        id: String(t.id),
        symbol: (t.symbol || t.sym || "").toUpperCase(),
        type: (t.trade_type || t.type || "buy") as TradeType,
        shares: Number(t.shares) || 0,
        buyPrice: Number(t.buy_price ?? t.buyPx ?? 0),
        sellPrice: t.sell_price != null ? Number(t.sell_price) : (t.sellPx != null ? Number(t.sellPx) : null),
        reason: t.reason || "",
        exitReason: t.exit_reason || t.exitReason || "",
        status: (t.status || (t.sell_price != null ? "closed" : "active")) as TradeStatus,
        createdAt: t.trade_date || t.tradeDate || (t.created_at ? t.created_at.split("T")[0] : new Date().toISOString().slice(0, 10)),
        isLocalOnly: false,
    };
}

export function toPayload(t: {
    symbol: string;
    type: TradeType;
    shares: number;
    buyPrice: number;
    sellPrice: number | null;
    reason: string;
    exitReason?: string;
    status: TradeStatus;
    createdAt?: string;
}): TradePayload {
    return {
        symbol: t.symbol.trim().toUpperCase(),
        trade_type: t.type,
        shares: t.shares,
        buy_price: t.buyPrice,
        sell_price: t.sellPrice,
        status: t.status,
        reason: t.reason.trim(),
        exit_reason: t.exitReason?.trim() || undefined,
        trade_date: t.createdAt || getRiyadhDateIso(),
    };
}

/**
 * Returns current date in Asia/Riyadh (UTC+3) formatted as YYYY-MM-DD
 */
export function getRiyadhDateIso(): string {
    try {
        const d = new Date();
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Riyadh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        return formatter.format(d); // Returns YYYY-MM-DD
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}

export async function fetchJournalApi(signal?: AbortSignal): Promise<{ ok: boolean; status: number; trades?: Trade[]; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
            credentials: "include",
            signal,
        });
        if (!res.ok) {
            return { ok: false, status: res.status, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        if (Array.isArray(data)) {
            return { ok: true, status: res.status, trades: data.map(fromServer) };
        }
        return { ok: true, status: res.status, trades: [] };
    } catch (e: any) {
        if (e.name === "AbortError") throw e;
        return { ok: false, status: 0, error: e?.message || "Network Error" };
    }
}

export async function createTradeApi(payload: TradePayload): Promise<{ ok: boolean; status: number; serverId?: string; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/journal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            return { ok: false, status: res.status, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        return { ok: true, status: res.status, serverId: data.id ? String(data.id) : undefined };
    } catch (e: any) {
        return { ok: false, status: 0, error: e?.message || "Network Error" };
    }
}

export async function updateTradeApi(id: string, payload: TradePayload): Promise<{ ok: boolean; status: number; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/journal/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return { ok: res.ok, status: res.status };
    } catch (e: any) {
        return { ok: false, status: 0, error: e?.message || "Network Error" };
    }
}

export async function deleteTradeApi(id: string): Promise<{ ok: boolean; status: number; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/journal/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return { ok: res.ok, status: res.status };
    } catch (e: any) {
        return { ok: false, status: 0, error: e?.message || "Network Error" };
    }
}
