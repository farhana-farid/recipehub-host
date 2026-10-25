import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json([]);
  const reviews = await db.review.findMany({
    where: { recipe: { slug }, flagged: false },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, avatarEmoji: true } } },
  });
  return NextResponse.json(reviews);
}

const postSchema = z.object({ slug: z.string(), rating: z.number().int().min(1).max(5), body: z.string().max(2000).optional() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const recipe = await db.recipe.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const review = await db.review.upsert({
    where: { recipeId_userId: { recipeId: recipe.id, userId: user.id } },
    create: { recipeId: recipe.id, userId: user.id, rating: parsed.data.rating, body: parsed.data.body ?? null },
    update: { rating: parsed.data.rating, body: parsed.data.body ?? null, flagged: false },
    include: { user: { select: { name: true, avatarEmoji: true } } },
  });
  return NextResponse.json(review);
}

export async function PATCH(req: NextRequest) {
  const parsed = z.object({ id: z.string() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const review = await db.review.update({ where: { id: parsed.data.id }, data: { flagged: true } }).catch(() => null);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, flagged: true });
}

// Moderation: admins can unflag or hard-delete
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.review.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
