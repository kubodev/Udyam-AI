import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import type { BusinessProfile } from '../types';

const SECTORS = ['Retail', 'Food & Beverage', 'Textile & Garments', 'Manufacturing', 'Services', 'Technology', 'Agriculture', 'Healthcare', 'Education', 'Other'];
const STAGES = ['Idea / Pre-revenue', 'Early Stage (< 1 year)', 'Growing (1–3 years)', 'Established (3+ years)'];
const STATES = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Other'];
const GOALS = ['Secure funding / investment', 'Improve financial management', 'Protect against fraud', 'Expand business', 'Formalize the business', 'Improve marketing'];
const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'te', label: 'Telugu' }, { value: 'hi', label: 'Hindi' }];

interface FormData {
  name: string;
  preferred_language: string;
  business_name: string;
  sector: string;
  business_type: string;
  description: string;
  business_stage: string;
  location: string;
  state: string;
  monthly_revenue: string;
  monthly_expenses: string;
  upi_id: string;
  gst_status: string;
  udyam_status: string;
  primary_goal: string;
  funding_requirement: string;
  use_of_funds: string;
}

const STEPS = [
  { title: 'Personal Info', subtitle: "Let's start with your name and language preference" },
  { title: 'Your Business', subtitle: 'Tell us about your business' },
  { title: 'Financials', subtitle: 'Help us understand your financial picture' },
  { title: 'Your Goals', subtitle: 'What do you want to achieve?' },
];

const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid var(--color-surface-300)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.15s',
  backgroundColor: 'var(--color-surface-100)',
  color: 'var(--color-surface-900)',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)', display: 'block', marginBottom: '0.375rem' }}>{children}</span>;
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function OptionalTag() {
  return <span style={{ fontSize: '0.7rem', color: 'var(--color-surface-400)', fontWeight: 400, marginLeft: '0.25rem' }}>(optional)</span>;
}

