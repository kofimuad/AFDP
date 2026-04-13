"use client";
import { usePathname } from "next/navigation";

export function MainWithConditionalPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only add pt-16 if not on homepage top
  const needsPadding = pathname !== "/";
  return (
    <main className={`flex-1 flex flex-col${needsPadding ? " pt-16" : ""}`}>{children}</main>
  );
}
