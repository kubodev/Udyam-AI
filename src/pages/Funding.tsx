import { useState, useEffect, useCallback } from 'react';
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

/**
 * Clean up raw PDF-extracted text:
 * 1. Normalize \r\n → \n
 * 2. Join soft line-breaks (single \n mid-sentence) into spaces
 * 3. Collapse 3+ blank lines → 2
 * 4. Trim each paragraph
 * 5. Drop empty paragraphs
 */
function cleanContent(raw: string): string[] {
  // Step 1: normalise line endings
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 2: split on double (or more) newlines → real paragraph boundaries
  const blocks = text.split(/\n{2,}/);

  return blocks
    .map((block) =>
      block
        // Join soft wraps: single \n that doesn't start a numbered/bullet item
        .replace(/(?<!\n)(\n)(?!\n|\d+\.|•|-|\*)/g, ' ')
        // Collapse leftover multiple spaces
        .replace(/ {2,}/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

// ── Expandable knowledge chunk card ──────────────────────────────────────────
function KnowledgeCard({ chunk }: { chunk: KnowledgeChunk }) {
  const [expanded, setExpanded] = useState(false);

  // Clean paragraphs from raw PDF text
  const paragraphs = cleanContent(chunk.content);

  // For preview: join cleaned paragraphs into one string, limit chars
  const fullText = paragraphs.join(' ');
  const PREVIEW_CHARS = 320;
  const hasMore = fullText.length > PREVIEW_CHARS;
  const previewText = hasMore ? fullText.slice(0, PREVIEW_CHARS).trimEnd() + '…' : fullText;

  // Clean section text too
  const sectionText = chunk.section
    ? cleanContent(chunk.section).join(' ')
    : null;

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        borderLeft: '3px solid var(--color-primary-500)',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <FileText size={14} color="var(--color-primary-500)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-700)' }}>
              {chunk.document_title}
            </span>
            {chunk.category && (
              <span className="badge badge-primary" style={{ fontSize: '0.6875rem', textTransform: 'capitalize' }}>
                {chunk.category}
              </span>
            )}
          </div>

          {/* Section */}
          {sectionText && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--color-surface-500)',
              marginBottom: '0.625rem', fontStyle: 'italic', lineHeight: 1.5,
            }}>
              § {sectionText.length > 120 ? sectionText.slice(0, 120) + '…' : sectionText}
            </p>
          )}

          {/* Content — paragraph-aware rendering */}
          {expanded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {paragraphs.map((para, i) => (
                <p key={i} style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-surface-700)',
                  lineHeight: 1.75,
                  margin: 0,
                }}>
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-surface-700)',
              lineHeight: 1.75,
              margin: 0,
            }}>
              {previewText}
            </p>
          )}

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', color: 'var(--color-primary-600)', fontWeight: 500, padding: 0,
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Show less' : 'Read full text'}
            </button>
          )}
        </div>

        {/* Meta sidebar */}
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '6.5rem', maxWidth: '10rem' }}>
          {chunk.source && (
            <p style={{
              fontSize: '0.6875rem', color: 'var(--color-surface-400)',
              lineHeight: 1.4, marginBottom: '0.25rem', wordBreak: 'break-word',
            }}>
              {chunk.source}
            </p>
          )}
          {chunk.page_start != null && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginBottom: '0.25rem' }}>
              Page {chunk.page_start}
            </p>
          )}
          {chunk.source_url && (
            <a
              href={chunk.source_url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.75rem', color: 'var(--color-primary-600)', textDecoration: 'none',
              }}
            >
              <ExternalLink size={11} /> Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Funding() {
  const [tab, setTab] = useState<Tab>('opportunities');

  // Opportunities state
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [sector, setSector] = useState('All');
  const [stage, setStage] = useState('All');
  const [query, setQuery] = useState('');

  // Knowledge base state
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [kbDocuments, setKbDocuments] = useState<string[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('All');
  const [kbInitialized, setKbInitialized] = useState(false);

  // ── Load funding opportunities ──
  const loadOpps = useCallback(async () => {
    setLoadingOpps(true);
    const results = await searchFunding({
      sector: sector !== 'All' ? sector : undefined,
      stage: stage !== 'All' ? stage : undefined,
    });
    setOpportunities(results);
    setLoadingOpps(false);
  }, [sector, stage]);

  useEffect(() => { loadOpps(); }, [loadOpps]);

  // ── Load KB document list on mount ──
  useEffect(() => {
    getKnowledgeDocuments().then(setKbDocuments);
  }, []);

  // ── Load KB chunks when tab opens (initial load) ──
  useEffect(() => {
    if (tab === 'knowledge' && !kbInitialized) {
      setKbInitialized(true);
      setKbLoading(true);
      // Load a broad initial set
      searchKnowledge('', undefined, 40).then((res) => {
        setKnowledgeChunks(res);
        setKbLoading(false);
      });
    }
  }, [tab, kbInitialized]);

  // ── Debounced KB search & section dropdown ──
  useEffect(() => {
    if (!kbInitialized) return;
    const timer = setTimeout(async () => {
      setKbLoading(true);
      const results = await searchKnowledge(kbQuery, selectedDoc, 40);
      setKnowledgeChunks(results);
      setKbLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [kbQuery, selectedDoc, kbInitialized]);

  // Filtered opportunities (client-side keyword filter)
  const filtered = query
    ? opportunities.filter((o) =>
        (o.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (o.provider ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (o.description ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : opportunities;

  // ── Styles ──
  const selectStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-surface-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem',
    background: 'var(--color-surface-100)',
    color: 'var(--color-surface-800)',
    outline: 'none',
    cursor: 'pointer',
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
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
        <p>Verified government schemes, grants &amp; official guidelines — powered by 142 indexed document chunks</p>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
        background: 'var(--color-surface-100)', padding: '0.25rem',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-200)',
        width: 'fit-content',
      }}>
        <button style={tabBtn(tab === 'opportunities')} onClick={() => setTab('opportunities')}>
          <Landmark size={15} /> Find Funding
        </button>
        <button style={tabBtn(tab === 'knowledge')} onClick={() => setTab('knowledge')}>
          <BookOpen size={15} /> Knowledge Base
          {kbDocuments.length > 0 && (
            <span style={{
              background: tab === 'knowledge' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-100)',
              color: tab === 'knowledge' ? '#fff' : 'var(--color-primary-700)',
              borderRadius: '999px', padding: '0.05rem 0.45rem',
              fontSize: '0.6875rem', fontWeight: 700,
            }}>
              {kbDocuments.length} docs
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          OPPORTUNITIES TAB
      ══════════════════════════════════════════════ */}
      {tab === 'opportunities' && (
        <>
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

          <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              Showing <strong>{filtered.length}</strong> verified opportunities.{' '}
              <button
                onClick={() => setTab('knowledge')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', padding: 0, textDecoration: 'underline' }}
              >
                Browse 142 detailed scheme guidelines →
              </button>
            </p>
          </div>

          {loadingOpps ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ padding: '1.25rem', height: '8rem' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Landmark className="empty-state-icon" />
                <h3>No matching opportunities</h3>
                <p>Try adjusting filters, or <button onClick={() => setTab('knowledge')} style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>search the knowledge base</button>.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((opp) => (
                <Link key={opp.id} to={`/funding/${opp.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.25rem' }}>{opp.name}</h3>
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
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)' }}>Verified {opp.last_verified ?? 'date unknown'}</span>
                        </div>
                        {opp.deadline
                          ? <span style={{ fontSize: '0.75rem', color: 'var(--color-danger-600)', fontWeight: 500 }}>Deadline: {opp.deadline}</span>
                          : <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>No deadline</span>}
                        <a href={opp.source_url ?? '#'} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary-600)', textDecoration: 'none' }}>
                          <ExternalLink size={12} /> Source
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

      {/* ══════════════════════════════════════════════
          KNOWLEDGE BASE TAB
      ══════════════════════════════════════════════ */}
      {tab === 'knowledge' && (
        <>
          {/* Search bar & Section dropper */}
          <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '14rem' }}>
              <Search size={16} color="var(--color-surface-400)" />
              <input
                type="text"
                value={kbQuery}
                onChange={(e) => setKbQuery(e.target.value)}
                placeholder="Search scheme guidelines, eligibility, funding amounts, deadlines…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--color-surface-800)', background: 'transparent' }}
                autoFocus
              />
              {kbQuery && (
                <button
                  onClick={() => setKbQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1rem', lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>

            {kbDocuments.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  style={{
                    ...selectStyle,
                    maxWidth: '22rem',
                    textOverflow: 'ellipsis',
                    borderColor: selectedDoc !== 'All' ? 'var(--color-primary-500)' : 'var(--color-surface-300)',
                    background: selectedDoc !== 'All' ? 'var(--color-primary-50)' : 'var(--color-surface-100)',
                    color: selectedDoc !== 'All' ? 'var(--color-primary-800)' : 'var(--color-surface-800)',
                    fontWeight: selectedDoc !== 'All' ? 500 : 400,
                  }}
                  title="Filter by scheme or document section"
                >
                  <option value="All">All schemes & sections</option>
                  {kbDocuments.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>

                {selectedDoc !== 'All' && (
                  <button
                    onClick={() => setSelectedDoc('All')}
                    title="Clear section filter"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-primary-600)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      padding: '0.2rem 0.4rem',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* AI tip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
            border: '1px solid #c7d2fe', borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem', marginBottom: '1.25rem',
          }}>
            <Sparkles size={16} color="#6366f1" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8125rem', color: '#4338ca', margin: 0, lineHeight: 1.5 }}>
              <strong>AI-powered:</strong> UdyamAI automatically searches these {kbDocuments.length > 0 ? '142' : ''} document chunks when you chat, giving you accurate, document-grounded answers about schemes and eligibility.
            </p>
          </div>

          {/* Results */}
          {kbLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ padding: '1.25rem', height: '7rem' }} />)}
            </div>
          ) : knowledgeChunks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <BookOpen className="empty-state-icon" />
                <h3>No results found</h3>
                <p>Try: "SISFS eligibility", "GENESIS funding amount", "BIG scheme", "NIDHI criteria"</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.75rem' }}>
                {kbQuery.trim() ? (
                  <>
                    <strong>{knowledgeChunks.length}</strong> result(s) for "<em>{kbQuery}</em>"
                    {selectedDoc !== 'All' ? <> in <strong>{selectedDoc}</strong></> : null}
                  </>
                ) : selectedDoc !== 'All' ? (
                  <>
                    <strong>{knowledgeChunks.length}</strong> chunks in <strong>{selectedDoc}</strong>
                  </>
                ) : (
                  <>
                    <strong>{knowledgeChunks.length}</strong> chunks loaded — use search or select a section from the dropdown above
                  </>
                )}
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
