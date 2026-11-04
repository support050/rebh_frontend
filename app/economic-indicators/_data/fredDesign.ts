/**
 * fredDesign.ts — FRED design tokens, measured from the LIVE St. Louis Fed
 * series pages, NOT assumed.
 *
 * Source of truth: backend/output/fred_design_spec_v2.json, produced by
 * backend/scripts/extract_fred_design.py (Playwright getComputedStyle +
 * getBoundingClientRect on fred.stlouisfed.org/series/{ID}). Every value below
 * is copied from that JSON; change the JSON, not this file.
 *
 * WHAT WAS MEASURED (identical across UNRATE / PAYEMS / IC4WSA):
 *   - page/body font stack : "Roboto, verdana, arial, sans-serif"
 *   - body font-size       : 16px
 *   - body text color      : rgb(33, 37, 41)  (#212529)
 *   - page background      : rgb(255, 255, 255) (white)
 *   - link / accent color  : rgb(0, 102, 204)  (#0066cc)  <-- measured, not #005ea2
 *   - .series-title        : 16px / weight 700 / line-height 24px / color #000
 *                            padding 10px 0, white bg, no border/radius/shadow
 *   - observations box     : NOW the visible desktop box (text-anchor, since
 *                            FRED ids differ from our guesses). Container is
 *                            div.series-meta-row.row.series-attributes —
 *                            FULL-WIDTH WHITE (rgb 255,255,255), 1320x131,
 *                            NO border / NO radius / NO padding.
 *                            Box text: 16px / 400 / line-height 24px / #000.
 *   - chart container      : NOW captured — .highcharts-container, 1320x465,
 *                            transparent bg, no border. SVG stroke is not a
 *                            CSS-computed value, so the measured accent (#0066cc)
 *                            is used for the chart line (not the brief's #004c97).
 *
 * CORRECTION vs the brief: the mission described a "distinct light grey
 * background" Observations box. The live DOM has NO grey — the container is
 * plain white. We replicate the measured white row rather than fabricate grey.
 */
import type { CSSProperties } from 'react';

// Measured stack, but the actual Roboto face is provided by next/font in
// app/layout.tsx (exposed as --font-roboto); the literal names are fallbacks.
export const FRED_FONT = 'var(--font-roboto), Roboto, verdana, arial, sans-serif';

export const FRED_COLORS = {
  pageBg: '#ffffff',
  bodyText: 'rgb(33, 37, 41)', // #212529 — measured body color
  heading: '#000000',           // .series-title + observations color — measured
  link: '#0066cc',              // measured FRED link/accent
  chartLine: '#0066cc',         // measured accent (SVG stroke not CSS-computable)
  metaRowBg: '#ffffff',         // measured observations container bg — WHITE, not grey
  titleRule: '#0066cc',         // blue rule under the series title (from screenshot)
  codeGrey: '#8a8a8a',          // the grey "(UNRATE)" after the title (from screenshot)
  recessionBand: '#c9c9c9',     // grey shaded U.S. recession bands (screenshot)
} as const;

// Measured chart container height (.highcharts-container = 465px tall).
export const FRED_CHART_HEIGHT = 465;

/** .series-title — measured: 16px/700, line-height 24px, color #000, padding 10px 0, white bg. */
export const fredTitleStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
  backgroundColor: FRED_COLORS.pageBg,
  paddingTop: '10px',
  paddingBottom: '10px',
  paddingLeft: 0,
  paddingRight: 0,
  margin: 0,
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
};

/** Observations metadata block — measured visible box: 16px/400, lh 24px, #000, white. */
export const fredMetaStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
  backgroundColor: FRED_COLORS.metaRowBg,
  margin: 0,
  padding: 0,
  border: 'none',
};

/**
 * The full-width Observations row container. Measured: div.series-attributes is
 * a plain white row (1320x131) with NO border / radius / padding. We keep it
 * edge-to-edge white and let the grid gap do the spacing — no invented grey.
 */
export const fredMetaRowStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  width: '100%',
  backgroundColor: FRED_COLORS.metaRowBg,
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
};

/** Small uppercase field label (e.g. "OBSERVATIONS", "UNITS"). */
export const fredLabelStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '11px',
  fontWeight: 400,
  lineHeight: '14px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: FRED_COLORS.bodyText,
};

/** Value text under a label — measured meta base (16px/400) with sane line-height. */
export const fredValueStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '20px',
  color: FRED_COLORS.heading,
};

/** The latest-observation headline (e.g. "Sep 2026: 4.2") — bold, measured accent for the value. */
export const fredObservationStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
};

/** Chart controls row — measured 16px/400, line-height 24px. */
export const fredControlsStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
};

/** Inline FRED-style link (measured #0066cc). */
export const fredLinkStyle: CSSProperties = {
  color: FRED_COLORS.link,
  textDecoration: 'none',
};

/** Normal-case bold field label ("Units:", "Frequency:") — matches FRED, NOT uppercase. */
export const fredFieldLabelStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
};

/** Plain 16px/400 metadata line (Updated, Next Release, values). */
export const fredFieldLineStyle: CSSProperties = {
  fontFamily: FRED_FONT,
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: FRED_COLORS.heading,
};

/**
 * NBER U.S. recession peak-to-trough months (public-domain reference dates),
 * used to draw the grey shaded bands exactly like FRED's default graph.
 */
export const NBER_RECESSIONS: { start: string; end: string }[] = [
  { start: '1948-11-01', end: '1949-10-01' },
  { start: '1953-07-01', end: '1954-05-01' },
  { start: '1957-08-01', end: '1958-04-01' },
  { start: '1960-04-01', end: '1961-02-01' },
  { start: '1969-11-01', end: '1970-11-01' },
  { start: '1973-11-01', end: '1975-03-01' },
  { start: '1980-01-01', end: '1980-07-01' },
  { start: '1981-07-01', end: '1982-11-01' },
  { start: '1990-07-01', end: '1991-03-01' },
  { start: '2001-03-01', end: '2001-11-01' },
  { start: '2007-12-01', end: '2009-06-01' },
  { start: '2020-02-01', end: '2020-04-01' },
];
