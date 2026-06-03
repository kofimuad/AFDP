"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Rendered in a sticky footer inside the sheet */
  footer?: ReactNode;
  /** How much of the viewport height the sheet can occupy */
  maxHeight?: "half" | "two-thirds" | "full";
  preventBackdropClose?: boolean;
  children: ReactNode;
}

const maxHeightClass = {
  half:       "max-h-[50dvh]",
  "two-thirds":"max-h-[67dvh]",
  full:        "max-h-[92dvh]"
};

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  footer,
  maxHeight = "two-thirds",
  preventBackdropClose = false,
  children
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => closeButtonRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "bottom-sheet-title" : undefined}
          className="fixed inset-0 z-50 flex flex-col justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[var(--color-dark)]/50 backdrop-blur-sm"
            onClick={preventBackdropClose ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "relative z-10 flex flex-col",
              "rounded-t-[var(--radius-xl)] border-t border-x border-[var(--color-border)]",
              "bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
              "w-full overflow-hidden",
              maxHeightClass[maxHeight]
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-3">
                <div className="min-w-0">
                  {title && (
                    <h2
                      id="bottom-sheet-title"
                      className="display-font text-lg font-bold text-[var(--color-text-primary)]"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{description}</p>
                  )}
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-[var(--radius-md)] p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Close button when no header */}
            {!title && !description && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 rounded-[var(--radius-md)] p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
