"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// ── Context ─────────────────────────────────────────────────────────────

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");
  return ctx;
}

// ── Root ────────────────────────────────────────────────────────────────

interface AccordionProps {
  /** Allow multiple items open simultaneously */
  type?: "single" | "multiple";
  /** IDs of items that start open */
  defaultOpen?: string[];
  className?: string;
  children: React.ReactNode;
}

export function Accordion({
  type = "single",
  defaultOpen = [],
  className,
  children
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set(defaultOpen));

  const toggle = React.useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (type === "single") next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={cn("divide-y divide-[var(--color-border)]", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// ── Item ────────────────────────────────────────────────────────────────

interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  /** Optional description shown beside the title (e.g. count) */
  meta?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AccordionItem({
  id,
  title,
  meta,
  disabled,
  className,
  children
}: AccordionItemProps) {
  const { openItems, toggle } = useAccordion();
  const isOpen = openItems.has(id);

  return (
    <div className={cn("group", className)}>
      <button
        type="button"
        id={`accordion-trigger-${id}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${id}`}
        disabled={disabled}
        onClick={() => toggle(id)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-1 py-4 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isOpen ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"
        )}
      >
        <span className="flex flex-1 items-center gap-2 text-sm font-semibold">
          {title}
          {meta && (
            <span className="ml-auto shrink-0 text-xs text-[var(--color-text-muted)]">{meta}</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[var(--color-text-muted)]"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            id={`accordion-panel-${id}`}
            role="region"
            aria-labelledby={`accordion-trigger-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-[var(--color-text-muted)]">{children}</div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
