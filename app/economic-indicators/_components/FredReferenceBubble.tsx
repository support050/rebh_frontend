'use client';

import { usePathname } from 'next/navigation';
import { FRED_COLORS } from '../_data/fredDesign';

/* Pathname → official FRED series URL. nfp-change is a derived view of the
   PAYEMS release, so it points at the PAYEMS series page. */
const SERIES_BY_PATH: Record<string, { code: string; url: string }> = {
  '/economic-indicators/unrate': { code: 'UNRATE', url: 'https://fred.stlouisfed.org/series/UNRATE' },
  '/economic-indicators/payems': { code: 'PAYEMS', url: 'https://fred.stlouisfed.org/series/PAYEMS' },
  '/economic-indicators/ic4wsa': { code: 'IC4WSA', url: 'https://fred.stlouisfed.org/series/IC4WSA' },
  '/economic-indicators/nfp-change': { code: 'PAYEMS', url: 'https://fred.stlouisfed.org/series/PAYEMS' },
  '/spread/bbb-corporate': { code: 'BAMLC0A4CBBB', url: 'https://fred.stlouisfed.org/series/BAMLC0A4CBBB' },
  '/spread/a-corporate': { code: 'BAMLC0A3CA', url: 'https://fred.stlouisfed.org/series/BAMLC0A3CA' },
};

/**
 * Floating reference bubble pinned bottom-right on every FRED-style page
 * (economic indicators + spread). Opens the current series' official FRED® page
 * in a new tab.
 */
export default function FredReferenceBubble() {
  const pathname = usePathname();
  const match = Object.entries(SERIES_BY_PATH).find(([p]) => pathname?.startsWith(p));
  if (!match) return null;
  const { code, url } = match[1];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View official source on FRED® (${code})`}
      className="group fixed bottom-5 right-5 z-50 flex items-center"
    >
      {/* Tooltip / mini-card (desktop) */}
      <span
        className="pointer-events-none mr-3 hidden max-w-0 overflow-hidden whitespace-nowrap rounded-md px-0 py-2 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:max-w-xs group-hover:px-4 group-hover:opacity-100 sm:block"
        style={{ backgroundColor: 'rgba(33,37,41,0.95)' }}
      >
        View Official Source on FRED®
      </span>

      {/* Circular button */}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: FRED_COLORS.link }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </span>
    </a>
  );
}
