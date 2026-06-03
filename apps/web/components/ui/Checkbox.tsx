"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// ── Checkbox ─────────────────────────────────────────────────────────────
// Uses CSS :has() via Tailwind's group-has-[:checked] for reliable checked styling.

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const uid = React.useId();
    const inputId = id ?? uid;

    return (
      <div className={cn("flex items-start gap-3", className)}>
        {/* Visual checkbox — styled via group-has-[:checked] */}
        <label
          htmlFor={inputId}
          className={cn(
            "group/cb mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center",
            "rounded-[var(--radius-sm)] border-2 transition-colors",
            error
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border)] group-has-[input:checked]/cb:border-[var(--color-primary)] group-has-[input:checked]/cb:bg-[var(--color-primary)]",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-primary)] has-[:focus-visible]:ring-offset-1",
            "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          )}
        >
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className="sr-only"
            aria-invalid={error ? "true" : undefined}
            {...props}
          />
          <Check
            size={12}
            strokeWidth={3}
            className="hidden text-white group-has-[input:checked]/cb:block"
            aria-hidden="true"
          />
        </label>

        {/* Label text */}
        <div className="flex-1 pt-0.5">
          <label
            htmlFor={inputId}
            className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>
          )}
          {error && (
            <p className="mt-0.5 text-xs text-[var(--color-error)]" role="alert">{error}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

// ── Radio Group ──────────────────────────────────────────────────────────

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  direction?: "vertical" | "horizontal";
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  direction = "vertical",
  className
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </legend>
      )}
      <div className={cn("flex", direction === "vertical" ? "flex-col gap-2" : "flex-row flex-wrap gap-3")}>
        {options.map((option) => {
          const inputId = `${name}-${option.value}`;
          const isChecked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 transition-colors",
                isChecked
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]",
                option.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="mt-0.5 flex shrink-0 h-4 w-4 items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: isChecked ? "var(--color-primary)" : "var(--color-border)"
                }}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={option.disabled}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {isChecked && (
                  <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{option.label}</p>
                {option.description && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{option.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">{error}</p>
      )}
    </fieldset>
  );
}
