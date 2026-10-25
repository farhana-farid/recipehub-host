import { db } from "@/lib/db";
import { Hero } from "@/components/hero";
import { ReelCarousel, type ReelItem } from "@/components/reel-carousel";
import { RecipeCard, type RecipeCardData } from "@/components/recipe-card";
import { chipsFor } from "@/components/filter-chips";
import { parseVideoSource } from "@/lib/video-parser";
import Link from "next/link";

export const dynamic = "force-dynamic";

const VERTICAL = ["YOUTUBE_SHORTS", "INSTAGRAM_REEL", "TIKTOK", "FACEBOOK_REEL"] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; diet?: string; tag?: string; maxCalories?: string }>;
}) {
  const sp = await searchParams;

  const where = {
    status: "PUBLISHED" as const,
    ...(sp.cuisine ? { cuisine: sp.cuisine } : {}),
    ...(sp.diet ? { dietTags: { has: sp.diet } } : {}),
    ...(sp.tag ? { tags: { has: sp.tag } } : {}),
    ...(sp.maxCalories ? { calories: { lte: parseInt(sp.maxCalories, 10) || 9999 } } : {}),
  };

  const [recipes, reelVideos, cuisines] = await Promise.all([
    db.recipe.findMany({
      where,
      orderBy: [{ createdAt: "asc" }],
      take: 24,
      include: { reviews: { where: { flagged: false }, select: { rating: true } } },
    }),
    db.video.findMany({
      where: { platform: { in: [...VERTICAL] }, recipe: { status: "PUBLISHED" } },
      include: { recipe: { select: { slug: true, title: true, titleBn: true } } },
      take: 10,
    }),
    db.recipe.findMany({ where: { status: "PUBLISHED" }, select: { cuisine: true }, distinct: ["cuisine"] }),
  ]);

  const reels: ReelItem[] = reelVideos.map((v) => ({
    slug: v.recipe.slug,
    title: v.recipe.title,
    titleBn: v.recipe.titleBn,
    videoUrl: v.originalUrl,
    platform: v.platform,
    videoId: v.videoId,
    creatorName: v.creatorName,
    thumbnailUrl: parseVideoSource(v.originalUrl).thumbnailUrl,
  }));

  const cards: RecipeCardData[] = recipes.map((r) => ({
    slug: r.slug,
    title: r.title,
    titleBn: r.titleBn,
    image: r.image,
    cuisine: r.cuisine,
    cookMinutes: r.cookMinutes,
    difficulty: r.difficulty,
    calories: r.calories,
  }));

  return (
    <div className="space-y-10">
      <Hero />

      {reels.length > 0 && <section id="browse-reels"><ReelCarousel reels={reels} /></section>}

      <section aria-label="Browse recipes">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 font-serif-title text-2xl">Trending Recipes</h2>
          {chipsFor(cuisines.map((c) => c.cuisine), sp)}
          <Link
            href="/pantry"
            className="ml-auto rounded-full bg-herb/15 px-4 py-2 text-xs font-bold text-herb-deep transition-transform hover:scale-105 dark:text-herb"
          >
            🥕 What can I cook?
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
            <p className="font-serif text-xl">No recipes match those filters</p>
            <p className="mt-1 text-sm text-ink-soft">Try clearing a chip or check the pantry matcher.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((r, i) => (
              <RecipeCard key={r.slug} recipe={r} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
