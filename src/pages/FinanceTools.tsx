import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Info, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, RefreshCw, X } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getFinancialRecords,
  createFinancialRecord,
  deleteFinancialRecord,
  summariseRecords,
} from '../services/financial-records';
import type { FinancialRecord } from '../types';

// ── Shared styles ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid var(--color-surface-300)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--color-primary-500)';
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--color-surface-300)';
}

function formatINR(amount: number) {
  return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Break-even Calculator ─────────────────────────────────────────────────

interface BreakEvenResult {
  quantity: number;
  revenue: number;
  contributionMarginPct: number;
}

function calcBreakEven(price: number, unitCost: number, fixedCosts: number): BreakEvenResult | null {
  const cm = price - unitCost;
  if (cm <= 0) return null;
  const quantity = fixedCosts / cm;
  const revenue = quantity * price;
  const contributionMarginPct = (cm / price) * 100;
  return { quantity, revenue, contributionMarginPct };
}

function BreakEvenCalculator({ monthlyExpenses, monthlyRevenue }: { monthlyExpenses: number | null; monthlyRevenue: number | null }) {
  const [price, setPrice] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [fixedCosts, setFixedCosts] = useState(monthlyExpenses ? String(monthlyExpenses) : '');
  const [result, setResult] = useState<BreakEvenResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null); setResult(null);
    const p = parseFloat(price), uc = parseFloat(unitCost), fc = parseFloat(fixedCosts);
    if (isNaN(p) || isNaN(uc) || isNaN(fc)) { setError('Fill in all three fields.'); return; }
    if (p <= 0) { setError('Selling price must be > 0.'); return; }
    if (uc >= p) { setError('Unit cost must be less than selling price.'); return; }
    if (fc < 0) { setError('Fixed costs cannot be negative.'); return; }
    const res = calcBreakEven(p, uc, fc);
    if (!res) { setError('Cannot calculate — check inputs.'); return; }
    setResult(res);
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #c2410c, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={17} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Break-Even Calculator</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Units you need to sell to cover all costs</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Selling price / unit (₹)</span>
          <input id="be-price" style={inputStyle} type="number" min="0" step="0.01" value={price} placeholder="e.g. 500"
            onChange={(e) => setPrice(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Variable cost / unit (₹)</span>
          <input id="be-unit-cost" style={inputStyle} type="number" min="0" step="0.01" value={unitCost} placeholder="e.g. 200"
            onChange={(e) => setUnitCost(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Fixed costs / month (₹)</span>
          <input id="be-fixed-costs" style={inputStyle} type="number" min="0" step="0.01" value={fixedCosts} placeholder="e.g. 15000"
            onChange={(e) => setFixedCosts(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
      </div>

      {monthlyExpenses && !fixedCosts && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', marginBottom: '0.75rem' }}>
          💡 Pre-filled from your profile: ₹{monthlyExpenses.toLocaleString('en-IN')} / month
        </p>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(247, 108, 108, 0.12)', border: '1px solid rgba(247, 108, 108, 0.28)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#fca5a5', margin: 0 }}>{error}</p>
        </div>
      )}

      <button id="be-calculate" className="btn btn-primary" onClick={handleCalculate}>
        <Calculator size={15} /> Calculate break-even
      </button>

      <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
          <Info size={13} color="var(--color-surface-400)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Formula</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)', fontFamily: 'monospace' }}>
          Break-even units = Fixed costs ÷ (Selling price − Variable cost)
        </p>
      </div>

      {result && (
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(98, 117, 245, 0.12), rgba(245, 165, 36, 0.08))', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(113, 134, 255, 0.25)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="var(--color-primary-400)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>Break-even Result</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Units to break even</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{Math.ceil(result.quantity).toLocaleString('en-IN')}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>units / month</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Revenue to break even</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{formatINR(Math.ceil(result.revenue))}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>/ month</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Contribution margin</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{result.contributionMarginPct.toFixed(1)}%</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>per unit sold</p>
            </div>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-surface-600)', lineHeight: 1.6 }}>
            You need <strong>{Math.ceil(result.quantity).toLocaleString('en-IN')} units</strong> monthly to cover fixed costs of {formatINR(parseFloat(fixedCosts))}.
            Each additional unit contributes <strong>{formatINR(parseFloat(price) - parseFloat(unitCost))}</strong> to profit.
          </p>
          {monthlyRevenue && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: parseFloat(price) * Math.ceil(result.quantity) <= monthlyRevenue ? 'var(--color-success-600)' : 'var(--color-accent-700)' }}>
              {parseFloat(price) * Math.ceil(result.quantity) <= monthlyRevenue
                ? `✓ Your current revenue (₹${monthlyRevenue.toLocaleString('en-IN')}) is above the break-even point.`
                : `⚠ Your current revenue (₹${monthlyRevenue.toLocaleString('en-IN')}) is below the break-even point.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profit Margin Calculator ───────────────────────────────────────────────

function ProfitMarginCalculator() {
  const [revenue, setRevenue] = useState('');
  const [cogs, setCogs] = useState('');
  const [opex, setOpex] = useState('');

  const r = parseFloat(revenue) || 0;
  const c = parseFloat(cogs) || 0;
  const o = parseFloat(opex) || 0;
  const grossProfit = r - c;
  const netProfit = r - c - o;
  const grossMargin = r > 0 ? (grossProfit / r) * 100 : null;
  const netMargin = r > 0 ? (netProfit / r) * 100 : null;

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-success-600), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={17} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Profit Margin Calculator</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Gross and net margin — updates as you type</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Total revenue (₹)</span>
          <input id="pm-revenue" style={inputStyle} type="number" min="0" value={revenue} placeholder="e.g. 100000"
            onChange={(e) => setRevenue(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Cost of goods sold (₹)</span>
          <input id="pm-cogs" style={inputStyle} type="number" min="0" value={cogs} placeholder="e.g. 60000"
            onChange={(e) => setCogs(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Operating expenses (₹)</span>
          <input id="pm-opex" style={inputStyle} type="number" min="0" value={opex} placeholder="e.g. 20000"
            onChange={(e) => setOpex(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
      </div>

      {r > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Gross profit margin</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: grossMargin && grossMargin >= 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
              {grossMargin?.toFixed(1)}%
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Gross profit: {formatINR(grossProfit)}
            </p>
          </div>
          <div style={{ padding: '1rem', background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${netProfit >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Net profit margin</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: netProfit >= 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
              {netMargin?.toFixed(1)}%
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Net profit: {netProfit >= 0 ? '' : '−'}{formatINR(netProfit)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cash Flow Runway Calculator ────────────────────────────────────────────

function RunwayCalculator() {
  const [cashBalance, setCashBalance] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');

  const balance = parseFloat(cashBalance) || 0;
  const burn = parseFloat(monthlyBurn) || 0;
  const runwayMonths = burn > 0 && balance >= 0 ? Math.floor(balance / burn) : null;

  const runwayColor = runwayMonths === null ? 'var(--color-surface-400)'
    : runwayMonths >= 12 ? 'var(--color-success-600)'
    : runwayMonths >= 6 ? 'var(--color-accent-600)'
    : 'var(--color-danger-600)';

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={17} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Cash Runway Calculator</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>How many months can you operate at current burn rate?</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Current cash balance (₹)</span>
          <input id="runway-balance" style={inputStyle} type="number" min="0" value={cashBalance} placeholder="e.g. 200000"
            onChange={(e) => setCashBalance(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Monthly burn rate (₹)</span>
          <input id="runway-burn" style={inputStyle} type="number" min="0" value={monthlyBurn} placeholder="e.g. 25000"
            onChange={(e) => setMonthlyBurn(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
        </label>
      </div>

      {runwayMonths !== null && (
        <div style={{ padding: '1.25rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-surface-200)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Cash runway</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: runwayColor, lineHeight: 1 }}>
            {runwayMonths} months
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginTop: '0.5rem' }}>
            {runwayMonths >= 12 ? '✓ Healthy runway — focus on growth'
              : runwayMonths >= 6 ? '⚠ 6–12 months left — start planning for additional funding'
              : '⚠ Under 6 months — seek funding urgently'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Financial Records Ledger ───────────────────────────────────────────────

const CATEGORIES = ['Sales', 'Inventory', 'Salary', 'Rent', 'Utilities', 'Transport', 'Marketing', 'Tax', 'Other'];

interface NewRecord {
  date: string;
  amount: string;
  direction: 'credit' | 'debit';
  category: string;
  is_recurring: boolean;
}

function FinancialRecordsSection({ userId }: { userId: string }) {
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
    getFinancialRecords(userId).then((r) => { setRecords(r); setLoading(false); });
  }, [userId]);

  const summary = summariseRecords(records);

  const handleAdd = async () => {
    setFormError(null);
    const amount = parseFloat(form.amount);
    if (!form.date) { setFormError('Date is required.'); return; }
    if (isNaN(amount) || amount <= 0) { setFormError('Enter a valid amount > 0.'); return; }

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

    if (error) { setFormError(error); return; }
    if (data) {
      setRecords((prev) => [data, ...prev]);
      setForm({ date: new Date().toISOString().slice(0, 10), amount: '', direction: 'credit', category: 'Sales', is_recurring: false });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFinancialRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Financial Records</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Manual ledger — income and expenses</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: '0.8125rem' }} onClick={() => setShowForm((v) => !v)}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add entry</>}
        </button>
      </div>

      {/* Summary row */}
      {records.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.875rem', background: 'rgba(61, 213, 152, 0.1)', border: '1px solid rgba(61, 213, 152, 0.25)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', margin: '0 0 0.25rem 0' }}>Total income</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6ee7b7', margin: 0 }}>{formatINR(summary.totalCredit)}</p>
          </div>
          <div style={{ padding: '0.875rem', background: 'rgba(247, 108, 108, 0.1)', border: '1px solid rgba(247, 108, 108, 0.25)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', margin: '0 0 0.25rem 0' }}>Total expenses</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ff9494', margin: 0 }}>{formatINR(summary.totalDebit)}</p>
          </div>
          <div style={{ padding: '0.875rem', background: summary.net >= 0 ? 'rgba(61, 213, 152, 0.1)' : 'rgba(247, 108, 108, 0.1)', border: `1px solid ${summary.net >= 0 ? 'rgba(61, 213, 152, 0.25)' : 'rgba(247, 108, 108, 0.25)'}`, borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', margin: '0 0 0.25rem 0' }}>Net</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: summary.net >= 0 ? '#6ee7b7' : '#ff9494', margin: 0 }}>
              {summary.net < 0 ? '−' : ''}{formatINR(summary.net)}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ padding: '1rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-200)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Date</span>
              <input style={inputStyle} type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} onFocus={focusBorder} onBlur={blurBorder} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Amount (₹)</span>
              <input style={inputStyle} type="number" min="0" value={form.amount} placeholder="e.g. 5000"
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} onFocus={focusBorder} onBlur={blurBorder} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Type</span>
              <select style={inputStyle} value={form.direction}
                onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as 'credit' | 'debit' }))} onFocus={focusBorder} onBlur={blurBorder}>
                <option value="credit">Income / Credit</option>
                <option value="debit">Expense / Debit</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Category</span>
              <select style={inputStyle} value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} onFocus={focusBorder} onBlur={blurBorder}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingTop: '1.25rem' }}>
              <input type="checkbox" checked={form.is_recurring}
                onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)' }}>Recurring</span>
            </label>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving} style={{ fontSize: '0.8125rem' }}>
              {saving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <>Save</>}
            </button>
          </div>
          {formError && <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)', marginTop: '0.5rem' }}>{formError}</p>}
        </div>
      )}

      {/* Records list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2].map((i) => <div key={i} className="animate-pulse-subtle" style={{ height: '3rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-100)' }} />)}
        </div>
      ) : records.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)', textAlign: 'center', padding: '1.5rem 0' }}>
          No entries yet. Click "Add entry" to start tracking income and expenses.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '20rem', overflowY: 'auto' }}>
          {records.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.07)', background: 'rgba(255, 255, 255, 0.03)' }}>
              {r.direction === 'credit'
                ? <ArrowUpCircle size={16} color="var(--color-success-600)" />
                : <ArrowDownCircle size={16} color="var(--color-danger-600)" />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-800)' }}>
                  {r.category}{r.is_recurring ? ' 🔁' : ''}
                  {r.date && <span style={{ color: 'var(--color-surface-400)', fontWeight: 400, marginLeft: '0.5rem' }}>{new Date(r.date).toLocaleDateString('en-IN')}</span>}
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: r.direction === 'credit' ? 'var(--color-success-600)' : 'var(--color-danger-600)', flexShrink: 0 }}>
                {r.direction === 'credit' ? '+' : '−'}{formatINR(r.amount ?? 0)}
              </p>
              <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>
                <Trash2 size={14} color="var(--color-surface-400)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function FinanceTools() {
  const { profile } = useProfile();
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Finance Tools</h1>
        <p>Deterministic calculators and your personal ledger — no AI arithmetic</p>
      </div>

      <BreakEvenCalculator
        monthlyExpenses={profile?.monthly_expenses ?? null}
        monthlyRevenue={profile?.monthly_revenue ?? null}
      />

      <ProfitMarginCalculator />

      <RunwayCalculator />

      {user && <FinancialRecordsSection userId={user.id} />}
    </div>
  );
}
