"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    Loader2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyUniverseItem {
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
    peg?: number;
    ncav?: number;
    pncav?: number;
    f_score?: number;
    fresh: boolean;
    grades?: Record<string, { g: string; p: number; b: string }>;
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
    | "f_score";

type SortDir = "asc" | "desc";

type ScreenId = "all" | "value" | "quality" | "growth" | "netnet" | "watch";

// ---------------------------------------------------------------------------
// Formatting helpers
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

const mcf = (v: number | undefined | null) => {
    if (v === undefined || v === null || Number.isNaN(v)) return "—";
    if (v >= 1_000_000) return `${nf(v / 1_000_000, 2)}T`;
    if (v >= 1_000) return `${nf(v / 1_000, 1)}B`;
    return `${nf(v, 0)}M`;
};

// ---------------------------------------------------------------------------
// Screens (presets over the universe)
// ---------------------------------------------------------------------------

const SCREENS: { id: ScreenId; label: string; test: (c: CompanyUniverseItem) => boolean }[] = [
    { id: "all", label: "All", test: () => true },
    {
        id: "value",
        label: "Value",
        test: (c) => (c.pe ?? Infinity) < 12 && (c.pb ?? Infinity) < 1.5,
    },
    {
        id: "quality",
        label: "Quality",
        test: (c) => (c.roe ?? -Infinity) > 15 && (c.f_score ?? 0) >= 6,
    },
    {
        id: "growth",
        label: "Growth",
        test: (c) => (c.peg ?? Infinity) < 1 && (c.g_net ?? -Infinity) > 0,
    },
    {
        id: "netnet",
        label: "Net-net",
        test: (c) => (c.pncav ?? Infinity) < 0.66 && (c.pncav ?? 0) > 0,
    },
];

