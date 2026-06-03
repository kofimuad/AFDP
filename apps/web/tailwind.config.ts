import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "color-bg":             "var(--color-bg)",
        "color-surface":        "var(--color-surface)",
        "color-surface-hover":  "var(--color-surface-hover)",
        "color-surface-raised": "var(--color-surface-raised)",
        "color-dark":           "var(--color-dark)",
        "color-primary":        "var(--color-primary)",
        "color-primary-hover":  "var(--color-primary-hover)",
        "color-primary-light":  "var(--color-primary-light)",
        "color-restaurant":     "var(--color-restaurant)",
        "color-grocery":        "var(--color-grocery)",
        "color-grocery-light":  "var(--color-grocery-light)",
        "color-success":        "var(--color-success)",
        "color-success-light":  "var(--color-success-light)",
        "color-warning":        "var(--color-warning)",
        "color-warning-light":  "var(--color-warning-light)",
        "color-error":          "var(--color-error)",
        "color-error-light":    "var(--color-error-light)",
        "color-info":           "var(--color-info)",
        "color-info-light":     "var(--color-info-light)",
        "color-text-primary":   "var(--color-text-primary)",
        "color-text-secondary": "var(--color-text-secondary)",
        "color-text-muted":     "var(--color-text-muted)",
        "color-text-inverse":   "var(--color-text-inverse)",
        "color-border":         "var(--color-border)",
        "color-border-strong":  "var(--color-border-strong)"
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "Consolas", "monospace"]
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)"
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)"
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)"
      }
    }
  },
  plugins: []
};

export default config;
