"use client";

import React, { useState, useMemo } from "react";
import { TradeType, getRiyadhDateIso } from "@/lib/api/journal";
import { Button, Field } from "./JournalUI";

interface TradeFormProps {
    onSubmit: (trade: {
        symbol: string;
        type: TradeType;
        shares: number;
        buyPrice: number;
        sellPrice: number | null;
        reason: string;
        createdAt?: string;
    }) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function TradeForm({ onSubmit, onCancel, isSubmitting = false }: TradeFormProps) {
    const [symbol, setSymbol] = useState("");
    const [type, setType] = useState<TradeType>("buy");
    const [shares, setShares] = useState("");
    const [buyPrice, setBuyPrice] = useState("");
    const [sellPrice, setSellPrice] = useState("");
    const [reason, setReason] = useState("");
    const [todayIso] = useState(() => getRiyadhDateIso());
    const [tradeDate, setTradeDate] = useState(() => getRiyadhDateIso());

    const isWeekend = useMemo(() => {
        if (!tradeDate) return false;
        const d = new Date(tradeDate + "T12:00:00Z");
        const day = d.getUTCDay(); // 5 = Friday, 6 = Saturday
        return day === 5 || day === 6;
    }, [tradeDate]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate(): boolean {
        const errs: Record<string, string> = {};
        const cleanSym = symbol.trim().toUpperCase();
        if (!cleanSym) {
            errs.symbol = "رمز السهم مطلوب";
        } else if (!/^[A-Z0-9.\-_]{1,10}$/.test(cleanSym)) {
            errs.symbol = "رمز السهم غير صالح (أرقام أو حروف إنجليزية فقط)";
        }

        const sh = Number(shares);
        if (!shares || isNaN(sh) || sh <= 0) {
            errs.shares = "أدخل عدد أسهم صحيح أكبر من 0";
        } else if (!Number.isInteger(sh)) {
            errs.shares = "عدد الأسهم يجب أن يكون رقماً صحيحاً (بدون كسور)";
        }

        const bp = Number(buyPrice);
        if (!buyPrice || isNaN(bp) || bp <= 0) {
            errs.buyPrice = "أدخل سعر شراء صحيح أكبر من 0";
        }

        if (sellPrice.trim() !== "") {
            const sp = Number(sellPrice);
            if (isNaN(sp) || sp <= 0) {
                errs.sellPrice = "سعر البيع يجب أن يكون أكبر من 0";
            }
        } else if (type === "sell") {
            errs.sellPrice = "صفقة البيع تتطلب تحديد سعر الخروج الفعلي";
        }

        if (!reason.trim()) {
            errs.reason = "سبب الصفقة إلزامي بمنهجية الدورة للالتزام";
        }

        if (tradeDate && todayIso && tradeDate > todayIso) {
            errs.tradeDate = "تاريخ الصفقة لا يمكن أن يكون تاريخاً مستقبلياً";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate() || isSubmitting) return;

        const sp = sellPrice.trim() === "" ? null : Number(sellPrice);
        await onSubmit({
            symbol: symbol.trim().toUpperCase(),
            type,
            shares: Math.floor(Number(shares)),
            buyPrice: Number(buyPrice),
            sellPrice: sp,
            reason: reason.trim(),
            createdAt: tradeDate || getRiyadhDateIso(),
        });
    }

    const clearErr = (f: string) => {
        if (errors[f]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[f];
                return next;
            });
        }
    };

