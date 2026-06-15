import { ChefHat, ClipboardList, ShoppingBasket } from "lucide-react";

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const STEPS: ReadonlyArray<Step> = [
  {
    num: "1",
    title: "Pick a dish to make",
    desc: "Browse African dishes by country or region — Jollof Rice, Injera, Ndolé — and choose what you're cooking tonight.",
    icon: <ChefHat size={28} strokeWidth={2} />
  },
  {
    num: "2",
    title: "Get the recipe & shopping list",
    desc: "See prep and cook times plus the full ingredient list, so you know exactly what it takes to make it from scratch.",
    icon: <ClipboardList size={28} strokeWidth={2} />
  },
  {
    num: "3",
    title: "Grab the ingredients nearby",
    desc: "Find African grocery stores near you that stock each ingredient — or order the dish from a local spot if you'd rather not cook.",
    icon: <ShoppingBasket size={28} strokeWidth={2} />
  }
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          From craving to cooking.
        </h2>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Three steps to making an authentic African meal at home.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.num}
            className="flex flex-row items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:flex-col"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] font-extrabold text-[var(--color-primary)]">
              {step.num}
            </span>
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_4px_14px_rgba(242,59,47,.28)]"
              style={{ background: "linear-gradient(135deg,var(--color-primary) 0%,#D12B1F 100%)" }}
              aria-hidden="true"
            >
              {step.icon}
            </div>
            <div>
              <h3 className="display-font text-lg font-bold text-[var(--color-text-primary)]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {step.desc}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
