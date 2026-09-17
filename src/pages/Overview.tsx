import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  MessageSquare, FileText, HeartPulse, Landmark, QrCode, Calculator,
  LayoutDashboard, Sparkles, ClipboardList, ArrowRight, AlertTriangle, X,
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const quickActions = [
  { label: 'Ask AI', icon: MessageSquare, to: '/assistant', color: 'var(--color-primary-600)' },
  { label: 'Upload Doc', icon: FileText, to: '/documents', color: 'var(--color-accent-600)' },
  { label: 'Check Health', icon: HeartPulse, to: '/health', color: 'var(--color-success-600)' },
  { label: 'Find Funding', icon: Landmark, to: '/funding', color: 'var(--color-primary-500)' },
  { label: 'Create QR', icon: QrCode, to: '/create-qr', color: '#1b5f6b' },
  { label: 'Finance Tools', icon: Calculator, to: '/finance', color: 'var(--color-accent-500)' },
];

function HealthIndicator({ label, value, variant }: { label: string; value: string; variant: string }) {
  return (
    <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-400)', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>{label}</p>
      <span className={`badge badge-${variant}`}>{value}</span>
    </div>
  );
}

interface AlertItem {
  id: string;
  message: string;
  to: string;
  linkLabel: string;
}

interface ActivityItem {
  id: string;
  type: 'message' | 'application' | 'task';
  title: string;
  subtitle: string;
  time: string;
  to: string;
}



