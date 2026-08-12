"use client";
/**
 * Client-side UX gate only. Admin/data access is enforced by FastAPI (get_current_admin).
 * Never treat React state as a security boundary.
 */
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { safeCallbackUrl } from '@/lib/api/authFetch';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const dest = safeCallbackUrl(pathname);
      router.push(`/login?callbackUrl=${encodeURIComponent(dest)}`);
      return;
    }

    if (!user.is_approved) {
      router.push('/pending-approval');
      return;
    }

    if (requireAdmin && !user.is_admin) {
      router.push('/');
    }
  }, [loading, user, router, requireAdmin, pathname]);

  if (loading || !user || !user.is_approved || (requireAdmin && !user.is_admin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
