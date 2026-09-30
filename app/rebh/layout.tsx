"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Building2, BarChart2, ShieldAlert, BookOpen,
  CheckSquare, Activity, Search, Menu, X, FileText,
  ChevronLeft, ChevronRight, Layers, FileSpreadsheet,
  Film, LineChart, Award
} from "lucide-react";

interface NavItem {
  name: string;
  nameEn: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: { group: string; items: NavItem[] }[] = [
  {
    group: "Platform & Analysis",
    items: [
      { name: "Overview", nameEn: "Home Hub", path: "/rebh", icon: Home },
      { name: "Company Screening & Analysis (ONE ∞)", nameEn: "Company Analysis", path: "/rebh/company/2222", icon: Building2 },
      { name: "Chart Studio", nameEn: "Chart Studio", path: "/rebh/studio/2222", icon: LineChart },
      { name: "Financial Statements (Analyst)", nameEn: "Analyst", path: "/rebh/analyst/2222", icon: FileSpreadsheet },
      { name: "Narrative Dissection (Story · X-Ray)", nameEn: "Story X-Ray", path: "/rebh/xray/2222", icon: Film },
      { name: "Course Tools & Labs", nameEn: "Tools & Labs", path: "/rebh/tools", icon: BarChart2 },
    ]
  },
  {
    group: "Smart Investor Tools",
    items: [
      { name: "Watchlist & Screener", nameEn: "Watchlist", path: "/rebh/watchlist", icon: Search },
      { name: "Too-Hard Pile (Quarantine)", nameEn: "Too-Hard Pile", path: "/rebh/quarantine", icon: ShieldAlert },
      { name: "Trade Journal", nameEn: "Discipline", path: "/rebh/journal", icon: BookOpen },
      { name: "Review Council (31 Checks)", nameEn: "The Council", path: "/rebh/council", icon: CheckSquare },
      { name: "Platform Scorecard (10/10)", nameEn: "Council Scorecard", path: "/rebh/score", icon: Award },
      { name: "Analytical Report", nameEn: "Abu Saad Report", path: "/rebh/report/2222", icon: FileText },
      { name: "Course Reports (10 Companies)", nameEn: "Course Reports", path: "/rebh/course-reports", icon: BookOpen },
      { name: "Trading & Analysis Terminal", nameEn: "Terminal Suite", path: "/terminal", icon: BarChart2 },
      // { name: "Data Health & Audit", nameEn: "Data Health", path: "/rebh/health", icon: Activity },
    ]
  }
];

export default function RebhLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickQuery, setQuickQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  // desktop collapse state
  const [collapsed, setCollapsed] = useState(false);

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim().toUpperCase();
    if (!q) return;

    const parts = q.split(/\s+/);
    const sym = parts[0];
    const cmd = parts[1] || "";

