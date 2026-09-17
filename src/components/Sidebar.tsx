import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  HeartPulse,
  FileText,
  Calculator,
  Landmark,
  ClipboardList,
  ListChecks,
  Settings,
  PanelLeftClose,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  group?: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const navItems: NavItem[] = [
  { to: '/',             label: 'Overview',        icon: LayoutDashboard, group: 'Workspace' },
  { to: '/assistant',    label: 'AI Assistant',     icon: MessageSquare },
  { to: '/health',       label: 'Business Health',  icon: HeartPulse },
  { to: '/documents',    label: 'Documents',        icon: FileText, group: 'Business tools' },
  { to: '/finance',      label: 'Finance Tools',    icon: Calculator },
  { to: '/funding',      label: 'Funding',          icon: Landmark, group: 'Growth' },
  { to: '/applications', label: 'Applications',     icon: ClipboardList },
  { to: '/tasks',        label: 'Tasks',            icon: ListChecks },
  { to: '/settings',     label: 'Settings',         icon: Settings, group: 'Account' },
];

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  return (
    <aside
      style={{
        width: '17.5rem',
        minHeight: '100vh',
        backgroundColor: 'var(--color-sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0 1rem',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.35)' : 'none',
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1.25rem',
          marginBottom: '2rem',
        }}
      >
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            flex: 1,
            minWidth: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="Udiyam AI"
            style={{
              height: '3.2rem',
              maxWidth: '10.5rem',
              objectFit: 'contain',
              objectPosition: 'left center',
              filter: 'drop-shadow(0 2px 10px rgba(51, 208, 119, 0.25))',
            }}
          />
        </NavLink>
        {onToggle && (
          <button
            onClick={onToggle}
            title="Hide sidebar (Cmd/Ctrl + B)"
            style={{
              marginLeft: 'auto',
              width: '2rem', height: '2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--color-sidebar-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = 'var(--color-sidebar-text)';
            }}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0 .8rem' }}>
        {navItems.map((item) => (
          <div key={item.to}>
          {item.group && <p style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-sidebar-text)', margin: item.to === '/' ? '0 .7rem .5rem' : '1.25rem .7rem .5rem' }}>{item.group}</p>}
          <NavLink
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
              backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              border: isActive ? '1px solid rgb(127 145 255 / .16)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            })}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.backgroundColor = 'var(--color-sidebar-hover)';
                target.style.color = 'var(--color-sidebar-text-active)';
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.backgroundColor = 'transparent';
                target.style.color = 'var(--color-sidebar-text)';
              }
            }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '1rem 1.35rem',
          borderTop: '1px solid var(--color-surface-200)',
          marginTop: 'auto',
        }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-sidebar-text)',
            textAlign: 'center',
          }}
        >
          Your business, in focus
        </p>
      </div>
    </aside>
  );
}
