"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function RebhError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div dir="ltr" className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto text-[#DC2626]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#1A1A1A]">An error occurred on this page</h2>
          <p className="text-xs text-[#6B7280] font-mono break-words bg-[#F9FAFB] p-2.5 rounded border border-[#F3F4F6] text-left">
            {error?.message || "Unknown error"}
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#8C3B32] text-white rounded-[4px] text-xs font-semibold hover:bg-[#752f28] transition"
          >
            <RefreshCw size={12} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
