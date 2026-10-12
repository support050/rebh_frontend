/**
 * Formatting helpers for the System Map (Runbook).
 *
 * Times are shown relative ("3h ago") because the question an admin asks is
 * "is it recent?", not "what second did it start?" — the exact timestamp is
 * always one hover away via the `title` attribute.
 */
import type { MapStatus } from '@/lib/services/admin';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Short relative label. Handles the future (worker clock skew) as "in …". */
export function relTime(iso: string | null | undefined, now: number = Date.now()): string | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;

  const delta = now - ts;
  const abs = Math.abs(delta);
  const suffix = delta >= 0 ? ' ago' : '';
  const prefix = delta >= 0 ? '' : 'in ';

  if (abs < MINUTE) return 'just now';
  if (abs < HOUR) return `${prefix}${Math.round(abs / MINUTE)}m${suffix}`;
  if (abs < DAY) return `${prefix}${Math.round(abs / HOUR)}h${suffix}`;
  if (abs < WEEK) return `${prefix}${Math.round(abs / DAY)}d${suffix}`;
  return `${prefix}${Math.round(abs / WEEK)}w${suffix}`;
}

/** Full timestamp for tooltips — never make an admin guess the exact moment. */
export function exactTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** HH:MM for the "Updated at" stamp. */
export function clockTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '—';
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Hours → "1.5h" / "26h" / "35d" so a budget reads at a glance. */
export function ageBudget(hours: number | null | undefined): string {
  if (hours == null) return 'no budget';
  if (hours < 48) return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function fmtInt(value: number | null | undefined): string {
  if (value == null) return '—';
  // pg_class.reltuples is an estimate (and -1 when never analysed) — say so.
  if (value < 0) return '—';
  return value.toLocaleString();
}

export const STATUS_LABEL: Record<MapStatus, string> = {
  ok: 'OK',
  late: 'Late',
  bad: 'Bad',
  unknown: 'Unknown',
  untracked: 'Untracked',
};

export const STATUS_HINT: Record<MapStatus, string> = {
  ok: 'Running as expected.',
  late: 'Behind schedule or an unusual result — worth a look.',
  bad: 'Failed, never recorded, or too stale to trust.',
  unknown: 'The Runbook cannot measure this (no date column, or no check ran).',
  untracked: 'Not wrapped by track_job(), so job_runs has nothing to say.',
};

export const ISSUE_LABEL: Record<string, string> = {
  bug: 'Bug',
  watch: 'Watch',
  note: 'Note',
};

/** Order the sidebar legend and issue list so bugs always come first. */
export const ISSUE_ORDER: Record<string, number> = { bug: 0, watch: 1, note: 2 };