// Grade colors mapped onto the light palette. Accent stays reserved for
// interactive/active state, so grade bands use their own restrained hues.
const GRADE_COLOR: Record<string, string> = {
    A: "text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/30",
    B: "text-[#2563EB] bg-[#2563EB]/10 border-[#2563EB]/30",
    C: "text-[#B45309] bg-[#B45309]/10 border-[#B45309]/30",
    D: "text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/30",
    F: "text-[#DC2626] bg-[#DC2626]/15 border-[#DC2626]/40",
};

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
    { key: "px", label: "Price", render: (c) => nf(c.px, 2) },
    { key: "mc", label: "Mkt Cap", render: (c) => mcf(c.mc) },
    { key: "pe", label: "P/E", render: (c) => nf(c.pe) },
    { key: "pb", label: "P/B", render: (c) => nf(c.pb, 2) },
    { key: "roe", label: "ROE", render: (c) => pctf(c.roe) },
    {
        key: "g_net",
        label: "Net Growth",
        render: (c) =>
            c.g_net === undefined || c.g_net === null ? (
                "—"
            ) : (
                <span className={c.g_net >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                    {c.g_net >= 0 ? "+" : ""}
                    {pctf(c.g_net)}
                </span>
            ),
    },
    {
        key: "peg",
        label: "PEG",
        render: (c) =>
            c.peg === undefined || c.peg === null ? (
                <span className="text-[#9CA3AF]">—</span>
            ) : (
                <span
                    className={
                        c.peg < 1
                            ? "text-[#16A34A]"
                            : c.peg > 2
                                ? "text-[#DC2626]"
                                : "text-[#1A1A1A]"
                    }
                >
                    {nf(c.peg, 2)}
                </span>
            ),
    },
    {
        key: "pncav",
        label: "P/NCAV",
        render: (c) =>
            c.pncav === undefined || c.pncav === null ? (
                <span className="text-[#9CA3AF]">—</span>
            ) : (
                <span className={c.pncav < 0.66 ? "text-[#16A34A]" : "text-[#1A1A1A]"}>
                    {nf(c.pncav, 2)}
                </span>
            ),
    },
    {
        key: "f_score",
        label: "F-Score",
        render: (c) =>
            c.f_score === undefined || c.f_score === null ? (
                <span className="text-[#9CA3AF]">—</span>
            ) : (
                <span
                    className={
                        c.f_score >= 7
                            ? "text-[#16A34A]"
                            : c.f_score >= 4
                                ? "text-[#B45309]"
                                : "text-[#DC2626]"
                    }
                >
                    {c.f_score}/9
                </span>
            ),
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RebhWatchlistPage() {
    const [universe, setUniverse] = useState<CompanyUniverseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [sector, setSector] = useState<string>("All sectors");
    const [screen, setScreen] = useState<ScreenId>("all");
    const [sortKey, setSortKey] = useState<SortKey>("mc");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [onlyFresh, setOnlyFresh] = useState(false);
    const [watchOnly, setWatchOnly] = useState(false);

    // Ref used so pressing Enter in the search box can jump to the first
    // matching row instead of only filtering the table in place.
    const tableWrapRef = useRef<HTMLDivElement>(null);

    async function loadUniverse() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/rebh/universe`);
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            const list: CompanyUniverseItem[] = Array.isArray(data) ? data : data.companies ?? [];
            setUniverse(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load the universe.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUniverse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist watchlist in backend database (synced per user), fallback to localStorage
    useEffect(() => {
        async function fetchUserWatchlist() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/rebh/watchlist`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.symbols) && data.symbols.length > 0) {
                        setWatchlist(new Set(data.symbols));
                        return;
                    }
                }
                const saved = localStorage.getItem("rebh_user_watchlist");
                if (saved) {
                    const list = JSON.parse(saved);
                    if (Array.isArray(list)) {
                        setWatchlist(new Set(list));
                    }
                }
            } catch (e) {
                console.error("Failed to load watchlist from API, using localStorage:", e);
                const saved = localStorage.getItem("rebh_user_watchlist");
                if (saved) {
                    const list = JSON.parse(saved);
                    if (Array.isArray(list)) setWatchlist(new Set(list));
                }
            }
        }
        fetchUserWatchlist();
    }, []);

    const toggleWatch = async (sym: string) => {
        setWatchlist((prev) => {
            const next = new Set(prev);
            next.has(sym) ? next.delete(sym) : next.add(sym);
            try {
                localStorage.setItem("rebh_user_watchlist", JSON.stringify(Array.from(next)));
            } catch (e) {
                console.error("Failed to save watchlist to localStorage:", e);
            }
            return next;
        });

        // Sync with backend API
        try {
            await fetch(`${API_BASE_URL}/api/rebh/watchlist/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ symbol: sym })
            });
        } catch (_) {}
    };

    const sectors = useMemo(() => {
        const s = new Set<string>();
        universe.forEach((c) => c.sec && s.add(c.sec));
        return ["All sectors", ...Array.from(s).sort()];
    }, [universe]);

    function sortBy(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    const filtered = useMemo(() => {
        const q = query.trim().toUpperCase();
        const activeScreen = SCREENS.find((s) => s.id === screen) ?? SCREENS[0];
        let rows = universe.filter((c) => {
            if (sector !== "All sectors" && c.sec !== sector) return false;
            if (onlyFresh && !c.fresh) return false;
            if (watchOnly && !watchlist.has(c.sym)) return false;
            if (!activeScreen.test(c)) return false;
            if (q && !(c.sym.toUpperCase().includes(q) || c.n?.toUpperCase().includes(q))) return false;
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
    }, [universe, query, sector, screen, onlyFresh, watchOnly, watchlist, sortKey, sortDir]);

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
        <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] antialiased">
            {/* Header */}
            <header className="border-b border-[#E5E7EB] bg-white px-5 py-6 sm:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
                        Watchlist &amp; screener
                    </h1>
                    <p className="max-w-2xl text-sm text-[#6B7280]">
                        Every TASI-listed company the platform covers, in one sortable table. Screen by
                        preset, filter by sector, star what you want to track.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8">
                {/* Controls panel — search, sector, filters and refresh grouped in one card
                    instead of floating loose above the table. */}
                <div className="mb-5 rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[220px] flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search symbol or company name…"
                                    className="w-full rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] py-2 pl-9 pr-9 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                className="rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/15"
                            >
                                {sectors.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setShowFilters((v) => !v)}
                                className={`flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-medium transition-colors ${showFilters
                                    ? "border-[#8C3B32] bg-[#8C3B32]/5 text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
                                    }`}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Filters
                            </button>

                            <button
                                onClick={loadUniverse}
                                disabled={loading}
                                className="flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#6B7280] transition-colors hover:border-[#8C3B32]/40 hover:text-[#1A1A1A] disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Screener presets */}
                        <div className="flex flex-wrap items-center gap-2">
                            {SCREENS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setScreen(s.id)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${screen === s.id
                                        ? "border-[#8C3B32] bg-[#8C3B32]/8 font-semibold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                            <span className="mx-1 h-4 w-px bg-[#E5E7EB]" />
                            <button
                                onClick={() => setWatchOnly((v) => !v)}
                                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${watchOnly
                                    ? "border-[#8C3B32] bg-[#8C3B32]/8 font-semibold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
                                    }`}
                            >
                                <Star className={`h-3 w-3 ${watchOnly ? "fill-[#8C3B32] text-[#8C3B32]" : ""}`} />
                                My watchlist ({watchlist.size})
                            </button>
                        </div>

                        {/* Expandable filter row */}
                        {showFilters && (
                            <div className="flex flex-wrap items-center gap-4 rounded-[4px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-sm">
                                <label className="flex items-center gap-2 text-[#1A1A1A]">
                                    <input
                                        type="checkbox"
                                        checked={onlyFresh}
                                        onChange={(e) => setOnlyFresh(e.target.checked)}
                                        className="accent-[#8C3B32]"
                                    />
                                    Fresh statements only
                                </label>
                                <span className="text-xs text-[#6B7280]">
                                    {filtered.length} of {universe.length} companies match
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <div ref={tableWrapRef} className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[900px] border-collapse text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6]">
                                    <th className="w-8 px-3 py-2.5" />
                                    <th
                                        onClick={() => sortBy("sym")}
                                        className="sticky left-0 z-10 cursor-pointer whitespace-nowrap bg-[#F3F4F6] px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A]"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            Company <SortIcon col="sym" />
                                        </span>
                                    </th>
                                    {COLUMNS.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => sortBy(col.key)}
                                            className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A]"
                                        >
                                            <span className="inline-flex w-full items-center justify-end gap-1">
                                                {col.label} <SortIcon col={col.key} />
                                            </span>
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280]">
                                        Grade
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-16 text-center text-[#6B7280]">
                                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#8C3B32]" />
                                            Loading the universe…
                                        </td>
                                    </tr>
                                )}

                                {!loading && error && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-10">
                                            <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 text-center">
                                                <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                                                <div className="text-sm font-medium text-[#DC2626]">
                                                    Couldn't load the universe
                                                </div>
                                                <div className="text-xs text-[#DC2626]/80">{error}</div>
                                                <button
                                                    onClick={loadUniverse}
                                                    className="mt-1 rounded-[4px] border border-[#DC2626]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-16 text-center text-[#6B7280]">
                                            No companies match these filters. Try clearing the search or switching sectors.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    !error &&
                                    filtered.map((c) => (
                                        <tr
                                            key={c.sym}
                                            data-row
                                            className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F3F4F6]"
                                        >
                                            <td className="px-3 py-2.5">
                                                <button
                                                    onClick={() => toggleWatch(c.sym)}
                                                    aria-label={watchlist.has(c.sym) ? "Remove from watchlist" : "Add to watchlist"}
                                                    className="text-[#9CA3AF] hover:text-[#8C3B32]"
                                                >
                                                    <Star
                                                        className={`h-3.5 w-3.5 ${watchlist.has(c.sym) ? "fill-[#8C3B32] text-[#8C3B32]" : ""
                                                            }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="sticky left-0 z-[1] whitespace-nowrap bg-white px-3 py-2.5 group-hover:bg-[#F3F4F6]">
                                                <div className="flex items-center gap-1.5">
                                                    <a href={`/rebh/company/${c.sym}`} className="font-semibold text-[#8C3B32] hover:underline">
                                                        {c.sym}
                                                    </a>
                                                    <span className="max-w-[220px] truncate text-xs text-[#6B7280]">
                                                        {c.n}
                                                    </span>
                                                    {!c.fresh && (
                                                        <span className="rounded-full border border-[#B45309]/30 bg-[#B45309]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#B45309]" title="قوائم غير محدثة — مستبعدة من التسعير">
                                                            Stale ⚑
                                                        </span>
                                                    )}
                                                    {(c.pe == null && c.roe == null && c.fresh) && (
                                                        <span className="rounded-full border border-[#DC2626]/30 bg-[#DC2626]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#DC2626]" title="في سلة مونجر (قائمة دخل فارغة)">
                                                            Quarantine
                                                        </span>
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
                                            <td className="px-3 py-2.5 text-right">
                                                {c.grades?.Valuation ? (
                                                    <span
                                                        className={`inline-block min-w-[24px] rounded-full border px-1.5 py-0.5 text-center text-[11px] font-semibold ${GRADE_COLOR[c.grades.Valuation.g] ??
                                                            "border-[#E5E7EB] text-[#6B7280]"
                                                            }`}
                                                    >
                                                        {c.grades.Valuation.g}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#9CA3AF]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && !error && (
                    <div className="mt-3 text-xs text-[#9CA3AF]">
                        Showing {filtered.length} of {universe.length} companies · analysis, never a
                        recommendation.
                    </div>
                )}
            </main>
        </div>
    );
}

/*
  UX notes (not implemented, beyond styling scope):
  - The sticky first column's background is set inline per-cell rather than
    via a `group` on the row, because Tailwind's `group-hover` needs the
    parent to carry `group` — worth wiring up properly so the sticky Company
    cell also darkens on row hover, matching the rest of the row.
  - "My watchlist" is stored only in component state, so it resets on
    refresh/navigation; likely needs to persist (localStorage or a backend
    call) to be useful across sessions.
  - The table has no column for company name sorting feedback when name is
    truncated — consider a title attribute or tooltip on hover for long names.
  - Screen presets (Value/Quality/Growth/Net-net) hard-code thresholds with
    no way for a user to see what a preset means without reading code;
    consider a small info affordance.
*/