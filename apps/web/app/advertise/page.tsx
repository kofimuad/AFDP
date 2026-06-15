import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FAQAccordion } from "@/components/advertise/FAQAccordion";
import { PlanComparison } from "@/components/advertise/PlanComparison";
import { PricingPlans } from "@/components/advertise/PricingPlans";

export const metadata = {
  title: "Grow with AFDP — Pricing & Plans",
  description:
    "Reach thousands of people searching for authentic African food near them. Start free, upgrade when you're ready."
};

const faqItems = [
  {
    question: "Is the Basic plan really free forever?",
    answer:
      "Yes. The Basic listing is permanently free. We only charge for Featured and Premium features that actively boost your visibility and analytics."
  },
  {
    question: "Can I cancel my plan at any time?",
    answer:
      "Absolutely. You can cancel or downgrade your Featured or Premium plan at any time from your dashboard. You keep the benefits until the end of your billing period, then revert to Basic."
  },
  {
    question: "How long does verification take?",
    answer:
      "Most listings are verified within 24 hours. Our team reviews your business details and may reach out to confirm your address and ownership before issuing the Verified badge."
  },
  {
    question: "What's the difference between Featured and Premium?",
    answer:
      "Featured gives you a badge, search priority, unlimited menu items, and analytics. Premium additionally includes homepage carousel placement, a custom brand profile page, a dedicated account manager, and multi-location support."
  },
  {
    question: "Can I pay annually and save?",
    answer:
      "Yes. Toggle the billing switch above to see annual pricing — it's 20% cheaper than paying month-by-month."
  }
];

export default function AdvertisePage() {
  return (
    <main className="pb-16">
      {/* Hero */}
      <section
        className="px-4 py-16 text-center text-white md:px-6 md:py-20"
        style={{ background: "linear-gradient(135deg,#1A0F08 0%,#2D1508 100%)" }}
      >
        <h1 className="display-font mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Grow your business with <span className="text-[#FF7A66]">AFDP</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
          Reach thousands of people searching for authentic African food near them. Start free, upgrade when you&rsquo;re ready.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto -mt-8 w-full max-w-6xl px-4 md:px-6">
        <PricingPlans />
      </section>

      {/* Comparison */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-6">
        <h2 className="display-font mb-8 text-center text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Compare plans
        </h2>
        <PlanComparison />
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-16 md:px-6">
        <h2 className="display-font mb-6 text-center text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <FAQAccordion items={faqItems} />
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div
          className="rounded-[var(--radius-xl)] px-6 py-14 text-center md:px-10"
          style={{ background: "linear-gradient(135deg,var(--color-primary) 0%,#D12B1F 100%)" }}
        >
          <h2 className="display-font text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Ready to reach more customers?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/80">
            Join the African food businesses already on AFDP. Start with the free Basic plan and upgrade whenever
            you&rsquo;re ready.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/vendors/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)]"
            >
              Register Free
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <a
              href="mailto:sales@afdp.io?subject=AFDP%20plans"
              className="inline-flex items-center rounded-full border-[1.5px] border-white/40 px-7 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
