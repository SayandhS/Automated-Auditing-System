import { api } from './api'
import type { LoginRequest, LoginResponse, UserMe } from '@/types/auth'
import { ROLE_DASHBOARD_PATH } from '@/types/auth'

const TOKEN_KEY = 'token'
const ROLE_KEY = 'role'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function setRole(role: string): void {
  localStorage.setItem(ROLE_KEY, role)
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function fetchUser(): Promise<UserMe> {
  const { data } = await api.get<UserMe>('/auth/me')
  if (data.role) {
    setRole(data.role)
  }
  return data
}

export function getDashboardPathForRole(role: string): string {
  return ROLE_DASHBOARD_PATH[role] ?? '/buyer'
}

export async function login(credentials: LoginRequest): Promise<{ user: UserMe }> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)
  setToken(data.access_token)
  const user = await fetchUser()
  return { user }
}

export function logout(): void {
  removeToken()
}
