"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { ToastVariant, useToastStore } from "@/lib/store/toastStore";

const variantStyles: Record<ToastVariant, { bg: string; text: string; Icon: typeof Info }> = {
  success: {
    bg: "bg-[var(--color-grocery)]",
    text: "text-white",
    Icon: CheckCircle2,
  },
  error: {
    bg: "bg-[#b91c1c]",
    text: "text-white",
    Icon: AlertCircle,
  },
  info: {
    bg: "bg-[var(--color-primary)]",
    text: "text-white",
    Icon: Info,
  },
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const { bg, text, Icon } = variantStyles[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-lg)] ${bg} ${text}`}
              role="status"
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 opacity-80 transition hover:opacity-100"
                aria-label="Dismiss"
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
