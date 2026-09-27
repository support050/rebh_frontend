"use client";

import React from "react";
import Link from "next/link";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";

interface CorporateAction {
    id: string | number;
    symbol: string;
    company_name: string;
    issue_type?: string;
    eligibility_date?: string;
    announcement_date?: string;
    previous_capital?: number;
    new_capital?: number;
    classification?: string;
}

interface CalendarItem {
    sym: string;
    name: string;
    sec: string;
    period: string;
    periodEnd: string;
    expectedDate: string;
    deadlineDays: number;
    lastEps: string;
    status: string;
    statusColor: string;
    daysLeft: number;
}

interface EarningsCalendarTabProps {
    corporateActions: CorporateAction[];
    calendarSubTab: "cma_deadlines" | "corporate_actions";
    setCalendarSubTab: (v: "cma_deadlines" | "corporate_actions") => void;
    calendarItems: CalendarItem[];
}

export default function EarningsCalendarTab({
    corporateActions,
    calendarSubTab,
    setCalendarSubTab,
    calendarItems,
}: EarningsCalendarTabProps) {
    return (
        <div className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-base font-bold text-[#1A1A1A] mb-1">رزنامة السوق: التوزيعات وإجراءات الشركات والمهل النظامية</h2>
                        <p className="text-xs text-[#6B7280]">
                            بيانات إعلانات تداول المباشرة: التوزيعات النقدية، زيادة وتخفيض رأس المال، ومواعيد الاستحقاق، إلى جانب المهل النظامية (CMA 45/90 يوم).
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F7F8FA] p-1 border border-[#E5E7EB] rounded-[4px]">
                        <button
                            onClick={() => setCalendarSubTab("corporate_actions")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-[4px] transition ${calendarSubTab === "corporate_actions" ? "bg-[#8C3B32] text-white" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
                        >
                            إجراءات وتوزيعات الشركات ({corporateActions.length})
                        </button>
                        <button
                            onClick={() => setCalendarSubTab("cma_deadlines")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-[4px] transition ${calendarSubTab === "cma_deadlines" ? "bg-[#8C3B32] text-white" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
                        >
                            مهل إعلانات النتائج (CMA)
                        </button>
                    </div>
                </div>

                {/* Sub-tab 1: Real Corporate Actions from Tadawul */}
                {calendarSubTab === "corporate_actions" && (
                    <div className={`${SUBCARD} overflow-x-auto`}>
                        <table className="w-full text-xs text-right border-collapse">
                            <thead>
                                <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                                    <th className="p-3 font-semibold">الرمز والشركة</th>
                                    <th className="p-3 font-semibold">نوع الإجراء / التوزيع</th>
                                    <th className="p-3 font-semibold">تاريخ الاستحقاق (Eligibility)</th>
                                    <th className="p-3 font-semibold">تاريخ الإعلان والتوصية</th>
                                    <th className="p-3 font-semibold">رأس المال السابق</th>
                                    <th className="p-3 font-semibold">رأس المال الجديد</th>
                                    <th className="p-3 font-semibold">التصنيف المحاسبي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {corporateActions.map((act) => (
                                    <tr key={act.id} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                        <td className="p-3 font-bold text-[#1A1A1A]">
                                            <Link href={`/rebh/${act.symbol}`} className="text-[#8C3B32] hover:underline ml-1.5">{act.symbol}</Link>
                                            <span>{act.company_name}</span>
                                        </td>
                                        <td className="p-3 font-bold text-[#1A1A1A]">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[11px] ${act.issue_type?.includes("Bonus") || act.issue_type?.includes("منحة") ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]" : act.issue_type?.includes("Reduction") || act.issue_type?.includes("تخفيض") ? "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]" : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"}`}>
                                                {act.issue_type}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold text-[#8C3B32] font-mono tabular-nums">{act.eligibility_date || "—"}</td>
                                        <td className="p-3 text-[#6B7280] font-mono tabular-nums">{act.announcement_date || "—"}</td>
                                        <td className="p-3 text-[#6B7280] font-mono tabular-nums">{act.previous_capital ? `${(act.previous_capital / 1_000_000).toLocaleString()}M` : "—"}</td>
                                        <td className="p-3 text-[#1A1A1A] font-bold font-mono tabular-nums">{act.new_capital ? `${(act.new_capital / 1_000_000).toLocaleString()}M` : "—"}</td>
                                        <td className="p-3">
                                            <span className="text-[10px] text-[#6B7280] font-mono px-2 py-0.5 bg-white border border-[#E5E7EB] rounded">
                                                {act.classification}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {corporateActions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-[#6B7280]">جاري جلب سجل إجراءات الشركات من قاعدة البيانات...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sub-tab 2: Statutory CMA Deadlines */}
                {calendarSubTab === "cma_deadlines" && (
                    <div className={`${SUBCARD} overflow-x-auto`}>
                        <table className="w-full text-xs text-right border-collapse">
                            <thead>
                                <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
                                    <th className="p-3 font-semibold">الرمز والشركة</th>
                                    <th className="p-3 font-semibold">القطاع</th>
                                    <th className="p-3 font-semibold">الفترة المعلنة</th>
                                    <th className="p-3 font-semibold">نهاية الفترة الفعلية</th>
                                    <th className="p-3 font-semibold">الموعد الأقصى النظامي (نهاية + 45/90 يوم)</th>
                                    <th className="p-3 font-semibold">ربحية السهم السابقة EPS</th>
                                    <th className="p-3 font-semibold">الحالة والمهلة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calendarItems.map(item => (
                                    <tr key={item.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                        <td className="p-3 font-bold text-[#1A1A1A]">
                                            <Link href={`/rebh/${item.sym}`} className="text-[#8C3B32] hover:underline ml-1.5">{item.sym}</Link>
                                            <span>{item.name}</span>
                                        </td>
                                        <td className="p-3 text-[#6B7280]">{item.sec}</td>
                                        <td className="p-3 text-[#1A1A1A]">{item.period}</td>
                                        <td className="p-3 text-[#6B7280] tabular-nums">{item.periodEnd}</td>
                                        <td className="p-3 font-bold text-[#8C3B32] tabular-nums">{item.expectedDate}</td>
                                        <td className="p-3 text-[#1A1A1A] tabular-nums">{item.lastEps} ر.س</td>
                                        <td className="p-3">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.statusColor}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {calendarItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-[#6B7280]">لا توجد بيانات كافية لعرض الرزنامة حالياً.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}