export default function Onboarding() {
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '', preferred_language: 'en',
    business_name: '', sector: '', business_type: '', description: '', business_stage: '', location: '', state: '',
    monthly_revenue: '', monthly_expenses: '', upi_id: '', gst_status: 'Not registered', udyam_status: 'Not registered',
    primary_goal: '', funding_requirement: '', use_of_funds: '',
  });

  const set = (field: keyof FormData, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--color-primary-500)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--color-surface-300)';
  };

  const canAdvance = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.business_name.trim().length > 0 && form.sector.length > 0 && form.business_stage.length > 0;
    return true;
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    const fields: Partial<BusinessProfile> = {
      name: form.name,
      preferred_language: form.preferred_language,
      business_name: form.business_name,
      sector: form.sector,
      business_type: form.business_type || null,
      description: form.description || null,
      business_stage: form.business_stage,
      location: form.location || null,
      state: form.state || null,
      monthly_revenue: form.monthly_revenue ? parseFloat(form.monthly_revenue) : null,
      monthly_expenses: form.monthly_expenses ? parseFloat(form.monthly_expenses) : null,
      upi_id: form.upi_id || null,
      gst_status: form.gst_status,
      udyam_status: form.udyam_status,
      primary_goal: form.primary_goal || null,
      funding_requirement: form.funding_requirement ? parseFloat(form.funding_requirement) : null,
      use_of_funds: form.use_of_funds || null,
    };
    const { error } = await updateProfile(fields);
    setSaving(false);
    if (error) { setError(error); return; }
    navigate('/');
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-surface-50)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}>
        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-surface-900)' }}>UdyamAI</span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '34rem', background: 'linear-gradient(145deg, #182030, #111827)', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'var(--color-surface-100)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  width: '1.5rem', height: '1.5rem',
                  borderRadius: '50%',
                  fontSize: '0.75rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? 'var(--color-primary-600)' : i === step ? 'var(--color-primary-600)' : 'var(--color-surface-200)',
                  color: i <= step ? 'white' : 'var(--color-surface-500)',
                  transition: 'all 0.2s',
                }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: '2.5rem', height: '1px', background: i < step ? 'var(--color-primary-400)' : 'var(--color-surface-200)' }} />
                )}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.25rem' }}>{STEPS[step].title}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1.75rem' }}>{STEPS[step].subtitle}</p>

          {/* Step 0 — Personal */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Field label="Your full name *">
                <input
                  id="onboard-name"
                  style={inputStyle} type="text" value={form.name} placeholder="e.g. Lakshmi Devi"
                  onChange={(e) => set('name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
              <Field label="Preferred language">
                <select style={inputStyle} value={form.preferred_language} onChange={(e) => set('preferred_language', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* Step 1 — Business */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Field label="Business name *">
                <input id="onboard-business-name" style={inputStyle} type="text" value={form.business_name} placeholder="e.g. Lakshmi Tailors" onChange={(e) => set('business_name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Sector *">
                  <select id="onboard-sector" style={inputStyle} value={form.sector} onChange={(e) => set('sector', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Select sector</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Business stage *">
                  <select id="onboard-stage" style={inputStyle} value={form.business_stage} onChange={(e) => set('business_stage', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Select stage</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label={<>City / Town <OptionalTag /></>}>
                  <input style={inputStyle} type="text" value={form.location} placeholder="e.g. Vijayawada" onChange={(e) => set('location', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label={<>State <OptionalTag /></>}>
                  <select style={inputStyle} value={form.state} onChange={(e) => set('state', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={<>Business description <OptionalTag /></>}>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '5rem' }}
                  value={form.description}
                  placeholder="Briefly describe what your business does..."
                  onChange={(e) => set('description', e.target.value)}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
            </div>
          )}

          {/* Step 2 — Financials */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label={<>Monthly revenue (₹) <OptionalTag /></>}>
                  <input id="onboard-revenue" style={inputStyle} type="number" value={form.monthly_revenue} placeholder="e.g. 40000" min="0" onChange={(e) => set('monthly_revenue', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label={<>Monthly expenses (₹) <OptionalTag /></>}>
                  <input style={inputStyle} type="number" value={form.monthly_expenses} placeholder="e.g. 25000" min="0" onChange={(e) => set('monthly_expenses', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>
              <Field label={<>UPI ID <OptionalTag /></>}>
                <input id="onboard-upi" style={inputStyle} type="text" value={form.upi_id} placeholder="e.g. lakshmi@upi" onChange={(e) => set('upi_id', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="GST status">
                  <select style={inputStyle} value={form.gst_status} onChange={(e) => set('gst_status', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                    {['Not registered', 'Registered', 'Registration in progress'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Udyam / MSME status">
                  <select style={inputStyle} value={form.udyam_status} onChange={(e) => set('udyam_status', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                    {['Not registered', 'Registered', 'Registration in progress'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ padding: '0.875rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-200)' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
                  💡 This information helps UdyamAI generate accurate funding fit checks and business health assessments. All data is private to your account.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Field label={<>Primary goal <OptionalTag /></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {GOALS.map((g) => (
                    <button
                      key={g} type="button"
                      onClick={() => set('primary_goal', g)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${form.primary_goal === g ? 'var(--color-primary-500)' : 'var(--color-surface-300)'}`,
                        background: form.primary_goal === g ? 'var(--color-primary-50)' : 'white',
                        color: form.primary_goal === g ? 'var(--color-primary-700)' : 'var(--color-surface-700)',
                        fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={<>Funding requirement (₹) <OptionalTag /></>}>
                <input id="onboard-funding" style={inputStyle} type="number" value={form.funding_requirement} placeholder="e.g. 500000" min="0" onChange={(e) => set('funding_requirement', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
              </Field>
              <Field label={<>How would you use the funding? <OptionalTag /></>}>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '4.5rem' }}
                  value={form.use_of_funds} placeholder="e.g. Purchase new sewing machines and expand workshop space"
                  onChange={(e) => set('use_of_funds', e.target.value)} onFocus={focusStyle} onBlur={blurStyle}
                />
              </Field>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              type="button" onClick={handleBack}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              className="btn btn-secondary"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button id="onboard-next" type="button" onClick={handleNext} disabled={!canAdvance()} className="btn btn-primary">
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button id="onboard-finish" type="button" onClick={handleFinish} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving…' : 'Get started'}
                {!saving && <Check size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-surface-400)' }}>
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
  );
}
