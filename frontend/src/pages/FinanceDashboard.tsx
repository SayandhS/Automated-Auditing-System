import { TransactionTable } from '@/components/TransactionTable'

export function FinanceDashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Finance Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>Welcome, finance manager.</p>
      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Transactions</h2>
      <TransactionTable />
    </div>
  )
}
