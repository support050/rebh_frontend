"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface PeerCompany {
  sym: string;
  n: string;
  // Optional English company name, if provided by the backend
  en?: string;
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
  // `sector` is used for the API query and must stay as the backend value.
  sector: string;
  // Optional English sector name for display only (e.g. data.sec_en)
  sectorEn?: string;
}

export default function SectorPeersTable({ currentSymbol, sector, sectorEn }: SectorPeersTableProps) {
  const [peers, setPeers] = useState<PeerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  // UX addition: the original table had no way to jump to a specific peer once the
  // sector list got long. Added a lightweight local filter — logic/data flow untouched.
  const [query, setQuery] = useState("");

  const sectorLabel = sectorEn || sector;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadPeers() {
      try {
        setLoading(true);
        // Server-side filtered endpoint: returns only same-sector peers sorted by market cap.
        // No longer downloads the whole market universe for client-side filtering.
        const url = `${API_BASE_URL}/api/rebh/peers?sector=${encodeURIComponent(sector)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const matched = [...data].sort((a: any, b: any) => (b.mc || 0) - (a.mc || 0));
            setPeers(matched);
          }
        }
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("Error fetching sector peers:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (sector && sector !== "—") {
      loadPeers();
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sector]);

  const filteredPeers = useMemo(() => {
    if (!query.trim()) return peers;
    const q = query.trim().toLowerCase();
    return peers.filter(
      p =>
        p.sym.toLowerCase().includes(q) ||
        p.n.toLowerCase().includes(q) ||
        (p.en || "").toLowerCase().includes(q)
    );
  }, [peers, query]);

  return (
    <div dir="ltr" className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            Sector Peer Comparison ({sectorLabel})
          </h3>
          <span className="text-[11px] text-[#6B7280] font-mono">
            {loading ? "Updating..." : `${filteredPeers.length} of ${peers.length} companies, sorted by market cap`}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or company name..."
            className="text-xs bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] pr-3 pl-8 py-1.5 w-[220px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/20 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#6B7280] font-mono">
          Loading sector peers ({sectorLabel})...
        </div>
      ) : peers.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#6B7280] font-mono">
          No other peer companies are currently listed in the ({sectorLabel}) sector.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#E5E7EB] bg-[#F3F4F6]">
                <th className="p-2.5 text-left font-semibold sticky left-0 bg-[#F3F4F6]">Ticker &amp; Company</th>
                <th className="p-2.5 text-right font-semibold">Market Cap</th>
                <th className="p-2.5 text-right font-semibold">Price</th>
                <th className="p-2.5 text-right font-semibold">P/E Ratio</th>
                <th className="p-2.5 text-right font-semibold">P/B Ratio</th>
                <th className="p-2.5 text-right font-semibold">ROE %</th>
                <th className="p-2.5 text-right font-semibold">Leverage D/E</th>
                <th className="p-2.5 text-right font-semibold">Earnings Growth YoY</th>
                <th className="p-2.5 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredPeers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-[#9CA3AF] font-mono text-xs">
                    No companies match your search
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
                    <td className={`p-2.5 flex items-center gap-2 sticky left-0 text-left ${isCurrent ? "bg-[#F3F4F6]" : "bg-white"}`}>
                      <span className="text-[#1A1A1A] font-mono font-semibold">{p.sym}</span>
                      <span className="text-[#6B7280] text-[11px] truncate max-w-[140px]">
                        {p.en || p.n}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#8C3B32] text-white rounded-full">
                          Current Stock
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right text-[#1A1A1A] font-mono tabular-nums">
                      {p.mc ? `${(p.mc / 1000).toFixed(1)}B` : "—"}
                    </td>
                    <td className="p-2.5 text-right text-[#1A1A1A] font-mono tabular-nums">{p.px ? p.px.toFixed(2) : "—"}</td>
                    <td className="p-2.5 text-right text-[#8C3B32] font-mono tabular-nums">{p.pe ? `${p.pe.toFixed(1)}x` : "—"}</td>
                    <td className="p-2.5 text-right text-[#1A1A1A] font-mono tabular-nums">{p.pb ? `${p.pb.toFixed(2)}x` : "—"}</td>
                    <td className="p-2.5 text-right text-[#16A34A] font-mono tabular-nums">
                      {p.roe != null ? `${p.roe.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-2.5 text-right text-[#1A1A1A] font-mono tabular-nums">{p.de != null ? `${p.de.toFixed(2)}x` : "—"}</td>
                    <td
                      className={`p-2.5 text-right font-mono font-semibold tabular-nums ${p.g_net != null && p.g_net >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}
                    >
                      {p.g_net != null ? `${p.g_net > 0 ? "+" : ""}${p.g_net.toFixed(1)}%` : "—"}
                    </td>
                    <td className="p-2.5 text-left">
                      {isCurrent ? (
                        <span className="text-[11px] text-[#9CA3AF] font-medium">You are here</span>
                      ) : (
                        <Link
                          href={`/rebh/company/${p.sym}`}
                          className="text-[#8C3B32] hover:underline inline-flex items-center gap-0.5 text-[11px] font-medium"
                        >
                          <span>View Company</span>
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