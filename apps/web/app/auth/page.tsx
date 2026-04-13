"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/authStore";
import { registerUser, loginUser, getMe } from '@/lib/api'

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
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      try {
        setIsLoading(true);
        const res = await registerUser({
          email: form.email.trim(),
          full_name: form.fullName.trim(),
          password: form.password
        });
        setAuth(res.user, res.access_token, res.refresh_token);
        // Always fetch latest user profile after auth
        try {
          const me = await getMe();
          setAuth(me, res.access_token, res.refresh_token);
        } catch {}
        if (res.user.role === 'admin' || res.user.role === 'vendor') {
          router.push('/dashboard');
        } else {
          router.push('/search');
        }
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Registration failed';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);
        const res = await loginUser({
          email: form.email.trim(),
          password: form.password
        });
        setAuth(res.user, res.access_token, res.refresh_token);
        // Always fetch latest user profile after auth
        try {
          const me = await getMe();
          setAuth(me, res.access_token, res.refresh_token);
        } catch {}
        if (res.user.role === 'admin' || res.user.role === 'vendor') {
          router.push('/dashboard');
        } else {
          router.push('/search');
        }
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 401) {
          setError('Invalid email or password');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
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
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {error && (
          <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}