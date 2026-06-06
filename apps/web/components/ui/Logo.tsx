import { cn } from "@/lib/utils";

interface LogoProps {
  variant: "dark" | "light";
  /** Icon size in px (wordmark scales with it). Default 30. */
  size?: number;
  className?: string;
}

export function Logo({ variant, size = 30, className }: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Gradient square mark: stylized "A" + map-pin dot (discovery + Africa) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="afdpLogoGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF8A3D" />
            <stop offset="1" stopColor="#C05E18" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#afdpLogoGradient)" />
        <circle cx="16" cy="5.6" r="1.4" fill="white" />
        <path
          d="M16 8.4 L8.6 24 L12.3 24 L13.6 21 L18.4 21 L19.7 24 L23.4 24 L16 8.4 Z M14.6 18.4 L16 15.2 L17.4 18.4 Z"
          fill="white"
          fillRule="evenodd"
        />
      </svg>

      <span
        className={cn(
          "display-font font-extrabold tracking-tight leading-none",
          isLight ? "text-white" : "text-[var(--color-text-primary)]"
        )}
        style={{ fontSize: `${Math.round(size * 0.63)}px` }}
      >
        AFDP
      </span>
    </div>
  );
}
