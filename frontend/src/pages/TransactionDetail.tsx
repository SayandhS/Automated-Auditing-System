import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getTransaction,
  getTransactionAuditLogs,
  getQuotations,
  createQuotation,
  selectQuotation,
  getVendorEvaluation,
} from '@/services/transactions'
import { getDashboardPathForRole, getRole } from '@/services/auth'
import type { AuditLogEntry, Transaction, VendorQuotation, VendorEvaluation } from '@/types/transaction'
import { StatusBadge } from '@/components/StatusBadge'
import { AddQuotationModal } from '@/components/AddQuotationModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ROLES } from '@/types/roles'

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [quotations, setQuotations] = useState<VendorQuotation[]>([])
  const [vendorEvaluation, setVendorEvaluation] = useState<VendorEvaluation | null>(null)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    quotationId: string
    mode: 'override' | 'single'
  } | null>(null)
  const [selectLoading, setSelectLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuotations = async () => {
    if (!id) return
    try {
      const data = await getQuotations(id)
      setQuotations(data)
    } catch {
      setQuotations([])
    }
  }

  const loadEvaluation = async () => {
    if (!id) return
    const eval_ = await getVendorEvaluation(id)
    setVendorEvaluation(eval_)
  }

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tx, logs, quots, eval_] = await Promise.all([
          getTransaction(id),
          getTransactionAuditLogs(id),
          getQuotations(id),
          getVendorEvaluation(id),
        ])
        setTransaction(tx)
        setAuditLogs(logs)
        setQuotations(quots)
        setVendorEvaluation(eval_)
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status === 403
              ? 'You do not have permission to view this transaction.'
              : (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to load transaction'
            : 'Failed to load transaction.'
        setError(Array.isArray(msg) ? msg[0] : String(msg))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAddQuotation = async (payload: {
    vendor_name: string
    total_amount: number
    currency: string
  }) => {
    if (!id) return
    await createQuotation(id, payload)
    await loadQuotations()
    await loadEvaluation()
  }

  const performSelectQuotation = async (quotationId: string) => {
    if (!id) return
    setSelectLoading(true)
    try {
      await selectQuotation(id, quotationId)
      await Promise.all([loadQuotations(), loadEvaluation()])
      const tx = await getTransaction(id)
      setTransaction(tx)
      const logs = await getTransactionAuditLogs(id)
      setAuditLogs(logs)
      setConfirmModal(null)
    } finally {
      setSelectLoading(false)
    }
  }

  const handleSelectClick = (q: VendorQuotation) => {
    if (!vendorEvaluation || !id) return
    if (vendorEvaluation.type === 'MULTI_VENDOR') {
      const isRecommended = vendorEvaluation.recommended_vendor_id === q.id
      if (isRecommended) {
        performSelectQuotation(q.id)
      } else {
        setConfirmModal({ quotationId: q.id, mode: 'override' })
      }
    } else {
      setConfirmModal({ quotationId: q.id, mode: 'single' })
    }
  }

  const handleConfirmSelect = () => {
    if (!confirmModal) return
    performSelectQuotation(confirmModal.quotationId)
  }

  const isBuyer = getRole() === ROLES.BUYER
  const canAddQuotation =
    isBuyer &&
    transaction &&
    (transaction.status === 'CREATED' || transaction.status === 'VENDOR_SELECTED')
  const selectionDisabled = transaction?.status === 'VENDOR_SELECTED'
  const isRecommended = (q: VendorQuotation) =>
    vendorEvaluation?.type === 'MULTI_VENDOR' &&
    vendorEvaluation.recommended_vendor_id === q.id

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return <p style={{ color: '#64748b' }}>Loading...</p>
  }

  if (error || !transaction) {
    return (
      <div>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error ?? 'Transaction not found.'}</p>
        <Link to={getDashboardPathForRole(getRole() ?? 'BUYER')} style={{ color: '#1d4ed8', fontSize: '0.875rem' }}>
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to={getDashboardPathForRole(getRole() ?? 'BUYER')}
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        ← Back
      </Link>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{transaction.title}</h1>
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Status: </span>
          <StatusBadge status={transaction.status} />
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Created At: </span>
          <span style={{ fontSize: '0.875rem' }}>{formatDate(transaction.created_at)}</span>
        </div>
      </div>

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Vendor Comparison</h2>
      {vendorEvaluation?.type === 'SINGLE_VENDOR' && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 8,
            fontSize: '0.875rem',
          }}
        >
          {vendorEvaluation.message}
        </div>
      )}
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {canAddQuotation && (
          <button
            type="button"
            onClick={() => setQuotationModalOpen(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a2e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Add Quotation
          </button>
        )}
      </div>
      {quotations.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          No quotations yet.
        </p>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '1.5rem',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Vendor Name
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Grand Total
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Currency
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Recommended
                </th>
                {isBuyer && (
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    Select
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    ...(isRecommended(q)
                      ? { background: 'rgba(59, 130, 246, 0.06)', borderLeft: '3px solid #3b82f6' }
                      : {}),
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{q.vendor_name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{q.total_amount}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{q.currency}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {isRecommended(q) ? (
                      <span style={{ color: '#15803d', fontWeight: 500, fontSize: '0.875rem' }}>Yes</span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No</span>
                    )}
                  </td>
                  {isBuyer && (
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {!q.is_selected && !selectionDisabled && (
                        <button
                          type="button"
                          onClick={() => handleSelectClick(q)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: '#1a1a2e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                          }}
                        >
                          Select
                        </button>
                      )}
                      {q.is_selected && (
                        <span style={{ padding: '0.25rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: 6, fontSize: '0.75rem' }}>
                          Selected
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddQuotationModal
        isOpen={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
        onSubmit={handleAddQuotation}
      />

      {confirmModal && (
        <ConfirmModal
          isOpen
          title={confirmModal.mode === 'override' ? 'Confirm vendor selection' : 'Single vendor'}
          message={
            confirmModal.mode === 'override'
              ? 'You are selecting a vendor different from system recommendation. Proceed?'
              : (vendorEvaluation?.type === 'SINGLE_VENDOR' ? vendorEvaluation.message : 'Only one vendor. Proceed?')
          }
          confirmLabel="Proceed"
          onConfirm={handleConfirmSelect}
          onCancel={() => setConfirmModal(null)}
          loading={selectLoading}
        />
      )}

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Audit Logs</h2>
      {auditLogs.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No audit logs.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {auditLogs.map((log) => (
            <li
              key={log.id}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ fontWeight: 500 }}>{log.action}</span>
              <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                — {formatDate(log.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
