"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is invalid or has expired. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setDone(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 400) {
        setError("This reset link is invalid or has expired. Please request a new one.");
      } else {
        setError(axiosErr.response?.data?.detail ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-6 py-10" style={{ minHeight: "calc(100dvh - 4rem)" }}>
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex justify-start">
          <Logo variant="dark" />
        </div>

        <h1 className="display-font text-2xl font-bold text-[var(--color-text-primary)]">
          Choose a new password
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Enter a new password for your AFDP account.
        </p>

        {done ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-primary)]">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <span>Your password has been reset. You can now sign in with your new password.</span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full rounded-full"
              onClick={() => router.push("/auth")}
            >
              Go to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <FormField label="New password" htmlFor="reset-password" required hint="Minimum 8 characters">
              <Input
                id="reset-password"
                type={showPw ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
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
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </FormField>

            <FormField label="Confirm new password" htmlFor="reset-confirm" required>
              <Input
                id="reset-confirm"
                type={showPw ? "text" : "password"}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                iconLeft={<Lock size={16} />}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </FormField>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-error-light)] bg-[var(--color-error-light)] px-3 py-2.5 text-sm text-[var(--color-error)]"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-full"
            >
              Reset password
            </Button>

            <Link
              href="/auth"
              className="text-center text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
