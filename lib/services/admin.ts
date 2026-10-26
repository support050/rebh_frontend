import { apiClient } from '@/lib/api/axiosClient';
import { getCsrfToken } from '@/lib/api/authFetch';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_approved: boolean;
  is_admin: boolean;
}

export const AdminService = {
    async getPendingUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/api/admin/pending-users');
        return response.data;
    },

    async getAllUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/api/admin/users');
        return response.data;
    },

    async approveUser(userId: number): Promise<void> {
        await apiClient.post(`/api/admin/approve-user/${userId}`, {}, {
            headers: { 'x-csrf-token': getCsrfToken() },
        });
    },

    async revokeUser(userId: number): Promise<void> {
        await apiClient.post(`/api/admin/revoke-user/${userId}`, {}, {
            headers: { 'x-csrf-token': getCsrfToken() },
        });
    },

    async deleteUser(userId: number): Promise<void> {
        await apiClient.delete(`/api/admin/users/${userId}`, {
            headers: { 'x-csrf-token': getCsrfToken() },
        });
    },
}

export interface PipelineDbStatus {
  latest_ready_date: string | null;
  is_updating: boolean;
  started_at: string | null;
  completed_at: string | null;
  lock_age_minutes: number | null;
  stale_after_minutes?: number;
  /** Days present in `prices` but not published — a critical stage failed. */
  unpublished_days?: number;
}

export interface PipelineStageFailure {
  stage: string;
  critical: boolean;
  error: string;
  traceback_last_line?: string;
}

/**
 * Explained, non-blocking condition (e.g. a stock listed yesterday cannot have
 * SMA200 yet). Never counted as a stage failure — `ok` stays true.
 */
export interface PipelineStageAdvisory {
  stage: string;
  error: string;
}

export interface PipelineRunReport {
  market_date: string | null;
  stage_failures: PipelineStageFailure[];
  stage_advisories?: PipelineStageAdvisory[];
  quality: Record<string, number | boolean | string | null>;
  ready_date_advanced: boolean | null;
  critical_stages: string[];
  ok: boolean;
}

export interface PipelineStatus {
  db: PipelineDbStatus;
  process: {
    run_id: string | null;
    running_this_worker: boolean;
    started_at: string | null;
    finished_at: string | null;
    error: string | null;
    target_date: string | null;
  };
  /** Report of the last run in this worker (null for CLI / other workers). */
  run_report?: PipelineRunReport | null;
  log_tail: string[];
}

/**
 * Daily Market Update — server-side trigger.
 * The backend runs the pipeline in a background thread next to the database,
 * so these calls return immediately and progress is polled from status().
 */
export const PipelineService = {
    async run(targetDate?: string, force = false): Promise<{ started: boolean; run_id: string }> {
        const params = new URLSearchParams();
        if (targetDate) params.set('target_date', targetDate);
        if (force) params.set('force', 'true');
        const qs = params.toString();
        const response = await apiClient.post(
            `/api/admin/pipeline/daily-market-update/run${qs ? `?${qs}` : ''}`,
            {},
            { headers: { 'x-csrf-token': getCsrfToken() } },
        );
        return response.data;
    },

    async status(): Promise<PipelineStatus> {
        const response = await apiClient.get<PipelineStatus>(
            '/api/admin/pipeline/daily-market-update/status',
        );
        return response.data;
    },

    async unlock(): Promise<{ cleared: boolean }> {
        const response = await apiClient.post(
            '/api/admin/pipeline/daily-market-update/unlock',
            {},
            { headers: { 'x-csrf-token': getCsrfToken() } },
        );
        return response.data;
    },
}

/** One row of the scraper → DB table → frontend pages map. */
export interface PipelineMapEntry {
  table: string;
  label: string;
  scrapers: string[];
  pages: string[];
  warn?: string;
}

/** Verdict used across the Runbook. Mirrors backend/app/api/routes/system_map.py. */
export type MapStatus = 'ok' | 'late' | 'bad' | 'unknown' | 'untracked';

