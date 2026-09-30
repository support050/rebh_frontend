"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity, ShieldCheck, CheckCircle2, AlertTriangle,
  Database, Scale
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface HealthMetric {
  metric: string;
  metricAr: string;
  state: string;
  stateType: "ok" | "warn" | "danger";
  detail: string;
  fix: string;
}

export default function RebhHealthPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching health stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans pb-16 antialiased">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white px-6 md:px-10 py-7">
        <div className="max-w-6xl mx-auto flex items-start gap-4">
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] text-[#16A34A]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider text-[#16A34A] uppercase mb-1">
              REBH · Live Accounting Oversight &amp; Audit
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">
              Data Health <span className="text-[#8C3B32] font-normal">— The Platform Audits Its Own Data in Public</span>
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-3xl leading-relaxed">
              The page no other financial platform has: we disclose every figure we have verified, and every data gap with its cause and the engineering fix assigned to it. We hide no shortfall and fudge no ratio.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center text-[#6B7280] text-[11px] font-mono uppercase tracking-wide mb-2">
              <span>Accounting Identity Check A = L + E</span>
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#16A34A]">
              {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-16 h-7 inline-block" /> : `${stats?.balance_sheets_passed ?? 0} Reconciled`}
            </div>
            <div className="text-[11px] text-[#6B7280] mt-1">Full reconciliation rate of {loading ? '—' : `${stats?.identity_pass_pct ?? 0}%`} across all audited statements</div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center text-[#6B7280] text-[11px] font-mono uppercase tracking-wide mb-2">
              <span>Successfully Valued Companies</span>
              <Scale className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#2563EB]">
              {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-12 h-7 inline-block" /> : `${stats?.valued_count ?? 0} Companies`}
            </div>
            <div className="text-[11px] text-[#6B7280] mt-1">Recent, complete statements run through the valuation matrices</div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center text-[#6B7280] text-[11px] font-mono uppercase tracking-wide mb-2">
              <span>In the Too-Hard Pile (Quarantine)</span>
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#B45309]">
              {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-12 h-7 inline-block" /> : `${stats?.quarantine_count ?? 0} Companies`}
            </div>
            <div className="text-[11px] mt-1">
              <Link href="/rebh/quarantine" className="text-[#8C3B32] underline hover:text-[#6E2E27] font-medium">
                Barred from pricing until data is updated
              </Link>
            </div>
          </div>
        </div>

        {/* The Double-Count Discovery Box */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-l-4 border-l-[#2563EB]">
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-xs uppercase font-mono mb-2">
            <Database className="w-4 h-4" />
            Double-Count Discovery &amp; Resolution
          </div>
          <p className="text-xs md:text-sm text-[#374151] leading-relaxed">
            When pulling certain standard statements from Tadawul, non-current assets were found to be added into the total twice for 165 companies. Rather than display misleading figures, the platform engine derived the exact recovery formula <span className="font-mono text-[#8C3B32] bg-[#F3F4F6] px-2 py-0.5 rounded-[4px] border border-[#E5E7EB]">TA_true = (TA_std + CA) / 2</span> and reconciled it to the last halala against official disclosures (e.g., Dar Al Arkan SAR 40,435 million and Saudi Cement SAR 3,203 million).
          </p>
        </div>

        {/* Importers Readiness & Pipeline Health (Phase 12) */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8">
          <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F3F4F6] flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              Data Importers &amp; Scheduler Readiness
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded">
              Phase 12 — Active
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Price &amp; Index Updates</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">Healthy</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Daily market refresh · TASI and index prices</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Scheduled daily (trading days 18:30)</div>
            </div>

            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Sukuk &amp; Debt Instruments Importer</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">63 Sukuk</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Sukuk and bond importer · yield to maturity and coupons</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Scheduled weekly (Sunday 19:00)</div>
            </div>

            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Macroeconomic Importer (SAMA)</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">6 Indicators</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">SAMA and the General Authority for Statistics · SAIBOR / Repo / GDP</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Scheduled monthly (1st of each month 03:00)</div>
            </div>

            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Bank Line-Item &amp; NIM Auditor</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">10 Banks</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Bank line-item parser · Net Interest Margin / provisions</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Automated, reconciled quarterly check</div>
            </div>

            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Official Disclosures Repository</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">21,424 Files</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Repository of official disclosures and reports</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Continuous Tadawul sync and secure storage</div>
            </div>

            <div className="border border-[#E5E7EB] rounded p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1A1A1A]">Historical Engine Snapshots (Vintages)</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A]">Active</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Unified REBH engine snapshot service</p>
              <div className="text-[10px] font-mono text-[#8C3B32] mt-2">Daily archiving of accounting valuation points</div>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8">
          <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F3F4F6] flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              Accounting Audit Log &amp; Disclosed Gaps (Audit Matrix)
            </h3>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Documented live via API</span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {loading ? (
              <div className="p-8 text-center text-[#6B7280] text-sm">Loading audit log...</div>
            ) : (stats?.audit_matrix || []).length === 0 ? (
              <div className="p-8 text-center text-[#6B7280] text-sm">No audit data currently available</div>
            ) : (stats?.audit_matrix || []).map((item: any, idx: number) => (
              <div key={idx} className="p-5 hover:bg-[#F7F8FA] transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1A1A1A]">{item.metric || item.metricAr}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${item.stateType === "ok"
                    ? "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]"
                    : "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]"
                    }`}>
                    {item.stateType === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {item.state}
                  </span>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed mb-2">
                  {item.detail}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[11px] font-mono text-[#8C3B32] bg-[#FBEAE8] border border-[#F0CFC9] rounded-[4px] px-3 py-1.5 inline-block">
                    <span className="text-[#6B7280] font-bold">Engineering Fix / Action: </span>
                    {item.fix}
                  </div>
                  {item.stateType !== "ok" && (
                    <Link
                      href="/rebh/quarantine"
                      className="text-[11px] font-bold text-[#8C3B32] hover:underline bg-white border border-[#E5E7EB] hover:border-[#8C3B32] px-2.5 py-1 rounded transition inline-flex items-center gap-1"
                    >
                      View affected companies in the Too-Hard Pile →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forensic Rules Compliance Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-center text-xs">
          <div className="bg-white border border-[#E5E7EB] p-3 rounded-[4px]">
            <span className="font-bold text-[#16A34A] block mb-0.5">Stale-Statement Pricing Ban</span>
            <span className="text-[11px] text-[#6B7280]">Enforced automatically: immediate exclusion from any multiple or valuation</span>
          </div>
          <div className="bg-white border border-[#E5E7EB] p-3 rounded-[4px]">
            <span className="font-bold text-[#16A34A] block mb-0.5">Earnings Inflation Block &gt; 120%</span>
            <span className="text-[11px] text-[#6B7280]">Isolates companies with anomalous non-operating earnings</span>
          </div>
          <div className="bg-white border border-[#E5E7EB] p-3 rounded-[4px]">
            <span className="font-bold text-[#16A34A] block mb-0.5">Free Cash Flow Yield Cap ±150%</span>
            <span className="text-[11px] text-[#6B7280]">Suppresses outliers caused by unsustainable cash flows</span>
          </div>
        </div>

        {/* Footer info */}
        <footer className="text-center text-xs text-[#9CA3AF] space-y-1">
          <p>REBH Financial Platform · Automated Accounting Audit · ° computed · ⚑ risk flag · 🔌 missing source, publicly named</p>
        </footer>
      </main>
    </div>
  );
}