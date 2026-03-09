import { useState } from 'react'
import type { QuotationLineItem } from '@/types/transaction'

const defaultLineItem: QuotationLineItem = { item_name: '', quantity: 0, unit_price: 0 }

function lineTotal(item: QuotationLineItem): number {
  return item.quantity * item.unit_price
}

interface AddQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { vendor_name: string; total_amount: number; currency: string }) => Promise<void>
}

export function AddQuotationModal({ isOpen, onClose, onSubmit }: AddQuotationModalProps) {
  const [vendorName, setVendorName] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([{ ...defaultLineItem }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addRow = () => {
    setLineItems((prev) => [...prev, { ...defaultLineItem }])
  }

  const removeRow = (index: number) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof QuotationLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const grandTotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({
        vendor_name: vendorName,
        total_amount: Math.round(grandTotal * 100) / 100,
        currency,
      })
      setVendorName('')
      setCurrency('INR')
      setLineItems([{ ...defaultLineItem }])
      onClose()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to add quotation'
          : 'Failed to add quotation'
      setError(Array.isArray(msg) ? msg[0] : String(msg))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setVendorName('')
      setCurrency('INR')
      setLineItems([{ ...defaultLineItem }])
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  }
  const thStyle = {
    padding: '0.5rem',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
  }
  const tdStyle = {
    padding: '0.5rem',
    borderBottom: '1px solid #f1f5f9',
  }
  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: '0.875rem',
  }

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
          width: 640,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Add Quotation</h2>
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
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Line Items
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Item Name</th>
                <th style={{ ...thStyle, width: 100 }}>Quantity</th>
                <th style={{ ...thStyle, width: 120 }}>Unit Price</th>
                <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>Line Total</th>
                <th style={{ ...thStyle, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index}>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateRow(index, 'item_name', e.target.value)}
                      style={inputStyle}
                      placeholder="Item name"
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={item.quantity || ''}
                      onChange={(e) => updateRow(index, 'quantity', parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price || ''}
                      onChange={(e) => updateRow(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>
                    {(lineTotal(item) || 0).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={lineItems.length <= 1}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        cursor: lineItems.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addRow}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              background: '#f1f5f9',
              border: '1px dashed #cbd5e1',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            + Add row
          </button>
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: 8,
              textAlign: 'right',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Grand Total: {grandTotal.toFixed(2)} {currency}
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
              {loading ? 'Adding...' : 'Add Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
