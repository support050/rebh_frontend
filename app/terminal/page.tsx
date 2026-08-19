"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

interface Company {
    symbol: string;
    name: string;
    name_ar?: string;
    sector?: string;
}

interface GrahamModel {
    ncav: number | null;
    current_ratio: number | null;
    debt_to_equity: number | null;
}

interface BuffettModel {
    fcf_yield_pct: number | null;
    owner_earnings_yield_pct: number | null;
}

interface MagicFormulaModel {
    return_on_capital_pct: number | null;
    earnings_yield_pct: number | null;
}

interface CompanyModels {
    graham?: GrahamModel;
    buffett?: BuffettModel;
    magic_formula?: MagicFormulaModel;
}

interface CompanyRow extends Company {
    models: CompanyModels | null;
    loadingModels: boolean;
}

type FilterTab = "all" | "buffett" | "graham" | "magic_formula";

const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "buffett", label: "Buffett" },
    { key: "graham", label: "Graham" },
    { key: "magic_formula", label: "Magic Formula" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, digits = 1): string {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return v.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
    });
}

function fmtPct(v: number | null | undefined, digits = 1): string {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return `${fmt(v, digits)}%`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FinancialTerminalPage() {
    const router = useRouter();
    const [rows, setRows] = useState<CompanyRow[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState(true);

    // Fetch all companies and models in a single fast batch call
    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoadingCompanies(true);
            setError(null);
            try {
                const res = await fetch(`/api/companies/models/all/`, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
                const data: any[] = await res.json();
                if (cancelled) return;

                const initialRows: CompanyRow[] = data.map((c: any) => ({
                    symbol: c.symbol,
                    name: c.company_name || c.name || c.symbol,
                    name_ar: c.name_ar,
                    sector: c.sector,
                    models: c.models || null,
                    loadingModels: false,
                }));
                setRows(initialRows);
                setLoadingCompanies(false);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load companies");
                    setLoadingCompanies(false);
                }
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, []);

    // Reset sort when switching tabs, defaulting to a sensible column per tab.
    useEffect(() => {
        if (activeTab === "buffett") setSortKey("owner_earnings_yield_pct");
        else if (activeTab === "graham") setSortKey("ncav");
        else if (activeTab === "magic_formula") setSortKey("earnings_yield_pct");
        else setSortKey(null);
        setSortAsc(false);
    }, [activeTab]);

    const columns = useMemo(
        () =>
            [
                { key: "symbol", label: "Symbol" },
                { key: "name", label: "Company Name" },
                { key: "ncav", label: "Net-Net (NCAV)", group: "graham" },
                { key: "current_ratio", label: "Current Ratio", group: "graham" },
                { key: "debt_to_equity", label: "D/E", group: "graham" },
                { key: "fcf_yield_pct", label: "FCF Yield%", group: "buffett" },
                { key: "owner_earnings_yield_pct", label: "Owner Earnings Yield%", group: "buffett" },
                { key: "return_on_capital_pct", label: "ROC%", group: "magic_formula" },
                { key: "earnings_yield_pct", label: "Earnings Yield%", group: "magic_formula" },
            ] as const,
        []
    );

    function getValue(row: CompanyRow, key: string): number | string | null {
        if (key === "symbol") return row.symbol;
        if (key === "name") return row.name;
        const m = row.models;
        if (!m) return null;
        if (key === "ncav") return m.graham?.ncav ?? null;
        if (key === "current_ratio") return m.graham?.current_ratio ?? null;
        if (key === "debt_to_equity") return m.graham?.debt_to_equity ?? null;
        if (key === "fcf_yield_pct") return m.buffett?.fcf_yield_pct ?? null;
        if (key === "owner_earnings_yield_pct") return m.buffett?.owner_earnings_yield_pct ?? null;
        if (key === "return_on_capital_pct") return m.magic_formula?.return_on_capital_pct ?? null;
        if (key === "earnings_yield_pct") return m.magic_formula?.earnings_yield_pct ?? null;
        return null;
    }

    const displayedRows = useMemo(() => {
        let filtered = rows;
        if (activeTab !== "all") {
            filtered = rows.filter((r) => r.models && r.models[activeTab]);
        }
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const x = getValue(a, sortKey);
            const y = getValue(b, sortKey);
            if (x === null || x === undefined) return 1;
            if (y === null || y === undefined) return -1;
            if (typeof x === "number" && typeof y === "number") {
                return sortAsc ? x - y : y - x;
            }
            return sortAsc
                ? String(x).localeCompare(String(y))
                : String(y).localeCompare(String(x));
        });
    }, [rows, activeTab, sortKey, sortAsc]);

    function toggleSort(key: string) {
        if (sortKey === key) setSortAsc((v) => !v);
        else {
            setSortKey(key);
            setSortAsc(false);
        }
    }

    function highlightGroup(colGroup: string | undefined): boolean {
        return activeTab !== "all" && colGroup === activeTab;
    }

    return (
        <div dir="ltr" className="min-h-screen bg-[#0d0d0d] text-[#f2f1ed] font-mono text-[12.5px]">
            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-white/10 bg-[#1a1a19] px-5 py-2.5">
                <div className="text-[15px] font-extrabold tracking-wide">
                    REBH <span className="text-[#3987e5]">FINANCIAL TERMINAL</span>
                </div>
                <div className="ml-auto text-[10px] text-[#898781]">
                    {loadingCompanies ? "Loading…" : `${rows.length} companies`}
                </div>
            </header>

            <div className="mx-auto max-w-[1340px] px-5 py-4 pb-16">
                {/* Filter tabs */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-2xl border px-3.5 py-1 text-[11.5px] font-mono transition-colors ${activeTab === tab.key
                                    ? "border-[#3987e5] bg-[#184f95] font-bold text-[#3987e5]"
                                    : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-3 rounded-lg border border-[#e66767]/40 bg-[#e66767]/10 px-3 py-2 text-[11px] text-[#e66767]">
                        {error}
                    </div>
                )}

                {/* Table panel */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a19]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[11.8px]">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => toggleSort(col.key)}
                                            className={`cursor-pointer select-none whitespace-nowrap border-b-[1.5px] border-[#383835] px-2.5 py-1.5 text-right text-[9.8px] font-semibold ${col.key === "symbol" || col.key === "name" ? "text-left" : ""
                                                } ${sortKey === col.key
                                                    ? "text-[#3987e5]"
                                                    : highlightGroup((col as { group?: string }).group)
                                                        ? "text-[#d9b64a]"
                                                        : "text-[#898781]"
                                                }`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loadingCompanies ? (
                                    <SkeletonRows columns={columns.length} />
                                ) : displayedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-3 py-6 text-center text-[#898781]">
                                            No companies match this screen.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedRows.map((row) => (
                                        <tr
                                            key={row.symbol}
                                            onClick={() => router.push(`/stocks/${row.symbol}/xbrl`)}
                                            className="cursor-pointer border-b border-[#2c2c2a] hover:bg-[#222220]"
                                        >
                                            <td className="px-2.5 py-1 text-left font-semibold">{row.symbol}</td>
                                            <td className="px-2.5 py-1 text-left font-semibold">
                                                {row.name}
                                                {row.sector && (
                                                    <span className="ml-1 font-normal text-[#898781]">· {row.sector}</span>
                                                )}
                                            </td>
                                            {row.loadingModels ? (
                                                <td colSpan={7} className="px-2.5 py-1 text-right text-[#898781]">
                                                    loading…
                                                </td>
                                            ) : (
                                                <>
                                                    <Cell value={fmt(row.models?.graham?.ncav, 0)} highlight={highlightGroup("graham")} />
                                                    <Cell
                                                        value={fmt(row.models?.graham?.current_ratio, 2)}
                                                        highlight={highlightGroup("graham")}
                                                    />
                                                    <Cell
                                                        value={fmt(row.models?.graham?.debt_to_equity, 2)}
                                                        highlight={highlightGroup("graham")}
                                                    />
                                                    <Cell
                                                        value={fmtPct(row.models?.buffett?.fcf_yield_pct)}
                                                        highlight={highlightGroup("buffett")}
                                                    />
                                                    <Cell
                                                        value={fmtPct(row.models?.buffett?.owner_earnings_yield_pct)}
                                                        highlight={highlightGroup("buffett")}
                                                    />
                                                    <Cell
                                                        value={fmtPct(row.models?.magic_formula?.return_on_capital_pct)}
                                                        highlight={highlightGroup("magic_formula")}
                                                    />
                                                    <Cell
                                                        value={fmtPct(row.models?.magic_formula?.earnings_yield_pct)}
                                                        highlight={highlightGroup("magic_formula")}
                                                    />
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Cell({ value, highlight }: { value: string; highlight: boolean }) {
    return (
        <td
            className={`whitespace-nowrap px-2.5 py-1 text-right tabular-nums ${highlight ? "bg-[#184f95]/10 text-[#f2f1ed]" : "text-[#c3c2b7]"
                }`}
        >
            {value}
        </td>
    );
}

function SkeletonRows({ columns }: { columns: number }) {
    return (
        <>
            {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-[#2c2c2a]">
                    {Array.from({ length: columns }).map((__, j) => (
                        <td key={j} className="px-2.5 py-1.5">
                            <div className="h-3 w-full max-w-[70px] animate-pulse rounded bg-[#2c2c2a]" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}