import { useState, useRef, useCallback } from 'react'
import type { DocType, OcrExtractionResponse, OcrInvoiceData, OcrQuotationData, OcrGrnData } from '@/types/ocr'
import { uploadDocumentForOcr, saveOcrInvoice, saveOcrQuotation, saveOcrGrn } from '@/services/transactions'

interface DocumentUploadProps {
    transactionId: string
    onSaved?: () => void
}

const DOC_TYPES: { value: DocType; label: string; icon: string }[] = [
    { value: 'invoice', label: 'Invoice', icon: '🧾' },
    { value: 'quotation', label: 'Quotation', icon: '📋' },
    { value: 'grn', label: 'GRN', icon: '📦' },
]

export function DocumentUpload({ transactionId, onSaved }: DocumentUploadProps) {
    const [activeTab, setActiveTab] = useState<DocType>('invoice')
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [extraction, setExtraction] = useState<OcrExtractionResponse | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetState = useCallback(() => {
        setExtraction(null)
        setSelectedFile(null)
        setError(null)
        setSuccessMsg(null)
    }, [])

    const handleTabChange = (tab: DocType) => {
        setActiveTab(tab)
        resetState()
    }

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPEG, PNG, etc.)')
            return
        }
        setSelectedFile(file)
        setError(null)
        setSuccessMsg(null)
        setUploading(true)
        try {
            const result = await uploadDocumentForOcr(transactionId, file, activeTab)
            setExtraction(result)
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'OCR extraction failed'
                    : 'OCR extraction failed. Is the OCR service running?'
            setError(String(msg))
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleSave = async () => {
        if (!extraction) return
        setSaving(true)
        setError(null)
        try {
            let result: { message: string }
            if (activeTab === 'invoice') {
                result = await saveOcrInvoice(transactionId, extraction.data as OcrInvoiceData)
            } else if (activeTab === 'quotation') {
                result = await saveOcrQuotation(transactionId, extraction.data as OcrQuotationData)
            } else {
                result = await saveOcrGrn(transactionId, extraction.data as OcrGrnData)
            }
            setSuccessMsg(result.message)
            setExtraction(null)
            setSelectedFile(null)
            onSaved?.()
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Save failed'
                    : 'Save failed'
            setError(String(msg))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>Upload Documents (OCR)</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {DOC_TYPES.map((dt) => (
                    <button
                        key={dt.value}
                        type="button"
                        onClick={() => handleTabChange(dt.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: activeTab === dt.value ? '#1a1a2e' : '#f1f5f9',
                            color: activeTab === dt.value ? '#fff' : '#475569',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: activeTab === dt.value ? 600 : 400,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {dt.icon} {dt.label}
                    </button>
                ))}
            </div>

            {/* Error / Success messages */}
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
            {successMsg && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        borderRadius: 6,
                        fontSize: '0.875rem',
                    }}
                >
                    ✓ {successMsg}
                </div>
            )}

            {/* Upload zone */}
            {!extraction && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
                        borderRadius: 12,
                        padding: '2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? 'rgba(59,130,246,0.04)' : '#fafafa',
                        transition: 'all 0.2s',
                        marginBottom: '1rem',
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />
                    {uploading ? (
                        <div>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                            <p style={{ color: '#3b82f6', fontWeight: 500 }}>Extracting data...</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                This may take a moment (OCR + AI structuring)
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                            <p style={{ color: '#475569', fontWeight: 500 }}>
                                Drop a scanned {DOC_TYPES.find(d => d.value === activeTab)?.label} image here
                            </p>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                or click to browse • JPEG, PNG supported
                            </p>
                            {selectedFile && (
                                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Extraction preview */}
            {extraction && (
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        marginBottom: '1rem',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                            Extracted Data Preview
                            {extraction.mock && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 400 }}>
                                    (mock data)
                                </span>
                            )}
                        </h3>
                        <button
                            type="button"
                            onClick={resetState}
                            style={{
                                padding: '0.375rem 0.75rem',
                                background: 'transparent',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                            }}
                        >
                            ✕ Discard
                        </button>
                    </div>

                    {/* Render based on doc type */}
                    {activeTab === 'invoice' && <InvoicePreview data={extraction.data as OcrInvoiceData} />}
                    {activeTab === 'quotation' && <QuotationPreview data={extraction.data as OcrQuotationData} />}
                    {activeTab === 'grn' && <GrnPreview data={extraction.data as OcrGrnData} />}

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={resetState}
                            disabled={saving}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#15803d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            {saving ? 'Saving...' : '✓ Confirm & Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}


// ---------------------------------------------------------------------------
// Preview sub-components
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
    padding: '0.5rem',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
}
const tdStyle: React.CSSProperties = {
    padding: '0.5rem',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.875rem',
}
const headerFieldStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
}
const fieldStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    background: '#f8fafc',
    padding: '0.375rem 0.75rem',
    borderRadius: 6,
}

function InvoicePreview({ data }: { data: OcrInvoiceData }) {
    return (
        <div>
            <div style={headerFieldStyle}>
                <span style={fieldStyle}><strong>Invoice #:</strong> {data.invoice_number}</span>
                <span style={fieldStyle}><strong>Vendor:</strong> {data.vendor_name}</span>
                <span style={fieldStyle}><strong>Currency:</strong> {data.currency}</span>
            </div>
            <div style={headerFieldStyle}>
                <span style={fieldStyle}><strong>Subtotal:</strong> {data.subtotal}</span>
                <span style={fieldStyle}><strong>GST:</strong> {data.gst_total}</span>
                <span style={fieldStyle}><strong>Discount:</strong> {data.discount}</span>
                <span style={fieldStyle}><strong>Grand Total:</strong> {data.grand_total}</span>
            </div>
            <ItemsTable items={data.items} showPricing />
        </div>
    )
}

function QuotationPreview({ data }: { data: OcrQuotationData }) {
    return (
        <div>
            <div style={headerFieldStyle}>
                <span style={fieldStyle}><strong>Vendor:</strong> {data.vendor_name}</span>
                <span style={fieldStyle}><strong>Currency:</strong> {data.currency}</span>
            </div>
            <div style={headerFieldStyle}>
                <span style={fieldStyle}><strong>Subtotal:</strong> {data.subtotal}</span>
                <span style={fieldStyle}><strong>GST:</strong> {data.gst_total}</span>
                <span style={fieldStyle}><strong>Discount:</strong> {data.discount}</span>
                <span style={fieldStyle}><strong>Grand Total:</strong> {data.grand_total}</span>
            </div>
            <ItemsTable items={data.items} showPricing />
        </div>
    )
}

function GrnPreview({ data }: { data: OcrGrnData }) {
    return (
        <div>
            <div style={headerFieldStyle}>
                <span style={fieldStyle}><strong>GRN #:</strong> {data.grn_number}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={thStyle}>Product Name</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Qty Received</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, i) => (
                        <tr key={i}>
                            <td style={tdStyle}>{item.product_name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity_received}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ItemsTable({ items, showPricing }: { items: { product_name: string; quantity: number; unit_price: number; gst_percent: number; line_total: number }[]; showPricing: boolean }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th style={thStyle}>Product Name</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                    {showPricing && (
                        <>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>GST %</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Line Total</th>
                        </>
                    )}
                </tr>
            </thead>
            <tbody>
                {items.map((item, i) => (
                    <tr key={i}>
                        <td style={tdStyle}>{item.product_name}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity}</td>
                        {showPricing && (
                            <>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.unit_price}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.gst_percent}%</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{item.line_total}</td>
                            </>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
