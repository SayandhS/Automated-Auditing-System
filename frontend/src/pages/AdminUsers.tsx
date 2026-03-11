import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRole, getDashboardPathForRole } from '@/services/auth'
import { ROLES, type UserRole } from '@/types/roles'
import type { AdminUser } from '@/types/adminUser'
import { adminCreateUser, adminListUsers, adminUpdateUserRole } from '@/services/adminUsers'

const MANAGED_ROLES: Exclude<UserRole, 'ADMIN'>[] = [
  ROLES.BUYER,
  ROLES.FINANCE_MANAGER,
  ROLES.INVENTORY_MANAGER,
]

export function AdminUsers() {
  const navigate = useNavigate()
  const role = getRole() as UserRole | null

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createUsername, setCreateUsername] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<Exclude<UserRole, 'ADMIN'>>(ROLES.BUYER)
  const [creating, setCreating] = useState(false)

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== ROLES.ADMIN) {
      navigate(getDashboardPathForRole(role), { replace: true })
    }
  }, [navigate, role])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminListUsers()
      setUsers(data)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load users'
          : 'Failed to load users'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.username.localeCompare(b.username))
  }, [users])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await adminCreateUser({
        username: createUsername.trim(),
        password: createPassword,
        role: createRole,
      })
      setCreateUsername('')
      setCreatePassword('')
      setCreateRole(ROLES.BUYER)
      await loadUsers()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to create user'
          : 'Failed to create user'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: Exclude<UserRole, 'ADMIN'>) => {
    setError(null)
    setUpdatingUserId(userId)
    try {
      const updated = await adminUpdateUserRole(userId, { role: newRole })
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to update role'
          : 'Failed to update role'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>User Management</h1>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>Create users and manage roles (ADMIN only).</p>

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

      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Create User</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Username"
            value={createUsername}
            onChange={(e) => setCreateUsername(e.target.value)}
            required
            style={{
              padding: '0.6rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              minWidth: 200,
              flex: '1 1 200px',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
            style={{
              padding: '0.6rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              minWidth: 200,
              flex: '1 1 200px',
            }}
          />
          <select
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as Exclude<UserRole, 'ADMIN'>)}
            style={{
              padding: '0.6rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              minWidth: 220,
              flex: '0 1 220px',
            }}
          >
            {MANAGED_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: '0.6rem 1rem',
              background: '#1a1a2e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              flex: '0 0 auto',
            }}
          >
            {creating ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Users</h2>
      {loading ? (
        <p style={{ color: '#64748b' }}>Loading users…</p>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Username
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Role
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{u.username}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{u.role}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.role === ROLES.ADMIN ? (
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>—</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Exclude<UserRole, 'ADMIN'>)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontSize: '0.875rem',
                          cursor: updatingUserId === u.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {MANAGED_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

