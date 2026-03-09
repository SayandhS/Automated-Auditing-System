import { api } from './api'
import type { AuditLogEntry, Transaction, VendorQuotation, VendorEvaluation } from '@/types/transaction'

export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/transactions')
  return data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await api.get<Transaction>(`/transactions/${id}`)
  return data
}

export async function getTransactionAuditLogs(id: string): Promise<AuditLogEntry[]> {
  const { data } = await api.get<AuditLogEntry[]>(`/transactions/${id}/audit-logs`)
  return data
}

export async function createTransaction(title: string): Promise<Transaction> {
  const { data } = await api.post<Transaction>('/transactions', { title })
  return data
}

export async function getQuotations(transactionId: string): Promise<VendorQuotation[]> {
  const { data } = await api.get<VendorQuotation[]>(`/transactions/${transactionId}/quotations`)
  return data
}

export async function createQuotation(
  transactionId: string,
  payload: { vendor_name: string; total_amount: number; currency: string }
): Promise<VendorQuotation> {
  const { data } = await api.post<VendorQuotation>(
    `/transactions/${transactionId}/quotations`,
    payload
  )
  return data
}

export async function selectQuotation(
  transactionId: string,
  quotationId: string
): Promise<VendorQuotation> {
  const { data } = await api.post<VendorQuotation>(
    `/transactions/${transactionId}/quotations/${quotationId}/select`
  )
  return data
}

export async function getVendorEvaluation(transactionId: string): Promise<VendorEvaluation | null> {
  try {
    const { data } = await api.get<VendorEvaluation>(
      `/transactions/${transactionId}/vendor-evaluation`
    )
    return data
  } catch {
    return null
  }
}
