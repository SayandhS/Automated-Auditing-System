import { Link } from 'react-router-dom'

const roleOptions = [
  { path: '/login/buyer', label: 'Buyer' },
  { path: '/login/finance', label: 'Finance Manager' },
  { path: '/login/inventory', label: 'Inventory Manager' },
]

export function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
      }}
    >
      <Link
        to="/login/admin"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          fontSize: '0.875rem',
          color: '#64748b',
        }}
      >
        Admin Login
      </Link>

      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600 }}>Select your role</h1>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: 280,
        }}
      >
        {roleOptions.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            style={{
              padding: '1.25rem 1.5rem',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: '1.125rem',
              fontWeight: 500,
              textAlign: 'center',
              color: '#1a1a2e',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
