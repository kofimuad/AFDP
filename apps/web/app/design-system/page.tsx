import { ThemeToggle } from "@/components/ui/ThemeToggle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="display-font mb-6 text-2xl font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, value, bg, textClass = "text-[var(--color-text-primary)]" }: {
  name: string;
  value: string;
  bg: string;
  textClass?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-[var(--radius-md)]"
        style={{ background: bg }}
      />
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
      <p className="mono-font text-xs text-[var(--color-text-muted)]">{value}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="display-font text-4xl font-bold text-[var(--color-text-primary)]">Design System</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">AFDP token & theme reference</p>
        </div>
        <ThemeToggle />
      </div>

      {/* ── Primary Palette ── */}
      <Section title="Primary Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <Swatch name="Primary" value="#E07020" bg="#E07020" />
          <Swatch name="Primary Hover" value="#C05E18" bg="#C05E18" />
          <Swatch name="Primary Light" value="#FEF3E8" bg="#FEF3E8" />
          <Swatch name="Grocery" value="#2A7A4B" bg="#2A7A4B" />
          <Swatch name="Grocery Light" value="#E0F0E8" bg="#E0F0E8" />
        </div>
      </Section>

      {/* ── Surface Scale ── */}
      <Section title="Surface Scale">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <Swatch name="Background" value="--color-bg" bg="var(--color-bg)" />
          <Swatch name="Surface" value="--color-surface" bg="var(--color-surface)" />
          <Swatch name="Surface Hover" value="--color-surface-hover" bg="var(--color-surface-hover)" />
          <Swatch name="Dark" value="--color-dark" bg="var(--color-dark)" />
          <Swatch name="Dark Secondary" value="--color-dark-secondary" bg="var(--color-dark-secondary)" />
        </div>
      </Section>

      {/* ── Text Scale ── */}
      <Section title="Text Scale">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="Text Primary" value="--color-text-primary" bg="var(--color-text-primary)" />
          <Swatch name="Text Secondary" value="--color-text-secondary" bg="var(--color-text-secondary)" />
          <Swatch name="Text Muted" value="--color-text-muted" bg="var(--color-text-muted)" />
          <Swatch name="Text Inverse" value="--color-text-inverse" bg="var(--color-text-inverse)" />
        </div>
      </Section>

      {/* ── Status Colors ── */}
      <Section title="Status Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success-light)] px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-success)]" />
              <span className="text-sm font-medium text-[var(--color-success)]">Success</span>
            </div>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">#2A7A4B</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-light)] px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-warning)]" />
              <span className="text-sm font-medium text-[var(--color-warning)]">Warning</span>
            </div>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">#D97706</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-error)] bg-[var(--color-error-light)] px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-error)]" />
              <span className="text-sm font-medium text-[var(--color-error)]">Error</span>
            </div>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">#DC2626</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-info)] bg-[var(--color-info-light)] px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-info)]" />
              <span className="text-sm font-medium text-[var(--color-info)]">Info</span>
            </div>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">#2563EB</p>
          </div>
        </div>
      </Section>

      {/* ── Typography ── */}
      <Section title="Typography — Plus Jakarta Sans">
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">display — 800 / 5xl</p>
            <p className="display-font text-5xl font-extrabold leading-tight text-[var(--color-text-primary)]">Jollof Rice</p>
          </div>
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">heading — 700 / 3xl</p>
            <p className="display-font text-3xl font-bold text-[var(--color-text-primary)]">Popular Dishes Near You</p>
          </div>
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">subheading — 600 / xl</p>
            <p className="text-xl font-semibold text-[var(--color-text-primary)]">West African Cuisine</p>
          </div>
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">body — 400 / base</p>
            <p className="text-base text-[var(--color-text-primary)]">A rich, tomato-based rice dish popular across West Africa. Often served at celebrations and family gatherings.</p>
          </div>
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">caption — 400 / sm muted</p>
            <p className="text-sm text-[var(--color-text-muted)]">Updated 2 hours ago · 12 vendors nearby</p>
          </div>
          <div>
            <p className="mono-font mb-1 text-xs text-[var(--color-text-muted)]">mono — code/labels</p>
            <p className="mono-font text-sm text-[var(--color-text-secondary)]">--color-primary: #E07020;</p>
          </div>
        </div>
      </Section>

      {/* ── Border Radius ── */}
      <Section title="Border Radius">
        <div className="flex flex-wrap items-end gap-6">
          {[
            { name: "sm", value: "8px", size: "h-16 w-16" },
            { name: "md", value: "12px", size: "h-20 w-20" },
            { name: "lg", value: "16px", size: "h-24 w-24" },
            { name: "xl", value: "24px", size: "h-28 w-28" },
            { name: "full", value: "9999px", size: "h-16 w-16" },
          ].map(({ name, value, size }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className={`${size} bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)]`}
                style={{ borderRadius: `var(--radius-${name})` }}
              />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">--radius-{name}</p>
              <p className="mono-font text-xs text-[var(--color-text-muted)]">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Shadows / Elevation ── */}
      <Section title="Elevation & Shadows">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { name: "sm", label: "--shadow-sm" },
            { name: "md", label: "--shadow-md" },
            { name: "lg", label: "--shadow-lg" },
            { name: "xl", label: "--shadow-xl" },
          ].map(({ name, label }) => (
            <div key={name} className="flex flex-col gap-3">
              <div
                className="h-24 rounded-[var(--radius-lg)] bg-[var(--color-surface)]"
                style={{ boxShadow: `var(--shadow-${name})` }}
              />
              <p className="mono-font text-xs text-[var(--color-text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Food Gradients ── */}
      <Section title="Food Gradients">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="food-gradient-dish h-36 rounded-[var(--radius-lg)]" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Dish Thumbnail</p>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">.food-gradient-dish</p>
            <p className="text-xs text-[var(--color-text-muted)]">Warm amber placeholder for dish cards when no image is available.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative h-36 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-hover)]">
              <div className="food-gradient-vendor absolute inset-0" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow">Vendor Name</p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Vendor Header Overlay</p>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">.food-gradient-vendor</p>
            <p className="text-xs text-[var(--color-text-muted)]">Terracotta gradient overlay for vendor/restaurant header images.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative h-36 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-dark)]">
              <div className="food-image-overlay absolute inset-0" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow">Image Caption</p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Image Overlay</p>
            <p className="mono-font text-xs text-[var(--color-text-muted)]">.food-image-overlay</p>
            <p className="text-xs text-[var(--color-text-muted)]">Dark scrim from bottom for text legibility on food images.</p>
          </div>
        </div>
      </Section>

      {/* ── Motion ── */}
      <Section title="Motion Tokens">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Duration</p>
              <div className="space-y-2">
                {[
                  { name: "--duration-fast", value: "100ms" },
                  { name: "--duration-base", value: "200ms" },
                  { name: "--duration-slow", value: "350ms" },
                ].map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between">
                    <p className="mono-font text-xs text-[var(--color-text-muted)]">{name}</p>
                    <span className="rounded-[var(--radius-sm)] bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Easing</p>
              <div className="space-y-2">
                {[
                  { name: "--ease-in-out", value: "cubic-bezier(0.4,0,0.2,1)" },
                  { name: "--ease-out", value: "cubic-bezier(0,0,0.2,1)" },
                  { name: "--ease-spring", value: "cubic-bezier(0.34,1.56,0.64,1)" },
                ].map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <p className="mono-font text-xs text-[var(--color-text-muted)]">{name}</p>
                    <span className="mono-font shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Spacing Scale ── */}
      <Section title="Spacing Scale">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          {[
            { name: "--space-1", value: "4px",  px: 4 },
            { name: "--space-2", value: "8px",  px: 8 },
            { name: "--space-3", value: "12px", px: 12 },
            { name: "--space-4", value: "16px", px: 16 },
            { name: "--space-6", value: "24px", px: 24 },
            { name: "--space-8", value: "32px", px: 32 },
            { name: "--space-12", value: "48px", px: 48 },
            { name: "--space-16", value: "64px", px: 64 },
          ].map(({ name, value, px }) => (
            <div key={name} className="flex items-center gap-4">
              <div
                className="h-5 shrink-0 rounded-sm bg-[var(--color-primary)]"
                style={{ width: `${px}px` }}
              />
              <p className="mono-font text-xs text-[var(--color-text-muted)]">{name}</p>
              <span className="ml-auto mono-font text-xs font-semibold text-[var(--color-text-secondary)]">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Pattern Overlay ── */}
      <Section title="Pattern Overlay">
        <div className="pattern-overlay h-32 rounded-[var(--radius-lg)] border border-[var(--color-border)]" />
        <p className="mono-font mt-3 text-xs text-[var(--color-text-muted)]">.pattern-overlay — terracotta grid at 6% opacity, 36px spacing</p>
      </Section>
    </div>
  );
}
