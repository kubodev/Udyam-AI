import { useState } from 'react';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import FinancialRecordsSection from '../components/FinancialRecordsSection';

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
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '2px', background: 'var(--color-accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>{error}</p>
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
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="var(--color-primary-600)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Break-even Result</h3>
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
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '2px', background: 'var(--color-success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '2px', background: 'var(--color-surface-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
