'use client';
/**
 * The five Runbook panels. One job each: render what the API already decided.
 * No verdict is computed here — status rules live in
 * backend/app/api/routes/system_map.py so the UI and any future CLI agree.
 * The one exception is the Run Now button below, which only *dispatches*: the
 * backend decides what is runnable and writes the job_runs row.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/axiosClient';
import type {
  MapCheckSql,
  MapJob,
  MapTable,
  SystemMapDetail,
} from '@/lib/services/admin';
import { SystemMapService } from '@/lib/services/admin';
import {
  ISSUE_LABEL,
  ISSUE_ORDER,
  ageBudget,
  exactTime,
  fmtInt,
  relTime,
} from './format';
import { CopyButton, StatusPill } from './ui';

/** Run Now polling: 5s apart, capped at 15 minutes so a tab cannot poll forever.
 *  engine_vintages alone needs ~6-7 min for the full 236-company universe —
 *  the old 3-min cap gave up mid-run and showed "Still running" beside a
 *  job that later reported OK (2026-10-13). */
const RUN_POLL_MS = 5000;
const RUN_POLL_TICKS = 180;

// Consecutive transient auth/network misses tolerated before we concede the
// session is truly gone. A 15-min access token expiring mid-run produces a
// single 401 that the axios interceptor heals by refreshing + retrying, so
// this streak only trips if refresh itself keeps failing (~5 min at 5s/tick).
const RUN_POLL_AUTH_GRACE = 60;

/** Statuses job_runs writes when a row closes. Anything else — 'running',
 *  'queued', or a null row the worker thread has not inserted yet — means the
 *  run is still in progress, so the button must stay disabled. */
const TERMINAL_RUN_STATUSES = new Set(['success', 'failed', 'error']);

/** True for errors that are *transient auth artefacts*, not a real job signal:
 *  401 (access token expired, refresh in flight), 403 (momentary during token
 *  rotation), or no response at all (network blip / request aborted mid-refresh).
 *  These must never be read as "the job finished". */
function isTransientAuthError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403 || status === undefined;
}

/* ════════════════════════════════════════════════════════════════════════════
   1 · System header — what this is, who built it, which pages read it
   ════════════════════════════════════════════════════════════════════════════ */
