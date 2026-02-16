import { Link, useLocation } from 'react-router-dom'
import { getRole } from '@/services/auth'
import { ROLE_DASHBOARD_PATH } from '@/types/auth'

const roleLabels: Record<string, string> = {
  BUYER: 'Buyer',
  FINANCE_MANAGER: 'Finance',
  INVENTORY_MANAGER: 'Inventory',
  ADMIN: 'Admin',
}

export function Sidebar() {
  const location = useLocation()
  const role = getRole()

  const navItems = role
    ? [{ path: ROLE_DASHBOARD_PATH[role] ?? '/buyer', label: `${roleLabels[role] ?? role} Dashboard` }]
    : []

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#1a1a2e',
        padding: '1.5rem 0',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '0.75rem 1.5rem',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
