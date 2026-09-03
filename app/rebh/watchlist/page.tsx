"use client";

import { useEffect, useMemo, useState } from "react";
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

const GRADE_COLOR: Record<string, string> = {
    A: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    B: "text-sky-400 bg-sky-400/10 border-sky-400/30",
    C: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    D: "text-rose-400 bg-rose-400/10 border-rose-400/30",
    F: "text-rose-300 bg-rose-400/20 border-rose-400/40",
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
                <span className={c.g_net >= 0 ? "text-emerald-400" : "text-rose-400"}>
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
                <span className="text-slate-600">—</span>
            ) : (
                <span
                    className={
                        c.peg < 1 ? "text-emerald-400" : c.peg > 2 ? "text-rose-400" : "text-slate-300"
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
                <span className="text-slate-600">—</span>
            ) : (
                <span className={c.pncav < 0.66 ? "text-emerald-400" : "text-slate-300"}>
                    {nf(c.pncav, 2)}
                </span>
            ),
    },
    {
        key: "f_score",
        label: "F-Score",
        render: (c) =>
            c.f_score === undefined || c.f_score === null ? (
                <span className="text-slate-600">—</span>
            ) : (
                <span
                    className={
                        c.f_score >= 7
                            ? "text-emerald-400"
                            : c.f_score >= 4
                                ? "text-amber-400"
                                : "text-rose-400"
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

    const sectors = useMemo(() => {
        const s = new Set<string>();
        universe.forEach((c) => c.sec && s.add(c.sec));
        return ["All sectors", ...Array.from(s).sort()];
    }, [universe]);

    function toggleWatch(sym: string) {
        setWatchlist((prev) => {
            const next = new Set(prev);
            next.has(sym) ? next.delete(sym) : next.add(sym);
            return next;
        });
    }

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

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
        return sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-[#d9b64a]" />
        ) : (
            <ArrowDown className="h-3 w-3 text-[#d9b64a]" />
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-100 antialiased">
            {/* Header */}
            <header className="border-b border-[#1e2836] bg-gradient-to-b from-[#0d1118] to-[#0a0c10] px-5 py-6 sm:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col gap-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">
                        Watchlist &amp; Screener
                    </h1>
                    <p className="max-w-2xl text-sm text-slate-400">
                        Every TASI-listed company the platform covers, in one sortable table. Screen by
                        preset, filter by sector, star what you want to track.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8">
                {/* Controls */}
                <div className="mb-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search symbol or company name…"
                                className="w-full rounded-lg border border-[#1e2836] bg-[#121924] py-2 pl-9 pr-9 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#3987e5]"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <select
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            className="rounded-lg border border-[#1e2836] bg-[#121924] px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#3987e5]"
                        >
                            {sectors.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showFilters
                                    ? "border-[#3987e5] bg-[#3987e5]/10 text-[#63a5f0]"
                                    : "border-[#1e2836] bg-[#121924] text-slate-300 hover:border-[#3987e5]/50"
                                }`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filters
                        </button>

                        <button
                            onClick={loadUniverse}
                            disabled={loading}
                            className="flex items-center gap-1.5 rounded-lg border border-[#1e2836] bg-[#121924] px-3 py-2 text-sm text-slate-300 hover:border-[#3987e5]/50 disabled:opacity-50"
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
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${screen === s.id
                                        ? "border-[#d9b64a] bg-[#d9b64a]/15 text-[#e8c464]"
                                        : "border-[#1e2836] bg-[#121924] text-slate-400 hover:border-[#d9b64a]/40 hover:text-slate-200"
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                        <span className="mx-1 h-4 w-px bg-[#1e2836]" />
                        <button
                            onClick={() => setWatchOnly((v) => !v)}
                            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${watchOnly
                                    ? "border-[#d9b64a] bg-[#d9b64a]/15 text-[#e8c464]"
                                    : "border-[#1e2836] bg-[#121924] text-slate-400 hover:border-[#d9b64a]/40 hover:text-slate-200"
                                }`}
                        >
                            <Star className={`h-3 w-3 ${watchOnly ? "fill-[#e8c464]" : ""}`} />
                            My watchlist ({watchlist.size})
                        </button>
                    </div>

                    {/* Expandable filter row */}
                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#1e2836] bg-[#121924] px-4 py-3 text-sm">
                            <label className="flex items-center gap-2 text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={onlyFresh}
                                    onChange={(e) => setOnlyFresh(e.target.checked)}
                                    className="accent-[#3987e5]"
                                />
                                Fresh statements only
                            </label>
                            <span className="text-xs text-slate-500">
                                {filtered.length} of {universe.length} companies match
                            </span>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-[#1e2836] bg-[#121924]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[#1e2836] bg-[#0e141d]">
                                    <th className="w-8 px-3 py-2.5" />
                                    <th
                                        onClick={() => sortBy("sym")}
                                        className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                                    >
                                        <span className="inline-flex items-center gap-1">Company <SortIcon col="sym" /></span>
                                    </th>
                                    {COLUMNS.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => sortBy(col.key)}
                                            className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                                        >
                                            <span className="inline-flex items-center gap-1 justify-end w-full">
                                                {col.label} <SortIcon col={col.key} />
                                            </span>
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Grade
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-16 text-center text-slate-500">
                                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#3987e5]" />
                                            Loading the universe…
                                        </td>
                                    </tr>
                                )}

                                {!loading && error && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-16 text-center">
                                            <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-rose-400" />
                                            <div className="text-sm text-slate-300">Couldn't load the universe.</div>
                                            <div className="mt-1 text-xs text-slate-500">{error}</div>
                                            <button
                                                onClick={loadUniverse}
                                                className="mt-3 rounded-lg border border-[#1e2836] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-[#3987e5]/50"
                                            >
                                                Try again
                                            </button>
                                        </td>
                                    </tr>
                                )}

                                {!loading && !error && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={COLUMNS.length + 3} className="px-4 py-16 text-center text-slate-500">
                                            No companies match these filters. Try clearing the search or switching sectors.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    !error &&
                                    filtered.map((c) => (
                                        <tr
                                            key={c.sym}
                                            className="border-b border-[#1e2836] last:border-0 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-3 py-2.5">
                                                <button
                                                    onClick={() => toggleWatch(c.sym)}
                                                    aria-label={watchlist.has(c.sym) ? "Remove from watchlist" : "Add to watchlist"}
                                                    className="text-slate-600 hover:text-[#e8c464]"
                                                >
                                                    <Star
                                                        className={`h-3.5 w-3.5 ${watchlist.has(c.sym) ? "fill-[#e8c464] text-[#e8c464]" : ""
                                                            }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-semibold text-[#63a5f0]">{c.sym}</span>
                                                    <span className="max-w-[220px] truncate text-xs text-slate-500">
                                                        {c.n}
                                                    </span>
                                                    {!c.fresh && (
                                                        <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                                                            STALE
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {COLUMNS.map((col) => (
                                                <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[13px] text-slate-200">
                                                    {col.render(c)}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2.5 text-right">
                                                {c.grades?.Valuation ? (
                                                    <span
                                                        className={`inline-block min-w-[24px] rounded border px-1.5 py-0.5 text-center text-[11px] font-bold ${GRADE_COLOR[c.grades.Valuation.g] ??
                                                            "border-slate-600 text-slate-400"
                                                            }`}
                                                    >
                                                        {c.grades.Valuation.g}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && !error && (
                    <div className="mt-3 text-xs text-slate-600">
                        Showing {filtered.length} of {universe.length} companies · analysis, never a
                        recommendation.
                    </div>
                )}
            </main>
        </div>
    );
}