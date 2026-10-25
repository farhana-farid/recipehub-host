"use client";

import { Flame, Beef, Wheat, Droplet } from "lucide-react";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";

export function NutritionPills({ calories, protein, carbs, fat }: { calories: number; protein: number; carbs: number; fat: number }) {
  const lang = useLang();
  const items = [
    { icon: Flame, label: tr("label.calories", lang), value: `${calories}`, unit: "kcal", tint: "text-coral bg-coral/10" },
    { icon: Beef, label: "Protein", value: `${protein}`, unit: "g", tint: "text-primary-deep bg-primary/10" },
    { icon: Wheat, label: "Carbs", value: `${carbs}`, unit: "g", tint: "text-amber-600 bg-amber-500/10" },
    { icon: Droplet, label: "Fat", value: `${fat}`, unit: "g", tint: "text-herb-deep bg-herb/10" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ icon: Icon, label, value, unit, tint }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft dark:bg-obsidian-card">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-ink-soft dark:text-slate-400">{label}</p>
            <p className="text-base font-bold leading-tight">
              {value}
              <span className="text-xs font-medium text-ink-soft"> {unit}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
