import { Check, X } from "lucide-react";
import Link from "next/link";

import { FAQAccordion } from "@/components/advertise/FAQAccordion";

const faqItems = [
  {
    question: "How does featured placement work?",
    answer:
      "Featured businesses appear at the top of search results and are highlighted with a special badge on the map, making them more visible to users searching for African food nearby."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. All paid plans are month-to-month with no contracts. You can cancel or downgrade at any time from your dashboard."
  },
  {
    question: "How do I get verified?",
    answer:
      "After registering your business, our team reviews your listing within 48 hours. Verified businesses get a checkmark badge and higher trust with users."
  }
];

export default function AdvertisePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 md:px-6">
      <section className="rounded-[var(--radius-xl)] bg-[var(--color-primary)] px-6 pb-12 pt-20 text-[var(--color-text-inverse)]">
        <h1 className="display-font text-4xl md:text-5xl">Reach Thousands of African Food Lovers</h1>
        <p className="mt-3 max-w-3xl text-sm md:text-base">
          Promote your business to diaspora communities actively searching for African food
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] dark:bg-[var(--color-surface)]">
          <p className="display-font text-2xl text-[var(--color-text-primary)]">Basic</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">$0/month</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
            <li className="flex items-center gap-2">
              <Check size={14} /> Basic listing on the map
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Business name and address
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Up to 5 menu items
            </li>
            <li className="flex items-center gap-2">
              <X size={14} /> Featured placement
            </li>
            <li className="flex items-center gap-2">
              <X size={14} /> Analytics dashboard
            </li>
            <li className="flex items-center gap-2">
              <X size={14} /> Priority search ranking
            </li>
          </ul>
          <Link href="/vendors/register" className="mt-6 inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">
            Get Started Free
          </Link>
        </article>

        <article className="relative rounded-[var(--radius-xl)] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] dark:bg-[var(--color-surface)]">
          <span className="absolute -top-3 left-4 rounded-[var(--radius-full)] bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-inverse)]">
            Most Popular
          </span>
          <p className="display-font text-2xl text-[var(--color-text-primary)]">Featured</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">$29/month</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
            <li className="flex items-center gap-2">
              <Check size={14} /> Everything in Basic
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Featured badge on listing
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Priority placement in search
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Up to 20 menu items
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} /> Basic analytics
            </li>
            <li className="flex items-center gap-2">
              <X size={14} /> Custom promotional banners
            </li>
          </ul>
          <Link
            href="/vendors/register"
            className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)]"
          >
            Start Featured
          </Link>
        </article>

        <article className="rounded-[var(--radius-xl)] border border-transparent bg-[#0F0E0D] p-6 text-white shadow-[var(--shadow-md)] dark:border dark:border-white/20 dark:bg-[#1A1917]">
          <p className="display-font text-2xl text-white">Premium</p>
          <p className="mt-1 text-3xl font-semibold text-white">$79/month</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Everything in Featured
            </li>
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Custom promotional banners
            </li>
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Full analytics dashboard
            </li>
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Unlimited menu items
            </li>
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Homepage featured section placement
            </li>
            <li className="flex items-center gap-2 text-white">
              <Check size={14} /> Dedicated support
            </li>
          </ul>
          <Link href="/vendors/register" className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
            Go Premium
          </Link>
        </article>
      </section>

      <section className="mt-10">
        <h2 className="display-font text-3xl text-[var(--color-text-primary)]">Frequently Asked Questions</h2>
        <FAQAccordion items={faqItems} />
      </section>
    </main>
  );
}