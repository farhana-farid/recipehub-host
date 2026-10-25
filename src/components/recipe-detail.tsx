"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Minus, Plus, PlayCircle, Users, ChefHat } from "lucide-react";
import { IngredientChecklist, type ChecklistIngredient } from "@/components/ingredient-checklist";
import { NutritionPills } from "@/components/nutrition-pills";
import { VideoEmbed } from "@/components/video-embed";
import { CookingMode, type CookingStep } from "@/components/cooking-mode";
import { CollectionPicker } from "@/components/collection-picker";
import { useLang } from "@/components/providers";
import { tr, pick } from "@/lib/i18n";
import { cn, fmtTimestamp } from "@/lib/utils";
import { fmtQuantity } from "@/lib/quantity";

export interface DetailVideo {
  platform: string;
  videoId: string;
  originalUrl: string;
  creatorName: string;
  creatorHandle: string | null;
  isPrimary: boolean;
  thumbnailUrl: string | null;
}

interface Props {
  recipe: {
    slug: string;
    title: string;
    titleBn: string | null;
    description: string;
    descriptionBn: string | null;
    image: string;
    cuisine: string;
    difficulty: string;
    baseServings: number;
    prepMinutes: number;
    cookMinutes: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    tags: string[];
    dietTags: string[];
    allergens: string[];
  };
  author: string | null;
  ingredients: ChecklistIngredient[];
  steps: CookingStep[];
  videos: DetailVideo[];
}

const DIFF_LABEL: Record<string, { en: string; bn: string }> = {
  EASY: { en: "Easy", bn: "সহজ" },
  MEDIUM: { en: "Medium", bn: "মাঝারি" },
  HARD: { en: "Hard", bn: "কঠিন" },
};

