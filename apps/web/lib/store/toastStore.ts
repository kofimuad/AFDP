import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
}

const AUTO_DISMISS_MS = 3000;

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, variant = "info") => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        get().dismissToast(id);
      }, AUTO_DISMISS_MS);
    }
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);
  return { showToast };
};
