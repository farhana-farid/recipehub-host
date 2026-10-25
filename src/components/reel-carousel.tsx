"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { PLATFORM_BADGE, PLATFORM_LABEL } from "@/components/video-embed";
import { parseVideoSource } from "@/lib/video-parser";
import { useLang } from "@/components/providers";
import { pick } from "@/lib/i18n";

export interface ReelItem {
  slug: string;
  title: string;
  titleBn?: string | null;
  videoUrl: string;
  platform: string;
  videoId: string;
  creatorName: string;
  thumbnailUrl: string | null;
}

export function ReelCarousel({ reels }: { reels: ReelItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lang = useLang();

  function scrollBy(dir: 1 | -1) {
    trackRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif-title text-2xl">Recipe Reels & Shorts</h2>
        <div className="hidden gap-1.5 md:flex">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll reels left"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll reels right"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {reels.map((reel, i) => {
          const parsed = parseVideoSource(reel.videoUrl);
          const key = reel.platform.toLowerCase();
          const label = PLATFORM_LABEL[key] ?? PLATFORM_LABEL[parsed.platform ?? ""] ?? "Video";
          return (
            <motion.div
              key={`${reel.slug}-${reel.videoId}`}
              className="w-[172px] shrink-0 snap-start md:w-[196px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link href={`/recipe/${reel.slug}`} className="group block">
                <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 via-coral/15 to-herb/20 shadow-soft">
                  {reel.thumbnailUrl ? (
                    <Image
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-script text-3xl text-white/80">{label}</span>
                    </div>
                  )}
                  <span className={`absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold backdrop-blur ${PLATFORM_BADGE[key] ?? "bg-slate-500/20 text-slate-700"}`}>
                    {label}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-lift transition-transform duration-300 group-hover:scale-110">
                      <Play className="ml-0.5 h-5 w-5 fill-primary text-primary" />
                    </span>
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-white">
                      {pick(lang, reel.title, reel.titleBn)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-white/75">{reel.creatorName}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