export function RecipeDetail({ recipe, author, ingredients, steps, videos }: Props) {
  const lang = useLang();
  const [servings, setServings] = useState(recipe.baseServings);
  const [cooking, setCooking] = useState(false);
  const [activeVideo, setActiveVideo] = useState(0);

  const scale = servings / recipe.baseServings;
  const primary = videos.find((v) => v.isPrimary) ?? videos[0] ?? null;
  const timerCount = steps.filter((s) => s.timerSeconds).length;
  const syncCount = steps.filter((s) => s.videoStart != null).length;

  return (
    <article>
      {/* Hero */}
      <div className="relative -mx-4 mb-5 aspect-[16/10] overflow-hidden md:mx-0 md:aspect-[21/9] md:rounded-3xl">
        <Image src={recipe.image} alt={recipe.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {recipe.dietTags.map((t) => (
              <span key={t} className="rounded-full bg-herb/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                {t}
              </span>
            ))}
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur">
              {recipe.cuisine}
            </span>
          </div>
          <h1 className="font-serif-title max-w-3xl text-3xl leading-tight text-white md:text-5xl">
            {pick(lang, recipe.title, recipe.titleBn)}
          </h1>
          {author && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <ChefHat className="h-4 w-4" /> {author}
              </span>
              <span>·</span>
              <span className="underline">View Chef Profile</span>
              <span className="ml-1 rounded-full bg-white/90 px-1 shadow-soft dark:bg-white/10">
                <CollectionPicker slug={recipe.slug} />
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mb-5 max-w-3xl text-[15px] leading-relaxed text-ink/80 dark:text-slate-300">
        {pick(lang, recipe.description, recipe.descriptionBn)}
      </p>

      {/* Stat row — reference design */}
      <div className="mb-6 grid grid-cols-4 gap-2 rounded-3xl bg-white p-4 shadow-soft dark:bg-obsidian-card">
        {[
          { label: tr("label.skillLevel", lang), value: DIFF_LABEL[recipe.difficulty]?.[lang] ?? recipe.difficulty },
          { label: tr("label.cookTime", lang), value: `${recipe.cookMinutes}m` },
          { label: tr("label.ingredients", lang), value: String(ingredients.length) },
          { label: tr("label.calories", lang), value: String(recipe.calories) },
        ].map((s) => (
          <div key={s.label} className="text-center sm:text-left">
            <p className="text-[11px] font-medium text-ink-soft dark:text-slate-400">{s.label}</p>
            <p className="text-base font-extrabold sm:text-lg">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Allergen strip */}
      {recipe.allergens.length > 0 && (
        <p className="mb-6 text-xs text-ink-soft dark:text-slate-400">
          Contains: {recipe.allergens.map((a) => a.replace("-", " ")).join(" · ")}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        {/* Left: ingredients + nutrition */}
        <div className="space-y-8">
          {/* Serving scaler — "Cooking for: 05" */}
          <div className="flex items-center justify-between rounded-3xl bg-primary/10 p-4 dark:bg-primary/15">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft dark:bg-obsidian-card">
                <Users className="h-5 w-5 text-primary-deep dark:text-primary" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-ink-soft dark:text-slate-400">{tr("label.cookingFor", lang)}</p>
                <p className="text-lg font-extrabold leading-tight">
                  : {String(servings).padStart(2, "0")}{" "}
                  <span className="text-xs font-semibold text-ink-soft">{tr("label.servings", lang)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setServings((s) => Math.max(1, s === recipe.baseServings * 2 ? recipe.baseServings : s - 1))}
                aria-label="Decrease servings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft transition-transform hover:scale-110 active:scale-90 dark:bg-obsidian-card"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setServings((s) => Math.min(24, s + 1))}
                aria-label="Increase servings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-transform hover:scale-110 active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <IngredientChecklist slug={recipe.slug} ingredients={ingredients} scale={scale} />

          <section aria-label={tr("section.nutrition", lang)}>
            <h2 className="mb-3 font-serif-title text-xl">{tr("section.nutrition", lang)}</h2>
            <NutritionPills
              calories={Math.round(recipe.calories * scale)}
              protein={Math.round(recipe.protein * scale)}
              carbs={Math.round(recipe.carbs * scale)}
              fat={Math.round(recipe.fat * scale)}
            />
          </section>
        </div>

        {/* Right: videos + steps (dual display) */}
        <div className="space-y-6">
          {videos.length > 0 && (
            <div>
              {videos.length > 1 && (
                <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
                  {videos.map((v, i) => (
                    <button
                      key={v.videoId + i}
                      onClick={() => setActiveVideo(i)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                        i === activeVideo
                          ? "bg-primary text-white shadow-glow"
                          : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
                      )}
                    >
                      {v.creatorName}
                    </button>
                  ))}
                </div>
              )}
              <VideoEmbed url={videos[activeVideo].originalUrl} title={recipe.title} />
            </div>
          )}

          <section aria-label={tr("section.steps", lang)}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif-title text-xl">{tr("section.steps", lang)}</h2>
              <span className="text-[11px] font-semibold text-ink-soft dark:text-slate-400">
                {syncCount > 0 && `${syncCount} steps synced to video`}
                {syncCount > 0 && timerCount > 0 && " · "}
                {timerCount > 0 && `${timerCount} timers`}
              </span>
            </div>

            <ol className="space-y-3">
              {steps.map((s, i) => (
                <motion.li
                  key={s.order}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card"
                >
                  <div className="flex gap-4">
                    <span className="font-serif text-4xl font-bold leading-none text-primary/30">
                      {String(s.order).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-relaxed">{pick(lang, s.text, s.textBn)}</p>
                      {s.tip && (
                        <div className="mt-2.5 rounded-xl border-l-4 border-primary bg-parchment px-3 py-2 dark:bg-white/5">
                          <p className="text-xs italic leading-relaxed text-ink/75 dark:text-slate-300">
                            <span className="font-bold not-italic text-primary-deep dark:text-primary">Tip: </span>
                            {pick(lang, s.tip, s.tipBn)}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {fmtTimestamp(s.videoStart) && (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            <PlayCircle className="h-3 w-3" /> clip {fmtTimestamp(s.videoStart)}
                            {s.videoEnd ? `–${fmtTimestamp(s.videoEnd)}` : ""}
                          </span>
                        )}
                        {s.timerSeconds ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Clock className="h-3 w-3" /> {Math.round(s.timerSeconds / 60)} min timer
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Start cooking — floating CTA like the reference */}
      <div className="sticky bottom-20 z-30 mt-8 flex justify-center md:bottom-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCooking(true)}
          className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-coral px-8 py-4 text-base font-extrabold text-white shadow-glow"
        >
          <PlayCircle className="h-5 w-5" />
          {tr("action.startCooking", lang)}
        </motion.button>
      </div>

      {cooking && primary && (
        <CookingMode
          slug={recipe.slug}
          title={pick(lang, recipe.title, recipe.titleBn)}
          steps={steps}
          primaryVideoUrl={primary.originalUrl}
          onClose={() => setCooking(false)}
        />
      )}
      {cooking && !primary && (
        <CookingMode
          slug={recipe.slug}
          title={pick(lang, recipe.title, recipe.titleBn)}
          steps={steps}
          primaryVideoUrl={null}
          onClose={() => setCooking(false)}
        />
      )}
    </article>
  );
}

export function fmtQtySafe(q: number | null, scale: number) {
  return fmtQuantity(q, scale);
}
