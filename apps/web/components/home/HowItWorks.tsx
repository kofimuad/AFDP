import { MapPin, Search, Utensils } from "lucide-react";

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const STEPS: ReadonlyArray<Step> = [
  {
    num: "1",
    title: "Search a dish or cuisine",
    desc: "Type in a dish you're craving — Jollof Rice, Injera, Ndolé — or browse by country, region, or ingredient.",
    icon: <Search size={28} strokeWidth={2} />
  },
  {
    num: "2",
    title: "Discover nearby vendors",
    desc: "See restaurants and grocery stores near you on an interactive map. Filter by type, distance, or opening hours.",
    icon: <MapPin size={28} strokeWidth={2} />
  },
  {
    num: "3",
    title: "Go get your food",
    desc: "Get directions, browse the menu, save your favourites, and share your finds with the community.",
    icon: <Utensils size={28} strokeWidth={2} />
  }
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="display-font text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Simple as that.
        </h2>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Three steps to your next authentic African meal.
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
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_4px_14px_rgba(224,112,32,.28)]"
              style={{ background: "linear-gradient(135deg,var(--color-primary) 0%,#B85518 100%)" }}
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