/** Sidebar row: static registry description + live counts. */
export interface SystemMapSummary {
  id: string;
  name: string;
  blurb: string;
  in_navbar: boolean;
  navbar_label: string | null;
  pages_count: number;
  jobs_count: number;
  tables_count: number;
  issues_count: number;
  bugs_count: number;
  health: MapStatus;
  jobs_bad: number;
  jobs_late: number;
  tables_bad: number;
  tables_late: number;
}

export interface SystemMapListResponse {
  systems: SystemMapSummary[];
  generated_at: string | null;
  cache_ttl_seconds: number;
  registry_file: string;
  build_error: string | null;
  db_queries?: MapQueryCount;
}

export interface MapBuiltLayer {
  layer: string;
  path: string;
  description: string;
}

export interface MapLastRun {
  status: string;
  started_at: string | null;
  finished_at: string | null;
  age_hours: number | null;
  rows_written: number | null;
  error_message: string | null;
  triggered_by: string | null;
}

/** Phase 5 — can this job be started from the browser, and through which door? */
export interface MapRunCapability {
  runnable: boolean;
  /** Set when the run must be triggered by another endpoint (daily_market_update). */
  delegated_to: string | null;
  reason: string | null;
  /** True when the backend callable writes its own job_runs row. */
  self_tracked?: boolean;
}

export interface MapJob {
  job_name: string;
  file: string;
  expected_schedule: string;
  trigger: string;
  tracked: boolean;
  max_allowed_age_hours: number | null;
  writes: string[];
  note: string;
  failures_7d: number;
  stuck_running: number;
  last_run: MapLastRun | null;
  status: MapStatus;
  message: string;
  run: MapRunCapability;
}

export interface MapTable {
  table: string;
  date_column: string | null;
  max_lag_trading_days: number | null;
  source_job: string | null;
  note: string;
  verified: boolean;
  latest: string | null;
  lag_trading_days: number | null;
  row_estimate: number | null;
  status: MapStatus;
  message: string;
}

export interface MapIssue {
  severity: 'bug' | 'watch' | 'note';
  text: string;
}

export interface MapCheckSql {
  label: string;
  sql: string;
}

/** How many SELECTs the last snapshot build ran — surfaces a future N+1. */
export interface MapQueryCount {
  selects: number;
  by_layer: Record<string, number>;
  note?: string;
}

export interface SystemMapDetail {
  id: string;
  name: string;
  blurb: string;
  in_navbar: boolean;
  navbar_label: string | null;
  health: MapStatus;
  built: MapBuiltLayer[];
  pages: string[];
  jobs: MapJob[];
  tables: MapTable[];
  issues: MapIssue[];
  checks_sql: MapCheckSql[];
  generated_at: string | null;
  cache_ttl_seconds: number;
  registry_file: string;
  global_checks_sql: MapCheckSql[];
  build_error: string | null;
  db_queries?: MapQueryCount;
  /** Set only when the live checks could not run at all. */
  unavailable?: string;
}

/**
 * System Map (Runbook) client. Only the pipelines map is used by the legacy
 * /admin dashboard; the full runbook lives at /admin/system-map.
 */
