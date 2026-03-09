import { useState } from 'react'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string) => Promise<void>
}

export function CreateTransactionModal({ isOpen, onClose, onSubmit }: CreateTransactionModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(title)
      setTitle('')
      onClose()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to create transaction'
          : 'Failed to create transaction'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setTitle('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '1.5rem',
          width: 400,
          maxWidth: '90vw',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Create Transaction</h2>
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="transaction-title" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Title
            </label>
            <input
              id="transaction-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: '#1a1a2e',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
