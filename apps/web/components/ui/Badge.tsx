import { cn } from "@/lib/utils";

type BadgeVariant = "restaurant" | "grocery" | "verified" | "featured";

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const styleByVariant: Record<BadgeVariant, string> = {
  restaurant: "bg-[var(--color-primary-light)] text-[var(--color-restaurant)]",
  grocery: "bg-[var(--color-grocery-light)] text-[var(--color-grocery)]",
  verified: "bg-[var(--color-surface-hover)] text-[var(--color-dark-secondary)]",
  featured: "bg-[var(--color-dark)] text-[var(--color-text-inverse)]"
};

const labelByVariant: Record<BadgeVariant, string> = {
  restaurant: "Restaurant",
  grocery: "Grocery",
  verified: "Verified",
  featured: "Featured"
};

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-xs font-semibold",
        styleByVariant[variant],
        className
      )}
    >
      {labelByVariant[variant]}
    </span>
  );
}

// FLUTTER NOTE:
// This component maps to: Chip / Container with text style
// Design tokens used: --color-primary-light, --color-restaurant, --color-grocery-light, --color-grocery, --color-surface-hover, --color-dark-secondary, --color-dark, --color-text-inverse, --radius-full
// State management equivalent: Stateless widget
// API call: None