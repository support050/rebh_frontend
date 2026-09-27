"use client";

import React from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import type { CompanyItem } from "../types";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const INPUT =
    "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";
const BTN_PRIMARY =
    "px-4 py-2 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition inline-flex items-center gap-1.5";
const KPI_LABEL = "text-[10px] text-[#6B7280] uppercase tracking-wide block mb-1";

interface Holding {
    sym: string;
    amount: number;
}

interface XrayMetrics {
    totalAmount: number;
    weightedPe: number | null;
    weightedPb: number | null;
    weightedRoe: number | null;
    sectorHhi: number;
    stockHhi: number;
    sectorMix: { name: string; pct: number }[];
    missingPeCount: number;
    negativePeCount: number;
    coveredPeWeightPct: number;
}

interface PortfolioXrayTabProps {
    universe: CompanyItem[];
    universeError: string | null;
    loadUniverse: () => void;
    holdings: Holding[];
    newSym: string;
    setNewSym: (v: string) => void;
    newAmount: string;
    setNewAmount: (v: string) => void;
    holdingError: string | null;
    setHoldingError: (v: string | null) => void;
    addHolding: () => void;
    removeHolding: (sym: string) => void;
    resetDefaultHoldings: () => void;
    xrayMetrics: XrayMetrics;
}

