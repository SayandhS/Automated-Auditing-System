import { useState } from 'react'
import { getRole } from '@/services/auth'
import { createTransaction } from '@/services/transactions'
import { TransactionTable } from '@/components/TransactionTable'
import { CreateTransactionModal } from '@/components/CreateTransactionModal'
import { ROLES } from '@/types/roles'

export function BuyerDashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const role = getRole()
  const isBuyer = role === ROLES.BUYER

  const handleCreateTransaction = async (title: string) => {
    await createTransaction(title)
    setRefreshTrigger((k) => k + 1)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Buyer Dashboard</h1>
          <p style={{ color: '#64748b' }}>Welcome, buyer.</p>
        </div>
        {isBuyer && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            Create Transaction
          </button>
        )}
      </div>
      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Transactions</h2>
      <TransactionTable refreshTrigger={refreshTrigger} />
      <CreateTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTransaction}
      />
    </div>
  )
}
