import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * UX / navigation guard only.
 *
 * Cookie presence is NOT authentication. FastAPI remains the security boundary.
 * This middleware never trusts cookie contents as proof of identity.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');

  const publicPaths = [
    '/login',
    '/register',
    '/admin/login',
    '/auth',
    '/pending-approval',
    '/terms',
    '/terms-of-service',
    '/privacy',
    '/privacy-policy',
    '/delete-account',
    '/about',
    '/contact',
  ];

  const isPublicPath = publicPaths.some(
    (p) => normalizedPath === p || normalizedPath.startsWith(p + '/')
  );

  // Presence-only checks for UX redirects — backend validates JWT + Redis JTI
  const hasSession = request.cookies.has('session_token');
  const hasRefresh = request.cookies.has('refresh_token');
  const hasPending = request.cookies.has('pending_token');

  const mayHaveSession = hasSession || hasRefresh;

  if (!mayHaveSession && !isPublicPath) {
    if (hasPending) {
      // Pending users go to waiting page; if cookie is stale, that page handles cleanup
      return withSecurityHeaders(
        NextResponse.redirect(new URL('/pending-approval', request.url))
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', `${path}${request.nextUrl.search}`);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Avoid bounce loops: pending cookie alone must not keep forcing login↔pending
  if (hasPending && !hasSession && !hasRefresh) {
    if (normalizedPath === '/login' || normalizedPath === '/register') {
      return withSecurityHeaders(
        NextResponse.redirect(new URL('/pending-approval', request.url))
      );
    }
  }

  // Only redirect away from login when an access cookie exists (refresh-only stays on login)
  if (hasSession && (normalizedPath === '/login' || normalizedPath === '/register')) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP kept compatible with Next.js (inline scripts/styles may be required)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
