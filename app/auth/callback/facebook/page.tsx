'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { API_ENDPOINTS } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { getCsrfToken } from '@/lib/api/authFetch';

function FacebookCallbackContent() {
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        if (!code) {
            setError('No authorization code found');
            return;
        }
        if (!state) {
            setError('Missing OAuth state');
            return;
        }

        const exchangeCode = async () => {
            try {
                const res = await authFetch(`${API_ENDPOINTS.AUTH.FACEBOOK_CALLBACK}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'x-csrf-token': getCsrfToken() },
                });

                if (!res.ok) {
                    let errorMessage = 'Failed to exchange code';
                    let userData: any = null;
                    
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.detail || errorData.message || 'Failed to exchange code';
                        userData = errorData.user;
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError);
                    }
                    console.error(`[Facebook Callback] Status ${res.status}: ${errorMessage}`);
                    
                    // If status is 403 (Forbidden) - account pending approval
                    if (res.status === 403) {
                        console.log('[Facebook Callback] Account pending admin approval');
                        window.location.href = '/pending-approval';
                        return;
                    }
                    
                    throw new Error(errorMessage);
                }

                await res.json();

                // Redirect to home
                window.location.href = '/';
            } catch (err: any) {
                console.error('[Facebook Callback] Error:', err);
                setError(err.message);
            }
        };

        exchangeCode();
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Login Failed</h1>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <h1 className="text-xl font-semibold text-gray-900">Completing Secure Login...</h1>
            </div>
        </div>
    );
}

export default function FacebookCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
                    </div>
                </div>
            }
        >
            <FacebookCallbackContent />
        </Suspense>
    );
}
