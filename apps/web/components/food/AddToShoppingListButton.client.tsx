"use client";

import { ListPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addRecipeToShoppingList } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { useToast } from "@/lib/store/toastStore";

export function AddToShoppingListButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!useAuthStore.getState().isAuthenticated()) {
      showToast("Sign in to build your shopping list.", "info");
      router.push("/auth");
      return;
    }
    setLoading(true);
    try {
      const res = await addRecipeToShoppingList(slug);
      const msg =
        res.added > 0
          ? `Added ${res.added} ingredient${res.added === 1 ? "" : "s"} to your list`
          : "Already on your shopping list";
      showToast(msg, "success");
    } catch {
      showToast("Couldn't add to your list. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--color-grocery)] bg-[var(--color-grocery-light)] px-5 py-3 text-sm font-semibold text-[var(--color-grocery)] transition hover:brightness-95 disabled:opacity-70"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ListPlus size={16} />}
      Add to shopping list
    </button>
  );
}
