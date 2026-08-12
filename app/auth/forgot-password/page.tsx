'use client';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';
import { getCsrfToken } from '@/lib/api/authFetch';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // Always returns success to user
            await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
                body: JSON.stringify({ email })
            });
            // Show success regardless of actual API response details
            // But practically our API will 200 OK unless server error
            setStatus('success');
        } catch (e) {
            // Even on error, it might be safer to show success or generic error
            // But here we show generic success to avoid enumeration
            setStatus('success');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-6">If an account exists for {email}, we have sent a password reset link.</p>
                    <a href="/login" className="text-blue-600 hover:underline font-medium">Back to Sign In</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                    <p className="text-gray-500">Enter your email to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm text-gray-600">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                            placeholder="Ex. mail@example.com"
                        />
                    </div>

                    <button
                        disabled={status === 'loading'}
                        className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Link'}
                    </button>
                </form>
                <div className="text-center">
                    <a href="/login" className="text-sm text-gray-600 hover:text-black">Back to Sign In</a>
                </div>
            </div>
        </div>
    )
}
