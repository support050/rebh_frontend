"use client";

import React from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

interface TableStatusRowProps {
    state: "loading" | "error" | "empty";
    colSpan: number;
    message?: string | null;
    onRetry?: () => void;
    activeFilters?: string[];
    onClearFilters?: () => void;
}

/**
 * Shared table status row rendering loading spinner, error card, or empty message.
 * Keeps exact same colSpan logic, and enhances empty state with active filter badges & clear button.
 */
export function TableStatusRow({
    state,
    colSpan,
    message,
    onRetry,
    activeFilters = [],
    onClearFilters,
}: TableStatusRowProps) {
    if (state === "loading") {
        return (
            <tr>
                <td colSpan={colSpan} className="px-4 py-16 text-center text-[#6B7280]">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#8C3B32]" />
                </td>
            </tr>
        );
    }

    if (state === "error") {
        return (
            <tr>
                <td colSpan={colSpan} className="px-4 py-10">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 text-center">
                        <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                        <div className="text-sm font-medium text-[#DC2626]">
                            Unable to load company data
                        </div>
                        {message && <div className="text-xs text-[#DC2626]/80">{message}</div>}
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="mt-1 rounded-[4px] border border-[#DC2626]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        );
    }

    // empty state
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-16 text-center text-[#6B7280]">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <div>No companies match these filters. Try clearing the search or changing the sector.</div>
                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#6B7280]">
                            <span>Active filters:</span>
                            {activeFilters.map((f, i) => (
                                <span
                                    key={i}
                                    className="rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#1A1A1A]"
                                >
                                    {f}
                                </span>
                            ))}
                        </div>
                    )}
                    {onClearFilters && activeFilters.length > 0 && (
                        <button
                            onClick={onClearFilters}
                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#8C3B32] bg-[#8C3B32]/10 px-3 py-1.5 text-xs font-medium text-[#8C3B32] transition-colors hover:bg-[#8C3B32]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/30"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear all filters
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}