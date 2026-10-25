/** Set-intersection pantry matching — ranks recipes by ingredient coverage. */

export interface MatchInput {
  recipe: {
    slug: string;
    title: string;
    titleBn: string | null;
    image: string;
    cuisine: string;
    difficulty: string;
    cookMinutes: number;
    calories: number;
    ingredients: Array<{
      ingredient: { name: string; nameBn: string | null; substitutes: string[] };
      quantity: number | null;
      unit: string | null;
      optional: boolean;
    }>;
  };
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */

export interface MatchResult {
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

function norm(s: string): string {
  return s.toLowerCase().trim();
}

/** Does the pantry item cover the ingredient? Substring match both ways handles plurals/variants. */
function covers(pantryItem: string, ingredientName: string): boolean {
  const p = norm(pantryItem);
  const i = norm(ingredientName);
  if (p === i) return true;
  if (p.length >= 3 && (i.includes(p) || p.includes(i))) return true;
  // singular/plural leniency
  const pSingular = p.endsWith("s") ? p.slice(0, -1) : p;
  const iSingular = i.endsWith("s") ? i.slice(0, -1) : i;
  return pSingular.length >= 3 && (iSingular.includes(pSingular) || pSingular.includes(iSingular));
}

export function rankByPantry(recipes: MatchInput[], pantryItems: string[]): MatchResult[] {
  const results = recipes.map<MatchResult>((r) => {
    const ingredients = r.recipe.ingredients;
    const matched = new Set<number>();
    const missing: string[] = [];
    const missingBn: MatchResult["missingItemsBn"] = [];

    for (const [i, ri] of ingredients.entries()) {
      const hit = pantryItems.some((p) => covers(p, ri.ingredient.name));
      if (hit) matched.add(i);
      else if (!ri.optional) {
        missing.push(ri.ingredient.name);
        missingBn.push({ en: ri.ingredient.name, bn: ri.ingredient.nameBn, substitutes: ri.ingredient.substitutes });
      }
    }

    const total = ingredients.filter((x) => !x.optional).length || ingredients.length;
    const matchPct = total === 0 ? 0 : Math.round((matched.size / total) * 100);

    return {
      slug: r.recipe.slug,
      title: r.recipe.title,
      titleBn: r.recipe.titleBn,
      image: r.recipe.image,
      cuisine: r.recipe.cuisine,
      difficulty: r.recipe.difficulty,
      cookMinutes: r.recipe.cookMinutes,
      calories: r.recipe.calories,
      matchPct,
      matchedCount: matched.size,
      totalCount: total,
      missingItems: missing,
      missingItemsBn: missingBn,
    };
  });

  return results.sort((a, b) => b.matchPct - a.matchPct || b.matchedCount - a.matchedCount || a.cookMinutes - b.cookMinutes);
}
