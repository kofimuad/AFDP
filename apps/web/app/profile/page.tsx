"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ChevronDown, ChevronUp, Lock, Store } from "lucide-react";
import Link from "next/link";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getAssetUrl, updateProfile, uploadProfilePhoto } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useToast } from "@/lib/store/toastStore";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type RoleBadge = { label: string; className: string };

const roleBadges: Record<string, RoleBadge> = {
  user: {
    label: "Member",
    className: "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]",
  },
  vendor: {
    label: "Vendor",
    className: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  },
  admin: {
    label: "Admin",
    className: "bg-[var(--color-dark)] text-[var(--color-text-inverse)]",
  },
};

function ProfileContent() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { showToast } = useToast();

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
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [user?.created_at]);

  const role = user?.role ?? "user";
  const badge = roleBadges[role] ?? roleBadges.user;

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
      updateUser({
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role,
        vendor_id: updated.vendor_id,
        created_at: updated.created_at,
        profile_image_url: updated.profile_image_url,
      });
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
      updateUser({
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role,
        vendor_id: updated.vendor_id,
        created_at: updated.created_at,
        profile_image_url: updated.profile_image_url,
      });
      showToast("Profile updated successfully", "success");
    } catch {
      showToast("Could not update profile. Please try again.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password change coming soon.", "info");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-16 pt-20">
      <div className="mx-auto w-full max-w-[800px] px-4 md:px-6">
        <h1 className="display-font mb-6 text-3xl font-bold text-[var(--color-text-primary)]">
          Your Profile
        </h1>

        <div className="grid gap-8 md:grid-cols-[180px_1fr]">
          <section className="flex flex-col items-center md:items-start">
            <div className="relative flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] text-3xl font-bold text-white">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : user.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getAssetUrl(user.profile_image_url) ?? ""}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoPick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
            >
              Change Photo
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={onSavePhoto}
                disabled={uploadingPhoto}
                className="mt-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
              >
                {uploadingPhoto ? "Saving..." : "Save Photo"}
              </button>
            )}
            <p className="mt-2 text-center text-xs text-[var(--color-text-muted)] md:text-left">
              JPG, PNG or WebP. Max 5MB.
            </p>
          </section>

          <section>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Email</span>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 pr-9 text-sm text-[var(--color-text-muted)]"
                  />
                  <Lock
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Email cannot be changed for security.
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <span className="block text-sm font-medium text-[var(--color-text-primary)]">Role</span>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                {memberSince && (
                  <div className="space-y-1">
                    <span className="block text-sm font-medium text-[var(--color-text-primary)]">Member since</span>
                    <span className="text-sm text-[var(--color-text-muted)]">{memberSince}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60 sm:w-auto"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>

            {(user.role === "vendor" || user.role === "admin") && user.vendor_id && (
              <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Store size={18} className="text-[var(--color-primary)]" />
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Your Business</h2>
                </div>
                <p className="mb-3 text-sm text-[var(--color-text-muted)]">
                  Manage your listing, verification, and menu from the vendor dashboard.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block rounded-[var(--radius-md)] border border-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-light)]"
                >
                  Manage Listing
                </Link>
              </div>
            )}

            <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setPasswordOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]"
                aria-expanded={passwordOpen}
              >
                <span>Change Password</span>
                {passwordOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {passwordOpen && (
                <form onSubmit={onSubmitPassword} className="space-y-3 border-t border-[var(--color-border)] p-4">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                  <input
                    type="password"
                    placeholder="New password (min 8)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] sm:w-auto"
                  >
                    Update Password
                  </button>
                </form>
              )}
            </div>
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
