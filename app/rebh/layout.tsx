"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Building2, BarChart2, ShieldAlert, BookOpen, 
  CheckSquare, Activity, Search, ExternalLink, Menu, X, ArrowLeft, FileText
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
      { name: "فحص الشركات (One ∞)", nameEn: "Company Page", path: "/rebh/2222", icon: Building2 },
      { name: "أدوات ومختبرات الدورة", nameEn: "Tools & Labs", path: "/rebh/tools", icon: BarChart2, tag: "18 Labs", tagColor: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30" },
    ]
  },
  {
    group: "أدوات المستثمر الذكي",
    items: [
      { name: "قائمة المتابعة والفلترة", nameEn: "Watchlist", path: "/rebh/watchlist", icon: Search, tag: "270 Cos", tagColor: "text-[#3987e5] bg-[#3987e5]/10 border-[#3987e5]/30" },
      { name: "سلة مونجر (Quarantine)", nameEn: "Too-Hard Pile", path: "/rebh/quarantine", icon: ShieldAlert, tag: "48 Gap", tagColor: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30" },
      { name: "سجل الصفقات (Journal)", nameEn: "Discipline", path: "/rebh/journal", icon: BookOpen },
      { name: "لجنة الفحص والرقابة (31)", nameEn: "The Council", path: "/rebh/council", icon: CheckSquare },
      { name: "التقرير التحليلي (THE REPORT)", nameEn: "Abu Saad Report", path: "/rebh/report/2222", icon: FileText, tag: "PDF ⎙", tagColor: "text-[#d9b64a] bg-[#d9b64a]/10 border-[#d9b64a]/30" },
      { name: "تقارير الدورة (10 شركات)", nameEn: "Course Reports", path: "/rebh/course-reports", icon: BookOpen, tag: "10 + 8 أبواب", tagColor: "text-[#d9b64a] bg-[#d9b64a]/10 border-[#d9b64a]/30" },
      { name: "صحة وتدقيق البيانات", nameEn: "Data Health", path: "/rebh/health", icon: Activity, tag: "Audited", tagColor: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30" },
    ]
  }
];

export default function RebhLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickQuery, setQuickQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim().toUpperCase();
    if (!q) return;

    // Support Koyfin command palette like "4300 REPORT", "7010 TOOLS", "2222"
    const parts = q.split(/\s+/);
    const sym = parts[0];
    const cmd = parts[1] || "";

    if (/^\d{4}$/.test(sym)) {
      if (cmd === "REPORT" || cmd === "COURSE") {
        router.push(`/rebh/report/${sym}`);
      } else {
        router.push(`/rebh/${sym}`);
      }
    } else if (q === "TOOLS") {
      router.push("/rebh/tools");
    } else if (q === "WATCH" || q === "WATCHLIST") {
      router.push("/rebh/watchlist");
    } else if (q === "QUARANTINE" || q === "QUAR") {
      router.push("/rebh/quarantine");
    } else if (q === "JOURNAL") {
      router.push("/rebh/journal");
    } else if (q === "COUNCIL") {
      router.push("/rebh/council");
    } else if (q === "HEALTH") {
      router.push("/rebh/health");
    } else {
      router.push(`/rebh/${sym}`);
    }
    setQuickQuery("");
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-[#f0f2f5] font-sans flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#060709] border-b border-[#1c2230]">
        <Link href="/rebh" className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-[#d9b64a]">REBH</span>
          <span className="font-mono text-xs text-[#63a5f0] font-bold">PLATFORM</span>
        </Link>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-slate-400 hover:text-white rounded bg-[#11141b]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Persistent Sidebar (240px width based on platform_shell) */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-[#060709] border-l border-[#1c2230] flex flex-col transition-transform duration-200
        md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1c2230]">
          <Link href="/rebh" className="block">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-black text-base text-[#d9b64a]">REBH</span>
              <span className="font-mono font-bold text-xs text-[#63a5f0]">PLATFORM</span>
            </div>
            <div className="text-[9px] font-mono tracking-wider text-slate-500 uppercase mt-0.5">
              EVERYTHING · AND HONEST ABOUT THE REST
            </div>
          </Link>
        </div>

        {/* Quick Command Palette (Koyfin / Bloomberg Style) */}
        <div className="p-3 border-b border-[#1c2230]">
          <form onSubmit={handleQuickJump}>
            <div className="relative">
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="⌕ 2222 · 7010 REPORT"
                className="w-full bg-[#0e141d] border border-[#1d2735] rounded-lg px-3 py-1.5 text-xs text-[#e8edf4] placeholder:text-slate-600 font-mono outline-none focus:border-[#3987e5]"
              />
            </div>
          </form>
          <div className="text-[9.5px] font-mono text-slate-600 mt-1 px-1">
            اكتب الرمز واضغط Enter للانتقال
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx}>
              <div className="text-[9.5px] font-mono font-bold tracking-widest text-slate-500 uppercase px-3 mb-1.5">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== "/rebh" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={i}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                        ${isActive 
                          ? "bg-[#3987e5]/10 text-[#63a5f0] font-bold border-r-2 border-[#3987e5]" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"}
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                      {item.tag && (
                        <span className={`mr-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.tagColor}`}>
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
        <div className="p-3 border-t border-[#1c2230] bg-[#080a0e] text-[10px] font-mono text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 text-[#10b981]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>220 Verified Balance Sheets</span>
          </div>
          <div className="text-[9px] text-slate-600">
            Real XBRL Data · TASI Market
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
