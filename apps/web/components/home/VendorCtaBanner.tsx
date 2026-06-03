import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function VendorCtaBanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <div
        className="relative grid items-center gap-8 overflow-hidden rounded-[var(--radius-lg)] p-8 md:grid-cols-[1fr_auto] md:p-12"
        style={{ background: "linear-gradient(135deg,var(--color-primary) 0%,#C05E18 100%)" }}
      >
        {/* Decorative circles */}
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/[.06]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-20 right-16 h-52 w-52 rounded-full bg-white/[.04]"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
            For vendors
          </p>
          <h2 className="display-font mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Own a restaurant or shop?
          </h2>
          <p className="mt-3 max-w-md text-base text-white/75">
            Add your business and reach hungry customers near you.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-3 md:items-end">
          <Link
            href="/vendors/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)]"
          >
            Get Listed
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link
            href="/advertise"
            className="inline-flex items-center rounded-full border-[1.5px] border-white/30 bg-transparent px-7 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            View pricing plans
          </Link>
        </div>
      </div>
    </section>
  );
}
