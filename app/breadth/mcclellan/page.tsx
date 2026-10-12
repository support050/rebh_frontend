'use client';
/**
 * /breadth/mcclellan — McClellan Oscillator & Summation (ratio-adjusted).
 * Port of the reference #mc-stack. Every band is a TASI percentile pulled from
 * /meta thresholds (US levels do not transfer to a 250-stock market), so the
 * panels rebuild once meta arrives.
 */
import React, { useMemo } from 'react';
import { BreadthView, RangeToolbar, StackMount, PageHead } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import type { PanelDef } from '../_engine/types';

const HEAD = idxPanel({
  events: [
    { key: 'mc_bear', color: '--orange', pos: 'top' },
    { key: 'mc_bull', color: '--aqua' },
  ],
});

const KEYS = [...IDX_KEYS, 'mcclellan_osc', 'mcclellan_sum', 'rana'];

function McClellanBody() {
  const meta = useBreadthStore((s) => s.meta);

  const panels = useMemo<PanelDef[]>(() => {
    const thO = meta?.thresholds.find((r) => r.indicator.startsWith('McClellan Oscillator'));
    const thS = meta?.thresholds.find((r) => r.indicator.startsWith('McClellan Summation'));
    const o95 = thO?.p95 ?? 85, o5 = thO?.p5 ?? -85, o98 = thO?.p98 ?? 130, o2 = thO?.p2 ?? -130;
    const s95 = thS?.p95 ?? 4000, s5 = thS?.p5 ?? -4000, s98 = thS?.p98 ?? 7000, s2 = thS?.p2 ?? -7000;
    return [
      HEAD,
      {
        title: 'McClellan Oscillator',
        height: 170,
        series: [{ key: 'mcclellan_osc', type: 'hist', color: '--blue', label: 'Oscillator' }],
        zero: true,
        zones: [
          { from: o95, to: 400, color: '--zone-hi' },
          { from: -400, to: o5, color: '--zone-lo' },
        ],
        hlines: [
          { y: o98, color: '--red', label: `${o98} (98th)` },
          { y: o2, color: '--aqua', label: `${o2} (2nd)` },
        ],
      },
      {
        title: 'McClellan Summation Index — bands at TASI percentiles',
        height: 150,
        series: [{ key: 'mcclellan_sum', type: 'area', color: '--violet', label: 'Summation' }],
        zero: true,
        zones: [
          { from: s95, to: 1e9, color: '--zone-hi' },
          { from: -1e9, to: s5, color: '--zone-lo' },
        ],
        hlines: [
          { y: s95, color: '--red', label: `${s95} (95th)` },
          { y: s5, color: '--aqua', label: `${s5} (5th)` },
          { y: s98, color: '--red', label: `${s98} (98th)` },
          { y: s2, color: '--aqua', label: `${s2} (2nd)` },
        ],
        events: [
          { key: 'mc_bear', color: '--orange', pos: 'top' },
          { key: 'mc_bull', color: '--aqua' },
        ],
      },
      {
        title: 'RANA — 1000·(A−D)/(A+D)',
        height: 110,
        series: [{ key: 'rana', type: 'hist', color: '--blue', label: 'RANA' }],
        zero: true,
      },
    ];
  }, [meta]);

  return (
    <div className="space-y-3">
      <PageHead
        title="McClellan Oscillator & Summation (ratio-adjusted)"
        note="RANA = 1000·(A−D)/(A+D); Oscillator = EMA19 − EMA39; Summation = cumulative oscillator. TASI extremes (2007–2026 percentiles): the Oscillator 5/95 and 2/98 bands, the Summation 5/95 bands — US market levels do not transfer to a 250-stock market, so every band here is a TASI percentile. Above +100 on TASI has been an exhaustion zone (−1.4% / 60d); below −100 an oversold bounce (+4.4% / 60d). Divergence markers (McClellan method): ▼ orange = TASI at a 60-day high while the Summation Index fails to make its own high (bearish, &quot;complex top&quot;); ▲ aqua = TASI at a 60-day low while the Summation holds above its low (bullish). Auto-detected, one per 20 days; on TASI these are context (walk-forward showed no stand-alone edge), not sell signals."
      />
      <RangeToolbar />
      <StackMount panels={panels} />
    </div>
  );
}

export default function McClellanPage() {
  return (
    <BreadthView keys={KEYS}>
      <McClellanBody />
    </BreadthView>
  );
}
