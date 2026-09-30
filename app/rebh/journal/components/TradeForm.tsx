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
            errs.symbol = "Ticker symbol is required";
        } else if (!/^[A-Z0-9.\-_]{1,10}$/.test(cleanSym)) {
            errs.symbol = "Invalid ticker symbol (English letters or digits only)";
        }

        const sh = Number(shares);
        if (!shares || isNaN(sh) || sh <= 0) {
            errs.shares = "Enter a valid share count greater than 0";
        } else if (!Number.isInteger(sh)) {
            errs.shares = "Share count must be a whole number (no fractions)";
        }

        const bp = Number(buyPrice);
        if (!buyPrice || isNaN(bp) || bp <= 0) {
            errs.buyPrice = "Enter a valid entry price greater than 0";
        }

        if (sellPrice.trim() !== "") {
            const sp = Number(sellPrice);
            if (isNaN(sp) || sp <= 0) {
                errs.sellPrice = "Exit price must be greater than 0";
            }
        } else if (type === "sell") {
            errs.sellPrice = "A sell trade requires the actual exit price";
        }

        if (!reason.trim()) {
            errs.reason = "Trade rationale is mandatory for methodology compliance";
        }

        if (tradeDate && todayIso && tradeDate > todayIso) {
            errs.tradeDate = "Trade date cannot be in the future";
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
        `bg-[#F7F8FA] border rounded-[4px] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none transition-all placeholder:text-[#9CA3AF] ${err
            ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
            : "border-[#E5E7EB] focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10"
        }`;

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            dir="ltr"
            className="bg-white border border-[#E5E7EB] border-l-4 border-l-[#8C3B32] rounded-[4px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
            <h4 className="text-[13px] font-bold text-[#1A1A1A] mb-3">Log New Trade</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mb-3.5">
                <Field label="Ticker Symbol" error={errors.symbol} required>
                    <input
                        value={symbol}
                        onChange={(e) => {
                            setSymbol(e.target.value);
                            clearErr("symbol");
                        }}
                        placeholder="e.g. 1120 or 2222"
                        className={inputClasses(errors.symbol)}
                        autoFocus
                    />
                </Field>

                <Field label="Side (Buy/Sell)">
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
                        <option value="buy">Buy (Long Position)</option>
                        <option value="sell">Sell (Close Position)</option>
                    </select>
                </Field>

                <Field label="Shares" error={errors.shares} required>
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
                        placeholder="e.g. 200"
                        className={inputClasses(errors.shares)}
                        dir="ltr"
                    />
                </Field>

                <Field label="Entry Price (SAR)" error={errors.buyPrice} required>
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
                        placeholder="e.g. 58.00"
                        className={inputClasses(errors.buyPrice)}
                        dir="ltr"
                    />
                </Field>

                <Field label="Actual Exit Price (leave blank if open)" error={errors.sellPrice}>
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
                        placeholder="Blank = open position"
                        className={inputClasses(errors.sellPrice)}
                        dir="ltr"
                    />
                </Field>

                <Field label="Trade Date" error={errors.tradeDate}>
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
                            Note: this date falls on a weekend (market closed).
                        </span>
                    )}
                </Field>
            </div>

            <Field label="Entry Rationale / Strategy — mandatory per methodology" error={errors.reason} required>
                <textarea
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        clearErr("reason");
                    }}
                    placeholder="e.g. Entry at the silver zone + sustained quarterly earnings acceleration..."
                    className={`${inputClasses(errors.reason)} min-h-[64px] resize-y`}
                />
            </Field>

            <div className="flex items-center gap-2.5 mt-4">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save Trade"}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
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
            setError("Please enter a valid exit price greater than 0");
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
            <div className="bg-white rounded-[6px] border border-[#E5E7EB] p-5 max-w-sm w-full shadow-xl" dir="ltr">
                <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-1">
                    Close {symbol} Trade
                </h4>
                <p className="text-[12px] text-[#6B7280] mb-3">
                    Entry price: <span className="font-mono text-[#1A1A1A] font-bold">{buyPrice} SAR</span> ({shares} shares)
                </p>

                <form onSubmit={handleConfirm} className="space-y-3">
                    <Field label="Actual Exit / Closing Price (SAR)" error={error || undefined} required>
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
                            placeholder="e.g. 64.20"
                            className="bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#8C3B32] rounded-[4px] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none"
                            dir="ltr"
                        />
                    </Field>

                    {estPnl != null && (
                        <div className={`p-2.5 rounded-[4px] text-[11.5px] font-medium flex items-center justify-between ${estPnl >= 0 ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]" : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"}`}>
                            <span>Projected P&amp;L:</span>
                            <span className="font-mono font-bold">
                                {estPnl >= 0 ? "+" : ""}{estPnl.toFixed(1)} SAR ({estRet != null ? (estRet >= 0 ? "+" : "") + estRet.toFixed(1) + "%" : ""})
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? "Closing…" : "Confirm Close"}
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
    confirmText = "Confirm",
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-[6px] border border-[#E5E7EB] p-5 max-w-sm w-full shadow-xl" dir="ltr">
                <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{title}</h4>
                <p className="text-[12.5px] text-[#4B5563] leading-relaxed mb-4">{message}</p>
                <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
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