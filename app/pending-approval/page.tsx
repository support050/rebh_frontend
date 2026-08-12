"use client";
import { useEffect, useState, useCallback } from 'react';

import { API_ENDPOINTS } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { getCsrfToken } from '@/lib/api/authFetch';

export default function PendingApproval() {
    const [message, setMessage] = useState('');
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [approved, setApproved] = useState(false);
    const [checking, setChecking] = useState(true);

    const checkApprovalStatus = useCallback(async () => {
        try {
            // Try the SSE/pending endpoint first (for OAuth flow with pending_token)
            const res = await authFetch(API_ENDPOINTS.AUTH.PENDING_STATUS_CHECK, {
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                if (data.approved) {
                    setApproved(true);
                    return true;
                }
            }
        } catch {
            // Endpoint might not exist or token missing - try login flow
        }

        // Fallback: try to login again to check if approved (for both flows)
        // If the user has a session_token, try /api/auth/me
        try {
            const meRes = await authFetch(API_ENDPOINTS.AUTH.ME, {
                credentials: 'include',
            });
            if (meRes.ok) {
                const userData = await meRes.json();
                if (userData && userData.is_approved) {
                    setApproved(true);
                    return true;
                }
            }
        } catch {
            // No valid session
        }

        return false;
    }, []);

    useEffect(() => {
        // Pending user data is no longer stored in localStorage for security reasons.
        // The page relies on the pending_token cookie and API checks instead.

        // Initial check
        checkApprovalStatus().then(() => setChecking(false));

        // Poll every 5 seconds
        const interval = setInterval(async () => {
            const isApproved = await checkApprovalStatus();
            if (isApproved) {
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [checkApprovalStatus]);

    // When approval is detected, redirect to login
    useEffect(() => {
        if (approved) {


            // Try activate-session to get proper session from pending token, then go home
            authFetch(API_ENDPOINTS.AUTH.ACTIVATE_SESSION, {
                method: 'POST',
                credentials: 'include',
                headers: { 'x-csrf-token': getCsrfToken() },
            }).then(res => {
                if (res.ok) {
                    window.location.href = '/';
                } else {
                    // Try me endpoint as fallback if activate-session fails
                    authFetch(API_ENDPOINTS.AUTH.ME, {
                       credentials: 'include',
                    }).then(res => {
                       if(res.ok) {
                            window.location.href = '/';
                       } else {
                            window.location.href = '/login';
                       }
                    }).catch(() => {
                        window.location.href = '/login';
                    });
                }
            }).catch(() => {
                window.location.href = '/login';
            });
        }
    }, [approved]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                {approved ? (
                    <>
                        <div className="text-6xl mb-6">✅</div>
                        <h1 className="text-2xl font-bold mb-2 text-green-700">تم تفعيل حسابك!</h1>
                        <p className="text-gray-500 text-sm mb-6">Account Approved</p>
                        <p className="text-gray-600 text-sm">جاري تحويلك...</p>
                        <div className="mt-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-6">⏳</div>

                        <h1 className="text-2xl font-bold mb-2 text-gray-900">الحساب قيد المراجعة</h1>
                        <p className="text-gray-500 text-sm mb-6">Account Under Review</p>

                        {pendingUser && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-left">
                                <p className="text-gray-700 text-sm">
                                    <strong>مرحباً {pendingUser.full_name || 'المستخدم'}</strong>
                                    <br />
                                    <br />
                                    <span className="text-xs text-gray-600">البريد: {pendingUser.email}</span>
                                </p>
                            </div>
                        )}

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
                            <p className="text-gray-700 text-sm">
                                <strong>شكراً لتسجيلك!</strong>
                                <br />
                                <br />
                                حسابك جاهز لكن بحاجة لموافقة من الإدارة.
                                سيتم تفعيل حسابك قريباً.
                                {message && (
                                    <>
                                        <br />
                                        <br />
                                        <span className="text-xs text-gray-600">({message})</span>
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-2" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-xs text-blue-600 mt-3">جاري التحقق من الحالة...</p>
                        </div>

                        <button
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            تسجيل الخروج
                        </button>

                        <p className="text-xs text-gray-500 mt-4">
                            سيتم التحقق من الحالة تلقائياً كل 5 ثوانٍ
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
