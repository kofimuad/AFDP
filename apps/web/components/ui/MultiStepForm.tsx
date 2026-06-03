"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

// ── Types ────────────────────────────────────────────────────────────────

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface MultiStepFormContextValue {
  steps: Step[];
  currentIndex: number;
  goNext: () => void;
  goBack: () => void;
  goTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: Step;
}

const MultiStepFormContext = React.createContext<MultiStepFormContextValue | null>(null);

export function useMultiStepForm() {
  const ctx = React.useContext(MultiStepFormContext);
  if (!ctx) throw new Error("useMultiStepForm must be used inside MultiStepForm");
  return ctx;
}

// ── Root ─────────────────────────────────────────────────────────────────

interface MultiStepFormProps {
  steps: Step[];
  onComplete: () => void;
  className?: string;
  children: React.ReactNode;
}

export function MultiStepForm({ steps, onComplete, className, children }: MultiStepFormProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const goNext = React.useCallback(() => {
    setCurrentIndex((i) => {
      if (i >= steps.length - 1) { onComplete(); return i; }
      return i + 1;
    });
  }, [steps.length, onComplete]);

  const goBack = React.useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goTo = React.useCallback((index: number) => {
    if (index >= 0 && index < steps.length) setCurrentIndex(index);
  }, [steps.length]);

  const value: MultiStepFormContextValue = {
    steps,
    currentIndex,
    goNext,
    goBack,
    goTo,
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
    currentStep: steps[currentIndex]
  };

  return (
    <MultiStepFormContext.Provider value={value}>
      <div className={cn("flex flex-col gap-6", className)}>{children}</div>
    </MultiStepFormContext.Provider>
  );
}

// ── Step Indicator ───────────────────────────────────────────────────────

interface StepIndicatorProps {
  className?: string;
}

export function StepIndicator({ className }: StepIndicatorProps) {
  const { steps, currentIndex, goTo } = useMultiStepForm();

  return (
    <nav aria-label="Form progress" className={cn("w-full", className)}>
      <ol className="flex items-center" role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isClickable = index < currentIndex;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => isClickable && goTo(index)}
                disabled={!isClickable && !isActive}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? " (completed)" : ""}`}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 focus:outline-none",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                      : isActive
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  )}
                >
                  {isCompleted ? <Check size={16} /> : <span>{index + 1}</span>}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isActive
                      ? "text-[var(--color-primary)]"
                      : isCompleted
                      ? "text-[var(--color-text-muted)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {step.title}
                </span>
              </button>

              {/* Connector line (between steps) */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    isCompleted
                      ? "bg-[var(--color-primary)]"
                      : "bg-[var(--color-border)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Step Content ─────────────────────────────────────────────────────────

interface StepContentProps {
  stepIndex: number;
  children: React.ReactNode;
  className?: string;
}

export function StepContent({ stepIndex, children, className }: StepContentProps) {
  const { currentIndex } = useMultiStepForm();
  if (stepIndex !== currentIndex) return null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Step Navigation ───────────────────────────────────────────────────────

interface StepNavProps {
  /** Override the "Next" label */
  nextLabel?: string;
  /** Override the "Submit" label (last step) */
  submitLabel?: string;
  /** Called when Next is clicked — return false to prevent advancing */
  onNext?: () => boolean | Promise<boolean>;
  /** Loading state for the next/submit button */
  loading?: boolean;
  className?: string;
}

export function StepNav({
  nextLabel = "Continue",
  submitLabel = "Submit",
  onNext,
  loading,
  className
}: StepNavProps) {
  const { goNext, goBack, isFirst, isLast } = useMultiStepForm();

  const handleNext = async () => {
    if (onNext) {
      const ok = await onNext();
      if (!ok) return;
    }
    goNext();
  };

  return (
    <div className={cn("flex items-center justify-between pt-2", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={goBack}
        disabled={isFirst}
        className={cn(isFirst && "invisible")}
      >
        Back
      </Button>
      <Button
        type={isLast ? "submit" : "button"}
        variant="primary"
        loading={loading}
        onClick={isLast ? undefined : handleNext}
      >
        {isLast ? submitLabel : nextLabel}
      </Button>
    </div>
  );
}
