"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { ToastVariant, useToastStore } from "@/lib/store/toastStore";

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; text: string; muted: string; Icon: typeof Info }
> = {
  success: {
    bg:     "bg-[var(--color-surface)]",
    border: "border-l-4 border-l-[var(--color-success)] border-y border-r border-[var(--color-border)]",
    text:   "text-[var(--color-text-primary)]",
    muted:  "text-[var(--color-success)]",
    Icon:   CheckCircle2
  },
  error: {
    bg:     "bg-[var(--color-surface)]",
    border: "border-l-4 border-l-[var(--color-error)] border-y border-r border-[var(--color-border)]",
    text:   "text-[var(--color-text-primary)]",
    muted:  "text-[var(--color-error)]",
    Icon:   AlertCircle
  },
  warning: {
    bg:     "bg-[var(--color-surface)]",
    border: "border-l-4 border-l-[var(--color-warning)] border-y border-r border-[var(--color-border)]",
    text:   "text-[var(--color-text-primary)]",
    muted:  "text-[var(--color-warning)]",
    Icon:   AlertTriangle
  },
  info: {
    bg:     "bg-[var(--color-surface)]",
    border: "border-l-4 border-l-[var(--color-primary)] border-y border-r border-[var(--color-border)]",
    text:   "text-[var(--color-text-primary)]",
    muted:  "text-[var(--color-primary)]",
    Icon:   Info
  }
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const { bg, border, text, muted, Icon } = variantStyles[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-md)] ${bg} ${border}`}
              role="status"
              aria-live="polite"
            >
              <Icon size={18} className={cn("mt-0.5 shrink-0", muted)} />
              <p className={`flex-1 text-sm ${text}`}>{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className={`shrink-0 transition opacity-60 hover:opacity-100 ${text}`}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
