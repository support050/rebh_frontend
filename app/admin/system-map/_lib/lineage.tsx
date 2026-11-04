'use client';
/**
 * Page ↔ script lineage — the navbar walked section by section, page by page.
 *
 * Two directions, one payload (GET /api/admin/system-map/pages):
 *   · page → feeder scripts + the tables they write  ("what must run for this
 *     page to not be empty");
 *   · script → the pages that go stale when it stops ("who does this break?").
 *
 * The MENU labels come from the real sidebar component (components/MarketSidebar.tsx),
 * never from a copy: if a navbar page has no lineage the panel says so instead of
 * pretending the page needs no data. Feeders marked ● are named by the table entry
 * itself; ○ means the table declared no pages so its whole system claims them —
 * coarser, and deliberately shown as coarse.
 */
import { useState } from 'react';
import {
  type LineagePage,
  type LineageScript,
  type MapStatus,
  type PageLineageResponse,
} from '@/lib/services/admin';
import { menuItems as MARKET_NAV } from '@/components/MarketSidebar';
import { CopyButton, StatusPill } from './ui';

type NavLeaf = { section: string; label: string; href: string };

const NAV_LEAVES: NavLeaf[] = MARKET_NAV.flatMap((s) =>
  (s.items ?? []).map((i) => ({ section: s.en, label: i.en, href: i.href })),
);

const VIA_MARK: Record<string, string> = { table: '●', system: '○' };

function FeederChips({ page }: { page: LineagePage | undefined }) {
  if (!page) return null;
  if (!page.jobs.length) {
    return (
      <span className="sm-subtle">
        no feeder script registered
        {page.no_writer_tables.length
          ? ` — reads ${page.no_writer_tables.length} table(s) with no writer (reference / seeded / user data)`
          : ' — static page, nothing to run'}
      </span>
    );
  }
  return (
    <>
      {page.jobs.map((j) => (
        <span key={j.job_name} className="sm-cmd" style={{ gap: 5, maxWidth: 'none' }}
          title={`${j.file}\n${j.expected_schedule}\nlast run ${j.last_run_at ?? 'never'} (${j.last_run_status ?? '—'})${j.via === 'system' ? '\n○ inferred from the owning system, not named by the table' : ''}`}>
          <StatusPill status={j.status as MapStatus} />
          <span className="sm-mono">{j.job_name}</span>
          <span className="sm-cmdmore">{VIA_MARK[j.via]} {j.cadence}</span>
        </span>
      ))}
    </>
  );
}

