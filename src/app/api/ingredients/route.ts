import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Ingredient list for the pantry picker. */
export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const ingredients = await db.ingredient.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameBn: { contains: q } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
    take: 80,
    select: { name: true, nameBn: true, substitutes: true },
  });
  return NextResponse.json(ingredients);
}
