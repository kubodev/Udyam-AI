import { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Trash2, Eye, AlertCircle, CheckCircle,
  Clock, RefreshCw, X, ChevronDown, ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  uploadDocument, getDocuments, deleteDocument, getDocumentUrl, getDocumentFile, getExtraction, updateDocumentStatus,
} from '../services/documents';
import { extractTextFromFile, saveExtraction } from '../services/ocr';
import type { Document, DocumentExtraction } from '../types';

const DOC_TYPES: { value: Document['doc_type']; label: string }[] = [
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'invoice', label: 'Invoice / Bill' },
  { value: 'certificate', label: 'Certificate (GST/Udyam/other)' },
  { value: 'other', label: 'Other' },
];

function statusIcon(status: Document['status']) {
  switch (status) {
    case 'extracted': return <CheckCircle size={15} color="var(--color-success-600)" />;
    case 'processing': return <RefreshCw size={15} color="var(--color-accent-600)" style={{ animation: 'spin 1s linear infinite' }} />;
    case 'needs_review': return <AlertCircle size={15} color="var(--color-accent-600)" />;
    case 'error': return <AlertCircle size={15} color="var(--color-danger-600)" />;
    default: return <Clock size={15} color="var(--color-surface-400)" />;
  }
}

function statusLabel(status: Document['status']) {
  const map: Record<string, string> = {
    uploaded: 'Uploaded',
    processing: 'Processing…',
    extracted: 'Extracted',
    needs_review: 'Needs review',
    error: 'Error',
  };
  return map[status] ?? status;
}

