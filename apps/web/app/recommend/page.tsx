"use client";

import { Check, ChefHat, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { submitFoodSuggestion, type SuggestionIngredient } from "@/lib/api";
import { useToast } from "@/lib/store/toastStore";

const EMPTY = { name: "", region: "", description: "", recipe_link: "", image_url: "", note: "" };
const EMPTY_ING: SuggestionIngredient = { name: "", quantity_note: "" };
// Base field styling without a width so it can be used inside flex rows too.
const FIELD_BASE =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]";
const FIELD = `w-full ${FIELD_BASE}`;

const REGIONS = [
  "West African",
  "East African",
  "North African",
  "Southern African",
  "Central African",
  "Afro-Caribbean"
];

function RecommendForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [ingredients, setIngredients] = useState<SuggestionIngredient[]>([{ ...EMPTY_ING }]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setIngredient(index: number, key: keyof SuggestionIngredient, value: string) {
    setIngredients((list) => list.map((ing, i) => (i === index ? { ...ing, [key]: value } : ing)));
  }
  function addIngredient() {
    setIngredients((list) => [...list, { ...EMPTY_ING }]);
  }
  function removeIngredient(index: number) {
    setIngredients((list) => (list.length === 1 ? [{ ...EMPTY_ING }] : list.filter((_, i) => i !== index)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Please enter a dish name.", "error");
      return;
    }
    setBusy(true);
    try {
      const cleanedIngredients = ingredients
        .map((ing) => ({ name: ing.name.trim(), quantity_note: (ing.quantity_note ?? "").trim() || null }))
        .filter((ing) => ing.name);
      await submitFoodSuggestion({
        name: form.name.trim(),
        region: form.region.trim() || null,
        description: form.description.trim() || null,
        recipe_link: form.recipe_link.trim() || null,
        image_url: form.image_url.trim() || null,
        note: form.note.trim() || null,
        ingredients: cleanedIngredients
      });
      setDone(true);
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(detail ?? "Couldn't submit. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-grocery-light)] bg-[var(--color-grocery-light)] px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-grocery)] text-white">
          <Check size={26} />
        </span>
        <div>
          <p className="display-font text-xl font-bold text-[var(--color-text-primary)]">Thanks for the recommendation!</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Our team reviews every suggestion. If it&rsquo;s a fit, it&rsquo;ll appear in the catalog soon.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setIngredients([{ ...EMPTY_ING }]);
              setDone(false);
            }}
            className="rounded-full bg-[var(--color-grocery)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Recommend another
          </button>
          <Link
            href="/foods"
            className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Browse dishes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Dish name *</span>
        <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ndolé" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Region</span>
          <select className={FIELD} value={form.region} onChange={(e) => set("region", e.target.value)}>
            <option value="">Select a region…</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Recipe link (YouTube / article)</span>
          <input className={FIELD} value={form.recipe_link} onChange={(e) => set("recipe_link", e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Short description</span>
        <textarea
          className={FIELD}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is it? A sentence or two."
        />
      </label>

      <div className="text-sm">
        <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Ingredients (optional)</span>
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">List what goes into the dish. Amounts can be free-form — “2 cups”, “a handful”, “to taste”.</p>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${FIELD_BASE} min-w-0 flex-1`}
                value={ing.name}
                onChange={(e) => setIngredient(i, "name", e.target.value)}
                placeholder="Ingredient, e.g. Egusi seeds"
              />
              <input
                className={`${FIELD_BASE} w-28 shrink-0 sm:w-32`}
                value={ing.quantity_note ?? ""}
                onChange={(e) => setIngredient(i, "quantity_note", e.target.value)}
                placeholder="Amount"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                aria-label="Remove ingredient"
                className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-error)]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
        >
          <Plus size={14} />
          Add ingredient
        </button>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Image URL (optional)</span>
        <input className={FIELD} value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://…" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[var(--color-text-primary)]">Anything else? (optional)</span>
        <textarea
          className={FIELD}
          rows={2}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Why should we add it, where it's from, etc."
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={16} />}
        Submit recommendation
      </button>
    </form>
  );
}

export default function RecommendPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        <header className="mb-6">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <ChefHat size={24} />
          </span>
          <h1 className="display-font text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Recommend a dish
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Know an African dish we&rsquo;re missing? Suggest it — our team reviews every submission before it joins the catalog.
          </p>
        </header>
        <RecommendForm />
      </main>
    </ProtectedRoute>
  );
}
