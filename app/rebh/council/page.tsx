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
    qAr: string;
    mandatory?: boolean;
}

const FISHER_15: FisherItem[] = [
    { id: 1, q: "Products/services with sufficient market potential for years of sales growth", qAr: "منتجات/خدمات ذات إمكانات سوقية كافية لسنوات من نمو المبيعات" },
    { id: 2, q: "Management determination to develop new products/processes despite current lines maturing", qAr: "عزم الإدارة على تطوير منتجات جديدة رغم نضوج الخطوط الحالية" },
    { id: 3, q: "R&D effectiveness relative to company size (rule of thumb: ≥3% of revenue)", qAr: "فعالية البحث والتطوير نسبة للحجم (≥3% من الإيرادات)" },
    { id: 4, q: "Above-average sales organization", qAr: "تنظيم مبيعات أعلى من المتوسط" },
    { id: 5, q: "Worthwhile profit margin", qAr: "هامش ربح مجزٍ" },
    { id: 6, q: "Actions being taken to maintain or improve margins", qAr: "إجراءات فعلية للحفاظ على الهامش أو تحسينه" },
    { id: 7, q: "Outstanding labor relations", qAr: "علاقات عمل متميزة مع الموظفين" },
    { id: 8, q: "Outstanding executive relations", qAr: "علاقات تنفيذية متميزة" },
    { id: 9, q: "Depth of management", qAr: "عمق الإدارة (الصف الثاني)" },
    { id: 10, q: "Cost analysis and accounting controls", qAr: "تحليل التكاليف والضوابط المحاسبية" },
    { id: 11, q: "Industry-specific competitive edges (patents, leases, government contracts)", qAr: "ميزات تنافسية خاصة بالقطاع (براءات، عقود حكومية)" },
    { id: 12, q: "Long-range vs short-range profit outlook", qAr: "نظرة أرباح بعيدة المدى لا قصيرة المدى" },
    { id: 13, q: "No dilutive equity financing on the visible horizon", qAr: "لا يوجد تمويل مساهمين مخفف للأرباح في الأفق" },
    { id: 14, q: "Management frank with shareholders in bad times, not just good times", qAr: "صراحة الإدارة مع المساهمين في الأوقات الصعبة" },
    { id: 15, q: "Unquestionable management integrity", qAr: "نزاهة إدارة لا شك فيها", mandatory: true },
];

/* ---------------- Red Flags (Lecture 15) ---------------- */
interface FlagItem {
    id: string;
    label: string;
    labelAr: string;
    group: "danger" | "redflag";
}

const DANGER_SIGNS: FlagItem[] = [
    { id: "ocf_decline", label: "Operating cash flow that was healthy and now declines", labelAr: "تدفق نقدي تشغيلي كان صحياً وأصبح يتراجع", group: "danger" },
    { id: "receivables", label: "Receivables rising faster than sales (heavy selling without cash collection)", labelAr: "الذمم المدينة ترتفع أسرع من المبيعات", group: "danger" },
    { id: "restructuring", label: "Recurring 'restructuring' charges with no clear justification", labelAr: "رسوم 'إعادة هيكلة' متكررة دون مبرر واضح", group: "danger" },
    { id: "serial_acq", label: "Serial acquisitions (stock stalls ≥2 years post-acquisition — banks exempt)", labelAr: "استحواذات متكررة (السهم يتوقف عن الارتفاع لسنتين على الأقل)", group: "danger" },
    { id: "rights_issue", label: "Secondary offering / rights issue (negative by default)", labelAr: "طرح ثانوي / زيادة رأس مال (سلبي بشكل افتراضي)", group: "danger" },
    { id: "accrued", label: "Accrued expenses growing year after year", labelAr: "المصاريف المستحقة ترتفع سنة بعد سنة", group: "danger" },
    { id: "depreciation", label: "Depreciation-life extension to flatter reported profit (e.g. 20 → 30 years)", labelAr: "تمديد العمر الإنتاجي للإهلاك لتجميل الأرباح (مثال: 20 إلى 30 سنة)", group: "danger" },
];

