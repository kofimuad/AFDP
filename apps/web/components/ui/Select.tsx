import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, placeholder, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
          "pl-4 pr-10 text-sm text-[var(--color-text-primary)]",
          "transition-colors focus:outline-none",
          error
            ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20"
            : "border-[var(--color-border)] focus:border-[var(--color-border-strong)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // The placeholder option is styled via the value check
          !props.value && "text-[var(--color-text-muted)]",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
        <ChevronDown size={16} />
      </span>
      {error && (
        <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">{error}</p>
      )}
    </div>
  )
);

Select.displayName = "Select";
