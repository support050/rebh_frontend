'use client';

import { usePathname } from 'next/navigation';
import { QS_COLORS, RATE_SOURCES } from '../_data/ratePageDesign';

/**
 * Pathname → the official page the data on that route came from.
 * The bubble always points at the *source of the displayed numbers*, so the
 * Eurodollar grid opens Investing.com (where it is scraped from) while the
 * FedWatch screens open the CME Group tool.
 */
const SOURCE_BY_PATH: Record<string, { name: string; url: string }> = {
  '/interest-rate/cme-fedwatch': {
    name: RATE_SOURCES.cme.name,
    url: RATE_SOURCES.cme.url,
  },
  '/interest-rate/eurodollar-futures': {
    name: RATE_SOURCES.investing.name,
    url: RATE_SOURCES.investing.url,
  },
};

/**
 * Floating reference bubble for the /interest-rate pages — same interaction as
 * FredReferenceBubble (fixed bottom-right, hover tooltip, new tab), cloned
 * rather than reused because the FRED one is keyed to FRED series codes.
 */
export default function RateReferenceBubble() {
  const pathname = usePathname();
  const match = Object.entries(SOURCE_BY_PATH).find(([p]) => pathname?.startsWith(p));
  if (!match) return null;
  const { name, url } = match[1];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View official source on ${name}`}
      className="group fixed bottom-5 right-5 z-50 flex items-center"
    >
      <span
        className="pointer-events-none mr-3 hidden max-w-0 overflow-hidden whitespace-nowrap rounded-md px-0 py-2 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:max-w-xs group-hover:px-4 group-hover:opacity-100 sm:block"
        style={{ backgroundColor: 'rgba(33,37,41,0.95)' }}
      >
        View Official Source on {name}
      </span>

      {/* QuikStrike blue rather than the FRED link blue — QS_COLORS.vtabLink is
          the measured colour of the tool's own navigation links. */}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: QS_COLORS.vtabLink }}
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
