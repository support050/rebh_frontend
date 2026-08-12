'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { User, Mail, Lock, AlertCircle, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { getCsrfToken } from '@/lib/api/authFetch';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSaving, setIsSaving] = useState(false);
    const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        };
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setMessage({ type: '', text: '' });
        setIsSaving(true);

        try {
            const API_URL = API_BASE_URL;
            const res = await authFetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    password: password.length > 0 ? password : undefined,
                    current_password: currentPassword.length > 0 ? currentPassword : undefined
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update profile');
            }

            const updatedUser = await res.json();
            setFullName(updatedUser.full_name);
            setEmail(updatedUser.email);
            setPassword('');
            setCurrentPassword(''); // Clear sensitive data
            setMessage({ type: 'success', text: 'Profile updated successfully' });

            messageTimeoutRef.current = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
            messageTimeoutRef.current = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h2>
                    <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
                    <Link href="/login" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.full_name || 'User'}</h1>
                        <p className="text-gray-500">{user.email}</p>
                    </div>

                    {/* Messages */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Your full name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-medium text-blue-900 mb-1.5">Current Password (Required for Email Change)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                    placeholder="Enter current password to save changes"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password (Optional)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Delete Account Section */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                    try {
                                        const API_URL = API_BASE_URL;
                                        const res = await fetch(`${API_URL}/api/auth/delete-account`, {
                                            method: 'DELETE',
                                            headers: { 'x-csrf-token': getCsrfToken() },
                                            credentials: 'include'
                                        });

                                        if (!res.ok) {
                                            throw new Error('Failed to delete account');
                                        }

                                        // Clear local storage and redirect
                                        window.location.href = '/';
                                    } catch (error) {
                                        alert('Failed to delete account. Please try again.');
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
