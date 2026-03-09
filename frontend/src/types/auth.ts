export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role?: string
}

export interface UserMe {
  id: string
  username: string
  role: string
}

export const ROLE_DASHBOARD_PATH: Record<string, string> = {
  BUYER: '/buyer',
  FINANCE_MANAGER: '/finance',
  INVENTORY_MANAGER: '/inventory',
  ADMIN: '/admin',
}

/** Map URL role param (e.g. "buyer") to backend role (e.g. "BUYER") */
export const URL_ROLE_TO_BACKEND: Record<string, string> = {
  buyer: 'BUYER',
  finance: 'FINANCE_MANAGER',
  inventory: 'INVENTORY_MANAGER',
  admin: 'ADMIN',
}

/** Map URL role param to display label */
export const URL_ROLE_TO_LABEL: Record<string, string> = {
  buyer: 'Buyer',
  finance: 'Finance Manager',
  inventory: 'Inventory Manager',
  admin: 'Admin',
}
