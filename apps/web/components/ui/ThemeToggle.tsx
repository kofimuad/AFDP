"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => {
    if (!mounted) return false;
    const activeTheme = theme === "system" ? resolvedTheme : theme;
    return activeTheme === "dark";
  }, [mounted, resolvedTheme, theme]);

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-full bg-[var(--color-surface-hover)] p-2 text-[var(--color-text-muted)]"
        aria-label="Toggle theme"
        suppressHydrationWarning
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full bg-[var(--color-surface-hover)] p-2 text-[var(--color-text-primary)] transition hover:bg-[var(--color-border)]"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
