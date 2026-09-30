"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, BarChart3, ShieldAlert, BookOpen,
  CheckSquare, Search, ArrowRight, Award, LineChart,
  Film, FileSpreadsheet, Activity, Layers
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

export default function RebhHomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/rebh/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError("Unable to load live statistics");
        }
      } catch (err: any) {
        console.error("Error fetching live REBH stats:", err);
        setError("Error connecting to the analysis server");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const FEATURES = [
    {
      href: "/rebh/company/2222",
      icon: Building2,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "LIVE · 270 COS",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "Comprehensive Company Page — ONE ∞",
      desc: "Full analysis for any company: safety matrix, factor scores, Fair Value, and specialized bank metrics.",
    },
    {
      href: "/rebh/studio/2222",
      icon: LineChart,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "STUDIO",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "Financial Chart Studio",
      desc: "Flexible interactive charts to compare periods, earnings progression, valuation multiples, and company cash flows.",
    },
    {
      href: "/rebh/xray/2222",
      icon: Film,
      iconColor: "text-[#B45309]",
      iconBg: "bg-[#FFFBEB]",
      badge: "X-RAY",
      badgeColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]",
      title: "Story X-Ray",
      desc: "Revenue-to-Free Cash Flow waterfall (the money river), Cash Conversion Cycle (CCC), and the evolution of capital structure and the Balance Sheet.",
    },
    {
      href: "/rebh/analyst/2222",
      icon: FileSpreadsheet,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "XBRL AUDIT",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "Financial Statements & Audit (Analyst)",
      desc: "Income Statement, Balance Sheet, and Cash Flow Statement, audited and reconciled to XBRL standards, with Working Capital line-item tracking.",
    },
    {
      href: "/rebh/watchlist",
      icon: Search,
      iconColor: "text-[#B08900]",
      iconBg: "bg-[#FEFCE8]",
      badge: "SCREENER",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "Watchlist & Smart Screener",
      desc: "Live sortable table of all TASI companies with PEG multiples, Graham's net-net P/NCAV, and Piotroski F-Score quality.",
    },
    {
      href: "/rebh/tools",
      icon: BarChart3,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "18 LABS",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "Course Tools & Quantitative Labs",
      desc: "Interactive calculators: TASI model and bond multiple, Beneish M-Score, project rNPV, and Cut-Cut for post-crisis recovery.",
    },
    {
      href: "/rebh/council",
      icon: CheckSquare,
      iconColor: "text-[#B08900]",
      iconBg: "bg-[#FEFCE8]",
      badge: "31 CHECKLISTS",
      badgeColor: "text-[#B08900] bg-[#FEFCE8] border-[#FDE68A]",
      title: "Council Review Station & Audit Checklists",
      desc: "Fisher's 15-point test with a mandatory integrity item, the six red flags, and the 12-point bank screener with instant verdict scoring.",
    },
    {
      href: "/rebh/report/2222",
      icon: Award,
      iconColor: "text-[#8C3B32]",
      iconBg: "bg-[#FBEAE8]",
      badge: "PRINT / PDF ⎙",
      badgeColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]",
      title: "Comprehensive Analytical Report (THE REPORT)",
      desc: "Generate the printed Al-Kharfashi course report in Abu Saad style, the dual stress matrix R×GS, and the reverse-valuation reading with an analyst log.",
      hoverBorder: "hover:border-[#8C3B32]",
      hoverTitle: "group-hover:text-[#8C3B32]",
    },
    {
      href: "/rebh/course-reports",
      icon: BookOpen,
      iconColor: "text-[#8C3B32]",
      iconBg: "bg-[#FBEAE8]",
      badge: "CASE STUDIES",
      badgeColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]",
      title: "Course Reports & Case Studies",
      desc: "The ten case studies from Mishaal Al-Kharfashi's course (Al-Khorayef, Elm, SAL, Cisco, and others), simulated and detailed numerically.",
    },
    {
      href: "/rebh/journal",
      icon: BookOpen,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "DISCIPLINE",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "Trade Journal & Minervini Rules",
      desc: "Trade documentation with live Win Rate (≥ 60%), Reward-to-Risk (R/R) ratio, and mathematical expectancy.",
    },
    {
      href: "/rebh/quarantine",
      icon: ShieldAlert,
      iconColor: "text-[#B45309]",
      iconBg: "bg-[#FFFBEB]",
      badge: "TOO-HARD PILE",
      badgeColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]",
      title: "Too-Hard Pile (Quarantine)",
      desc: "Transparent disclosure of companies excluded from valuation due to incomplete statements or stalled updates, with the required engineering fix.",
      hoverBorder: "hover:border-[#F59E0B]",
      hoverTitle: "group-hover:text-[#B45309]",
    },
    {
      href: "/rebh/health",
      icon: Activity,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "AUDIT MATRIX",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "Data Health & Audit",
      desc: "Live audit matrix: A = L + E reconciliation, statement tag integrity, and anti-misleading checks across all companies.",
    },
  ];

  const KPIS = [
    { val: stats?.balance_sheets_passed, label: "Audited Balance Sheets", color: "text-[#1A1A1A]" },
    { val: stats?.valued_count, label: "Companies Valued", color: "text-[#2563EB]" },
    { val: stats?.estimates_count, label: "Forecasts w/ Measured Error", color: "text-[#1A1A1A]" },
    { val: stats?.checklists_count, label: "Checklists Scored", color: "text-[#B08900]" },
    { val: stats?.quarantine_count, label: "In Too-Hard Pile", color: "text-[#B45309]" },
  ];

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Hero Banner */}
        <div className="text-center pt-8 pb-4 space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight">
            Everything the seven platforms offer.<br />
            <span className="text-[#8C3B32]">Accounting-verified — or honestly disclosed.</span>
          </h1>
        </div>

        {/* Dynamic Live Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="text-2xl font-black font-mono text-[#16A34A]">{FEATURES.length}</div>
            <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">Live Modules</div>
          </div>
          {KPIS.map(({ val, label, color }) => (
            <div key={label} className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className={`text-2xl font-black font-mono ${color}`}>
                {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-10 h-7 inline-block" /> : (val ?? '—')}
              </div>
              <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">{label}</div>
            </div>
          ))}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="text-2xl font-black font-mono text-[#16A34A]">
              {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-10 h-7 inline-block" /> : `${stats?.identity_pass_pct ?? 0}%`}
            </div>
            <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">A = L + E Pass Rate</div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`group bg-white border border-[#E5E7EB] ${f.hoverBorder ?? "hover:border-[#8C3B32]"} rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-md text-left`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 ${f.iconBg} ${f.iconColor} rounded-[4px]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className={`font-bold text-base text-[#1A1A1A] ${f.hoverTitle ?? "group-hover:text-[#8C3B32]"} flex items-center gap-1.5 mb-1.5`}>
                  {f.title}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {f.desc}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}