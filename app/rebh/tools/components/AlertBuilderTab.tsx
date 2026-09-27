"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { CompanyItem } from "../types";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const INPUT =
    "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";
const BTN_PRIMARY =
    "px-4 py-2 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition inline-flex items-center gap-1.5";
const BTN_GHOST =
    "px-3 py-1.5 border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] rounded-[4px] text-xs font-semibold transition inline-flex items-center gap-1.5";

const PAGE_SIZE = 25;

export interface Rule {
    metric: keyof CompanyItem;
    label: string;
    op: "<" | ">";
    val: number;
}

interface MetricOption {
    key: keyof CompanyItem;
    label: string;
}

// ── Presets ─────────────────────────────────────────────────────────────────
interface Preset {
    id: string;
    name: string;
    description: string;
    colorActive: string;
    colorBorder: string;
    rules: Rule[];
}

const PRESETS: Preset[] = [
    {
        id: "graham_net_net",
        name: "جراهام: Net-Net",
        description: "P/NCAV < 0.66 — السهم يُباع بأقل من ثلثي الأصول الصافية السائلة. منهج بنيامين جراهام الكلاسيكي للشركات المُدرجة بأقل من قيمتها التصفوية.",
        colorActive: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
        colorBorder: "border-[#BBF7D0]",
        rules: [
            { metric: "pncav", label: "P/NCAV (Graham)", op: "<", val: 0.66 },
        ],
    },
    {
        id: "deep_value",
        name: "قيمة عميقة (Deep Value)",
        description: "P/E < 12 و P/B < 1.5 — الشركات المنخفضة السعر نسبةً للأرباح والقيمة الدفترية معاً، كلاسيكيات البحث عن هامش الأمان.",
        colorActive: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
        colorBorder: "border-[#BFDBFE]",
        rules: [
            { metric: "pe", label: "مكرر الأرباح P/E", op: "<", val: 12 },
            { metric: "pb", label: "مكرر القيمة الدفترية P/B", op: "<", val: 1.5 },
        ],
    },
    {
        id: "quality_compounder",
        name: "جودة مركبة (Quality)",
        description: "ROE > 15% و F-Score ≥ 7 — الشركات ذات الربحية العالية على الملكية والجودة المالية القوية وفق نموذج بيوتروسكي.",
        colorActive: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]",
        colorBorder: "border-[#FED7AA]",
        rules: [
            { metric: "roe", label: "ROE %", op: ">", val: 15 },
            { metric: "f_score", label: "F-Score", op: ">", val: 6 },
        ],
    },
    {
        id: "earnings_growth",
        name: "نمو الأرباح القوي",
        description: "نمو الأرباح YoY > 20% و F-Score ≥ 6 — الشركات التي تُظهر نمواً مرتفعاً في الأرباح مع تحسن مالي ملموس.",
        colorActive: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
        colorBorder: "border-[#DDD6FE]",
        rules: [
            { metric: "g_net", label: "نمو الأرباح YoY %", op: ">", val: 20 },
            { metric: "f_score", label: "F-Score", op: ">", val: 5 },
        ],
    },
    {
        id: "garp",
        name: "GARP: نمو بسعر معقول",
        description: "P/E < 20 و ROE > 12% — الشركات التي تجمع بين سعر معقول وعائد جيد على الملكية (Growth at Reasonable Price).",
        colorActive: "bg-[#FDF4FF] text-[#9333EA] border-[#E9D5FF]",
        colorBorder: "border-[#E9D5FF]",
        rules: [
            { metric: "pe", label: "مكرر الأرباح P/E", op: "<", val: 20 },
            { metric: "roe", label: "ROE %", op: ">", val: 12 },
        ],
    },
];

interface AlertBuilderTabProps {
    rules: Rule[];
    setRules: (rules: Rule[]) => void;
    selectedMetric: keyof CompanyItem;
    setSelectedMetric: (v: keyof CompanyItem) => void;
    selectedOp: "<" | ">";
    setSelectedOp: (v: "<" | ">") => void;
    ruleVal: string;
    setRuleVal: (v: string) => void;
    metricOptions: MetricOption[];
    addRule: () => void;
    removeRule: (index: number) => void;
    alertHits: CompanyItem[];
}

