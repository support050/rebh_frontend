import React from 'react';
import { IndicatorMetadata } from '../_data/indicatorMetadata';
import {
  fredTitleStyle,
  fredFieldLabelStyle,
  fredFieldLineStyle,
  fredObservationStyle,
  fredMetaRowStyle,
  fredLinkStyle,
  FRED_COLORS,
} from '../_data/fredDesign';

interface IndicatorHeaderProps {
  metadata: IndicatorMetadata;
  /** Right-aligned controls column (range buttons, Edit Graph, date range, Download). */
  controls?: React.ReactNode;
}

/** Small FRED-style external-link glyph shown after linked text. */
function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', marginLeft: 4, verticalAlign: 'baseline' }}
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * FRED "Observations" header, laid out to match the live series page:
 *   [☆ Title (CODE)]  + blue rule
 *   [Observations / value / Updated / Next Release] [Units:] [Frequency:] [controls →]
 */
export default function IndicatorHeader({
  metadata,
  controls,
}: IndicatorHeaderProps) {
  // Format observation date by frequency (monthly -> "Sep 2026", else ISO date).
  const formatObservationDate = (dateStr: string | undefined, freq: string | undefined) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00Z');
      if (freq && freq.toLowerCase().includes('monthly')) {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const obsHeadline = metadata.observations
    ? `${formatObservationDate(metadata.observationDate, metadata.frequency)}: ${metadata.observations}`
    : '';

  // FRED splits a compound units string ("Percent, Seasonally Adjusted") across lines.
  const unitsLines = (metadata.units || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div style={{ backgroundColor: FRED_COLORS.pageBg }}>
      {/* Title row: ☆ + title + grey (CODE) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-label="Add to favorites"
          title="Add to favorites"
          style={{ color: FRED_COLORS.codeGrey, fontSize: 20, lineHeight: 1, cursor: 'pointer' }}
        >
          ☆
        </span>
        <h1 style={{ ...fredTitleStyle, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span>{metadata.title}</span>
          <span style={{ color: FRED_COLORS.codeGrey, fontWeight: 400, fontSize: 15 }}>
            ({metadata.code})
          </span>
        </h1>
      </div>

      {/* Blue rule under the title (measured from the live page) */}
      <div style={{ borderTop: `2px solid ${FRED_COLORS.titleRule}`, margin: '6px 0 16px' }} />

      {/* Metadata row: 4 columns divided by vertical rules (matches FRED exactly) */}
      <div
        style={{
          ...fredMetaRowStyle,
          display: 'grid',
          gridTemplateColumns: 'minmax(200px,1.35fr) minmax(150px,1fr) minmax(130px,0.95fr) minmax(280px,1.9fr)',
          alignItems: 'stretch',
        }}
      >
        {/* Col 1 — Observations (plain label, not interactive) + Updated + Next Release */}
        <div style={{ paddingRight: 24 }}>
          <div style={{ ...fredFieldLineStyle, color: FRED_COLORS.link, fontWeight: 700 }}>
            Observations
          </div>
          <div style={{ ...fredObservationStyle, marginTop: 6 }}>{obsHeadline}</div>
          {metadata.updated && (
            <div style={{ ...fredFieldLineStyle, marginTop: 6 }}>Updated: {metadata.updated}</div>
          )}
          {metadata.nextRelease && (
            <div style={{ ...fredFieldLineStyle, marginTop: 2 }}>
              Next Release Date:{' '}
              {metadata.releaseCalendarUrl ? (
                <a
                  href={metadata.releaseCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={fredLinkStyle}
                >
                  {metadata.nextRelease}
                  <ExternalLinkIcon />
                </a>
              ) : (
                metadata.nextRelease
              )}
            </div>
          )}
        </div>

        {/* Col 2 — Units */}
        <div style={{ borderLeft: '1px solid #e2e2e2', paddingLeft: 24, paddingRight: 24 }}>
          <div style={fredFieldLabelStyle}>Units:</div>
          {unitsLines.map((line, i) => (
            <div key={i} style={fredFieldLineStyle}>
              {line}
              {i < unitsLines.length - 1 ? ',' : ''}
            </div>
          ))}
        </div>

        {/* Col 3 — Frequency */}
        <div style={{ borderLeft: '1px solid #e2e2e2', paddingLeft: 24, paddingRight: 24 }}>
          <div style={fredFieldLabelStyle}>Frequency:</div>
          <div style={fredFieldLineStyle}>{metadata.frequency}</div>
        </div>

        {/* Col 4 — controls (rendered by the parent view) */}
        <div style={{ borderLeft: '1px solid #e2e2e2', paddingLeft: 24 }}>{controls}</div>
      </div>
    </div>
  );
}
