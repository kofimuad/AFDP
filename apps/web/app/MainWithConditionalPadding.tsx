"use client";

export function MainWithConditionalPadding({ children }: { children: React.ReactNode }) {
  // Top padding clears the fixed 64px NavBar on every page (the bar is now
  // opaque everywhere). Bottom padding on mobile clears the fixed bottom tab
  // bar; on md+ the tab bar is hidden so no padding is needed.
  return <main className="flex flex-1 flex-col pt-16 pb-16 md:pb-0">{children}</main>;
}
