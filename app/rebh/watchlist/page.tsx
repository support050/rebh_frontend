"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    SlidersHorizontal,
    X,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Star,
    RefreshCw,
    AlertTriangle,
    HelpCircle,
    Loader2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import { TableStatusRow } from "./components/TableStatusRow";
import { Badge } from "./components/Badge";
import { ExportButton, ExportColumn } from "./components/Exportbutton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyUniverseItem {
    sym: string;
    n: string;
    /** Optional English company name from the backend (preferred for display when present). */
    en?: string;
    sec: string;
    /** Optional English sector name from the backend (preferred for display when present). */
    sec_en?: string;
    px: number;
    mc: number;
    pe?: number;
    pb?: number;
    roe?: number;
    g_net?: number;
    g_rev?: number;
    peg?: number;
    ncav?: number;
    pncav?: number;
    f_score?: number;
    fresh: boolean;
    grades?: Record<string, { g: string; p: number; b: string }>;
    // New fields from expanded engine
    nm?: number;          // Net Margin %
    de?: number;          // Debt/Equity ratio
    fcf_yield?: number;   // FCF Yield %
    owner_yield?: number; // Owner Yield° = (FCF + Dividends) / MC
    revenue?: number;     // TTM Revenue M SAR (informational)
    fcf?: number;         // Free Cash Flow M SAR (informational)
}

type SortKey =
    | "sym"
    | "px"
    | "mc"
    | "pe"
    | "pb"
    | "roe"
    | "g_net"
    | "g_rev"
    | "peg"
    | "pncav"
    | "f_score"
    | "nm"
    | "de"
    | "fcf_yield"
    | "owner_yield";

type SortDir = "asc" | "desc";

type ScreenId = "all" | "value" | "quality" | "growth" | "netnet" | "watch";

// ---------------------------------------------------------------------------
// Display-name helpers (prefer English names when the backend provides them)
// ---------------------------------------------------------------------------

const ALL_SECTORS = "All Sectors";

const companyName = (c: CompanyUniverseItem) => c.en || c.n;
const sectorName = (c: CompanyUniverseItem) => c.sec_en || c.sec;

// ---------------------------------------------------------------------------
// Formatting & Honesty Helpers
// ---------------------------------------------------------------------------

const nf = (v: number | undefined | null, digits = 1) =>
    v === undefined || v === null || Number.isNaN(v)
        ? "—"
        : v.toLocaleString("en-US", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });

const pctf = (v: number | undefined | null, digits = 1) =>
    v === undefined || v === null || Number.isNaN(v) ? "—" : `${nf(v, digits)}%`;

// FIX #6: document the assumed unit for market-cap values.
// The API returns mc in millions SAR. Thresholds scale accordingly:
//   ≥ 1_000_000 M = ≥ 1 trillion SAR → display as "T"
//   ≥ 1_000 M     = ≥ 1 billion SAR  → display as "B"
//   < 1_000 M     = < 1 billion SAR  → display as "M"
const mcf = (v: number | undefined | null) => {
    if (v === undefined || v === null || Number.isNaN(v)) return "—";
    if (v >= 1_000_000) return `${nf(v / 1_000_000, 2)}T`; // unit: millions SAR → trillions
    if (v >= 1_000) return `${nf(v / 1_000, 1)}B`;          // unit: millions SAR → billions
    return `${nf(v, 0)}M`;                                   // unit: millions SAR → displayed as-is
};

/**
 * Honesty Cell Helper:
 * Renders missing values with standard honesty marks (🔌 for missing source, N/A for non-applicable)
 * or computed values with ° so the user knows exact lineage.
 */
function renderHonestyCell(
    value: number | undefined | null,
    formattedContent: React.ReactNode,
    options: {
        isComputed?: boolean;
        missingReason?: "unreported" | "na" | "plug";
        missingTooltip?: string;
    } = {}
) {
    if (value === undefined || value === null || Number.isNaN(value)) {
        const tooltip = options.missingTooltip || (
            options.missingReason === "na"
                ? "Not applicable (N/A) · financial data not relevant to this business"
                : "🔌 Data source unavailable or not yet disclosed in the financial statements"
        );
        return (
            <span
                title={tooltip}
                className="inline-flex items-center gap-1 text-[#9CA3AF] cursor-help"
            >
                <span>—</span>
                <span className="text-[10px] text-[#8C3B32]/70 font-sans">
                    {options.missingReason === "na" ? "N/A" : "🔌"}
                </span>
            </span>
        );
    }

    if (options.isComputed) {
        return (
            <span className="inline-flex items-center gap-0.5 justify-end">
                {formattedContent}
                <span
                    title="° Computed value, derived mathematically from the official financial statements"
                    className="text-[10px] text-[#6B7280] cursor-help"
                >
                    °
                </span>
            </span>
        );
    }

    return formattedContent;
}

// ---------------------------------------------------------------------------
// FIX #5: Named screener threshold constants with financial rationale
// ---------------------------------------------------------------------------

