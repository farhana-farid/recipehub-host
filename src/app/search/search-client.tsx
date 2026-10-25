"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { RecipeCard, type RecipeCardData } from "@/components/recipe-card";
import { useLang } from "@/components/providers";
import { tr, DIETS, ALLERGENS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SearchRow extends RecipeCardData {
  dietTags: string[];
  tags: string[];
}

const CUISINES = ["Indian", "Italian", "American", "Bengali", "Nigerian", "Jamaican", "Mediterranean", "Healthy", "Universal"];

export function SearchClient() {
  const lang = useLang();
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [showFilters, setShowFilters] = useState(false);
  const [diet, setDiet] = useState<string | undefined>();
  const [exclude, setExclude] = useState<string[]>([]);
  const [maxCook, setMaxCook] = useState<number | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery<SearchRow[]>({
    queryKey: ["search", debounced, diet, exclude.join(","), maxCook],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (debounced) p.set("q", debounced);
      if (diet) p.set("diet", diet);
      if (exclude.length) p.set("exclude", exclude.join(","));
      if (maxCook) p.set("maxCook", String(maxCook));
      const res = await fetch(`/api/search?${p.toString()}`);
      return res.json();
    },
  });

  const results = useMemo(() => {
    if (!data) return [];
    return data.map((r) => ({
      slug: r.slug, title: r.title, titleBn: r.titleBn, image: r.image, cuisine: r.cuisine,
      cookMinutes: r.cookMinutes, difficulty: r.difficulty, calories: r.calories,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-title text-3xl">{lang === "bn" ? "রেসিপি খুঁজুন" : "Search recipes"}</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
          Titles, ingredients, cuisines, tags — English ও বাংলা দুটোতেই।
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-soft ring-1 ring-orange-100 focus-within:ring-2 focus-within:ring-primary/50 dark:bg-obsidian-card dark:ring-white/10">
        <Search className="h-4.5 w-4.5 shrink-0 text-ink-soft" />
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("action.search", lang)}
          aria-label={tr("action.search", lang)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft dark:text-slate-100"
        />
        {q && (
          <button onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear search" className="rounded-full p-1.5 hover:bg-cream-deep dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-colors",
            showFilters || diet || exclude.length || maxCook ? "bg-primary text-white shadow-glow" : "bg-parchment text-ink dark:bg-white/10"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="space-y-4 rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Dietary</p>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDiet(diet === d.key ? undefined : d.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105",
                    diet === d.key ? "bg-herb text-white shadow-glow" : "bg-parchment text-ink dark:bg-white/10 dark:text-slate-200"
                  )}
                >
                  {lang === "bn" ? d.bn : d.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Exclude allergens</p>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setExclude((xs) => (xs.includes(a.key) ? xs.filter((x) => x !== a.key) : [...xs, a.key]))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105",
                    exclude.includes(a.key) ? "bg-coral text-white shadow-glow" : "bg-parchment text-ink dark:bg-white/10 dark:text-slate-200"
                  )}
                >
                  {lang === "bn" ? a.bn : a.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Max cook time</p>
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setMaxCook(maxCook === m ? undefined : m)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105",
                    maxCook === m ? "bg-primary text-white shadow-glow" : "bg-parchment text-ink dark:bg-white/10 dark:text-slate-200"
                  )}
                >
                  ≤ {m} min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-ink-soft dark:text-slate-400" aria-live="polite">
        {isFetching ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
      </p>

      {results.length === 0 && !isFetching ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
          <p className="font-serif text-xl">{tr("empty.noResults", lang)}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try an ingredient — “chickpeas”, “ডিম” — or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <RecipeCard key={r.slug} recipe={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
