import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Search, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { searchFunding } from '../services/funding';
import type { FundingOpportunity } from '../types';

const SECTORS = ['All', 'Retail', 'Food & Beverage', 'Textile & Garments', 'Manufacturing', 'Services', 'Technology', 'Agriculture'];
const STAGES = ['All', 'Idea / Pre-revenue', 'Early Stage (< 1 year)', 'Growing (1–3 years)', 'Established (3+ years)'];

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function Funding() {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState('All');
  const [stage, setStage] = useState('All');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const results = await searchFunding({
      sector: sector !== 'All' ? sector : undefined,
      stage: stage !== 'All' ? stage : undefined,
    });
    setOpportunities(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sector, stage]);

  const filtered = query
    ? opportunities.filter((o) =>
        (o.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (o.provider ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (o.description ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : opportunities;

  const selectStyle = {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-surface-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem',
    background: 'var(--color-surface-100)',
    color: 'var(--color-surface-800)',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Funding Opportunities</h1>
        <p>Verified government schemes, grants, and funding sources — with source URLs and verification dates</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '12rem' }}>
          <Search size={16} color="var(--color-surface-400)" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, provider…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--color-surface-800)', background: 'transparent' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select style={selectStyle} value={sector} onChange={(e) => setSector(e.target.value)}>
            {SECTORS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All sectors' : s}</option>)}
          </select>
          <select style={selectStyle} value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All stages' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Notice */}
      <div style={{ padding: '0.75rem 1rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-200)', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
          📋 Showing <strong>{filtered.length}</strong> manually verified opportunities. Source URLs and verification dates shown on each card. Funding facts come from structured data — not AI generation.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse-subtle" style={{ padding: '1.25rem', height: '8rem' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Landmark className="empty-state-icon" />
            <h3>No matching opportunities</h3>
            <p>Try adjusting the sector or stage filters, or clear the search query.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((opp) => (
            <Link
              key={opp.id}
              to={`/funding/${opp.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>{opp.name}</h3>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500, marginBottom: '0.375rem' }}>{opp.provider}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)', lineHeight: 1.5, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {opp.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      {opp.sector && <span className="badge badge-primary">{opp.sector}</span>}
                      {opp.business_stage && <span className="badge badge-warning">{opp.business_stage}</span>}
                      {!opp.location && <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>All India</span>}
                      {opp.location && <span className="badge badge-primary">{opp.location}</span>}
                      {opp.funding_range_min !== null && opp.funding_range_max !== null && (
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-700)' }}>
                          {formatCurrency(opp.funding_range_min)} – {formatCurrency(opp.funding_range_max)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
                    <ChevronRight size={18} color="var(--color-surface-400)" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} color="var(--color-surface-400)" />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)' }}>
                        Verified {opp.last_verified ?? 'date unknown'}
                      </span>
                    </div>
                    {opp.deadline ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger-600)', fontWeight: 500 }}>
                        Deadline: {opp.deadline}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                        No deadline specified
                      </span>
                    )}
                    <a
                      href={opp.source_url ?? '#'} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary-600)', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} />
                      Source
                    </a>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
