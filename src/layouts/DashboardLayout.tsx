import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Bell, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

export default function DashboardLayout() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.business_name?.[0]?.toUpperCase() ?? 'V';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main className="dashboard-main" style={{ flex: 1, marginLeft: '17.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          height: '4.5rem',
          backgroundColor: 'rgb(11 15 25 / .78)',
          borderBottom: '1px solid var(--color-surface-200)',
          backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '15rem', padding: '.45rem .7rem', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', color: 'var(--color-surface-400)', fontSize: '.75rem', background: 'var(--color-surface-100)' }}>
              <Search size={14} /> Search workspace
            </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            {profile?.business_name ? (
              <span>
                <span style={{ color: 'var(--color-surface-900)', fontWeight: 500 }}>{profile.business_name}</span>
                {profile.sector && <span style={{ color: 'var(--color-surface-400)' }}> · {profile.sector}</span>}
              </span>
            ) : 'UdyamAI'}
          </p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button className="desktop-only" title="Notifications" style={{ background: 'var(--color-surface-100)', border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-md)', color: 'var(--color-surface-500)', display: 'flex', padding: '.45rem', cursor: 'pointer' }}><Bell size={16} /></button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              {profile?.name ?? 'Welcome'}
            </span>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8798ff, #5668dc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.75rem', fontWeight: 600,
            }}>
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="dashboard-content" style={{ flex: 1, padding: '2rem', maxWidth: '90rem', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
