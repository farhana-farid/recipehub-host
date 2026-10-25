"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useMe } from "@/components/header";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { RecipeRow, type RecipeCardData } from "@/components/recipe-card";
import { cn } from "@/lib/utils";

interface MyRecipe extends RecipeCardData {
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-herb/15 text-herb-deep dark:text-herb",
  PENDING_REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  REJECTED: "bg-coral/10 text-coral",
};

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();
  const lang = useLang();
  const router = useRouter();

  const mine = useQuery<MyRecipe[]>({
    queryKey: ["my-recipes", me?.id],
    enabled: !!me,
    queryFn: async () => (await fetch("/api/submit")).json(),
  });

  if (isLoading) return <p className="py-20 text-center text-sm text-ink-soft">Loading…</p>;
  if (!me) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
        <p className="font-serif text-xl">{tr("auth.login", lang)}</p>
        <button onClick={() => router.push("/login")} className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-soft dark:bg-obsidian-card">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-parchment text-3xl dark:bg-white/10">
          {me.avatarEmoji}
        </span>
        <div>
          <h1 className="font-serif-title text-2xl">{me.name}</h1>
          <p className="text-sm text-ink-soft dark:text-slate-400">{me.email}</p>
          {me.role === "ADMIN" && (
            <span className="mt-1 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary-deep dark:text-primary">
              Moderator
            </span>
          )}
        </div>
      </section>

      <section aria-label="My submissions">
        <h2 className="mb-4 font-serif-title text-2xl">My submissions</h2>
        {mine.data && mine.data.length > 0 ? (
          <div className="space-y-3">
            {mine.data.map((r) => (
              <div key={r.slug} className="relative rounded-3xl">
                <RecipeRow recipe={r} />
                <span className={cn("absolute right-14 top-4 rounded-full px-2.5 py-1 text-[10px] font-extrabold", STATUS_STYLE[r.status] ?? "")}>
                  {r.status === "PENDING_REVIEW" ? "⏳ PENDING REVIEW" : r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-parchment p-8 text-center shadow-soft dark:bg-obsidian-card">
            <Clock className="mx-auto h-8 w-8 text-primary/50" />
            <p className="mt-2 text-sm text-ink-soft">
              No submissions yet.{" "}
              <Link href="/submit" className="font-bold text-primary-deep hover:underline dark:text-primary">
                Share your first recipe →
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
