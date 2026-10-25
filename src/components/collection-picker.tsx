"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Check, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMe } from "@/components/header";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Small popover to save the current recipe into one of the user's collections. */
export function CollectionPicker({ slug }: { slug: string }) {
  const { data: me } = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const collections = useQuery<{ id: string; name: string; emoji: string; recipes: { recipe: { slug: string } }[] }[]>({
    queryKey: ["collections", me?.id],
    enabled: !!me && open,
    queryFn: async () => (await fetch("/api/collections")).json(),
  });

  const mutate = useMutation({
    mutationFn: async ({ collectionId, action }: { collectionId: string; action: "add" | "remove" }) =>
      fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, slug, action }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections", me?.id] }),
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401) throw new Error("unauthorized");
      return res.json() as Promise<{ id: string; name: string }>;
    },
    onSuccess: async (col) => {
      setNewName("");
      await mutate.mutateAsync({ collectionId: col.id, action: "add" });
      setSaved(col.name);
      qc.invalidateQueries({ queryKey: ["collections", me?.id] });
      setTimeout(() => setSaved(null), 2000);
    },
    onError: () => router.push("/login"),
  });

  if (!me) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Save to collection"
        className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
      >
        <FolderOpen className="h-3.5 w-3.5 text-primary" /> Save
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute right-0 top-11 z-30 w-64 rounded-3xl bg-white p-4 shadow-lift ring-1 ring-orange-100 dark:bg-obsidian-card dark:ring-white/10"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Save to…</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-cream-deep dark:hover:bg-white/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {(collections.data ?? []).map((col) => {
                const has = col.recipes.some((r) => r.recipe.slug === slug);
                return (
                  <button
                    key={col.id}
                    onClick={() => {
                      mutate.mutate({ collectionId: col.id, action: has ? "remove" : "add" });
                      setSaved(has ? null : col.name);
                    }}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold hover:bg-parchment dark:hover:bg-white/5"
                  >
                    <span>{col.emoji}</span>
                    <span className="flex-1 text-left">{col.name}</span>
                    {has && <Check className="h-4 w-4 text-herb" strokeWidth={3} />}
                  </button>
                );
              })}
              {collections.data && collections.data.length === 0 && (
                <p className="px-3 py-2 text-xs text-ink-soft">No collections yet.</p>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) create.mutate(newName.trim());
              }}
              className="mt-2 flex items-center gap-1.5 border-t border-orange-100/60 pt-2.5 dark:border-white/10"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New collection…"
                aria-label="New collection name"
                className="w-full rounded-full bg-parchment px-3 py-1.5 text-xs outline-none dark:bg-white/10 dark:text-slate-100"
              />
              <button type="submit" aria-label="Create collection" className={cn("rounded-full bg-primary p-1.5 text-white")}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
            {saved && <p className="mt-2 text-center text-[11px] font-bold text-herb-deep dark:text-herb">Saved to {saved} ✓</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