const RED_FLAGS: FlagItem[] = [
    { id: "outside_income", label: "Earnings from investments outside the core, appearing erratically", labelAr: "أرباح استثمارات خارج النشاط الأساسي تظهر بشكل غير منتظم", group: "redflag" },
    { id: "pension_risk", label: "Pension risk — discount rate changed every couple of years", labelAr: "مخاطر معاش التقاعد — تغيير معدل الخصم كل سنتين", group: "redflag" },
    { id: "vanishing_cf", label: "Vanishing cash flow with inventory pile-up", labelAr: "تدفق نقدي متلاشٍ مع تراكم المخزون", group: "redflag" },
    { id: "covenant", label: "Changing credit covenants — tightening is immediately negative", labelAr: "تغيّر شروط التعهدات الائتمانية — التشديد سلبي فوراً", group: "redflag" },
    { id: "deferred_exp", label: "Deferring expenses to flatter costs while cash drains", labelAr: "تأجيل المصاريف لتجميل التكاليف بينما النقد يتناقص", group: "redflag" },
];

/* ---------------- Bank Flags (Assiry 12) ---------------- */
interface BankFlagItem {
    id: string;
    label: string;
    labelAr: string;
    note: string;
}

const BANK_FLAGS: BankFlagItem[] = [
    { id: "b1", label: "Investments whose risk can't be measured, or that contradict the business model", labelAr: "استثمارات لا يمكن قياس مخاطرها أو تتعارض مع نموذج العمل", note: "من إفصاح ليمان براذرز السنوي 2007" },
    { id: "b2", label: "The bank's CDS spread diverging from peers", labelAr: "انحراف سبريد مقايضة التخلف عن السداد (CDS) عن نظرائه", note: "كريدي سويس انفصل عن نظرائه منتصف 2021" },
    { id: "b3", label: "Sudden change in the funding mix (shift to equity/bond/sukuk issuance)", labelAr: "تغيّر مفاجئ في مزيج التمويل", note: "" },
    { id: "b4", label: "Any change in an accounting line's presentation without clear explanation", labelAr: "تغيّر في عرض بند محاسبي دون تفسير واضح", note: "كريدي سويس دمج بند حق الاستخدام ضمن الشطب عام 2019" },
    { id: "b5", label: "A sharp change in collateral", labelAr: "تغيّر حاد في الضمانات", note: "ضمانات كريدي سويس البنكية تراجعت من 41 إلى نحو الثلث" },
    { id: "b6", label: "Profits improving only via provision reversals", labelAr: "تحسّن الأرباح فقط عبر عكس المخصصات", note: "كريدي سويس — تقلّب الأرباح بسبب المخصصات لا المبيعات" },
    { id: "b7", label: "Financials and share price worse than the sector over the long run", labelAr: "أداء مالي وسعري أضعف من القطاع على المدى الطويل", note: "الاستقرار هو المنتج الأساسي للبنك" },
    { id: "b8", label: "Non-earning assets ÷ NII rising", labelAr: "ارتفاع نسبة الأصول غير المدرّة ÷ صافي دخل الفوائد", note: "كريدي سويس: تعادل بحلول 2019 مع تراجع هامش الفائدة الصافي" },
    { id: "b9", label: "Repeat laundering / fraud / corruption cases", labelAr: "قضايا غسيل أموال / احتيال / فساد متكررة", note: "بافيت: لا توجد صرصورة واحدة فقط في المطبخ" },
    { id: "b10", label: "Open conflict between executives and the board", labelAr: "نزاع علني بين التنفيذيين ومجلس الإدارة", note: "" },
    { id: "b11", label: "Salaries÷loans / salaries÷revenue deteriorating, or 20–30% credit concentration in one sector", labelAr: "تدهور الرواتب÷القروض أو تركّز ائتماني 20-30% بقطاع واحد", note: "حالة قطاع المقاولات السعودي 2015-2016" },
    { id: "b12", label: "A complicated risk-appetite statement", labelAr: "بيان شهية مخاطر معقّد", note: "\"إن كان الأمر معقداً — تجنّبه\"" },
];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function CouncilAuditStation() {
    const [tab, setTab] = useState<TabKey>("fisher");
    const [symbol, setSymbol] = useState<string>("2222.SR");
    const [companyData, setCompanyData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    /* ---------------- Fisher state ---------------- */
    const [fisherScores, setFisherScores] = useState<Record<number, ScoreVal>>(
        Object.fromEntries(FISHER_15.map((f) => [f.id, 0.5 as ScoreVal]))
    );

    const fisherResult = useMemo(() => {
        const total = FISHER_15.reduce((a, f) => a + (fisherScores[f.id] ?? 0.5), 0);
        const integrityFail = fisherScores[15] === 0;
        return { total, integrityFail };
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
    const [autoFlags, setAutoFlags] = useState<Set<string>>(new Set());

    // سيجنالات المحرك تُعين تلقائياً على flags حسب هذا المابينج
    const SIGNAL_TO_FLAGS: Record<string, string[]> = {
        // OCF / CFO deterioration
        "cfo_decline": ["ocf_decline"],
        "ocf": ["ocf_decline"],
        "cfo": ["ocf_decline"],
        // Receivables rising faster than sales
        "receivable": ["receivables"],
        "receivables": ["receivables"],
        "ذمم": ["receivables"],
        // Recurring restructuring
        "restructur": ["restructuring"],
        "هيكلة": ["restructuring"],
        // Rights issue / dilutive
        "rights_issue": ["rights_issue"],
        "capital_increase": ["rights_issue"],
        "زيادة رأس مال": ["rights_issue"],
        // Vanishing CF / inventory
        "inventory": ["vanishing_cf"],
        "مخزون": ["vanishing_cf"],
        // Accrued expenses
        "accrued": ["accrued"],
        "مستحقة": ["accrued"],
    };

    function mapSignalsToFlags(signals: string[]): string[] {
        const flagIds = new Set<string>();
        signals.forEach(sig => {
            const sigLower = sig.toLowerCase();
            Object.entries(SIGNAL_TO_FLAGS).forEach(([keyword, ids]) => {
                if (sigLower.includes(keyword.toLowerCase())) {
                    ids.forEach(id => flagIds.add(id));
                }
            });
        });
        return Array.from(flagIds);
    }

    // Fetch company automated audit & saved checklist
    useEffect(() => {
        let isMounted = true;
        async function loadCompanyCouncil() {
            setIsLoading(true);
            setSaveStatus(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/rebh/council/${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!isMounted) return;
                    setCompanyData(data);

                    // توليد الإشارات الآلية: استخراج flags من engine signals
                    const engineSignals: string[] = data?.automated_audit?.signals || [];
                    if (engineSignals.length > 0) {
                        const autoFlagIds = mapSignalsToFlags(engineSignals);
                        if (autoFlagIds.length > 0) {
                            setAutoFlags(new Set(autoFlagIds));
                            // Only pre-tick if user hasn't saved any checklist yet
                            if (!data.saved_checklist?.danger_flags?.length) {
                                setDangerChecked(prev => new Set([...Array.from(prev), ...autoFlagIds]));
                            }
                        }
                    }

                    // Restore saved scores if available
                    if (data.saved_checklist) {
                        const savedF = data.saved_checklist.fisher_scores;
                        if (savedF && Object.keys(savedF).length > 0) {
                            const restoredScores: Record<number, ScoreVal> = {};
                            FISHER_15.forEach((item) => {
                                restoredScores[item.id] = (savedF[String(item.id)] ?? savedF[item.id] ?? 0.5) as ScoreVal;
                            });
                            setFisherScores(restoredScores);
                        }
                        if (data.saved_checklist.danger_flags) {
                            setDangerChecked(new Set(data.saved_checklist.danger_flags));
                        }
                        if (data.saved_checklist.red_flags) {
                            setRedflagChecked(new Set(data.saved_checklist.red_flags));
                        }
                        if (data.saved_checklist.bank_flags) {
                            setBankChecked(new Set(data.saved_checklist.bank_flags));
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load company council audit:", err);
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
                fisherPayload[k] = v;
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
                setSaveStatus("تم حفظ التقييمات وقائمة التدقيق للشركة بنجاح ✓");
                setTimeout(() => setSaveStatus(null), 4000);
            } else {
                setSaveStatus("فشل حفظ التقييم في الخادم");
            }
        } catch (err) {
            setSaveStatus("خطأ في الاتصال بالخادم أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans">
            <style>{globalCss}</style>

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                {/* ---------------- HEADER ---------------- */}
                <header className="mb-6 border-b border-[#E5E7EB] pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={24} className="text-[#8C3B32]" />
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    REBH <span className="text-[#8C3B32]">مجلس التدقيق — القائمة الشاملة (31 بنداً)</span>
                                </h1>
                                <p className="mt-1 text-[13px] text-[#6B7280]">
                                    محطة مجلس التدقيق الشامل — قوائم فيشر وأعلام الخطر يُدخلها المستخدم؛ الإشارات الآلية من المحرك تظهر أدناه
                                </p>
                            </div>
                        </div>

                        {/* Company Selector & Save Action */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-sm">
                                <Building2 size={16} className="text-[#8C3B32]" />
                                <select
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="bg-transparent text-[13px] font-bold text-[#1A1A1A] outline-none"
                                >
                                    <option value="2222.SR">2222.SR - أرامكو السعودية</option>
                                    <option value="1120.SR">1120.SR - مصرف الراجحي</option>
                                    <option value="1180.SR">1180.SR - البنك الأهلي السعودي</option>
                                    <option value="2010.SR">2010.SR - سابك</option>
                                    <option value="7010.SR">7010.SR - إس تي سي</option>
                                    <option value="2280.SR">2280.SR - المراعي</option>
                                    <option value="4001.SR">4001.SR - أسواق العثيم</option>
                                    <option value="2380.SR">2380.SR - بترورابغ</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSaveChecklist}
                                disabled={isSaving || isLoading}
                                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#8C3B32] px-3.5 py-1.5 text-[12.5px] font-bold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>حفظ التقييم</span>
                            </button>
                        </div>
                    </div>

                    {saveStatus && (
                        <div className="mt-3 rounded-[4px] border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-[12px] font-medium text-[#16A34A]">
                            {saveStatus}
                        </div>
                    )}

                    {/* Company Audit Summary Banner */}
                    {companyData && (
                        <div className="mt-4 rounded-[4px] border border-[#E5E7EB] bg-white p-3.5 text-[12.5px] shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-2">
                                <div className="font-semibold text-[#1A1A1A]">
                                    {companyData.name_ar} ({companyData.symbol}) — <span className="text-[#6B7280] font-normal">{companyData.sector}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#6B7280]">شارة الثقة المحاسبية:</span>
                                    <span className="rounded bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-bold text-[#1A1A1A]">
                                        {companyData.automated_audit?.trust_badge?.badge_text || "قيد التدقيق"}
                                    </span>
                                </div>
                            </div>

                            {/* Automated Forensics & Signals */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[11.5px] font-medium text-[#8C3B32]">إشارات الرصد الآلي:</span>
                                {companyData.automated_audit?.signals?.length > 0 ? (
                                    companyData.automated_audit.signals.map((sig: string, idx: number) => (
                                        <span key={idx} className="inline-flex items-center gap-1 rounded bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#DC2626]">
                                            <AlertTriangle size={11} />
                                            {sig}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[11.5px] text-[#16A34A]">لا توجد إشارات تحذيرية آلية حرجة في القوائم ✓</span>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* ---------------- TABS ---------------- */}
                {/* Note: three checklists cover different, non-overlapping question types
                    (weighted score / tally of binary flags / capped count), so a shared tab
                    group keeps them from competing for space while making it clear they're
                    views of the same audit, not separate pages. */}
                <nav className="mb-5 flex flex-wrap gap-2">
                    <TabButton
                        active={tab === "fisher"}
                        onClick={() => setTab("fisher")}
                        icon={<CheckSquare size={15} />}
                        label="قائمة فيشر (Fisher 15)"
                    />
                    <TabButton
                        active={tab === "redflags"}
                        onClick={() => setTab("redflags")}
                        icon={<AlertOctagon size={15} />}
                        label="أعلام الخطر والحوكمة (Red Flags)"
                    />
                    <TabButton
                        active={tab === "bank"}
                        onClick={() => setTab("bank")}
                        icon={<UserCheck size={15} />}
                        label="فاحص البنوك (Bank Flags)"
                    />
                </nav>

                {/* ---------------- FISHER 15 ---------------- */}
                {tab === "fisher" && (
                    <section className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
                        <VerdictBar
                            value={fisherResult.total.toFixed(1)}
                            suffix="/ 15"
                            ok={fisherResult.total >= 12 && !fisherResult.integrityFail}
                            disqualified={fisherResult.integrityFail}
                            okLabel="مؤهل للاستثمار النوعي (معيار فيشر)"
                            failLabel="غير مؤهل — النزاهة غير متحققة (بند 15)"
                            midLabel="دون الحد المطلوب (12/15)"
                        />

                        {fisherResult.integrityFail && (
                            <DangerBanner>
                                بند 15 (نزاهة الإدارة) هو الوحيد الإلزامي في قائمة فيشر — فشل
                                هذا البند وحده يُسقط الشركة من الاستثمار النوعي بصرف النظر عن
                                بقية النقاط.
                            </DangerBanner>
                        )}

                        {/* Score legend: header row explains what 0 / 0.5 / 1 mean once,
                            instead of repeating that context in every one of the 15 rows. */}
                        <div className="mt-5 hidden grid-cols-[1fr_150px] gap-3.5 border-b border-[#E5E7EB] pb-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF] sm:grid">
                            <span>البند</span>
                            <span className="flex justify-end gap-4 pr-1">
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
                                            <div className="text-[13px] text-[#1A1A1A]">{f.qAr}</div>
                                            <div className="mt-0.5 text-[12px] text-[#6B7280]">
                                                {f.q}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-4 sm:justify-end sm:pr-1">
                                        {[0, 0.5, 1].map((v) => (
                                            <label
                                                key={v}
                                                className="flex flex-col items-center gap-1 text-[11px] text-[#6B7280]"
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
                            هامش تحمل معيار فيشر: يمكن أن تخفق الشركة في بند أو بندين عاديين
                            وتظل مؤهلة. البند 15 (النزاهة) وحده يُنقذ التقييم بالكامل أو
                            يُسقطه.
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
                            okLabel="نظيفة — لا إشارات خطر"
                            failLabel="إشارتان معاً = انسحب فوراً"
                            midLabel="إشارة واحدة — راقب عن قرب"
                        />

                        <GroupTitle>الست إشارات الخطر (Lecture 15)</GroupTitle>
                        {autoFlags.size > 0 && (
                            <div className="mb-2 flex items-center gap-1.5 rounded-[4px] bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-[11.5px] text-[#92400E]">
                                <span className="font-bold">•</span>
                                <span>تم تفعيل <strong>{autoFlags.size}</strong> إشارة/إشارات تلقائياً من إشارات المحرك — يمكنك تعديلها يدوياً
                                    <span className="mr-1 inline-flex items-center rounded-full bg-[#FDE68A] px-2 py-0.5 text-[10px] font-bold">آلي</span>
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
                                />
                            ))}
                        </div>

                        <GroupTitle className="mt-5">الأعلام الحمراء (Red Flags)</GroupTitle>
                        <div className="divide-y divide-[#E5E7EB]">
                            {RED_FLAGS.map((f) => (
                                <FlagCheckbox
                                    key={f.id}
                                    item={f}
                                    checked={redflagChecked.has(f.id)}
                                    onToggle={() => toggleFlag(redflagChecked, setRedflagChecked, f.id)}
                                />
                            ))}
                        </div>

                        {totalFlagsTicked >= 2 && (
                            <DangerBanner>
                                تجمّع إشارتان أو أكثر معاً: قاعدة الدورة — انسحب. لا تحتاج
                                لمعرفة السبب الدقيق؛ يكفي أن الثقة في الأرقام اهتزت.
                            </DangerBanner>
                        )}

                        <Footnote>
                            قاعدة زيادة رأس المال مطلقة: أي طرح حقوق أولوية يُعد سلبياً
                            بشكل افتراضي — الأصل أن تُقدَّم أسباباً لعدم اعتباره سلبياً، لا
                            العكس.
                        </Footnote>
                    </section>
                )}

                {/* ---------------- BANK FLAGS ---------------- */}
                {tab === "bank" && (
                    <section className="rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
                        <VerdictBar
                            value={String(bankChecked.size)}
                            suffix="/ 12"
                            ok={bankChecked.size === 0}
                            disqualified={bankChecked.size >= 3}
                            okLabel="لا إشارات خطر بنكية"
                            failLabel="3 إشارات فأكثر — تحذير جدي (لا توجد صرصورة واحدة في المطبخ)"
                            midLabel="راقب — أقل من 3 إشارات"
                        />

                        <GroupTitle>ال 12 إشارة خطر بنكية (Assiry Banking Module)</GroupTitle>
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
                                        <div className="text-[13px] text-[#1A1A1A]">{f.labelAr}</div>
                                        <div className="mt-0.5 text-[12px] text-[#6B7280]">
                                            {f.label}
                                        </div>
                                        {f.note && (
                                            <div className="mt-1 text-[11px] italic text-[#9CA3AF]">{f.note}</div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <Footnote>
                            تنطبق على أسهم القطاع البنكي فقط — فالبنك وسيط مالي وليس
                            مصنعاً، لذا عناصر السلامة الصناعية المعتادة لا تنطبق عليه.
                        </Footnote>
                    </section>
                )}

                <footer className="mt-8 text-center text-[11px] text-[#9CA3AF]">
                    REBH Council · قوائم تدقيق تفاعلية — تعرض القراءة ولا توصي بالشراء أو
                    البيع
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
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={
                active
                    ? "inline-flex items-center gap-1.5 rounded-[4px] border border-[#8C3B32] bg-white px-4 py-2 text-[12.5px] font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "inline-flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-4 py-2 text-[12.5px] font-medium text-[#6B7280] transition-colors hover:border-[#8C3B32]/40 hover:text-[#1A1A1A]"
            }
        >
            {icon}
            <span>{label}</span>
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
}: {
    item: FlagItem;
    checked: boolean;
    onToggle: () => void;
    isAuto?: boolean;
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
                    <span className="text-[13px] text-[#1A1A1A]">{item.labelAr}</span>
                    {isAuto && (
                        <span className="inline-flex items-center rounded-full bg-[#FDE68A] border border-[#F59E0B] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                            • آلي
                        </span>
                    )}
                </div>
                <div className="mt-0.5 text-[12px] text-[#6B7280]">
                    {item.label}
                </div>
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