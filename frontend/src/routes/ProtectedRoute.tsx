import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, getDashboardPathForRole } from '@/services/auth'
import type { UserRole } from '@/types/roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const authenticated = isAuthenticated()
  const userRole = localStorage.getItem('role') as UserRole | null

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && userRole) {
    const hasRole = allowedRoles.includes(userRole)
    if (!hasRole) {
      const fallbackPath = getDashboardPathForRole(userRole)
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <>{children}</>
}
