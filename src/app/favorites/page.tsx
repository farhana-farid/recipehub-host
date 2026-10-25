"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, FolderOpen } from "lucide-react";
import { RecipeCard, RecipeRow, type RecipeCardData } from "@/components/recipe-card";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { useMe } from "@/components/header";
import { cn } from "@/lib/utils";

interface CollectionDto {
  id: string;
  name: string;
  emoji: string;
  recipes: { recipe: RecipeCardData }[];
}

export default function FavoritesPage() {
  const lang = useLang();
  const { data: me, isLoading } = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"favorites" | "collections">("favorites");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const favs = useQuery<RecipeCardData[]>({
    queryKey: ["favorites-full", me?.id],
    enabled: !!me,
    queryFn: async () => (await fetch("/api/favorites?expand=1")).json(),
  });

  const collections = useQuery<CollectionDto[]>({
    queryKey: ["collections", me?.id],
    enabled: !!me,
    queryFn: async () => (await fetch("/api/collections")).json(),
  });

  const createCollection = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      setNewName("");
      setAdding(false);
      qc.invalidateQueries({ queryKey: ["collections", me?.id] });
    },
    onError: () => router.push("/login"),
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => fetch(`/api/collections?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections", me?.id] }),
  });

  const removeRecipe = useMutation({
    mutationFn: async ({ collectionId, slug }: { collectionId: string; slug: string }) =>
      fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, slug, action: "remove" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections", me?.id] }),
  });

  if (isLoading) return <p className="py-20 text-center text-sm text-ink-soft">Loading…</p>;

  if (!me) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
        <Heart className="mx-auto h-10 w-10 text-coral" />
        <h1 className="mt-3 font-serif-title text-2xl">{tr("nav.favorites", lang)}</h1>
        <p className="mt-2 text-sm text-ink-soft">Sign in to save recipes and build collections like “Ramadan Meals” or “Quick 15-min Dinners”.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105"
        >
          {tr("auth.login", lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-title text-3xl">
          {me.avatarEmoji} {tr("nav.favorites", lang)}
        </h1>
        {/* Segmented control like the reference */}
        <div className="mt-4 inline-flex rounded-full bg-cream-deep p-1 dark:bg-white/10">
          {(
            [
              ["favorites", tr("nav.favorites", lang)],
              ["collections", "Collections"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-6 py-2.5 text-sm font-bold transition-all",
                tab === key ? "bg-primary text-white shadow-glow" : "text-ink-soft"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "favorites" ? (
        favs.data && favs.data.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favs.data.map((r, i) => (
              <RecipeCard key={r.slug} recipe={r} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-parchment p-10 text-center shadow-soft dark:bg-obsidian-card">
            <Heart className="mx-auto h-9 w-9 text-coral/60" />
            <p className="mt-3 font-serif text-lg">Nothing saved yet — tap the ♥ on any recipe.</p>
          </div>
        )
      ) : (
        <div className="space-y-5">
          {/* Add collection chip — reference style */}
          <div className="flex flex-wrap items-center gap-2">
            {adding ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newName.trim()) createCollection.mutate(newName.trim());
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramadan Meals"
                  aria-label="Collection name"
                  className="w-52 rounded-full bg-white px-4 py-2 text-sm shadow-soft outline-none ring-1 ring-orange-100 focus:ring-2 focus:ring-primary/50 dark:bg-obsidian-card dark:ring-white/10 dark:text-slate-100"
                />
                <button type="submit" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow">
                  Create
                </button>
                <button type="button" onClick={() => setAdding(false)} className="text-xs font-bold text-ink-soft">
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-4 py-2 text-xs font-bold text-primary-deep transition-transform hover:scale-105 dark:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add Collection
              </button>
            )}
          </div>

          {collections.data && collections.data.length > 0 ? (
            collections.data.map((col) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{col.emoji}</span>
                  <h2 className="font-serif-title text-xl">{col.name}</h2>
                  <span className="rounded-full bg-parchment px-2 py-0.5 text-[11px] font-bold text-ink-soft dark:bg-white/10">
                    {col.recipes.length}
                  </span>
                  <button
                    onClick={() => deleteCollection.mutate(col.id)}
                    aria-label={`Delete collection ${col.name}`}
                    className="ml-auto rounded-full p-2 text-ink-soft transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {col.recipes.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {col.recipes.map(({ recipe }) => (
                      <div key={recipe.slug} className="relative">
                        <RecipeRow recipe={recipe} />
                        <button
                          onClick={() => removeRecipe.mutate({ collectionId: col.id, slug: recipe.slug })}
                          aria-label={`Remove ${recipe.title} from ${col.name}`}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-ink-soft shadow-soft transition-colors hover:text-coral dark:bg-black/50"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">Empty — open any recipe and use the folder button to add it here.</p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="rounded-3xl bg-parchment p-10 text-center shadow-soft dark:bg-obsidian-card">
              <FolderOpen className="mx-auto h-9 w-9 text-primary/50" />
              <p className="mt-3 font-serif text-lg">No collections yet — create one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
