import { useState, type FormEvent } from 'react';
import { QrCode, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { buildUPIUri, generateQRDataUrl } from '../utils/upi-qr';

export default function CreateQR() {
  const { profile } = useProfile();

  const [upiId, setUpiId] = useState(profile?.upi_id ?? '');
  const [payeeName, setPayeeName] = useState(profile?.business_name ?? profile?.name ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [upiUri, setUpiUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) { setError('UPI ID is required'); return; }
    if (!payeeName.trim()) { setError('Payee name is required'); return; }
    setError(null);
    setLoading(true);
    try {
      const uri = buildUPIUri({
        upiId: upiId.trim(),
        payeeName: payeeName.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        note: note.trim() || undefined,
      });
      const dataUrl = await generateQRDataUrl(uri);
      setUpiUri(uri);
      setQrDataUrl(dataUrl);
    } catch {
      setError('Failed to generate QR code. Please check your UPI ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${payeeName.replace(/\s+/g, '_')}_UPI_QR.png`;
    a.click();
  };

  const inputStyle = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1px solid var(--color-surface-300)',
    borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Create UPI QR Code</h1>
        <p>Generate a UPI-compatible payment QR for your business</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '56rem' }}>
        {/* Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '1.25rem' }}>
            Payment details
          </h2>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>UPI ID *</span>
              <input
                id="qr-upi-id"
                style={inputStyle} type="text" value={upiId} required
                placeholder="yourname@upi"
                onChange={(e) => setUpiId(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Payee / Business name *</span>
              <input
                id="qr-payee-name"
                style={inputStyle} type="text" value={payeeName} required
                placeholder="Your business name"
                onChange={(e) => setPayeeName(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>
                Amount (₹) <span style={{ fontWeight: 400, color: 'var(--color-surface-400)' }}>(optional — leave blank for any amount)</span>
              </span>
              <input
                id="qr-amount"
                style={inputStyle} type="number" value={amount} min="0" step="0.01"
                placeholder="e.g. 500"
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>
                Note <span style={{ fontWeight: 400, color: 'var(--color-surface-400)' }}>(optional)</span>
              </span>
              <input
                id="qr-note"
                style={inputStyle} type="text" value={note}
                placeholder="e.g. Payment for tailoring services"
                onChange={(e) => setNote(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
              />
            </label>

            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <AlertCircle size={14} color="var(--color-danger-600)" />
                <span style={{ fontSize: '0.8125rem' }}>{error}</span>
              </div>
            )}

            <button id="qr-generate" type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.25rem' }}>
              {loading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><QrCode size={16} /> Generate QR Code</>}
            </button>
          </form>

          <div className="alert alert-warning" style={{ marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              This QR code generates a valid UPI payment payload. UdyamAI does not process or verify payments — customers pay directly through their UPI app.
            </p>
          </div>
        </div>

        {/* QR Preview */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {qrDataUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <img src={qrDataUrl} alt="UPI QR Code" style={{ width: '200px', height: '200px', borderRadius: 'var(--radius-md)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>{payeeName}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>{upiId}</p>
                {amount && <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-600)', marginTop: '0.25rem' }}>₹{parseFloat(amount).toLocaleString('en-IN')}</p>}
              </div>
              <button id="qr-download" onClick={handleDownload} className="btn btn-secondary">
                <Download size={16} />
                Download PNG
              </button>
              {upiUri && (
                <details style={{ width: '100%' }}>
                  <summary style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', cursor: 'pointer' }}>View UPI URI</summary>
                  <code style={{ fontSize: '0.6875rem', wordBreak: 'break-all', color: 'var(--color-surface-500)', display: 'block', marginTop: '0.5rem', background: 'var(--color-surface-100)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {upiUri}
                  </code>
                </details>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <QrCode className="empty-state-icon" />
              <h3>QR code will appear here</h3>
              <p>Fill in the details and click "Generate QR Code"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
