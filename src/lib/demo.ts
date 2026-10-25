/**
 * Static demo layer — when NEXT_PUBLIC_DEMO_MODE=1 the UI runs entirely
 * client-side on top of src/data/demo-data.json (baked from the database).
 * Server-backed features (login, reviews, submissions) show a demo notice.
 */
import raw from "@/data/demo-data.json";
import { rankByPantry, type MatchInput } from "@/lib/match";

export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export interface DemoIngredient {
  name: string;
  nameBn: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  optional: boolean;
  substitutes: string[];
}

export interface DemoRecipe {
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
  author: string;
  rating: number;
  reviewCount: number;
  ingredients: DemoIngredient[];
  steps: Array<{
    order: number;
    text: string;
    textBn: string | null;
    tip: string | null;
    tipBn: string | null;
    timerSeconds: number | null;
    videoStart: number | null;
    videoEnd: number | null;
  }>;
  videos: Array<{
    platform: string;
    videoId: string;
    originalUrl: string;
    creatorName: string;
    creatorHandle: string | null;
    isPrimary: boolean;
  }>;
  reviews: Array<{ id: string; rating: number; body: string | null; createdAt: string; user: { name: string; avatarEmoji: string } }>;
}

const recipes = raw.recipes as DemoRecipe[];

export function getDemoRecipes(): DemoRecipe[] {
  return recipes;
}

export function getDemoRecipe(slug: string): DemoRecipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function getDemoRecipeSlugs(): string[] {
  return recipes.map((r) => r.slug);
}

export function getDemoIngredients(): Array<{ name: string; nameBn: string | null; substitutes: string[] }> {
  return raw.ingredients;
}

export function getDemoReels() {
  const VERTICAL = ["YOUTUBE_SHORTS", "INSTAGRAM_REEL", "TIKTOK", "FACEBOOK_REEL"];
  return recipes
    .flatMap((r) => r.videos.map((v) => ({ ...v, recipe: { slug: r.slug, title: r.title, titleBn: r.titleBn } })))
    .filter((v) => VERTICAL.includes(v.platform))
    .slice(0, 10)
    .map((v) => ({
      slug: v.recipe.slug,
      title: v.recipe.title,
      titleBn: v.recipe.titleBn,
      videoUrl: v.originalUrl,
      platform: v.platform,
      videoId: v.videoId,
      creatorName: v.creatorName,
    }));
}

/** Client-side omni-search over the baked dataset (EN + বাংলা). */
export function demoSearch(
  q: string,
  opts: { diet?: string; exclude?: string[]; maxCook?: number } = {}
): DemoRecipe[] {
  const needle = q.trim().toLowerCase();
  return recipes.filter((r) => {
    if (opts.diet && !r.dietTags.includes(opts.diet)) return false;
    if (opts.exclude?.some((a) => r.allergens.includes(a))) return false;
    if (opts.maxCook && r.cookMinutes > opts.maxCook) return false;
    if (!needle) return true;
    const haystack = [
      r.title,
      r.titleBn ?? "",
      r.description,
      r.cuisine,
      ...r.tags,
      ...r.dietTags,
      ...r.ingredients.flatMap((i) => [i.name, i.nameBn ?? ""]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/** Client-side pantry ranking using the exact same algorithm as the server. */
export function demoPantryMatch(items: string[], opts: { diet?: string; maxCookMinutes?: number } = {}) {
  const inputs: MatchInput[] = recipes
    .filter((r) => (!opts.diet || r.dietTags.includes(opts.diet)) && (!opts.maxCookMinutes || r.cookMinutes <= opts.maxCookMinutes))
    .map((r) => ({ recipe: r as unknown as MatchInput["recipe"] }));
  return rankByPantry(inputs, items);
}
