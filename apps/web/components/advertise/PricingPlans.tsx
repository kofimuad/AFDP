"use client";

import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { useAuthStore } from "@/lib/store/authStore";
import { useHasHydrated } from "@/lib/store/useHasHydrated";
import { PLANS, formatPlanPrice, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Cta {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * Auth/role-aware CTA — this is how plans link to the vendor account.
 * - guest: free → register, paid → sign in first
 * - food-lover (user): become a vendor first
 * - vendor/admin: manage (free) or contact sales to upgrade (paid; Stripe later)
 */
function ctaForPlan(plan: Plan, role: string | null, hasVendor: boolean): Cta {
  const isFree = plan.monthly === 0;

  if (!role) {
    return isFree
      ? { label: "Get Started Free", href: "/vendors/register" }
      : { label: `Start ${plan.name}`, href: "/auth" };
  }

  if (hasVendor) {
    return isFree
      ? { label: "Manage listing", href: "/dashboard" }
      : {
          label: "Contact sales",
          href: `mailto:sales@afdp.io?subject=${encodeURIComponent(`Upgrade to ${plan.name} plan`)}`,
          external: true
        };
  }

  // Authenticated, but not a vendor yet.
  return { label: "List Your Business", href: "/vendors/register" };
}

function PlanCta({ cta, dark }: { cta: Cta; dark?: boolean }) {
  const base = cn(
    "mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
    dark
      ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
      : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
  );

  if (cta.external) {
    return (
      <a href={cta.href} className={base}>
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href as Route} className={base}>
      {cta.label}
      <ArrowRight size={15} strokeWidth={2.5} />
    </Link>
  );
}

export function PricingPlans() {
  const [annual, setAnnual] = useState(false);
  const hydrated = useHasHydrated();
  const user = useAuthStore((s) => s.user);

  const role = hydrated ? user?.role ?? null : null;
  const hasVendor = hydrated ? Boolean(user?.vendor_id) : false;

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !annual ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
          onClick={() => setAnnual((a) => !a)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            annual ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
              annual ? "left-[1.4rem]" : "left-0.5"
            )}
          />
        </button>
        <span className={cn("text-sm font-medium", annual ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")}>
          Annual
        </span>
        <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
          Save 20%
        </span>
      </div>

      {/* Cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const { amount, cadence } = formatPlanPrice(plan, annual);
          const cta = ctaForPlan(plan, role, hasVendor);

          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-xl)] border p-7 transition",
                plan.dark
                  ? "border-transparent bg-[var(--color-dark)] text-[var(--color-text-inverse)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
                plan.popular
                  ? "border-2 border-[var(--color-primary)] shadow-[var(--shadow-lg)] lg:-translate-y-2"
                  : !plan.dark && "border-[var(--color-border)] shadow-[var(--shadow-sm)]"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-primary)] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </span>
              )}

              <p className={cn("text-xs font-bold uppercase tracking-wider", plan.dark ? "text-[#F0845A]" : "text-[var(--color-primary)]")}>
                {plan.name}
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="display-font text-4xl font-extrabold tracking-tight">{amount}</span>
              </div>
              <p className={cn("mt-1 text-sm", plan.dark ? "text-white/60" : "text-[var(--color-text-muted)]")}>{cadence}</p>
              <p className={cn("mt-3 text-sm leading-relaxed", plan.dark ? "text-white/75" : "text-[var(--color-text-muted)]")}>
                {plan.tagline}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                        f.included
                          ? plan.dark
                            ? "bg-[#F0845A]/20 text-[#F0845A]"
                            : "bg-[var(--color-success-light)] text-[var(--color-success)]"
                          : plan.dark
                          ? "bg-white/10 text-white/40"
                          : "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      )}
                    >
                      {f.included ? <Check size={11} strokeWidth={3} /> : <Minus size={11} strokeWidth={3} />}
                    </span>
                    <span className={cn(!f.included && (plan.dark ? "text-white/50" : "text-[var(--color-text-muted)]"))}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <PlanCta cta={cta} dark={plan.dark} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
