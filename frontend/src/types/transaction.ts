export interface Transaction {
  id: string
  title: string
  created_by_id: string
  status: string
  created_at: string
  updated_at: string
}

export interface AuditLogEntry {
  id: string
  action: string
  performed_by: string
  timestamp: string
}

export interface VendorQuotation {
  id: string
  transaction_id: string
  vendor_name: string
  total_amount: string
  currency: string
  is_selected: boolean
  created_at: string
}

export interface QuotationLineItem {
  item_name: string
  quantity: number
  unit_price: number
}

export type VendorEvaluation =
  | {
      type: 'SINGLE_VENDOR'
      message: string
      recommended_vendor_id: null
    }
  | {
      type: 'MULTI_VENDOR'
      recommended_vendor_id: string
      recommended_vendor_name: string
    }
