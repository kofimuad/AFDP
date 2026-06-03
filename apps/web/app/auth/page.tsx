"use client";

import { AlertCircle, AtSign, Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/authStore";
import { useToast } from "@/lib/store/toastStore";
import { registerUser, loginUser, getMe } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

type Tab = "signin" | "signup";
type Role = "user" | "vendor";

interface FormState {
  fullName: string;
  email: string;
  password: string;
}

const EMPTY: FormState = { fullName: "", email: "", password: "" };

// ── Dish chips shown in the hero panel ──────────────────────

const DISHES = ["Jollof Rice", "Egusi Soup", "Suya", "Fufu", "Pepper Soup"];

// ── Redirect by role ─────────────────────────────────────────

function redirectAfterAuth(
  role: string,
  selectedRole: Role,
  router: ReturnType<typeof useRouter>
) {
  if (role === "admin") {
    router.push("/admin" as Route);
  } else if (role === "vendor") {
    router.push("/dashboard");
  } else if (selectedRole === "vendor") {
    // New user who wants to list a business — route to vendor onboarding
    router.push("/vendors/register");
  } else {
    router.push("/");
  }
}

// ── Google SVG (inline, no external dependency) ──────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ── Role card ────────────────────────────────────────────────

function RoleCard({
  selected,
  role,
  label,
  description,
  icon,
  onSelect,
}: {
  selected: boolean;
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  onSelect: (r: Role) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 px-3 py-4 text-center transition-colors",
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
      )}
    >
      <input
        type="radio"
        name="role"
        value={role}
        checked={selected}
        onChange={() => onSelect(role)}
        className="sr-only"
      />
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
      <span className="text-xs leading-snug text-[var(--color-text-muted)]">{description}</span>
    </label>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("signin");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function switchTab(next: Tab) {
    setTab(next);
    setForm(EMPTY);
    setError(null);
    setShowPw(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (tab === "signup") {
      if (!form.fullName.trim()) {
        setError("Full name is required.");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      let res;
      if (tab === "signup") {
        res = await registerUser({
          email: form.email.trim(),
          full_name: form.fullName.trim(),
          password: form.password,
        });
      } else {
        res = await loginUser({
          email: form.email.trim(),
          password: form.password,
        });
      }

      setAuth(res.user, res.access_token, res.refresh_token);

      // Refresh profile in background — ignore failures
      try {
        const me = await getMe();
        setAuth(me as typeof res.user, res.access_token, res.refresh_token);
      } catch {
        // best-effort
      }

      redirectAfterAuth(res.user.role, selectedRole, router);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (tab === "signin" && axiosErr.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (tab === "signup" && axiosErr.response?.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError(
          axiosErr.response?.data?.detail ??
            (tab === "signup" ? "Registration failed. Please try again." : "Sign in failed. Please try again.")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-1" style={{ minHeight: "calc(100dvh - 4rem)" }}>

      {/* ── Left: hero panel ── */}
      <div
        className="relative hidden flex-col items-center justify-center overflow-hidden p-12 lg:flex lg:flex-1"
        style={{
          backgroundImage:
            "linear-gradient(180deg,rgba(15,10,5,.55) 0%,rgba(15,10,5,.35) 40%,rgba(15,10,5,.75) 100%)," +
            "url('https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1600&q=85&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1A0F08",
        }}
      >
        {/* Orange glow accent */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 50%,rgba(224,112,32,.18) 0%,transparent 65%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <Logo variant="light" className="mb-6 scale-125" />

          <p className="mt-2 max-w-xs text-lg leading-relaxed text-white/80">
            "Discover the flavors of Africa, near you."
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {DISHES.map((dish) => (
              <span
                key={dish}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
              >
                {dish}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-bg)] px-6 py-10 lg:max-w-[480px]">
        <div className="w-full max-w-[380px]">

          {/* Logo (visible on mobile only) */}
          <div className="mb-6 flex justify-start lg:hidden">
            <Logo variant="dark" />
          </div>

          {/* Headings */}
          <h1 className="display-font text-2xl font-bold text-[var(--color-text-primary)]">
            {tab === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {tab === "signin"
              ? "Sign in to discover African food near you"
              : "Join the AFDP community today"}
          </p>

          {/* Tab toggle */}
          <div className="mt-6 flex rounded-full bg-[var(--color-surface-hover)] p-1">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-semibold transition-all",
                  tab === t
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Social auth */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => showToast("Google sign-in coming soon", "info")}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => showToast("Facebook sign-in coming soon", "info")}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <FacebookIcon />
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Full name — sign-up only */}
            {tab === "signup" && (
              <FormField label="Full name" htmlFor="auth-name" required>
                <Input
                  id="auth-name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  iconLeft={<User size={16} />}
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  required
                />
              </FormField>
            )}

            {/* Email */}
            <FormField label="Email address" htmlFor="auth-email" required>
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                iconLeft={<AtSign size={16} />}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </FormField>

            {/* Password */}
            <FormField
              label="Password"
              htmlFor="auth-password"
              required
              hint={tab === "signup" ? "Minimum 8 characters" : undefined}
            >
              <Input
                id="auth-password"
                type={showPw ? "text" : "password"}
                placeholder={tab === "signup" ? "Create a password" : "••••••••"}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                iconLeft={<Lock size={16} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </FormField>

            {/* Forgot password — sign-in only */}
            {tab === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => showToast("Password reset coming soon", "info")}
                  className="text-xs font-medium text-[var(--color-primary)] transition hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Role selector — sign-up only */}
            {tab === "signup" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  I am a…
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <RoleCard
                    role="user"
                    selected={selectedRole === "user"}
                    onSelect={setSelectedRole}
                    label="Food Lover"
                    description="Browse & discover restaurants"
                    icon={
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    }
                  />
                  <RoleCard
                    role="vendor"
                    selected={selectedRole === "vendor"}
                    onSelect={setSelectedRole}
                    label="Vendor"
                    description="List my restaurant or store"
                    icon={
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]"><circle cx="9" cy="21" r="1.5" /><circle cx="18" cy="21" r="1.5" /><path d="M2.5 3h2.2l2.5 12.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.6L21.5 7H6" /></svg>
                    }
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-error-light)] bg-[var(--color-error-light)] px-3 py-2.5 text-sm text-[var(--color-error)]"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-full"
            >
              {tab === "signin" ? "Sign In" : "Get Started"}
            </Button>

            {/* Terms — sign-up only */}
            {tab === "signup" && (
              <p className="text-center text-xs leading-relaxed text-[var(--color-text-muted)]">
                By signing up, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => showToast("Terms of Service coming soon", "info")}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => showToast("Privacy Policy coming soon", "info")}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Privacy Policy
                </button>
              </p>
            )}
          </form>

          {/* Continue as guest */}
          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
            >
              Continue as guest →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
