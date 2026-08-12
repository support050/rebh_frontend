// All API requests go through the Next.js proxy (/api/...) which rewrites to the backend.
// This ensures cookies are first-party and visible to the middleware.
// In SSR/server context, we need the full backend URL. In client context, relative paths work.
const isServer = typeof window === 'undefined';
export const API_BASE_URL = isServer
  ? (process.env.BACKEND_URL || 'http://127.0.0.1:8000')
  : '';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
    ACTIVATE_SESSION: `${API_BASE_URL}/api/auth/activate-session`,
    PENDING_STATUS_CHECK: `${API_BASE_URL}/api/auth/pending-status/check`,
    VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forget-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    GOOGLE_LOGIN: `${API_BASE_URL}/api/auth/google/login`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/api/auth/google/callback`,
    FACEBOOK_LOGIN: `${API_BASE_URL}/api/auth/facebook/login`,
    FACEBOOK_CALLBACK: `${API_BASE_URL}/api/auth/facebook/callback`,
    OAUTH_CONFIRM_LINK: `${API_BASE_URL}/api/auth/oauth/confirm-link`,
    CSRF: `${API_BASE_URL}/api/auth/csrf`,
  },
  ADMIN: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
  }
};
