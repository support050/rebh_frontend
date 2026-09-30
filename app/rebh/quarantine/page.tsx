"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    en?: string;
    sec: string;
    sec_en?: string;
    px: number;
    mc: number;
    pe?: number;
    pb?: number;
    roe?: number;
    fresh: boolean;
    flags?: string[];
    bs_ok?: boolean | null;
}

interface QuarantineMetaResponse {
    source?: string;
    count?: number;
    quarantined_companies?: any[];
    generated_at?: string;
    total_universe?: number;
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
/*  Design system tokens                                                   */
/* ---------------------------------------------------------------------- */

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const INPUT =
    "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] text-[13px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";

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

// Sector names arrive from the backend in English (GICS-style, optionally
// "Sector | Industry"), so no translation table is needed for an English UI.
// The function is kept so call sites and search behaviour stay identical.
function translateSector(sec?: string | null): string {
    if (!sec) return "—";
    const parts = sec.split("|").map(p => p.trim());
    const mainSector = parts[0];
    return parts.length > 1 ? `${mainSector} (${parts[1]})` : mainSector;
}

// Reason severity — 3 visual tiers:
//   info  (blue-gray): no-filings, stale       — data is absent/delayed, not corrupted
//   amber (caution):   empty-statement          — filing exists but income stmt is hollow
//   red   (error):     corruption, other        — forensic flag or unknown critical issue
const REASON_META: Record<
    QuarantineReasonKind,
    { icon: typeof AlertTriangle; color: string; bg: string; border: string; chip: string }
> = {
    "no-filings": {
        icon: FileQuestion,
        color: "#374151",
        bg: "#F3F4F6",
        border: "#D1D5DB",
        chip: "No Filings",
    },
    "empty-statement": {
        icon: AlertTriangle,
        color: "#B45309",
        bg: "#FFFBEB",
        border: "#FDE68A",
        chip: "Empty Income Statement°",
    },
    stale: {
        icon: RefreshCw,
        color: "#374151",
        bg: "#F3F4F6",
        border: "#D1D5DB",
        chip: "Stale Data",
    },
    corruption: {
        icon: ShieldAlert,
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        chip: "Data Corruption ⚑",
    },
    other: {
        icon: AlertTriangle,
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        chip: "Alert",
    },
};

const ROW_GRID = "md:grid-cols-[1.4fr_1fr_1fr_1fr_2.4fr_auto]";

const FILTERS: { key: QuarantineReasonKind | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "no-filings", label: "No Filings" },
    { key: "empty-statement", label: "Empty Income Statement" },
    { key: "stale", label: "Stale Data" },
    { key: "corruption", label: "Data Corruption" },
    { key: "other", label: "Alerts & Notes" },
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

    const [quarantineMeta, setQuarantineMeta] = useState<QuarantineMetaResponse | null>(null);

    // In-flight control: abort on unmount, ignore stale responses across retries.
    const loadAbortRef = useRef<AbortController | null>(null);
    const loadReqIdRef = useRef(0);

