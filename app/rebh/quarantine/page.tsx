"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ShieldAlert,
    FileQuestion,
    Search,
    RefreshCw,
    X,
    ArrowUpRight,
    CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

interface CompanyUniverseItem {
    sym: string;
    n: string;
    sec: string;
    px: number;
    mc: number;
    pe?: number;
    pb?: number;
    roe?: number;
    fresh: boolean;
    flags?: string[];
    bs_ok?: boolean;
}

type QuarantineReasonKind =
    | "no-filings"
    | "empty-statement"
    | "stale"
    | "corruption"
    | "other";

interface QuarantineReason {
    kind: QuarantineReasonKind;
    label: string;
}

interface QuarantineRow {
    item: CompanyUniverseItem;
    reasons: QuarantineReason[];
}

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const fmt = (v: number | null | undefined, d = 1) =>
    v == null || Number.isNaN(v)
        ? "—"
        : Number(v).toLocaleString("en-US", {
            maximumFractionDigits: d,
            minimumFractionDigits: 0,
        });

function classifyCompany(c: CompanyUniverseItem): QuarantineReason[] {
    const reasons: QuarantineReason[] = [];
    const flags = c.flags || [];

    const hasNoFilings = !c.n && !c.sec; // heuristic: essentially no data at all
    if (hasNoFilings) {
        reasons.push({
            kind: "no-filings",
            label:
                "No filings at source — absent from the importer roster (roster fix required)",
        });
    }

    const noIncomeStatement =
        c.fresh &&
        c.pe == null &&
        c.roe == null &&
        c.pb == null;
    if (noIncomeStatement) {
        reasons.push({
            kind: "empty-statement",
            label:
                "Income statement empty at source° (tag-mapper bug — one fix releases the whole class)",
        });
    }

    if (!c.fresh) {
        reasons.push({
            kind: "stale",
            label: "Statements stale — never priced against today, by rule",
        });
    }

    const corrupted =
        c.bs_ok === false ||
        flags.some((f) => /implausible|corrupt/i.test(f));
    if (corrupted) {
        reasons.push({
            kind: "corruption",
            label: "Severe figure corruption ⚑ — excluded from market aggregates",
        });
    }

    // surface any raw ⚑ flags not already captured above as "other"
    flags
        .filter((f) => f.startsWith("⚑"))
        .forEach((f) => {
            if (!/implausible|corrupt/i.test(f)) {
                reasons.push({ kind: "other", label: f.replace(/^⚑/, "").trim() });
            }
        });

    return reasons;
}

const REASON_META: Record<
    QuarantineReasonKind,
    { icon: typeof AlertTriangle; color: string; chip: string }
> = {
    "no-filings": {
        icon: FileQuestion,
        color: "#f59e0b",
        chip: "No filings",
    },
    "empty-statement": {
        icon: AlertTriangle,
        color: "#f59e0b",
        chip: "Empty income stmt°",
    },
    stale: {
        icon: RefreshCw,
        color: "#f59e0b",
        chip: "Stale",
    },
    corruption: {
        icon: ShieldAlert,
        color: "#f43f5e",
        chip: "Corruption ⚑",
    },
    other: {
        icon: AlertTriangle,
        color: "#f43f5e",
        chip: "Flag",
    },
};

const FILTERS: { key: QuarantineReasonKind | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "no-filings", label: "No filings" },
    { key: "empty-statement", label: "Empty income stmt" },
    { key: "stale", label: "Stale" },
    { key: "corruption", label: "Corruption" },
];

