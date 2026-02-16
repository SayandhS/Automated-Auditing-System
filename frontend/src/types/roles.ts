// Roles aligned with backend
export type UserRole = 'ADMIN' | 'BUYER' | 'FINANCE_MANAGER' | 'INVENTORY_MANAGER'

export const ROLES = {
  ADMIN: 'ADMIN' as const,
  BUYER: 'BUYER' as const,
  FINANCE_MANAGER: 'FINANCE_MANAGER' as const,
  INVENTORY_MANAGER: 'INVENTORY_MANAGER' as const,
}