export function SystemHeaderPanel({ sys }: { sys: SystemMapDetail }) {
  return (
    <section className="sm-panel" aria-labelledby="sm-panel-header">
      <div className="sm-panel-body">
        <h2 id="sm-panel-header" className="sm-sysname">
          {sys.name}
          <StatusPill status={sys.health} />
          {sys.in_navbar ? (
            <span className="sm-tag">In navbar{sys.navbar_label ? ` · ${sys.navbar_label}` : ''}</span>
          ) : (
            <span className="sm-tag">Not in navbar</span>
          )}
        </h2>
        <p className="sm-blurb">{sys.blurb}</p>

        <dl className="sm-kv">
          <dt>Built by</dt>
          <dd>
            {sys.built.length === 0 ? (
              <span className="sm-subtle">Nothing in the registry for this system.</span>
            ) : (
              sys.built.map((b) => (
                <div className="sm-layer" key={`${b.layer}-${b.path}`}>
                  <span className="sm-tag">{b.layer}</span>
                  <span className="sm-path">{b.path}</span>
                  <span className="sm-desc">{b.description}</span>
                </div>
              ))
            )}
          </dd>

          <dt>Pages</dt>
          <dd>
            {sys.pages.length === 0 ? (
              <span className="sm-subtle">No pages registered.</span>
            ) : (
              <div className="sm-pagelist">
                {sys.pages.map((p) =>
                  // A path with a [param] is a route template, not a URL: linking it
                  // would 404, so it stays a plain tag and reads as a pattern.
                  p.includes('[') ? (
                    <span key={p} className="sm-pagetag" title="Route template — open a real symbol page to use it">
                      {p}
                    </span>
                  ) : (
                    <Link key={p} href={p} className="sm-pagetag" title={`Open ${p}`}>
                      {p}
                    </Link>
                  ),
                )}
              </div>
            )}
          </dd>
        </dl>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   2 · Jobs — "did they run today?"
   ════════════════════════════════════════════════════════════════════════════ */
export function JobsPanel({ jobs, now, onRerun }: {
  jobs: MapJob[];
  now: number;
  onRerun?: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const bad = jobs.filter((j) => j.status === 'bad').length;
  const late = jobs.filter((j) => j.status === 'late').length;
  // Verdicts the tables had to overrule — the ledger never saw those runs.
  const overtaken = jobs.filter((j) => j.superseded).length;

  return (
    <section className="sm-panel" aria-labelledby="sm-panel-jobs">
      <div className="sm-panel-head">
        <h3 id="sm-panel-jobs" className="sm-panel-title">Did they run today?</h3>
        <span className="sm-panel-hint">
          {jobs.length} job(s) · from <span className="sm-mono">job_runs</span>
          {bad || late ? ` · ${bad} bad, ${late} late` : ' · all read'}
          {overtaken ? ` · ${overtaken} judged from the tables instead` : ''}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="sm-panel-body">
          <EmptyState text="This system has no scheduled job in the registry. Its freshness can only be read from the tables below." />
        </div>
      ) : (
        <div className="sm-tablescroll">
          <table className="sm-table">
            <thead>
              <tr>
                <th scope="col" aria-label="Details" />
                <th scope="col">Job</th>
                <th scope="col">Expected</th>
                <th scope="col">Last run</th>
                <th scope="col">Rows</th>
                <th scope="col">7d fails</th>
                <th scope="col">Status</th>
                <th scope="col">Run</th>
                <th scope="col" className="sm-wrapcell">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const expanded = !!open[job.job_name];
                const hasDetail = Boolean(job.last_run?.error_message || job.note
                  || (job.commands?.length ?? 0) > 1 || job.cli_absence_reason
                  || (job.pages?.length ?? 0) > 0);
                return (
                  <JobRow
                    key={job.job_name}
                    job={job}
                    now={now}
                    expanded={expanded}
                    hasDetail={hasDetail}
                    onToggle={() => setOpen((prev) => ({ ...prev, [job.job_name]: !prev[job.job_name] }))}
                    onRerun={onRerun}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function JobRow({ job, now, expanded, hasDetail, onToggle, onRerun }: {
  job: MapJob;
  now: number;
  expanded: boolean;
  hasDetail: boolean;
  onToggle: () => void;
  onRerun?: () => void;
}) {
  const last = job.last_run;
  const relative = relTime(last?.started_at, now);
  const run = job.run;
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // A row can unmount while its job is still running server-side; the interval
  // must die with it. The run itself keeps going — that is by design.
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  function stopPolling() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPending(false);
  }

  function watchUntilDone() {
    let ticks = 0;        // successful status reads → drives the 15-min completion cap
    let authStreak = 0;   // consecutive transient auth/network misses → tolerated, not fatal
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const s = await SystemMapService.jobStatus(job.job_name);
        // A clean response ends any auth-streak; refresh has clearly succeeded.
        authStreak = 0;
        ticks += 1;
        const status = s.last_run?.status ?? null;
        // Still running when this process reports it in flight, OR the ledger
        // row has not reached a terminal status yet (including a null row the
        // worker thread has not inserted — treat as running so a refresh race
        // can never flip the button back on mid-run).
        const stillRunning =
          s.in_flight_this_process || (status == null || !TERMINAL_RUN_STATUSES.has(status));
        if (stillRunning && ticks < RUN_POLL_TICKS) return;
        stopPolling();
        if (!stillRunning) {
          setNote({ text: `Finished: ${status}`, tone: status === 'failed' ? 'bad' : 'ok' });
        } else {
          setNote({ text: 'Still running — refresh later', tone: 'ok' });
        }
        onRerun?.();
      } catch (err) {
        // Transient 401/refresh/network: the interceptor is refreshing the
        // session in the background. Keep the interval ALIVE — the next tick
        // retries against the renewed token. Do NOT stopPolling() (which would
        // call setPending(false) and re-enable Run Now → 409 on click) and do
        // NOT count it toward the completion budget.
        if (isTransientAuthError(err)) {
          authStreak += 1;
          if (authStreak < RUN_POLL_AUTH_GRACE) return;
          // Refresh has failed for a long stretch → the session is gone. Stop
          // quietly with an auth-specific note; do not claim the job finished.
          stopPolling();
          setNote({ text: 'Session expired — sign in and re-open to resume', tone: 'bad' });
          return;
        }
        // A real, non-auth failure. Keep polling until the completion budget
        // runs out, then give up with a neutral note (job may still be running
        // server-side, exactly as the old 2026-10-13 comment warns).
        if (ticks >= RUN_POLL_TICKS) {
          stopPolling();
          setNote({ text: 'Status unavailable', tone: 'bad' });
        }
      }
    }, RUN_POLL_MS);
  }

  async function startRun() {
    setPending(true);
    setNote(null);
    try {
      if (run?.delegated_to) {
        // daily_market_update: the existing pipeline endpoint owns the mutex.
        await apiClient.post(run.delegated_to);
      } else {
        await SystemMapService.runJob(job.job_name);
      }
      setNote({ text: 'Started…', tone: 'ok' });
      watchUntilDone();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // A run is already in flight server-side. Keep the button disabled and
        // watch that run to completion rather than re-enabling and inviting a
        // second click (the exact 409 the token-refresh race used to cause).
        setNote({ text: 'Already running', tone: 'ok' });
        watchUntilDone();
        return;
      }
      stopPolling();
      setNote(
        isTransientAuthError(err)
          ? { text: 'Session expired — sign in and try again', tone: 'bad' }
          : { text: `Rejected (${status ?? 'network'})`, tone: 'bad' },
      );
    }
  }

  // `run` is absent on a payload built before Phase 5 — no button, no guess.
  const canRun = Boolean(run?.runnable);
  // registry.commands_for(): one copy-paste terminal command per job, derived in
  // the backend so this surface and the Schedule cards can never disagree.
  const cmds = job.commands ?? [];

  return (
    <>
      <tr>
        <td>
          {hasDetail ? (
            <button
              type="button"
              className="sm-expander"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} details for ${job.job_name}`}
            >
              {expanded ? '−' : '+'}
            </button>
          ) : null}
        </td>
        <td>
          <div className="sm-cellname sm-mono">{job.job_name}</div>
          {/* Registry-flagged datacenter hostility (403/Akamai/no browser): the
              run belongs on a residential machine, so the card says it in red.
              The reason rides in the tooltip; colour is never the only carrier. */}
          {job.local_run ? (
            <span
              className={`sm-localbadge sm-localbadge-${job.local_run.level === 'advised' ? 'advised' : 'required'}`}
              title={job.local_run.reason || 'Runs best from a local residential IP'}
            >
              {job.local_run.level === 'advised' ? '⚠ Local run advised' : '⛔ Run locally required'}
            </span>
          ) : null}
          <div className="sm-subtle sm-mono">{job.file}</div>
          {job.writes.length > 0 ? (
            <div className="sm-subtle sm-mono">→ {job.writes.join(', ')}</div>
          ) : null}
        </td>
        <td>
          <div>{job.expected_schedule}</div>
          <div className="sm-subtle">budget {ageBudget(job.max_allowed_age_hours)}</div>
        </td>
        <td title={exactTime(last?.started_at)}>
          {relative ?? <span className="sm-subtle">never</span>}
          {last?.triggered_by ? <div className="sm-subtle">by {last.triggered_by}</div> : null}
        </td>
        <td className="sm-num">{last ? fmtInt(last.rows_written) : '—'}</td>
        <td className="sm-num">
          {job.failures_7d || job.stuck_running
            ? <span style={{ color: 'var(--red)' }}>{job.failures_7d}{job.stuck_running ? ` (+${job.stuck_running} open)` : ''}</span>
            : '0'}
        </td>
        <td>
          <StatusPill status={job.status} />
          {job.superseded ? (
            <div
              className="sm-cmdmore"
              title="job_runs has no record of the run that wrote this data: every table this job writes is fresh and newer than the ledger line."
            >
              ledger overtaken by data
            </div>
          ) : null}
        </td>
        <td>
          <div className="sm-runcell">
            {canRun ? (
              <>
                <button
                  type="button"
                  className="sm-btn sm-btn-run"
                  onClick={startRun}
                  disabled={pending}
                  title={run?.delegated_to
                    ? `POST ${run.delegated_to}`
                    : `POST /api/admin/system-map/jobs/${job.job_name}/run`}
                >
                  {pending ? 'Running…' : 'Run now'}
                </button>
                {note ? (
                  <span className={`sm-runnote sm-runnote-${note.tone}`}>{note.text}</span>
                ) : null}
              </>
            ) : (
              <span className="sm-subtle" title={run?.reason ?? 'not runnable'}>—</span>
            )}
            {/* Under the button, always: the same job as a terminal command with a
                one-click Copy, for an admin who would rather not run it from the
                browser. Full text is in the expanded row. */}
            {cmds.length > 0 ? (
              <span className="sm-cmd">
                <code className="sm-cmdline" title={`${cmds[0].label} — cwd backend/\n${cmds[0].cli}`}>
                  {cmds[0].cli}
                </code>
                <CopyButton text={cmds[0].cli} />
              </span>
            ) : (
              <span className="sm-cmdmore">{job.cli_absence_reason || 'no terminal command registered'}</span>
            )}
            {cmds.length > 1 ? (
              <span className="sm-cmdmore">+{cmds.length - 1} more — expand row</span>
            ) : null}
          </div>
        </td>
        <td className="sm-wrapcell">{job.message}</td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={9}>
            {cmds.length > 0 ? (
              <div className="sm-cmdlist">
                {cmds.map((c, i) => (
                  <div key={i} className="sm-cmdlist-row">
                    <span className="sm-cmdlabel">{c.label}</span>
                    <pre className="sm-cmdfull">{c.cli}</pre>
                    <CopyButton text={c.cli} />
                  </div>
                ))}
                <span className="sm-cmdmore">Run from <span className="sm-mono">backend/</span> — the venv path is relative to it.</span>
              </div>
            ) : job.cli_absence_reason ? (
              <p className="sm-subtle">{job.cli_absence_reason}</p>
            ) : null}
            {job.pages && job.pages.length > 0 ? (
              <div className="sm-cmdlist">
                <span className="sm-cmdlabel">
                  Pages that go stale if this stops ({job.pages.length})
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {job.pages.map((pg) => (
                    <a key={pg} className="sm-mono sm-cmdmore" href={pg} target="_blank" rel="noreferrer">{pg}</a>
                  ))}
                </div>
              </div>
            ) : null}
            {job.last_run?.error_message ? (
              <pre className="sm-error">{job.last_run.error_message}</pre>
            ) : (
              job.note ? <div className="sm-subtle">{job.note}</div> : null
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   3 · Tables — "is the data it wrote fresh?"
   ════════════════════════════════════════════════════════════════════════════ */
export function TablesPanel({ tables }: { tables: MapTable[] }) {
  return (
    <section className="sm-panel" aria-labelledby="sm-panel-tables">
      <div className="sm-panel-head">
        <h3 id="sm-panel-tables" className="sm-panel-title">What is in the tables</h3>
        <span className="sm-panel-hint">
          {tables.length} table(s) · lag in Saudi trading days (Sun–Thu) · row counts are pg_class estimates
        </span>
      </div>

      {tables.length === 0 ? (
        <div className="sm-panel-body">
          <EmptyState text="No table is registered for this system." />
        </div>
      ) : (
        <div className="sm-tablescroll">
          <table className="sm-table">
            <thead>
              <tr>
                <th scope="col">Table</th>
                <th scope="col">Written by</th>
                <th scope="col">Latest</th>
                <th scope="col">Lag</th>
                <th scope="col">~Rows</th>
                <th scope="col">Status</th>
                <th scope="col" className="sm-wrapcell">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.table}>
                  <td>
                    <div className="sm-cellname sm-mono">{t.table}</div>
                    <div className="sm-subtle sm-mono">
                      {t.date_column ?? 'no date column'}
                      {t.max_lag_trading_days != null ? ` · ≤${t.max_lag_trading_days}d` : ''}
                    </div>
                    {!t.verified ? <span className="sm-tag">unverified</span> : null}
                  </td>
                  <td className="sm-mono">{t.source_job ?? <span className="sm-subtle">no writer</span>}</td>
                  <td className="sm-num">{t.latest ?? <span className="sm-subtle">—</span>}</td>
                  <td className="sm-num">{t.lag_trading_days == null ? '—' : `${t.lag_trading_days}d`}</td>
                  <td className="sm-num" title="pg_class.reltuples — an estimate, not a COUNT()">{fmtInt(t.row_estimate)}</td>
                  <td><StatusPill status={t.status} /></td>
                  <td className="sm-wrapcell">{t.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   4 · Known issues — the panel disappears entirely when there is nothing
   ════════════════════════════════════════════════════════════════════════════ */
export function IssuesPanel({ issues }: { issues: SystemMapDetail['issues'] }) {
  if (issues.length === 0) return null;

  const sorted = [...issues].sort(
    (a, b) => (ISSUE_ORDER[a.severity] ?? 9) - (ISSUE_ORDER[b.severity] ?? 9),
  );

  return (
    <section className="sm-panel" aria-labelledby="sm-panel-issues">
      <div className="sm-panel-head">
        <h3 id="sm-panel-issues" className="sm-panel-title">Known issues</h3>
        <span className="sm-panel-hint">Recorded in the registry after reading the code, not from the docs</span>
      </div>
      <div className="sm-panel-body">
        <div className="sm-issues">
          {sorted.map((issue, i) => (
            <div className="sm-issue" key={`${issue.severity}-${i}`}>
              <span className="sm-pill" data-i={issue.severity}>{ISSUE_LABEL[issue.severity] ?? issue.severity}</span>
              <p className="sm-issuetext">{issue.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   5 · Check it yourself — the panel exists so nothing here is taken on trust
   ════════════════════════════════════════════════════════════════════════════ */
export function ChecksPanel({ checks, globalChecks }: { checks: MapCheckSql[]; globalChecks: MapCheckSql[] }) {
  return (
    <section className="sm-panel" aria-labelledby="sm-panel-checks">
      <div className="sm-panel-head">
        <h3 id="sm-panel-checks" className="sm-panel-title">Check it yourself</h3>
        <span className="sm-panel-hint">Paste into psql — these are the same questions the panels above answer</span>
      </div>
      <div className="sm-panel-body">
        {checks.length === 0 && globalChecks.length === 0 ? (
          <EmptyState text="Nothing to check for this system." />
        ) : (
          <div className="sm-sql">
            {checks.map((c) => <SqlBlock key={c.sql} check={c} />)}
            {globalChecks.length > 0 ? (
              <>
                <div className="sm-panel-hint" style={{ paddingTop: 4 }}>Cross-system checks</div>
                {globalChecks.map((c) => <SqlBlock key={c.sql} check={c} />)}
              </>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function SqlBlock({ check }: { check: MapCheckSql }) {
  return (
    <div className="sm-sqlblock">
      <div className="sm-sqlhead">
        <span>{check.label}</span>
        <CopyButton text={check.sql} />
      </div>
      <pre className="sm-sqlpre">{check.sql}</pre>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   States
   ════════════════════════════════════════════════════════════════════════════ */
export function EmptyState({ text }: { text: string }) {
  return <div className="sm-state">{text}</div>;
}

export function LoadingSkeleton() {
  return (
    <div className="sm-main" aria-busy="true" aria-live="polite">
      <div className="sm-panel">
        <div className="sm-panel-body">
          <div className="sm-skeleton sm-skeleton-row" style={{ width: '28%', height: 20 }} />
          <div className="sm-skeleton sm-skeleton-row" style={{ width: '70%' }} />
          <div className="sm-skeleton sm-skeleton-row" style={{ width: '55%' }} />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div className="sm-panel" key={i}>
          <div className="sm-panel-head">
            <div className="sm-skeleton sm-skeleton-row" style={{ width: 160, margin: 0 }} />
          </div>
          <div className="sm-panel-body">
            {[92, 88, 95, 80, 90].map((w, j) => (
              <div className="sm-skeleton sm-skeleton-row" key={j} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
