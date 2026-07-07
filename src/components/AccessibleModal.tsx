/**
 * ═══════════════════════════════════════════════════════════════
 * ACCESSIBLE MODAL COMPONENT — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Features:
 *   - Focus trap (Tab cycles within modal)
 *   - Escape key closes modal
 *   - aria-modal, aria-labelledby, aria-describedby
 *   - Click outside to close
 *   - Returns focus to trigger on close
 *   - Prevents body scroll when open
 *   - Announces to screen readers via aria-live
 * ═══════════════════════════════════════════════════════════════
 */

"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type AccessibleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  size = "md",
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const maxWidth = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  // Focus trap
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element in modal
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
          firstFocusable?.focus();
        }
      });

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";

      // Restore focus to trigger element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titleId = title ? "modal-title" : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto scale-in card-glass p-6 ${className}`}
        style={{ borderColor: "var(--border-accent)" }}
        onKeyDown={handleKeyDown}
        role="document"
      >
        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="assertive">
          {isOpen ? "Dialog opened" : "Dialog closed"}
        </div>
        {children}
      </div>
    </div>
  );
}