/** Value screen: P/E below this signals potential undervaluation (Graham-style cheap earnings). */
const SCREEN_VALUE_PE_MAX = 12;

/** Value screen: P/B below this indicates price near or below book (balance-sheet value). */
const SCREEN_VALUE_PB_MAX = 1.5;

/** Quality screen: ROE above this threshold signals above-average capital efficiency. */
const SCREEN_QUALITY_ROE_MIN = 15; // percent

/** Quality screen: Piotroski F-Score ≥ 6/9 signals financial strength & improving fundamentals. */
const SCREEN_QUALITY_FSCORE_MIN = 6;

/** Growth screen: PEG < 1 means earnings growth is cheaper than the market pays (Lynch rule). */
const SCREEN_GROWTH_PEG_MAX = 1;

/** Net-Net screen: P/NCAV < 0.66 is Graham's margin-of-safety threshold for net-net bargains. */
const SCREEN_NETNET_PNCAV_MAX = 0.66;

// ---------------------------------------------------------------------------
// Screens (presets over the universe)
// ---------------------------------------------------------------------------

const SCREENS: { id: ScreenId; label: string; test: (c: CompanyUniverseItem) => boolean }[] = [
    { id: "all", label: "All", test: () => true },
    {
        id: "value",
        label: "Value",
        // FIX #5: use named constants instead of magic numbers
        test: (c) => (c.pe ?? Infinity) < SCREEN_VALUE_PE_MAX && (c.pb ?? Infinity) < SCREEN_VALUE_PB_MAX,
    },
    {
        id: "quality",
        label: "Quality",
        // FIX #5: use named constants instead of magic numbers
        test: (c) => (c.roe ?? -Infinity) > SCREEN_QUALITY_ROE_MIN && (c.f_score ?? 0) >= SCREEN_QUALITY_FSCORE_MIN,
    },
    {
        id: "growth",
        label: "Growth",
        // FIX #5: use named constants instead of magic numbers
        test: (c) => (c.peg ?? Infinity) < SCREEN_GROWTH_PEG_MAX && (c.g_net ?? -Infinity) > 0,
    },
    {
        id: "netnet",
        label: "Net-Net",
        // FIX #5: use named constants instead of magic numbers
        test: (c) => (c.pncav ?? Infinity) < SCREEN_NETNET_PNCAV_MAX && (c.pncav ?? 0) > 0,
    },
];

// Grade colors mapped onto the light palette. Accent stays reserved for
// interactive/active state, so grade bands use their own restrained hues.
const GRADE_COLOR: Record<string, string> = {
    "A+": "text-[#16A34A] bg-[#16A34A]/15 border-[#16A34A]/40 font-bold",
    A: "text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/30",
    "A-": "text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/25",
    "B+": "text-[#2563EB] bg-[#2563EB]/15 border-[#2563EB]/40 font-bold",
    B: "text-[#2563EB] bg-[#2563EB]/10 border-[#2563EB]/30",
    "B-": "text-[#2563EB] bg-[#2563EB]/10 border-[#2563EB]/25",
    "C+": "text-[#B45309] bg-[#B45309]/15 border-[#B45309]/40",
    C: "text-[#B45309] bg-[#B45309]/10 border-[#B45309]/30",
    "C-": "text-[#B45309] bg-[#B45309]/10 border-[#B45309]/25",
    D: "text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/30",
    F: "text-[#DC2626] bg-[#DC2626]/15 border-[#DC2626]/40 font-bold",
};

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

/** Renders a grade pill badge or a 🔌 placeholder if grade is absent/N/A. */
function renderGradeBadge(
    grade: { g: string; p: number; b: string } | undefined,
    missingTooltip: string
): React.ReactNode {
    if (!grade || grade.g === "N/A") {
        return (
            <span title={missingTooltip} className="text-[11px] text-[#9CA3AF] cursor-help">
                — 🔌
            </span>
        );
    }
    return (
        <span
            title={`${grade.g} (p${grade.p})`}
            className={`inline-block min-w-[24px] rounded-full border px-1.5 py-0.5 text-center text-[11px] font-semibold ${GRADE_COLOR[grade.g] ?? "border-[#E5E7EB] text-[#6B7280]"
                }`}
        >
            {grade.g}
        </span>
    );
}

/**
 * Shared helper for active vs inactive pill/filter button classes.
 * Includes visible focus-visible outline rings for accessibility.
 */
function pillButtonClass(active: boolean): string {
    return active
        ? "border-[#8C3B32] bg-[#8C3B32]/8 font-semibold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40"
        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32]/40 hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40";
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
    key: SortKey;
    label: string;
    render: (c: CompanyUniverseItem) => React.ReactNode;
    align?: "right" | "left";
}

