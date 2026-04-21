"use client";

import { Home, Search, UtensilsCrossed, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/foods", label: "Browse", icon: UtensilsCrossed, match: (p: string) => p.startsWith("/foods") },
  { href: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") }
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