    if (/^\d{4}$/.test(sym)) {
      if (cmd === "REPORT" || cmd === "THE_REPORT") {
        router.push(`/rebh/report/${sym}`);
      } else if (cmd === "ONE" || cmd === "DEEP" || cmd === "COMPANY") {
        router.push(`/rebh/company/${sym}`);
      } else if (cmd === "STUDIO" || cmd === "CHART") {
        router.push(`/rebh/studio/${sym}`);
      } else if (cmd === "ANALYST" || cmd === "STMT" || cmd === "FS") {
        router.push(`/rebh/analyst/${sym}`);
      } else if (cmd === "XRAY" || cmd === "STORY") {
        router.push(`/rebh/xray/${sym}`);
      } else if (cmd === "PXRAY" || cmd === "PORTXRAY") {
        // Portfolio X-Ray (tools tab) — distinct from Story X-Ray
        router.push(`/rebh/tools?tab=portfolio_xray&sym=${sym}`);
      } else if (cmd === "COURSE" || cmd === "CREPORT") {
        router.push(`/rebh/course-reports?sym=${sym}`);
      } else if (cmd === "TOOLS" || cmd === "LAB" || cmd === "LABS") {
        router.push(`/rebh/tools?sym=${sym}`);
      } else if (cmd === "COUNCIL" || cmd === "CHECK") {
        router.push(`/rebh/council?sym=${sym}`);
      } else {
        router.push(`/rebh/company/${sym}`);
      }
    } else if (q === "TOOLS" || q === "LABS") {
      router.push("/rebh/tools");
    } else if (q === "WATCH" || q === "WATCHLIST") {
      router.push("/rebh/watchlist");
    } else if (q === "QUARANTINE" || q === "QUAR") {
      router.push("/rebh/quarantine");
    } else if (q === "JOURNAL" || q === "TRADE") {
      router.push("/rebh/journal");
    } else if (q === "COUNCIL" || q === "CHECKLISTS") {
      router.push("/rebh/council");
    } else if (q === "SCORE" || q === "SCORECARD") {
      router.push("/rebh/score");
    } else if (q === "HEALTH" || q === "AUDIT") {
      router.push("/rebh/health");
    } else if (q === "REPORTS" || q === "COURSE") {
      router.push("/rebh/course-reports");
    } else if (/^\d{4}$/.test(q)) {
      router.push(`/rebh/company/${q}`);
    }
    setQuickQuery("");
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E7EB]">
        <Link href="/rebh" className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-[#8C3B32]">REBH</span>
          <span className="font-mono text-xs text-[#6B7280] font-bold">PLATFORM</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] rounded-[4px] bg-[#F3F4F6] border border-[#E5E7EB]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out
        md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${collapsed ? "md:w-0 md:overflow-hidden md:opacity-0 md:pointer-events-none md:border-r-0" : "md:w-64 md:opacity-100"} w-64
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2">
          <Link href="/rebh" className={`block min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-black text-base text-[#8C3B32]">REBH</span>
              <span className="font-mono font-bold text-xs text-[#6B7280]">PLATFORM</span>
            </div>
            <div className="text-[9px] font-mono tracking-wider text-[#9CA3AF] uppercase mt-0.5 truncate">
              EVERYTHING · AND HONEST ABOUT THE REST
            </div>
          </Link>
        </div>

        {/* Quick Command Palette */}
        <div className={`p-3 border-b border-[#E5E7EB] ${collapsed ? "md:hidden" : ""}`}>
          <form onSubmit={handleQuickJump}>
            <div className="relative">
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="⌕ 2222 · 7010 REPORT"
                className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] font-mono outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/10 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx}>
              <div className={`text-[9.5px] font-mono font-bold tracking-widest text-[#9CA3AF] uppercase px-3 mb-1.5 ${collapsed ? "md:hidden" : ""}`}>
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item, i) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path ||
                    (item.path !== "/rebh" && pathname.startsWith(item.path)) ||
                    // Match any /rebh/company/[symbol] page to the company nav item
                    (item.path === "/rebh/company/2222" && pathname.startsWith("/rebh/company/")) ||
                    // Match any /rebh/one/[symbol] page to the deep-dive ONE nav item
                    (item.path === "/rebh/one/2222" && pathname.startsWith("/rebh/one/")) ||
                    // Match any /rebh/studio/[symbol] page to the studio chart nav item
                    (item.path === "/rebh/studio/2222" && pathname.startsWith("/rebh/studio/")) ||
                    // Match any /rebh/analyst/[symbol] page to the analyst statements nav item
                    (item.path === "/rebh/analyst/2222" && pathname.startsWith("/rebh/analyst/")) ||
                    // Match any /rebh/xray/[symbol] page to the story xray nav item
                    (item.path === "/rebh/xray/2222" && pathname.startsWith("/rebh/xray/"));
                  return (
                    <Link
                      key={i}
                      href={item.path}
                      title={collapsed ? item.name : undefined}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        relative flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium min-w-0 border text-left
                        ${collapsed ? "md:justify-center md:px-2" : ""}
                        ${isActive
                          ? "bg-[#F0FDF4] text-[#15803D] font-bold border-[#86EFAC]"
                          : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] border-transparent"}
                      `}
                    >
                      {/* persistent active indicator bar */}
                      {isActive && (
                        <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-none rounded-r-full bg-[#16A34A]" />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className={`truncate min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Indicator */}
        <div className={`p-3 border-t border-[#E5E7EB] bg-[#F7F8FA] text-[10px] font-mono text-[#6B7280] space-y-1 ${collapsed ? "md:hidden" : ""}`}>
          <div className="flex items-center gap-1.5 text-[#16A34A] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse shrink-0"></span>
            <span className="truncate">220 Verified Balance Sheets</span>
          </div>
          <div className="text-[9px] text-[#9CA3AF] truncate">
            Real XBRL Data · TASI Market
          </div>
        </div>
      </aside>

      {/* Sidebar toggle - desktop only (floating tab on the sidebar edge) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center w-5 h-14 bg-white border border-[#E5E7EB] border-l-0 rounded-r-md shadow-sm text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-all duration-300 ease-in-out cursor-pointer outline-none focus:ring-0"
        style={{ left: collapsed ? "0px" : "256px" }}
        title={collapsed ? "Expand menu" : "Collapse menu"}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Mobile overlay when nav is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}