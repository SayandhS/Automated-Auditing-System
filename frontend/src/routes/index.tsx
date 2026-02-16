import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { Login } from '@/pages/Login'
import { BuyerDashboard } from '@/pages/BuyerDashboard'
import { FinanceDashboard } from '@/pages/FinanceDashboard'
import { InventoryDashboard } from '@/pages/InventoryDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { ROLES } from '@/types/roles'
import { getDashboardPathForRole } from '@/services/auth'

function RoleRedirect() {
  const role = localStorage.getItem('role')
  const path = role ? getDashboardPathForRole(role) : '/buyer'
  return <Navigate to={path} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUYER, ROLES.FINANCE_MANAGER, ROLES.INVENTORY_MANAGER]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route
          path="buyer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BUYER]}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.FINANCE_MANAGER]}>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  )
}
