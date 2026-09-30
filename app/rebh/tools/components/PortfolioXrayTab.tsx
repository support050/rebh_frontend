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

// Optional English fields the backend may provide (display only).
type CompanyWithEn = CompanyItem & { en?: string; sec_en?: string };

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
                        <h2 className="text-base font-bold text-[#1A1A1A] mb-1">Portfolio X-Ray</h2>
                        <p className="text-xs text-[#6B7280]">
                            Enter your portfolio holdings and their amounts in SAR to see the portfolio&apos;s harmonic P/E, stock and sector concentration (Stock &amp; Sector HHI), and to track loss-making or unpriced stocks.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={resetDefaultHoldings}
                        className="text-xs text-[#8C3B32] hover:underline font-semibold self-start sm:self-auto"
                    >
                        Restore sample portfolio
                    </button>
                </div>

                {/* API Error / Loading banner */}
                {universeError && (
                    <div className="p-3 mb-5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{universeError} — unable to fetch current stock ratios and multiples</span>
                        </div>
                        <button
                            type="button"
                            onClick={loadUniverse}
                            className="underline font-bold text-xs hover:text-[#991B1B]"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Add Holding Form */}
                <div className={`${SUBCARD} p-4 mb-6 space-y-2`}>
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Stock symbol (e.g. 1120)"
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
                            placeholder="Amount invested (SAR)"
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
                            Add to portfolio
                        </button>
                        <span className="text-[11px] text-[#6B7280]">Portfolio data is saved automatically and locally on your device</span>
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
                        <span className={KPI_LABEL}>Total Portfolio</span>
                        <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.totalAmount.toLocaleString()} SAR</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">{holdings.length} {holdings.length === 1 ? "company" : "companies"}</span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>Harmonic P/E Ratio</span>
                        <span className="text-lg font-black text-[#1A1A1A]">
                            {xrayMetrics.weightedPe ? `${xrayMetrics.weightedPe}x` : "—"}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5" title="Covers only companies with positive earnings">
                            Covers {xrayMetrics.coveredPeWeightPct}% of weight
                        </span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>P/B Ratio</span>
                        <span className="text-lg font-black text-[#1A1A1A]">{xrayMetrics.weightedPb ? `${xrayMetrics.weightedPb}x` : "—"}</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">Value-weighted</span>
                    </div>

                    <div className={`${SUBCARD} p-3`}>
                        <span className={KPI_LABEL}>Weighted ROE</span>
                        <span className="text-lg font-black text-[#16A34A]">{xrayMetrics.weightedRoe ? `${xrayMetrics.weightedRoe}%` : "—"}</span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">Value-weighted</span>
                    </div>

                    {/* Stock-level HHI */}
                    <div className={`${SUBCARD} p-3`} title="Single-stock concentration index: sum of squared stock weights">
                        <span className={KPI_LABEL}>Stock Concentration (Stock HHI)</span>
                        <span className={`text-lg font-black ${xrayMetrics.stockHhi > 2500 ? 'text-[#DC2626]' : xrayMetrics.stockHhi > 1500 ? 'text-[#B45309]' : 'text-[#16A34A]'}`}>
                            {xrayMetrics.stockHhi}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">
                            {xrayMetrics.stockHhi > 2500 ? 'High stock concentration ⚑' : xrayMetrics.stockHhi > 1500 ? 'Moderate concentration' : 'Well diversified ✓'}
                        </span>
                    </div>

                    {/* Sector-level HHI */}
                    <div className={`${SUBCARD} p-3`} title="Sector concentration index: sum of squared sector weights">
                        <span className={KPI_LABEL}>Sector Concentration (Sector HHI)</span>
                        <span className={`text-lg font-black ${xrayMetrics.sectorHhi > 2500 ? 'text-[#DC2626]' : xrayMetrics.sectorHhi > 1500 ? 'text-[#B45309]' : 'text-[#16A34A]'}`}>
                            {xrayMetrics.sectorHhi}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5">
                            {xrayMetrics.sectorHhi > 2500 ? 'Dominant sector ⚑' : 'Acceptable ✓'}
                        </span>
                    </div>
                </div>

                {/* Warning if Portfolio contains negative or missing PE stocks */}
                {(xrayMetrics.negativePeCount > 0 || xrayMetrics.missingPeCount > 0) && (
                    <div className="p-3 mb-6 bg-[#FFFBEB] border border-[#FDE68A] rounded text-xs text-[#92400E] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                            <span>
                                Portfolio alert: the portfolio contains {xrayMetrics.negativePeCount > 0 ? `${xrayMetrics.negativePeCount} loss-making ${xrayMetrics.negativePeCount === 1 ? "company" : "companies"} (negative P/E)` : ''}
                                {xrayMetrics.negativePeCount > 0 && xrayMetrics.missingPeCount > 0 ? ' and ' : ''}
                                {xrayMetrics.missingPeCount > 0 ? `${xrayMetrics.missingPeCount} ${xrayMetrics.missingPeCount === 1 ? "company" : "companies"} with no P/E available` : ''}.
                                They are automatically excluded from the harmonic-mean P/E denominator to avoid distorting the portfolio multiple.
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Holdings Table */}
                    <div className={`${SUBCARD} p-4 overflow-x-auto`}>
                        <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">Current portfolio holdings ({holdings.length})</h3>
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="text-[#6B7280] bg-[#F3F4F6]">
                                    <th className="p-2 font-semibold">Symbol</th>
                                    <th className="p-2 font-semibold">Amount</th>
                                    <th className="p-2 font-semibold">Weight</th>
                                    <th className="p-2 font-semibold">P/E</th>
                                    <th className="p-2 font-semibold">Sector</th>
                                    <th className="p-2 font-semibold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map(h => {
                                    const co = universe.find(c => c.sym === h.sym || c.sym === `${h.sym}.SR`) as CompanyWithEn | undefined;
                                    const weight = xrayMetrics.totalAmount > 0 ? ((h.amount / xrayMetrics.totalAmount) * 100).toFixed(1) : "0";
                                    const isHighSingleWeight = parseFloat(weight) >= 40.0;
                                    const isNegativePe = co?.pe != null && co.pe <= 0;
                                    const isMissingPe = !co || co.pe == null;

                                    return (
                                        <tr key={h.sym} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6]">
                                            <td className="p-2">
                                                <span className="font-bold text-[#1A1A1A]">{h.sym}</span>
                                                <span className="text-[#6B7280] text-[10px] ml-1.5">{co?.en || co?.n || "Not listed"}</span>
                                            </td>
                                            <td className="p-2 text-[#1A1A1A] tabular-nums">{h.amount.toLocaleString()} SAR</td>
                                            <td className="p-2 tabular-nums">
                                                <span className={`font-bold ${isHighSingleWeight ? 'text-[#DC2626]' : 'text-[#8C3B32]'}`}>
                                                    {weight}%
                                                </span>
                                                {isHighSingleWeight && (
                                                    <span className="text-[9px] text-[#DC2626] ml-1 font-bold" title="High concentration in a single stock (more than 40%)">
                                                        (concentrated ⚑)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 tabular-nums">
                                                {isNegativePe ? (
                                                    <span className="text-[10px] bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-1.5 py-0.5 rounded font-bold">
                                                        Negative {co?.pe}x
                                                    </span>
                                                ) : isMissingPe ? (
                                                    <span className="text-[10px] text-[#9CA3AF] font-mono">N/A</span>
                                                ) : (
                                                    <span className="text-[#1A1A1A] font-semibold">{co?.pe}x</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-[#6B7280] text-[11px]">{co?.sec_en || co?.sec || "Other"}</td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => removeHolding(h.sym)}
                                                    aria-label="Remove"
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
                                            The portfolio is currently empty. Add stocks and amounts to begin the analysis.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Sector Allocation */}
                    <div className={`${SUBCARD} p-4`}>
                        <h3 className="text-xs font-bold text-[#1A1A1A] mb-3">Sector Allocation</h3>
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
                                <p className="text-xs text-[#6B7280] py-4 text-center">No sector data to display.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Educational Note: Stock HHI vs Sector HHI */}
                <div className="mt-6 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[4px] text-xs text-[#4B5563] space-y-2">
                    <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <span>💡 The key difference between Stock Concentration (Stock HHI) and Sector Concentration (Sector HHI):</span>
                    </div>
                    <p className="leading-relaxed">
                        <strong>Herfindahl-Hirschman Index (HHI):</strong> measures concentration by squaring percentage weights. For example, if your portfolio is split <strong>90% in one stock</strong> and <strong>10% in another</strong>, both in the same sector (such as banks), the Sector HHI will show 10,000 points (complete sector concentration), but on its own it will not reveal how risky a 90% position in a single stock is compared with a 50/50 split.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                        <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#E5E7EB]">
                            <span className="font-bold text-[#1A1A1A] block mb-1">📊 Stock Concentration (Stock HHI = {xrayMetrics.stockHhi}):</span>
                            <span>
                                {xrayMetrics.stockHhi > 2500
                                    ? "The portfolio is exposed to high idiosyncratic risk because it relies on very few individual stocks."
                                    : xrayMetrics.stockHhi > 1500
                                        ? "Moderate stock concentration; weights are relatively spread out."
                                        : "Excellent single-stock diversification; risk is effectively distributed (below 1,500 points)."}
                            </span>
                        </div>
                        <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#E5E7EB]">
                            <span className="font-bold text-[#1A1A1A] block mb-1">🏢 Sector Concentration (Sector HHI = {xrayMetrics.sectorHhi}):</span>
                            <span>
                                {xrayMetrics.sectorHhi > 2500
                                    ? "The portfolio is highly sensitive to the swings and cycles of a single sector (Sector Risk)."
                                    : "Good sector diversification reduces the portfolio's exposure to a single-sector downturn."}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}