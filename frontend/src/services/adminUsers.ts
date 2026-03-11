import { api } from '@/services/api'
import type { AdminUser, AdminUserCreateRequest, AdminUserRoleUpdateRequest } from '@/types/adminUser'

export async function adminListUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>('/admin/users')
  return data
}

export async function adminCreateUser(payload: AdminUserCreateRequest): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>('/admin/users', payload)
  return data
}

export async function adminUpdateUserRole(userId: string, payload: AdminUserRoleUpdateRequest): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${userId}/role`, payload)
  return data
}