function PageRow({ page, label, href, registryFile }: {
  page: LineagePage | undefined;
  label: string;
  href: string;
  registryFile: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm-panel-body" style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {page ? <StatusPill status={page.status} /> : <span className="sm-cmdmore">⚠ no lineage</span>}
        <a className="sm-mono" href={href} target="_blank" rel="noreferrer">{href}</a>
        <span className="sm-subtle">{label}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="sm-cmdmore">{page ? `${page.jobs.length} script(s) · ${page.tables.length} table(s)` : '—'}</span>
          {page && page.tables.length > 0 ? (
            <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setOpen((v) => !v)}>
              {open ? 'Hide tables' : 'Tables'}
            </button>
          ) : null}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        <FeederChips page={page} />
        {page ? null : (
          <span className="sm-cmdmore">
            ⚠ this navbar page has no lineage in {registryFile ?? 'the registry'} — either it reads
            no registered table, or the registry was never updated when it was added
          </span>
        )}
      </div>
      {open && page ? (
        <div className="sm-cmdlist" style={{ marginTop: 8 }}>
          {page.tables.map((t) => (
            <div key={`${t.system_id}:${t.table}`} className="sm-cmdlist-row">
              <span className="sm-cmdlabel">{VIA_MARK[t.via]}</span>
              <span className="sm-mono">{t.table}</span>
              <span className="sm-cmdmore" style={{ marginLeft: 'auto' }}>
                {t.source_job ? `← ${t.source_job}` : 'no writer'} ·{' '}
                {t.measurable ? `newest ${t.latest ?? '—'}${t.lag_trading_days != null ? ` (${t.lag_trading_days}d)` : ''}` : 'no date column'}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScriptRow({ s }: { s: LineageScript }) {
  const cli = s.commands[0]?.cli;
  return (
    <div className="sm-panel-body" style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StatusPill status={s.status} />
        <span className="sm-mono">{s.job_name}</span>
        <span className="sm-cmdmore">{s.file}</span>
        <span className="sm-cmdmore" style={{ marginLeft: 'auto' }}>
          {s.pages.length} page(s) depend on it
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {s.pages.map((p) => (
          <a key={p} className="sm-cmdmore sm-mono" href={p} target="_blank" rel="noreferrer"
            title={`opens ${p}`}>{p}</a>
        ))}
        {!s.pages.length ? <span className="sm-cmdmore">no page registered — job feeds tables no page names</span> : null}
      </div>
      {cli ? (
        <span className="sm-cmd" style={{ marginTop: 8, display: 'flex' }}>
          <code className="sm-cmdline" title={`cwd backend/\n${cli}`}>{cli}</code>
          <CopyButton text={cli} />
        </span>
      ) : null}
    </div>
  );
}

export function LineagePanel({ lineage }: { lineage?: PageLineageResponse }) {
  // No fetch of its own: the page's single /runbook request already carries the
  // lineage. Polling a second endpoint here queued it behind the snapshot build
  // for data the browser was holding anyway.
  const data = lineage;
  const [tab, setTab] = useState<'pages' | 'scripts'>('pages');

  const byPath = new Map((data?.pages ?? []).map((p) => [p.path, p]));
  const spinePaths = new Set(NAV_LEAVES.map((l) => l.href.split('?')[0]));
  const offSpine = (data?.pages ?? []).filter((p) => !spinePaths.has(p.path));
  const missing = NAV_LEAVES.filter((l) => !byPath.has(l.href.split('?')[0]));
  const scripts = [...(data?.scripts ?? [])].sort((a, b) => b.pages.length - a.pages.length);

  return (
    <section className="sm-panel" aria-labelledby="sm-panel-lineage" style={{ marginTop: 18 }}>
      <div className="sm-panel-head">
        <h3 id="sm-panel-lineage" className="sm-panel-title">Which page needs which script?</h3>
        <span className="sm-panel-hint">
          {data
            ? `${data.counts.pages} page(s) · ${data.counts.scripts} script(s) · from ${data.registry_file}`
            : 'from backend/app/system_registry.py'}
          {' · ● named by the table, ○ inferred from its system'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" className={`sm-btn ${tab === 'pages' ? 'sm-btn-primary' : ''}`} onClick={() => setTab('pages')}>
            Pages → scripts
          </button>
          <button type="button" className={`sm-btn ${tab === 'scripts' ? 'sm-btn-primary' : ''}`} onClick={() => setTab('scripts')}>
            Scripts → pages
          </button>
        </span>
      </div>

      {data ? null : (
        <div className="sm-panel-body sm-subtle">Lineage arrives with the runbook payload…</div>
      )}

      {data && tab === 'pages' ? (
        <>
          {MARKET_NAV.map((section) => {
            const leaves = NAV_LEAVES.filter((l) => l.section === section.en);
            if (!leaves.length) return null;
            return (
              <div key={section.en}>
                <div className="sm-panel-body" style={{ background: 'var(--bg-elevated)', padding: '6px 12px' }}>
                  <strong className="sm-cmdlabel">{section.en}</strong>{' '}
                  <a className="sm-mono sm-cmdmore" href={section.href}>{section.href}</a>
                </div>
                {leaves.map((l) => (
                  <PageRow key={l.href} href={l.href.split('?')[0]} label={l.label}
                    registryFile={data.registry_file}
                    page={byPath.get(l.href.split('?')[0])} />
                ))}
              </div>
            );
          })}

          {missing.length ? (
            <div className="sm-panel-body" style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
              <p className="sm-cmdlabel" style={{ color: 'var(--sm-late)' }}>
                {missing.length} navbar page(s) have NO lineage in the registry
              </p>
              <p className="sm-subtle">
                Either they read no registered table, or the registry page list was never updated
                when the page was added. Fix by naming the tables in{' '}
                <span className="sm-mono">{data.registry_file}</span>.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {missing.map((l) => <span key={l.href} className="sm-mono sm-cmdmore">{l.href}</span>)}
              </div>
            </div>
          ) : null}

          <details style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
            <summary className="sm-cmdlabel">
              Other registered pages ({offSpine.length}) — not under the Market Data sidebar
            </summary>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {offSpine.map((p) => (
                <span key={p.path} className="sm-mono sm-cmdmore"
                  title={`${p.jobs.map((j) => j.job_name).join(', ') || 'no feeder'}`}>
                  {p.path} ({p.jobs.length})
                </span>
              ))}
            </div>
          </details>
        </>
      ) : null}

      {data && tab === 'scripts' ? (
        scripts.map((s) => <ScriptRow key={s.job_name} s={s} />)
      ) : null}
    </section>
  );
}
