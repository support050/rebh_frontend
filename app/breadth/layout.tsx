'use client';
/**
 * Independent layout for the TASI Market Breadth module (route /breadth).
 * Deliberately self-contained and separate from /rebh — its own sidebar
 * navigation for all breadth pages (pageMap.ts, the CR3 v5 PAGES table), its
 * own theme scope (.breadth-root), and the module chrome (⇩ Export · ⚙
 * Customize · theme · ▶ tour · ?) mounted once here so it acts on whichever
 * page is active (activeHub.ts).
 *
 * Layout: fixed left sidebar (desktop, PREFS.nav width) that collapses into a
 * slide-over drawer behind a hamburger button on small screens. EN/LTR.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, TrendingUp, MountainSnow, Gauge, Percent, ArrowUpDown, Eye, RefreshCw, CandlestickChart, Library, Target, Building2, PieChart, Zap, BookText, Menu, X, Star, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import './breadth.css';
import BreadthChrome from './_lib/chrome';
import { SIDEBAR_PAGES } from './_lib/pageMap';
import { DEFAULT_PREFS, prefsStore } from './_lib/prefs';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  custom: Star,
  summary: ScrollText,
  widget: Activity,
  leaders: TrendingUp,
  nhnl: MountainSnow,
  mcclellan: Gauge,
  ma: Percent,
  ad: ArrowUpDown,
  stockbee: Eye,
  cycle: RefreshCw,
  classic: CandlestickChart,
  library: Library,
  bpi: Target,
  sectors: Building2,
  conc: PieChart,
  signals: Zap,
  thr: BookText,
};

export default function BreadthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // desktop collapse toggle (RSScreener pattern): centre-edge button hides/shows
  // the sidebar. sessionStorage rather than user_prefs — a per-device view state.
  const [navHidden, setNavHidden] = useState(false);
  const [, force] = useState(0);
  // prefsStore boots from localStorage synchronously on the CLIENT only, so the
  // first client paint would differ from the SSR HTML (nav 230 vs 190) → React
  // hydration mismatch. Render DEFAULT_PREFS until mounted, then swap to the
  // real prefs in a post-hydration effect (matches server output exactly).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => { setNavHidden(sessionStorage.getItem('tb-nav-hidden') === '1'); }, []);
  const toggleNav = () => setNavHidden((h) => {
    sessionStorage.setItem('tb-nav-hidden', h ? '0' : '1');
    return !h;
  });

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);
  // live-apply PREFS.nav / PREFS.hidden to the sidebar
  useEffect(() => prefsStore.subscribe(() => force((x) => x + 1)), []);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const on = () => setIsMobile(!mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const P = mounted ? prefsStore.prefs : DEFAULT_PREFS;
  const navW = Math.max(0, Math.min(260, P.nav || 0));

  const pages = SIDEBAR_PAGES.filter((p) => !P.hidden.includes(p.id));

  const isActive = (path: string, i: number) => {
    if (path === '/breadth') return pathname === '/breadth' || pathname === '/breadth/';
    void i;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const nav = (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
      {pages.map((p, i) => {
        const Icon = ICONS[p.id] ?? Activity;
        const active = isActive(p.path, i);
        return (
          <Link
            key={p.id}
            href={p.path}
            data-p={p.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors"
            style={{
              background: active ? 'var(--blue)' : 'transparent',
              color: active ? '#fff' : 'var(--text2)',
            }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {p.name}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/breadth" className="block px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
      <span className="block font-black text-[15px] leading-tight" style={{ color: 'var(--text)' }}>{P.title}</span>
      <span className="block text-[11px] font-mono mt-0.5" style={{ color: 'var(--text2)' }}>
        REBH Pro Dashboard · daily · calibrated on TASI
      </span>
    </Link>
  );

  return (
    <div dir="ltr" className="breadth-root min-h-screen">
      {/* Mobile top bar — hamburger opens the drawer (sits under the global 56px Navbar) */}
      <header className="md:hidden sticky top-14 z-40 flex items-center gap-3 px-3 py-2.5 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button
          aria-label="open navigation"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md border"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-black text-sm" style={{ color: 'var(--text)' }}>{P.title}</span>
      </header>

      {/* Sidebar — fixed on desktop at PREFS.nav width, slide-over on mobile.
          top-14 keeps it below the global Navbar (sticky h-14, z-[1000]).
          navHidden (centre-edge toggle) slides it out and frees the content. */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-50 flex flex-col border-r transition-all duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${navHidden ? 'md:-translate-x-full' : 'md:translate-x-0'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', width: Math.max(navW, 180) }}
      >
        <div className="flex items-start justify-between">
          <span className="flex-1">{brand}</span>
          <button
            aria-label="close navigation"
            onClick={() => setOpen(false)}
            className="md:hidden p-2 mr-2 mt-2 rounded-md border"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {nav}
      </aside>

      {/* Sidebar toggle — centre of the sidebar edge (as in the RS Screener /
          industry-groups page): ◀ hides the sidebar, ▶ brings it back. */}
      <button
        aria-label={navHidden ? 'show sidebar' : 'hide sidebar'}
        title={navHidden ? 'Expand Sidebar' : 'Collapse Sidebar'}
        onClick={toggleNav}
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[60] items-center justify-center w-5 h-14 rounded-r-md border border-l-0 shadow-sm cursor-pointer transition-all duration-200"
        style={{
          left: navHidden ? 0 : Math.max(navW, 180),
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text2)',
        }}
      >
        {navHidden ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Drawer backdrop (mobile only) */}
      {open ? (
        <div className="fixed top-14 inset-x-0 bottom-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      ) : null}

      {/* Page body — chrome bar (⇩ Export · ⚙ · theme · ▶ tour · ?) sits above it,
          one instance so its ids stay unique (CR3 §3/§4/§12). */}
      <main style={{ paddingLeft: isMobile || navHidden ? 0 : Math.max(navW, 180) }}>
        <div className="max-w-[1400px] mx-auto w-full">
          <BreadthChrome />
          <div className="px-3 sm:px-4 py-4">{children}</div>
        </div>
      </main>
    </div>
  );
}
