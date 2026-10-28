/**
 * CR3 §2 — the ★ Custom Dashboard widget catalog.
 *
 * The reference renders every page at boot, so `regWidget` sees all ~95
 * elements immediately (template lines 208-217, 658-675). Next.js mounts one
 * route at a time, so this module registers the static chart pages' panels
 * eagerly (they are exported module-scope arrays) and mirrors the reference's
 * seventeen `dom(...)` widgets by id/title/group — the same first-wins registry
 * Stack.ts feeds when a page mounts, so dynamic (useMemo) pages such as
 * McClellan / Cycle / Library top up the catalog the first time they open.
 */
import { registerDomWidget, registerPanelWidget } from './widgets';
import { BREADTH_PAGES } from './pageMap';
import { OV_PANELS } from '../page';
import { PANELS as NHNL_PANELS } from '../nhnl/page';
import { PANELS as AD_PANELS } from '../ad/page';
import { PANELS as MA_PANELS } from '../ma/page';
import { PANELS as LEADERS_PANELS } from '../leaders/page';
import { PANELS as STOCKBEE_PANELS } from '../stockbee/page';
import { PANELS as CLASSIC_PANELS } from '../classic/page';
import { PANELS as CONCENTRATION_PANELS } from '../conc/page';
import { PANELS as BPI_PANELS } from '../bpi/page';
import { PANELS as SECTORS_PANELS } from '../sectors/page';
import { PANELS as SIGNALS_PANELS } from '../signals/page';
import { MAIN_PANELS as WIDGET_PANELS } from '../widget/page';

const NAME: Record<string, string> = Object.fromEntries(BREADTH_PAGES.map((p) => [p.id, p.name]));

const PAGE_PANELS: Array<[string, typeof OV_PANELS]> = [
  ['overview', OV_PANELS],
  ['widget', WIDGET_PANELS],
  ['leaders', LEADERS_PANELS],
  ['nhnl', NHNL_PANELS],
  ['ma', MA_PANELS],
  ['ad', AD_PANELS],
  ['stockbee', STOCKBEE_PANELS],
  ['classic', CLASSIC_PANELS],
  ['bpi', BPI_PANELS],
  ['sectors', SECTORS_PANELS],
  ['conc', CONCENTRATION_PANELS],
  ['signals', SIGNALS_PANELS],
];

/** Reference dom() registrations (template lines 661-675), id · title · group verbatim. */
const DOM_WIDGETS: Array<[string, string, string]> = [
  ['kpi:overview', 'Headline cards — score · regime · TASI · families · overlay · NH/NL · template', 'Overview'],
  ['q5', 'The five questions', 'Overview'],
  ['leaders:card', 'Leaders card (top 12 by RS)', 'Overview'],
  ['summary:ar', 'Daily read (Arabic one-liner)', 'Overview'],
  ['widget:tv', 'Market Breadth widget (6 gauges + stages)', 'Widget'],
  ['kpi:leaders', 'Trend Template cards', 'Leaders'],
  ['tbl:leaders', 'Leaders table (template pass, by RS)', 'Leaders'],
  ['tbl:canary', 'Canary episodes table', 'New Highs / New Lows'],
  ['tbl:stockbee', 'Stockbee Monitor table (15 days, coloured)', 'Stockbee'],
  ['theme', 'Theme Tracker', 'Sectors'],
  ['ranks', 'Industry Ranks', 'Sectors'],
  ['heat', 'Sector health heatmap (30 days)', 'Sectors'],
  ['tbl:sigstats', 'Rule statistics (n · returns · hit · status)', 'Signals'],
  ['tbl:signals', 'Signal log', 'Signals'],
  ['tbl:lib', 'Classic library verdicts', 'Classic library'],
  ['kpi:bpi', 'Bullish Percent cards', 'Bullish Percent'],
  ['thr', 'TASI thresholds table', 'Thresholds'],
];

let done = false;

/** Idempotent: register every static panel + dom widget once (first-wins). */
export function registerCatalog(): void {
  if (done) return;
  done = true;
  PAGE_PANELS.forEach(([pageId, panels]) => {
    panels.forEach((p, k) => {
      if (!p.mini) registerPanelWidget(`panel:${pageId}:${k}`, p.title || `panel ${k}`, NAME[pageId] || pageId, p);
    });
  });
  DOM_WIDGETS.forEach(([id, title, group]) => registerDomWidget(id, title, group));
}
