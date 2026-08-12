import { apiClient } from '@/lib/api/axiosClient';
import { getCsrfToken } from '@/lib/api/authFetch';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_approved: boolean;
  is_admin: boolean;
}

export const AdminService = {
    async getPendingUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/api/admin/pending-users');
        return response.data;
    },

    async approveUser(userId: number): Promise<void> {
        await apiClient.post(`/api/admin/approve-user/${userId}`, {}, {
            headers: { 'x-csrf-token': getCsrfToken() },
        });
    }
}
