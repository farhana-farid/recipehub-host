import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Ingredient substitution lookup (curated dataset; LLM-provider ready interface). */
export async function GET(req: NextRequest) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  const ingredient = await db.ingredient.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { name: true, nameBn: true, substitutes: true },
  });
  return NextResponse.json(ingredient ?? { name, substitutes: [] });
}
