"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, PlayCircle } from "lucide-react";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";

export function Hero() {
  const lang = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <section className="relative overflow-hidden rounded-3xl bg-parchment px-6 py-12 text-center shadow-soft md:py-20 dark:bg-obsidian-card">
      {/* warm blobs */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-herb/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-2xl"
      >
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold text-primary-deep shadow-soft backdrop-blur dark:bg-white/10 dark:text-primary">
          <Sparkles className="h-3.5 w-3.5" /> 5 platforms · step-synced video · hands-free mode
        </span>
        <h1 className="font-serif-title text-4xl leading-[1.1] md:text-6xl">{tr("brand.tagline", lang)}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink/70 dark:text-slate-300">
          {tr("brand.sub", lang)}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
          className="mx-auto mt-7 flex max-w-lg items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-lift ring-1 ring-orange-100 focus-within:ring-2 focus-within:ring-primary/50 dark:bg-obsidian dark:ring-white/10"
          role="search"
        >
          <Search className="h-4.5 w-4.5 shrink-0 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("action.search", lang)}
            aria-label={tr("action.search", lang)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft dark:text-slate-100"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-ink-soft dark:text-slate-400">
          <span>Try:</span>
          {["Chicken curry", "vegan", "quick breakfast", "মুরগির ঝোল"].map((s) => (
            <button
              key={s}
              onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
              className="rounded-full bg-white px-3 py-1.5 shadow-soft transition-transform hover:scale-105 dark:bg-white/10"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <a
            href="#browse-reels"
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105 dark:bg-white dark:text-ink"
          >
            <PlayCircle className="h-4 w-4" /> Watch the reels
          </a>
        </div>
      </motion.div>
    </section>
  );
}
