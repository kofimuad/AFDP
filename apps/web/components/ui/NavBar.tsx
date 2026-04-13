"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!isMobileOpen) return;
      const target = event.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target);
      const clickedToggleButton = buttonRef.current?.contains(target);

      if (!clickedInsideMenu && !clickedToggleButton) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isMobileOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const isHomeTop = pathname === "/" && !scrolled;

  const navClassName = useMemo(
    () =>
      cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isHomeTop
          ? "bg-transparent"
          : "border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-sm)] backdrop-blur"
      ),
    [isHomeTop]
  );

  return (
    <>
      <header className={navClassName}>
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="AFDP home">
            <Logo variant={isHomeTop ? "light" : "dark"} />
          </Link>

          <div className="hidden items-center gap-2 md:flex md:gap-3">
            <Link
              href="/auth"
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                isHomeTop ? "text-[var(--color-text-inverse)] hover:bg-white/10" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              )}
            >
              Sign In
            </Link>

            <ThemeToggle />

            {user ? (
              <Link
                href="/dashboard"
                className={cn(
                  "rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                  isHomeTop ? "text-[var(--color-text-inverse)] hover:bg-white/10" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                )}
              >
                Dashboard
              </Link>
            ) : null}

            <Link
              href="/vendors/register"
              className={cn(
                "rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm font-semibold transition",
                isHomeTop
                  ? "border-white text-white hover:bg-white/20"
                  : "border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
              )}
            >
              List Your Business
            </Link>
          </div>

          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className={cn(
              "flex rounded-[var(--radius-md)] p-2 transition md:hidden",
              isHomeTop
                ? "bg-white/10 text-[var(--color-text-inverse)] hover:bg-white/20"
                : "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]"
            )}
            aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {isMobileOpen ? (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-0 right-0 top-16 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-lg)] md:hidden"
          >
            <div className="space-y-2">
              <Link
                href="/auth"
                onClick={() => setIsMobileOpen(false)}
                className="block w-full rounded-[var(--radius-lg)] px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              >
                Sign In
              </Link>

              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="block w-full rounded-[var(--radius-lg)] px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                >
                  Dashboard
                </Link>
              ) : null}

              <Link
                href="/vendors/register"
                onClick={() => setIsMobileOpen(false)}
                className="block w-full rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-3 text-center font-medium text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]"
              >
                List Your Business
              </Link>

              <div className="my-2 border-t border-[var(--color-border)]" />

              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-[var(--color-text-muted)]">Dark Mode</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

// FLUTTER NOTE:
// This component maps to: AppBar with scroll-aware background + actions
// Design tokens used: --color-border, --color-surface, --shadow-sm, --shadow-lg, --radius-md, --radius-lg, --color-text-inverse, --color-text-primary, --color-surface-hover, --color-primary, --color-primary-light, --color-bg
// State management equivalent: ScrollController + stateful app bar mode
// API call: None