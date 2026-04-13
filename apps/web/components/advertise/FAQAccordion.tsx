"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => {
        const isOpen = Boolean(openItems[index]);

        return (
          <article key={item.question} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="relative flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--color-surface-hover)]"
            >
              <span className={`text-sm font-semibold ${isOpen ? "text-[#C8522A]" : "text-[var(--color-text-primary)]"}`}>{item.question}</span>

              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
                <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
              </motion.div>

              <AnimatePresence>
                {isOpen ? (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ transformOrigin: "top" }}
                    className="absolute left-0 top-0 h-full w-[3px] bg-[#C8522A]"
                  />
                ) : null}
              </AnimatePresence>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
                  >
                    {item.answer}
                  </motion.p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}