function docTypeLabel(dt: Document['doc_type']) {
  return DOC_TYPES.find((t) => t.value === dt)?.label ?? dt ?? 'Unknown';
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<Document['doc_type']>('bank_statement');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<Record<string, DocumentExtraction | null>>({});
  const [loadingExtraction, setLoadingExtraction] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getDocuments(user.id).then((docs) => { setDocuments(docs); setLoading(false); });
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const { data, error: err } = await uploadDocument(user.id, file, uploadType);

    if (err) {
      setUploading(false);
      setError(`Upload failed: ${err}`);
      return;
    }
    if (data) {
      // Persist the uploaded file first, then immediately extract its PDF text
      // (or OCR images/scanned PDFs) and store the result for this document.
      setDocuments((prev) => [{ ...data, status: 'processing' }, ...prev]);
      await updateDocumentStatus(data.id, 'processing');
      const extraction = await extractTextFromFile(file);

      if (extraction.text) {
        await saveExtraction(data.id, extraction.text);
        const extractedDoc = { ...data, status: 'extracted' as const };
        setDocuments((prev) => prev.map((doc) => doc.id === data.id ? extractedDoc : doc));
        setExtractions((prev) => ({
          ...prev,
          [data.id]: {
            id: `local-${data.id}`,
            document_id: data.id,
            extracted_fields: { raw_text: extraction.text, source: file.type === 'application/pdf' ? 'PDF text extraction' : 'OCR' },
            confidence: null,
            reviewed: false,
            created_at: new Date().toISOString(),
          },
        }));
      } else {
        await updateDocumentStatus(data.id, 'error');
        setDocuments((prev) => prev.map((doc) => doc.id === data.id ? { ...doc, status: 'error' } : doc));
        setError(`Could not extract text from this file: ${extraction.error ?? 'No readable text found.'}`);
      }
    }
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${docTypeLabel(doc.doc_type)}" uploaded on ${new Date(doc.uploaded_at).toLocaleDateString('en-IN')}?`)) return;
    setDeletingId(doc.id);
    await deleteDocument(doc);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setDeletingId(null);
  };

  const handleView = async (doc: Document) => {
    if (!doc.storage_path) return;
    const url = await getDocumentUrl(doc.storage_path);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExpand = async (doc: Document) => {
    if (expandedId === doc.id) { setExpandedId(null); return; }
    setExpandedId(doc.id);
    if (!(doc.id in extractions)) {
      setLoadingExtraction(doc.id);
      const ext = await getExtraction(doc.id);
      setExtractions((prev) => ({ ...prev, [doc.id]: ext }));
      setLoadingExtraction(null);
    }
  };

  const handleExtractExisting = async (doc: Document) => {
    if (!doc.storage_path) return;
    setExtractingId(doc.id);
    setError(null);
    await updateDocumentStatus(doc.id, 'processing');
    setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, status: 'processing' } : item));

    const file = await getDocumentFile(doc.storage_path);
    if (!file) {
      await updateDocumentStatus(doc.id, 'error');
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, status: 'error' } : item));
      setError('Could not open this stored document for extraction.');
      setExtractingId(null);
      return;
    }

    const result = await extractTextFromFile(file);
    if (result.text) {
      await saveExtraction(doc.id, result.text);
      const extractedDoc = { ...doc, status: 'extracted' as const };
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? extractedDoc : item));
      setExtractions((prev) => ({
        ...prev,
        [doc.id]: {
          id: `local-${doc.id}`, document_id: doc.id,
          extracted_fields: { raw_text: result.text, source: file.type === 'application/pdf' ? 'PDF text extraction' : 'OCR' },
          confidence: null, reviewed: false, created_at: new Date().toISOString(),
        },
      }));
      setExpandedId(doc.id);
    } else {
      await updateDocumentStatus(doc.id, 'error');
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, status: 'error' } : item));
      setError(`Could not extract text: ${result.error ?? 'No readable text found.'}`);
    }
    setExtractingId(null);
  };

  const handleSummarizeWithAI = (doc: Document, extraction: DocumentExtraction) => {
    const rawText = extraction.extracted_fields?.raw_text;
    if (typeof rawText !== 'string' || !rawText.trim()) {
      setError('Extract text from this document before asking the AI to summarise it.');
      return;
    }
    const request = `Please summarise this ${docTypeLabel(doc.doc_type)} in a clear, structured way. Highlight key amounts, dates, parties, potential risks, and practical next steps.\n\n[Extracted document text]\n${rawText.slice(0, 24_000)}`;
    sessionStorage.setItem('udyam_ai_pending_message', request);
    navigate('/assistant');
  };

  const selectedTypeLabel = DOC_TYPES.find((t) => t.value === uploadType)?.label ?? 'Select type';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Documents</h1>
            <p>Upload bank statements, invoices, and certificates for AI-powered extraction</p>
          </div>

          {/* Upload controls */}
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            {/* Doc-type selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowTypeDropdown((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.58rem 0.95rem',
                  border: '1px solid var(--color-surface-300)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-100)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'var(--color-surface-800)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-50)';
                  e.currentTarget.style.borderColor = 'var(--color-surface-400)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-100)';
                  e.currentTarget.style.borderColor = 'var(--color-surface-300)';
                }}
              >
                <span>{selectedTypeLabel}</span>
                <ChevronDown size={14} color="var(--color-surface-400)" />
              </button>
              {showTypeDropdown && (
                <div style={{
                  position: 'absolute', top: '115%', right: 0, zIndex: 50,
                  background: 'var(--color-surface-100)',
                  border: '1px solid var(--color-surface-300)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '15rem', padding: '0.4rem',
                  overflow: 'hidden',
                }}>
                  {DOC_TYPES.map((t) => {
                    const isSelected = uploadType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => { setUploadType(t.value); setShowTypeDropdown(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
                          padding: '0.6rem 0.85rem', fontSize: '0.8125rem',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--color-primary-50)' : 'transparent',
                          color: isSelected ? 'var(--color-primary-700)' : 'var(--color-surface-700)',
                          fontWeight: isSelected ? 600 : 400,
                          border: isSelected ? '1px solid var(--color-primary-200)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--color-surface-50)';
                            e.currentTarget.style.color = 'var(--color-surface-900)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-surface-700)';
                          }
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              id="doc-file-input"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              className="btn btn-primary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
              ) : (
                <><Upload size={15} /> Upload Document</>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={15} color="var(--color-danger-600)" />
            <span style={{ fontSize: '0.8125rem' }}>{error}</span>
          </div>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
            <X size={15} color="var(--color-danger-600)" />
          </button>
        </div>
      )}

      {/* Info banner */}
      <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
        📄 Supported formats: PDF, PNG, JPG, WebP — max 10 MB per file.
        Files are stored securely in Supabase Storage. Extraction runs automatically after upload.
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ height: '4.5rem' }} />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <h3>No documents uploaded yet</h3>
            <p>
              Upload bank statements, invoices, or certificates. UdyamAI will extract
              key financial data to power health checks and funding fit assessments.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              Upload your first document
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {documents.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const extraction = extractions[doc.id];
            const isLoadingExt = loadingExtraction === doc.id;

            return (
              <div
                key={doc.id}
                className="card"
                style={{ overflow: 'hidden', transition: 'all 0.2s' }}
              >
                {/* Main row */}
                <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Icon */}
                  <div style={{
                    width: '2.5rem', height: '2.5rem', flexShrink: 0,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={18} color="var(--color-primary-600)" />
                  </div>

                  {/* Info — clicking expands */}
                  <button
                    onClick={() => handleExpand(doc)}
                    style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.125rem' }}>
                      {docTypeLabel(doc.doc_type)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                      Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {doc.status === 'extracted' && ' · Click to view extracted data'}
                    </p>
                  </button>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    {statusIcon(doc.status)}
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 500,
                      color: doc.status === 'extracted' ? 'var(--color-success-600)'
                        : doc.status === 'error' ? 'var(--color-danger-600)'
                        : 'var(--color-surface-500)',
                    }}>
                      {statusLabel(doc.status)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    {(doc.status === 'uploaded' || doc.status === 'error') && doc.storage_path && (
                      <button
                        title="Extract text"
                        disabled={extractingId === doc.id}
                        onClick={() => handleExtractExisting(doc)}
                        style={{
                          padding: '0.4rem', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-primary-300)',
                          background: 'var(--color-primary-50)', cursor: 'pointer', display: 'flex',
                          color: 'var(--color-primary-700)',
                        }}
                      >
                        {extractingId === doc.id ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
                      </button>
                    )}
                    {doc.storage_path && (
                      <button
                        title="View file"
                        onClick={() => handleView(doc)}
                        style={{
                          padding: '0.4rem', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-surface-300)',
                          background: 'var(--color-surface-50)', cursor: 'pointer', display: 'flex',
                          color: 'var(--color-surface-400)',
                        }}
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    <button
                      title={isExpanded ? 'Collapse' : 'Expand'}
                      onClick={() => handleExpand(doc)}
                      style={{
                        padding: '0.4rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-surface-300)',
                        background: 'var(--color-surface-50)', cursor: 'pointer', display: 'flex',
                        color: 'var(--color-surface-400)',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button
                      title="Delete"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc)}
                      style={{
                        padding: '0.4rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid #e3b4ad',
                        background: '#f8e4e0', cursor: 'pointer', display: 'flex',
                        color: 'var(--color-danger-600)',
                      }}
                    >
                      {deletingId === doc.id
                        ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={15} />
                      }
                    </button>
                  </div>
                </div>

                {/* Extraction Preview Panel */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-surface-200)', padding: '1rem 1.25rem', background: 'var(--color-surface-50)' }}>
                    {isLoadingExt ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-surface-400)', fontSize: '0.8125rem' }}>
                        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading extracted data…
                      </div>
                    ) : extraction ? (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.625rem' }}>
                          Extracted Fields
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '0.5rem 1.5rem' }}>
                          {Object.entries(extraction.extracted_fields ?? {}).filter(([key]) => key !== 'raw_text').map(([key, value]) => (
                            <div key={key}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>{key.replace(/_/g, ' ')}</p>
                              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-surface-800)' }}>{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        {typeof extraction.extracted_fields?.raw_text === 'string' && (
                          <pre style={{ maxHeight: '20rem', overflow: 'auto', margin: '0.75rem 0 0', padding: '0.75rem', border: '1px solid var(--color-surface-200)', borderRadius: 'var(--radius-sm)', background: '#fff', whiteSpace: 'pre-wrap', font: '0.75rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace', color: 'var(--color-surface-700)' }}>
                            {extraction.extracted_fields.raw_text}
                          </pre>
                        )}
                        {extraction.confidence != null && (
                          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                            Extraction confidence: {Math.round(extraction.confidence * 100)}%
                          </p>
                        )}
                        {typeof extraction.extracted_fields?.raw_text === 'string' && (
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.85rem' }}
                            onClick={() => handleSummarizeWithAI(doc, extraction)}
                          >
                            <MessageSquare size={15} />
                            Send to AI & summarize
                          </button>
                        )}
                      </div>
                    ) : doc.status === 'extracted' ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)' }}>No extracted data found for this document.</p>
                    ) : (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)' }}>
                        {doc.status === 'uploaded'
                          ? 'This document has not been extracted yet. Upload it again to run extraction.'
                          : doc.status === 'processing'
                            ? 'Extraction in progress…'
                            : 'No extraction data available.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
