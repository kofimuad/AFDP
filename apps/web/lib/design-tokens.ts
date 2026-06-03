export const tokens = {
  colors: {
    bg:             "#FAFAF8",
    surface:        "#FFFFFF",
    surfaceHover:   "#F5F2EE",
    dark:           "#0F0E0D",
    darkSecondary:  "#2A2622",
    primary:        "#E07020",
    primaryHover:   "#C05E18",
    primaryLight:   "#FEF3E8",
    restaurant:     "#E07020",
    grocery:        "#2A7A4B",
    groceryLight:   "#E0F0E8",
    success:        "#2A7A4B",
    successLight:   "#E0F0E8",
    warning:        "#D97706",
    warningLight:   "#FEF3C7",
    error:          "#DC2626",
    errorLight:     "#FEE2E2",
    info:           "#2563EB",
    infoLight:      "#DBEAFE",
    textPrimary:    "#0F0E0D",
    textSecondary:  "#4A4540",
    textMuted:      "#6B6560",
    textInverse:    "#FAFAF8",
    border:         "#E8E4DF",
    borderStrong:   "#D0CAC3"
  },
  shadows: {
    sm: "0 1px 3px rgba(15,14,13,0.08)",
    md: "0 4px 16px rgba(15,14,13,0.10)",
    lg: "0 8px 32px rgba(15,14,13,0.14)",
    xl: "0 16px 48px rgba(15,14,13,0.18)"
  },
  spacing: {
    1:  "4px",
    2:  "8px",
    3:  "12px",
    4:  "16px",
    6:  "24px",
    8:  "32px",
    12: "48px",
    16: "64px"
  },
  radius: {
    sm:   "8px",
    md:   "12px",
    lg:   "16px",
    xl:   "24px",
    full: "9999px"
  },
  motion: {
    durationFast: "100ms",
    durationBase: "200ms",
    durationSlow: "350ms",
    easeInOut:    "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut:      "cubic-bezier(0, 0, 0.2, 1)",
    easeSpring:   "cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  typography: {
    display: "var(--font-sans), system-ui, sans-serif",
    body:    "var(--font-sans), system-ui, sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
  }
} as const;

export type DesignTokens = typeof tokens;
