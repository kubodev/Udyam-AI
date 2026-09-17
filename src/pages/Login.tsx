import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-surface-50)',
    }}>
      {/* Left — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem',
        maxWidth: '36rem',
        background: 'var(--color-sidebar-bg)',
        color: '#f3ede3',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <img
            src="/logo.png"
            alt="Udiyam AI"
            style={{
              height: '5rem',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 650, color: '#f3ede3', lineHeight: 1.12, marginBottom: '1rem', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
          Your business companion<br />for the workbench
        </h1>
        <p style={{ fontSize: '1rem', color: '#b7c4bc', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Designed for Indian micro-entrepreneurs. Get fraud protection, discover funding, manage finances — with AI that understands your business.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { n: '01', text: 'Fraud & scam checks before you pay' },
            { n: '02', text: 'Verified funding & grant discovery' },
            { n: '03', text: 'Business health from your actual records' },
            { n: '04', text: 'Application drafts from your real data' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.08em', color: 'var(--color-accent-500)', fontFamily: 'var(--font-mono)' }}>{item.n}</span>
              <span style={{ fontSize: '0.9rem', color: '#e8dfd2' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '2rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '26rem',
          background: 'var(--color-surface-100)',
          border: '1px solid var(--color-surface-300)',
          borderRadius: 'var(--radius-md)',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
            }}>
              <AlertCircle size={16} color="var(--color-danger-600)" />
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Email</span>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                    border: '1px solid var(--color-surface-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                />
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-surface-700)' }}>Password</span>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                    border: '1px solid var(--color-surface-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-300)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
