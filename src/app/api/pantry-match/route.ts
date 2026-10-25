import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rankByPantry } from "@/lib/match";

const schema = z.object({
  items: z.array(z.string().min(1).max(60)).max(60),
  diet: z.string().optional(),
  maxCookMinutes: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const recipes = await db.recipe.findMany({
    where: {
      status: "PUBLISHED",
      ...(parsed.data.diet ? { dietTags: { has: parsed.data.diet } } : {}),
      ...(parsed.data.maxCookMinutes ? { cookMinutes: { lte: parsed.data.maxCookMinutes } } : {}),
    },
    include: {
      ingredients: { include: { ingredient: { select: { name: true, nameBn: true, substitutes: true } } } },
    },
  });

  const ranked = rankByPantry(
    recipes.map((r) => ({ recipe: { ...r, titleBn: r.titleBn } })),
    parsed.data.items
  );
  return NextResponse.json(ranked);
}
