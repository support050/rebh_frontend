'use client';

import { usePathname } from 'next/navigation';

/**
 * Pathname → official GuruFocus indicator source URL.
 */
const GURUFOCUS_SOURCES: Record<string, { title: string; url: string }> = {
  '/market/sp500-earnings-yield': {
    title: 'S&P 500 Earnings Yield',
    url: 'https://www.gurufocus.com/economic_indicators/151/sp-500-earnings-yield',
  },
  '/market/sp500-pe-ratio': {
    title: 'S&P 500 PE Ratio',
    url: 'https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio',
  },
  '/market/sp500-pe-ratio-forward-estimate': {
    title: 'S&P 500 PE Ratio with Forward Estimate',
    url: 'https://www.gurufocus.com/economic_indicators/6061/sp-500-pe-ratio-with-forward-estimate',
  },
};

interface GuruFocusBubbleProps {
  sourceUrl?: string;
  title?: string;
}

/**
 * Floating reference bubble pinned bottom-right on GuruFocus indicator pages.
 * Shows hover tooltip and opens the official GuruFocus source in a new tab.
 */
export default function GuruFocusReferenceBubble({ sourceUrl, title }: GuruFocusBubbleProps) {
  const pathname = usePathname();

  // If sourceUrl is explicitly provided via props, use it directly (100% reliable)
  let resolvedUrl = sourceUrl;
  let resolvedTitle = title || 'GuruFocus';

  if (!resolvedUrl) {
    // Exact or longest prefix match to avoid '/market/sp500-pe-ratio' matching forward-estimate
    const normalized = pathname?.replace(/\/+$/, '') || '';
    if (normalized === '/market/sp500-earnings-yield') {
      resolvedUrl = 'https://www.gurufocus.com/economic_indicators/151/sp-500-earnings-yield';
      resolvedTitle = 'S&P 500 Earnings Yield';
    } else if (normalized === '/market/sp500-pe-ratio-forward-estimate') {
      resolvedUrl = 'https://www.gurufocus.com/economic_indicators/6061/sp-500-pe-ratio-with-forward-estimate';
      resolvedTitle = 'S&P 500 PE Ratio with Forward Estimate';
    } else if (normalized === '/market/sp500-pe-ratio') {
      resolvedUrl = 'https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio';
      resolvedTitle = 'S&P 500 PE Ratio';
    }
  }

  if (!resolvedUrl) return null;

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View official source on GuruFocus (${resolvedTitle})`}
      className="group fixed bottom-5 right-5 z-50 flex items-center"
    >
      {/* Tooltip / mini-card on desktop hover */}
      <span
        className="pointer-events-none mr-3 hidden max-w-0 overflow-hidden whitespace-nowrap rounded-md px-0 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:max-w-xs group-hover:px-4 group-hover:opacity-100 sm:block"
        style={{ backgroundColor: 'rgba(33, 37, 41, 0.95)' }}
      >
        View Official Source on GuruFocus
      </span>

      {/* Circular button with GuruFocus blue theme */}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-white/20"
        style={{ backgroundColor: '#0052cc' }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
