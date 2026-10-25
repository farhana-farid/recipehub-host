export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Normalize an ingredient name into a fuzzy match key. */
export function ingredientKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z\u0980-\u09FF\s]/g, "")
    .split(/\s+/)
    .filter((w) => !["fresh", "chopped", "minced", "ground", "large", "small", "sliced", "diced", "boiled", "boneless"].includes(w))
    .sort()
    .join(" ");
}

/** Format seconds as m:ss or mm:ss. */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Human timestamp for step chip: 90 -> "1:30" */
export function fmtTimestamp(seconds?: number | null): string | null {
  if (seconds == null) return null;
  return fmtClock(seconds);
}

export function pct(matched: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
}
