'use client';

import { QS_COLORS } from '../_data/ratePageDesign';

/**
 * Source attribution line rendered at the bottom of every /interest-rate card.
 * The QuikStrike tool signs its own panels with "Powered by QuikStrike®" in the
 * footer (seen in the captured cme_probabilities.png), so the CME variant keeps
 * that wording and adds the data-credit line the licence asks for.
 */
export default function RateSourceAttribution({
  source,
  detail,
}: {
  source: 'cme' | 'investing';
  /** e.g. "Data as of 31 Oct 2026 04:49:50 CT" — whatever the scrape recorded. */
  detail?: string | null;
}) {
  const cme = source === 'cme';
  const url = cme
    ? 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html'
    : 'https://www.investing.com/rates-bonds/eurodollar-futures';
  const label = cme ? 'CME Group' : 'Investing.com';

  return (
    <div
      className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
      style={{ fontFamily: 'arial, helvetica, clean, sans-serif', fontSize: 11, color: QS_COLORS.axisLabel }}
    >
      <span>
        Source: <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: QS_COLORS.vtabLink, textDecoration: 'none' }}>{label}</a>
        {cme ? ' — market data courtesy of CME Group.' : ' — Eurodollar Futures.'}
      </span>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
