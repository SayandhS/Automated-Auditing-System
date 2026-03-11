import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { BuyerDashboard } from '@/pages/BuyerDashboard'
import { FinanceDashboard } from '@/pages/FinanceDashboard'
import { InventoryDashboard } from '@/pages/InventoryDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { TransactionDetail } from '@/pages/TransactionDetail'
import { AdminUsers } from '@/pages/AdminUsers'
import { ROLES } from '@/types/roles'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/:role" element={<Login />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.BUYER, ROLES.FINANCE_MANAGER, ROLES.INVENTORY_MANAGER]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="buyer" element={
          <ProtectedRoute allowedRoles={[ROLES.BUYER]}>
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="finance" element={
          <ProtectedRoute allowedRoles={[ROLES.FINANCE_MANAGER]}>
            <FinanceDashboard />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}>
            <InventoryDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="transactions/:id" element={<TransactionDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
