"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface PeerCompany {
  sym: string;
  n: string;
  sec: string;
  px: number;
  mc: number;
  pe?: number;
  pb?: number;
  roe?: number;
  nm?: number;
  de?: number;
  coverage?: number;
  fcf_yield?: number;
  g_net?: number;
  grades?: Record<string, { g: string }>;
}

interface SectorPeersTableProps {
  currentSymbol: string;
  sector: string;
}

export default function SectorPeersTable({ currentSymbol, sector }: SectorPeersTableProps) {
  const [peers, setPeers] = useState<PeerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  // UX addition: the original table had no way to jump to a specific peer once the
  // sector list got long. Added a lightweight local filter — logic/data flow untouched.
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadPeers() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/rebh/universe`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Clean sector prefix for robust matching across sub-industry or main sector
            const cleanTarget = sector.split("|")[0].trim().toLowerCase();
            const matched = data
              .filter((c: any) => {
                if (!c.sec) return false;
                const secClean = c.sec.split("|")[0].trim().toLowerCase();
                return c.sec === sector || secClean === cleanTarget;
              })
              .sort((a: any, b: any) => (b.mc || 0) - (a.mc || 0));
            setPeers(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching sector peers:", err);
      } finally {
        setLoading(false);
      }
    }
    if (sector && sector !== "—") {
      loadPeers();
    } else {
      setLoading(false);
    }
  }, [sector]);

  const filteredPeers = useMemo(() => {
    if (!query.trim()) return peers;
    const q = query.trim().toLowerCase();
    return peers.filter(
      p => p.sym.toLowerCase().includes(q) || p.n.toLowerCase().includes(q)
    );
  }, [peers, query]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            مقارنة نظراء القطاع ({sector})
          </h3>
          <span className="text-[11px] text-[#6B7280] font-mono">
            {loading ? "جاري التحديث..." : `${filteredPeers.length} من ${peers.length} شركة، مرتبة حسب القيمة السوقية`}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن رمز أو اسم شركة..."
            className="text-xs bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] pl-3 pr-8 py-1.5 w-[220px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/20 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#6B7280] font-mono">
          جاري تحميل نظراء القطاع ({sector})...
        </div>
      ) : peers.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#6B7280] font-mono">
          لا توجد شركات نظيرة أخرى مسجلة حالياً في قطاع ({sector}).
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#E5E7EB] bg-[#F3F4F6]">
                <th className="p-2.5 font-semibold sticky right-0 bg-[#F3F4F6]">الرمز والشركة</th>
                <th className="p-2.5 font-semibold">القيمة السوقية</th>
                <th className="p-2.5 font-semibold">السعر</th>
                <th className="p-2.5 font-semibold">مكرر P/E</th>
                <th className="p-2.5 font-semibold">مكرر P/B</th>
                <th className="p-2.5 font-semibold">العائد ROE%</th>
                <th className="p-2.5 font-semibold">الرافعة D/E</th>
                <th className="p-2.5 font-semibold">نمو الأرباح YoY</th>
                <th className="p-2.5 font-semibold">الانتقال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredPeers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-[#9CA3AF] font-mono text-xs">
                    لا توجد شركات مطابقة لبحثك
                  </td>
                </tr>
              )}
              {filteredPeers.map((p) => {
                const isCurrent = p.sym === currentSymbol;
                return (
                  <tr
                    key={p.sym}
                    className={`transition-colors ${isCurrent ? "bg-[#F3F4F6]" : "hover:bg-[#F3F4F6]/60"}`}
                  >
                    <td className={`p-2.5 flex items-center gap-2 sticky right-0 ${isCurrent ? "bg-[#F3F4F6]" : "bg-white"}`}>
                      <span className="text-[#1A1A1A] font-mono font-semibold">{p.sym}</span>
                      <span className="text-[#6B7280] text-[11px] truncate max-w-[140px]">
                        {p.n}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#8C3B32] text-white rounded-full">
                          السهم الحالي
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-[#1A1A1A] font-mono tabular-nums">
                      {p.mc ? `${(p.mc / 1000).toFixed(1)}B` : "—"}
                    </td>
                    <td className="p-2.5 text-[#1A1A1A] font-mono tabular-nums">{p.px ? p.px.toFixed(2) : "—"}</td>
                    <td className="p-2.5 text-[#8C3B32] font-mono tabular-nums">{p.pe ? `${p.pe.toFixed(1)}x` : "—"}</td>
                    <td className="p-2.5 text-[#1A1A1A] font-mono tabular-nums">{p.pb ? `${p.pb.toFixed(2)}x` : "—"}</td>
                    <td className="p-2.5 text-[#16A34A] font-mono tabular-nums">
                      {p.roe != null ? `${p.roe.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-2.5 text-[#1A1A1A] font-mono tabular-nums">{p.de != null ? `${p.de.toFixed(2)}x` : "—"}</td>
                    <td
                      className={`p-2.5 font-mono font-semibold tabular-nums ${p.g_net != null && p.g_net >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}
                    >
                      {p.g_net != null ? `${p.g_net > 0 ? "+" : ""}${p.g_net.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-2.5">
                      {isCurrent ? (
                        <span className="text-[11px] text-[#9CA3AF] font-medium">أنت هنا</span>
                      ) : (
                        <Link
                          href={`/rebh/company/${p.sym}`}
                          className="text-[#8C3B32] hover:underline inline-flex items-center gap-0.5 text-[11px] font-medium"
                        >
                          <span>عرض الشركة</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}