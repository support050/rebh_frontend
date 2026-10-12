'use client';
/**
 * Admin — System Map (Runbook).
 *
 * What this page is: a read-only map of every live subsystem — the pages it
 * serves, the scripts that feed it, the tables they write, and whether those
 * ran and are fresh *right now*. Everything shown comes from
 * backend/app/system_registry.py joined with job_runs and the tables themselves.
 *
 * What this page is not: a kill panel. The only action is "Run now", which
 * merely asks the backend to start a job it has already declared runnable — the
 * registry claims nothing the code was not verified to do, and the "Check it
 * yourself" panel exists so an admin never has to take a green dot on faith.
 *
 * Client conventions reused here (nothing new installed): ProtectedRoute for the
 * UX gate (FastAPI get_current_admin is the real boundary), apiClient/authFetch
 * for the request, useSWR for polling, next-themes' `html.dark` for colours.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  SystemMapService,
  type SystemMapDetail,
  type SystemMapListResponse,
  type SystemMapSummary,
} from '@/lib/services/admin';
import {
  ChecksPanel,
  EmptyState,
  IssuesPanel,
  JobsPanel,
  LoadingSkeleton,
  SystemHeaderPanel,
  TablesPanel,
} from './_lib/panels';
import { STATUS_LABEL, clockTime } from './_lib/format';
import { StatusDot } from './_lib/ui';
import './system-map.css';

const LIST_PATH = '/api/admin/system-map/systems';
/** Matches CACHE_TTL_SECONDS in backend/app/api/routes/system_map.py. */
const REFRESH_MS = 60_000;
/** Relative labels ("3h ago") are re-rendered on this tick, independent of fetches. */
const CLOCK_MS = 30_000;

const LEGEND = ['ok', 'late', 'bad', 'unknown', 'untracked'] as const;

export default function SystemMapPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Runbook />
    </ProtectedRoute>
  );
}