    const inputClasses = (err?: string) =>
        `bg-[#F7F8FA] border rounded-[4px] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none transition-all placeholder:text-[#9CA3AF] ${
            err
                ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                : "border-[#E5E7EB] focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10"
        }`;

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white border border-[#E5E7EB] border-r-4 border-r-[#8C3B32] rounded-[4px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
            <h4 className="text-[13px] font-bold text-[#1A1A1A] mb-3">تسجيل صفقة جديدة</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mb-3.5">
                <Field label="رمز السهم (Symbol)" error={errors.symbol} required>
                    <input
                        value={symbol}
                        onChange={(e) => {
                            setSymbol(e.target.value);
                            clearErr("symbol");
                        }}
                        placeholder="مثال: 1120 أو 2222"
                        className={inputClasses(errors.symbol)}
                        autoFocus
                    />
                </Field>

                <Field label="النوع (شراء/بيع)">
                    <select
                        value={type}
                        onChange={(e) => {
                            const newType = e.target.value as TradeType;
                            setType(newType);
                            if (newType === "buy" && sellPrice.trim() === "") {
                                clearErr("sellPrice");
                            }
                        }}
                        className={inputClasses()}
                    >
                        <option value="buy">شراء (مركز طويل)</option>
                        <option value="sell">بيع (تصفية مركز)</option>
                    </select>
                </Field>

                <Field label="عدد الأسهم" error={errors.shares} required>
                    <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={shares}
                        onChange={(e) => {
                            setShares(e.target.value);
                            clearErr("shares");
                        }}
                        placeholder="مثال: 200"
                        className={inputClasses(errors.shares)}
                        dir="ltr"
                    />
                </Field>

                <Field label="سعر الدخول (SAR)" error={errors.buyPrice} required>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        value={buyPrice}
                        onChange={(e) => {
                            setBuyPrice(e.target.value);
                            clearErr("buyPrice");
                        }}
                        placeholder="مثال: 58.00"
                        className={inputClasses(errors.buyPrice)}
                        dir="ltr"
                    />
                </Field>

                <Field label="سعر الخروج الفعلي (اتركه فارغاً إن كان نشطاً)" error={errors.sellPrice}>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        value={sellPrice}
                        onChange={(e) => {
                            setSellPrice(e.target.value);
                            clearErr("sellPrice");
                        }}
                        placeholder="فارغ = مركز نشط"
                        className={inputClasses(errors.sellPrice)}
                        dir="ltr"
                    />
                </Field>

                <Field label="تاريخ الصفقة" error={errors.tradeDate}>
                    <input
                        type="date"
                        max={todayIso}
                        value={tradeDate}
                        onChange={(e) => {
                            setTradeDate(e.target.value);
                            clearErr("tradeDate");
                        }}
                        className={inputClasses(errors.tradeDate)}
                        dir="ltr"
                    />
                    {isWeekend && (
                        <span className="text-[10px] text-[#B45309] font-medium mt-0.5">
                            تنبيه: هذا التاريخ يوافق عطلة نهاية أسبوع (السوق مغلق).
                        </span>
                    )}
                </Field>
            </div>

            <Field label="سبب الدخول / الاستراتيجية — إلزامي بمنهجية الدورة" error={errors.reason} required>
                <textarea
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        clearErr("reason");
                    }}
                    placeholder="مثال: دخول عند المنطقة الفضية + تسارع أرباح ربعي مستدام..."
                    className={`${inputClasses(errors.reason)} min-h-[64px] resize-y`}
                />
            </Field>

            <div className="flex items-center gap-2.5 mt-4">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "جاري الحفظ…" : "حفظ الصفقة"}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    إلغاء
                </Button>
            </div>
        </form>
    );
}

interface CloseTradeDialogProps {
    symbol: string;
    buyPrice: number;
    shares: number;
    onClose: (exitPrice: number) => Promise<void>;
    onCancel: () => void;
}

export function CloseTradeDialog({
    symbol,
    buyPrice,
    shares,
    onClose,
    onCancel,
}: CloseTradeDialogProps) {
    const [exitPrice, setExitPrice] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleConfirm(e: React.FormEvent) {
        e.preventDefault();
        const ep = Number(exitPrice);
        if (!exitPrice || isNaN(ep) || ep <= 0) {
            setError("يرجى إدخال سعر خروج صحيح أكبر من 0");
            return;
        }
        setSubmitting(true);
        try {
            await onClose(ep);
        } finally {
            setSubmitting(false);
        }
    }

    const estPnl = exitPrice ? (Number(exitPrice) - buyPrice) * shares : null;
    const estRet = exitPrice ? ((Number(exitPrice) - buyPrice) / buyPrice) * 100 : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-[6px] border border-[#E5E7EB] p-5 max-w-sm w-full shadow-xl" dir="rtl">
                <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-1">
                    إغلاق صفقة {symbol}
                </h4>
                <p className="text-[12px] text-[#6B7280] mb-3">
                    سعر الدخول: <span className="font-mono text-[#1A1A1A] font-bold">{buyPrice} SAR</span> ({shares} سهم)
                </p>

                <form onSubmit={handleConfirm} className="space-y-3">
                    <Field label="سعر البيع / الإغلاق الفعلي (SAR)" error={error || undefined} required>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            autoFocus
                            value={exitPrice}
                            onChange={(e) => {
                                setExitPrice(e.target.value);
                                setError(null);
                            }}
                            placeholder="مثال: 64.20"
                            className="bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#8C3B32] rounded-[4px] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none"
                            dir="ltr"
                        />
                    </Field>

                    {estPnl != null && (
                        <div className={`p-2.5 rounded-[4px] text-[11.5px] font-medium flex items-center justify-between ${estPnl >= 0 ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]" : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"}`}>
                            <span>النتيجة المتوقعة:</span>
                            <span className="font-mono font-bold">
                                {estPnl >= 0 ? "+" : ""}{estPnl.toFixed(1)} SAR ({estRet != null ? (estRet >= 0 ? "+" : "") + estRet.toFixed(1) + "%" : ""})
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                            إلغاء
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? "جاري الإغلاق…" : "تأكيد الإغلاق"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export function ConfirmDialog({
    title,
    message,
    confirmText = "تأكيد",
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-[6px] border border-[#E5E7EB] p-5 max-w-sm w-full shadow-xl" dir="rtl">
                <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{title}</h4>
                <p className="text-[12.5px] text-[#4B5563] leading-relaxed mb-4">{message}</p>
                <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        variant={danger ? "ghostDanger" : "primary"}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