/* ---------------------------------------------------------------------- */
/*  Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function QuarantinePage() {
    const [universe, setUniverse] = useState<CompanyUniverseItem[] | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<
        QuarantineReasonKind | "all"
    >("all");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/rebh/universe`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data: CompanyUniverseItem[] = await res.json();
            setUniverse(data);
        } catch (e: any) {
            setError(e?.message || "Failed to load universe data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const rows: QuarantineRow[] = useMemo(() => {
        if (!universe) return [];
        return universe
            .map((item) => ({ item, reasons: classifyCompany(item) }))
            .filter((r) => r.reasons.length > 0)
            .sort((a, b) => (b.item.mc || 0) - (a.item.mc || 0));
    }, [universe]);

    const filteredRows = useMemo(() => {
        let list = rows;
        if (activeFilter !== "all") {
            list = list.filter((r) =>
                r.reasons.some((reason) => reason.kind === activeFilter)
            );
        }
        if (query.trim()) {
            const q = query.trim().toUpperCase();
            list = list.filter(
                (r) =>
                    r.item.sym.toUpperCase().includes(q) ||
                    (r.item.n || "").toUpperCase().includes(q) ||
                    (r.item.sec || "").toUpperCase().includes(q)
            );
        }
        return list;
    }, [rows, activeFilter, query]);

    const totalUniverse = universe?.length ?? 0;
    const counts = useMemo(() => {
        const c: Record<QuarantineReasonKind, number> = {
            "no-filings": 0,
            "empty-statement": 0,
            stale: 0,
            corruption: 0,
            other: 0,
        };
        rows.forEach((r) => {
            const kinds = new Set(r.reasons.map((x) => x.kind));
            kinds.forEach((k) => (c[k] += 1));
        });
        return c;
    }, [rows]);

    function toggle(sym: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(sym)) next.delete(sym);
            else next.add(sym);
            return next;
        });
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] text-[#e8edf4] pb-16">
            {/* Header */}
            <header className="px-6 md:px-9 pt-7 pb-4 border-b border-[#1e2836] bg-gradient-to-b from-[#0d1118] to-[#0a0c10]">
                <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 rounded-lg bg-[#f43f5e]/10 border border-[#f43f5e]/30 p-2">
                        <ShieldAlert size={22} color="#f43f5e" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Quarantine{" "}
                            <span className="text-[#63a5f0]">
                                — the Too-Hard Pile, declared
                            </span>
                        </h1>
                        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#aab6c6]">
                            Munger&apos;s demand delivered: companies whose data cannot be
                            trusted are{" "}
                            <b className="text-[#e8c464]">
                                publicly quarantined with the reason
                            </b>{" "}
                            — not silently shown with pretty ratios. The engine already
                            excludes them from pricing and screens; this page says so out
                            loud.
                        </p>
                    </div>
                </div>
            </header>

            <main className="px-6 md:px-9 pt-6 max-w-[1200px] mx-auto">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                    <KpiCard
                        value={loading ? "…" : fmt(rows.length, 0)}
                        label={`In the pile (of ${totalUniverse || "—"})`}
                        color="#f59e0b"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["no-filings"], 0)}
                        label="No filings at source"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["empty-statement"], 0)}
                        label="Empty income stmt°"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.stale, 0)}
                        label="Stale — never priced"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.corruption, 0)}
                        label="Severe corruption ⚑"
                        color="#f43f5e"
                    />
                </div>

                <p className="text-[11px] text-[#5f6d80] mb-4 max-w-3xl leading-relaxed">
                    These companies still appear everywhere on the platform — but every
                    pricing, grade and aggregate the engine could not trust is
                    suppressed with its reason, not decorated. The pile is public
                    because the exit door for every class is a named developer fix.
                </p>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6d80]"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search symbol, name, sector…"
                            className="w-full bg-[#0e141d] border border-[#1e2836] rounded-lg pl-8 pr-8 py-2 text-[13px] outline-none focus:border-[#3987e5] placeholder:text-[#5f6d80]"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5f6d80] hover:text-[#e85d5d]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border transition-colors ${activeFilter === f.key
                                    ? "bg-[#3987e5] border-[#3987e5] text-white"
                                    : "bg-[#0e141d] border-[#1e2836] text-[#aab6c6] hover:border-[#3987e5]"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={load}
                        disabled={loading}
                        className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border border-[#1e2836] text-[#aab6c6] hover:border-[#3987e5] hover:text-[#e8edf4] disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Content states */}
                {error && (
                    <div className="rounded-xl border border-[#f43f5e]/40 bg-[#f43f5e]/10 p-4 text-[12.5px] text-[#f43f5e] mb-6 flex items-center gap-2">
                        <AlertTriangle size={15} />
                        {error} — check the API connection and try again.
                    </div>
                )}

                {loading && !error && (
                    <div className="rounded-xl border border-[#1e2836] bg-[#121924] p-10 text-center text-[#5f6d80] text-[13px]">
                        Loading universe…
                    </div>
                )}

                {!loading && !error && filteredRows.length === 0 && (
                    <div className="rounded-xl border border-[#1e2836] bg-[#121924] p-10 text-center text-[#5f6d80] text-[13px] flex flex-col items-center gap-2">
                        <CheckCircle2 size={20} className="text-[#2ecc71]" />
                        No companies match this filter.
                    </div>
                )}

                {!loading && !error && filteredRows.length > 0 && (
                    <div className="rounded-2xl border border-[#1e2836] bg-[#121924] overflow-hidden">
                        {/* Table header (desktop) */}
                        <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_2.4fr_auto] gap-3 px-5 py-3 border-b border-[#1e2836] text-[10px] uppercase tracking-wider text-[#5f6d80] font-semibold">
                            <span>Company</span>
                            <span className="text-right">Sector</span>
                            <span className="text-right">Mkt cap</span>
                            <span className="text-right">Price</span>
                            <span>Why it&apos;s in the pile</span>
                            <span></span>
                        </div>

                        <div className="divide-y divide-[#1e2836]">
                            {filteredRows.map((row) => (
                                <QuarantineRowItem
                                    key={row.item.sym}
                                    row={row}
                                    isExpanded={expanded.has(row.item.sym)}
                                    onToggle={() => toggle(row.item.sym)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && filteredRows.length > 0 && (
                    <p className="text-[11px] text-[#5f6d80] mt-3">
                        Showing {filteredRows.length} of {rows.length} quarantined
                        companies{query || activeFilter !== "all" ? " (filtered)" : ""},
                        sorted by market cap.
                    </p>
                )}

                {/* Exit doors */}
                <div className="mt-6 rounded-xl border border-[#e8c464]/60 bg-gradient-to-r from-[#e8c464]/10 to-transparent p-4 text-[12px] text-[#aab6c6] leading-relaxed">
                    <b className="text-[#e8c464]">The exit doors (Developer Brief P0):</b>{" "}
                    IS tag-mapper fix releases the empty-statement class at once
                    (incl. Aramco — SABIC sits in the stale class); IFRS-17 parser
                    releases the 27 stale insurers; importer-roster fix adds the
                    absent symbols; mandatory scale-at-import ends the corruption
                    class.
                </div>
            </main>
        </div>
    );
}

/* ---------------------------------------------------------------------- */
/*  Subcomponents                                                          */
/* ---------------------------------------------------------------------- */

function KpiCard({
    value,
    label,
    color,
}: {
    value: string;
    label: string;
    color?: string;
}) {
    return (
        <div className="rounded-xl border border-[#1e2836] bg-[#0e141d] px-3.5 py-2.5">
            <div
                className="text-[19px] font-extrabold font-mono"
                style={{ color: color || "#e8edf4" }}
            >
                {value}
            </div>
            <div className="text-[9.5px] uppercase tracking-wider text-[#5f6d80] mt-0.5">
                {label}
            </div>
        </div>
    );
}

function QuarantineRowItem({
    row,
    isExpanded,
    onToggle,
}: {
    row: QuarantineRow;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const { item, reasons } = row;
    const worst = reasons.some((r) => r.kind === "corruption")
        ? "corruption"
        : reasons[0]?.kind || "other";
    const meta = REASON_META[worst];
    const Icon = meta.icon;

    return (
        <div className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_2.4fr_auto] gap-2 md:gap-3 items-center">
                {/* Company */}
                <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: meta.color }} className="shrink-0" />
                    <div>
                        <span className="font-bold text-[#63a5f0]">{item.sym}</span>
                        <span className="text-[#5f6d80] text-[10.5px] ml-1.5">
                            {item.n || "—"}
                        </span>
                    </div>
                </div>

                <div className="text-[11px] text-[#5f6d80] md:text-right">
                    {item.sec || "—"}
                </div>

                <div className="font-mono text-[12.5px] md:text-right">
                    {fmt(item.mc, 0)}
                </div>

                <div className="font-mono text-[12.5px] md:text-right">
                    {item.px ? fmt(item.px, 2) : "—"}
                </div>

                {/* Reason chips */}
                <div className="flex flex-wrap gap-1.5">
                    {reasons.slice(0, isExpanded ? undefined : 2).map((r, i) => {
                        const m = REASON_META[r.kind];
                        return (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                                style={{
                                    color: m.color,
                                    borderColor: `${m.color}55`,
                                    background: `${m.color}14`,
                                }}
                                title={r.label}
                            >
                                {m.chip}
                            </span>
                        );
                    })}
                    {!isExpanded && reasons.length > 2 && (
                        <button
                            onClick={onToggle}
                            className="text-[10px] text-[#5f6d80] hover:text-[#e8edf4] underline decoration-dotted"
                        >
                            +{reasons.length - 2} more
                        </button>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onToggle}
                        className="text-[#5f6d80] hover:text-[#63a5f0] p-1"
                        aria-label="Toggle details"
                    >
                        <ArrowUpRight
                            size={15}
                            className={`transition-transform ${isExpanded ? "rotate-90" : ""
                                }`}
                        />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-3 pl-6 border-l-2 border-[#1e2836] space-y-1.5">
                    {reasons.map((r, i) => {
                        const m = REASON_META[r.kind];
                        return (
                            <div
                                key={i}
                                className="text-[11.5px] text-[#aab6c6] flex items-start gap-2"
                            >
                                <span
                                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ background: m.color }}
                                />
                                {r.label}
                            </div>
                        );
                    })}
                    {!item.bs_ok && (
                        <div className="text-[10.5px] text-[#5f6d80] pt-1">
                            Balance-sheet check: failed°
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}