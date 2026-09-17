import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, XCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const ICON_MAP = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
  const COLOR_MAP = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#b45309' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1d4ed8' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        maxWidth: '22rem', width: '100%', pointerEvents: 'none',
      }}>
        {toasts.map((toast) => {
          const Icon = ICON_MAP[toast.type];
          const c = COLOR_MAP[toast.type];
          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)',
                pointerEvents: 'all',
              }}
            >
              <Icon size={17} color={c.icon} style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ flex: 1, fontSize: '0.875rem', color: c.text, lineHeight: 1.4 }}>{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.icon, flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
