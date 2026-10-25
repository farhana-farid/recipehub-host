import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      hashedPassword: await bcrypt.hash(password, 10),
    },
  });
  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, avatarEmoji: user.avatarEmoji, role: user.role });
}
