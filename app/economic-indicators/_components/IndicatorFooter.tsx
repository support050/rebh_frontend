import React from 'react';
import { IndicatorMetadata } from '../_data/indicatorMetadata';
import { FRED_FONT, FRED_COLORS, fredLinkStyle } from '../_data/fredDesign';

interface IndicatorFooterProps {
  metadata: IndicatorMetadata;
  /** Collapsed when the "Observations" toggle in the header is closed. */
  open?: boolean;
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

const labelStyle: React.CSSProperties = {
  fontFamily: FRED_FONT,
  fontWeight: 700,
  fontSize: 15,
  color: FRED_COLORS.heading,
};
const valueStyle: React.CSSProperties = {
  fontFamily: FRED_FONT,
  fontWeight: 400,
  fontSize: 15,
  color: FRED_COLORS.bodyText,
};

/**
 * FRED "Notes" panel (matches the live page): bold inline labels — Source,
 * Release, Units, Frequency, Notes, Suggested Citation — with external-link
 * icons on the linked values. Rendered on plain white, no grey card.
 */
export default function IndicatorFooter({ metadata, open = true }: IndicatorFooterProps) {
  if (!open) return null;

  return (
    <div
      style={{
        backgroundColor: FRED_COLORS.pageBg,
        fontFamily: FRED_FONT,
        color: FRED_COLORS.bodyText,
        padding: '8px 0 24px',
      }}
    >
      <h2
        style={{
          fontFamily: FRED_FONT,
          fontSize: 18,
          fontWeight: 700,
          color: FRED_COLORS.heading,
          paddingBottom: 6,
          borderBottom: '1px solid #e2e2e2',
          marginBottom: 16,
        }}
      >
        Notes
      </h2>

      <div style={{ display: 'grid', gap: 10, fontSize: 15 }}>
        {/* Source + Release on one row, like FRED */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
          <div>
            <span style={labelStyle}>Source: </span>
            {metadata.sourceLink ? (
              <a href={metadata.sourceLink} target="_blank" rel="noopener noreferrer" style={fredLinkStyle}>
                {metadata.source}
                <ExternalLinkIcon />
              </a>
            ) : (
              <span style={valueStyle}>{metadata.source}</span>
            )}
          </div>
          {metadata.releaseTitle && (
            <div>
              <span style={labelStyle}>Release: </span>
              {metadata.releaseLink ? (
                <a href={metadata.releaseLink} target="_blank" rel="noopener noreferrer" style={fredLinkStyle}>
                  {metadata.releaseTitle}
                  <ExternalLinkIcon />
                </a>
              ) : (
                <span style={valueStyle}>{metadata.releaseTitle}</span>
              )}
            </div>
          )}
        </div>

        <div>
          <span style={labelStyle}>Units: </span>
          <span style={valueStyle}>{metadata.units}</span>
        </div>

        <div>
          <span style={labelStyle}>Frequency: </span>
          <span style={valueStyle}>{metadata.frequency}</span>
        </div>

        {metadata.notes && (
          <div>
            <div style={labelStyle}>Notes:</div>
            <p style={{ ...valueStyle, margin: '4px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {metadata.notes}
            </p>
          </div>
        )}

        {metadata.suggestedCitation && (
          <div>
            <div style={labelStyle}>Suggested Citation:</div>
            <p style={{ ...valueStyle, margin: '4px 0 0', lineHeight: 1.5 }}>
              {metadata.suggestedCitation}
            </p>
          </div>
        )}
      </div>

      {/* ── Mandatory FRED API attribution & disclaimer ── */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 12,
          borderTop: '1px solid #e2e2e2',
          fontSize: 12,
          color: '#6b6b6b',
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: 0 }}>
          Source: {metadata.source}, via FRED®, Federal Reserve Bank of St. Louis.
          {metadata.fredLink && (
            <>
              {' '}
              <a href={metadata.fredLink} style={fredLinkStyle} target="_blank" rel="noopener noreferrer">
                {metadata.fredLink}
              </a>
            </>
          )}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          This product uses the FRED® API but is not endorsed or certified by the
          Federal Reserve Bank of St. Louis.
        </p>
      </div>
    </div>
  );
}
