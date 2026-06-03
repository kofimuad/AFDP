"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  /** Visual style of the tab bar */
  variant?: "underline" | "pills" | "segment";
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = "underline", className }: TabsProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === tabs[index].id);

    let next: Tab | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = enabledTabs[(currentIndex + 1) % enabledTabs.length];
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length];
    } else if (e.key === "Home") {
      next = enabledTabs[0];
    } else if (e.key === "End") {
      next = enabledTabs[enabledTabs.length - 1];
    }

    if (next) {
      e.preventDefault();
      onChange(next.id);
      // Move DOM focus to the activated tab button
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
      const targetIndex = tabs.findIndex((t) => t.id === next!.id);
      buttons?.[targetIndex]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Tabs"
      className={cn(
        "flex",
        variant === "underline" && "border-b border-[var(--color-border)] gap-0",
        variant === "pills" && "gap-2",
        variant === "segment" &&
          "gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] p-1",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-40",

              // Underline variant
              variant === "underline" && [
                "px-4 py-2.5 border-b-2 -mb-px",
                isActive
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
              ],

              // Pills variant
              variant === "pills" && [
                "rounded-[var(--radius-full)] px-4 py-1.5",
                isActive
                  ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              ],

              // Segment variant
              variant === "segment" && [
                "flex-1 rounded-[var(--radius-sm)] px-3 py-1.5",
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              ]
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Tab Panel ────────────────────────────────────────────────────────────

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tabId: string;
  activeTab: string;
}

export function TabPanel({ tabId, activeTab, children, className, ...props }: TabPanelProps) {
  if (tabId !== activeTab) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={cn("focus:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
