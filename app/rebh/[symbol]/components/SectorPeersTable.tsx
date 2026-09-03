"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

  useEffect(() => {
    async function loadPeers() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/rebh/universe`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Filter peers by same sector and sort by market cap desc
            const matched = data
              .filter((c: any) => c.sec === sector)
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
    if (sector) {
      loadPeers();
    }
  }, [sector]);

  if (loading) {
    return (
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 text-center text-xs text-[#657081] font-mono">
        جاري تحميل نظراء القطاع ({sector})...
      </div>
    );
  }

  if (peers.length <= 1) {
    return null;
  }

  return (
    <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
          مقارنة نظراء القطاع — PEERS ({sector})
        </h3>
        <span className="text-[10px] text-[#657081] font-mono">
          {peers.length} شركات في القطاع مرتبة حسب القيمة السوقية
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-right">
          <thead>
            <tr className="text-[#657081] border-b border-[#1e2836] bg-[#0e1218]">
              <th className="p-2.5">الرمز والشركة</th>
              <th className="p-2.5">القيمة السوقية</th>
              <th className="p-2.5">السعر</th>
              <th className="p-2.5">مكرر P/E</th>
              <th className="p-2.5">مكرر P/B</th>
              <th className="p-2.5">العائد ROE%</th>
              <th className="p-2.5">الرافعة D/E</th>
              <th className="p-2.5">نمو الأرباح YoY</th>
              <th className="p-2.5">الانتقال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2836]">
            {peers.map((p) => {
              const isCurrent = p.sym === currentSymbol;
              return (
                <tr
                  key={p.sym}
                  className={`hover:bg-white/[0.03] transition ${
                    isCurrent ? "bg-[#3987e5]/10 font-bold" : ""
                  }`}
                >
                  <td className="p-2.5 flex items-center gap-2">
                    <span className="text-white font-mono">{p.sym}</span>
                    <span className="text-[#a7b1bd] font-sans text-[11px] truncate max-w-[140px]">
                      {p.n}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#3987e5] text-white rounded font-sans">
                        السهم الحالي
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-white">
                    {p.mc ? `${(p.mc / 1000).toFixed(1)}B` : "—"}
                  </td>
                  <td className="p-2.5 text-white">{p.px ? p.px.toFixed(2) : "—"}</td>
                  <td className="p-2.5 text-[#d9b64a]">{p.pe ? `${p.pe.toFixed(1)}x` : "—"}</td>
                  <td className="p-2.5 text-white">{p.pb ? `${p.pb.toFixed(2)}x` : "—"}</td>
                  <td className="p-2.5 text-emerald-400">
                    {p.roe != null ? `${p.roe.toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-2.5 text-white">{p.de != null ? `${p.de.toFixed(2)}x` : "—"}</td>
                  <td
                    className={`p-2.5 font-bold ${
                      p.g_net != null && p.g_net >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {p.g_net != null ? `${p.g_net > 0 ? "+" : ""}${p.g_net.toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-2.5">
                    <Link
                      href={`/rebh/${p.sym}`}
                      className="text-[#3987e5] hover:text-white flex items-center gap-0.5 text-[11px]"
                    >
                      <span>فحص</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