export const SystemMapService = {
    async getPipelines(): Promise<PipelineMapEntry[]> {
        const response = await apiClient.get<PipelineMapEntry[]>(
            '/api/admin/system-map/pipelines',
        );
        return response.data;
    },

    /** `force` bypasses the 60s server cache (manual Refresh button). */
    async getSystems(force = false): Promise<SystemMapListResponse> {
        const response = await apiClient.get<SystemMapListResponse>(
            '/api/admin/system-map/systems',
            { params: force ? { refresh: true } : undefined },
        );
        return response.data;
    },

    async getSystem(systemId: string, force = false): Promise<SystemMapDetail> {
        const response = await apiClient.get<SystemMapDetail>(
            `/api/admin/system-map/systems/${systemId}`,
            { params: force ? { refresh: true } : undefined },
        );
        return response.data;
    },

    /** SWR fetcher — keys are the request URLs, so cache keys stay readable. */
    async fetcher<T>(path: string): Promise<T> {
        const response = await apiClient.get<T>(path);
        return response.data;
    },

    /**
     * Phase 5 "Run Now". Job names contain ':' (e.g. fred:UNRATE), so the
     * segment is encoded. 409 = a run is already in flight; anything else is
     * surfaced by the caller.
     */
    async runJob(jobName: string): Promise<RunNowResult> {
        const response = await apiClient.post<RunNowResult>(
            `/api/admin/system-map/jobs/${encodeURIComponent(jobName)}/run`,
        );
        return response.data;
    },

    async jobStatus(jobName: string): Promise<JobStatusResponse> {
        const response = await apiClient.get<JobStatusResponse>(
            `/api/admin/system-map/jobs/${encodeURIComponent(jobName)}/status`,
        );
        return response.data;
    },

    /** Schedule tab — every job with cadence/role/storage/commands + live run signal. */
    async getSchedule(): Promise<ScheduleResponse> {
        const response = await apiClient.get<ScheduleResponse>(
            '/api/admin/system-map/schedule',
        );
        return response.data;
    },

    /** Gap scanner — read-only freshness + missing-day findings. */
    async scanIntegrity(windowDays = 90): Promise<IntegrityScan> {
        const response = await apiClient.get<IntegrityScan>(
            '/api/admin/system-map/integrity/scan',
            { params: { window_days: windowDays } },
        );
        return response.data;
    },
}

/** POST /jobs/{name}/run body. */
export interface RunNowResult {
  job_name: string;
  status: 'started' | 'already_running' | 'not_runnable';
  message: string;
  label?: string;
  self_tracked?: boolean;
  poll_url?: string;
}

/** GET /jobs/{name}/status body — one indexed SELECT on the backend. */
export interface JobStatusResponse {
  job_name: string;
  runnable: boolean;
  in_flight_this_process: boolean;
  started_this_process: string | null;
  last_run: MapLastRun | null;
}

// ── Schedule tab + gap scanner (GET /api/admin/system-map/schedule|/integrity/scan) ──

/** One operator CLI command shown on a Schedule card. */
export interface ScheduleCommand {
  label: string;
  cli: string;
  kind: 'incremental' | 'full' | 'backfill';
}

export type ScheduleCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';
export type ScheduleRole = 'ingestion' | 'computation';
export type ScheduleStorage = 'cumulative' | 'snapshot';

/** One job row of the Schedule tab. */
export interface ScheduleJob {
  job_name: string;
  file: string;
  cadence: ScheduleCadence;
  role: ScheduleRole;
  storage: ScheduleStorage;
  commands: ScheduleCommand[];
  writes: string[];
  expected_schedule: string;
  trigger: string;
  tracked: boolean;
  note: string;
  systems: string[];
  /** True only when job_runner has a callable — the sole gate for Run Now. */
  runnable: boolean;
  /** Set when the run must go through another endpoint (daily_market_update). */
  delegated_to: string | null;
  run_reason: string | null;
  last_run: MapLastRun | null;
}

export interface ScheduleResponse {
  jobs: ScheduleJob[];
  cadences: ScheduleCadence[];
  roles: ScheduleRole[];
  storages: ScheduleStorage[];
  ledger_missing: boolean;
  generated_at: string | null;
  registry_file: string;
}

/** One gap-scanner finding. */
export interface IntegrityFinding {
  table: string;
  date_column: string;
  cadence: string;
  responsible_job: string;
  responsible_file: string;
  fix_commands: ScheduleCommand[];
  latest: string | null;
  lag_trading_days: number | null;
  distinct_days: number | null;
  missing_days: number | null;
  status: 'ok' | 'late' | 'gap' | 'missing' | 'unknown';
  message: string;
}

export interface IntegrityScan {
  generated_at: string;
  window_days: number;
  findings: IntegrityFinding[];
  gaps: number;
  registry_file: string;
}
