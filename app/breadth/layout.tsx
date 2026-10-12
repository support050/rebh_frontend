'use client';
/**
 * Independent layout for the TASI Market Breadth module (route /breadth).
 * Deliberately self-contained and separate from /rebh — its own sidebar
 * navigation for all 16 breadth pages, and its own theme scope (.breadth-root).
 *
 * Layout: fixed left sidebar (desktop) that collapses into a slide-over drawer
 * behind a hamburger button on small screens. English UI / LTR throughout.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, TrendingUp, MountainSnow, Gauge, Percent, ArrowUpDown, Eye, RefreshCw, CandlestickChart, Library, Target, Building2, PieChart, Zap, BookText, Menu, X } from 'lucide-react';
import './breadth.css';

interface Page {
  id: string;
  path: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PAGES: Page[] = [
  { id: 'overview', path: '/breadth', name: 'Overview', icon: LayoutDashboard },
  { id: 'widget', path: '/breadth/widget', name: 'Breadth Widget', icon: Activity },
  { id: 'leaders', path: '/breadth/leaders', name: 'Leaders & Trend Template', icon: TrendingUp },
  { id: 'nhnl', path: '/breadth/nhnl', name: 'New Highs / New Lows', icon: MountainSnow },
  { id: 'mcclellan', path: '/breadth/mcclellan', name: 'McClellan', icon: Gauge },
  { id: 'ma', path: '/breadth/ma', name: '% Above MAs', icon: Percent },
  { id: 'ad', path: '/breadth/ad', name: 'Advance / Decline', icon: ArrowUpDown },
  { id: 'stockbee', path: '/breadth/stockbee', name: 'Stockbee Monitor', icon: Eye },
  { id: 'cycle', path: '/breadth/cycle', name: 'Market Cycle (DV)', icon: RefreshCw },
  { id: 'classic', path: '/breadth/classic', name: 'Classic chart', icon: CandlestickChart },
  { id: 'library', path: '/breadth/library', name: 'Classic breadth library', icon: Library },
  { id: 'bpi', path: '/breadth/bpi', name: 'Bullish Percent (P&F)', icon: Target },
  { id: 'sectors', path: '/breadth/sectors', name: 'Sectors', icon: Building2 },
  { id: 'conc', path: '/breadth/conc', name: 'Concentration', icon: PieChart },
  { id: 'signals', path: '/breadth/signals', name: 'Signals & Regimes', icon: Zap },
  { id: 'thr', path: '/breadth/thresholds', name: 'Thresholds & Method', icon: BookText },
];

export default function BreadthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (p: Page, i: number) => {
    if (i === 0) return pathname === '/breadth' || pathname === '/breadth/';
    return pathname === p.path || pathname.startsWith(p.path + '/');
  };

  const nav = (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
      {PAGES.map((p, i) => {
        const Icon = p.icon;
        const active = isActive(p, i);
        return (
          <Link
            key={p.id}
            href={p.path}
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
      <span className="block font-black text-[15px] leading-tight" style={{ color: 'var(--text)' }}>TASI Market Breadth</span>
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
        <span className="font-black text-sm" style={{ color: 'var(--text)' }}>TASI Market Breadth</span>
      </header>

      {/* Sidebar — fixed on desktop, slide-over drawer on mobile.
          top-14 keeps it below the global Navbar (sticky h-14, z-[1000]) so the brand row is never covered. */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-50 w-60 flex flex-col border-r transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
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

      {/* Drawer backdrop (mobile only) */}
      {open ? (
        <div className="fixed top-14 inset-x-0 bottom-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      ) : null}

      {/* Page body */}
      <main className="md:pl-60">
        <div className="px-3 sm:px-4 py-4 max-w-[1400px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
