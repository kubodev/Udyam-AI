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
        padding: '1.25rem 0 1rem',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s ease',
        borderRight: '1px solid #0e1a15',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1.1rem 1.15rem',
          marginBottom: '0.5rem',
          borderBottom: '1px solid rgb(255 255 255 / .08)',
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
            alt="UdyamAI"
            style={{
              height: '3.85rem',
              maxWidth: '12.5rem',
              objectFit: 'contain',
              objectPosition: 'left center',
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
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid rgb(255 255 255 / .12)',
              color: 'var(--color-sidebar-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-sidebar-hover)';
              e.currentTarget.style.color = '#fffbf5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-sidebar-text)';
            }}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0 .75rem' }}>
        {navItems.map((item) => (
          <div key={item.to}>
          {item.group && <p style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-sidebar-text)', margin: item.to === '/' ? '0 .55rem .45rem' : '1.15rem .55rem .45rem' }}>{item.group}</p>}
          <NavLink
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.55rem 0.7rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
              backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              border: '1px solid transparent',
              textDecoration: 'none',
              cursor: 'pointer',
            })}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.backgroundColor = 'var(--color-sidebar-hover)';
                target.style.color = '#fffbf5';
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
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: '1rem 1.2rem',
          borderTop: '1px solid rgb(255 255 255 / .08)',
          marginTop: 'auto',
        }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-sidebar-text)',
            textAlign: 'left',
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Your business, in focus
        </p>
      </div>
    </aside>
  );
}
