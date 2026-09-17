import { HeartPulse, CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';

interface HealthCheck {
  label: string;
  status: 'healthy' | 'needs_attention' | 'missing';
  reason: string;
  action?: { label: string; to: string };
}

function statusIcon(status: HealthCheck['status']) {
  if (status === 'healthy') return <CheckCircle size={18} color="var(--color-success-600)" />;
  if (status === 'needs_attention') return <AlertTriangle size={18} color="var(--color-accent-600)" />;
  return <XCircle size={18} color="var(--color-danger-600)" />;
}

function statusBg(status: HealthCheck['status']) {
  if (status === 'healthy') return { bg: '#e4efe8', border: '#b3cfc0' };
  if (status === 'needs_attention') return { bg: '#f8ead3', border: '#e4c48a' };
  return { bg: '#f8e4e0', border: '#e3b4ad' };
}

export default function BusinessHealth() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="card animate-pulse-subtle" style={{ height: '5rem' }} />)}
        </div>
      </div>
    );
  }

  // Deterministic health checks — rules over profile + financial data
  const checks: HealthCheck[] = [
    {
      label: 'Business profile',
      status: profile?.business_name && profile?.sector && profile?.description && profile?.location
        ? 'healthy'
        : profile?.business_name && profile?.sector
          ? 'needs_attention'
          : 'missing',
      reason: profile?.business_name && profile?.sector && profile?.description && profile?.location
        ? 'Key business information is complete.'
        : profile?.business_name
          ? 'Description and location are missing — add them to strengthen funding applications.'
          : 'Business profile is incomplete. Complete onboarding to unlock all features.',
      action: { label: 'Edit profile', to: '/settings' },
    },
    {
      label: 'Financial records',
      status: profile?.monthly_revenue !== null
        ? 'healthy'
        : 'needs_attention',
      reason: profile?.monthly_revenue !== null
        ? `Monthly revenue: ₹${profile?.monthly_revenue?.toLocaleString('en-IN')}. ${profile?.monthly_expenses ? `Expenses: ₹${profile?.monthly_expenses?.toLocaleString('en-IN')}.` : 'Add expenses for break-even analysis.'}`
        : 'No revenue data on file. Add your monthly revenue to enable health scoring and funding fit checks.',
      action: { label: 'Update financials', to: '/settings' },
    },
    {
      label: 'GST / Compliance',
      status: profile?.gst_status === 'Registered'
        ? 'healthy'
        : profile?.gst_status === 'Registration in progress'
          ? 'needs_attention'
          : 'missing',
      reason: profile?.gst_status === 'Registered'
        ? 'GST registration is in place. This improves eligibility for many funding schemes.'
        : profile?.gst_status === 'Registration in progress'
          ? 'GST registration is in progress. Complete it to unlock more funding opportunities.'
          : 'GST not registered. Many MSME schemes require or prefer GST registration. Consider registering at gst.gov.in.',
      action: profile?.gst_status !== 'Registered' ? { label: 'Learn about GST', to: '/assistant' } : undefined,
    },
    {
      label: 'Udyam / MSME registration',
      status: profile?.udyam_status === 'Registered'
        ? 'healthy'
        : profile?.udyam_status === 'Registration in progress'
          ? 'needs_attention'
          : 'needs_attention',
      reason: profile?.udyam_status === 'Registered'
        ? 'Udyam registration is in place. You qualify as a verified MSME — a requirement for most government schemes.'
        : 'Udyam registration is recommended. Register free at udyamregistration.gov.in to access MSME-only schemes like PMEGP and SIDBI loans.',
      action: { label: 'Ask AI about Udyam', to: '/assistant' },
    },
    {
      label: 'Funding readiness',
      status: (profile?.udyam_status === 'Registered' && profile?.monthly_revenue !== null && profile?.business_name)
        ? 'healthy'
        : profile?.business_name && profile?.sector
          ? 'needs_attention'
          : 'missing',
      reason: (profile?.udyam_status === 'Registered' && profile?.monthly_revenue !== null && profile?.business_name)
        ? 'Your profile has sufficient data to run funding eligibility checks.'
        : profile?.business_name
          ? 'Profile is partially complete. Add financial records and Udyam status to strengthen funding applications.'
          : 'Complete your profile to assess funding readiness.',
      action: { label: 'Find funding', to: '/funding' },
    },
  ];

  const healthyCount = checks.filter((c) => c.status === 'healthy').length;
  const overallStatus = healthyCount === checks.length ? 'healthy' : healthyCount >= checks.length / 2 ? 'needs_attention' : 'missing';
  const overallLabel = overallStatus === 'healthy' ? 'Healthy' : overallStatus === 'needs_attention' ? 'Needs attention' : 'Missing information';
  const overallBadge = overallStatus === 'healthy' ? 'success' : overallStatus === 'needs_attention' ? 'warning' : 'danger';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Business Health</h1>
        <p>Deterministic assessment of your business readiness — no guessed scores</p>
      </div>

      {/* Overall status */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '3.5rem', height: '3.5rem', borderRadius: '50%',
          background: overallStatus === 'healthy' ? '#e4efe8' : overallStatus === 'needs_attention' ? '#f8ead3' : '#f8e4e0',
          border: `1px solid ${overallStatus === 'healthy' ? '#b3cfc0' : overallStatus === 'needs_attention' ? '#e4c48a' : '#e3b4ad'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <HeartPulse size={22} color={overallStatus === 'healthy' ? 'var(--color-success-600)' : overallStatus === 'needs_attention' ? 'var(--color-accent-600)' : 'var(--color-danger-600)'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>Overall Status</h2>
            <span className={`badge badge-${overallBadge}`}>{overallLabel}</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
            {healthyCount} of {checks.length} checks passed
          </p>
        </div>
        <Link to="/funding" className="btn btn-primary" style={{ fontSize: '0.8125rem', textDecoration: 'none' }}>
          Find funding
        </Link>
      </div>

      {/* Individual checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {checks.map((check) => {
          const { bg, border } = statusBg(check.status);
          return (
            <div key={check.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{ marginTop: '1px', flexShrink: 0 }}>{statusIcon(check.status)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.25rem' }}>{check.label}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)', lineHeight: 1.5 }}>{check.reason}</p>
              </div>
              {check.action && (
                <Link
                  to={check.action.to}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 500, flexShrink: 0, marginTop: '1px' }}
                >
                  {check.action.label}
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-surface-400)', textAlign: 'center' }}>
        Health checks are deterministic rules over your profile data — not AI-generated scores. Every status has a stated reason.
      </p>
    </div>
  );
}
