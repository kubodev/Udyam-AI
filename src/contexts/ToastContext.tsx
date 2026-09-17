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
    success: { bg: '#e4efe8', border: '#b3cfc0', icon: '#245536', text: '#245536' },
    error:   { bg: '#f8e4e0', border: '#e3b4ad', icon: '#912018', text: '#912018' },
    warning: { bg: '#f8ead3', border: '#e4c48a', icon: '#7a4a12', text: '#7a4a12' },
    info:    { bg: '#e8f0eb', border: '#b3cfc0', icon: '#173d2e', text: '#173d2e' },
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
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lg)',
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
