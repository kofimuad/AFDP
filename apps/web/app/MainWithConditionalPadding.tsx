"use client";
import { usePathname } from "next/navigation";

export function MainWithConditionalPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only homepage gets no top-padding (full-bleed hero behind fixed NavBar)
  const noPadding = pathname === "/";
  return (
    <main className={`flex-1 flex flex-col${noPadding ? "" : " pt-16"}`}>{children}</main>
  );
}
