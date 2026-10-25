import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Omni-search: titles, descriptions, cuisine, tags, diet tags and ingredients. */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const diet = sp.get("diet");
  const cuisine = sp.get("cuisine");
  const maxCalories = sp.get("maxCalories");
  const exclude = sp.get("exclude"); // comma-separated allergens
  const maxCook = sp.get("maxCook");

  const where: Prisma.RecipeWhereInput = {
    status: "PUBLISHED",
  };
  if (diet) where.dietTags = { has: diet };
  if (cuisine) where.cuisine = cuisine;
  if (maxCalories) where.calories = { lte: parseInt(maxCalories, 10) || 99999 };
  if (maxCook) where.cookMinutes = { lte: parseInt(maxCook, 10) || 9999 };
  if (exclude) {
    const list = exclude.split(",").map((a) => a.trim()).filter(Boolean);
    if (list.length) where.NOT = { allergens: { hasSome: list } };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { titleBn: { contains: q } },
      { description: { contains: q, mode: "insensitive" } },
      { cuisine: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
      { dietTags: { has: q.toLowerCase() } },
      { ingredients: { some: { ingredient: { name: { contains: q, mode: "insensitive" } } } } },
      { ingredients: { some: { ingredient: { nameBn: { contains: q } } } } },
    ];
  }

  const recipes = await db.recipe.findMany({
    where,
    orderBy: [{ createdAt: "asc" }],
    take: 30,
    select: {
      slug: true, title: true, titleBn: true, image: true, cuisine: true, difficulty: true,
      cookMinutes: true, calories: true, dietTags: true, tags: true,
      ingredients: { select: { ingredient: { select: { name: true, nameBn: true, substitutes: true } }, optional: true } },
    },
  });

  return NextResponse.json(recipes);
}
