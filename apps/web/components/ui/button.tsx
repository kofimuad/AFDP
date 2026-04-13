import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] border border-transparent",
  outline:
    "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
  ghost: "bg-transparent text-[var(--color-text-primary)] border border-transparent hover:bg-[var(--color-surface-hover)]"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => (
  <button
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
      variantClassMap[variant],
      className
    )}
    ref={ref}
    {...props}
  />
));

Button.displayName = "Button";