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
    sec: string;
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

const SECTOR_AR: Record<string, string> = {
    "Energy": "الطاقة",
    "Materials": "المواد الأساسية",
    "Capital Goods": "السلع الرأسمالية",
    "Commercial & Professional Services": "الخدمات التجارية والمهنية",
    "Transportation": "النقل",
    "Consumer Durables & Apparel": "السلع المعمرة والملابس",
    "Consumer Services": "خدمات المستهلك",
    "Media and Entertainment": "الإعلام والترفيه",
    "Consumer Discretionary Distribution & Retail": "تجزئة السلع الكمالية",
    "Consumer Staples Distribution & Retail": "تجزئة الأغذية والسلع الأساسية",
    "Food & Staples Retailing": "تجزئة السلع الأساسية",
    "Food & Beverages": "الأغذية والمشروبات",
    "Health Care Equipment & Services": "الرعاية الصحية والمعدات",
    "Pharmaceuticals, Biotechnology & Life Sciences": "الأدوية والعلوم الحيوية",
    "Banks": "البنوك",
    "Financial Services": "الخدمات المالية",
    "Insurance": "التأمين",
    "Software & Services": "البرمجيات والخدمات",
    "Telecommunication Services": "الاتصالات",
    "Utilities": "المرافق العامة",
    "Real Estate Management & Development": "إدارة وتطوير العقارات",
    "REITs": "صناديق الاستثمار العقارية المتداولة (ريت)",
};

function translateSector(sec?: string | null): string {
    if (!sec) return "—";
    // Check direct match
    if (SECTOR_AR[sec]) return SECTOR_AR[sec];
    // Check if format is "Sector | Industry"
    const parts = sec.split("|").map(p => p.trim());
    const mainSector = parts[0];
    if (SECTOR_AR[mainSector]) {
        return parts.length > 1 ? `${SECTOR_AR[mainSector]} (${parts[1]})` : SECTOR_AR[mainSector];
    }
    return sec;
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
        chip: "لا توجد إفصاحات",
    },
    "empty-statement": {
        icon: AlertTriangle,
        color: "#B45309",
        bg: "#FFFBEB",
        border: "#FDE68A",
        chip: "قائمة دخل فارغة°",
    },
    stale: {
        icon: RefreshCw,
        color: "#374151",
        bg: "#F3F4F6",
        border: "#D1D5DB",
        chip: "بيانات قديمة",
    },
    corruption: {
        icon: ShieldAlert,
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        chip: "تلاعب في البيانات ⚑",
    },
    other: {
        icon: AlertTriangle,
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        chip: "تنبيه",
    },
};

const ROW_GRID = "md:grid-cols-[1.4fr_1fr_1fr_1fr_2.4fr_auto]";