const COLUMNS: ColumnDef[] = [
    {
        key: "px",
        label: "Price",
        render: (c) =>
            renderHonestyCell(c.px, <span>{nf(c.px, 2)}</span>, {
                missingReason: "plug",
                missingTooltip: "🔌 Closing price is currently unavailable",
            }),
    },
    {
        key: "mc",
        label: "Market Cap",
        render: (c) =>
            renderHonestyCell(c.mc, <span>{mcf(c.mc)}</span>, {
                isComputed: true,
                missingReason: "plug",
                missingTooltip: "🔌 Market capitalization not computed (price × shares outstanding unavailable)",
            }),
    },
    {
        key: "pe",
        label: "P/E",
        render: (c) =>
            renderHonestyCell(c.pe, <span>{nf(c.pe)}</span>, {
                isComputed: true,
                missingReason: c.fresh ? "na" : "plug",
                missingTooltip:
                    c.fresh
                        ? "N/A · Company is loss-making, or has no positive net income to compute the multiple"
                        : "🔌 P/E ratio unavailable: trailing-twelve-month (TTM) earnings are missing",
            }),
    },
    {
        key: "pb",
        label: "P/B",
        render: (c) =>
            renderHonestyCell(c.pb, <span>{nf(c.pb, 2)}</span>, {
                isComputed: true,
                missingReason: "plug",
                missingTooltip: "🔌 Price-to-book (P/B) ratio unavailable",
            }),
    },
    {
        key: "roe",
        label: "ROE",
        render: (c) =>
            renderHonestyCell(c.roe, <span>{pctf(c.roe)}</span>, {
                isComputed: true,
                missingReason: "plug",
                missingTooltip: "🔌 Return on Equity (ROE) unavailable: financial statements are incomplete",
            }),
    },
    {
        key: "g_net",
        label: "Net Income Growth",
        render: (c) =>
            renderHonestyCell(
                c.g_net,
                <span className={(c.g_net ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                    {(c.g_net ?? 0) >= 0 ? "+" : ""}
                    {pctf(c.g_net)}
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Net income growth unavailable: no year-over-year comparison period",
                }
            ),
    },
    {
        key: "peg",
        label: "PEG",
        render: (c) =>
            renderHonestyCell(
                c.peg,
                <span
                    className={`inline-flex items-center gap-1 ${(c.peg ?? 0) < 1
                        ? "text-[#16A34A]"
                        : (c.peg ?? 0) > 2
                            ? "text-[#DC2626]"
                            : "text-[#1A1A1A]"
                        }`}
                >
                    <span>{nf(c.peg, 2)}</span>
                    {(c.peg ?? 0) < 1 && (
                        <span title="Attractive / cheap relative to growth (PEG < 1)" className="text-[10px] font-sans font-medium">
                            ↓
                        </span>
                    )}
                    {(c.peg ?? 0) > 2 && (
                        <span title="Stretched / expensive relative to growth (PEG > 2)" className="text-[10px] font-sans font-medium">
                            ↑
                        </span>
                    )}
                </span>,
                {
                    isComputed: true,
                    missingReason: "na",
                    missingTooltip: "N/A · Not applicable when earnings growth or the P/E ratio is negative",
                }
            ),
    },
    {
        key: "pncav",
        label: "P/NCAV",
        render: (c) =>
            renderHonestyCell(
                c.pncav,
                <span className={(c.pncav ?? 0) < SCREEN_NETNET_PNCAV_MAX ? "text-[#16A34A]" : "text-[#1A1A1A]"}>
                    {nf(c.pncav, 2)}
                </span>,
                {
                    isComputed: true,
                    missingReason: "na",
                    missingTooltip: "N/A · Net Current Asset Value (NCAV) is negative, or not applicable to financial-sector companies",
                }
            ),
    },
    {
        key: "f_score",
        label: "F-Score",
        render: (c) =>
            renderHonestyCell(
                c.f_score,
                <span
                    className={
                        (c.f_score ?? 0) >= 7
                            ? "text-[#16A34A]"
                            : (c.f_score ?? 0) >= 4
                                ? "text-[#B45309]"
                                : "text-[#DC2626]"
                    }
                >
                    {c.f_score}/9
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Piotroski F-Score requires all 9 financial criteria; not all were available",
                }
            ),
    },
    {
        key: "nm" as SortKey,
        label: "Net Margin",
        render: (c) =>
            renderHonestyCell(
                c.nm,
                <span className={(c.nm ?? 0) >= 15 ? "text-[#16A34A]" : (c.nm ?? 0) >= 5 ? "text-[#B45309]" : "text-[#DC2626]"}
                >
                    {pctf(c.nm)}
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Net margin unavailable (revenue or net income is missing)",
                }
            ),
    },
    {
        key: "de" as SortKey,
        label: "D/E",
        render: (c) =>
            renderHonestyCell(
                c.de,
                <span className={(c.de ?? 0) <= 0.5 ? "text-[#16A34A]" : (c.de ?? 0) <= 1.5 ? "text-[#B45309]" : "text-[#DC2626]"}
                >
                    {nf(c.de, 2)}
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Debt-to-equity (D/E) ratio unavailable",
                }
            ),
    },
    {
        key: "fcf_yield" as SortKey,
        label: "FCF Yld",
        render: (c) =>
            renderHonestyCell(
                c.fcf_yield,
                <span className={(c.fcf_yield ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}
                >
                    {(c.fcf_yield ?? 0) >= 0 ? "+" : ""}{pctf(c.fcf_yield)}
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Free Cash Flow (FCF) yield requires the Cash Flow Statement",
                }
            ),
    },
    {
        key: "owner_yield" as SortKey,
        label: "Owner Yld°",
        render: (c) =>
            renderHonestyCell(
                c.owner_yield,
                <span
                    className={`inline-flex items-center gap-1 ${(c.owner_yield ?? 0) >= 5
                        ? "text-[#16A34A]"
                        : (c.owner_yield ?? 0) >= 0
                            ? "text-[#B45309]"
                            : "text-[#DC2626]"
                        }`}
                >
                    <span>{pctf(c.owner_yield, 2)}</span>
                </span>,
                {
                    isComputed: true,
                    missingReason: "plug",
                    missingTooltip: "🔌 Owner Yield = (FCF + Dividends) ÷ Market Cap — requires the Cash Flow Statement",
                }
            ),
    },
];