export default function Overview() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const items: ActivityItem[] = [];

      // Last conversation message
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, created_at, conversations(user_id)')
        .eq('conversations.user_id', user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1);
      if (msgs && msgs.length > 0) {
        const m = msgs[0];
        items.push({
          id: m.id,
          type: 'message',
          title: 'AI conversation',
          subtitle: (m.content as string)?.slice(0, 80) + ((m.content as string)?.length > 80 ? '…' : ''),
          time: m.created_at as string,
          to: '/assistant',
        });
      }

      // Latest application
      const { data: apps } = await supabase
        .from('applications')
        .select('id, opportunity_id, status, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (apps && apps.length > 0) {
        const a = apps[0];
        items.push({
          id: a.id,
          type: 'application',
          title: 'Application draft',
          subtitle: `Status: ${a.status}`,
          time: a.updated_at as string,
          to: '/applications',
        });
      }

      // Latest open task
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
      if (tasks && tasks.length > 0) {
        const t = tasks[0];
        items.push({
          id: t.id,
          type: 'task',
          title: 'Open task',
          subtitle: t.title as string,
          time: t.created_at as string,
          to: '/tasks',
        });
      }

      // Sort by time desc
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items);
      setActivityLoading(false);
    })();
  }, [user]);

  const financialHealth = profile?.monthly_revenue ? 'Has data' : 'Needs attention';
  const fundingReadiness = profile?.udyam_status === 'Registered' ? 'Ready' : 'Incomplete';
  const complianceStatus = profile?.gst_status === 'Registered' ? 'Registered' : 'Not registered';
  const profileComplete = profile?.business_name && profile?.sector && profile?.description ? 'Complete' : 'Needs update';

  // Build alert list from profile data
  const allAlerts: AlertItem[] = [];
  if (profile) {
    if (!profile.business_name || !profile.sector || !profile.description || !profile.location) {
      allAlerts.push({ id: 'profile-incomplete', message: '⚠️ Your business profile is incomplete — this reduces your funding eligibility score.', to: '/settings', linkLabel: 'Complete profile →' });
    }
    if (profile.gst_status !== 'Registered') {
      allAlerts.push({ id: 'gst-missing', message: '📋 GST registration is missing. Most MSME schemes prefer registered businesses.', to: '/health', linkLabel: 'Learn more →' });
    }
    if (!profile.monthly_revenue) {
      allAlerts.push({ id: 'revenue-missing', message: '💰 Add your monthly revenue to enable funding fit checks and financial health scoring.', to: '/settings', linkLabel: 'Update financials →' });
    }
  }
  const visibleAlerts = allAlerts.filter((a) => !dismissedAlerts.has(a.id));


  const activityIcon = (type: ActivityItem['type']) => {
    if (type === 'message') return <MessageSquare size={16} color="var(--color-primary-600)" />;
    if (type === 'application') return <ClipboardList size={16} color="var(--color-accent-600)" />;
    return <FileText size={16} color="var(--color-accent-600)" />;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map((i) => <div key={i} className="glass-card animate-pulse-subtle" style={{ height: '6rem' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Overview</h1>
        <p>Your business at a glance</p>
      </div>

      {/* Alerts Banner */}
      {visibleAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className="alert alert-warning"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <AlertTriangle size={16} color="var(--color-warning-500)" style={{ flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: '0.8125rem', lineHeight: 1.45, margin: 0 }}>{alert.message}</p>
              <Link to={alert.to} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-accent-600)', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {alert.linkLabel}
              </Link>
              <button
                onClick={() => setDismissedAlerts((prev) => new Set([...prev, alert.id]))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'var(--color-warning-500)', flexShrink: 0 }}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Business Summary Card */}

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3.25rem', height: '3.25rem',
            borderRadius: '2px',
            background: 'var(--color-primary-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--color-surface-900)', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' }}>
              {profile?.business_name ?? 'Your Business'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-400)', margin: 0 }}>
              {profile?.sector && profile?.location
                ? `${profile.sector} · ${profile.location}${profile.state ? `, ${profile.state}` : ''}`
                : 'Complete your profile for a detailed summary'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
            {profile?.monthly_revenue && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', margin: '0 0 0.15rem 0' }}>Monthly revenue</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 750, color: 'var(--color-primary-600)', margin: 0 }}>
                  ₹{profile.monthly_revenue.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {profile?.business_stage && (
              <span className="badge badge-primary">{profile.business_stage}</span>
            )}
          </div>
        </div>
        {profile?.description && (
          <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-surface-400)', lineHeight: 1.65, paddingTop: '1.25rem', borderTop: '1px solid var(--color-surface-200)', marginBottom: 0 }}>
            {profile.description}
          </p>
        )}
      </div>

      {/* Health Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <HealthIndicator label="Financial Records" value={financialHealth} variant={financialHealth === 'Has data' ? 'success' : 'warning'} />
        <HealthIndicator label="Funding Readiness" value={fundingReadiness} variant={fundingReadiness === 'Ready' ? 'success' : 'warning'} />
        <HealthIndicator label="GST / Compliance" value={complianceStatus} variant={complianceStatus === 'Registered' ? 'success' : 'danger'} />
        <HealthIndicator label="Business Profile" value={profileComplete} variant={profileComplete === 'Complete' ? 'success' : 'warning'} />
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9.5rem, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="glass-card"
            style={{
              padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem',
              cursor: 'pointer', textDecoration: 'none',
              fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-700)',
            }}
          >
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-50)', border: '1px solid var(--color-surface-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <action.icon size={20} color={action.color} />
            </div>
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
        Recent Activity
      </h3>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {activityLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
            {[1, 2].map((i) => <div key={i} className="animate-pulse-subtle" style={{ height: '3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-200)' }} />)}
          </div>
        ) : activity.length === 0 ? (
          <div className="empty-state">
            <LayoutDashboard className="empty-state-icon" />
            <h3>No activity yet</h3>
            <p>Your conversations, applications, and tasks will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.map((item, idx) => (
              <Link
                key={item.id}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.95rem 1.25rem',
                  textDecoration: 'none',
                  borderBottom: idx < activity.length - 1 ? '1px solid var(--color-surface-200)' : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-50)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: '2.25rem', height: '2.25rem', flexShrink: 0,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-50)',
                  border: '1px solid var(--color-surface-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activityIcon(item.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-800)', margin: '0 0 0.15rem 0' }}>{item.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.subtitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                    {new Date(item.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <ArrowRight size={14} color="var(--color-surface-400)" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
