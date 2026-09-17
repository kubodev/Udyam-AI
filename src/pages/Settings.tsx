import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Globe, User, Trash2, Check, AlertCircle, Edit2 } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { BusinessProfile } from '../types';

const inputStyle = {
  width: '100%', padding: '0.55rem 0.8rem',
  background: 'var(--color-surface-50)',
  border: '1px solid var(--color-surface-300)',
  color: 'var(--color-surface-800)',
  borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none',
  transition: 'border-color 0.15s ease',
};

const SECTORS = ['Retail', 'Food & Beverage', 'Textile & Garments', 'Manufacturing', 'Services', 'Technology', 'Agriculture', 'Healthcare', 'Education', 'Other'];
const STAGES = ['Idea / Pre-revenue', 'Early Stage (< 1 year)', 'Growing (1–3 years)', 'Established (3+ years)'];

export default function Settings() {
  const { profile, updateProfile } = useProfile();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllData = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // 1. Delete user's tasks
      await supabase.from('tasks').delete().eq('user_id', user.id);
      // 2. Delete user's applications
      await supabase.from('applications').delete().eq('user_id', user.id);
      // 3. Delete saved opportunities
      await supabase.from('saved_opportunities').delete().eq('user_id', user.id);
      // 4. Delete financial records
      await supabase.from('financial_records').delete().eq('user_id', user.id);
      // 5. Delete documents
      await supabase.from('documents').delete().eq('user_id', user.id);
      // 6. Delete conversations & messages
      const { data: convs } = await supabase.from('conversations').select('id').eq('user_id', user.id);
      if (convs && convs.length > 0) {
        const ids = convs.map(c => c.id);
        await supabase.from('messages').delete().in('conversation_id', ids);
        await supabase.from('conversations').delete().eq('user_id', user.id);
      }
      // 7. Reset profile
      await supabase.from('business_profiles').delete().eq('id', user.id);

      showToast('All your data has been deleted.', 'info');
      setConfirmDelete(false);
      await signOut();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete data', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const [form, setForm] = useState({
    name: profile?.name ?? '',
    business_name: profile?.business_name ?? '',
    sector: profile?.sector ?? '',
    description: profile?.description ?? '',
    location: profile?.location ?? '',
    state: profile?.state ?? '',
    business_stage: profile?.business_stage ?? '',
    monthly_revenue: profile?.monthly_revenue?.toString() ?? '',
    monthly_expenses: profile?.monthly_expenses?.toString() ?? '',
    upi_id: profile?.upi_id ?? '',
    gst_status: profile?.gst_status ?? 'Not registered',
    udyam_status: profile?.udyam_status ?? 'Not registered',
    primary_goal: profile?.primary_goal ?? '',
    funding_requirement: profile?.funding_requirement?.toString() ?? '',
    use_of_funds: profile?.use_of_funds ?? '',
    preferred_language: profile?.preferred_language ?? 'en',
  });

  const set = (field: keyof typeof form, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const fields: Partial<BusinessProfile> = {
      name: form.name || null,
      business_name: form.business_name || null,
      sector: form.sector || null,
      description: form.description || null,
      location: form.location || null,
      state: form.state || null,
      business_stage: form.business_stage || null,
      monthly_revenue: form.monthly_revenue ? parseFloat(form.monthly_revenue) : null,
      monthly_expenses: form.monthly_expenses ? parseFloat(form.monthly_expenses) : null,
      upi_id: form.upi_id || null,
      gst_status: form.gst_status || null,
      udyam_status: form.udyam_status || null,
      primary_goal: form.primary_goal || null,
      funding_requirement: form.funding_requirement ? parseFloat(form.funding_requirement) : null,
      use_of_funds: form.use_of_funds || null,
      preferred_language: form.preferred_language,
    };
    const { error } = await updateProfile(fields);
    setSaving(false);
    if (error) { setSaveError(error); return; }
    setSaveSuccess(true);
    setEditing(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'var(--color-primary-500)'; };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'var(--color-surface-300)'; };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile, privacy controls, and preferences</p>
      </div>

      {saveSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <Check size={15} color="var(--color-success-600)" />
          <span style={{ fontSize: '0.8125rem' }}>Profile saved successfully.</span>
        </div>
      )}
      {saveError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <AlertCircle size={15} color="var(--color-danger-600)" />
          <span style={{ fontSize: '0.8125rem' }}>{saveError}</span>
        </div>
      )}

      {/* Business Profile Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={17} color="var(--color-primary-600)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>Business Profile</h2>
          </div>
          <button
            id="edit-profile-btn"
            className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`}
            style={{ fontSize: '0.8125rem' }}
            onClick={() => { if (editing) setEditing(false); else setEditing(true); }}
          >
            {editing ? 'Cancel' : <><Edit2 size={14} /> Edit profile</>}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Personal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Your name</span>
                <input style={inputStyle} type="text" value={form.name} onChange={(e) => set('name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Business name</span>
                <input style={inputStyle} type="text" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Sector</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sector} onChange={(e) => set('sector', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="">Select sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Business stage</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.business_stage} onChange={(e) => set('business_stage', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="">Select stage</option>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>City / Town</span>
                <input style={inputStyle} type="text" value={form.location} onChange={(e) => set('location', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>State</span>
                <input style={inputStyle} type="text" value={form.state} onChange={(e) => set('state', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Monthly revenue (₹)</span>
                <input style={inputStyle} type="number" min="0" value={form.monthly_revenue} onChange={(e) => set('monthly_revenue', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Monthly expenses (₹)</span>
                <input style={inputStyle} type="number" min="0" value={form.monthly_expenses} onChange={(e) => set('monthly_expenses', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>UPI ID</span>
                <input style={inputStyle} type="text" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>GST status</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.gst_status} onChange={(e) => set('gst_status', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                  {['Not registered', 'Registered', 'Registration in progress'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Udyam / MSME status</span>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.udyam_status} onChange={(e) => set('udyam_status', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                  {['Not registered', 'Registered', 'Registration in progress'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Funding requirement (₹)</span>
                <input style={inputStyle} type="number" min="0" value={form.funding_requirement} onChange={(e) => set('funding_requirement', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Business description</span>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '4.5rem' }} value={form.description} onChange={(e) => set('description', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-surface-600)' }}>Use of funds</span>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '3rem' }} value={form.use_of_funds} onChange={(e) => set('use_of_funds', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </label>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button id="save-profile-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={15} />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          /* Read-only view */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-surface-200)' }}>
              <div style={{
                width: '3.25rem', height: '3.25rem', borderRadius: '2px',
                background: 'var(--color-primary-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fffbf5', fontSize: '1.05rem', fontWeight: 700,
                flexShrink: 0,
              }}>
                {(profile?.name
                  ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : profile?.business_name?.[0]?.toUpperCase() ?? 'U')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-surface-900)', margin: '0 0 0.2rem 0' }}>
                  {profile?.name || 'Business Owner'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)', margin: 0 }}>
                  {profile?.business_name ? `${profile.business_name}${profile.sector ? ` · ${profile.sector}` : ''}` : (user?.email ?? 'UdyamAI Account')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem' }}>
              {[
                ['Name', profile?.name],
                ['Business', profile?.business_name],
                ['Sector', profile?.sector],
                ['Stage', profile?.business_stage],
                ['Location', profile?.location && profile?.state ? `${profile.location}, ${profile.state}` : profile?.location ?? profile?.state],
                ['Monthly revenue', profile?.monthly_revenue ? `₹${profile.monthly_revenue.toLocaleString('en-IN')}` : null],
                ['Monthly expenses', profile?.monthly_expenses ? `₹${profile.monthly_expenses.toLocaleString('en-IN')}` : null],
                ['UPI ID', profile?.upi_id],
                ['GST', profile?.gst_status],
                ['Udyam', profile?.udyam_status],
                ['Funding need', profile?.funding_requirement ? `₹${profile.funding_requirement.toLocaleString('en-IN')}` : null],
                ['Email', user?.email],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginBottom: '0.125rem' }}>{label}</p>
                  <p style={{ fontSize: '0.875rem', color: value ? 'var(--color-surface-900)' : 'var(--color-surface-300)', fontWeight: value ? 500 : 400 }}>
                    {value ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Globe size={17} color="var(--color-primary-600)" />
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>Language Preference</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Currently English only (MVP). Regional language support is planned.</p>
          </div>
        </div>
        <span className="badge badge-warning">English (MVP)</span>
      </div>

      {/* Privacy */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          <Shield size={17} color="var(--color-primary-600)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>Privacy & Data Controls</h2>
        </div>
        <div className="alert alert-info" style={{ marginBottom: '0.875rem' }}>
          <div>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
            <strong>What we store:</strong> Your business profile, conversation history, uploaded documents, extracted financial data, funding applications, and tasks. All data is private to your account (enforced with row-level security on every table).
          </p>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, marginTop: '0.5rem', marginBottom: 0 }}>
            <strong>What we don't do:</strong> We never share your data or use it for anything beyond powering your own UdyamAI experience. No training, no third-party sharing.
          </p>
          </div>
        </div>
        {!confirmDelete ? (
          <button
            id="delete-data-btn"
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)', borderColor: 'rgba(247, 108, 108, 0.3)' }}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} />
            Delete all my data & account
          </button>
        ) : (
          <div className="alert alert-error">
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Are you sure? This permanently deletes all your documents, financial records, applications, tasks, and chat history.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn"
                style={{ fontSize: '0.75rem', background: 'var(--color-danger-600)', color: 'white', border: 'none' }}
                onClick={handleDeleteAllData}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out / Account */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <SettingsIcon size={17} color="var(--color-surface-400)" />
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>Account</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>{user?.email}</p>
          </div>
        </div>
        <button
          id="sign-out-btn"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)', borderColor: 'rgba(247, 108, 108, 0.3)' }}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
