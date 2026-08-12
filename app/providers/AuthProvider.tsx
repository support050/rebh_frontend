'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_approved?: boolean;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_ENDPOINTS } from '@/lib/api/config';
import { authFetch, ensureCsrfToken, getCsrfToken, safeCallbackUrl } from '@/lib/api/authFetch';

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isPublicPath = (path: string) => {
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
    return publicPaths.some((p) => path === p || path.startsWith(`${p}/`));
  };

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Warm CSRF cookie (UX only — not a security boundary)
    fetch(API_ENDPOINTS.AUTH.CSRF, { credentials: 'include' }).catch(() => {});
    checkAuth();
  }, []);

  const applyUserFromMe = async (res: Response): Promise<boolean> => {
    if (!res.ok) return false;
    const userData = await res.json();
    if (userData && userData.is_approved === false) {
      setUser(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/pending-approval')) {
        router.push('/pending-approval');
      }
      return true;
    }
    setUser(userData);
    return true;
  };

  const checkAuth = async () => {
    try {
      const res = await authFetch(API_ENDPOINTS.AUTH.ME);

      if (await applyUserFromMe(res)) {
        return;
      }

      if (res.status === 403) {
        setUser(null);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/pending-approval')) {
          router.push('/pending-approval');
        }
        return;
      }

      // Network / 503: do not force redirect loop
      if (res.status >= 500) {
        return;
      }

      setUser(null);
      if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
        const callbackUrl = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );
        window.location.href = `/login?callbackUrl=${callbackUrl}`;
      }
    } catch {
      // Network errors: keep current UX, avoid leaking details
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!AUTH_ENABLED) return;

    const csrf = await ensureCsrfToken();
    const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let errorMessage = 'فشل تسجيل الدخول';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // use default message
      }

      if (res.status === 403) {
        window.location.href = '/pending-approval';
        return;
      }

      throw new Error(typeof errorMessage === 'string' ? errorMessage : 'فشل تسجيل الدخول');
    }

    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    } else {
      await checkAuth();
    }

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const destination = safeCallbackUrl(params?.get('callbackUrl'));
    window.location.href = destination;
  };

  const register = async (email: string, password: string, fullName?: string) => {
    if (!AUTH_ENABLED) {
      router.push('/');
      return;
    }

    const csrf = await ensureCsrfToken();
    const res = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, full_name: fullName || '' }),
    });

    if (!res.ok) {
      let errorMessage = 'فشل التسجيل';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // use default message
      }
      throw new Error(typeof errorMessage === 'string' ? errorMessage : 'فشل التسجيل');
    }

    window.location.href = '/pending-approval';
  };

  const logout = async () => {
    if (!AUTH_ENABLED) return;

    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: { 'x-csrf-token': getCsrfToken() },
        credentials: 'include',
      });
    } catch {
      // Ignore logout network failure on client.
    }
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
