import type { UserRole } from '@/types/roles'

export interface AdminUser {
  id: string
  username: string
  role: UserRole
}

export interface AdminUserCreateRequest {
  username: string
  password: string
  role: Exclude<UserRole, 'ADMIN'>
}

export interface AdminUserRoleUpdateRequest {
  role: Exclude<UserRole, 'ADMIN'>
}

