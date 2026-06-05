"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  Bookmark,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Sun
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import {
  changePassword,
  clearMyLocation,
  getAssetUrl,
  logoutUser,
  setMyLocation,
  updateProfile,
  uploadProfilePhoto
} from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import { useSavedStore } from "@/lib/store/savedStore";
import { useToast } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const roleBadges: Record<string, { label: string; className: string }> = {
  user: { label: "Member", className: "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]" },
  vendor: { label: "Vendor", className: "bg-[var(--color-primary-light)] text-[var(--color-primary)]" },
  admin: { label: "Admin", className: "bg-[var(--color-dark)] text-[var(--color-text-inverse)]" }
};

// ── Section card wrapper ─────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="display-font mb-5 text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function ProfileContent() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { showToast } = useToast();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [locating, setLocating] = useState(false);

  // ── Preferences ──
  const { theme, setTheme } = useTheme();
  const preferredLocation = usePreferencesStore((s) => s.preferredLocation);
  const setPreferredLocation = usePreferencesStore((s) => s.setPreferredLocation);
  const clearPreferredLocation = usePreferencesStore((s) => s.clearPreferredLocation);

  // ── Saved counts ──
  const savedHydrated = useSavedStore((s) => s._hasHydrated);
  const savedFoods = useSavedStore((s) => s.foods.length);
  const savedPlaces = useSavedStore((s) => s.vendors.length);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user?.full_name]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const initials = useMemo(() => {
    const name = user?.full_name?.trim() ?? "";
    if (!name) return "?";
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || first.toUpperCase() || "?";
  }, [user?.full_name]);

  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    try {
      return new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long"
      });
    } catch {
      return null;
    }
  }, [user?.created_at]);

  const role = user?.role ?? "user";
  const badge = roleBadges[role] ?? roleBadges.user;
  const isVendorish = role === "vendor" || role === "admin";

  // ── Handlers ──

  const onPhotoPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      showToast("Image must be 5MB or smaller.", "error");
      event.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Only JPG, PNG, or WebP allowed.", "error");
      event.target.value = "";
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const onSavePhoto = async () => {
    if (!selectedFile) return;
    setUploadingPhoto(true);
    try {
      const updated = await uploadProfilePhoto(selectedFile);
      updateUser({ ...updated });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Photo updated successfully", "success");
    } catch {
      showToast("Could not upload photo. Please try again.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      showToast("Name must be at least 2 characters.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ full_name: fullName.trim() });
      updateUser({ ...updated });
      showToast("Profile updated successfully", "success");
    } catch {
      showToast("Could not update profile. Please try again.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentPassword) {
      showToast("Enter your current password.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
      showToast("Password updated successfully", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 400) {
        showToast(axiosErr.response.data?.detail ?? "Current password is incorrect.", "error");
      } else {
        showToast("Could not update password. Please try again.", "error");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const onDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Location is not supported on this device", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const updated = await setMyLocation(pos.coords.latitude, pos.coords.longitude);
          updateUser({ ...updated });
          if (updated.pref_lat != null && updated.pref_lng != null) {
            setPreferredLocation({ lat: updated.pref_lat, lng: updated.pref_lng });
          }
          showToast("Default location saved", "success");
        } catch {
          showToast("Couldn't save your location", "error");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        showToast("Couldn't get your location", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const onClearLocation = async () => {
    try {
      const updated = await clearMyLocation();
      updateUser({ ...updated });
      clearPreferredLocation();
      showToast("Default location cleared", "info");
    } catch {
      showToast("Couldn't clear location", "error");
    }
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutUser();
    } catch {
      // best-effort
    }
    clearAuth();
    clearPreferredLocation();
    router.push("/");
  };

  if (!user) return null;

  const avatarSrc = previewUrl ?? (user.profile_image_url ? getAssetUrl(user.profile_image_url) : null);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <h1 className="display-font mb-6 text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
        My Profile
      </h1>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* ── Avatar sidebar ── */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-3xl font-bold text-[var(--color-primary)]">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                <Camera size={14} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoPick}
              className="hidden"
            />

            <p className="display-font mt-4 text-xl font-bold text-[var(--color-text-primary)]">{user.full_name}</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{user.email}</p>
            <span className={cn("mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold", badge.className)}>
              {badge.label}
            </span>
            {memberSince && (
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">Member since {memberSince}</p>
            )}

            {previewUrl && (
              <Button
                type="button"
                size="sm"
                loading={uploadingPhoto}
                onClick={onSavePhoto}
                className="mt-4 w-full rounded-full"
              >
                Save Photo
              </Button>
            )}

            <div className="mt-5 w-full space-y-2">
              {isVendorish && user.vendor_id && (
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
                >
                  <LayoutDashboard size={16} />
                  Vendor Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
              >
                {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="space-y-6">
          {/* Personal information */}
          <Section title="Personal Information">
            <form onSubmit={onSaveProfile} className="space-y-4">
              <FormField label="Full name" htmlFor="profile-name" required>
                <Input
                  id="profile-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </FormField>

              <FormField
                label="Email address"
                htmlFor="profile-email"
                hint="Email cannot be changed. Contact support to update it."
              >
                <Input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  readOnly
                  iconRight={<Lock size={16} />}
                  className="cursor-not-allowed bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                />
              </FormField>

              <Button type="submit" loading={savingProfile} className="rounded-full">
                Save Changes
              </Button>
            </form>
          </Section>

          {/* Saved entry */}
          <Section title="Saved">
            <Link
              href="/saved"
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 transition hover:bg-[var(--color-surface-hover)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Bookmark size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                  Saved dishes &amp; places
                </span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  {savedHydrated
                    ? `${savedFoods} ${savedFoods === 1 ? "dish" : "dishes"} · ${savedPlaces} ${savedPlaces === 1 ? "place" : "places"}`
                    : "View your collection"}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-text-muted)]" />
            </Link>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            {/* Theme */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Theme</p>
                <p className="text-xs text-[var(--color-text-muted)]">Choose how AFDP looks to you.</p>
              </div>
              <div className="inline-flex rounded-full bg-[var(--color-surface-hover)] p-1" role="group" aria-label="Theme">
                {[
                  { key: "light", label: "Light", Icon: Sun },
                  { key: "dark", label: "Dark", Icon: Moon },
                  { key: "system", label: "System", Icon: Monitor }
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    aria-pressed={theme === key}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                      theme === key
                        ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Default location</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {preferredLocation
                    ? `Pinned to ${preferredLocation.lat.toFixed(3)}, ${preferredLocation.lng.toFixed(3)} — used for nearby results.`
                    : "Set a default so searches show nearby places without asking each time."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {preferredLocation && (
                  <button
                    type="button"
                    onClick={onClearLocation}
                    className="rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDetectLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                  {preferredLocation ? "Update" : "Use my location"}
                </button>
              </div>
            </div>
          </Section>

          {/* Change password (collapsible) */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              type="button"
              onClick={() => setPasswordOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              aria-expanded={passwordOpen}
            >
              <span className="display-font text-lg font-bold text-[var(--color-text-primary)]">Change Password</span>
              {passwordOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {passwordOpen && (
              <form onSubmit={onSubmitPassword} className="space-y-3 border-t border-[var(--color-border)] p-6">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="submit" loading={changingPassword} className="rounded-full">
                  Update Password
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
