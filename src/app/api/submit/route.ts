import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { parseVideoSource } from "@/lib/video-parser";
import type { VideoPlatform } from "@prisma/client";

/** parser emits lowercase platform names; Prisma enum is uppercase. */
const PLATFORM_ENUM: Record<string, VideoPlatform> = {
  youtube: "YOUTUBE",
  youtube_shorts: "YOUTUBE_SHORTS",
  instagram_reel: "INSTAGRAM_REEL",
  tiktok: "TIKTOK",
  facebook_reel: "FACEBOOK_REEL",
};

const ingredientSchema = z.object({
  name: z.string().min(1).max(80),
  quantity: z.number().positive().max(10000).nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  optional: z.boolean().optional(),
});

const stepSchema = z.object({
  text: z.string().min(3).max(1000),
  timerSeconds: z.number().int().min(5).max(24 * 60 * 60).nullable().optional(),
});

const videoSchema = z.object({ url: z.string().url().max(500) });

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  cuisine: z.string().min(2).max(40),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  baseServings: z.number().int().min(1).max(24),
  prepMinutes: z.number().int().min(0).max(1440),
  cookMinutes: z.number().int().min(1).max(1440),
  calories: z.number().int().min(0).max(5000),
  protein: z.number().int().min(0).max(400),
  carbs: z.number().int().min(0).max(600),
  fat: z.number().int().min(0).max(400),
  tags: z.array(z.string().max(24)).max(8).default([]),
  dietTags: z.array(z.string().max(24)).max(6).default([]),
  allergens: z.array(z.string().max(24)).max(8).default([]),
  image: z.string().min(1).max(600),
  ingredients: z.array(ingredientSchema).min(2).max(40),
  steps: z.array(stepSchema).min(2).max(30),
  videos: z.array(videoSchema).max(3).default([]),
});

// A user's own submissions with moderation status.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json([], { status: 401 });
  const recipes = await db.recipe.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    select: { slug: true, title: true, titleBn: true, image: true, cuisine: true, cookMinutes: true, difficulty: true, calories: true, status: true, createdAt: true },
  });
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Base slug, then de-dupe with a numeric suffix.
  let slug = slugify(d.title) || `recipe-${Date.now()}`;
  const clash = await db.recipe.findUnique({ where: { slug }, select: { id: true } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const created = await db.recipe.create({
    data: {
      slug,
      title: d.title,
      description: d.description,
      image: d.image,
      cuisine: d.cuisine,
      difficulty: d.difficulty,
      baseServings: d.baseServings,
      prepMinutes: d.prepMinutes,
      cookMinutes: d.cookMinutes,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      tags: d.tags.map((t) => t.toLowerCase()),
      dietTags: d.dietTags,
      allergens: d.allergens,
      status: "PENDING_REVIEW",
      authorId: user.id,
      ingredients: {
        create: await Promise.all(
          d.ingredients.map(async (i) => {
            const ing = await db.ingredient.upsert({
              where: { name: i.name.toLowerCase().trim() },
              create: { name: i.name.toLowerCase().trim(), key: i.name.toLowerCase().trim() },
              update: {},
            });
            return { ingredientId: ing.id, quantity: i.quantity ?? null, unit: i.unit ?? null, optional: i.optional ?? false };
          })
        ),
      },
      steps: {
        create: d.steps.map((s, idx) => ({
          order: idx + 1,
          text: s.text,
          timerSeconds: s.timerSeconds ?? null,
        })),
      },
      videos: {
        create: d.videos.map((v) => {
          const p = parseVideoSource(v.url);
          return {
            platform: (p.platform && PLATFORM_ENUM[p.platform]) ?? "YOUTUBE",
            originalUrl: p.originalUrl,
            videoId: p.videoId ?? v.url.slice(0, 120),
            creatorName: p.platform ? p.label : "Linked video",
            isPrimary: false,
          };
        }),
      },
    },
  });

  return NextResponse.json({ ok: true, slug: created.slug, status: created.status });
}
