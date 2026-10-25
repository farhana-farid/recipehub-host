"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Flame } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

export interface RecipeCardData {
  slug: string;
  title: string;
  titleBn?: string | null;
  image: string;
  cuisine: string;
  cookMinutes: number;
  difficulty: string;
  calories?: number;
  matchPct?: number;
  missing?: number;
  missingItems?: string[];
}

const DIFFICULTY_LABEL: Record<string, { en: string; bn: string }> = {
  EASY: { en: "Easy", bn: "সহজ" },
  MEDIUM: { en: "Medium", bn: "মাঝারি" },
  HARD: { en: "Hard", bn: "কঠিন" },
};

export function localizedTitle(r: { title: string; titleBn?: string | null }, lang: Lang) {
  return lang === "bn" && r.titleBn ? r.titleBn : r.title;
}

export function RecipeCard({ recipe, index = 0 }: { recipe: RecipeCardData; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className="group relative"
    >
      <Link
        href={`/recipe/${recipe.slug}`}
        className="block overflow-hidden rounded-3xl bg-white shadow-soft transition-shadow hover:shadow-lift dark:bg-obsidian-card"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur dark:bg-black/50 dark:text-white">
            {recipe.cuisine}
          </span>
          {recipe.matchPct != null && (
            <span
              className={cn(
                "absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-glow",
                recipe.matchPct >= 100 ? "bg-herb" : recipe.matchPct >= 60 ? "bg-primary" : "bg-ink/70"
              )}
            >
              {recipe.matchPct}% Match
              {recipe.missing ? ` · Missing ${recipe.missing}` : ""}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-serif-title line-clamp-1 text-lg">{recipe.title}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-soft dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> {recipe.cookMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-coral" /> {recipe.calories ?? "—"} kcal
            </span>
            <span className="ml-auto font-semibold">
              {DIFFICULTY_LABEL[recipe.difficulty]?.en ?? recipe.difficulty}
            </span>
          </div>
          {recipe.missingItems && recipe.missingItems.length > 0 && (
            <p className="mt-2 line-clamp-1 text-[11px] text-ink-soft dark:text-slate-400">
              Missing: {recipe.missingItems.join(", ")}
            </p>
          )}
        </div>
      </Link>
      <FavoriteButton slug={recipe.slug} className="absolute right-3 top-3" />
    </motion.article>
  );
}

/** Circular-thumb row card from the reference design. */
export function RecipeRow({ recipe }: { recipe: RecipeCardData }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Link
        href={`/recipe/${recipe.slug}`}
        className="flex items-center gap-4 rounded-3xl bg-white p-3 pr-5 shadow-soft dark:bg-obsidian-card"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-parchment dark:ring-white/10">
          <Image src={recipe.image} alt={recipe.title} fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif-title line-clamp-2 text-[15px] leading-snug">{recipe.title}</h3>
          <p className="mt-1 text-xs text-ink-soft dark:text-slate-400">{recipe.cookMinutes}m Cook Time</p>
        </div>
      </Link>
    </motion.div>
  );
}
