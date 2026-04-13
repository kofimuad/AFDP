"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAssetUrl, logoutUser } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { cn } from "@/lib/utils";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = !!accessToken && !!user;
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (isMobileOpen) {
        const clickedInsideMenu = menuRef.current?.contains(target);
        const clickedToggleButton = buttonRef.current?.contains(target);
        if (!clickedInsideMenu && !clickedToggleButton) {
          setIsMobileOpen(false);
        }
      }

      if (dropdownOpen) {
        if (dropdownRef.current && !dropdownRef.current.contains(target)) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isMobileOpen, dropdownOpen]);

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

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {
      // Best-effort; clear local state regardless.
    }
    clearAuth();
    setDropdownOpen(false);
    setIsMobileOpen(false);
    router.push("/");
  };

  const closeMenus = () => {
    setDropdownOpen(false);
    setIsMobileOpen(false);
  };

  const avatarInitials = useMemo(() => {
    if (!user?.full_name) return "?";
    const parts = user.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || first.toUpperCase() || "?";
  }, [user?.full_name]);

  return (
    <>
      <header className={navClassName}>
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="AFDP home">
            <Logo variant={isHomeTop ? "light" : "dark"} />
          </Link>

          <div className="hidden items-center gap-2 md:flex md:gap-3">
            {!hasHydrated ? (
              <div className="h-8 w-24" aria-hidden />
            ) : (
              <>
                {!isAuthenticated && (
                  <Link
                    href="/auth"
                    className={cn(
                      "rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                      isHomeTop
                        ? "text-[var(--color-text-inverse)] hover:bg-white/10"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    )}
                  >
                    Sign In
                  </Link>
                )}

                <ThemeToggle />

                {isAuthenticated && user && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-md)] p-1 transition hover:bg-[var(--color-surface-hover)] focus:outline-none"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      aria-haspopup="menu"
                      aria-expanded={dropdownOpen}
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                        {user.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getAssetUrl(user.profile_image_url) ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          avatarInitials
                        )}
                      </span>
                      {(isVendor || isAdmin) && (
                        <span
                          className={cn(
                            "ml-1 text-sm font-semibold",
                            isHomeTop ? "text-white" : "text-[var(--color-text-primary)]"
                          )}
                        >
                          Dashboard
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 z-20 mt-2 min-w-[180px] origin-top-right rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 shadow-[var(--shadow-lg)]"
                        >
                          <Link
                            href="/profile"
                            onClick={closeMenus}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          {(isVendor || isAdmin) && (
                            <Link
                              href={isAdmin ? "/admin" : "/dashboard"}
                              onClick={closeMenus}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                            >
                              <User size={16} />
                              Dashboard
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Hide 'List Your Business' if user already has a vendor listing */}
                {(!user?.vendor_id) && (
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
                )}
              </>
            )}
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
              {hasHydrated && !isAuthenticated && (
                <Link
                  href="/auth"
                  onClick={() => setIsMobileOpen(false)}
                  className="block w-full rounded-[var(--radius-lg)] px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                >
                  Sign In
                </Link>
              )}

              {hasHydrated && isAuthenticated && user && (
                <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                      {user.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAssetUrl(user.profile_image_url) ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarInitials
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/profile"
                      onClick={closeMenus}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    {(isVendor || isAdmin) && (
                      <Link
                        href={isAdmin ? "/admin" : "/dashboard"}
                        onClick={closeMenus}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                      >
                        <User size={16} />
                        Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

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
