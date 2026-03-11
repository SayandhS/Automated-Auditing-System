/** Types for OCR upload feature */

export interface OcrExtractionResponse {
  doc_type: string
  mock: boolean
  data: OcrInvoiceData | OcrQuotationData | OcrGrnData
}

export interface OcrInvoiceItem {
  product_name: string
  quantity: number
  unit_price: number
  gst_percent: number
  line_total: number
}

export interface OcrInvoiceData {
  invoice_number: string
  vendor_name: string
  currency: string
  subtotal: number
  gst_total: number
  discount: number
  grand_total: number
  items: OcrInvoiceItem[]
}

export interface OcrQuotationItem {
  product_name: string
  quantity: number
  unit_price: number
  gst_percent: number
  line_total: number
}

export interface OcrQuotationData {
  vendor_name: string
  currency: string
  subtotal: number
  gst_total: number
  discount: number
  grand_total: number
  items: OcrQuotationItem[]
}

export interface OcrGrnItem {
  product_name: string
  quantity_received: number
}

export interface OcrGrnData {
  grn_number: string
  items: OcrGrnItem[]
}

export type DocType = 'invoice' | 'quotation' | 'grn'
