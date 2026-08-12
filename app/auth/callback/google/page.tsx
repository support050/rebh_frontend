'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { API_ENDPOINTS } from '@/lib/api/config';
import { authFetch, ensureCsrfToken } from '@/lib/api/authFetch';

type LinkChallenge = {
  linkToken: string;
  email: string;
};

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [linkChallenge, setLinkChallenge] = useState<LinkChallenge | null>(null);
  const [password, setPassword] = useState('');
  const [linking, setLinking] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code) {
      setError('No authorization code found');
      setBusy(false);
      return;
    }
    if (!state) {
      setError('Missing OAuth state');
      setBusy(false);
      return;
    }

    const exchangeCode = async () => {
      try {
        const csrf = await ensureCsrfToken();
        const res = await authFetch(
          `${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'x-csrf-token': csrf },
          }
        );

        if (res.status === 409) {
          const data = await res.json();
          if (data.detail === 'account_link_required' && data.link_token) {
            setLinkChallenge({
              linkToken: data.link_token,
              email: data.email || '',
            });
            setBusy(false);
            return;
          }
          throw new Error(data.message || data.detail || 'Account linking required');
        }

        if (res.status === 403) {
          window.location.href = '/pending-approval';
          return;
        }

        if (!res.ok) {
          let errorMessage = 'Failed to exchange code';
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            /* ignore */
          }
          throw new Error(typeof errorMessage === 'string' ? errorMessage : 'Failed to exchange code');
        }

        await res.json();
        window.location.href = '/';
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        setBusy(false);
      }
    };

    exchangeCode();
  }, [searchParams]);

  const confirmLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!linkChallenge || linking) return;
    setLinking(true);
    setError('');
    try {
      const csrf = await ensureCsrfToken();
      const res = await authFetch(API_ENDPOINTS.AUTH.OAUTH_CONFIRM_LINK, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf,
        },
        body: JSON.stringify({
          link_token: linkChallenge.linkToken,
          password,
        }),
      });

      if (res.status === 403) {
        window.location.href = '/pending-approval';
        return;
      }

      if (!res.ok) {
        let msg = 'Failed to link account';
        try {
          const data = await res.json();
          msg = data.detail || data.message || msg;
        } catch {
          /* ignore */
        }
        throw new Error(typeof msg === 'string' ? msg : 'Failed to link account');
      }

      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to link account');
      setLinking(false);
    }
  };

  if (linkChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm account link</h1>
          <p className="text-gray-600 mb-6">
            An account already exists for{' '}
            <span className="font-medium text-gray-900">{linkChallenge.email}</span>.
            Enter your password to link Google sign-in.
          </p>
          <form onSubmit={confirmLink} className="space-y-4 text-left">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={linking}
              className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {linking ? 'Linking…' : 'Link Google and continue'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => (window.location.href = '/login')}
            className="mt-4 text-sm text-gray-600 underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Login Failed</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (busy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Completing Secure Login...</h1>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
