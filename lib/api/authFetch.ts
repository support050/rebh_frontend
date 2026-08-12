import { API_ENDPOINTS } from './config';

/** Paths that must not trigger a refresh-and-retry loop. */
const SKIP_REFRESH_PATHS = [
  '/api/auth/refresh-token',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/logout-all',
];

function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Read double-submit CSRF cookie (non-HttpOnly). Empty if missing — never use sentinel "1". */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Ensure a CSRF cookie exists (calls GET /api/auth/csrf when needed). */
export async function ensureCsrfToken(): Promise<string> {
  let token = getCsrfToken();
  if (token) return token;
  try {
    await fetch(API_ENDPOINTS.AUTH.CSRF, { credentials: 'include' });
  } catch {
    // ignore — caller will fail CSRF if still missing
  }
  return getCsrfToken();
}

async function withCsrfHeaders(init?: RequestInit): Promise<Headers> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', await ensureCsrfToken());
  }
  return headers;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh the session using the HttpOnly refresh_token cookie.
 * Concurrent callers share a single in-flight request (token rotation safe).
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const csrf = await ensureCsrfToken();
      const res = await fetch(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        method: 'POST',
        headers: { 'x-csrf-token': csrf },
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * fetch wrapper: on 401, refresh tokens once and retry the original request.
 * Does not recurse on the refresh endpoint itself.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = resolveUrl(input);
  const headers = await withCsrfHeaders(init);
  const options: RequestInit = {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers,
  };

  let response = await fetch(input, options);

  if (response.status === 401 && !shouldSkipRefresh(url)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(input, {
        ...options,
        headers: await withCsrfHeaders(options),
      });
    }
  }

  return response;
}

/** Validate callbackUrl to prevent open redirects. */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (raw.includes('://') || raw.includes('\\')) return '/';
  return raw;
}
