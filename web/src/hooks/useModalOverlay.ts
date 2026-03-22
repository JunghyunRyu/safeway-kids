import { useEffect, useRef, useCallback } from 'react';

interface UseModalOverlayOptions {
  open: boolean;
  onClose: () => void;
  disabled?: boolean;
  focusSelector?: string;
  initialFocusSelector?: string;
}

/**
 * Shared hook for modal overlay behavior:
 * - Escape key to close
 * - Focus trap (Tab/Shift+Tab)
 * - Body scroll lock
 * - Initial focus management
 */
export function useModalOverlay({
  open,
  onClose,
  disabled = false,
  focusSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  initialFocusSelector,
}: UseModalOverlayOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) {
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(focusSelector);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [disabled, onClose, focusSelector]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      if (initialFocusSelector) {
        requestAnimationFrame(() => {
          const target = containerRef.current?.querySelector<HTMLElement>(initialFocusSelector);
          target?.focus();
        });
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown, initialFocusSelector]);

  return containerRef;
}
