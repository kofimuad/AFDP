import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  /** Override the default auto-dismiss duration (ms). Pass 0 to disable. */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: number) => void;
}

const DEFAULT_DURATION_MS = 3500;

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, variant = "info", duration = DEFAULT_DURATION_MS) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
    if (typeof window !== "undefined" && duration > 0) {
      window.setTimeout(() => get().dismissToast(id), duration);
    }
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);
  return { showToast };
};