function Runbook() {
  const [selected, setSelected] = useState<string | null>(null);
  const [urlRead, setUrlRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const fetcher = useCallback(<T,>(path: string) => SystemMapService.fetcher<T>(path), []);

  const {
    data: listData,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR<SystemMapListResponse>(LIST_PATH, fetcher, {
    refreshInterval: REFRESH_MS,
    keepPreviousData: true,
  });

  const systems = useMemo<SystemMapSummary[]>(() => listData?.systems ?? [], [listData]);

  // ?system= is read after mount, never during the first render: reading it on the
  // server would render a different system than the client hydrates into.
  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get('system'));
    setUrlRead(true);
  }, []);

  // Nothing in the URL → the first system, without rewriting the address bar for it.
  const activeId = urlRead ? selected ?? systems[0]?.id ?? null : null;

  const detailPath = activeId ? `/api/admin/system-map/systems/${activeId}` : null;
  const {
    data: detail,
    error: detailError,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR<SystemMapDetail>(detailPath, fetcher, {
    refreshInterval: REFRESH_MS,
    keepPreviousData: true,
  });

  const registryFile = listData?.registry_file ?? detail?.registry_file ?? 'backend/app/system_registry.py';

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(id);
  }, []);

  const select = useCallback((id: string) => {
    setSelected(id);
    setManualError(null);
    // replaceState, not the router: the panels swap in place and Back should leave
    // the runbook, not replay every system the admin clicked through.
    const next = new URLSearchParams(window.location.search);
    next.set('system', id);
    window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`);
  }, []);

  // Shareable URL even when a system was picked by default rather than clicked.
  useEffect(() => {
    if (urlRead && activeId && !selected) {
      const next = new URLSearchParams(window.location.search);
      next.set('system', activeId);
      window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`);
    }
  }, [urlRead, activeId, selected]);

  const forceRefresh = useCallback(async () => {
    if (!activeId) return;
    setRefreshing(true);
    setManualError(null);
    try {
      // refresh=true skips the server's 60s snapshot, so "Refresh" really re-probes.
      const [list, one] = await Promise.all([
        SystemMapService.getSystems(true),
        SystemMapService.getSystem(activeId, true),
      ]);
      await mutateList(list, false);
      await mutateDetail(one, false);
      setNow(Date.now());
    } catch (e) {
      setManualError(readMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [activeId, mutateDetail, mutateList]);

  const error = manualError ?? readMessage(listError) ?? readMessage(detailError);
  const updatedAt = detail?.generated_at ?? listData?.generated_at ?? null;
  const showSkeleton = (listLoading && !listData) || (detailLoading && !detail);

  return (
    <div dir="ltr" className="sysmap-root">
      <div className="sm-wrap">
        <header className="sm-topbar">
          <div>
            <h1 className="sm-title">System Map — Runbook</h1>
            <p className="sm-subtitle">
              <Link href="/admin" className="sm-mono" title="Back to the admin dashboard">
                /admin
              </Link>{' '}
              · admin only · read-only · sourced from{' '}
              <span className="sm-mono">{registryFile}</span> joined with{' '}
              <span className="sm-mono">job_runs</span> and live table probes
            </p>
          </div>
          <div className="sm-actions">
            <span className="sm-updated">
              Updated at {clockTime(updatedAt)} · auto every {Math.round(REFRESH_MS / 1000)}s
            </span>
            <button
              type="button"
              className="sm-btn"
              onClick={forceRefresh}
              disabled={refreshing || !activeId}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="sm-legend" style={{ marginBottom: 14 }}>
          {LEGEND.map((s) => (
            <span key={s} className="sm-pill" data-s={s}>
              <StatusDot status={s} />
              {STATUS_LABEL[s]}
            </span>
          ))}
          <span className="sm-panel-hint">
            A system's health is the worst verdict among its tracked jobs and measurable tables.
          </span>
        </div>

        {error ? (
          <div className="sm-errorbanner" role="alert" style={{ marginBottom: 14 }}>
            <span>
              <strong>Could not read the system map.</strong> {error}
            </span>
            <button type="button" className="sm-btn" onClick={forceRefresh} disabled={refreshing}>
              Retry
            </button>
          </div>
        ) : null}

        {listData && systems.length === 0 ? (
          <EmptyState
            text={`No system is registered. Add an entry to ${registryFile} and reload — this page holds no data of its own.`}
          />
        ) : (
          <div className="sm-grid">
            <Sidebar systems={systems} activeId={activeId} onSelect={select} />

            <main
              className="sm-main"
              id="sm-runbook-panel"
              role="tabpanel"
              aria-labelledby={activeId ? `sm-tab-${activeId}` : undefined}
            >
              {showSkeleton ? (
                <LoadingSkeleton />
              ) : !detail || detail.id !== activeId ? (
                <EmptyState
                  text={
                    detailError
                      ? `System "${activeId ?? ''}" could not be loaded — ${readMessage(detailError)}`
                      : 'Select a system on the left.'
                  }
                />
              ) : (
                <>
                  {detail.unavailable ? (
                    <div className="sm-state" role="status">
                      <strong>Live checks unavailable.</strong> {detail.unavailable} — the registry
                      description below is shown without any health verdict.
                    </div>
                  ) : null}
                  {detail.build_error ? (
                    <div className="sm-state" role="status">
                      <strong>The last snapshot build reported an error.</strong>{' '}
                      <span className="sm-mono">{detail.build_error}</span>
                    </div>
                  ) : null}
                  <SystemHeaderPanel sys={detail} />
                  {/* onRerun: after a manual run finishes, force a fresh snapshot
                      instead of waiting up to 60s for the SWR poll. */}
                  <JobsPanel jobs={detail.jobs} now={now} onRerun={forceRefresh} />
                  <TablesPanel tables={detail.tables} />
                  <IssuesPanel issues={detail.issues} />
                  <ChecksPanel checks={detail.checks_sql} globalChecks={detail.global_checks_sql ?? []} />
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── sidebar ─────────────────────────────────────────────────────────────────
   A tablist, not a link list: the panels change in place, so arrow keys (plus
   Home/End) move the selection and roving tabindex keeps one stop in the tab order.
   ─────────────────────────────────────────────────────────────────────────── */
function Sidebar({
  systems,
  activeId,
  onSelect,
}: {
  systems: SystemMapSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    let next = e.key in step ? index + step[e.key] : undefined;
    if (next === undefined && e.key === 'Home') next = 0;
    if (next === undefined && e.key === 'End') next = systems.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    const clamped = (next + systems.length) % systems.length;
    onSelect(systems[clamped].id);
    refs.current[clamped]?.focus();
  };

  return (
    <aside className="sm-side">
      <div className="sm-side-head">Systems · {systems.length}</div>
      <div className="sm-nav" role="tablist" aria-orientation="vertical" aria-label="Registered systems">
        {systems.map((s, i) => {
          const active = s.id === activeId;
          const counts = describeCounts(s);
          return (
            <button
              key={s.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`sm-tab-${s.id}`}
              aria-selected={active}
              aria-controls="sm-runbook-panel"
              tabIndex={active ? 0 : -1}
              className="sm-navitem"
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              title={`${s.name} — ${s.blurb}`}
            >
              <StatusDot status={s.health} label={`${s.name}: ${STATUS_LABEL[s.health] ?? s.health}`} />
              <span className="sm-navlabel">
                {s.name}
                {!s.in_navbar ? <span className="sm-notinnav">not in navbar</span> : null}
              </span>
              <span className="sm-navmeta" aria-label={counts.label}>{counts.text}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

/** Sidebar badge: problems first, so a red number is what draws the eye. */
function describeCounts(s: SystemMapSummary): { text: string; label: string } {
  const bad = s.jobs_bad + s.tables_bad;
  const late = s.jobs_late + s.tables_late;
  if (bad) return { text: `${bad}✕`, label: `${bad} problem(s), ${late} late` };
  if (late) return { text: `${late}!`, label: `${late} late` };
  return { text: `${s.pages_count}p`, label: `${s.pages_count} pages, all healthy` };
}

/** Axios errors carry a status; 401/403 mean the admin session, not the map, failed. */
function readMessage(err: unknown): string | null {
  if (!err) return null;
  const e = err as { response?: { status?: number }; message?: string };
  if (e.response?.status === 403 || e.response?.status === 401) {
    return 'The backend rejected the request (this session is not an admin).';
  }
  return e.message ?? String(err);
}
