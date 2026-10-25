/* Dumps the seeded database into src/data/demo-data.json for the static demo build. */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const db = new PrismaClient();

async function main() {
  const recipes = await db.recipe.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { select: { name: true } },
      ingredients: {
        include: { ingredient: { select: { name: true, nameBn: true, substitutes: true } } },
      },
      steps: { orderBy: { order: "asc" } },
      videos: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] },
      reviews: { where: { flagged: false }, include: { user: { select: { name: true, avatarEmoji: true } } } },
    },
  });

  const ingredients = await db.ingredient.findMany({
    orderBy: { name: "asc" },
    select: { name: true, nameBn: true, substitutes: true },
  });

  const payload = {
    bakedAt: new Date().toISOString(),
    recipes: recipes.map((r) => {
      const rating = r.reviews.length
        ? Math.round((r.reviews.reduce((a, x) => a + x.rating, 0) / r.reviews.length) * 10) / 10
        : 0;
      return {
        slug: r.slug,
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        image: r.image,
        cuisine: r.cuisine,
        difficulty: r.difficulty,
        baseServings: r.baseServings,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        tags: r.tags,
        dietTags: r.dietTags,
        allergens: r.allergens,
        author: r.author?.name ?? "Community Chef",
        rating,
        reviewCount: r.reviews.length,
        ingredients: r.ingredients.map((ri) => ({
          name: ri.ingredient.name,
          nameBn: ri.ingredient.nameBn,
          quantity: ri.quantity,
          unit: ri.unit,
          note: ri.note,
          optional: ri.optional,
          substitutes: ri.ingredient.substitutes,
        })),
        steps: r.steps.map((s) => ({
          order: s.order,
          text: s.text,
          textBn: s.textBn,
          tip: s.tip,
          tipBn: s.tipBn,
          timerSeconds: s.timerSeconds,
          videoStart: s.videoStart,
          videoEnd: s.videoEnd,
        })),
        videos: r.videos.map((v) => ({
          platform: v.platform,
          videoId: v.videoId,
          originalUrl: v.originalUrl,
          creatorName: v.creatorName,
          creatorHandle: v.creatorHandle,
          isPrimary: v.isPrimary,
        })),
        reviews: r.reviews.map((rv) => ({
          id: rv.id,
          rating: rv.rating,
          body: rv.body,
          createdAt: rv.createdAt.toISOString(),
          user: rv.user,
        })),
      };
    }),
    ingredients,
  };

  const outDir = path.join(__dirname, "..", "src", "data");
  mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, "demo-data.json");
  writeFileSync(file, JSON.stringify(payload));
  console.log(`Baked ${payload.recipes.length} recipes, ${payload.ingredients.length} ingredients -> ${file} (${(JSON.stringify(payload).length / 1024).toFixed(0)} KB)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
