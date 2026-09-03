"use client";

import { useMemo, useState } from "react";
import {
    CheckSquare,
    HelpCircle,
    AlertOctagon,
    UserCheck,
    ShieldCheck,
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
    { id: "b1", label: "Investments whose risk can't be measured, or that contradict the business model", labelAr: "استثمارات لا يمكن قياس مخاطرها أو تتعارض مع نموذج العمل", note: "Lehman 2007 10-K language" },
    { id: "b2", label: "The bank's CDS spread diverging from peers", labelAr: "انحراف سبريد مقايضة التخلف عن السداد (CDS) عن نظرائه", note: "Credit Suisse left the pack from mid-2021" },
    { id: "b3", label: "Sudden change in the funding mix (shift to equity/bond/sukuk issuance)", labelAr: "تغيّر مفاجئ في مزيج التمويل", note: "" },
    { id: "b4", label: "Any change in an accounting line's presentation without clear explanation", labelAr: "تغيّر في عرض بند محاسبي دون تفسير واضح", note: "CS merged right-of-use into write-offs, 2019" },
    { id: "b5", label: "A sharp change in collateral", labelAr: "تغيّر حاد في الضمانات", note: "CS bank guarantees 41 → ~a third" },
    { id: "b6", label: "Profits improving only via provision reversals", labelAr: "تحسّن الأرباح فقط عبر عكس المخصصات", note: "Credit Suisse — profit swinging on provisions, not sales" },
    { id: "b7", label: "Financials and share price worse than the sector over the long run", labelAr: "أداء مالي وسعري أضعف من القطاع على المدى الطويل", note: "Stability is the bank's product" },
    { id: "b8", label: "Non-earning assets ÷ NII rising", labelAr: "ارتفاع نسبة الأصول غير المدرّة ÷ صافي دخل الفوائد", note: "CS: parity by 2019, NIM falling" },
    { id: "b9", label: "Repeat laundering / fraud / corruption cases", labelAr: "قضايا غسيل أموال / احتيال / فساد متكررة", note: "Buffett: never just one cockroach in the kitchen" },
    { id: "b10", label: "Open conflict between executives and the board", labelAr: "نزاع علني بين التنفيذيين ومجلس الإدارة", note: "" },
    { id: "b11", label: "Salaries÷loans / salaries÷revenue deteriorating, or 20–30% credit concentration in one sector", labelAr: "تدهور الرواتب÷القروض أو تركّز ائتماني 20-30% بقطاع واحد", note: "Saudi contracting 2015-16 case" },
    { id: "b12", label: "A complicated risk-appetite statement", labelAr: "بيان شهية مخاطر معقّد", note: "\"If it's complicated — avoid it\"" },
];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function CouncilAuditStation() {
    const [tab, setTab] = useState<TabKey>("fisher");

    /* ---------------- Fisher state ---------------- */
    const [fisherScores, setFisherScores] = useState<Record<number, ScoreVal>>(
        Object.fromEntries(FISHER_15.map((f) => [f.id, 0.5 as ScoreVal]))
    );

    const fisherResult = useMemo(() => {
        const total = FISHER_15.reduce((a, f) => a + fisherScores[f.id], 0);
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

    return (
        <div style={styles.page}>
            <style>{globalCss}</style>

            <header style={styles.header}>
                <div style={styles.headerTitleRow}>
                    <ShieldCheck size={26} color="#63a5f0" />
                    <h1 style={styles.h1}>
                        REBH <span style={{ color: "#63a5f0" }}>COUNCIL &amp; 31-CHECKLIST AUDIT</span>
                    </h1>
                </div>
                <p style={styles.sub}>
                    Philip Fisher&apos;s 15-Point checklist, the course&apos;s Danger
                    Signs &amp; Red Flags (Lecture 15), and the Assiry 12 Bank Red
                    Flags — scored interactively, with real-time verdicts.
                </p>
            </header>

            {/* ---------------- TABS ---------------- */}
            <nav style={styles.tabRow}>
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
                <section style={styles.panel}>
                    <div style={styles.verdictBar}>
                        <div style={styles.verdictScore}>
                            <span style={styles.verdictNum}>{fisherResult.total.toFixed(1)}</span>
                            <span style={styles.verdictOf}>/ 15</span>
                        </div>
                        <VerdictBadge
                            ok={fisherResult.total >= 12 && !fisherResult.integrityFail}
                            disqualified={fisherResult.integrityFail}
                            okLabel="Fisher Grade — مؤهل للاستثمار النوعي"
                            failLabel="Disqualified — النزاهة غير متحققة (بند 15)"
                            midLabel="دون الحد المطلوب (12/15)"
                        />
                    </div>
                    {fisherResult.integrityFail && (
                        <div style={styles.dangerBanner}>
                            ⚑ بند 15 (نزاهة الإدارة) هو الوحيد الإلزامي في قائمة فيشر — فشل
                            هذا البند وحده يُسقط الشركة من الاستثمار النوعي بصرف النظر عن
                            بقية النقاط.
                        </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                        {FISHER_15.map((f) => (
                            <div key={f.id} style={styles.fisherRow}>
                                <div style={styles.fisherQCol}>
                                    <span style={styles.fisherIdx}>
                                        {f.id}
                                        {f.mandatory ? " ⚑" : ""}
                                    </span>
                                    <div>
                                        <div style={styles.fisherQ}>{f.q}</div>
                                        <div style={styles.fisherQAr}>{f.qAr}</div>
                                    </div>
                                </div>
                                <div style={styles.scoreGroup}>
                                    {[0, 0.5, 1].map((v) => (
                                        <label key={v} style={styles.scoreOption}>
                                            <input
                                                type="radio"
                                                name={`fisher-${f.id}`}
                                                checked={fisherScores[f.id] === v}
                                                onChange={() =>
                                                    setFisherScores((prev) => ({ ...prev, [f.id]: v as ScoreVal }))
                                                }
                                                style={{ accentColor: "#3987e5" }}
                                            />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={styles.footnote}>
                        <HelpCircle size={12} style={{ marginInlineEnd: 4, verticalAlign: "middle" }} />
                        Fisher tolerance: a company can fail 1–2 ordinary points and still
                        qualify. Point 15 (integrity) repairs — or disqualifies — all the
                        others.
                    </div>
                </section>
            )}

            {/* ---------------- RED FLAGS ---------------- */}
            {tab === "redflags" && (
                <section style={styles.panel}>
                    <div style={styles.verdictBar}>
                        <div style={styles.verdictScore}>
                            <span style={styles.verdictNum}>{totalFlagsTicked}</span>
                            <span style={styles.verdictOf}>ticked</span>
                        </div>
                        <VerdictBadge
                            ok={totalFlagsTicked === 0}
                            disqualified={totalFlagsTicked >= 2}
                            okLabel="نظيفة — لا إشارات خطر"
                            failLabel="2 danger signs together = Walk Away — انسحب"
                            midLabel="إشارة واحدة — راقب عن قرب"
                        />
                    </div>

                    <h3 style={styles.groupTitle}>THE SIX DANGER SIGNS (Lecture 15)</h3>
                    {DANGER_SIGNS.map((f) => (
                        <FlagCheckbox
                            key={f.id}
                            item={f}
                            checked={dangerChecked.has(f.id)}
                            onToggle={() => toggleFlag(dangerChecked, setDangerChecked, f.id)}
                        />
                    ))}

                    <h3 style={{ ...styles.groupTitle, marginTop: 18 }}>THE RED FLAGS</h3>
                    {RED_FLAGS.map((f) => (
                        <FlagCheckbox
                            key={f.id}
                            item={f}
                            checked={redflagChecked.has(f.id)}
                            onToggle={() => toggleFlag(redflagChecked, setRedflagChecked, f.id)}
                        />
                    ))}

                    {totalFlagsTicked >= 2 && (
                        <div style={styles.dangerBanner}>
                            ⚑ تجمّع إشارتان أو أكثر معاً: قاعدة الدورة — انسحب. لا تحتاج
                            لمعرفة السبب الدقيق؛ يكفي أن الثقة في الأرقام اهتزت.
                        </div>
                    )}
                    <div style={styles.footnote}>
                        <HelpCircle size={12} style={{ marginInlineEnd: 4, verticalAlign: "middle" }} />
                        The capital-increase rule is absolute: any rights issue is
                        negative by default — &quot;give me a reason to stop seeing it as
                        negative,&quot; never the reverse.
                    </div>
                </section>
            )}

            {/* ---------------- BANK FLAGS ---------------- */}
            {tab === "bank" && (
                <section style={styles.panel}>
                    <div style={styles.verdictBar}>
                        <div style={styles.verdictScore}>
                            <span style={styles.verdictNum}>{bankChecked.size}</span>
                            <span style={styles.verdictOf}>/ 12</span>
                        </div>
                        <VerdictBadge
                            ok={bankChecked.size === 0}
                            disqualified={bankChecked.size >= 3}
                            okLabel="لا إشارات خطر بنكية"
                            failLabel="≥3 flags — Buffett: never just one cockroach"
                            midLabel="راقب — أقل من 3 إشارات"
                        />
                    </div>

                    <h3 style={styles.groupTitle}>THE 12 BANK RED FLAGS (Assiry Banking Module)</h3>
                    {BANK_FLAGS.map((f) => (
                        <label key={f.id} style={styles.bankRow}>
                            <input
                                type="checkbox"
                                checked={bankChecked.has(f.id)}
                                onChange={() => toggleFlag(bankChecked, setBankChecked, f.id)}
                                style={{ accentColor: "#e85d5d", marginTop: 3 }}
                            />
                            <div>
                                <div style={styles.fisherQ}>{f.label}</div>
                                <div style={styles.fisherQAr}>{f.labelAr}</div>
                                {f.note && <div style={styles.bankNote}>{f.note}</div>}
                            </div>
                        </label>
                    ))}

                    <div style={styles.footnote}>
                        <HelpCircle size={12} style={{ marginInlineEnd: 4, verticalAlign: "middle" }} />
                        Applies to banking-sector stocks only — a bank is a money
                        broker, not a factory: the standard industrial safety elements
                        do not apply to it. Data source:{" "}
                        <code style={{ color: "#63a5f0" }}>{API_BASE_URL}</code>
                    </div>
                </section>
            )}

            <footer style={styles.footer}>
                REBH Council · قوائم تدقيق تفاعلية — تعرض القراءة ولا توصي بالشراء أو
                البيع
            </footer>
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
            style={{
                ...styles.tabBtn,
                ...(active ? styles.tabBtnActive : {}),
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
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
    let bg = "rgba(232,196,100,.13)";
    let border = "#e8c464";
    let color = "#e8c464";
    let label = midLabel;

    if (disqualified) {
        bg = "rgba(232,93,93,.14)";
        border = "#e85d5d";
        color = "#e85d5d";
        label = failLabel;
    } else if (ok) {
        bg = "rgba(46,204,113,.14)";
        border = "#2ecc71";
        color = "#2ecc71";
        label = okLabel;
    }

    return (
        <span
            style={{
                background: bg,
                border: `1.5px solid ${border}`,
                color,
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 800,
            }}
        >
            {label}
        </span>
    );
}

function FlagCheckbox({
    item,
    checked,
    onToggle,
}: {
    item: FlagItem;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <label style={styles.flagRow}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                style={{ accentColor: "#e85d5d", marginTop: 3 }}
            />
            <div>
                <div style={styles.fisherQ}>{item.label}</div>
                <div style={styles.fisherQAr}>{item.labelAr}</div>
            </div>
        </label>
    );
}

/* ================= styles ================= */

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#0a0c10",
        color: "#e8edf4",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "26px 24px 60px",
    },
    header: { marginBottom: 20, borderBottom: "1px solid #1e2836", paddingBottom: 16 },
    headerTitleRow: { display: "flex", alignItems: "center", gap: 10 },
    h1: { fontSize: 21, fontWeight: 900, margin: 0, letterSpacing: -0.3 },
    sub: { color: "#a8b0bc", fontSize: 12.5, marginTop: 8, maxWidth: 900, lineHeight: 1.7 },
    tabRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
    tabBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: "#121924",
        border: "1px solid #1e2836",
        borderRadius: 10,
        color: "#a8b0bc",
        padding: "9px 16px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
    },
    tabBtnActive: {
        background: "#3987e5",
        borderColor: "#3987e5",
        color: "#fff",
    },
    panel: {
        background: "#121924",
        border: "1px solid #1e2836",
        borderRadius: 14,
        padding: "20px 22px",
    },
    verdictBar: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        borderBottom: "1px solid #1e2836",
        paddingBottom: 16,
        marginBottom: 4,
    },
    verdictScore: {
        display: "flex",
        alignItems: "baseline",
        gap: 4,
        fontFamily: "Consolas, monospace",
    },
    verdictNum: { fontSize: 30, fontWeight: 900, color: "#f0f2f5" },
    verdictOf: { fontSize: 13, color: "#626b78" },
    dangerBanner: {
        background: "rgba(232,93,93,.08)",
        borderInlineStart: "3px solid #e85d5d",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12.5,
        color: "#e8edf4",
        marginTop: 14,
    },
    fisherRow: {
        display: "grid",
        gridTemplateColumns: "1fr 150px",
        gap: 14,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #1e2836",
    },
    fisherQCol: { display: "flex", gap: 10, alignItems: "flex-start" },
    fisherIdx: {
        fontFamily: "Consolas, monospace",
        fontSize: 12,
        color: "#d9b64a",
        fontWeight: 800,
        minWidth: 22,
    },
    fisherQ: { fontSize: 12.5, color: "#e8edf4" },
    fisherQAr: { fontSize: 11.5, color: "#626b78", marginTop: 2, direction: "rtl" as const },
    scoreGroup: { display: "flex", gap: 10, justifyContent: "flex-end" },
    scoreOption: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: 10.5,
        color: "#a8b0bc",
        gap: 2,
    },
    groupTitle: {
        fontSize: 11,
        color: "#f0d47c",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        margin: "12px 0 8px",
    },
    flagRow: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "8px 0",
        borderBottom: "1px solid #1e2836",
        cursor: "pointer",
    },
    bankRow: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "9px 0",
        borderBottom: "1px solid #1e2836",
        cursor: "pointer",
    },
    bankNote: { fontSize: 10.5, color: "#e8c464", marginTop: 3, fontStyle: "italic" },
    footnote: {
        fontSize: 11,
        color: "#626b78",
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid #1e2836",
    },
    footer: {
        color: "#626b78",
        fontSize: 10.5,
        textAlign: "center",
        padding: "30px 0 0",
    },
};

const globalCss = `
  input:focus { outline: none; }
  button:hover { filter: brightness(1.1); }
  label:hover { color: #f0f2f5; }
`;