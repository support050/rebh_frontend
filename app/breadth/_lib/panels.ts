/**
 * Shared panel builders for the breadth pages.
 *
 * `idxPanel` reproduces the reference dashboard's `IDX()` helper: the standard
 * TASI head panel (candles when zoomed, line otherwise) with the regime strip,
 * letting each page override the series / event markers / canary episodes.
 */
import type { EventDef, PanelDef, SeriesDef } from '../_engine/types';

export function idxPanel(
  opts: { events?: EventDef[]; episodes?: boolean; series?: SeriesDef[]; regimeStrip?: boolean } = {},
): PanelDef {
  return {
    title: 'TASI (candles when zoomed in; line otherwise)',
    height: 260,
    series: opts.series ?? [
      { key: 'tasi', type: 'candle', color: '--text', label: 'TASI' },
      { key: 'tasi', type: 'line', color: '--blue', label: 'TASI close', width: 1.2 },
    ],
    regimeStrip: opts.regimeStrip ?? true,
    episodes: opts.episodes,
    events: opts.events,
  };
}

/** The three hlines every Score-context panel uses (40 / 60 / 75 regime bands). */
export const SCORE_HLINES = [{ y: 40 }, { y: 60 }, { y: 75 }];

/**
 * Series keys every head (IDX) panel needs so the TASI line + zoomed candles
 * render. Spread into a page's key list alongside its own metric keys.
 */
export const IDX_KEYS = ['tasi', 'tasi_o', 'tasi_h', 'tasi_l'];
