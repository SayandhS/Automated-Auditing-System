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
