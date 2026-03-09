import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTransactions } from '@/services/transactions'
import type { Transaction } from '@/types/transaction'
import { StatusBadge } from './StatusBadge'

interface TransactionTableProps {
  refreshTrigger?: number
}

export function TransactionTable({ refreshTrigger = 0 }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 403
            ? 'You do not have permission to view transactions.'
            : 'Failed to load transactions.'
          : 'Failed to load transactions.'
      setError(msg)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [refreshTrigger])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return <p style={{ color: '#64748b' }}>Loading transactions...</p>
  }

  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: 8,
        }}
      >
        {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <p style={{ color: '#64748b', padding: '1rem 0' }}>
        No transactions found.
      </p>
    )
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            ID
          </th>
          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            Title
          </th>
          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            Status
          </th>
          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            Created At
          </th>
          <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {t.id.slice(0, 8)}...
              </span>
            </td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{t.title}</td>
            <td style={{ padding: '0.75rem 1rem' }}>
              <StatusBadge status={t.status} />
            </td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>
              {formatDate(t.created_at)}
            </td>
            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
              <Link
                to={`/transactions/${t.id}`}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: '#1a1a2e',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

