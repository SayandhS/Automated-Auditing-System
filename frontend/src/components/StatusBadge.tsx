const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CREATED: { bg: '#e2e8f0', text: '#475569' },
  VENDOR_SELECTED: { bg: '#dbeafe', text: '#1d4ed8' },
  PO_APPROVED: { bg: '#dcfce7', text: '#15803d' },
  PO_REJECTED: { bg: '#fee2e2', text: '#dc2626' },
  PAYMENT_REVIEW: { bg: '#ffedd5', text: '#c2410c' },
  CLOSED: { bg: '#f3e8ff', text: '#7c3aed' },
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? { bg: '#e2e8f0', text: '#64748b' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.5rem',
        borderRadius: 6,
        fontSize: '0.75rem',
        fontWeight: 500,
        background: colors.bg,
        color: colors.text,
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
