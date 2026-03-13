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

// ---------------------------------------------------------------------------
// OCR Upload
// ---------------------------------------------------------------------------

import type { OcrExtractionResponse, OcrInvoiceData, OcrQuotationData, OcrGrnData, DocType } from '@/types/ocr'

export async function uploadDocumentForOcr(
  transactionId: string,
  file: File,
  docType: DocType,
  options?: {
    engine?: 'LOCAL' | 'API'
    api_key?: string
  }
): Promise<OcrExtractionResponse> {

  const formData = new FormData()
  formData.append('file', file)

  if (options?.engine) {
    formData.append('ocr_engine', options.engine)
  }

  if (options?.api_key) {
    formData.append('api_key', options.api_key)
  }

  const { data } = await api.post<OcrExtractionResponse>(
    `/transactions/${transactionId}/upload/${docType}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )

  return data
}
export async function saveOcrInvoice(
  transactionId: string,
  payload: OcrInvoiceData
): Promise<{ message: string; invoice_id: string; item_count: number }> {
  const { data } = await api.post(`/transactions/${transactionId}/upload/invoice/save`, payload)
  return data
}

export async function saveOcrQuotation(
  transactionId: string,
  payload: OcrQuotationData
): Promise<{ message: string; quotation_id: string; item_count: number }> {
  const { data } = await api.post(`/transactions/${transactionId}/upload/quotation/save`, payload)
  return data
}

export async function saveOcrGrn(
  transactionId: string,
  payload: OcrGrnData
): Promise<{ message: string; grn_id: string; item_count: number }> {
  const { data } = await api.post(`/transactions/${transactionId}/upload/grn/save`, payload)
  return data
}
