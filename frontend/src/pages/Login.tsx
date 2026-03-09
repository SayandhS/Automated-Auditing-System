import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { login, isAuthenticated, getDashboardPathForRole, removeToken } from '@/services/auth'
import { URL_ROLE_TO_BACKEND, URL_ROLE_TO_LABEL } from '@/types/auth'

const VALID_ROLES = ['buyer', 'finance', 'inventory', 'admin']

export function Login() {
  const { role: urlRole } = useParams<{ role: string }>()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const expectedBackendRole = urlRole ? URL_ROLE_TO_BACKEND[urlRole.toLowerCase()] : null
  const title = urlRole && URL_ROLE_TO_LABEL[urlRole.toLowerCase()]
    ? `${URL_ROLE_TO_LABEL[urlRole.toLowerCase()]} Login`
    : 'Login'

  useEffect(() => {
    if (isAuthenticated() && expectedBackendRole) {
      const storedRole = localStorage.getItem('role')
      if (storedRole === expectedBackendRole) {
        navigate(getDashboardPathForRole(expectedBackendRole), { replace: true })
      }
    }
  }, [expectedBackendRole, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await login({ username, password })
      const backendRole = user.role
      if (expectedBackendRole && backendRole !== expectedBackendRole) {
        removeToken()
        setError('Invalid credentials for selected role.')
        return
      }
      navigate(getDashboardPathForRole(backendRole), { replace: true })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Login failed'
          : err instanceof Error
            ? err.message
            : 'Login failed'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
    } finally {
      setLoading(false)
    }
  }

  if (urlRole && !VALID_ROLES.includes(urlRole.toLowerCase())) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f7',
        }}
      >
        <p style={{ color: '#64748b' }}>Invalid role. Use /login/buyer, /login/finance, /login/inventory, or /login/admin.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          padding: '2rem',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{title}</h1>
        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 6,
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: '1rem',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
