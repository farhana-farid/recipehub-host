"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMe } from "@/components/header";

export function FavoriteButton({ slug, className }: { slug: string; className?: string }) {
  const { data: me } = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const [pop, setPop] = useState(false);

  const { data: favs } = useQuery<string[]>({
    queryKey: ["favorites", me?.id],
    enabled: !!me,
    queryFn: async () => (await fetch("/api/favorites")).json(),
  });
  const isFav = !!favs?.includes(slug);

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) throw new Error("unauthorized");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites", me?.id] });
      setPop(true);
      setTimeout(() => setPop(false), 350);
    },
    onError: () => router.push("/login"),
  });

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      animate={pop ? { scale: [1, 1.35, 1] } : {}}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!me) return router.push("/login");
        toggle.mutate();
      }}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-soft backdrop-blur transition-colors dark:bg-black/45",
        className
      )}
    >
      <Heart className={cn("h-4.5 w-4.5 transition-colors", isFav ? "fill-coral text-coral" : "text-ink-soft dark:text-slate-300")} />
    </motion.button>
  );
}
