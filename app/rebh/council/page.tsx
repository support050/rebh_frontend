"use client";

import { useMemo, useState, useEffect } from "react";
import {
    CheckSquare,
    HelpCircle,
    AlertOctagon,
    UserCheck,
    ShieldCheck,
    Flag,
    Building2,
    Save,
    AlertTriangle,
    RefreshCw,
    Search,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

/* ============================================================
   REBH · Council & 31-Checklist Audit Station
   Philip Fisher's 15 Points · Corporate Governance Red Flags ·
   Lynch's Classification · the Assiry 12 Bank Red Flags.
   ============================================================ */

type ScoreVal = 0 | 0.5 | 1;
type TabKey = "fisher" | "redflags" | "bank";

/* ---------------- Fisher 15 ---------------- */
interface FisherItem {
    id: number;
    q: string;
    mandatory?: boolean;
}

const FISHER_15: FisherItem[] = [
    { id: 1, q: "Products/services with sufficient market potential for years of sales growth" },
    { id: 2, q: "Management determination to develop new products/processes despite current lines maturing" },
    { id: 3, q: "R&D effectiveness relative to company size (rule of thumb: ≥3% of revenue)" },
    { id: 4, q: "Above-average sales organization" },
    { id: 5, q: "Worthwhile profit margin" },
    { id: 6, q: "Actions being taken to maintain or improve margins" },
    { id: 7, q: "Outstanding labor relations" },
    { id: 8, q: "Outstanding executive relations" },
    { id: 9, q: "Depth of management" },
    { id: 10, q: "Cost analysis and accounting controls" },
    { id: 11, q: "Industry-specific competitive edges (patents, leases, government contracts)" },
    { id: 12, q: "Long-range vs short-range profit outlook" },
    { id: 13, q: "No dilutive equity financing on the visible horizon" },
    { id: 14, q: "Management frank with shareholders in bad times, not just good times" },
    { id: 15, q: "Unquestionable management integrity", mandatory: true },
];

/* ---------------- Red Flags (Lecture 15) ---------------- */
interface FlagItem {
    id: string;
    label: string;
    group: "danger" | "redflag";
}

const DANGER_SIGNS: FlagItem[] = [
    { id: "ocf_decline", label: "Operating cash flow that was healthy and now declines", group: "danger" },
    { id: "receivables", label: "Receivables rising faster than sales (heavy selling without cash collection)", group: "danger" },
    { id: "restructuring", label: "Recurring 'restructuring' charges with no clear justification", group: "danger" },
    { id: "serial_acq", label: "Serial acquisitions (stock stalls ≥2 years post-acquisition — banks exempt)", group: "danger" },
    { id: "rights_issue", label: "Secondary offering / rights issue (negative by default)", group: "danger" },
    { id: "accrued", label: "Accrued expenses growing year after year", group: "danger" },
    { id: "depreciation", label: "Depreciation-life extension to flatter reported profit (e.g. 20 → 30 years)", group: "danger" },
];

const RED_FLAGS: FlagItem[] = [
    { id: "outside_income", label: "Earnings from investments outside the core, appearing erratically", group: "redflag" },
    { id: "pension_risk", label: "Pension risk — discount rate changed every couple of years", group: "redflag" },
    { id: "vanishing_cf", label: "Vanishing cash flow with inventory pile-up", group: "redflag" },
    { id: "covenant", label: "Changing credit covenants — tightening is immediately negative", group: "redflag" },
    { id: "deferred_exp", label: "Deferring expenses to flatter costs while cash drains", group: "redflag" },
];

/* ---------------- Bank Flags (Assiry 12) ---------------- */
interface BankFlagItem {
    id: string;
    label: string;
    note: string;
}

const BANK_FLAGS: BankFlagItem[] = [
    { id: "b1", label: "Investments whose risk can't be measured, or that contradict the business model", note: "From Lehman Brothers' 2007 annual disclosure" },
    { id: "b2", label: "The bank's CDS spread diverging from peers", note: "Credit Suisse decoupled from its peers in mid-2021" },
    { id: "b3", label: "Sudden change in the funding mix (shift to equity/bond/sukuk issuance)", note: "" },
    { id: "b4", label: "Any change in an accounting line's presentation without clear explanation", note: "Credit Suisse folded the right-of-use line into write-offs in 2019" },
    { id: "b5", label: "A sharp change in collateral", note: "Credit Suisse's bank collateral fell from 41 to roughly one-third" },
    { id: "b6", label: "Profits improving only via provision reversals", note: "Credit Suisse — earnings volatility driven by provisions, not sales" },
    { id: "b7", label: "Financials and share price worse than the sector over the long run", note: "Stability is a bank's core product" },
    { id: "b8", label: "Non-earning assets ÷ NII rising", note: "Credit Suisse: reached parity by 2019 as net interest margin declined" },
    { id: "b9", label: "Repeat laundering / fraud / corruption cases", note: "Buffett: there is never just one cockroach in the kitchen" },
    { id: "b10", label: "Open conflict between executives and the board", note: "" },
    { id: "b11", label: "Salaries÷loans / salaries÷revenue deteriorating, or 20–30% credit concentration in one sector", note: "The Saudi contracting sector case, 2015–2016" },
    { id: "b12", label: "A complicated risk-appetite statement", note: "\"If it's complicated — avoid it\"" },
];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function CouncilAuditStation() {
    const [tab, setTab] = useState<TabKey>("fisher");
    const [symbol, setSymbol] = useState<string>("2222");
    const [searchInput, setSearchInput] = useState<string>("");
    const [companyData, setCompanyData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    /* ---------------- Fisher state: starts EMPTY (null) so user evaluates voluntarily ---------------- */
    const [fisherScores, setFisherScores] = useState<Record<number, ScoreVal | null>>({});

    const fisherResult = useMemo(() => {
        const answeredCount = Object.values(fisherScores).filter((v) => v !== null && v !== undefined).length;
        const total = FISHER_15.reduce((a, f) => {
            const sc = fisherScores[f.id];
            return a + (sc != null ? sc : 0);
        }, 0);
        const integrityFail = fisherScores[15] === 0;
        return { total, answeredCount, integrityFail };
    }, [fisherScores]);

    /* ---------------- Red flags state ---------------- */
    const [dangerChecked, setDangerChecked] = useState<Set<string>>(new Set());
    const [redflagChecked, setRedflagChecked] = useState<Set<string>>(new Set());

    function toggleFlag(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
        const next = new Set(set);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setter(next);
    }

    const totalFlagsTicked = dangerChecked.size + redflagChecked.size;

    /* ---------------- Bank flags state ---------------- */
    const [bankChecked, setBankChecked] = useState<Set<string>>(new Set());

    /* ---------------- Auto-populated flags (from engine signals) ---------------- */
    const [autoFlags, setAutoFlags] = useState<Map<string, string>>(new Map());

    // Fetch company automated audit & saved checklist
    useEffect(() => {
        let isMounted = true;

        // Clear previous company's data immediately so stale data doesn't stay visible
        setCompanyData(null);
        setFisherScores({});
        setDangerChecked(new Set());
        setRedflagChecked(new Set());
        setBankChecked(new Set());
        setAutoFlags(new Map());
        setFetchError(null);

        async function loadCompanyCouncil() {
            setIsLoading(true);
            setSaveStatus(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/rebh/council/${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!isMounted) return;
                    setCompanyData(data);

                    // Fix stale closure: use functional updater so we read live tab state
                    if (!data.is_bank) {
                        setTab((t) => (t === "bank" ? "fisher" : t));
                    }

                    // Use backend-provided auto_flag_ids and auto_flag_reasons
                    const autoFlagIds: string[] = data?.automated_audit?.auto_flag_ids || [];
                    const reasonsMap: Record<string, string> = data?.automated_audit?.auto_flag_reasons || {};
                    const flagsMap = new Map<string, string>();
                    autoFlagIds.forEach((id) => {
                        flagsMap.set(id, reasonsMap[id] || "");
                    });

                    if (autoFlagIds.length > 0) {
                        setAutoFlags(flagsMap);
                        // Pre-tick only when the user has never actually saved anything for this company.
                        const sc = data.saved_checklist;
                        const hasSaved = !!sc && (
                            Object.keys(sc.fisher_scores || {}).length > 0 ||
                            (sc.danger_flags?.length ?? 0) > 0 ||
                            (sc.red_flags?.length ?? 0) > 0 ||
                            (sc.bank_flags?.length ?? 0) > 0
                        );
                        if (!hasSaved) {
                            const dangerIdSet = new Set(DANGER_SIGNS.map(d => d.id));
                            const redIdSet = new Set(RED_FLAGS.map(r => r.id));
                            const newDanger = new Set<string>();
                            const newRed = new Set<string>();

                            autoFlagIds.forEach(id => {
                                if (dangerIdSet.has(id)) newDanger.add(id);
                                if (redIdSet.has(id)) newRed.add(id);
                            });

                            if (newDanger.size > 0) setDangerChecked(newDanger);
                            if (newRed.size > 0) setRedflagChecked(newRed);
                        }
                    }

                    // Restore saved scores if available
                    if (data.saved_checklist) {
                        const savedF = data.saved_checklist.fisher_scores;
                        if (savedF && Object.keys(savedF).length > 0) {
                            const restoredScores: Record<number, ScoreVal | null> = {};
                            FISHER_15.forEach((item) => {
                                const val = savedF[String(item.id)] ?? savedF[item.id];
                                restoredScores[item.id] = val != null ? (val as ScoreVal) : null;
                            });
                            setFisherScores(restoredScores);
                        }
                        if (data.saved_checklist.danger_flags?.length) {
                            setDangerChecked(new Set(data.saved_checklist.danger_flags));
                        }
                        if (data.saved_checklist.red_flags?.length) {
                            setRedflagChecked(new Set(data.saved_checklist.red_flags));
                        }
                        if (data.saved_checklist.bank_flags?.length) {
                            setBankChecked(new Set(data.saved_checklist.bank_flags));
                        }
                    }
                } else {
                    if (!isMounted) return;
                    if (res.status === 404) {
                        setFetchError(`Company "${symbol}" was not found in the database — check the symbol and try again`);
                    } else {
                        setFetchError(`Server error (${res.status}) — please try again later`);
                    }
                }
            } catch (err) {
                console.error("Failed to load company council audit:", err);
                if (isMounted) setFetchError("Unable to reach the server — check your internet connection and try again");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadCompanyCouncil();
        return () => { isMounted = false; };
    }, [symbol]);

    // Save interactive evaluations for company
    async function handleSaveChecklist() {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const fisherPayload: Record<string, number> = {};
            Object.entries(fisherScores).forEach(([k, v]) => {
                if (v !== null && v !== undefined) {
                    fisherPayload[k] = v;
                }
            });

            const res = await fetch(`${API_BASE_URL}/api/rebh/council/${symbol}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol,
                    fisher_scores: fisherPayload,
                    danger_flags: Array.from(dangerChecked),
                    red_flags: Array.from(redflagChecked),
                    bank_flags: Array.from(bankChecked),
                }),
            });

            if (res.ok) {
                setSaveStatus("Assessments and audit checklist saved successfully for this company ✓");
                setTimeout(() => setSaveStatus(null), 4000);
            } else {
                setSaveStatus("Failed to save the assessment on the server");
            }
        } catch (err) {
            setSaveStatus("Server connection error while saving");
        } finally {
            setIsSaving(false);
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (trimmed) {
            setSymbol(trimmed);
            setSearchInput("");
        }
    };

    // Display-only English names (fall back to the backend values when no English field is provided)
    const companyNameDisplay = companyData ? (companyData.en || companyData.name_en || companyData.name_ar) : null;
    const companySectorDisplay = companyData ? (companyData.sec_en || companyData.sector) : null;

    return (
        <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans">
            <style>{globalCss}</style>

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                {/* ---------------- HEADER ---------------- */}
                <header className="mb-6 border-b border-[#E5E7EB] pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={24} className="text-[#8C3B32]" />
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    REBH <span className="text-[#8C3B32]">Review Council — Comprehensive Checklist (31 Items)</span>
                                </h1>
                                <p className="mt-1 text-[13px] text-[#6B7280]">
                                    Comprehensive audit council station — Fisher checklists and red flags are entered by the user; automated engine signals appear below
                                </p>
                            </div>
                        </div>

                        {/* Search Bar & Save Action */}
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                <div className="flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-sm focus-within:border-[#8C3B32]">
                                    <Search size={15} className="text-[#8C3B32]" />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder={companyData ? `${companyNameDisplay || symbol} (${companyData.symbol || symbol})` : `Search by company symbol...`}
                                        className="bg-transparent text-[12.5px] font-medium text-[#1A1A1A] outline-none placeholder:text-[#9CA3AF] w-52 text-left"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2 py-0.5 text-[11px] font-bold text-[#1A1A1A] transition"
                                    >
                                        Screen
                                    </button>
                                </div>
                            </form>

                            <button
                                onClick={handleSaveChecklist}
                                disabled={isSaving || isLoading}
                                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#8C3B32] px-3.5 py-1.5 text-[12.5px] font-bold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>Save Assessment</span>
                            </button>
                        </div>
                    </div>

                    {saveStatus && (
                        <div className="mt-3 rounded-[4px] border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-[12px] font-medium text-[#16A34A]">
                            {saveStatus}
                        </div>
                    )}

                    {fetchError && (
                        <div className="mt-3 flex items-center gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[12.5px] font-medium text-[#DC2626]">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>{fetchError}</span>
                        </div>
                    )}

                    {/* Company Audit Summary Banner */}
                    {companyData && (
                        <div className="mt-4 rounded-[4px] border border-[#E5E7EB] bg-white p-3.5 text-[12.5px] shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-2">
                                <div className="font-semibold text-[#1A1A1A]">
                                    {companyNameDisplay} ({companyData.symbol}) — <span className="text-[#6B7280] font-normal">{companySectorDisplay}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#6B7280]">Accounting Trust Badge:</span>
                                    <span className="rounded bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-bold text-[#1A1A1A]">
                                        {companyData.automated_audit?.trust_badge?.badge_text || "Under Review"}
                                    </span>
                                </div>
                            </div>

                            {/* Automated Forensics & Signals */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[11.5px] font-medium text-[#8C3B32]">Automated Detection Signals:</span>
                                {companyData.automated_audit?.signals?.length > 0 ? (
                                    companyData.automated_audit.signals.map((sig: any, idx: number) => {
                                        const label = typeof sig === "string" ? sig : (sig?.text || sig?.rule || JSON.stringify(sig));
                                        return (
                                            <span key={idx} className="inline-flex items-center gap-1 rounded bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#DC2626]">
                                                <AlertTriangle size={11} />
                                                {label}
                                            </span>
                                        );
                                    })
                                ) : (
                                    <span className="text-[11.5px] text-[#16A34A]">No critical automated warning signals in the financial statements ✓</span>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* ---------------- TABS ---------------- */}
                <nav className="mb-5 flex flex-wrap gap-2">
                    <TabButton
                        active={tab === "fisher"}
                        onClick={() => setTab("fisher")}
                        icon={<CheckSquare size={15} />}
                        label="Fisher's 15 Points (Fisher 15)"
                    />
                    <TabButton
                        active={tab === "redflags"}
                        onClick={() => setTab("redflags")}
                        icon={<AlertOctagon size={15} />}
                        label="Risk & Governance Red Flags"
                    />
                    {companyData?.is_bank ? (
                        <TabButton
                            active={tab === "bank"}
                            onClick={() => setTab("bank")}
                            icon={<UserCheck size={15} />}
                            label="Bank Screener (Bank Flags)"
                            tag="Banking Sector"
                        />
                    ) : (
                        <TabButton
                            active={false}
                            onClick={() => { }}
                            icon={<UserCheck size={15} />}
                            label="Bank Screener (banks only)"
                            disabled={true}
                            tooltip="This company is not a bank — the bank screener is reserved for banks only"
                        />
                    )}
                </nav>

                {/* ---------------- FISHER 15 ---------------- */}
                {tab === "fisher" && (
                    <section className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
                        <VerdictBar
                            value={fisherResult.answeredCount === 0 ? "—" : fisherResult.total.toFixed(1)}
                            suffix={fisherResult.answeredCount === 0 ? "Not yet assessed" : `/ 15 (${fisherResult.answeredCount}/15 items)`}
                            ok={fisherResult.total >= 12 && !fisherResult.integrityFail && fisherResult.answeredCount >= 10}
                            disqualified={fisherResult.integrityFail}
                            okLabel="Qualified for qualitative investment (Fisher criteria)"
                            failLabel="Disqualified — integrity not established (Item 15)"
                            midLabel={fisherResult.answeredCount === 0 ? "Begin scoring the items below" : "Below the required threshold (12/15)"}
                        />

                        {fisherResult.integrityFail && (
                            <DangerBanner>
                                Item 15 (management integrity) is the only mandatory item in Fisher&apos;s
                                checklist — failing this item alone disqualifies the company from
                                qualitative investment regardless of the other points.
                            </DangerBanner>
                        )}

                        {/* Score legend: header row explains what 0 / 0.5 / 1 mean once,
                            instead of repeating that context in every one of the 15 rows. */}
                        <div className="mt-5 hidden grid-cols-[1fr_150px] gap-3.5 border-b border-[#E5E7EB] pb-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF] sm:grid">
                            <span>Item</span>
                            <span className="flex justify-end gap-4 pl-1">
                                <span className="w-6 text-center">0</span>
                                <span className="w-6 text-center">0.5</span>
                                <span className="w-6 text-center">1</span>
                            </span>
                        </div>

                        <div className="divide-y divide-[#E5E7EB]">
                            {FISHER_15.map((f) => (
                                <div
                                    key={f.id}
                                    className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-[1fr_150px] sm:items-center"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className="mt-0.5 min-w-[22px] font-mono text-xs font-bold text-[#8C3B32]">
                                            {f.id}
                                            {f.mandatory ? " ⚑" : ""}
                                        </span>
                                        <div>
                                            <div className="text-[13px] text-[#1A1A1A]">{f.q}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-4 sm:justify-end sm:pl-1">
                                        {[0, 0.5, 1].map((v) => (
                                            <label
                                                key={v}
                                                className="flex flex-col items-center gap-1 text-[11px] text-[#6B7280] cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`fisher-${f.id}`}
                                                    checked={fisherScores[f.id] === v}
                                                    onChange={() =>
                                                        setFisherScores((prev) => ({ ...prev, [f.id]: v as ScoreVal }))
                                                    }
                                                    className="h-3.5 w-3.5 accent-[#8C3B32]"
                                                />
                                                {v}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Footnote>
                            Fisher tolerance margin: a company may fail one or two ordinary items
                            and remain qualified. Item 15 (integrity) alone rescues or sinks the
                            entire assessment.
                        </Footnote>
                    </section>
                )}

                {/* ---------------- RED FLAGS ---------------- */}
                {tab === "redflags" && (
                    <section className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
                        <VerdictBar
                            value={String(totalFlagsTicked)}
                            suffix="ticked"
                            ok={totalFlagsTicked === 0}
                            disqualified={totalFlagsTicked >= 2}
                            okLabel="Clean — no risk signals"
                            failLabel="Two signals together = exit immediately"
                            midLabel="One signal — monitor closely"
                        />

                        <GroupTitle>The Seven Danger Signs (Lecture 15)</GroupTitle>
                        {autoFlags.size > 0 && (
                            <div className="mb-2 flex items-center gap-1.5 rounded-[4px] bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-[11.5px] text-[#92400E]">
                                <span className="font-bold">•</span>
                                <span>The engine automatically detected <strong>{autoFlags.size}</strong> signal(s) from the financial statements — you can adjust them manually
                                    <span className="ml-1 inline-flex items-center rounded-full bg-[#FDE68A] px-2 py-0.5 text-[10px] font-bold">Auto</span>
                                </span>
                            </div>
                        )}
                        <div className="divide-y divide-[#E5E7EB]">
                            {DANGER_SIGNS.map((f) => (
                                <FlagCheckbox
                                    key={f.id}
                                    item={f}
                                    checked={dangerChecked.has(f.id)}
                                    onToggle={() => toggleFlag(dangerChecked, setDangerChecked, f.id)}
                                    isAuto={autoFlags.has(f.id)}
                                    autoReason={autoFlags.get(f.id)}
                                />
                            ))}
                        </div>

                        <GroupTitle className="mt-5">Red Flags</GroupTitle>
                        <div className="divide-y divide-[#E5E7EB]">
                            {RED_FLAGS.map((f) => (
                                <FlagCheckbox
                                    key={f.id}
                                    item={f}
                                    checked={redflagChecked.has(f.id)}
                                    onToggle={() => toggleFlag(redflagChecked, setRedflagChecked, f.id)}
                                    isAuto={autoFlags.has(f.id)}
                                    autoReason={autoFlags.get(f.id)}
                                />
                            ))}
                        </div>

                        {totalFlagsTicked >= 2 && (
                            <DangerBanner>
                                Two or more signals together: the course rule — exit. You do not
                                need to know the exact reason; it is enough that confidence in the
                                numbers has been shaken.
                            </DangerBanner>
                        )}

                        <Footnote>
                            The capital-increase rule is absolute: any rights issue is negative
                            by default — the burden is on you to give reasons for not treating it
                            as negative, not the reverse.
                        </Footnote>
                    </section>
                )}

                {/* ---------------- BANK FLAGS ---------------- */}
                {tab === "bank" && (
                    <section className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
                        {!companyData?.is_bank ? (
                            <div className="rounded-[4px] border border-[#FDE68A] bg-[#FFFBEB] p-4 text-center">
                                <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-[#B45309]" />
                                <h3 className="text-sm font-bold text-[#92400E]">
                                    This company is not in the banking sector ({companySectorDisplay || "Non-bank"})
                                </h3>
                                <p className="mt-1 text-xs text-[#78350F]">
                                    The bank screening model (Assiry 12) is reserved exclusively for banks and financial institutions that rely on deposits, loans and net interest margins (NIM).
                                </p>
                            </div>
                        ) : (
                            <>
                                <VerdictBar
                                    value={String(bankChecked.size)}
                                    suffix="/ 12"
                                    ok={bankChecked.size === 0}
                                    disqualified={bankChecked.size >= 3}
                                    okLabel="No banking risk signals"
                                    failLabel="3 or more signals — serious warning (there is never just one cockroach in the kitchen)"
                                    midLabel="Monitor — fewer than 3 signals"
                                />

                                <GroupTitle>The 12 Banking Red Flags (Assiry Banking Module)</GroupTitle>
                                <div className="divide-y divide-[#E5E7EB]">
                                    {BANK_FLAGS.map((f) => (
                                        <label key={f.id} className="flex cursor-pointer items-start gap-2.5 py-3">
                                            <input
                                                type="checkbox"
                                                checked={bankChecked.has(f.id)}
                                                onChange={() => toggleFlag(bankChecked, setBankChecked, f.id)}
                                                className="mt-0.5 h-4 w-4 accent-[#8C3B32]"
                                            />
                                            <div>
                                                <div className="text-[13px] text-[#1A1A1A]">{f.label}</div>
                                                {f.note && (
                                                    <div className="mt-1 text-[11px] italic text-[#9CA3AF]">{f.note}</div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <Footnote>
                                    Applies to banking-sector stocks only — a bank is a financial
                                    intermediary, not a factory, so the usual industrial safety items
                                    do not apply to it.
                                </Footnote>
                            </>
                        )}
                    </section>
                )}

                <footer className="mt-8 text-center text-[11px] text-[#9CA3AF]">
                    REBH Council · Interactive audit checklists — presents readings and does not
                    recommend buying or selling
                </footer>
            </div>
        </div>
    );
}

/* ================= sub-components ================= */

function TabButton({
    active,
    onClick,
    icon,
    label,
    disabled = false,
    tag,
    tooltip,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    tag?: string;
    tooltip?: string;
}) {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            title={tooltip}
            className={
                disabled
                    ? "inline-flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2 text-[12.5px] font-normal text-[#9CA3AF] cursor-not-allowed opacity-60"
                    : active
                        ? "inline-flex items-center gap-1.5 rounded-[4px] border border-[#8C3B32] bg-white px-4 py-2 text-[12.5px] font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                        : "inline-flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-4 py-2 text-[12.5px] font-medium text-[#6B7280] transition-colors hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
            }
        >
            {icon}
            <span>{label}</span>
            {tag && (
                <span className="rounded bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 text-[10px] font-bold">
                    {tag}
                </span>
            )}
        </button>
    );
}

/* Verdict bar recast as a small KPI card: uppercase muted label above a bold
   value, with a status badge — matches the shared stat-card pattern instead
   of a one-off dark bar. */
function VerdictBar({
    value,
    suffix,
    ok,
    disqualified,
    okLabel,
    failLabel,
    midLabel,
}: {
    value: string;
    suffix: string;
    ok: boolean;
    disqualified: boolean;
    okLabel: string;
    failLabel: string;
    midLabel: string;
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 border-b border-[#E5E7EB] pb-4">
            <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[28px] font-bold leading-none text-[#1A1A1A]">{value}</span>
                <span className="text-[13px] text-[#9CA3AF]">{suffix}</span>
            </div>
            <VerdictBadge
                ok={ok}
                disqualified={disqualified}
                okLabel={okLabel}
                failLabel={failLabel}
                midLabel={midLabel}
            />
        </div>
    );
}

function VerdictBadge({
    ok,
    disqualified,
    okLabel,
    failLabel,
    midLabel,
}: {
    ok: boolean;
    disqualified: boolean;
    okLabel: string;
    failLabel: string;
    midLabel: string;
}) {
    let classes = "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]";
    let label = midLabel;

    if (disqualified) {
        classes = "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]";
        label = failLabel;
    } else if (ok) {
        classes = "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]";
        label = okLabel;
    }

    return (
        <span className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold ${classes}`}>
            {label}
        </span>
    );
}

function DangerBanner({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-4 flex items-start gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[12.5px] text-[#DC2626]">
            <Flag size={14} className="mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    );
}

function GroupTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`mb-2 mt-4 text-[13px] font-semibold text-[#1A1A1A] ${className}`}>{children}</h3>
    );
}

function Footnote({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-4 flex items-start gap-1.5 border-t border-[#E5E7EB] pt-3 text-[11.5px] leading-relaxed text-[#6B7280]">
            <HelpCircle size={13} className="mt-0.5 shrink-0 text-[#9CA3AF]" />
            <span>{children}</span>
        </div>
    );
}

function FlagCheckbox({
    item,
    checked,
    onToggle,
    isAuto = false,
    autoReason,
}: {
    item: FlagItem;
    checked: boolean;
    onToggle: () => void;
    isAuto?: boolean;
    autoReason?: string;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-2.5 py-2.5">
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="mt-0.5 h-4 w-4 accent-[#8C3B32]"
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#1A1A1A]">{item.label}</span>
                    {isAuto && (
                        <span className="inline-flex items-center rounded-full bg-[#FDE68A] border border-[#F59E0B] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                            • Auto
                        </span>
                    )}
                </div>
                {isAuto && autoReason && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-[4px] bg-[#FFFBEB] px-2 py-1 text-[11.5px] font-medium text-[#92400E] border border-[#FDE68A]">
                        <span>Automated detection reason: {autoReason}</span>
                    </div>
                )}
            </div>
        </label>
    );
}

/* ================= global css ================= */
/* Kept minimal — focus rings and hover states are now handled by Tailwind
   utility classes above instead of blanket element selectors. */
const globalCss = `
  input:focus-visible { outline: 2px solid #8C3B32; outline-offset: 2px; }
`;