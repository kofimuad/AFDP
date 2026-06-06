// Pricing/plan definitions for the Advertise screen.
// Plan tiers mirror the vendors.plan enum (basic | featured | premium).
// Pricing lives here as config; payment (Stripe columns already exist on
// vendors) is a later hook.

export type PlanId = "basic" | "featured" | "premium";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in USD; 0 = free */
  monthly: number;
  /** Effective per-month price when billed annually (≈20% off) */
  annual: number;
  popular?: boolean;
  /** Render as the dark "premium" card */
  dark?: boolean;
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Get listed and discoverable, free forever.",
    monthly: 0,
    annual: 0,
    features: [
      { text: "Business listing on the map", included: true },
      { text: "Up to 5 menu items", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Featured badge", included: false },
      { text: "Search priority boost", included: false }
    ]
  },
  {
    id: "featured",
    name: "Featured",
    tagline: "Rise to the top of search and get noticed.",
    monthly: 29,
    annual: 23,
    popular: true,
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Featured badge on your listing", included: true },
      { text: "Priority placement in search", included: true },
      { text: "Unlimited menu items", included: true },
      { text: "Full analytics + weekly reports", included: true }
    ]
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Maximum exposure for serious businesses.",
    monthly: 79,
    annual: 63,
    dark: true,
    features: [
      { text: "Everything in Featured", included: true },
      { text: "Homepage carousel placement", included: true },
      { text: "Custom brand profile page", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Multi-location support", included: true }
    ]
  }
];

export interface ComparisonRow {
  label: string;
  basic: string | boolean;
  featured: string | boolean;
  premium: string | boolean;
}

export interface ComparisonSection {
  section: string;
  rows: ComparisonRow[];
}

export const COMPARISON: ComparisonSection[] = [
  {
    section: "Listing",
    rows: [
      { label: "Map listing", basic: true, featured: true, premium: true },
      { label: "Menu items", basic: "Up to 5", featured: "Unlimited", premium: "Unlimited" },
      { label: "Photo gallery", basic: "1 photo", featured: "10 photos", premium: "Unlimited" },
      { label: "Opening hours", basic: true, featured: true, premium: true }
    ]
  },
  {
    section: "Visibility",
    rows: [
      { label: "Featured badge", basic: false, featured: true, premium: true },
      { label: "Search priority", basic: "Standard", featured: "High", premium: "Highest" },
      { label: "Homepage carousel", basic: false, featured: false, premium: true }
    ]
  },
  {
    section: "Analytics",
    rows: [
      { label: "Profile views", basic: "Basic", featured: "Full", premium: "Full" },
      { label: "Weekly reports", basic: false, featured: true, premium: true }
    ]
  },
  {
    section: "Support",
    rows: [
      { label: "Email support", basic: true, featured: "Priority", premium: "Priority" },
      { label: "Dedicated manager", basic: false, featured: false, premium: true }
    ]
  }
];

export function formatPlanPrice(plan: Plan, annual: boolean): { amount: string; cadence: string } {
  if (plan.monthly === 0) {
    return { amount: "Free", cadence: "Always free" };
  }
  const price = annual ? plan.annual : plan.monthly;
  return {
    amount: `$${price}`,
    cadence: annual ? "per month, billed annually" : "per month"
  };
}