export default function PortfolioXrayTab({
    universe,
    universeError,
    loadUniverse,
    holdings,
    newSym,
    setNewSym,
    newAmount,
    setNewAmount,
    holdingError,
    setHoldingError,
    addHolding,
    removeHolding,
    resetDefaultHoldings,
    xrayMetrics,
}: PortfolioXrayTabProps) {
    return (
        <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div className="max-w-2xl">
                        <h2 className="text-base font-bold text-[#1A1A1A] mb-1">أشعة المحفظة الاستثمارية (Portfolio X-Ray)</h2>
                        <p className="text-xs text-[#6B7280]">
                            أدخل أسهم محفظتك ومقاديرها بالريال لمعرفة مكرر أرباح المحفظة التوافقي، تركز الأسهم والقطاعات (Stock &amp; Sector HHI)، ومتابعة الأسهم الخاسرة أو غير المسعرة.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={resetDefaultHoldings}
                        className="text-xs text-[#8C3B32] hover:underline font-semibold self-start sm:self-auto"
                    >
                        استعادة المحفظة النموذجية
                    </button>
                </div>

                {/* API Error / Loading banner */}
                {universeError && (
                    <div className="p-3 mb-5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{universeError} — تعذر جلب نسب ومكررات الأسهم الحالية</span>
                        </div>
                        <button
                            type="button"
                            onClick={loadUniverse}
                            className="underline font-bold text-xs hover:text-[#991B1B]"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {/* Add Holding Form */}
                <div className={`${SUBCARD} p-4 mb-6 space-y-2`}>
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="رمز السهم (مثال: 1120)"
                            value={newSym}
                            onChange={(e) => {
                                setNewSym(e.target.value.replace(/\D/g, "").slice(0, 4));
                                setHoldingError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addHolding();
                                }
                            }}
                            className={`${INPUT} w-36 font-bold text-center`}
                        />
                        <input
                            type="number"
                            placeholder="المبلغ المستثمر (ر.س)"
                            value={newAmount}
                            onChange={(e) => {
                                setNewAmount(e.target.value);
                                setHoldingError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addHolding();
                                }
                            }}
                            className={`${INPUT} w-44`}
                        />
                        <button onClick={addHolding} className={BTN_PRIMARY}>
                            <Plus className="w-3.5 h-3.5" />
                            إضافة للمحفظة
                        </button>
                        <span className="text-[11px] text-[#6B7280]">يتم حفظ بيانات المحفظة محلياً وتلقائياً على جهازك</span>
                    </div>

                    {holdingError && (
                        <p className="text-xs text-[#DC2626] font-semibold flex items-center gap-1 pt-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {holdingError}
                        </p>
                    )}
                </div>

                {/* Aggregate KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center mb-6">
                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>إجمالي المحفظة</span>
                        <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.totalAmount.toLocaleString()} ر.س</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">{holdings.length} شركات</span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>مكرر P/E التوافقي</span>
                        <span className="text-lg font-black text-[#1A1A1A]">
                            {xrayMetrics.weightedPe ? `${xrayMetrics.weightedPe}x` : "—"}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5" title="تغطية الشركات ذات الأرباح الموجبة فقط">
                            تغطية {xrayMetrics.coveredPeWeightPct}% من الوزن
                        </span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>مكرر الدفترية P/B</span>
                        <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.weightedPb ? `${xrayMetrics.weightedPb}x` : "—"}</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">مرجح بالقيمة</span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>العائد المرجح ROE</span>
                        <span className="text-lg font-black text-[#16A34A]">{xrayMetrics.weightedRoe ? `${xrayMetrics.weightedRoe}%` : "—"}</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">مرجح بالقيمة</span>
                    </div>

                    {/* Stock-level HHI */}
                    <div className={`${SUBCARD} p-3`} title="مؤشر تركز السهم الفردي: مجموع مربعات أوزان الأسهم">
                        <span className={KPI_LABEL}>تركز الأسهم (Stock HHI)</span>
                        <span className={`text-lg font-black ${xrayMetrics.stockHhi > 2500 ? 'text-[#DC2626]' : xrayMetrics.stockHhi > 1500 ? 'text-[#B45309]' : 'text-[#16A34A]'}`}>
                            {xrayMetrics.stockHhi}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">
                            {xrayMetrics.stockHhi > 2500 ? 'تركز سهمي مرتفع ⚑' : xrayMetrics.stockHhi > 1500 ? 'تركز متوسط' : 'تنوع متزن ✓'}
                        </span>
                    </div>

                    {/* Sector-level HHI */}
                    <div className={`${SUBCARD} p-3`} title="مؤشر تركز القطاع: مجموع مربعات أوزان القطاعات">
                        <span className={KPI_LABEL}>تركز القطاعات (Sector HHI)</span>
                        <span className={`text-lg font-black ${xrayMetrics.sectorHhi > 2500 ? 'text-[#DC2626]' : xrayMetrics.sectorHhi > 1500 ? 'text-[#B45309]' : 'text-[#16A34A]'}`}>
                            {xrayMetrics.sectorHhi}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">
                            {xrayMetrics.sectorHhi > 2500 ? 'قطاع مهيمن ⚑' : 'مقبول ✓'}
                        </span>
                    </div>
                </div>

                {/* Warning if Portfolio contains negative or missing PE stocks */}
                {(xrayMetrics.negativePeCount > 0 || xrayMetrics.missingPeCount > 0) && (
                    <div className="p-3 mb-6 bg-[#FFFBEB] border border-[#FDE68A] rounded text-xs text-[#92400E] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                            <span>
                                تنبيه المحفظة: يوجد {xrayMetrics.negativePeCount > 0 ? `${xrayMetrics.negativePeCount} شركات خاسرة (P/E سالب)` : ''}
                                {xrayMetrics.negativePeCount > 0 && xrayMetrics.missingPeCount > 0 ? ' و ' : ''}
                                {xrayMetrics.missingPeCount > 0 ? `${xrayMetrics.missingPeCount} شركات غير متوفر لها مكرر` : ''}.
                                تم استبعادها تلقائياً من مقام المتوسط التوافقي لمكرر الربحية لتفادي تشويه مضاعف المحفظة.
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Holdings Table */}
                    <div className={`${SUBCARD} p-4 overflow-x-auto`}>
                        <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">مكونات المحفظة الحالية ({holdings.length})</h3>
                        <table className="w-full text-xs text-right border-collapse">
                            <thead>
                                <tr className="text-[#6B7280] bg-[#F3F4F6]">
                                    <th className="p-2 font-semibold">الرمز</th>
                                    <th className="p-2 font-semibold">المبلغ</th>
                                    <th className="p-2 font-semibold">الوزن</th>
                                    <th className="p-2 font-semibold">P/E</th>
                                    <th className="p-2 font-semibold">القطاع</th>
                                    <th className="p-2 font-semibold text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map(h => {
                                    const co = universe.find(c => c.sym === h.sym || c.sym === `${h.sym}.SR`);
                                    const weight = xrayMetrics.totalAmount > 0 ? ((h.amount / xrayMetrics.totalAmount) * 100).toFixed(1) : "0";
                                    const isHighSingleWeight = parseFloat(weight) >= 40.0;
                                    const isNegativePe = co?.pe != null && co.pe <= 0;
                                    const isMissingPe = !co || co.pe == null;

                                    return (
                                        <tr key={h.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                            <td className="p-2">
                                                <span className="font-bold text-[#1A1A1A]">{h.sym}</span>
                                                <span className="text-[#6B7280] text-[10px] mr-1.5">{co?.n || "غير مسجل"}</span>
                                            </td>
                                            <td className="p-2 text-[#1A1A1A] tabular-nums">{h.amount.toLocaleString()} ر.س</td>
                                            <td className="p-2 tabular-nums">
                                                <span className={`font-bold ${isHighSingleWeight ? 'text-[#DC2626]' : 'text-[#8C3B32]'}`}>
                                                    {weight}%
                                                </span>
                                                {isHighSingleWeight && (
                                                    <span className="text-[9px] text-[#DC2626] mr-1 font-bold" title="تركز عالي في سهم واحد أكثر من 40%">
                                                        (تركز ⚑)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 tabular-nums">
                                                {isNegativePe ? (
                                                    <span className="text-[10px] bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-1.5 py-0.5 rounded font-bold">
                                                        سالب {co?.pe}x
                                                    </span>
                                                ) : isMissingPe ? (
                                                    <span className="text-[10px] text-[#9CA3AF] font-mono">غير متوفر</span>
                                                ) : (
                                                    <span className="text-[#1A1A1A] font-semibold">{co?.pe}x</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-[#6B7280] text-[11px]">{co?.sec || "أخرى"}</td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => removeHolding(h.sym)}
                                                    aria-label="حذف"
                                                    className="text-[#6B7280] hover:text-[#DC2626] transition p-1"
                                                >
                                                    <X className="w-3.5 h-3.5 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {holdings.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-[#6B7280]">
                                            المحفظة فارغة حالياً. أضف أسهماً ومبالغ لبدء التحليل.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Sector Allocation */}
                    <div className={`${SUBCARD} p-4`}>
                        <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">توزيع القطاعات (Sector Allocation)</h3>
                        <div className="space-y-3">
                            {xrayMetrics.sectorMix.map(sec => (
                                <div key={sec.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#1A1A1A] font-medium">{sec.name}</span>
                                        <span className="text-[#8C3B32] font-bold tabular-nums">{sec.pct}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#8C3B32]" style={{ width: `${sec.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                            {xrayMetrics.sectorMix.length === 0 && (
                                <p className="text-xs text-[#6B7280] py-4 text-center">لا توجد بيانات قطاعات لعرضها.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Educational Note: Stock HHI vs Sector HHI */}
                <div className="mt-6 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[4px] text-xs text-[#4B5563] space-y-2">
                    <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <span>💡 الفرق الجوهري بين تركز الأسهم (Stock HHI) وتركز القطاعات (Sector HHI):</span>
                    </div>
                    <p className="leading-relaxed">
                        <strong>مؤشر هيرفندال-هيرشمان (HHI):</strong> يقيس درجة التركز عبر تربيع الأوزان المئوية. إذا كانت محفظتك مثلاً مقسمة بنسبة <strong>90% في سهم واحد</strong> و <strong>10% في سهم آخر</strong> وكلاهما في نفس القطاع (مثل البنوك)، فإن مؤشر القطاع (Sector HHI) سيُظهر 10,000 نقطة (تركز قطاعي كامل)، لكنه لن يكشف وحده مدى خطورة تركيز 90% في سهم واحد بعينه مقارنة بـ 50/50.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                        <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#E5E7EB]">
                            <span className="font-bold text-[#1A1A1A] block mb-1">📊 تركز الأسهم (Stock HHI = {xrayMetrics.stockHhi}):</span>
                            <span>
                                {xrayMetrics.stockHhi > 2500
                                    ? "المحفظة معرضة لمخاطر غير نظامية عالية (Idiosyncratic Risk) لاعتمادها على عدد قليل جداً من الأسهم الفردية."
                                    : xrayMetrics.stockHhi > 1500
                                        ? "تركيز سهمي متوسط؛ الأوزان موزعة نسبياً."
                                        : "توزيع ممتاز للأسهم الفردية؛ المخاطر موزعة بفاعلية (أقل من 1500 نقطة)."}
                            </span>
                        </div>
                        <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#E5E7EB]">
                            <span className="font-bold text-[#1A1A1A] block mb-1">🏢 تركز القطاعات (Sector HHI = {xrayMetrics.sectorHhi}):</span>
                            <span>
                                {xrayMetrics.sectorHhi > 2500
                                    ? "المحفظة حساسة جداً لتقلبات ودورات قطاع بعينه (Sector Risk)."
                                    : "تنوع قطاعي جيد يقلل تأثر المحفظة بأزمة قطاع واحد."}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}