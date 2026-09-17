import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  X,
  ReceiptText,
  ArrowRight,
} from 'lucide-react';
import {
  getFinancialRecords,
  createFinancialRecord,
  deleteFinancialRecord,
  summariseRecords,
} from '../services/financial-records';
import type { FinancialRecord } from '../types';

const CATEGORIES = [
  'Sales',
  'Inventory',
  'Salary',
  'Rent',
  'Utilities',
  'Transport',
  'Marketing',
  'Tax',
  'Other',
];

interface NewRecord {
  date: string;
  amount: string;
  direction: 'credit' | 'debit';
  category: string;
  is_recurring: boolean;
}

interface FinancialRecordsSectionProps {
  userId: string;
  showViewAllLink?: boolean;
  onRecordsChange?: (records: FinancialRecord[]) => void;
  title?: string;
  subtitle?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid var(--color-surface-300)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--color-surface-100)',
  color: 'var(--color-surface-900)',
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--color-primary-500)';
}

function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--color-surface-300)';
}

function formatINR(amount: number) {
  return `₹${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function FinancialRecordsSection({
  userId,
  showViewAllLink = false,
  onRecordsChange,
  title = 'Financial Records',
  subtitle = 'Manual ledger — income and expenses',
}: FinancialRecordsSectionProps) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<NewRecord>({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    direction: 'credit',
    category: 'Sales',
    is_recurring: false,
  });

  useEffect(() => {
    let isMounted = true;
    getFinancialRecords(userId).then((r) => {
      if (isMounted) {
        setRecords(r);
        setLoading(false);
        onRecordsChange?.(r);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const summary = summariseRecords(records);

  const handleAdd = async () => {
    setFormError(null);
    const amount = parseFloat(form.amount);
    if (!form.date) {
      setFormError('Date is required.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError('Enter a valid amount > 0.');
      return;
    }

    setSaving(true);
    const { data, error } = await createFinancialRecord(userId, {
      date: form.date,
      amount,
      direction: form.direction,
      category: form.category,
      is_recurring: form.is_recurring,
      document_id: null,
    });
    setSaving(false);

    if (error) {
      setFormError(error);
      return;
    }

    if (data) {
      const updated = [data, ...records];
      setRecords(updated);
      onRecordsChange?.(updated);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        direction: 'credit',
        category: 'Sales',
        is_recurring: false,
      });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFinancialRecord(id);
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    onRecordsChange?.(updated);
  };

  return (
    <div
      id="financial-records"
      className="card"
      style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ReceiptText size={18} color="var(--color-primary-600)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: 'var(--color-surface-900)',
                margin: '0 0 0.125rem 0',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-surface-500)',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showViewAllLink && (
            <Link
              to="/finance"
              className="btn btn-secondary"
              style={{
                fontSize: '0.8125rem',
                padding: '0.45rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                textDecoration: 'none',
              }}
            >
              Finance Tools
              <ArrowRight size={14} />
            </Link>
          )}
          <button
            className="btn btn-primary"
            style={{
              fontSize: '0.8125rem',
              padding: '0.45rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <>
                <X size={14} /> Cancel
              </>
            ) : (
              <>
                <Plus size={14} /> Add entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary row */}
      {records.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8.5rem, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              padding: '0.875rem',
              background: '#e4efe8',
              border: '1px solid #b3cfc0',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-surface-600)',
                margin: '0 0 0.25rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Total income
            </p>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 750,
                color: 'var(--color-success-600)',
                margin: 0,
              }}
            >
              {formatINR(summary.totalCredit)}
            </p>
          </div>
          <div
            style={{
              padding: '0.875rem',
              background: '#f8e4e0',
              border: '1px solid #e3b4ad',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-surface-600)',
                margin: '0 0 0.25rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Total expenses
            </p>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 750,
                color: 'var(--color-danger-600)',
                margin: 0,
              }}
            >
              {formatINR(summary.totalDebit)}
            </p>
          </div>
          <div
            style={{
              padding: '0.875rem',
              background: summary.net >= 0 ? '#e4efe8' : '#f8e4e0',
              border: `1px solid ${summary.net >= 0 ? '#b3cfc0' : '#e3b4ad'}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-surface-600)',
                margin: '0 0 0.25rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Net
            </p>
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 750,
                color:
                  summary.net >= 0
                    ? 'var(--color-success-600)'
                    : 'var(--color-danger-600)',
                margin: 0,
              }}
            >
              {summary.net < 0 ? '−' : ''}
              {formatINR(summary.net)}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--color-surface-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-surface-200)',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-surface-600)',
                }}
              >
                Date
              </span>
              <input
                style={inputStyle}
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </label>
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-surface-600)',
                }}
              >
                Amount (₹)
              </span>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.amount}
                placeholder="e.g. 5000"
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </label>
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-surface-600)',
                }}
              >
                Type
              </span>
              <select
                style={inputStyle}
                value={form.direction}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    direction: e.target.value as 'credit' | 'debit',
                  }))
                }
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                <option value="credit">Income / Credit</option>
                <option value="debit">Expense / Debit</option>
              </select>
            </label>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))',
              gap: '0.75rem',
              alignItems: 'flex-end',
            }}
          >
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-surface-600)',
                }}
              >
                Category
              </span>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                paddingBottom: '0.625rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_recurring: e.target.checked }))
                }
              />
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-surface-700)',
                }}
              >
                Recurring transaction
              </span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={saving}
                style={{
                  fontSize: '0.8125rem',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={14}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />{' '}
                    Saving…
                  </>
                ) : (
                  <>Save entry</>
                )}
              </button>
            </div>
          </div>
          {formError && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-danger-600)',
                marginTop: '0.5rem',
                marginBottom: 0,
              }}
            >
              {formError}
            </p>
          )}
        </div>
      )}

      {/* Records list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse-subtle"
              style={{
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-200)',
              }}
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            background: 'var(--color-surface-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-surface-300)',
          }}
        >
          <ReceiptText
            size={28}
            color="var(--color-surface-400)"
            style={{ margin: '0 auto 0.5rem auto' }}
          />
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-surface-700)',
              margin: '0 0 0.25rem 0',
            }}
          >
            No financial records yet
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-surface-400)',
              margin: '0 0 1rem 0',
            }}
          >
            Keep track of your sales, purchases, and operating costs in one place.
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} /> Add your first entry
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '22rem',
            overflowY: 'auto',
            paddingRight: '0.25rem',
          }}
        >
          {records.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-surface-200)',
                background: 'var(--color-surface-50)',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-surface-300)';
                e.currentTarget.style.background = 'var(--color-surface-100)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-surface-200)';
                e.currentTarget.style.background = 'var(--color-surface-50)';
              }}
            >
              {r.direction === 'credit' ? (
                <ArrowUpCircle
                  size={18}
                  color="var(--color-success-600)"
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <ArrowDownCircle
                  size={18}
                  color="var(--color-danger-600)"
                  style={{ flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-surface-800)',
                      margin: 0,
                    }}
                  >
                    {r.category || 'General'}
                  </p>
                  {r.is_recurring && (
                    <span
                      className="badge badge-info"
                      style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}
                    >
                      Recurring
                    </span>
                  )}
                  {r.date && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-surface-400)',
                      }}
                    >
                      {new Date(r.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color:
                    r.direction === 'credit'
                      ? 'var(--color-success-600)'
                      : 'var(--color-danger-600)',
                  flexShrink: 0,
                  margin: 0,
                }}
              >
                {r.direction === 'credit' ? '+' : '−'}
                {formatINR(r.amount ?? 0)}
              </p>
              <button
                onClick={() => handleDelete(r.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  flexShrink: 0,
                  color: 'var(--color-surface-400)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger-600)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-surface-400)')}
                title="Delete record"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
