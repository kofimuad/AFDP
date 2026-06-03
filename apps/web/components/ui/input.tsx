import * as React from "react";

import { cn } from "@/lib/utils";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  /** Shows error ring + message below */
  error?: string;
  /** Icon rendered on the left side */
  iconLeft?: React.ReactNode;
  /** Icon or action rendered on the right side */
  iconRight?: React.ReactNode;
}

const sizeClass: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = "md", error, iconLeft, iconRight, ...props }, ref) => {
    const hasLeft = Boolean(iconLeft);
    const hasRight = Boolean(iconRight);

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {hasLeft && (
            <span className="pointer-events-none absolute left-3 flex shrink-0 items-center text-[var(--color-text-muted)]">
              {iconLeft}
            </span>
          )}
          <input
            className={cn(
              "flex w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-muted)]",
              "transition-colors focus:outline-none",
              error
                ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] focus:border-[var(--color-border-strong)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClass[inputSize],
              hasLeft && "pl-10",
              hasRight && "pr-10",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${props.id ?? "input"}-error` : undefined}
            {...props}
          />
          {hasRight && (
            <span className="absolute right-3 flex shrink-0 items-center text-[var(--color-text-muted)]">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p
            id={`${props.id ?? "input"}-error`}
            className="mt-1 text-xs text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ── Textarea ────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 py-3",
          "text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
          "transition-colors focus:outline-none resize-y",
          error
            ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
            : "border-[var(--color-border)] focus:border-[var(--color-border-strong)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">{error}</p>
      )}
    </div>
  )
);

Textarea.displayName = "Textarea";

// ── FormField wrapper ─────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ label, htmlFor, required, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--color-text-primary)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      )}
    </div>
  );
}

export { Input, Textarea, FormField };
