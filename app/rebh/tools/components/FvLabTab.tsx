"use client";

import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";

const CARD = "bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const SUBCARD = "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]";
const INPUT =
    "bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition";
const BTN_PRIMARY =
    "px-4 py-2 bg-[#8C3B32] hover:bg-[#7a332b] text-white rounded-[4px] text-xs font-bold transition inline-flex items-center gap-1.5";

interface FvSymbolMeta {
    sym: string;
    name: string;
    px?: number;
    pe?: number;
    error?: string;
}

interface DcfValidation {
    isValid: boolean;
    reasons: string[];
    isGrowthHigh: boolean;
}

interface FvLabTabProps {
    baseEps: number;
    setBaseEps: (v: number) => void;
    discountRate: number;
    setDiscountRate: (v: number) => void;
    growthRate: number;
    setGrowthRate: (v: number) => void;
    terminalGrowth: number;
    setTerminalGrowth: (v: number) => void;
    fvSymbolInput: string;
    setFvSymbolInput: (v: string) => void;
    fvLoadingSymbol: boolean;
    fvSymbolMeta: FvSymbolMeta | null;
    fetchSymbolEps: (symbolToFetch?: string) => void;
    dcfValidation: DcfValidation;
    calculatedFv: number;
}

export default function FvLabTab({
    baseEps,
    setBaseEps,
    discountRate,
    setDiscountRate,
    growthRate,
    setGrowthRate,
    terminalGrowth,
    setTerminalGrowth,
    fvSymbolInput,
    setFvSymbolInput,
    fvLoadingSymbol,
    fvSymbolMeta,
    fetchSymbolEps,
    dcfValidation,
    calculatedFv,
}: FvLabTabProps) {
    return (
        <div dir="ltr" className="py-6 space-y-6">
            <div className={`${CARD} p-6`}>
                <div className="max-w-2xl mb-6">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-base font-bold text-[#1A1A1A]">Conventional Terminal DCF Lab</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            Conventional academic model — not the core Khurafshi methodology
                        </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                        Methodology note: the Khurafshi course relies on an expected-return valuation approach and the decomposition of growth multiples (Khurafshi Return Engine), and rejects absolute reliance on Terminal Value. This calculator is provided for academic comparison only.
                    </p>
                </div>

                {/* Symbol Quick-Fetch Bar */}
                <div className={`${SUBCARD} p-4 mb-6 flex flex-wrap items-center justify-between gap-3`}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1A1A1A]">Fetch a stock&apos;s EPS from the market:</span>
                        <input
                            type="text"
                            placeholder="Ticker (e.g. 2222)"
                            value={fvSymbolInput}
                            onChange={(e) => setFvSymbolInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    fetchSymbolEps();
                                }
                            }}
                            className={`${INPUT} w-40 font-bold text-center`}
                        />
                        <button
                            type="button"
                            onClick={() => fetchSymbolEps()}
                            disabled={fvLoadingSymbol || !fvSymbolInput.trim()}
                            className={`${BTN_PRIMARY} disabled:opacity-50`}
                        >
                            {fvLoadingSymbol ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Fetching...
                                </>
                            ) : (
                                "Fetch Actual EPS"
                            )}
                        </button>
                        <span className="text-[11px] text-[#6B7280]">or adjust the values manually below</span>
                    </div>

                    {fvSymbolMeta && (
                        <div className="flex items-center gap-2 text-xs">
                            {fvSymbolMeta.error ? (
                                <span className="text-[#DC2626] font-semibold flex items-center gap-1 bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {fvSymbolMeta.error}
                                </span>
                            ) : (
                                <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] px-3 py-1 rounded">
                                    <span className="font-bold text-[#8C3B32]">{fvSymbolMeta.sym}</span>
                                    <span className="text-[#1A1A1A] font-semibold">{fvSymbolMeta.name}</span>
                                    {fvSymbolMeta.px && (
                                        <span className="text-[#6B7280]">Price: <b className="text-[#1A1A1A]">{fvSymbolMeta.px} SAR</b></span>
                                    )}
                                    <span className="text-[#16A34A] font-bold">EPS TTM: {baseEps.toFixed(2)} SAR ✓</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className={`space-y-5 ${SUBCARD} p-5`}>
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-[#6B7280]">Base Earnings Per Share (EPS TTM):</span>
                                <span className="text-[#8C3B32] font-bold">{baseEps.toFixed(2)} SAR</span>
                            </div>
                            <input
                                type="range" min="0.5" max="25" step="0.25"
                                value={baseEps} onChange={(e) => setBaseEps(parseFloat(e.target.value))}
                                className="w-full accent-[#8C3B32]"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-[#6B7280]">Required Return (Discount Rate R):</span>
                                <span className="text-[#DC2626] font-bold">{discountRate.toFixed(1)}%</span>
                            </div>
                            <input
                                type="range" min="4" max="15" step="0.5"
                                value={discountRate} onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                                className="w-full accent-[#8C3B32]"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[#6B7280]">5-Year Growth Rate (Growth g):</span>
                                    {dcfValidation.isGrowthHigh && (
                                        <span className="text-[10px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-1.5 py-0.2 rounded font-semibold">
                                            g &gt; R temporary super-growth
                                        </span>
                                    )}
                                </div>
                                <span className="text-[#16A34A] font-bold">{growthRate.toFixed(1)}%</span>
                            </div>
                            <input
                                type="range" min="0" max="25" step="0.5"
                                value={growthRate} onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                                className="w-full accent-[#8C3B32]"
                            />
                            {dcfValidation.isGrowthHigh && (
                                <p className="text-[10px] text-[#B45309] mt-1 leading-normal">
                                    Analytical note: the first-stage growth rate ({growthRate}%) is above the required return ({discountRate}%). This is acceptable only over the short term (5 years) for hyper-growth companies, provided growth decelerates in the terminal stage to a level below R.
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-[#6B7280]">Perpetual Terminal Growth Rate (g_term):</span>
                                <span className={`${discountRate <= terminalGrowth ? 'text-[#DC2626]' : 'text-[#1A1A1A]'} font-bold`}>
                                    {terminalGrowth.toFixed(1)}%
                                </span>
                            </div>
                            <input
                                type="range" min="0.5" max="6.0" step="0.25"
                                value={terminalGrowth} onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                                className="w-full accent-[#8C3B32]"
                            />
                            <span className="text-[10px] text-[#6B7280] block mt-0.5">
                                Model constraint: this must be strictly lower than the required return ({discountRate}%).
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] p-6 text-center space-y-3">
                            <span className="text-xs uppercase tracking-wide text-[#6B7280] block">Calculated Fair Value per Share</span>
                            <div className="text-5xl font-black text-[#1A1A1A]">
                                {dcfValidation.isValid && calculatedFv > 0 ? (
                                    <>
                                        {calculatedFv.toFixed(2)}
                                        <span className="text-base font-normal text-[#6B7280] ml-2">SAR</span>
                                    </>
                                ) : (
                                    <span className="text-2xl text-[#DC2626]">Mathematically invalid</span>
                                )}
                            </div>
                            {dcfValidation.isValid ? (
                                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                                    Based on a required return of {discountRate}% and expected growth of {growthRate}% for five years, then {terminalGrowth}% in perpetuity.
                                </p>
                            ) : null}
                        </div>

                        {/* Explicit Explanation when DCF is Invalid */}
                        {!dcfValidation.isValid && (
                            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] p-4 text-xs text-[#991B1B] space-y-2">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                                    <span>Why fair value cannot be computed (Math / Financial Constraint):</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed pl-2">
                                    {dcfValidation.reasons.map((r, i) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>
                                <div className="pt-1.5 border-t border-[#FECACA] text-[10.5px] font-mono text-[#7F1D1D]">
                                    Gordon formula for terminal value: Terminal Value = [EPS_5 × (1 + g_term)] ÷ (R − g_term)
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}