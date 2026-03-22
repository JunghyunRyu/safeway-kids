import { createContext, use, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * React 19 hook — uses `use()` instead of `useContext()`.
 */
export function useToast(): ToastContextValue {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Imperative API for backward compatibility (used by page components)
let _addToast: ((text: string, type: ToastType) => void) | null = null;

/** Show a toast notification from anywhere in the app. */
export function showToast(text: string, type: ToastType = 'info') {
  if (_addToast) {
    _addToast(text, type);
  }
}

const bgColors: Record<ToastType, string> = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#2563eb',
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Keep imperative API in sync
  _addToast = addToast;

  return (
    <ToastContext value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          aria-label="알림 메시지"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="alert"
              style={{
                backgroundColor: bgColors[toast.type],
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: 360,
                animation: 'fadeIn 0.2s ease-in',
              }}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </ToastContext>
  );
}

// Keep default export for backward compatibility with test imports
export default function ToastContainer() {
  return null; // Replaced by ToastProvider
}
