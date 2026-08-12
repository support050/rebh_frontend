'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/axiosClient';
import {
    LayoutDashboard,
    MessageSquare,
    Search,
    Trash2,
    LogOut,
    Download,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';
import { getCsrfToken } from '@/lib/api/authFetch';

const API_URL = API_BASE_URL;

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async (search?: string) => {
        setLoading(true);
        try {
            const params = search ? { search } : {};
            const response = await apiClient.get('/api/contact/', { params });
            setMessages(response.data);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                router.push('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMessages(searchTerm);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        setDeletingId(id);
        try {
            await apiClient.delete(`/api/contact/${id}`, {
                headers: { 'x-csrf-token': getCsrfToken() },
            });
            setMessages(messages.filter(msg => msg.id !== id));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'x-csrf-token': getCsrfToken() }, credentials: 'include' });
        } catch {}
        router.push('/admin/login');
    };

    const exportCSV = () => {
        const headers = ["ID", "Name", "Email", "Message", "Date"];
        const rows = messages.map(msg => [
            msg.id,
            `"${msg.name}"`,
            `"${msg.email}"`,
            `"${msg.message.replace(/"/g, '""')}"`,
            new Date(msg.created_at).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `messages_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar / Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                        <p className="text-gray-500">Manage contact form submissions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchMessages(searchTerm)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>

                {/* Messages Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                <p>Loading messages...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : messages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <MessageSquare className="w-12 h-12 text-gray-300" />
                                                <p>No messages found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    messages.map((msg) => (
                                        <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{msg.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{msg.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={msg.message}>
                                                {msg.message}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    disabled={deletingId === msg.id}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === msg.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