export default function AlertBuilderTab({
    rules,
    setRules,
    selectedMetric,
    setSelectedMetric,
    selectedOp,
    setSelectedOp,
    ruleVal,
    setRuleVal,
    metricOptions,
    addRule,
    removeRule,
    alertHits,
}: AlertBuilderTabProps) {
    const [page, setPage] = useState(1);
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(alertHits.length / PAGE_SIZE));
    const pagedHits = alertHits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset page when results change
    React.useEffect(() => { setPage(1); }, [alertHits.length]);

    const applyPreset = (preset: Preset) => {
        if (activePreset === preset.id) {
            setRules([]);
            setActivePreset(null);
        } else {
            setRules(preset.rules);
            setActivePreset(preset.id);
        }
    };

    return (
        <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-base font-bold text-[#1A1A1A]">فلتر الأسهم المتقدم (Advanced Stock Screener)</h2>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded">
                                مباشر — بيانات السوق الآن
                            </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                            ابنِ شروطاً مركبة بنظام AND (يجب تحقق جميعها) لفرز الشركات من السوق المالي فوراً. اختر Preset جاهز أو ابنِ شروطك الخاصة.
                        </p>
                    </div>
                    {rules.length > 0 && (
                        <button
                            onClick={() => { setRules([]); setActivePreset(null); }}
                            className="text-xs text-[#6B7280] hover:text-[#DC2626] transition font-semibold flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            مسح جميع الشروط
                        </button>
                    )}
                </div>

                {/* Presets Row */}
                <div className="mb-6">
                    <p className="text-[10px] text-[#6B7280] uppercase tracking-wide font-semibold mb-2">استراتيجيات جاهزة (Presets):</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset)}
                                title={preset.description}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-bold border transition ${
                                    activePreset === preset.id
                                        ? `${preset.colorActive} ring-2 ring-offset-1 ring-current`
                                        : "bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"
                                }`}
                            >
                                <span>{preset.name}</span>
                                {activePreset === preset.id && <X className="w-3 h-3 opacity-60" />}
                            </button>
                        ))}
                    </div>
                    {activePreset && (
                        <p className="mt-2 text-[11px] text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-1.5 rounded leading-relaxed">
                            {PRESETS.find(p => p.id === activePreset)?.description}
                        </p>
                    )}
                </div>

                {/* Custom Rule Builder */}
                <div className={`flex flex-wrap gap-2.5 items-center ${SUBCARD} p-4 mb-4`}>
                    <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide shrink-0">أضف شرطاً مخصصاً:</span>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value as keyof CompanyItem)}
                        className={INPUT}
                    >
                        {metricOptions.map(o => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedOp}
                        onChange={(e) => setSelectedOp(e.target.value as "<" | ">")}
                        className={INPUT}
                    >
                        <option value="<">&lt; أقل من</option>
                        <option value=">">&gt; أكبر من</option>
                    </select>

                    <input
                        type="number"
                        placeholder="القيمة"
                        value={ruleVal}
                        onChange={(e) => setRuleVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
                        className={`${INPUT} w-28`}
                    />

                    <button onClick={addRule} className={BTN_PRIMARY}>
                        <Plus className="w-3.5 h-3.5" />
                        إضافة شرط
                    </button>
                </div>

                {/* Active Rules Chips */}
                {rules.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5 items-center">
                        <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide">الشروط الفعالة:</span>
                        {rules.map((r, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#8C3B32]/40 rounded-full text-xs text-[#1A1A1A]">
                                <span className="font-semibold text-[#8C3B32]">{r.label}</span>
                                <span className="text-[#6B7280]">{r.op === "<" ? "أقل من" : "أكبر من"}</span>
                                <span className="font-bold">{r.val}</span>
                                <button
                                    onClick={() => { removeRule(idx); setActivePreset(null); }}
                                    aria-label="حذف الشرط"
                                    className="text-[#6B7280] hover:text-[#DC2626] transition"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Results Table */}
                <div className={`${SUBCARD} overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-[#E5E7EB] flex justify-between items-center text-xs bg-[#F3F4F6]">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1A1A1A]">
                                {rules.length === 0
                                    ? "أضف شرطاً لبدء الفلترة"
                                    : `${alertHits.length} شركة تطابق الشروط`}
                            </span>
                            {alertHits.length > PAGE_SIZE && (
                                <span className="text-[#6B7280]">
                                    (عرض {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, alertHits.length)})
                                </span>
                            )}
                        </div>
                        <span className="text-[#16A34A] font-semibold">● مباشر</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right border-collapse">
                            <thead>
                                <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                                    <th className="p-3 font-semibold w-8">#</th>
                                    <th className="p-3 font-semibold">الرمز والشركة</th>
                                    <th className="p-3 font-semibold">القطاع</th>
                                    <th className="p-3 font-semibold">السعر</th>
                                    <th className="p-3 font-semibold">P/E</th>
                                    <th className="p-3 font-semibold">P/B</th>
                                    <th className="p-3 font-semibold">ROE</th>
                                    <th className="p-3 font-semibold">F-Score</th>
                                    <th className="p-3 font-semibold">نمو الأرباح</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedHits.map((c, idx) => (
                                    <tr key={c.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                        <td className="p-3 text-[#9CA3AF] tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="p-3 font-bold text-[#1A1A1A]">
                                            <Link href={`/rebh/${c.sym}`} className="text-[#8C3B32] hover:underline ml-1.5">{c.sym}</Link>
                                            <span className="text-[#6B7280] font-normal">{c.n}</span>
                                        </td>
                                        <td className="p-3 text-[#6B7280]">{c.sec}</td>
                                        <td className="p-3 text-[#1A1A1A] tabular-nums font-semibold">{c.px ? `${c.px.toFixed(2)} ر.س` : "—"}</td>
                                        <td className="p-3 tabular-nums">
                                            {c.pe != null ? (
                                                <span className={c.pe < 0 ? "text-[#DC2626]" : "text-[#1A1A1A]"}>{c.pe}x</span>
                                            ) : "—"}
                                        </td>
                                        <td className="p-3 tabular-nums text-[#1A1A1A]">{c.pb ? `${c.pb}x` : "—"}</td>
                                        <td className="p-3 tabular-nums">
                                            {c.roe != null ? (
                                                <span className={c.roe >= 15 ? "text-[#16A34A] font-bold" : "text-[#1A1A1A]"}>{c.roe}%</span>
                                            ) : "—"}
                                        </td>
                                        <td className="p-3 tabular-nums">
                                            {c.f_score != null ? (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    c.f_score >= 7 ? "bg-[#F0FDF4] text-[#16A34A]" :
                                                    c.f_score >= 5 ? "bg-[#FFFBEB] text-[#B45309]" :
                                                    "bg-[#FEF2F2] text-[#DC2626]"
                                                }`}>{c.f_score}/9</span>
                                            ) : "—"}
                                        </td>
                                        <td className="p-3 tabular-nums">
                                            {c.g_net != null ? (
                                                <span className={c.g_net > 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
                                                    {c.g_net > 0 ? "+" : ""}{c.g_net}%
                                                </span>
                                            ) : "—"}
                                        </td>
                                    </tr>
                                ))}
                                {rules.length > 0 && alertHits.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-[#6B7280]">
                                            <div className="text-2xl mb-2">🔍</div>
                                            لا توجد شركات تحقق جميع الشروط المحددة حالياً.
                                        </td>
                                    </tr>
                                )}
                                {rules.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-[#6B7280]">
                                            اختر Preset جاهز أو أضف شرطاً مخصصاً لبدء الفلترة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB] text-xs">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`${BTN_GHOST} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                                السابق
                            </button>
                            <span className="text-[#6B7280]">
                                صفحة <span className="font-bold text-[#1A1A1A]">{page}</span> من {totalPages}
                                <span className="mr-3 text-[#9CA3AF]">({alertHits.length} نتيجة إجمالاً)</span>
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`${BTN_GHOST} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                التالي
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