    async function load() {
        loadAbortRef.current?.abort();
        const controller = new AbortController();
        loadAbortRef.current = controller;
        const reqId = ++loadReqIdRef.current;
        const isStale = () => reqId !== loadReqIdRef.current || controller.signal.aborted;
        setLoading(true);
        setError(null);
        try {
            const [uniRes, quarRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/rebh/universe`, { cache: "no-store", signal: controller.signal }),
                fetch(`${API_BASE_URL}/api/rebh/quarantine`, { cache: "no-store", signal: controller.signal })
            ]);
            if (isStale()) return;
            if (!uniRes.ok) throw new Error(`Universe request failed (${uniRes.status})`);
            const uniData: CompanyUniverseItem[] = await uniRes.json();
            if (isStale()) return;
            setUniverse(uniData);
            if (quarRes.ok) {
                const qData = await quarRes.json();
                if (!isStale()) setQuarantineMeta(qData);
            }
        } catch (e: unknown) {
            if ((e as any)?.name === "AbortError") return;
            if (!isStale()) setError(e instanceof Error ? e.message : "Failed to load quarantine data");
        } finally {
            if (!isStale()) setLoading(false);
        }
    }

    useEffect(() => {
        load();
        return () => {
            loadAbortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rows: QuarantineRow[] = useMemo(() => {
        if (!universe) return [];

        // When backend quarantine response is loaded, it is the strict and sole source of truth
        if (quarantineMeta) {
            const list = quarantineMeta.quarantined_companies;
            if (!Array.isArray(list) || list.length === 0) {
                return []; // Clean empty state: 0 companies quarantined by engine
            }

            const uniMap = new Map<string, CompanyUniverseItem>();
            universe.forEach(u => uniMap.set(u.sym, u));

            return list.map((q: any) => {
                const item: CompanyUniverseItem = uniMap.get(q.symbol) || {
                    sym: q.symbol,
                    n: q.name || "",
                    sec: q.sector || "",
                    px: q.price || 0,
                    mc: q.market_cap || 0,
                    fresh: false,
                    bs_ok: q.balance_identity_valid ?? null,
                    flags: q.flags || []
                };

                // 100% Structured reason codes directly from backend forensics engine
                const reasons: QuarantineReason[] = (q.reasons_structured && Array.isArray(q.reasons_structured))
                    ? q.reasons_structured.map((rs: any) => ({
                        kind: (rs.kind as QuarantineReasonKind) || "other",
                        label: rs.label || rs.code || "Unspecified quarantine condition"
                    }))
                    : [];

                return { item, reasons };
            }).sort((a: QuarantineRow, b: QuarantineRow) => (b.item.mc || 0) - (a.item.mc || 0));
        }

        // Only before backend metadata finishes loading: initial view
        return [];
    }, [universe, quarantineMeta]);

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
                    (r.item.en || "").toUpperCase().includes(q) ||
                    (r.item.sec || "").toUpperCase().includes(q) ||
                    (r.item.sec_en || "").toUpperCase().includes(q) ||
                    translateSector(r.item.sec).toUpperCase().includes(q)
            );
        }
        return list;
    }, [rows, activeFilter, query]);

    const totalUniverse = (quarantineMeta?.total_universe ?? universe?.length) ?? 0;
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
        <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-16">
            {/* Header */}
            <header className="px-6 md:px-9 pt-7 pb-4 border-b border-[#E5E7EB] bg-white">
                <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 rounded-[4px] bg-[#FEF2F2] border border-[#FECACA] p-2">
                        <ShieldAlert size={22} color="#DC2626" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
                                Quarantine{" "}
                                <span className="text-[#8C3B32]">
                                    — The Too-Hard Pile, Openly Declared
                                </span>
                            </h1>
                            {quarantineMeta && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-mono text-[#6B7280]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                        {quarantineMeta.source || "REBH Forensic Analysis Gateway"}
                                    </span>
                                    {quarantineMeta.generated_at && (
                                        <span className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-mono text-[#6B7280]" title={quarantineMeta.generated_at}>
                                            {new Date(quarantineMeta.generated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-bold text-[#DC2626]">
                                        {quarantineMeta.count ?? rows.length} Quarantined
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#6B7280]">
                            Applying Munger's principle: companies whose data cannot be trusted are{" "}
                            <b className="text-[#8C3B32]">
                                declared quarantined openly, with the reason stated
                            </b>{" "}
                            — never shown silently with polished financial ratios. The engine already excludes them from
                            pricing and screening; this page states so explicitly.
                        </p>
                    </div>
                </div>
            </header>

            <main className="px-6 md:px-9 pt-6 max-w-[1200px] mx-auto">
                {/* Honesty-mark legend */}
                <div className={`${SUBCARD} flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2 mb-4 text-[10.5px] text-[#6B7280]`}>
                    <span className="font-semibold text-[#1A1A1A] shrink-0">Honesty Marks Key:</span>
                    <span>° truncated or incomplete income statement</span>
                    <span>≈ approximate estimate (computed TTM)</span>
                    <span>⚑ forensic warning flag</span>
                    <span>⚠ data alert</span>
                    <span>🔌 missing data source</span>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                    <KpiCard
                        value={loading ? "…" : fmt(rows.length, 0)}
                        label={`In Quarantine (of ${totalUniverse || "—"})`}
                        color="#B45309"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["no-filings"], 0)}
                        label="No Filings"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["empty-statement"], 0)}
                        label="Empty Income Statement°"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.stale, 0)}
                        label="Stale Data"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.corruption, 0)}
                        label="Severe Corruption ⚑"
                        color="#DC2626"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.other, 0)}
                        label="Alerts & Notes"
                        color="#B45309"
                    />
                </div>

                <p className="text-[11px] text-[#6B7280] mb-4 max-w-3xl leading-relaxed">
                    These companies appear on the platform with any pricing or score the engine does not trust hidden,
                    and the reason disclosed openly — we do not show polished ratios on unreliable data.
                </p>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by symbol, name or sector…"
                            className={`${INPUT} w-full pl-8 pr-8 py-2`}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#DC2626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 rounded-sm"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((f) => {
                            const count = f.key === "all" ? rows.length : counts[f.key];
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setActiveFilter(f.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 ${activeFilter === f.key
                                        ? "border-[#8C3B32] text-[#8C3B32] bg-[#8C3B32]/5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                                        }`}
                                >
                                    <span>{f.label}</span>
                                    {!loading && count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${activeFilter === f.key ? "bg-[#8C3B32] text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={load}
                        disabled={loading}
                        className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32] hover:text-[#8C3B32] disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Content states */}
                <div aria-live="polite" aria-atomic="false">
                    {error && (
                        <div className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-[12.5px] text-[#DC2626] mb-6 flex items-center gap-2">
                            <AlertTriangle size={15} />
                            {error} — please check the API connection and try again.
                        </div>
                    )}

                    {loading && !error && (
                        <div className={`${CARD} p-10 text-center text-[#6B7280] text-[13px]`}>
                            Loading company universe…
                        </div>
                    )}

                    {!loading && !error && filteredRows.length === 0 && (
                        <div className={`${CARD} p-10 text-center text-[#6B7280] text-[13px] flex flex-col items-center gap-2`}>
                            <CheckCircle2 size={20} className="text-[#16A34A]" />
                            No companies match this filter.
                        </div>
                    )}
                </div>

                {!loading && !error && filteredRows.length > 0 && (
                    <div className={`${CARD} overflow-hidden`}>
                        {/* Table header (desktop) */}
                        <div className={`hidden md:grid ${ROW_GRID} gap-3 px-5 py-3 border-b border-[#E5E7EB] bg-[#F3F4F6] text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold`}>
                            <span>Company</span>
                            <span className="text-left">Sector</span>
                            <span className="text-right">Market Cap</span>
                            <span className="text-right">Price</span>
                            <span>Quarantine Reason</span>
                            <span></span>
                        </div>

                        <div className="divide-y divide-[#E5E7EB]">
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
                    <p className="text-[11px] text-[#6B7280] mt-3">
                        Showing {filteredRows.length} of {rows.length} quarantined companies
                        {query || activeFilter !== "all" ? " (after filtering)" : ""},
                        sorted by market cap.
                    </p>
                )}

                {/* Exit doors */}
                <div className={`mt-6 ${SUBCARD} border-[#8C3B32]/30 p-4 text-[12px] text-[#6B7280] leading-relaxed`}>
                    <b className="text-[#8C3B32]">Exit Paths (P0 developer summary):</b>{" "}
                    Fixing the income statement data link immediately clears the "Empty Income Statement" category
                    (including Aramco — SABIC falls under Stale Data); the IFRS-17 parser
                    {/* TODO: replace with computed count from backend */}
                    clears ≈27 insurers from the Stale Data category; fixing the importer list
                    adds the missing symbols; mandatory scale calibration on import ends the
                    Data Corruption category.
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
        <div className={`${SUBCARD} px-3.5 py-2.5`}>
            <div
                className="text-[19px] font-extrabold tabular-nums"
                style={{ color: color || "#1A1A1A" }}
            >
                {value}
            </div>
            <div className="text-[9.5px] uppercase tracking-wider text-[#6B7280] mt-0.5">
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
        <div className="px-5 py-3.5 hover:bg-[#F3F4F6] transition-colors">
            <div className={`grid grid-cols-1 ${ROW_GRID} gap-2 md:gap-3 items-center`}>
                {/* Company */}
                <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: meta.color }} className="shrink-0" />
                    <div>
                        <a href={`/rebh/company/${item.sym}`} className="font-bold text-[#8C3B32] hover:underline">
                            {item.sym}
                        </a>
                        <span className="text-[#6B7280] text-[10.5px] ml-1.5">
                            {item.en || item.n || "—"}
                        </span>
                    </div>
                </div>

                <div className="text-[11px] text-[#6B7280] md:text-left" title={item.sec_en || item.sec || undefined}>
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">Sector</span>
                    {item.sec_en || translateSector(item.sec)}
                </div>

                <div className="text-[12.5px] text-[#1A1A1A] tabular-nums md:text-right">
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">Market Cap</span>
                    {fmt(item.mc, 0)}
                </div>

                <div className="text-[12.5px] text-[#1A1A1A] tabular-nums md:text-right">
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">Price</span>
                    {item.px ? fmt(item.px, 2) : "—"}
                </div>

                {/* Reason chips */}
                <div className="flex flex-wrap gap-1.5">
                    {reasons.slice(0, isExpanded ? undefined : 2).map((r, i) => {
                        const m = REASON_META[r.kind];
                        return (
                            <span
                                key={r.kind + i}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                                style={{
                                    color: m.color,
                                    borderColor: m.border,
                                    background: m.bg,
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
                            className="text-[10px] text-[#6B7280] hover:text-[#1A1A1A] underline decoration-dotted"
                        >
                            +{reasons.length - 2} more
                        </button>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onToggle}
                        className="text-[#6B7280] hover:text-[#8C3B32] p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 rounded-sm"
                        aria-label="Show details"
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
                <div className="mt-3 pl-6 border-l-2 border-[#E5E7EB] space-y-1.5">
                    {reasons.map((r, i) => {
                        const m = REASON_META[r.kind];
                        return (
                            <div
                                key={r.kind + i}
                                className="text-[11.5px] text-[#6B7280] flex items-start gap-2"
                            >
                                <span
                                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ background: m.color }}
                                />
                                {r.label}
                            </div>
                        );
                    })}
                    {item.bs_ok === false && (
                        <div className="text-[10.5px] text-[#DC2626] pt-1">
                            Balance sheet identity check: Failed°
                        </div>
                    )}
                    {item.bs_ok == null && (
                        <div className="text-[10.5px] text-[#B45309] pt-1">
                            Balance sheet identity check: 🔌 Source unavailable
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}