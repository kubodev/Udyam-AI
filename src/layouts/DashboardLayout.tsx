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
            top: '1.25rem',
            left: '1.25rem',
            zIndex: 35,
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 22, 38, 0.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-surface-400)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(25, 36, 60, 0.95)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(125, 142, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 22, 38, 0.92)';
            e.currentTarget.style.color = 'var(--color-surface-400)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
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

