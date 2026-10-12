'use client';
/**
 * /breadth/thresholds — TASI extreme readings & the engine method.
 * Port of the reference #p-thr: the percentile threshold table (from /meta)
 * plus the one-screen method note. No canvas stack — this is the audit page.
 */
import React from 'react';
import { BreadthView, PageHead } from '../_lib/BreadthView';
import { useBreadthStore } from '../_lib/store';
import { fmt } from '../_engine/helpers';

function ThresholdsBody() {
  const meta = useBreadthStore((s) => s.meta);
  const today = useBreadthStore((s) => s.today);
  const status = useBreadthStore((s) => s.status);

  const rows = meta?.thresholds ?? [];

  return (
    <div className="space-y-3">
      <PageHead
        title="TASI extreme readings (percentiles 2007–2026) vs US reference values"
        note="Every threshold is TASI's own percentile — US market levels do not transfer to a ~250-stock market."
      />

      <div className="rounded-lg overflow-auto border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', maxHeight: 520 }}>
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
              {['Indicator', 'Excessive pessimism (2%)', '(5%)', 'Excessive optimism (95%)', '(98%)', 'US reference / note'].map((h) => (
                <th key={h} className="sticky top-0 px-2 py-1.5 text-right font-semibold" style={{ borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center" style={{ color: 'var(--text2)' }}>
                  {status === 'error' ? 'Failed to load thresholds.' : 'loading…'}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.indicator} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-2 py-1 text-left font-semibold" style={{ color: 'var(--text)' }}>{r.indicator}</td>
                  <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--down)' }}>{fmt(r.p2, 1)}</td>
                  <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--down)' }}>{fmt(r.p5, 1)}</td>
                  <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--up)' }}>{fmt(r.p95, 1)}</td>
                  <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--up)' }}>{fmt(r.p98, 1)}</td>
                  <td className="px-2 py-1 text-left" style={{ color: 'var(--text2)' }}>{r.us}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className="rounded-lg border px-4 py-3 text-[13px] leading-7"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text2)' }}
      >
        <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>Method (one screen)</h2>
        <p><b>Universe:</b>{` TASI main-market common stocks (${today?.n_universe ?? '—'} today), no REITs/NOMU/ETFs; delisted names kept for their history; adjusted prices; suspension days excluded (never "unchanged"); a stock enters a metric only after its full lookback. Official TASI from 2007, own Equal-Weight TASI from 2002.`}</p>
        <p><b>Score</b>{` = ⅓ participation (%>200DMA, %>50DMA, High-Low Index) + ⅓ advance/decline (McClellan, A/D line 20d change) + ⅓ sectors (% healthy, median score), each metric percentile-ranked against its own trailing 5 years (no look-ahead). Weights were fitted in-sample and then rejected by walk-forward — equal weights won; concentration and divergence families were dropped from the score (they reversed the quintile spread) and kept as context.`}</p>
        <p><b>Regimes:</b>{` 40/60/75 on a 5-day EMA of the score, hysteresis 8, min 5 days. Washout = score ≤45 and oversold overlay ≥75 (TRIN-10, 4% ratio, panic days, 95% down day, recent thrust).`}</p>
        <p><b>Validation:</b>{` in-sample 2008–2017, out-of-sample 2018–2026, yearly walk-forward 2014–2026; 28 unit tests; Excel workbooks reproduce every value by formula.`}</p>
      </div>
    </div>
  );
}

export default function ThresholdsPage() {
  return (
    <BreadthView keys={['tasi']}>
      <ThresholdsBody />
    </BreadthView>
  );
}
