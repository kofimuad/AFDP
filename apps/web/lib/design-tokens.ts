export const tokens = {
  colors: {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    surfaceHover: "#F5F2EE",
    dark: "#0F0E0D",
    darkSecondary: "#2A2622",
    primary: "#C8522A",
    primaryHover: "#A8401E",
    primaryLight: "#F5E6DF",
    restaurant: "#C8522A",
    grocery: "#2A7A4B",
    groceryLight: "#E0F0E8",
    textPrimary: "#0F0E0D",
    textMuted: "#6B6560",
    textInverse: "#FAFAF8",
    border: "#E8E4DF",
    borderStrong: "#D0CAC3"
  },
  shadows: {
    sm: "0 1px 3px rgba(15,14,13,0.08)",
    md: "0 4px 16px rgba(15,14,13,0.10)",
    lg: "0 8px 32px rgba(15,14,13,0.14)"
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    6: "24px",
    8: "32px",
    12: "48px",
    16: "64px"
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    full: "9999px"
  },
  typography: {
    display: "'Fraunces', Georgia, serif",
    body: "'Inter', system-ui, sans-serif"
  }
} as const;

export type DesignTokens = typeof tokens;