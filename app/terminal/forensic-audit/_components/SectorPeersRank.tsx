"use client";

import { TrendingUp } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

export default function SectorPeersRank({ data }: Props) {
  const peersObj = data.peers as any;
  const roePeers: [string, string, number][] = peersObj?.peers?.roe || peersObj?.roe || [];

  // Clean company names generically without hardcoded symbol maps
  const cleanName = (fullName: string) => {
    if (!fullName) return "—";
    return fullName
      .replace(/Co\.|Ltd\.|Company|Corporation|for Investment|Holding/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const maxRoe = roePeers.length > 0 ? Math.max(...roePeers.map((p) => p[2])) : 0;

  if (roePeers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-sm font-bold flex items-center gap-2 text-[#1A1A1A]">
          <TrendingUp className="w-4 h-4 text-[#8C3B32]" />
          ترتيب ROE في قطاع {data.sec || "السوق"} — فعلي من قاعدة البيانات
        </h2>
      </div>

      <div className="p-5 space-y-3">
        {roePeers.map((peer, i) => {
          const isCurrent = peer[0] === data.sym;
          const displayName = cleanName(peer[1]);
          const roeVal = peer[2];
          const barWidth = Math.max(0, Math.min(100, (roeVal / (maxRoe || 1)) * 50));

          return (
            <div key={i} className="flex items-center gap-3 text-xs">
              {/* Value on the left */}
              <span className="w-12 text-left font-bold tabular-nums text-[#1A1A1A] text-[11px]" dir="ltr">
                {roeVal != null ? `${roeVal.toFixed(1)}%` : "—"}
              </span>

              {/* Progress bar */}
              <div className="flex-1 max-w-xl">
                <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCurrent ? "bg-[#8C3B32]" : "bg-[#D1D5DB]"}`}
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  />
                </div>
              </div>

              {/* Company Name on the right */}
              <span
                className={`w-44 text-right truncate text-[11.5px] ${isCurrent ? "font-black text-[#8C3B32]" : "text-[#6B7280]"
                  }`}
              >
                {isCurrent && "◀ "}
                {displayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Decision Context Callout Box matching HTML reference */}
      <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F3F4F6] text-xs text-[#6B7280] leading-relaxed">
        <b className="text-[#1A1A1A]">دار الأركان أدنى القائمة في ROE</b> (دوران أصول 0.10 — دورة مشاريع طويلة) لكنها من الأرخص دفترياً (P/B ‏0.98). التوتر بين الربحية والتقييم مع رهان التوسع الممول بالصكوك (+4.9 مليار في 2025) وتغطية فوائد 1.5× — هذه هي المعطيات الثلاثة التي يُبنى عليها القرار.
      </div>
    </div>
  );
}