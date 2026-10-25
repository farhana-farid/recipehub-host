"use client";

import { Check, Plus, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChecklist } from "@/store/pantry";
import { usePantry } from "@/store/pantry";
import { useLang } from "@/components/providers";
import { pick, tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { fmtQuantity } from "@/lib/quantity";

export interface ChecklistIngredient {
  name: string;
  nameBn?: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  optional: boolean;
  substitutes: string[];
}

interface Props {
  slug: string;
  ingredients: ChecklistIngredient[];
  scale: number;
}

/** Smart ingredient checklist: strike-off items, add to pantry, show substitutions. */
export function IngredientChecklist({ slug, ingredients, scale }: Props) {
  const lang = useLang();
  const { checked, toggle, setAll } = useChecklist();
  const pantry = usePantry();
  const done = checked[slug] ?? [];
  const names = ingredients.map((i) => i.name);
  const allDone = names.length > 0 && names.every((n) => done.includes(n));
  const progress = Math.round((done.length / Math.max(1, names.length)) * 100);

  function addAllToPantry() {
    for (const n of names) pantry.add(n);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-serif-title text-xl">{tr("section.ingredients", lang)}</h2>
          <span className="rounded-full bg-herb/15 px-2 py-0.5 text-[11px] font-bold text-herb-deep dark:text-herb">
            {done.length}/{names.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={addAllToPantry}
            className="flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary-deep transition-transform hover:scale-105 dark:text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> {tr("label.addAll", lang)}
          </button>
          <button
            onClick={() => setAll(slug, names, !allDone)}
            className="flex items-center gap-1 rounded-full border border-herb/40 px-3 py-1.5 text-xs font-semibold text-herb-deep transition-transform hover:scale-105 dark:text-herb"
          >
            <Check className="h-3.5 w-3.5" /> {allDone ? "Reset" : "All"}
          </button>
        </div>
      </div>

      {/* Progress hairline */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-cream-deep dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-coral"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <ul className="space-y-1.5">
        {ingredients.map((ing) => {
          const isDone = done.includes(ing.name);
          return (
            <li key={ing.name}>
              <motion.button
                layout
                onClick={() => toggle(slug, ing.name)}
                whileTap={{ scale: 0.985 }}
                aria-pressed={isDone}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  isDone ? "bg-herb/10" : "bg-parchment hover:bg-cream-deep dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                    isDone ? "border-herb bg-herb text-white" : "border-ink-soft/40 text-transparent dark:border-slate-500"
                  )}
                >
                  <AnimatePresence>
                    {isDone && (
                      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("flex flex-wrap items-baseline gap-x-2", isDone && "strike-line text-ink-soft")}>
                    <span className="font-semibold">
                      {fmtQuantity(ing.quantity, scale)}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </span>
                    <span>{pick(lang, ing.name, ing.nameBn)}</span>
                    {ing.optional && (
                      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-soft ring-1 ring-ink-soft/20 dark:bg-white/10">
                        optional
                      </span>
                    )}
                  </span>
                  {ing.note && !isDone && <span className="text-xs text-ink-soft dark:text-slate-400"> · {ing.note}</span>}
                  {ing.substitutes.length > 0 && (
                    <span className="mt-0.5 flex items-start gap-1 text-[11px] text-herb-deep dark:text-herb">
                      <Repeat className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>
                        {tr("label.substitute", lang)}: {ing.substitutes.join(", ")}
                      </span>
                    </span>
                  )}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
