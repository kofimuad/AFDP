import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Page Not Found | AFDP",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-dark)] px-4 py-16 text-[var(--color-text-inverse)]">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo variant="light" />
        </div>
        <p className="mb-2 text-sm uppercase tracking-widest text-white/40">404</p>
        <h1 className="display-font mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-8 text-white/60">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Go Home
          </Link>
          <Link
            href="/search"
            className="inline-block rounded-[var(--radius-md)] border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Search for Food
          </Link>
        </div>
      </div>
    </main>
  );
}
