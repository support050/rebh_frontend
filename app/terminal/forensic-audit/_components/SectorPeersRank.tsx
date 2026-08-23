"use client";

import { TrendingUp } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

export default function SectorPeersRank({ data }: Props) {
  const peersObj = data.peers as any;
  const roePeers: [string, string, number][] = peersObj?.peers?.roe || peersObj?.roe || [];
  
  // Clean company names to match the sleek design
  const cleanName = (sym: string, fullName: string) => {
    if (sym === "4322" || fullName.includes("Retal")) return "RETAL";
    if (sym === "4323" || fullName.includes("Sumou")) return "SUMOU";
    if (sym === "4326" || fullName.includes("Majed")) return "ALMAJDIAH";
    if (sym === "4020" || fullName.includes("Saudi Real Estate")) return "ALAKARIA";
    if (sym === "4100" || fullName.includes("Makkah")) return "MCDC";
    if (sym === "4250" || fullName.includes("Jabal Omar")) return "JABAL OMAR";
    if (sym === "4325" || fullName.includes("Umm Al Qura")) return "MASAR";
    if (sym === "4300" || fullName.includes("Alarkan")) return "DAR ALARKAN";
    if (sym === "4150" || fullName.includes("Arriyadh")) return "AL TAISEER / ARRIYADH";
    if (sym === "4321" || fullName.includes("Centres")) return "CENOMI CENTERS";
    if (sym === "4324" || fullName.includes("Banan")) return "BANAN";
    if (sym === "4090" || fullName.includes("Taiba")) return "TAIBA";
    return fullName.replace(/Co\.|Ltd\.|Real Estate|Development/gi, "").trim();
  };

  const maxRoe = roePeers.length > 0 ? Math.max(...roePeers.map((p) => p[2])) : 28.7;

  if (roePeers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-bold flex items-center gap-2 text-white">
          <TrendingUp className="w-4 h-4 text-[#3987e5]" />
          ترتيب ROE في القطاع العقاري — فعلي من قاعدة ربح
        </h2>
      </div>

      <div className="p-5 space-y-3">
        {roePeers.map((peer, i) => {
          const isCurrent = peer[0] === data.sym || peer[0] === "4300";
          const displayName = cleanName(peer[0], peer[1]);
          const roeVal = peer[2];
          const barWidth = Math.max(0, Math.min(100, (roeVal / (maxRoe || 1)) * 50));

          return (
            <div key={i} className="flex items-center gap-3 text-xs">
              {/* Value on the left */}
              <span className="w-12 text-left font-bold tabular-nums text-white text-[11px]" dir="ltr">
                {roeVal != null ? `${roeVal.toFixed(1)}%` : "—"}
              </span>

              {/* Progress bar */}
              <div className="flex-1 max-w-xl">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    isCurrent ? "bg-[#3987e5]" : "bg-[#c3c2b7]/30"
                  }`}
                  style={{ width: `${Math.max(barWidth, 2)}%` }}
                />
              </div>

              {/* Company Name on the right */}
              <span
                className={`w-44 text-right truncate text-[11.5px] ${
                  isCurrent ? "font-black text-[#3987e5]" : "text-[#c3c2b7]"
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
      <div className="px-5 py-3.5 border-t border-white/10 bg-[#141413] text-xs text-[#898781] leading-relaxed">
        <b>دار الأركان أدنى القائمة في ROE</b> (دوران أصول 0.10 — دورة مشاريع طويلة) لكنها من الأرخص دفترياً (P/B ‏0.98). التوتر بين الربحية والتقييم مع رهان التوسع الممول بالصكوك (+4.9 مليار في 2025) وتغطية فوائد 1.5× — هذه هي المعطيات الثلاثة التي يُبنى عليها القرار.
      </div>
    </div>
  );
}
