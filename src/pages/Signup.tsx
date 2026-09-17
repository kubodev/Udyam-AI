import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrong = password.length >= 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!passwordStrong) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      // Supabase may require email confirmation or auto-confirm based on settings
      setSuccess(true);
      setTimeout(() => navigate('/onboarding'), 1500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0b1020 0%, #10172a 60%, #0b0f19 100%)',
    }}>
      {/* Left — Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', maxWidth: '36rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="white" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>UdyamAI</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Start your free<br />business account
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-surface-400)', lineHeight: 1.7, marginBottom: '2rem' }}>
          Join thousands of Indian micro-entrepreneurs using AI to grow their business, stay safe from scams, and access funding.
        </p>
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-300)', fontStyle: 'italic', lineHeight: 1.6 }}>
            "UdyamAI helped me understand which government schemes my tailoring business qualifies for — in minutes, not weeks."
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.5rem' }}>— Lakshmi, Vijayawada</p>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '26rem', background: 'linear-gradient(145deg, #182030, #111827)', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={48} color="var(--color-success-500)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>Account created!</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>Taking you to onboarding…</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>Create your account</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
              </p>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} color="var(--color-danger-600)" />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Email */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Email</span>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                    <input
                      id="signup-email"
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                      style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                    />
                  </div>
                </label>

                {/* Password */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Password</span>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 8 characters"
                      style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 2.5rem', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <span style={{ fontSize: '0.75rem', color: passwordStrong ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                      {passwordStrong ? '✓ Password strength: good' : '✗ At least 8 characters required'}
                    </span>
                  )}
                </label>

                {/* Confirm Password */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Confirm Password</span>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat password"
                      style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                    />
                  </div>
                </label>

                <button id="signup-submit" type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', textAlign: 'center' }}>
                  By creating an account, you agree that your data is stored securely and used only to power your UdyamAI experience.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
