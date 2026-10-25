"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { ReelCarousel } from "@/components/reel-carousel";
import { RecipeCard } from "@/components/recipe-card";
import { getDemoRecipes, getDemoReels } from "@/lib/demo";
import { parseVideoSource } from "@/lib/video-parser";
import { cn } from "@/lib/utils";

const CUISINES = [...new Set(getDemoRecipes().map((r) => r.cuisine))];

/** Client-side home for the static demo: same layout, filters run locally. */
export function HomeDemo() {
  const [cuisine, setCuisine] = useState<string | undefined>();
  const [veganOnly, setVeganOnly] = useState(false);

  const reels = useMemo(() => getDemoReels(), []);
  const cards = useMemo(
    () =>
      getDemoRecipes().filter(
        (r) => (!cuisine || r.cuisine === cuisine) && (!veganOnly || r.dietTags.includes("vegan"))
      ),
    [cuisine, veganOnly]
  );

  return (
    <div className="space-y-10">
      <Hero />

      {reels.length > 0 && (
        <section id="browse-reels">
          <ReelCarousel reels={reels.map((v) => ({ ...v, thumbnailUrl: parseVideoSource(v.videoUrl).thumbnailUrl }))} />
        </section>
      )}

      <section aria-label="Browse recipes">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 font-serif-title text-2xl">Trending Recipes</h2>
          <button
            onClick={() => { setCuisine(undefined); setVeganOnly(false); }}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
              !cuisine && !veganOnly ? "bg-primary text-white shadow-glow" : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
            )}
          >
            All
          </button>
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(cuisine === c ? undefined : c)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
                cuisine === c ? "bg-primary text-white shadow-glow" : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
              )}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setVeganOnly((v) => !v)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
              veganOnly ? "bg-herb text-white shadow-glow" : "bg-herb/10 text-herb-deep shadow-soft dark:text-herb"
            )}
          >
            🌱 Vegan
          </button>
          <Link
            href="/pantry"
            className="ml-auto rounded-full bg-herb/15 px-4 py-2 text-xs font-bold text-herb-deep transition-transform hover:scale-105 dark:text-herb"
          >
            🥕 What can I cook?
          </Link>
          <Link
            href="/extract"
            className="rounded-full bg-primary/15 px-4 py-2 text-xs font-bold text-primary-deep transition-transform hover:scale-105 dark:text-primary"
          >
            🎬 Extract from video link
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
            <p className="font-serif text-xl">No recipes match those filters</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((r, i) => (
              <RecipeCard
                key={r.slug}
                index={i}
                recipe={{
                  slug: r.slug,
                  title: r.title,
                  titleBn: r.titleBn,
                  image: r.image,
                  cuisine: r.cuisine,
                  cookMinutes: r.cookMinutes,
                  difficulty: r.difficulty,
                  calories: r.calories,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
