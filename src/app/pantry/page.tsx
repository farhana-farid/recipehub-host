"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Repeat, Search, X, ChefHat, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePantry } from "@/store/pantry";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface IngredientDto {
  name: string;
  nameBn: string | null;
  substitutes: string[];
}

interface MatchDto {
  slug: string;
  title: string;
  titleBn: string | null;
  image: string;
  cuisine: string;
  difficulty: string;
  cookMinutes: number;
  calories: number;
  matchPct: number;
  matchedCount: number;
  totalCount: number;
  missingItems: string[];
  missingItemsBn: Array<{ en: string; bn: string | null; substitutes: string[] }>;
}

export default function PantryPage() {
  const lang = useLang();
  const pantry = usePantry();
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState<string | undefined>();
  const [maxCook, setMaxCook] = useState<number | undefined>();

  const { data: allIngredients } = useQuery<IngredientDto[]>({
    queryKey: ["ingredients"],
    queryFn: async () => (await fetch("/api/ingredients")).json(),
  });

  const match = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pantry.items, diet, maxCookMinutes: maxCook }),
      });
      return res.json() as Promise<MatchDto[]>;
    },
  });

  // Re-rank whenever pantry or filters change (debounced-ish via query key).
  const { data: results, isPending } = useQuery<MatchDto[]>({
    queryKey: ["pantry", pantry.items.join("|"), diet, maxCook],
    enabled: pantry.items.length > 0,
    queryFn: async () => {
      const res = await fetch("/api/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pantry.items, diet, maxCookMinutes: maxCook }),
      });
      return res.json();
    },
  });
  void match; // kept simple via useQuery above

  const filteredSuggestions = useMemo(() => {
    const list = allIngredients ?? [];
    if (!q.trim()) return list.slice(0, 40);
    const needle = q.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(needle) || (i.nameBn ?? "").includes(q)).slice(0, 40);
  }, [allIngredients, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-title text-3xl">🥕 {lang === "bn" ? "আমার প্যান্ট্রিতে কী আছে?" : "What can I cook?"}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-slate-400">
          Pick the ingredients you already have — we rank every recipe by how much of it you can make right now.
          {lang === "bn" ? " যা আছে তা বাছাই করুন — কোন রেসিপি কত শতাংশ বানানো সম্ভব দেখুন।" : ""}
        </p>
      </div>

      {/* Ingredient picker */}
      <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
        <div className="flex items-center gap-2 rounded-full bg-parchment px-4 py-2.5 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "bn" ? "উপকরণ খুঁজুন (যেমন: ডিম, পেঁয়াজ)" : "Search ingredients (e.g. eggs, onion, ছোলা)"}
            aria-label="Search ingredients"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft dark:text-slate-100"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {filteredSuggestions.map((ing) => {
            const inPantry = pantry.items.includes(ing.name);
            return (
              <button
                key={ing.name}
                onClick={() => pantry.toggle(ing.name)}
                aria-pressed={inPantry}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105",
                  inPantry
                    ? "bg-herb text-white shadow-glow"
                    : "bg-parchment text-ink hover:bg-cream-deep dark:bg-white/10 dark:text-slate-200"
                )}
              >
                {inPantry ? <Check className="h-3 w-3" strokeWidth={3} /> : <Plus className="h-3 w-3" />}
                {lang === "bn" && ing.nameBn ? ing.nameBn : ing.name}
              </button>
            );
          })}
        </div>

        {pantry.items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-orange-100/60 pt-3 dark:border-white/10">
            <span className="text-xs font-bold text-ink-soft">Your pantry ({pantry.items.length}):</span>
            <AnimatePresence>
              {pantry.items.map((p) => (
                <motion.span
                  key={p}
                  layout
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex items-center gap-1 rounded-full bg-herb/15 px-2.5 py-1 text-xs font-bold text-herb-deep dark:text-herb"
                >
                  {p}
                  <button onClick={() => pantry.remove(p)} aria-label={`Remove ${p}`} className="rounded-full p-0.5 hover:bg-herb/25">
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <button onClick={pantry.clear} className="ml-auto text-xs font-bold text-coral hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {pantry.items.length === 0 ? (
        <div className="rounded-3xl bg-parchment p-10 text-center shadow-soft dark:bg-obsidian-card">
          <ChefHat className="mx-auto h-10 w-10 text-primary/50" />
          <p className="mt-3 font-serif text-xl">Pick a few ingredients above</p>
          <p className="mt-1 text-sm text-ink-soft">Egg + Onion + Tomato is a classic start 🍳</p>
        </div>
      ) : (
        <>
          {/* quick filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All", on: !diet && !maxCook, fn: () => { setDiet(undefined); setMaxCook(undefined); } },
              { label: "≤ 30 min", on: maxCook === 30, fn: () => setMaxCook(maxCook === 30 ? undefined : 30) },
              { label: "🌱 Vegan", on: diet === "vegan", fn: () => setDiet(diet === "vegan" ? undefined : "vegan") },
              { label: "High protein", on: diet === "high-protein", fn: () => setDiet(diet === "high-protein" ? undefined : "high-protein") },
            ].map((f) => (
              <button
                key={f.label}
                onClick={f.fn}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
                  f.on ? "bg-primary text-white shadow-glow" : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isPending || !results ? (
            <p className="py-10 text-center text-sm text-ink-soft" aria-live="polite">Ranking recipes…</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-ink-soft dark:text-slate-400" aria-live="polite">
                {results.length} recipes ranked by match
              </p>
              {results.map((r, i) => (
                <motion.div
                  key={r.slug}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="overflow-hidden rounded-3xl bg-white shadow-soft dark:bg-obsidian-card"
                >
                  <Link href={`/recipe/${r.slug}`} className="flex items-center gap-4 p-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl md:h-28 md:w-28">
                      <Image src={r.image} alt={r.title} fill sizes="112px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif-title line-clamp-1 text-lg">{lang === "bn" && r.titleBn ? r.titleBn : r.title}</h3>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                            r.matchPct >= 100
                              ? "bg-herb text-white"
                              : r.matchPct >= 60
                                ? "bg-primary/15 text-primary-deep dark:text-primary"
                                : "bg-ink/5 text-ink-soft dark:bg-white/10 dark:text-slate-300"
                          )}
                        >
                          {r.matchPct}% {tr("label.match", lang)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft dark:text-slate-400">
                        {r.cuisine} · {r.cookMinutes} min · {r.difficulty.toLowerCase()}
                      </p>
                      {r.missingItemsBn.length > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-coral">
                            {tr("label.missing", lang)} {r.missingItemsBn.length}:
                          </span>
                          {r.missingItemsBn.slice(0, 4).map((m) => (
                            <span
                              key={m.en}
                              className="flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-semibold text-coral"
                              title={m.substitutes.length ? `${tr("label.substitute", lang)}: ${m.substitutes.join(", ")}` : undefined}
                            >
                              {lang === "bn" && m.bn ? m.bn : m.en}
                              {m.substitutes.length > 0 && <Repeat className="h-2.5 w-2.5" />}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-herb-deep dark:text-herb">
                          <Sparkles className="h-3 w-3" /> You have everything — cook it now!
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
