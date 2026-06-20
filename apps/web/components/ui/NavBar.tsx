"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, LayoutDashboard, Lightbulb, LogOut, Search, ShoppingBasket, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { getAssetUrl, logoutUser } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = !!accessToken && !!user;
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {
      // Best-effort; clear local state regardless.
    }
    clearAuth();
    usePreferencesStore.getState().clearPreferredLocation();
    setDropdownOpen(false);
    router.push("/");
  };

  const onNavSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = navQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const avatarInitials = useMemo(() => {
    if (!user?.full_name) return "?";
    const parts = user.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || first.toUpperCase() || "?";
  }, [user?.full_name]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href="/" aria-label="AFDP home" className="shrink-0">
          <Logo variant="dark" />
        </Link>

        {/* Desktop search pill */}
        <form
          onSubmit={onNavSearch}
          role="search"
          className="hidden flex-1 md:flex md:max-w-md"
        >
          <div className="flex w-full items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 transition focus-within:border-[var(--color-primary)]">
            <Search size={16} className="shrink-0 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search dishes, restaurants…"
              aria-label="Search"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* Cook it yourself — recipe catalog entry point (desktop) */}
          <Link
            href="/foods"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] md:inline-flex"
          >
            <ChefHat size={16} />
            Cook it yourself
          </Link>

          {!hasHydrated ? (
            <div className="h-9 w-20" aria-hidden />
          ) : (
            <>
              {/* List Your Business — desktop only, hidden once a listing exists */}
              {!user?.vendor_id && (
                <Link
                  href="/vendors/register"
                  className="hidden rounded-full border-[1.5px] border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)] md:inline-flex"
                >
                  List Your Business
                </Link>
              )}

              <ThemeToggle />

              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
                >
                  Sign In
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[var(--color-surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                  >
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary)]">
                      {user?.profile_image_url ? (
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
                      <span className="ml-1 hidden text-sm font-semibold text-[var(--color-text-primary)] sm:inline">
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
                        className="absolute right-0 z-20 mt-2 min-w-[190px] origin-top-right rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 shadow-[var(--shadow-lg)]"
                      >
                        <p className="border-b border-[var(--color-border)] px-4 pb-2 text-xs text-[var(--color-text-muted)]">
                          {user?.email}
                        </p>
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                        >
                          <User size={16} />
                          My Profile
                        </Link>
                        <Link
                          href="/shopping-list"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                        >
                          <ShoppingBasket size={16} />
                          Shopping list
                        </Link>
                        <Link
                          href="/recommend"
                          onClick={() => setDropdownOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                        >
                          <Lightbulb size={16} />
                          Recommend a dish
                        </Link>
                        {(isVendor || isAdmin) && (
                          <Link
                            href={isAdmin ? "/admin" : "/dashboard"}
                            onClick={() => setDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          >
                            <LayoutDashboard size={16} />
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
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
