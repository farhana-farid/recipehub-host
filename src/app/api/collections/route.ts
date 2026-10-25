import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json([], { status: 401 });
  const collections = await db.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { recipes: { include: { recipe: { select: { slug: true, title: true, titleBn: true, image: true, cookMinutes: true, cuisine: true, difficulty: true } } } } },
  });
  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = z.object({ name: z.string().min(1).max(60), emoji: z.string().max(4).optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const exists = await db.collection.findUnique({ where: { userId_name: { userId: user.id, name: parsed.data.name } } });
  if (exists) return NextResponse.json({ error: "Collection already exists" }, { status: 409 });

  const created = await db.collection.create({
    data: { userId: user.id, name: parsed.data.name, emoji: parsed.data.emoji ?? "📚" },
  });
  return NextResponse.json(created);
}

const patchSchema = z.object({
  collectionId: z.string(),
  slug: z.string(),
  action: z.enum(["add", "remove"]),
});

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const collection = await db.collection.findUnique({ where: { id: parsed.data.collectionId } });
  if (!collection || collection.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recipe = await db.recipe.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  if (parsed.data.action === "add") {
    await db.collectionRecipe.upsert({
      where: { collectionId_recipeId: { collectionId: collection.id, recipeId: recipe.id } },
      create: { collectionId: collection.id, recipeId: recipe.id },
      update: {},
    });
  } else {
    await db.collectionRecipe.deleteMany({ where: { collectionId: collection.id, recipeId: recipe.id } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
