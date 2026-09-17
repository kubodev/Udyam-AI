import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ClipboardList, FileText, AlertCircle, ExternalLink, Check, RefreshCw } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { getFundingOpportunity } from '../services/funding';
import { getApplications, createApplication, updateApplicationStatus } from '../services/applications';
import { createApplicationDraft } from '../utils/application-draft';
import type { Application, FundingOpportunity } from '../types';

const STATUS_ORDER: Application['status'][] = ['Draft Ready', 'Preparing', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Closed'];

const STATUS_COLOR: Record<string, string> = {
  'Approved': 'success',
  'Rejected': 'danger',
  'Submitted': 'primary',
  'Under Review': 'primary',
  'Draft Ready': 'warning',
  'Preparing': 'warning',
  'Closed': 'danger',
};

function DraftSection({ title, content }: { title: string; content: string }) {
  const isMissing = content.startsWith('[Missing:');
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontWeight: 600, color: 'var(--color-surface-700)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.75rem' }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.875rem', lineHeight: 1.7,
        color: isMissing ? 'var(--color-danger-600)' : 'var(--color-surface-700)',
        background: isMissing ? '#fff5f5' : 'transparent',
        padding: isMissing ? '0.5rem 0.75rem' : '0',
        borderRadius: isMissing ? 'var(--radius-sm)' : '0',
        border: isMissing ? '1px solid #fecaca' : 'none',
        fontStyle: isMissing ? 'italic' : 'normal',
      }}>
        {content}
      </p>
    </div>
  );
}

export default function Applications() {
  const [searchParams] = useSearchParams();
  const draftOpportunityId = searchParams.get('draft');
  const { profile } = useProfile();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunityNames, setOpportunityNames] = useState<Record<string, string>>({});
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftOpportunity, setDraftOpportunity] = useState<FundingOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getApplications(user.id).then((apps) => { setApplications(apps); setLoading(false); });
    }
  }, [user]);

  // Fetch opportunity names to display instead of raw UUIDs
  useEffect(() => {
    applications.forEach(async (app) => {
      if (!opportunityNames[app.opportunity_id]) {
        const opp = await getFundingOpportunity(app.opportunity_id);
        if (opp?.name) {
          setOpportunityNames((prev) => ({ ...prev, [app.opportunity_id]: opp.name! }));
        }
      }
    });
  }, [applications]);

  useEffect(() => {
    if (draftOpportunityId) {
      getFundingOpportunity(draftOpportunityId).then(setDraftOpportunity);
    }
  }, [draftOpportunityId]);

  const handleGenerateDraft = async () => {
    if (!draftOpportunity || !profile || !user) return;
    setGeneratingDraft(true);
    setError(null);
    const { content, missingFields } = createApplicationDraft(draftOpportunity, profile);
    const { data, error: err } = await createApplication(user.id, draftOpportunity.id, content, missingFields);
    setGeneratingDraft(false);
    if (err) { setError(err); return; }
    if (data) {
      setApplications((prev) => [data, ...prev]);
      setOpportunityNames((prev) => ({ ...prev, [draftOpportunity.id]: draftOpportunity.name ?? draftOpportunity.id }));
      setSelectedApp(data);
    }
  };

  const handleStatusChange = async (app: Application, status: Application['status']) => {
    await updateApplicationStatus(app.id, status);
    setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status } : a));
    if (selectedApp?.id === app.id) setSelectedApp({ ...app, status });
  };

  const getAppTitle = (app: Application) =>
    opportunityNames[app.opportunity_id] ?? app.opportunity_id.slice(0, 8) + '…';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Applications</h1>
        <p>Track your funding applications from draft to decision</p>
      </div>

      {/* Draft generation prompt */}
      {draftOpportunity && !applications.find((a) => a.opportunity_id === draftOpportunity.id) && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderLeft: '4px solid var(--color-primary-500)' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>
              Ready to draft: {draftOpportunity.name}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
              VyapaarAI will fill this from your profile. Missing fields shown explicitly — never fabricated.
            </p>
          </div>
          <button
            id="generate-draft-btn"
            className="btn btn-primary"
            onClick={handleGenerateDraft}
            disabled={generatingDraft || !profile}
            style={{ flexShrink: 0 }}
          >
            {generatingDraft
              ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><FileText size={15} /> Generate Draft</>
            }
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <AlertCircle size={15} color="var(--color-danger-600)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse-subtle" style={{ height: '10rem' }} />
      ) : applications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList className="empty-state-icon" />
            <h3>No applications yet</h3>
            <p>Find a funding opportunity, run a fit check, and click "Draft application" to get started.</p>
            <Link to="/funding" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
              Browse funding opportunities
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '18rem 1fr' : '1fr', gap: '1.25rem' }}>
          {/* Application list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                style={{
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedApp?.id === app.id ? 'var(--color-primary-400)' : 'var(--color-surface-200)'}`,
                  background: selectedApp?.id === app.id ? 'var(--color-primary-50)' : 'white',
                  boxShadow: 'var(--shadow-card)', transition: 'all 0.15s',
                }}
              >
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.375rem', lineHeight: 1.4 }}>
                  {getAppTitle(app)}
                </p>
                <span className={`badge badge-${STATUS_COLOR[app.status] ?? 'primary'}`}>
                  {app.status}
                </span>
                {app.missing_fields && app.missing_fields.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-danger-600)', marginTop: '0.375rem' }}>
                    ⚠ {app.missing_fields.length} missing field{app.missing_fields.length !== 1 ? 's' : ''}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>
                  {new Date(app.created_at).toLocaleDateString('en-IN')}
                </p>
              </button>
            ))}
          </div>

          {/* Draft viewer */}
          {selectedApp && selectedApp.draft_content && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Application Draft</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
                    {getAppTitle(selectedApp)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleStatusChange(selectedApp, e.target.value as Application['status'])}
                    style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {selectedApp.missing_fields && selectedApp.missing_fields.length > 0 && (
                    <span className="badge badge-danger">{selectedApp.missing_fields.length} missing</span>
                  )}
                </div>
              </div>

              {selectedApp.missing_fields && selectedApp.missing_fields.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.875rem 1rem', backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <AlertCircle size={15} color="var(--color-danger-600)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-danger-600)', marginBottom: '0.25rem' }}>
                      Missing info — update your profile to complete these:
                    </p>
                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                      {selectedApp.missing_fields.map((f) => (
                        <li key={f} style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-surface-200)', paddingTop: '1.25rem' }}>
                {Object.entries(selectedApp.draft_content).map(([key, value]) => (
                  <DraftSection
                    key={key}
                    title={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    content={value as string}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-surface-200)' }}>
                <Link to={`/funding/${selectedApp.opportunity_id}`} className="btn btn-secondary" style={{ fontSize: '0.8125rem', textDecoration: 'none' }}>
                  <ExternalLink size={14} /> View opportunity
                </Link>
                <Link to="/settings" className="btn btn-primary" style={{ fontSize: '0.8125rem', textDecoration: 'none' }}>
                  <Check size={14} /> Update profile
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
