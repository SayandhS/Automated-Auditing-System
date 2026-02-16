import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, isAuthenticated, getDashboardPathForRole } from '@/services/auth'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  useEffect(() => {
    if (isAuthenticated()) {
      const role = localStorage.getItem('role')
      const target = from ?? (role ? getDashboardPathForRole(role) : '/buyer')
      navigate(target, { replace: true })
    }
  }, [from, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await login({ username, password })
      const target = from ?? getDashboardPathForRole(user.role)
      navigate(target, { replace: true })
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
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Login</h1>
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
