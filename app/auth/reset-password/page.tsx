'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';
import { getCsrfToken } from '@/lib/api/authFetch';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });

            if (res.ok) {
                setSuccess('تم تغيير كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول...');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.detail || 'الرابط غير صالح أو منتهي الصلاحية');
            }
        } catch (e) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return (
        <div className="text-center text-red-600 font-medium">
            Invalid or missing token.
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full" dir="rtl">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-200">
                    {success}
                </div>
            )}
            <div className="space-y-1">
                <label className="block text-sm text-gray-600">كلمة المرور الجديدة</label>
                <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
            </div>
            <button
                className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={loading}
            >
                {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
            </button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
                    <p className="text-gray-500">Please enter your new password below</p>
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
