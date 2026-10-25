import Link from "next/link";
import { cn } from "@/lib/utils";

/** Cuisine/diet filter chips rendered as links that toggle the query param. */
export function chipsFor(cuisines: string[], sp: { cuisine?: string; diet?: string; tag?: string; maxCalories?: string }) {
  function href(patch: Record<string, string | undefined>) {
    const next = { ...sp, ...patch };
    const qs = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return qs ? `/?${qs}` : "/";
  }
  const hasAny = sp.cuisine || sp.diet || sp.tag || sp.maxCalories;

  return (
    <>
      <Link
        href="/"
        className={cn(
          "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
          !hasAny ? "bg-primary text-white shadow-glow" : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
        )}
      >
        All
      </Link>
      {cuisines.map((c) => (
        <Link
          key={c}
          href={href({ cuisine: sp.cuisine === c ? undefined : c })}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
            sp.cuisine === c
              ? "bg-primary text-white shadow-glow"
              : "bg-white text-ink-soft shadow-soft dark:bg-obsidian-card dark:text-slate-300"
          )}
        >
          {c}
        </Link>
      ))}
      <Link
        href={href({ diet: sp.diet === "vegan" ? undefined : "vegan" })}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105",
          sp.diet === "vegan"
            ? "bg-herb text-white shadow-glow"
            : "bg-herb/10 text-herb-deep shadow-soft dark:text-herb"
        )}
      >
        🌱 Vegan
      </Link>
    </>
  );
}
