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
    is_net_net?: boolean | null;
}

interface BuffettModel {
    fcf_yield_pct: number | null;
    owner_earnings_yield_pct: number | null;
    debt_to_equity?: number | null;
}

interface MagicFormulaModel {
    return_on_capital_pct: number | null;
    earnings_yield_pct: number | null;
    ev?: number | null;
}

interface CompanyModels {
    graham?: GrahamModel;
    buffett?: BuffettModel;
    magic_formula?: MagicFormulaModel;
}

interface Signal {
    type: string;
    [key: string]: unknown;
}

interface CompanyRow extends Company {
    models: CompanyModels | null;
}

type TabKey = "buffett" | "graham" | "magic_formula" | "lynch";

const TABS: { key: TabKey; label: string }[] = [
    { key: "buffett", label: "بافيت" },
    { key: "graham", label: "جراهام" },
    { key: "magic_formula", label: "ماجيك فورميولا" },
    { key: "lynch", label: "لينش" },
];

const PAGE_SIZE = 50;

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, digits = 1): string {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function fmtPct(v: number | null | undefined, digits = 1): string {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    return `${fmt(v, digits)}%`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LegendsScreenerPage() {
    const router = useRouter();
    const [rows, setRows] = useState<CompanyRow[]>([]);
    const [signalsBySymbol, setSignalsBySymbol] = useState<Record<string, Signal[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("buffett");

    // Fetch company models in batch
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/companies/models/all/`, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Failed to load companies (${res.status})`);
                const data: any[] = await res.json();
                if (cancelled) return;

                const modelResults: CompanyRow[] = data.map((c: any) => ({
                    symbol: c.symbol,
                    name: c.company_name || c.name || c.symbol,
                    name_ar: c.name_ar,
                    sector: c.sector,
                    models: c.models || null,
                }));
                setRows(modelResults);
                setLoading(false);

                // Fetch signals in background for top 20 symbols without blocking
                modelResults.slice(0, 30).forEach((c) => {
                    fetch(`/api/companies/${c.symbol}/signals`, { cache: 'no-store' })
                        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
                        .then((payload: { signals: Signal[] }) => {
                            if (cancelled) return;
                            setSignalsBySymbol((prev) => ({ ...prev, [c.symbol]: payload.signals || [] }));
                        })
                        .catch(() => {
                            if (cancelled) return;
                            setSignalsBySymbol((prev) => ({ ...prev, [c.symbol]: [] }));
                        });
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "تعذر تحميل الشركات");
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── Per-tab derived rows (sorted, top 50) ────────────────────────────────

    const buffettRows = useMemo(
        () =>
            rows
                .filter((r) => r.models?.buffett)
                .sort(
                    (a, b) =>
                        (b.models!.buffett!.owner_earnings_yield_pct ?? -Infinity) -
                        (a.models!.buffett!.owner_earnings_yield_pct ?? -Infinity)
                )
                .slice(0, PAGE_SIZE),
        [rows]
    );

    const grahamRows = useMemo(
        () =>
            rows
                .filter((r) => r.models?.graham)
                .sort((a, b) => (b.models!.graham!.ncav ?? -Infinity) - (a.models!.graham!.ncav ?? -Infinity))
                .slice(0, PAGE_SIZE),
        [rows]
    );

    const magicRows = useMemo(
        () =>
            rows
                .filter((r) => r.models?.magic_formula)
                .sort((a, b) => {
                    const mfA = a.models!.magic_formula!;
                    const mfB = b.models!.magic_formula!;
                    const scoreA = (mfA.return_on_capital_pct ?? 0) + (mfA.earnings_yield_pct ?? 0);
                    const scoreB = (mfB.return_on_capital_pct ?? 0) + (mfB.earnings_yield_pct ?? 0);
                    return scoreB - scoreA;
                })
                .slice(0, PAGE_SIZE),
        [rows]
    );

    const lynchRows = useMemo(
        () =>
            rows
                .filter((r) => (signalsBySymbol[r.symbol] || []).some((s) => s.type === "acceleration"))
                .slice(0, PAGE_SIZE),
        [rows, signalsBySymbol]
    );

    function goToStock(symbol: string) {
        router.push(`/stocks/${symbol}/xbrl`);
    }

    return (
        <div dir="rtl" className="min-h-screen bg-[#f9f9f7] font-sans text-[13.5px] text-[#0b0b0b]">
            <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fcfcfb] px-6 py-4">
                <h1 className="inline text-lg font-bold">مجلس المال — شاشات الأساطير</h1>
                <div className="mt-1 text-[11.5px] text-[#898781]">فحص الشركات بمنهجيات المستثمرين الكبار على السوق السعودي</div>
            </header>

            <div className="mx-auto max-w-[1280px] px-6 py-4 pb-16">
                {error && (
                    <div className="mb-3 rounded-lg border border-[#d03b3b]/40 bg-[#d03b3b]/10 px-3 py-2 text-[12px] text-[#d03b3b]">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-[20px] border-[1.5px] px-4 py-1.5 text-[12.5px] transition-colors ${activeTab === tab.key
                                ? "border-[#2a78d6] bg-[#cde2fb] font-bold text-[#2a78d6]"
                                : "border-black/10 bg-[#fcfcfb] text-[#52514e] hover:bg-[#f0efec]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-black/10 bg-[#fcfcfb]">
                    {activeTab === "buffett" && (
                        <Panel
                            title="💰 شاشة بافيت — التدفق الحر وأرباح المالك"
                            desc="ترتيب حسب عائد أرباح المالك تنازلياً."
                            loading={loading}
                            count={buffettRows.length}
                        >
                            <table className="w-full border-collapse text-[12.3px]">
                                <thead>
                                    <tr>
                                        <Th>الشركة</Th>
                                        <Th align="left">عائد FCF٪</Th>
                                        <Th align="left">عائد أرباح المالك٪</Th>
                                        <Th align="left">دين/ملكية</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buffettRows.map((r) => (
                                        <Row key={r.symbol} onClick={() => goToStock(r.symbol)}>
                                            <NameCell symbol={r.symbol} name={r.name} />
                                            <Td>{fmtPct(r.models?.buffett?.fcf_yield_pct)}</Td>
                                            <Td>{fmtPct(r.models?.buffett?.owner_earnings_yield_pct)}</Td>
                                            <Td>{fmt(r.models?.buffett?.debt_to_equity, 2)}</Td>
                                        </Row>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    )}

                    {activeTab === "graham" && (
                        <Panel
                            title="🛡️ شاشة جراهام — هامش الأمان"
                            desc="ترتيب حسب صافي القيمة الحالية للأصول (NCAV) تنازلياً."
                            loading={loading}
                            count={grahamRows.length}
                        >
                            <table className="w-full border-collapse text-[12.3px]">
                                <thead>
                                    <tr>
                                        <Th>الشركة</Th>
                                        <Th align="left">NCAV</Th>
                                        <Th align="left">نسبة التداول</Th>
                                        <Th align="left">صافي-صافي؟</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grahamRows.map((r) => (
                                        <Row key={r.symbol} onClick={() => goToStock(r.symbol)}>
                                            <NameCell symbol={r.symbol} name={r.name} />
                                            <Td>{fmt(r.models?.graham?.ncav, 0)}</Td>
                                            <Td>{fmt(r.models?.graham?.current_ratio, 2)}</Td>
                                            <td className="whitespace-nowrap px-2.5 py-1.5 text-left">
                                                {r.models?.graham?.is_net_net ? (
                                                    <span className="rounded border border-[#8a6d1d] bg-[#fdf3dd] px-1.5 text-[10px] font-bold text-[#8a6d1d]">
                                                        نعم
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-[#f0efec] px-1.5 text-[10px] text-[#898781]">لا</span>
                                                )}
                                            </td>
                                        </Row>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    )}

                    {activeTab === "magic_formula" && (
                        <Panel
                            title="🧮 ماجيك فورميولا — منهجية Greenblatt"
                            desc="ترتيب حسب مجموع العائد على رأس المال + عائد الأرباح تنازلياً."
                            loading={loading}
                            count={magicRows.length}
                        >
                            <table className="w-full border-collapse text-[12.3px]">
                                <thead>
                                    <tr>
                                        <Th>الشركة</Th>
                                        <Th align="left">ROC٪</Th>
                                        <Th align="left">عائد الأرباح٪</Th>
                                        <Th align="left">EV</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {magicRows.map((r) => (
                                        <Row key={r.symbol} onClick={() => goToStock(r.symbol)}>
                                            <NameCell symbol={r.symbol} name={r.name} />
                                            <Td>{fmtPct(r.models?.magic_formula?.return_on_capital_pct)}</Td>
                                            <Td>{fmtPct(r.models?.magic_formula?.earnings_yield_pct)}</Td>
                                            <Td>{fmt(r.models?.magic_formula?.ev, 0)}</Td>
                                        </Row>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    )}

                    {activeTab === "lynch" && (
                        <Panel
                            title="🚀 شاشة لينش — تسارع النمو"
                            desc="شركات لديها إشارة تسارع (acceleration) في الأرباح."
                            loading={loading}
                            count={lynchRows.length}
                        >
                            <table className="w-full border-collapse text-[12.3px]">
                                <thead>
                                    <tr>
                                        <Th>الشركة</Th>
                                        <Th align="left">القطاع</Th>
                                        <Th align="left">الإشارة</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lynchRows.map((r) => (
                                        <Row key={r.symbol} onClick={() => goToStock(r.symbol)}>
                                            <NameCell symbol={r.symbol} name={r.name} />
                                            <Td>{r.sector ?? "—"}</Td>
                                            <td className="whitespace-nowrap px-2.5 py-1.5 text-left">
                                                <span className="rounded bg-[#0ca30c]/10 px-1.5 text-[10px] font-bold text-[#006300]">
                                                    تسارع
                                                </span>
                                            </td>
                                        </Row>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Small presentational helpers ────────────────────────────────────────────

function Panel({
    title,
    desc,
    loading,
    count,
    children,
}: {
    title: string;
    desc: string;
    loading: boolean;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="px-4 pb-0.5 pt-2.5 text-[13.5px] font-bold">{title}</h3>
            <div className="px-4 pb-2 text-[12px] text-[#52514e]">{desc}</div>
            <div className="px-4 pb-2 text-[11px] text-[#898781]">
                {loading ? "جارٍ التحميل…" : `${count} شركة (أعلى ${PAGE_SIZE})`}
            </div>
            <div className="overflow-x-auto">
                {loading ? <SkeletonTable /> : count === 0 ? <EmptyState /> : children}
            </div>
        </div>
    );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
    return (
        <th
            className={`whitespace-nowrap border-b-[1.5px] border-[#c3c2b7] px-2.5 py-1.5 text-[10.5px] font-semibold text-[#898781] ${align === "left" ? "text-left" : "text-right"
                }`}
        >
            {children}
        </th>
    );
}

function Td({ children }: { children: React.ReactNode }) {
    return (
        <td className="whitespace-nowrap border-b border-[#e1e0d9] px-2.5 py-1.5 text-left tabular-nums" dir="ltr">
            {children}
        </td>
    );
}

function Row({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <tr onClick={onClick} className="cursor-pointer hover:bg-[#f0efec]">
            {children}
        </tr>
    );
}

function NameCell({ symbol, name }: { symbol: string; name: string }) {
    return (
        <td className="whitespace-nowrap border-b border-[#e1e0d9] px-2.5 py-1.5 text-right font-semibold">
            {name} <small className="font-normal text-[#898781]">{symbol}</small>
        </td>
    );
}

function EmptyState() {
    return <div className="px-4 py-8 text-center text-[#898781]">لا توجد شركات مطابقة لهذه الشاشة.</div>;
}

function SkeletonTable() {
    return (
        <div className="space-y-2 px-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-[#f0efec]" />
            ))}
        </div>
    );
}