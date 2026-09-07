"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Building2, BarChart2, ShieldAlert, BookOpen,
  CheckSquare, Activity, Search, Menu, X, FileText,
  PanelRightClose, PanelRightOpen, Layers, FileSpreadsheet,
  Film, LineChart, Award
} from "lucide-react";

interface NavItem {
  name: string;
  nameEn: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  tagColor?: string;
}

const NAV_ITEMS: { group: string; items: NavItem[] }[] = [
  {
    group: "المنصة والتحليل",
    items: [
      { name: "الرئيسية (Overview)", nameEn: "Home Hub", path: "/rebh", icon: Home },
      { name: "فحص الشركات (One ∞)", nameEn: "Company Page", path: "/rebh/company/2222", icon: Building2 },
      { name: "الفحص العميق (Deep-Dive · ONE)", nameEn: "Deep Dive", path: "/rebh/one/2222", icon: Layers, tag: "14 Mod", tagColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]" },
      { name: "استوديو الرسوم (Chart Studio)", nameEn: "Chart Studio", path: "/rebh/studio/2222", icon: LineChart, tag: "Studio", tagColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]" },
      { name: "القوائم المالية (Statements · Analyst)", nameEn: "Analyst", path: "/rebh/analyst/2222", icon: FileSpreadsheet, tag: "XBRL", tagColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]" },
      { name: "تشريح السردية (Story · X-Ray)", nameEn: "Story X-Ray", path: "/rebh/xray/2222", icon: Film, tag: "River", tagColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]" },
      { name: "أدوات ومختبرات الدورة", nameEn: "Tools & Labs", path: "/rebh/tools", icon: BarChart2, tag: "18 Labs", tagColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]" },
    ]
  },
  {
    group: "أدوات المستثمر الذكي",
    items: [
      { name: "قائمة المتابعة والفلترة", nameEn: "Watchlist", path: "/rebh/watchlist", icon: Search, tag: "270 Cos", tagColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]" },
      { name: "سلة مونجر (Quarantine)", nameEn: "Too-Hard Pile", path: "/rebh/quarantine", icon: ShieldAlert, tag: "48 Gap", tagColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]" },
      { name: "سجل الصفقات (Journal)", nameEn: "Discipline", path: "/rebh/journal", icon: BookOpen },
      { name: "لجنة الفحص والرقابة (31)", nameEn: "The Council", path: "/rebh/council", icon: CheckSquare },
      { name: "بطاقة اعتماد المنصة (10/10)", nameEn: "Council Scorecard", path: "/rebh/score", icon: Award, tag: "10/10", tagColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]" },
      { name: "التقرير التحليلي", nameEn: "Abu Saad Report", path: "/rebh/report/2222", icon: FileText, tag: "PDF ⎙", tagColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]" },
      { name: "تقارير الدورة (10 شركات)", nameEn: "Course Reports", path: "/rebh/course-reports", icon: BookOpen, tag: "10+8", tagColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]" },
      { name: "محطة التداول والتحليل", nameEn: "Terminal Suite", path: "/terminal", icon: BarChart2, tag: "Terminal", tagColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]" },
      { name: "صحة وتدقيق البيانات", nameEn: "Data Health", path: "/rebh/health", icon: Activity, tag: "Audited", tagColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]" },
    ]
  }
];

export default function RebhLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickQuery, setQuickQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  // NEW: desktop collapse state
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
      } else if (cmd === "ONE" || cmd === "DEEP") {
        router.push(`/rebh/one/${sym}`);
      } else if (cmd === "STUDIO" || cmd === "CHART") {
        router.push(`/rebh/studio/${sym}`);
      } else if (cmd === "ANALYST" || cmd === "STMT" || cmd === "FS") {
        router.push(`/rebh/analyst/${sym}`);
      } else if (cmd === "XRAY" || cmd === "STORY") {
        router.push(`/rebh/xray/${sym}`);
      } else if (cmd === "COURSE" || cmd === "CREPORT") {
        router.push(`/rebh/course-reports?sym=${sym}`);
      } else if (cmd === "TOOLS" || cmd === "LAB" || cmd === "LABS") {
        router.push(`/rebh/tools?sym=${sym}`);
      } else if (cmd === "XRAY") {
        router.push(`/rebh/tools?tab=portfolio_xray&sym=${sym}`);
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
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans flex flex-col md:flex-row antialiased">
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
        fixed inset-y-0 right-0 z-50 bg-white border-l border-[#E5E7EB] flex flex-col transition-all duration-200
        md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        ${collapsed ? "md:w-16" : "md:w-64"} w-64
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

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "فتح القائمة" : "طي القائمة"}
            className="hidden md:flex shrink-0 p-1.5 text-[#6B7280] hover:text-[#8C3B32] rounded-[4px] bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#F0CFC9] transition-colors"
          >
            {collapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          </button>
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
          <div className="text-[9.5px] font-mono text-[#9CA3AF] mt-1 px-1">
            اكتب الرمز واضغط Enter للانتقال
          </div>
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
                        relative flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium min-w-0 border
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
                      {item.tag && (
                        <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${item.tagColor} ${collapsed ? "md:hidden" : ""}`}>
                          {item.tag}
                        </span>
                      )}
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