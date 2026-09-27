import React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { BENCHMARKS, ComputedTrade, formatNum, formatPct, formatSar } from "../utils";
import { Button } from "./JournalUI";

interface TradeTableProps {
    trades: ComputedTrade[];
    onCloseTrade: (trade: ComputedTrade) => void;
    onDeleteTrade: (trade: ComputedTrade) => void;
    onNewTradeClick: () => void;
}

export function TradeTable({
    trades,
    onCloseTrade,
    onDeleteTrade,
    onNewTradeClick,
}: TradeTableProps) {
    if (trades.length === 0) {
        return (
            <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="text-[13.5px] text-[#6B7280] mb-3">
                    لا توجد صفقات مسجّلة بعد في دفترك.
                </div>
                <Button variant="primary" onClick={onNewTradeClick}>
                    تسجيل أول صفقة
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-[12.5px] font-bold text-[#4B5563]">
                    سجل الصفقات المفتوحة والمغلقة
                </h3>
                <span className="text-[11px] font-mono text-[#9CA3AF]">
                    {trades.length} صفقة
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] text-right">
                    <caption className="sr-only">سجل صفقات التداول مع الأسعار والعائد وحالة الإغلاق</caption>
                    <thead>
                        <tr className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] text-[10.5px] font-semibold">
                            <th scope="col" className="py-2.5 px-3 text-right">الرمز</th>
                            <th scope="col" className="py-2.5 px-3 text-center">النوع</th>
                            <th scope="col" className="py-2.5 px-3 text-center">الحالة</th>
                            <th scope="col" className="py-2.5 px-3 text-right">الأسهم</th>
                            <th scope="col" className="py-2.5 px-3 text-right">سعر الدخول</th>
                            <th scope="col" className="py-2.5 px-3 text-right">سعر الخروج</th>
                            <th scope="col" className="py-2.5 px-3 text-right">العائد %</th>
                            <th scope="col" className="py-2.5 px-3 text-right">الربح/الخسارة</th>
                            <th scope="col" className="py-2.5 px-3 text-right min-w-[200px]">سبب الدخول / الاستراتيجية</th>
                            <th scope="col" className="py-2.5 px-3 text-center">التاريخ</th>
                            <th scope="col" className="py-2.5 px-3 text-center w-24">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                        {trades.map((t) => {
                            const isWin = t.pnl != null && t.pnl > 0;
                            const isLoss = t.pnl != null && t.pnl < 0;

                            return (
                                <tr key={t.id} className="hover:bg-[#F9FAFB] transition-colors">
                                    {/* Symbol */}
                                    <td className="py-2.5 px-3 font-bold font-mono text-[#8C3B32] text-[13px] dir-ltr text-right">
                                        <Link href={`/rebh/company/${encodeURIComponent(t.symbol)}`} className="hover:underline" title="فتح تحليل الشركة">
                                            {t.symbol}
                                        </Link>
                                        {t.id.startsWith("demo-") ? (
                                            <span
                                                className="mr-1.5 inline-block text-[10px] font-sans font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded px-1.5 py-0.5"
                                                title="صفقة تجريبية توضيحية لمنهجية الدورة"
                                            >
                                                تجريبي
                                            </span>
                                        ) : t.isLocalOnly ? (
                                            <span
                                                className="mr-1 inline-block text-[9.5px] font-mono text-[#B45309]"
                                                title="🔌 غير متزامن مع الخادم حتى الآن"
                                            >
                                                🔌
                                            </span>
                                        ) : null}
                                    </td>

                                    {/* Type */}
                                    <td className="py-2.5 px-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-[3px] text-[10.5px] font-bold ${t.type === "buy" ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
                                            {t.type === "buy" ? "شراء" : "بيع"}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3 text-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                                t.status === "active"
                                                    ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                                                    : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                                            }`}
                                        >
                                            {t.status === "active" ? "نشطة" : "مغلقة"}
                                        </span>
                                    </td>

                                    {/* Shares */}
                                    <td className="py-2.5 px-3 tabular-nums font-mono text-[#1A1A1A]">
                                        {formatNum(t.shares, 0)}
                                    </td>

                                    {/* Buy Price */}
                                    <td className="py-2.5 px-3 tabular-nums font-mono text-[#1A1A1A]">
                                        {formatNum(t.buyPrice, 2)}
                                    </td>

                                    {/* Sell Price */}
                                    <td className="py-2.5 px-3 tabular-nums font-mono">
                                        {t.sellPrice != null ? formatNum(t.sellPrice, 2) : (
                                            <span className="text-[#9CA3AF]" title="الصفقة نشطة — لم تُغلق بعد">—</span>
                                        )}
                                    </td>

                                    {/* Return % */}
                                    <td className="py-2.5 px-3 tabular-nums font-mono font-semibold">
                                        {t.ret != null ? (
                                            <span className={isWin ? "text-[#16A34A]" : isLoss ? "text-[#DC2626]" : "text-[#6B7280]"}>
                                                {formatPct(t.ret * 100, 1)}
                                            </span>
                                        ) : (
                                            <span className="text-[#9CA3AF]">—</span>
                                        )}
                                    </td>

                                    {/* PnL SAR */}
                                    <td className="py-2.5 px-3 tabular-nums font-mono font-semibold">
                                        {t.pnl != null ? (
                                            <span className={isWin ? "text-[#16A34A]" : isLoss ? "text-[#DC2626]" : "text-[#6B7280]"}>
                                                {formatSar(t.pnl, 0)}
                                                {t.isOversizedLoss && (
                                                    <span
                                                        className="mr-1 text-[10px] text-[#DC2626] font-bold"
                                                        title={`⚑ خسارة تجاوزت ${BENCHMARKS.MAX_LOSS_PCT * 100}% من رأس المال`}
                                                    >
                                                        ⚑&gt;{BENCHMARKS.MAX_LOSS_PCT * 100}%
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-[#9CA3AF]">—</span>
                                        )}
                                    </td>

                                    {/* Reason */}
                                    <td className="py-2.5 px-3 text-[#4B5563] text-[11.5px] max-w-xs break-words leading-relaxed">
                                        {t.reason}
                                    </td>

                                    {/* Date */}
                                    <td className="py-2.5 px-3 text-center text-[#9CA3AF] font-mono text-[10.5px]">
                                        {t.createdAt}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-2.5 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {t.status === "active" && (
                                                <Button
                                                    variant="smallGhost"
                                                    onClick={() => onCloseTrade(t)}
                                                    title="إغلاق الصفقة وتحديد سعر البيع"
                                                >
                                                    إغلاق
                                                </Button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteTrade(t)}
                                                title="حذف الصفقة"
                                                aria-label={`حذف صفقة ${t.symbol}`}
                                                className="p-1 rounded text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
