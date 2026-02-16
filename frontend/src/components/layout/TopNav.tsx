import { useNavigate } from 'react-router-dom'
import { logout } from '@/services/auth'

export function TopNav() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>App</span>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          padding: '0.5rem 1rem',
          background: 'transparent',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Logout
      </button>
    </header>
  )
}
