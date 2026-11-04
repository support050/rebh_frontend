'use client';

import { usePathname } from 'next/navigation';
import { USWDS, BONDS_SOURCE_BY_PATH } from '../_data/bondsDesign';

/**
 * Floating reference bubble for the three /bonds Treasury pages — the same
 * interaction as RateReferenceBubble (fixed bottom-right, hover tooltip, opens
 * the official source in a new tab), keyed to the /bonds routes. Route-aware:
 * the two Treasury-fed routes open the official Daily Par Yield Curve screen;
 * the dynamic simulator opens the StockCharts tool it is modelled on. The
 * mapping (URL + tooltip wording) lives in BONDS_SOURCE_BY_PATH.
 */
export default function BondsReferenceBubble() {
  const pathname = usePathname();
  const match = Object.entries(BONDS_SOURCE_BY_PATH).find(([p]) => pathname?.startsWith(p));
  if (!match) return null;
  const { url, tooltip } = match[1];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={tooltip}
      className="group fixed bottom-5 right-5 z-50 flex items-center"
    >
      <span
        className="pointer-events-none mr-3 hidden max-w-0 overflow-hidden whitespace-nowrap rounded-md px-0 py-2 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:max-w-xs group-hover:px-4 group-hover:opacity-100 sm:block"
        style={{ backgroundColor: 'rgba(27,27,27,0.95)' }}
      >
        {tooltip}
      </span>

      {/* USWDS interactive-link blue (#005ea2) — the measured colour of the
          official table's own sortable-header buttons. */}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: USWDS.link }}
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
