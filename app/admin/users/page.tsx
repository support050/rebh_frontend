"use client";
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AdminService, User } from '@/lib/services/admin';

type Tab = 'pending' | 'approved' | 'all';

export default function AdminUsersPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('pending');
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const users = await AdminService.getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (id: number) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await AdminService.approveUser(id);
            setAllUsers(prev => prev.map(u => u.id === id ? { ...u, is_approved: true } : u));
            alert("✅ User approved successfully!");
        } catch (error) {
            alert("Failed to approve user.");
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleRevoke = async (user: User) => {
        const confirmed = window.confirm(
            `⚠️ Are you sure you want to revoke access for "${user.full_name || user.email}"?\n\nThis will:\n• Remove their approval\n• Log them out immediately\n• Block them from accessing the site`
        );
        if (!confirmed) return;

        setActionLoading(prev => ({ ...prev, [user.id]: true }));
        try {
            await AdminService.revokeUser(user.id);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_approved: false } : u));
            alert(`🚫 Access revoked for ${user.email}`);
        } catch (error) {
            alert("Failed to revoke user.");
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const handleDelete = async (user: User) => {
        const confirmed = window.confirm(
            `🚨 DANGER: Are you absolutely sure you want to PERMANENTLY DELETE "${user.full_name || user.email}"?\n\nThis will wipe their account, wallet, and all preferences from the database forever.`
        );
        if (!confirmed) return;

        setActionLoading(prev => ({ ...prev, [user.id]: true }));
        try {
            await AdminService.deleteUser(user.id);
            setAllUsers(prev => prev.filter(u => u.id !== user.id));
            alert(`🗑️ User ${user.email} deleted successfully.`);
        } catch (error) {
            alert("Failed to delete user.");
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const filteredUsers = allUsers.filter(u => {
        if (tab === 'pending') return !u.is_approved;
        if (tab === 'approved') return u.is_approved;
        return true;
    });

    const pendingCount = allUsers.filter(u => !u.is_approved).length;
    const approvedCount = allUsers.filter(u => u.is_approved).length;

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'pending', label: '⏳ Pending', count: pendingCount },
        { key: 'approved', label: '✅ Approved', count: approvedCount },
        { key: 'all', label: '👥 All Users', count: allUsers.length },
    ];

    return (
        <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

                {/* Header */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold shadow">👤</div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Management</h1>
                                <p className="text-xs text-slate-400 mt-0.5">Approve, revoke, and manage user access</p>
                            </div>
                        </div>
                        <a
                            href="/admin"
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition shadow-sm"
                        >
                            ← Back to Admin
                        </a>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-7">

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6 shadow-sm">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${tab === t.key
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                            >
                                {t.label}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === t.key
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <div className="text-slate-400 text-sm">Loading users...</div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <div className="text-4xl mb-3">
                                {tab === 'pending' ? '🎉' : '📭'}
                            </div>
                            <div className="text-slate-500 text-sm font-medium">
                                {tab === 'pending'
                                    ? 'No users pending approval!'
                                    : tab === 'approved'
                                        ? 'No approved users found.'
                                        : 'No users found.'}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.is_admin ? 'bg-purple-500' : user.is_approved ? 'bg-emerald-500' : 'bg-amber-400'
                                                        }`}>
                                                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-800">{user.full_name || 'N/A'}</div>
                                                        {user.is_admin && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold uppercase">Admin</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.is_approved ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {!user.is_approved && (
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            disabled={actionLoading[user.id]}
                                                            className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            {actionLoading[user.id] ? '...' : '✅ Approve'}
                                                        </button>
                                                    )}
                                                    {user.is_approved && !user.is_admin && (
                                                        <button
                                                            onClick={() => handleRevoke(user)}
                                                            disabled={actionLoading[user.id]}
                                                            className="px-3.5 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            {actionLoading[user.id] ? '...' : '🚫 Revoke'}
                                                        </button>
                                                    )}
                                                    {!user.is_admin && (
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            disabled={actionLoading[user.id]}
                                                            className="px-3.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ml-1"
                                                        >
                                                            {actionLoading[user.id] ? '...' : '🗑️ Delete'}
                                                        </button>
                                                    )}
                                                    {user.is_admin && (
                                                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
