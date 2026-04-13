"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/authStore";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export default function AuthPage() {
  const router = useRouter();
  const { mode, setMode, user, signIn, signUp } = useAuthStore();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      if (!form.fullName.trim()) {
        setError("Full name is required.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      signUp(form.fullName.trim(), form.email.trim());
    } else {
      signIn(form.email.trim());
      router.push("/dashboard");
    }

    setForm(INITIAL_FORM);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 pb-10 pt-20">
      <section className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 flex justify-center">
          <Logo variant="dark" />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] p-1">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold ${
              mode === "signup"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold ${
              mode === "signin"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" ? (
            <label className="block space-y-1">
              <span className="text-sm text-[var(--color-text-primary)]">Full name</span>
              <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
            </label>
          ) : null}

          <label className="block space-y-1">
            <span className="text-sm text-[var(--color-text-primary)]">Email</span>
            <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[var(--color-text-primary)]">Password</span>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {mode === "signup" ? (
            <label className="block space-y-1">
              <span className="text-sm text-[var(--color-text-primary)]">Confirm password</span>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          ) : (
            <div className="text-right">
              <Link href="#" className="text-xs text-[var(--color-primary)]">
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]"
          >
            {mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-[var(--color-primary)]">{error}</p> : null}
        {user ? <p className="mt-4 text-sm text-[var(--color-grocery)]">Signed in as {user.email}</p> : null}
      </section>
    </main>
  );
}