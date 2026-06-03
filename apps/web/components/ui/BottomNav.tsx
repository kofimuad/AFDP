"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Badge count displayed on the icon */
  badge?: number;
  /** Match strategy: exact (default) or prefix */
  match?: "exact" | "prefix";
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 inset-x-0 z-40 md:hidden",
        "border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <ul className="flex h-16 items-stretch" role="list">
        {items.map((item) => {
          const isActive =
            item.match === "prefix"
              ? pathname.startsWith(item.href)
              : pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <span className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span
                      aria-label={`${item.badge} notifications`}
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-0.5 text-[10px] font-bold text-[var(--color-text-inverse)]"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--color-primary)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
