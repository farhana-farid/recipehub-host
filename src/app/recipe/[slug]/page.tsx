import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipe-detail";
import { Reviews } from "@/components/reviews";
import { RecipeRow, type RecipeCardData } from "@/components/recipe-card";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await db.recipe.findUnique({ where: { slug }, select: { title: true, description: true, image: true } });
  if (!recipe) return { title: "Recipe not found — RecipeHub" };
  return {
    title: `${recipe.title} — RecipeHub`,
    description: recipe.description,
    openGraph: { images: recipe.image ? [recipe.image] : [] },
  };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await db.recipe.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      ingredients: {
        orderBy: { ingredientId: "asc" },
        include: { ingredient: { select: { name: true, nameBn: true, substitutes: true } } },
      },
      steps: { orderBy: { order: "asc" } },
      videos: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] },
      reviews: { where: { flagged: false }, select: { rating: true } },
    },
  });
  if (!recipe) notFound();

  const rating = recipe.reviews.length
    ? recipe.reviews.reduce((a, r) => a + r.rating, 0) / recipe.reviews.length
    : 0;

  const related = await db.recipe.findMany({
    where: { status: "PUBLISHED", cuisine: recipe.cuisine, slug: { not: recipe.slug } },
    take: 3,
    select: { slug: true, title: true, titleBn: true, image: true, cuisine: true, cookMinutes: true, difficulty: true },
  });

  return (
    <div className="space-y-10">
      <RecipeDetail
        recipe={{
          slug: recipe.slug,
          title: recipe.title,
          titleBn: recipe.titleBn,
          description: recipe.description,
          descriptionBn: recipe.descriptionBn,
          image: recipe.image,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
          baseServings: recipe.baseServings,
          prepMinutes: recipe.prepMinutes,
          cookMinutes: recipe.cookMinutes,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          tags: recipe.tags,
          dietTags: recipe.dietTags,
          allergens: recipe.allergens,
        }}
        author={recipe.author?.name ?? "Community Chef"}
        ingredients={recipe.ingredients.map((ri) => ({
          name: ri.ingredient.name,
          nameBn: ri.ingredient.nameBn,
          quantity: ri.quantity,
          unit: ri.unit,
          note: ri.note,
          optional: ri.optional,
          substitutes: ri.ingredient.substitutes,
        }))}
        steps={recipe.steps.map((s) => ({
          order: s.order,
          text: s.text,
          textBn: s.textBn,
          tip: s.tip,
          tipBn: s.tipBn,
          timerSeconds: s.timerSeconds,
          videoStart: s.videoStart,
          videoEnd: s.videoEnd,
        }))}
        videos={recipe.videos.map((v) => ({
          platform: v.platform,
          videoId: v.videoId,
          originalUrl: v.originalUrl,
          creatorName: v.creatorName,
          creatorHandle: v.creatorHandle,
          isPrimary: v.isPrimary,
          thumbnailUrl: v.thumbnailUrl,
        }))}
      />

      <Reviews slug={recipe.slug} rating={rating} count={recipe.reviews.length} />

      {related.length > 0 && (
        <section aria-label="Related recipes">
          <h2 className="mb-4 font-serif-title text-2xl">More {recipe.cuisine} recipes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RecipeRow key={r.slug} recipe={r as unknown as RecipeCardData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
