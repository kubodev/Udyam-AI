import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, CheckSquare, FileText, AlertCircle } from 'lucide-react';
import { getFundingOpportunity, saveOpportunity } from '../services/funding';
import { checkFundingFit } from '../utils/fit-check';
import FitChecklist from '../components/FitChecklist';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import type { FundingOpportunity, FitCheckResult } from '../types';

function formatCurrency(amount: number | null) {
  if (amount === null) return '?';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function FundingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<FundingOpportunity | null>(null);
  const [fitResult, setFitResult] = useState<FitCheckResult | null>(null);
  const [showFitCheck, setShowFitCheck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getFundingOpportunity(id).then((opp) => {
      setOpportunity(opp);
      setLoading(false);
    });
  }, [id]);

  const handleFitCheck = () => {
    if (!opportunity || !profile) return;
    const result = checkFundingFit(opportunity, profile);
    setFitResult(result);
    setShowFitCheck(true);
  };

  const handleSave = async () => {
    if (!user || !opportunity) return;
    setSaving(true);
    const { error } = await saveOpportunity(user.id, opportunity.id);
    setSaving(false);
    setSaveMsg(error ? `Error: ${error}` : '✓ Saved to your applications tracker');
    setTimeout(() => setSaveMsg(null), 4000);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ height: '6rem' }} />)}
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="animate-fade-in">
        <div className="card">
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" />
            <h3>Opportunity not found</h3>
            <p>This funding opportunity may have been removed or the link is incorrect.</p>
            <Link to="/funding" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              ← Back to Funding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ marginBottom: '1.25rem', fontSize: '0.8125rem' }}
      >
        <ArrowLeft size={15} />
        Back to Funding
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 20rem', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.375rem' }}>
              {opportunity.name}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-primary-600)', fontWeight: 500, marginBottom: '1rem' }}>
              {opportunity.provider}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {opportunity.sector && <span className="badge badge-primary">{opportunity.sector}</span>}
              {opportunity.business_stage && <span className="badge badge-warning">{opportunity.business_stage}</span>}
              {!opportunity.location && <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>All India</span>}
              {opportunity.location && <span className="badge badge-primary">{opportunity.location}</span>}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-600)', lineHeight: 1.7 }}>
              {opportunity.description}
            </p>
          </div>

          {/* Eligibility */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.75rem' }}>
              Eligibility
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-600)', lineHeight: 1.7 }}>
              {opportunity.eligibility_text ?? 'Eligibility details not specified by source.'}
            </p>
          </div>

          {/* Fit Check */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>
                Eligibility Fit Check
              </h2>
              {!showFitCheck && (
                <button
                  id="run-fit-check"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem' }}
                  onClick={handleFitCheck}
                  disabled={!profile}
                >
                  <CheckSquare size={15} />
                  Run fit check
                </button>
              )}
            </div>
            {!profile && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)' }}>
                Complete your business profile to run a fit check.
              </p>
            )}
            {showFitCheck && fitResult && <FitChecklist result={fitResult} />}
            {!showFitCheck && profile && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
                Run a deterministic ✓/✗/? checklist based on your business profile — no fabricated scores.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick facts */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-700)', marginBottom: '0.875rem' }}>
              Quick Facts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginBottom: '0.125rem' }}>Funding range</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>
                  {formatCurrency(opportunity.funding_range_min)} – {formatCurrency(opportunity.funding_range_max)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginBottom: '0.125rem' }}>Deadline</p>
                <p style={{ fontSize: '0.875rem', color: opportunity.deadline ? 'var(--color-danger-600)' : 'var(--color-surface-500)' }}>
                  {opportunity.deadline ?? 'Deadline not specified by source'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginBottom: '0.125rem' }}>Last verified</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={13} color="var(--color-surface-400)" />
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-700)' }}>
                    {opportunity.last_verified ?? 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-700)', marginBottom: '0.75rem' }}>
              Source
            </h3>
            {opportunity.source_url && (
              <a
                id="source-link"
                href={opportunity.source_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.8125rem', marginBottom: '0.5rem' }}
              >
                <ExternalLink size={14} />
                View official source
              </a>
            )}
            {opportunity.application_url && opportunity.application_url !== opportunity.source_url && (
              <a
                href={opportunity.application_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                Apply now
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-700)', marginBottom: '0.75rem' }}>
              Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                id="save-opportunity"
                className="btn btn-secondary"
                onClick={handleSave}
                disabled={saving}
                style={{ fontSize: '0.8125rem' }}
              >
                {saving ? 'Saving…' : 'Save to tracker'}
              </button>
              <Link
                id="draft-application"
                to={`/applications?draft=${opportunity.id}`}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', textDecoration: 'none', textAlign: 'center' }}
              >
                <FileText size={14} />
                Draft application
              </Link>
            </div>
            {saveMsg && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-success-600)' }}>{saveMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