const FILTERS: { key: QuarantineReasonKind | "all"; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "no-filings", label: "لا توجد إفصاحات" },
    { key: "empty-statement", label: "قائمة دخل فارغة" },
    { key: "stale", label: "بيانات قديمة" },
    { key: "corruption", label: "تلاعب في البيانات" },
    { key: "other", label: "تنبيهات وملاحظات" },
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
                    (r.item.sec || "").toUpperCase().includes(q) ||
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
        <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-16">
            {/* Header */}
            <header className="px-6 md:px-9 pt-7 pb-4 border-b border-[#E5E7EB] bg-white">
                <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 rounded-[4px] bg-[#FEF2F2] border border-[#FECACA] p-2">
                        <ShieldAlert size={22} color="#DC2626" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
                                الحجر الصحي{" "}
                                <span className="text-[#8C3B32]">
                                    — كومة الحالات المستعصية، مُعلنة صراحة
                                </span>
                            </h1>
                            {quarantineMeta && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-mono text-[#6B7280]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                        {quarantineMeta.source || "بوابة REBH للتحليل الجنائي"}
                                    </span>
                                    {quarantineMeta.generated_at && (
                                        <span className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-mono text-[#6B7280]" title={quarantineMeta.generated_at}>
                                            {new Date(quarantineMeta.generated_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-bold text-[#DC2626]">
                                        {quarantineMeta.count ?? rows.length} شركة محجورة
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#6B7280]">
                            تطبيقاً لمبدأ مانجر: الشركات التي لا يمكن الوثوق ببياناتها{" "}
                            <b className="text-[#8C3B32]">
                                يُعلن حجرها صراحة مع ذكر السبب
                            </b>{" "}
                            — لا تُعرض بصمت بنسب مالية مزيّنة. المحرك يستبعدها بالفعل من
                            التسعير والفرز؛ وهذه الصفحة تعلن ذلك صراحة.
                        </p>
                    </div>
                </div>
            </header>

            <main className="px-6 md:px-9 pt-6 max-w-[1200px] mx-auto">
                {/* Honesty-mark legend */}
                <div className={`${SUBCARD} flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2 mb-4 text-[10.5px] text-[#6B7280]`}>
                    <span className="font-semibold text-[#1A1A1A] shrink-0">مفتاح علامات الأمانة:</span>
                    <span>° قائمة دخل مجتزأة أو غير مكتملة</span>
                    <span>≈ تقدير تقريبي (TTM محسوب)</span>
                    <span>⚑ علم تحذير جنائي</span>
                    <span>⚠ تنبيه بيانات</span>
                    <span>🔌 مصدر بيانات ناقص</span>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                    <KpiCard
                        value={loading ? "…" : fmt(rows.length, 0)}
                        label={`في الحجر (من أصل ${totalUniverse || "—"})`}
                        color="#B45309"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["no-filings"], 0)}
                        label="لا توجد إفصاحات"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts["empty-statement"], 0)}
                        label="قائمة دخل فارغة°"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.stale, 0)}
                        label="بيانات قديمة"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.corruption, 0)}
                        label="تلاعب جسيم ⚑"
                        color="#DC2626"
                    />
                    <KpiCard
                        value={loading ? "…" : fmt(counts.other, 0)}
                        label="تنبيهات وملاحظات"
                        color="#B45309"
                    />
                </div>

                <p className="text-[11px] text-[#6B7280] mb-4 max-w-3xl leading-relaxed">
                    هذه الشركات تظهر في المنصة مع إخفاء أي تسعير أو درجة لا يثق بها المحرك،
                    مع ذكر السبب علناً — لا نعرض نسباً مزيّنة على بيانات غير موثوقة.
                </p>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="بحث بالرمز أو الاسم أو القطاع…"
                            className={`${INPUT} w-full pr-8 pl-8 py-2`}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                aria-label="مسح البحث"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#DC2626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 rounded-sm"
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
                        className="sm:mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[11.5px] font-semibold border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#8C3B32] hover:text-[#8C3B32] disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        تحديث
                    </button>
                </div>

                {/* Content states */}
                <div aria-live="polite" aria-atomic="false">
                    {error && (
                        <div className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-[12.5px] text-[#DC2626] mb-6 flex items-center gap-2">
                            <AlertTriangle size={15} />
                            {error} — يرجى التحقق من اتصال واجهة البرمجة (API) والمحاولة مرة أخرى.
                        </div>
                    )}

                    {loading && !error && (
                        <div className={`${CARD} p-10 text-center text-[#6B7280] text-[13px]`}>
                            جارى تحميل قاعدة الشركات…
                        </div>
                    )}

                    {!loading && !error && filteredRows.length === 0 && (
                        <div className={`${CARD} p-10 text-center text-[#6B7280] text-[13px] flex flex-col items-center gap-2`}>
                            <CheckCircle2 size={20} className="text-[#16A34A]" />
                            لا توجد شركات مطابقة لهذا الفلتر.
                        </div>
                    )}
                </div>

                {!loading && !error && filteredRows.length > 0 && (
                    <div className={`${CARD} overflow-hidden`}>
                        {/* Table header (desktop) */}
                        <div className={`hidden md:grid ${ROW_GRID} gap-3 px-5 py-3 border-b border-[#E5E7EB] bg-[#F3F4F6] text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold`}>
                            <span>الشركة</span>
                            <span className="text-right">القطاع</span>
                            <span className="text-right">القيمة السوقية</span>
                            <span className="text-right">السعر</span>
                            <span>سبب الحجر</span>
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
                        عرض {filteredRows.length} من أصل {rows.length} شركة محجورة
                        {query || activeFilter !== "all" ? " (بعد التصفية)" : ""}،
                        مرتبة حسب القيمة السوقية.
                    </p>
                )}

                {/* Exit doors */}
                <div className={`mt-6 ${SUBCARD} border-[#8C3B32]/30 p-4 text-[12px] text-[#6B7280] leading-relaxed`}>
                    <b className="text-[#8C3B32]">مسارات الخروج (ملخص المطورين P0):</b>{" "}
                    إصلاح رابط بيانات قائمة الدخل يُخرج فئة "قائمة الدخل الفارغة" فوراً
                    (بما فيها أرامكو — سابك ضمن فئة البيانات القديمة)؛ محلل IFRS-17
                    {/* TODO: replace with computed count from backend */}
                    يُخرج ≈27 شركة تأمين من فئة البيانات القديمة؛ إصلاح قائمة المستوردين
                    يضيف الرموز الغائبة؛ إلزامية ضبط المقياس عند الاستيراد تُنهي فئة
                    التلاعب في البيانات.
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
                            {item.n || "—"}
                        </span>
                    </div>
                </div>

                <div className="text-[11px] text-[#6B7280] md:text-right" title={item.sec || undefined}>
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">القطاع</span>
                    {translateSector(item.sec)}
                </div>

                <div className="text-[12.5px] text-[#1A1A1A] tabular-nums md:text-right">
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">القيمة السوقية</span>
                    {fmt(item.mc, 0)}
                </div>

                <div className="text-[12.5px] text-[#1A1A1A] tabular-nums md:text-right">
                    <span className="md:hidden text-[9px] text-[#6B7280] uppercase mr-1">السعر</span>
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
                            +{reasons.length - 2} إضافية
                        </button>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onToggle}
                        className="text-[#6B7280] hover:text-[#8C3B32] p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 rounded-sm"
                        aria-label="عرض التفاصيل"
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
                            فحص هوية الميزانية: فشل°
                        </div>
                    )}
                    {item.bs_ok == null && (
                        <div className="text-[10.5px] text-[#B45309] pt-1">
                            فحص هوية الميزانية: 🔌 مصدر غير متوفر
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}