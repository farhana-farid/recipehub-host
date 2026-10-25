import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json([], { status: 401 });
  const expand = new URL(req.url).searchParams.get("expand");
  const favs = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: expand
      ? { recipe: { select: { slug: true, title: true, titleBn: true, image: true, cuisine: true, cookMinutes: true, difficulty: true, calories: true } } }
      : { recipe: { select: { slug: true } } },
  });
  return NextResponse.json(favs.map((f) => (expand ? f.recipe : f.recipe.slug)));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = z.object({ slug: z.string() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const recipe = await db.recipe.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const existing = await db.favorite.findUnique({
    where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } },
  });
  if (existing) {
    await db.favorite.delete({ where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } } });
    return NextResponse.json({ favorited: false });
  }
  await db.favorite.create({ data: { userId: user.id, recipeId: recipe.id } });
  return NextResponse.json({ favorited: true });
}
