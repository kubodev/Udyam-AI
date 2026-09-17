import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PanelLeftOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const location = useLocation();
  const isAssistant = location.pathname === '/assistant';

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('udyam_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('udyam_sidebar_open', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          title="Show sidebar (Cmd/Ctrl + B)"
          style={{
            position: 'fixed',
            top: '1.15rem',
            left: '1.15rem',
            zIndex: 35,
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-100)',
            border: '1px solid var(--color-surface-300)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-surface-700)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-500)';
            e.currentTarget.style.color = '#fffbf5';
            e.currentTarget.style.borderColor = 'var(--color-primary-800)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-100)';
            e.currentTarget.style.color = 'var(--color-surface-700)';
            e.currentTarget.style.borderColor = 'var(--color-surface-300)';
          }}
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <main
        className={`dashboard-main ${sidebarOpen ? 'sidebar-is-open' : 'sidebar-is-closed'}`}
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '17.5rem' : '0',
          minHeight: '100vh',
          height: isAssistant ? '100vh' : undefined,
          overflow: isAssistant ? 'hidden' : undefined,
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="dashboard-content"
          style={{
            flex: 1,
            padding: isAssistant ? 0 : (sidebarOpen ? '2rem' : '2rem 2rem 2rem 4.5rem'),
            maxWidth: isAssistant ? '100%' : '90rem',
            width: '100%',
            margin: isAssistant ? '0' : '0 auto',
            height: isAssistant ? '100%' : undefined,
            display: isAssistant ? 'flex' : undefined,
            flexDirection: isAssistant ? 'column' : undefined,
            transition: 'padding 0.25s ease',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

