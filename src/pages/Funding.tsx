import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, Search, ExternalLink, Calendar, ChevronRight,
  BookOpen, FileText, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { searchFunding } from '../services/funding';
import { searchKnowledge, getKnowledgeDocuments } from '../services/knowledge';
import type { FundingOpportunity } from '../types';
import type { KnowledgeChunk } from '../services/knowledge';

const SECTORS = ['All', 'Retail', 'Food & Beverage', 'Textile & Garments', 'Manufacturing', 'Services', 'Technology', 'Agriculture'];
const STAGES = ['All', 'Idea / Pre-revenue', 'Early Stage (< 1 year)', 'Growing (1–3 years)', 'Established (3+ years)'];

type Tab = 'opportunities' | 'knowledge';

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function KnowledgeCard({ chunk }: { chunk: KnowledgeChunk }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.content.slice(0, 260).trim();
  const hasMore = chunk.content.length > 260;

  return (
    <div className="card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--color-primary-500)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <FileText size={14} color="var(--color-primary-500)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-700)' }}>
              {chunk.document_title}
            </span>
            {chunk.category && (
              <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>{chunk.category}</span>
            )}
          </div>
          {chunk.section && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
              {chunk.section}
            </p>
          )}
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-700)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {expanded ? chunk.content : preview}
            {!expanded && hasMore && '…'}
          </p>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', color: 'var(--color-primary-600)', fontWeight: 500,
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {chunk.source && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', maxWidth: '10rem', lineHeight: 1.4 }}>
              {chunk.source}
            </p>
          )}
          {chunk.page_start != null && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>
              pg. {chunk.page_start}
            </p>
          )}
          {chunk.source_url && (
            <a
              href={chunk.source_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary-600)', textDecoration: 'none', marginTop: '0.375rem', justifyContent: 'flex-end' }}
            >
              <ExternalLink size={11} /> Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Funding() {
  const [tab, setTab] = useState<Tab>('opportunities');
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [kbDocuments, setKbDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [kbLoading, setKbLoading] = useState(false);
  const [sector, setSector] = useState('All');
  const [stage, setStage] = useState('All');
  const [query, setQuery] = useState('');
  const [kbQuery, setKbQuery] = useState('');

  // Load funding opportunities
  const load = async () => {
    setLoading(true);
    const results = await searchFunding({
      sector: sector !== 'All' ? sector : undefined,
      stage: stage !== 'All' ? stage : undefined,
    });
    setOpportunities(results);
    setLoading(false);
  };

  // Load knowledge base document titles for browsing
  const loadKbDocuments = async () => {
    const docs = await getKnowledgeDocuments();
    setKbDocuments(docs);
  };

  useEffect(() => { load(); }, [sector, stage]);
  useEffect(() => { loadKbDocuments(); }, []);

  // Knowledge search (debounced by effect)
  useEffect(() => {
    if (tab !== 'knowledge') return;
    const timer = setTimeout(async () => {
      setKbLoading(true);
      const results = kbQuery.trim()
        ? await searchKnowledge(kbQuery, 20)
        : await searchKnowledge('startup funding grant scheme', 20);
      setKnowledgeChunks(results);
      setKbLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [kbQuery, tab]);

  // Auto-load when switching to KB tab
  useEffect(() => {
    if (tab === 'knowledge' && knowledgeChunks.length === 0) {
      setKbLoading(true);
      searchKnowledge('startup funding grant scheme', 20).then((res) => {
        setKnowledgeChunks(res);
        setKbLoading(false);
      });
    }
  }, [tab]);

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

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    fontSize: '0.875rem',
    background: active ? 'var(--color-primary-600)' : 'transparent',
    color: active ? '#fff' : 'var(--color-surface-600)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: 'all 0.15s ease',
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Funding Opportunities</h1>
        <p>Verified government schemes, grants, and detailed guidelines — powered by official documents</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', background: 'var(--color-surface-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-200)', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'opportunities')} onClick={() => setTab('opportunities')}>
          <Landmark size={15} /> Find Funding
        </button>
        <button style={tabStyle(tab === 'knowledge')} onClick={() => setTab('knowledge')}>
          <BookOpen size={15} /> Knowledge Base
          {kbDocuments.length > 0 && (
            <span style={{
              background: tab === 'knowledge' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-100)',
              color: tab === 'knowledge' ? '#fff' : 'var(--color-primary-700)',
              borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.6875rem', fontWeight: 700,
            }}>
              {kbDocuments.length} docs
            </span>
          )}
        </button>
      </div>

      {/* ── OPPORTUNITIES TAB ── */}
      {tab === 'opportunities' && (
        <>
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
          <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              Showing <strong>{filtered.length}</strong> manually verified opportunities. Source URLs and verification dates shown on each card. Funding facts come from structured data — not AI generation.
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
        </>
      )}

      {/* ── KNOWLEDGE BASE TAB ── */}
      {tab === 'knowledge' && (
        <>
          {/* KB Search bar */}
          <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Search size={16} color="var(--color-surface-400)" />
            <input
              type="text" value={kbQuery} onChange={(e) => setKbQuery(e.target.value)}
              placeholder="Search scheme guidelines, eligibility, funding amounts…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--color-surface-800)', background: 'transparent' }}
            />
          </div>

          {/* Source documents available */}
          {kbDocuments.length > 0 && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginRight: '0.25rem' }}>Schemes indexed:</span>
              {kbDocuments.map((doc) => (
                <button
                  key={doc}
                  onClick={() => setKbQuery(doc)}
                  style={{
                    background: 'var(--color-primary-50)', color: 'var(--color-primary-700)',
                    border: '1px solid var(--color-primary-200)', borderRadius: '999px',
                    padding: '0.2rem 0.625rem', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {doc}
                </button>
              ))}
            </div>
          )}

          {/* AI tip banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
            border: '1px solid #c7d2fe', borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem', marginBottom: '1.25rem',
          }}>
            <Sparkles size={16} color="#6366f1" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8125rem', color: '#4338ca', margin: 0, lineHeight: 1.5 }}>
              <strong>AI-powered:</strong> When you chat with UdyamAI, it automatically searches this knowledge base and uses these documents to give you accurate, document-grounded answers about schemes and eligibility.
            </p>
          </div>

          {/* Results */}
          {kbLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse-subtle" style={{ padding: '1.25rem', height: '7rem' }} />
              ))}
            </div>
          ) : knowledgeChunks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <BookOpen className="empty-state-icon" />
                <h3>No matching knowledge found</h3>
                <p>Try searching "SISFS eligibility", "GENESIS funding", "BIG scheme", or "NIDHI".</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.75rem' }}>
                {kbQuery.trim()
                  ? `${knowledgeChunks.length} result(s) for "${kbQuery}"`
                  : `Showing ${knowledgeChunks.length} knowledge chunks — search to narrow down`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {knowledgeChunks.map((chunk) => (
                  <KnowledgeCard key={chunk.id} chunk={chunk} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
