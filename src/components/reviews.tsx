"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useMe } from "@/components/header";

interface ReviewDto {
  id: string;
  rating: number;
  body: string | null;
  flagged: boolean;
  createdAt: string;
  user: { name: string; avatarEmoji: string };
}

export function StarRating({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-ink-soft/40")}
        />
      ))}
    </span>
  );
}

export function Reviews({ slug, rating, count }: { slug: string; rating: number; count: number }) {
  const lang = useLang();
  const { data: me } = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [flaggedId, setFlaggedId] = useState<string | null>(null);

  const { data: reviews } = useQuery<ReviewDto[]>({
    queryKey: ["reviews", slug],
    queryFn: async () => (await fetch(`/api/reviews?slug=${slug}`)).json(),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating: stars, body }),
      });
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
    },
    onError: (e) => {
      if (e.message === "unauthorized") router.push("/login");
    },
  });

  const flag = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: (_d, id) => setFlaggedId(id),
  });

  return (
    <section id="reviews" aria-label={tr("section.reviews", lang)}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-serif-title text-2xl">{tr("section.reviews", lang)}</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold shadow-soft dark:bg-obsidian-card">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)} <span className="font-normal text-ink-soft">({count})</span>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {(reviews ?? []).map((r) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "rounded-3xl p-4 shadow-soft",
                r.flagged ? "bg-coral/5 ring-1 ring-coral/25" : "bg-white dark:bg-obsidian-card"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment text-lg dark:bg-white/10">
                  {r.user.avatarEmoji}
                </span>
                <div>
                  <p className="text-sm font-bold">{r.user.name}</p>
                  <StarRating value={r.rating} size="h-3 w-3" />
                </div>
                <button
                  onClick={() => !r.flagged && !flaggedId && flag.mutate(r.id)}
                  aria-label="Flag review for moderation"
                  title={r.flagged || flaggedId === r.id ? "Flagged for moderation" : "Flag as inappropriate"}
                  className={cn(
                    "ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    r.flagged || flaggedId === r.id
                      ? "bg-coral/10 text-coral"
                      : "text-ink-soft hover:bg-coral/10 hover:text-coral"
                  )}
                >
                  <Flag className="h-3 w-3" /> {r.flagged || flaggedId === r.id ? "Flagged" : "Flag"}
                </button>
              </div>
              {r.body && <p className="mt-2.5 text-sm leading-relaxed text-ink/90 dark:text-slate-200">{r.body}</p>}
            </motion.li>
          ))}
          {reviews && reviews.length === 0 && (
            <li className="rounded-3xl bg-white p-6 text-center text-sm text-ink-soft shadow-soft dark:bg-obsidian-card">
              {tr("empty.noResults", lang)}
            </li>
          )}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="h-fit rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card"
        >
          <p className="text-sm font-bold">{me ? `Hi ${me.name.split(" ")[0]}!` : tr("section.reviews", lang)}</p>
          <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={stars === i}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                onClick={() => setStars(i)}
                className="transition-transform hover:scale-125"
              >
                <Star className={cn("h-7 w-7", i <= stars ? "fill-amber-400 text-amber-400" : "text-ink-soft/40")} />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={me ? "How did it turn out?" : "Sign in to leave a review"}
            disabled={!me}
            className="mt-3 w-full resize-none rounded-2xl bg-parchment p-3 text-sm outline-none ring-1 ring-transparent placeholder:text-ink-soft focus:ring-primary/40 disabled:opacity-60 dark:bg-white/5 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={!me || submit.isPending}
            className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            {submit.isPending ? "…" : "Post review"}
          </button>
        </form>
      </div>
    </section>
  );
}