// ---------------------------------------------------------------------------
// Export columns (CSV / Excel)
// ---------------------------------------------------------------------------

const EXPORT_COLUMNS: ExportColumn<CompanyUniverseItem>[] = [
    { label: "Ticker", value: (c) => c.sym },
    { label: "Company", value: (c) => companyName(c) },
    { label: "Sector", value: (c) => sectorName(c) },
    { label: "Price (SAR)", value: (c) => c.px },
    { label: "Market Cap (SAR M)", value: (c) => c.mc },
    { label: "P/E", value: (c) => c.pe },
    { label: "P/B", value: (c) => c.pb },
    { label: "ROE (%)", value: (c) => c.roe },
    { label: "Net Income Growth (%)", value: (c) => c.g_net },
    { label: "Revenue Growth (%)", value: (c) => c.g_rev },
    { label: "PEG", value: (c) => c.peg },
    { label: "P/NCAV", value: (c) => c.pncav },
    { label: "F-Score", value: (c) => c.f_score },
    { label: "Net Margin (%)", value: (c) => c.nm },
    { label: "D/E", value: (c) => c.de },
    { label: "FCF Yield (%)", value: (c) => c.fcf_yield },
    { label: "Owner Yield (%)", value: (c) => c.owner_yield },
    { label: "Financials Updated?", value: (c) => (c.fresh ? "Yes" : "No") },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RebhWatchlistPage() {
    const [universe, setUniverse] = useState<CompanyUniverseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [sector, setSector] = useState<string>(ALL_SECTORS);
    const [screen, setScreen] = useState<ScreenId>("all");
    const [sortKey, setSortKey] = useState<SortKey>("mc");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [onlyFresh, setOnlyFresh] = useState(false);
    const [watchOnly, setWatchOnly] = useState(false);

    // UX #4: Tracking pending & error toggle state per symbol
    const [pendingWatch, setPendingWatch] = useState<Set<string>>(new Set());
    const [failedWatch, setFailedWatch] = useState<Set<string>>(new Set());

    // UX #6: Last updated timestamp
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Scroll state for subtle shadows
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // FIX #1: inline error shown when backend toggle fails
    const [toggleError, setToggleError] = useState<string | null>(null);

    // Ref used so pressing Enter in the search box can jump to the first
    // matching row instead of only filtering the table in place.
    const tableWrapRef = useRef<HTMLDivElement>(null);

    // UX #1: Debounce search input (~250ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 250);
        return () => clearTimeout(handler);
    }, [query]);

    // FIX #3: minimal shape guard — verifies an item has the required fields
    // before accepting it into the typed universe array.
    function isValidUniverseItem(item: unknown): item is CompanyUniverseItem {
        if (!item || typeof item !== "object") return false;
        const o = item as Record<string, unknown>;
        return (
            typeof o.sym === "string" &&
            typeof o.fresh === "boolean"
            // n, sec, px, mc are expected but we do not hard-reject partial records
            // so the table degrades gracefully for incomplete entries.
        );
    }

    // In-flight control for the market-universe fetch: abort on unmount and
    // ignore stale responses when a newer request (or retry) has started.
    const universeAbortRef = useRef<AbortController | null>(null);
    const universeReqIdRef = useRef(0);

    async function loadUniverse() {
        universeAbortRef.current?.abort();
        const controller = new AbortController();
        universeAbortRef.current = controller;
        const reqId = ++universeReqIdRef.current;
        const isStale = () => reqId !== universeReqIdRef.current || controller.signal.aborted;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/rebh/universe`, { signal: controller.signal });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            if (isStale()) return;
            // FIX #3: apply shape guard before casting
            const raw: unknown[] = Array.isArray(data) ? data : (data.companies ?? []);
            const list: CompanyUniverseItem[] = raw.filter(isValidUniverseItem);
            setUniverse(list);
            setLastUpdated(
                new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch (e) {
            if ((e as any)?.name === "AbortError") return;
            if (!isStale()) setError(e instanceof Error ? e.message : "Unable to load company data.");
        } finally {
            if (!isStale()) setLoading(false);
        }
    }

    useEffect(() => {
        loadUniverse();
        return () => {
            universeAbortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // FIX #4: AbortController + mounted guard to prevent setState after unmount.
    // FIX #2: backend returning symbols=[] (empty but valid) is now treated as
    //         a valid empty watchlist — we do NOT fall back to localStorage in
    //         that case. Fallback only happens when the request itself fails.
    useEffect(() => {
        const controller = new AbortController();
        let mounted = true;

        async function fetchUserWatchlist() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/rebh/watchlist`, {
                    credentials: "include",
                    signal: controller.signal,   // FIX #4: wire abort signal
                });
                if (res.ok) {
                    const data = await res.json();
                    // FIX #2: accept empty array from backend as valid state;
                    // only fall back to localStorage when the key is absent/not-array.
                    if (data && Array.isArray(data.symbols)) {
                        if (mounted) setWatchlist(new Set(data.symbols));
                        return; // ← return regardless of length; empty is valid
                    }
                }
                // Backend request failed (non-ok) → fall back to localStorage
                const saved = localStorage.getItem("rebh_user_watchlist");
                if (saved && mounted) {
                    const list = JSON.parse(saved);
                    if (Array.isArray(list)) {
                        setWatchlist(new Set(list));
                    }
                }
            } catch (e) {
                // FIX #4: ignore abort errors triggered by cleanup
                if ((e as Error)?.name === "AbortError") return;
                console.error("Failed to load watchlist from API, using localStorage:", e);
                const saved = localStorage.getItem("rebh_user_watchlist");
                if (saved && mounted) {
                    const list = JSON.parse(saved);
                    if (Array.isArray(list)) setWatchlist(new Set(list));
                }
            }
        }
        fetchUserWatchlist();

        // FIX #4: cleanup — abort in-flight request and block deferred setState
        return () => {
            mounted = false;
            controller.abort();
        };
    }, []);

    // FIX #1 & UX #4: toggleWatch now manages pending state, reverts optimistic state,
    // and highlights failed sync on the star icon.
    const toggleWatch = async (sym: string) => {
        // Snapshot state before optimistic update so we can revert on failure
        let previousState: Set<string> | null = null;

        // Set pending indicator
        setPendingWatch((prev) => new Set(prev).add(sym));
        setFailedWatch((prev) => {
            const next = new Set(prev);
            next.delete(sym);
            return next;
        });

        setWatchlist((prev) => {
            previousState = new Set(prev); // capture for potential rollback
            const next = new Set(prev);
            next.has(sym) ? next.delete(sym) : next.add(sym);
            try {
                localStorage.setItem("rebh_user_watchlist", JSON.stringify(Array.from(next)));
            } catch (e) {
                console.error("Failed to save watchlist to localStorage:", e);
            }
            return next;
        });

        // Clear any previous toggle error before the new attempt
        setToggleError(null);

        // Sync with backend API — FIX #1: revert on failure, show toast
        try {
            const res = await fetch(`${API_BASE_URL}/api/rebh/watchlist/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ symbol: sym })
            });
            if (!res.ok) throw new Error(`(${res.status})`);
        } catch (e) {
            // Revert optimistic state to the snapshot taken above
            if (previousState !== null) {
                setWatchlist(previousState);
                try {
                    localStorage.setItem(
                        "rebh_user_watchlist",
                        JSON.stringify(Array.from(previousState as Set<string>))
                    );
                } catch (_) { /* ignore secondary localStorage error */ }
            }
            // Mark failed symbol visually
            setFailedWatch((prev) => new Set(prev).add(sym));
            const msg = e instanceof Error ? e.message : "";
            setToggleError(`Unable to update watchlist ${msg} — please try again`);
            // Auto-dismiss after 4 seconds
            setTimeout(() => {
                setToggleError(null);
                setFailedWatch((prev) => {
                    const next = new Set(prev);
                    next.delete(sym);
                    return next;
                });
            }, 4000);
        } finally {
            setPendingWatch((prev) => {
                const next = new Set(prev);
                next.delete(sym);
                return next;
            });
        }
    };

    const sectors = useMemo(() => {
        const s = new Set<string>();
        universe.forEach((c) => {
            const name = sectorName(c);
            if (name) s.add(name);
        });
        return [ALL_SECTORS, ...Array.from(s).sort()];
    }, [universe]);

    function sortBy(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    // UX #2: Keyboard handler for sortable headers (Enter or Space)
    function handleHeaderKeyDown(e: React.KeyboardEvent, key: SortKey) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            sortBy(key);
        }
    }

    // UX #1: filtered uses debouncedQuery
    const filtered = useMemo(() => {
        const q = debouncedQuery.trim().toUpperCase();
        const activeScreen = SCREENS.find((s) => s.id === screen) ?? SCREENS[0];
        let rows = universe.filter((c) => {
            if (sector !== ALL_SECTORS && sectorName(c) !== sector) return false;
            if (onlyFresh && !c.fresh) return false;
            if (watchOnly && !watchlist.has(c.sym)) return false;
            if (!activeScreen.test(c)) return false;
            if (
                q &&
                !(
                    c.sym.toUpperCase().includes(q) ||
                    c.n?.toUpperCase().includes(q) ||
                    c.en?.toUpperCase().includes(q)
                )
            )
                return false;
            return true;
        });
        rows = [...rows].sort((a, b) => {
            if (sortKey === "sym") {
                return sortDir === "asc" ? a.sym.localeCompare(b.sym) : b.sym.localeCompare(a.sym);
            }
            const va = a[sortKey];
            const vb = b[sortKey];
            if (va === undefined || va === null) return 1;
            if (vb === undefined || vb === null) return -1;
            return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        });
        return rows;
    }, [universe, debouncedQuery, sector, screen, onlyFresh, watchOnly, watchlist, sortKey, sortDir]);

    // UX #5: Active filters description list
    const activeFiltersList = useMemo(() => {
        const list: string[] = [];
        if (query.trim()) list.push(`Search: "${query.trim()}"`);
        if (sector !== ALL_SECTORS) list.push(`Sector: ${sector}`);
        if (screen !== "all") {
            const s = SCREENS.find((sc) => sc.id === screen);
            if (s) list.push(`Screen: ${s.label}`);
        }
        if (watchOnly) list.push("My watchlist only");
        if (onlyFresh) list.push("Updated financials only");
        return list;
    }, [query, sector, screen, watchOnly, onlyFresh]);

    // UX #5: Clear all active filters helper
    const clearAllFilters = () => {
        setQuery("");
        setDebouncedQuery("");
        setSector(ALL_SECTORS);
        setScreen("all");
        setWatchOnly(false);
        setOnlyFresh(false);
    };

    // Handle scroll shadow detection for the table container
    const updateScrollIndicators = () => {
        const el = tableWrapRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        const currentScroll = Math.abs(el.scrollLeft);
        setCanScrollRight(currentScroll < maxScroll - 4);
        setCanScrollLeft(currentScroll > 4);
    };

    useEffect(() => {
        const el = tableWrapRef.current;
        if (!el) return;
        updateScrollIndicators();
        el.addEventListener("scroll", updateScrollIndicators, { passive: true });
        window.addEventListener("resize", updateScrollIndicators);
        return () => {
            el.removeEventListener("scroll", updateScrollIndicators);
            window.removeEventListener("resize", updateScrollIndicators);
        };
    }, [filtered]);

    // Enter-to-jump: scroll the table wrapper so the first matching row is
    // at the top, without changing any filtering/sorting logic above.
    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter") return;
        const wrap = tableWrapRef.current;
        if (!wrap) return;
        const firstRow = wrap.querySelector<HTMLElement>("tbody tr[data-row]");
        firstRow?.scrollIntoView({ block: "start" });
    }

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
        return sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-[#8C3B32]" />
        ) : (
            <ArrowDown className="h-3 w-3 text-[#8C3B32]" />
        );
    };

    return (
        <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] antialiased">
            {/* Header */}
            <header className="border-b border-[#E5E7EB] bg-white px-5 py-6 sm:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
                        Watchlist &amp; Screener
                    </h1>
                    <p className="max-w-2xl text-sm text-[#6B7280]">
                        Every Tadawul-listed company covered by the platform, in one sortable table. Sort by preset screens, filter by sector, and star the names you want to follow.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8">
                {/* FIX #1: inline toast for watchlist toggle failures */}
                {toggleError && (
                    <div className="mb-4 flex items-center gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-sm text-[#DC2626]">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{toggleError}</span>
                        <button
                            onClick={() => setToggleError(null)}
                            className="ml-auto text-[#DC2626]/60 hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
                            aria-label="Dismiss"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Controls panel — search, sector, filters and refresh grouped in one card */}
                <div className="mb-5 rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[220px] flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search by ticker or company name…"
                                    className="w-full rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] py-2 pl-9 pr-9 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15 focus-visible:ring-2 focus-visible:ring-[#8C3B32]/30"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                aria-label="Filter by sector"
                                className="rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15 focus-visible:ring-2 focus-visible:ring-[#8C3B32]/30"
                            >
                                {sectors.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setShowFilters((v) => !v)}
                                className={`flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40 ${showFilters
                                    ? "border-[#8C3B32] bg-[#8C3B32]/5 text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
                                    }`}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Filters
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadUniverse}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#6B7280] transition-colors hover:border-[#8C3B32]/40 hover:text-[#1A1A1A] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                    Refresh
                                </button>
                                {/* UX #6: Last updated timestamp indicator */}
                                {lastUpdated && (
                                    <span className="text-[11px] text-[#9CA3AF] tabular-nums" title="Time of the last data refresh">
                                        Updated: {lastUpdated}
                                    </span>
                                )}
                                {/* Export current view (respects active tab/screen + filters) */}
                                <ExportButton
                                    rows={filtered}
                                    columns={EXPORT_COLUMNS}
                                    filenameBase={`rebh-${SCREENS.find((s) => s.id === screen)?.label ?? "All"}`}
                                    contextLabel={SCREENS.find((s) => s.id === screen)?.label}
                                    disabled={loading || !!error}
                                />
                            </div>
                        </div>

                        {/* Screener presets */}
                        <div className="flex flex-wrap items-center gap-2">
                            {SCREENS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setScreen(s.id)}
                                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${pillButtonClass(
                                        screen === s.id
                                    )}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                            <span className="mx-1 h-4 w-px bg-[#E5E7EB]" />
                            <button
                                onClick={() => setWatchOnly((v) => !v)}
                                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${pillButtonClass(
                                    watchOnly
                                )}`}
                            >
                                <Star className={`h-3 w-3 ${watchOnly ? "fill-[#8C3B32] text-[#8C3B32]" : ""}`} />
                                My Watchlist ({watchlist.size})
                            </button>
                        </div>

                        {/* Expandable filter row */}
                        {showFilters && (
                            <div className="flex flex-wrap items-center gap-4 rounded-[4px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm">
                                <label className="flex items-center gap-2 text-[#1A1A1A] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={onlyFresh}
                                        onChange={(e) => setOnlyFresh(e.target.checked)}
                                        className="accent-[#8C3B32] focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40"
                                    />
                                    Updated financial statements only
                                </label>
                                <span className="text-xs text-[#6B7280]">
                                    {filtered.length} of {universe.length} companies match
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Container with relative wrapper and subtle horizontal scroll-fade indicators */}
                <div className="relative overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    {/* Horizontal scroll indicators */}
                    <div
                        className={`pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-8 bg-gradient-to-l from-black/5 to-transparent transition-opacity duration-200 ${canScrollRight ? "opacity-100" : "opacity-0"
                            }`}
                    />
                    <div
                        className={`pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-8 bg-gradient-to-r from-black/5 to-transparent transition-opacity duration-200 ${canScrollLeft ? "opacity-100" : "opacity-0"
                            }`}
                    />

                    <div ref={tableWrapRef} className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[900px] border-collapse text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6]">
                                    <th className="w-8 px-3 py-2.5" />
                                    {/* UX #2 & #3: Sortable th with accessibility attributes and focus ring */}
                                    <th
                                        role="button"
                                        tabIndex={0}
                                        aria-sort={sortKey === "sym" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                                        onClick={() => sortBy("sym")}
                                        onKeyDown={(e) => handleHeaderKeyDown(e, "sym")}
                                        className="sticky left-0 z-10 cursor-pointer whitespace-nowrap bg-[#F3F4F6] px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8C3B32]/40"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            Company <SortIcon col="sym" />
                                        </span>
                                    </th>
                                    {COLUMNS.map((col) => (
                                        <th
                                            key={col.key}
                                            role="button"
                                            tabIndex={0}
                                            aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                                            onClick={() => sortBy(col.key)}
                                            onKeyDown={(e) => handleHeaderKeyDown(e, col.key)}
                                            className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8C3B32]/40"
                                        >
                                            <span className="inline-flex w-full items-center justify-end gap-1">
                                                {col.label}
                                                {/* UX #6: SAR currency badge on price column */}
                                                {col.key === "px" && (
                                                    <span className="text-[10px] text-[#9CA3AF] font-normal ml-0.5">
                                                        (SAR)
                                                    </span>
                                                )}
                                                <SortIcon col={col.key} />
                                            </span>
                                        </th>
                                    ))}
                                    <th
                                        title="Valuation grade (A–F): measures price attractiveness relative to earnings (P/E). A: deeply undervalued, F: overvalued."
                                        className="cursor-help px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]"
                                    >
                                        <span className="inline-flex items-center justify-start gap-1">
                                            <span>Valuation</span>
                                            <HelpCircle className="h-3 w-3 text-[#9CA3AF]" />
                                        </span>
                                    </th>
                                    <th
                                        title="Growth grade (A–F): measures YoY net income growth. A+: growth > 30%, F: contraction."
                                        className="cursor-help px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]"
                                    >
                                        <span className="inline-flex items-center justify-start gap-1">
                                            <span>Growth</span>
                                            <HelpCircle className="h-3 w-3 text-[#9CA3AF]" />
                                        </span>
                                    </th>
                                    <th
                                        title="Profitability grade (A–F): measures Return on Equity (ROE). A+: ROE > 25%, F: losses."
                                        className="cursor-help px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]"
                                    >
                                        <span className="inline-flex items-center justify-start gap-1">
                                            <span>Profitability</span>
                                            <HelpCircle className="h-3 w-3 text-[#9CA3AF]" />
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <TableStatusRow
                                        state="loading"
                                        colSpan={COLUMNS.length + 5}
                                    />
                                )}

                                {!loading && error && (
                                    <TableStatusRow
                                        state="error"
                                        colSpan={COLUMNS.length + 5}
                                        message={error}
                                        onRetry={loadUniverse}
                                    />
                                )}

                                {!loading && !error && filtered.length === 0 && (
                                    <TableStatusRow
                                        state="empty"
                                        colSpan={COLUMNS.length + 5}
                                        activeFilters={activeFiltersList}
                                        onClearFilters={clearAllFilters}
                                    />
                                )}

                                {!loading &&
                                    !error &&
                                    filtered.map((c) => (
                                        <tr
                                            key={c.sym}
                                            data-row
                                            className="group border-b border-[#E5E7EB] last:border-0 hover:bg-[#F3F4F6] transition-colors"
                                        >
                                            <td className="px-3 py-2.5">
                                                {/* UX #3 & #4: Pending/error visual state and focus ring on star button */}
                                                <button
                                                    onClick={() => toggleWatch(c.sym)}
                                                    disabled={pendingWatch.has(c.sym)}
                                                    aria-label={watchlist.has(c.sym) ? "Remove from watchlist" : "Add to watchlist"}
                                                    className={`rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40 ${failedWatch.has(c.sym)
                                                        ? "text-[#DC2626]"
                                                        : "text-[#9CA3AF] hover:text-[#8C3B32]"
                                                        }`}
                                                >
                                                    {pendingWatch.has(c.sym) ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8C3B32]" />
                                                    ) : (
                                                        <Star
                                                            className={`h-3.5 w-3.5 ${watchlist.has(c.sym) ? "fill-[#8C3B32] text-[#8C3B32]" : ""
                                                                } ${failedWatch.has(c.sym) ? "stroke-[#DC2626] text-[#DC2626]" : ""}`}
                                                        />
                                                    )}
                                                </button>
                                            </td>
                                            {/* Fix sticky column hover bug by applying group-hover:bg-[#F3F4F6] */}
                                            <td className="sticky left-0 z-[1] whitespace-nowrap bg-white px-3 py-2.5 text-left group-hover:bg-[#F3F4F6] transition-colors">
                                                <div className="flex items-center gap-1.5">
                                                    <a
                                                        href={`/rebh/company/${c.sym}`}
                                                        className="font-semibold text-[#8C3B32] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40 rounded"
                                                    >
                                                        {c.sym}
                                                    </a>
                                                    {/* Truncated company name with full title attribute */}
                                                    <span
                                                        title={companyName(c)}
                                                        className="max-w-[220px] truncate text-xs text-[#6B7280] cursor-default"
                                                    >
                                                        {companyName(c)}
                                                    </span>
                                                    {!c.fresh && (
                                                        <Badge
                                                            tone="warning"
                                                            title="Stale financials — excluded from automated pricing until disclosure is complete"
                                                            className="text-[10px]"
                                                        >
                                                            Stale ⚑
                                                        </Badge>
                                                    )}
                                                    {(c.pe == null && c.roe == null && c.fresh) && (
                                                        <Badge
                                                            tone="danger"
                                                            title="In the Too-Hard Pile (Quarantine): incomplete Income Statement or persistent losses"
                                                            className="text-[10px]"
                                                        >
                                                            Quarantined
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            {COLUMNS.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-[#1A1A1A]"
                                                >
                                                    {col.render(c)}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2.5 text-left">
                                                {/* Valuation grade */}
                                                {renderGradeBadge(c.grades?.Valuation, "🔌 Valuation grade unavailable: insufficient data")}
                                            </td>
                                            <td className="px-3 py-2.5 text-left">
                                                {/* Growth grade */}
                                                {renderGradeBadge(c.grades?.Growth, "🔌 Growth grade unavailable: net income growth data is missing")}
                                            </td>
                                            <td className="px-3 py-2.5 text-left">
                                                {/* Profitability grade */}
                                                {renderGradeBadge(c.grades?.Profitability, "🔌 Profitability grade unavailable: ROE data is missing")}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && !error && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
                        <div>
                            Showing {filtered.length} of {universe.length} companies · Analysis only, not investment advice.
                        </div>
                        {/* Honesty Marks Legend */}
                        <div className="flex items-center gap-3 font-mono text-[11px] text-[#6B7280]">
                            <span title="Value computed dynamically from the financial statements">° Computed</span>
                            <span title="Warning flag for stale or quarantined financials">⚑ Alert</span>
                            <span title="Data unavailable or not yet disclosed by the source">🔌 Missing source</span>
                            <span title="Not applicable to this stock or sector">N/A Not applicable</span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/*
  UX notes:
  - Sticky first column's background is synchronized with row hover via Tailwind's `group` + `group-hover:bg-[#F3F4F6]`.
  - Subtle scroll gradient indicators hint at overflow and hidden columns.
  - Grade column and truncated names have full informative hover titles.
  - Search query is debounced (~250ms) to ensure smooth typing on large universes.
  - Full keyboard accessibility and focus-visible rings for all interactive elements.
  - English display names are preferred via `en` / `sec_en` when the backend provides them, falling back to `n` / `sec`.
*/