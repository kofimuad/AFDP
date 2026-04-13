import { cn } from "@/lib/utils";

interface LogoProps {
  variant: "dark" | "light";
  className?: string;
}

export function Logo({ variant, className }: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <ellipse cx="18" cy="18" rx="10" ry="3.2" stroke="#C8522A" strokeWidth="2" />
        <path d="M8 18.5C8.8 24 12.4 28 18 28C23.6 28 27.2 24 28 18.5" stroke="#C8522A" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 8.5C13.2 9.8 13 11.1 14 12.6C15 14.1 14.8 15.2 14 16.4" stroke="#C8522A" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 7.8C21.2 9 21 10.3 22 11.7C23 13 22.8 14.2 22 15.4" stroke="#C8522A" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "display-font text-xl font-bold",
            isLight ? "text-white" : "text-[var(--color-text-primary)]"
          )}
        >
          AFDP
        </span>
        <span
          className={cn(
            "hidden text-[0.55rem] font-medium uppercase md:block",
            isLight ? "text-white/50" : "text-[var(--color-text-muted)]"
          )}
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-body)" }}
        >
          African Food Discovery
        </span>
      </div>
    </div>
  );
}

// FLUTTER NOTE:
// This component maps to: Row with custom painted icon + two text styles
// Design tokens used: --font-display, --font-body, --color-text-primary, --color-text-muted
// State management equivalent: Stateless widget
// API call: None