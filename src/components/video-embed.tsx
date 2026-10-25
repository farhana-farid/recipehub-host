"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, PlayCircle, ShieldCheck } from "lucide-react";
import { parseVideoSource, embedUrlForRange, watchOnAppUrl } from "@/lib/video-parser";
import { cn } from "@/lib/utils";

export interface EmbedVideo {
  platform: string | null;
  videoId: string | null;
  originalUrl: string;
  creatorName?: string | null;
  creatorHandle?: string | null;
}

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  youtube_shorts: "YouTube Shorts",
  instagram_reel: "Instagram",
  tiktok: "TikTok",
  facebook_reel: "Facebook",
};

const PLATFORM_BADGE: Record<string, string> = {
  youtube: "bg-red-500/10 text-red-600",
  youtube_shorts: "bg-red-500/10 text-red-600",
  instagram_reel: "bg-fuchsia-500/10 text-fuchsia-600",
  tiktok: "bg-slate-500/10 text-slate-700",
  facebook_reel: "bg-blue-500/10 text-blue-600",
};

interface VideoEmbedProps {
  url: string;
  /** Force an aspect ratio; otherwise derived from the platform. */
  aspect?: "16:9" | "9:16";
  /** YouTube-only step sync: seek + loop a [start,end] range (seconds). */
  range?: { start?: number; end?: number; loop?: boolean; autoplay?: boolean; mute?: boolean } | null;
  title?: string;
  compactAttribution?: boolean;
  className?: string;
  /** Creator attribution from the DB row (never inferred from the video itself). */
  creatorName?: string | null;
  creatorHandle?: string | null;
}

/**
 * Official-embed-only player. Media is never fetched or re-hosted; when a
 * platform refuses to embed, the fallback card links out to the original post.
 */
export function VideoEmbed({ url, aspect, range, title, compactAttribution, className, creatorName, creatorHandle }: VideoEmbedProps) {
  const parsed = useMemo(() => parseVideoSource(url), [url]);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedSrc = useMemo(() => {
    if (!parsed.embedUrl || !parsed.videoId) return null;
    if (range && (parsed.platform === "youtube" || parsed.platform === "youtube_shorts")) {
      return embedUrlForRange(parsed, range);
    }
    return parsed.embedUrl;
    // Re-mount the iframe whenever the seek range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, range?.start, range?.end, range?.loop, range?.autoplay]);

  const effectiveAspect = aspect ?? parsed.aspect;

  if (!parsed.platform) {
    return <FallbackCard url={url} aspect={effectiveAspect} title={title} reason="unsupported" />;
  }

  const label = PLATFORM_LABEL[parsed.platform] ?? "Video";
  const watchUrl = watchOnAppUrl({ platform: parsed.platform as never, videoId: parsed.videoId, originalUrl: parsed.originalUrl });

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-cream-deep shadow-soft dark:bg-obsidian-card",
          effectiveAspect === "9:16" ? "aspect-[9/16] max-h-[70vh] mx-auto" : "aspect-video"
        )}
      >
        {!loaded && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-2 bg-gradient-to-br from-cream-deep to-parchment dark:from-obsidian-card dark:to-obsidian">
            <PlayCircle className="h-10 w-10 text-primary/60" />
            <span className="text-xs font-medium text-ink-soft">Loading {label} player…</span>
          </div>
        )}
        {embedSrc ? (
          <iframe
            ref={iframeRef}
            key={embedSrc}
            src={embedSrc}
            title={title ?? `Video from ${label}`}
            onLoad={() => setLoaded(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={cn("absolute inset-0 h-full w-full transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          />
        ) : (
          <FallbackCard url={url} aspect={effectiveAspect} title={title} reason="no-embed" inline />
        )}
      </div>

      {/* Attribution + compliant fallback. Always visible. */}
      <div className={cn("mt-2 flex items-center justify-between gap-3", compactAttribution && "mt-1.5")}>
        <p className={cn("flex min-w-0 items-center gap-1.5 text-ink-soft dark:text-slate-400", compactAttribution ? "text-[11px]" : "text-xs")}>
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-herb" />
          <span className="truncate">
            {creatorName ?? creatorHandle ?? "Creator"} · via {label}
          </span>
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-transform hover:scale-105",
            PLATFORM_BADGE[parsed.platform] ?? "bg-slate-500/10",
            compactAttribution ? "text-[11px]" : "text-xs"
          )}
        >
          <ExternalLink className="h-3 w-3" /> Watch on {label}
        </a>
      </div>
    </div>
  );
}

function FallbackCard({
  url,
  aspect,
  title,
  reason,
  inline,
}: {
  url: string;
  aspect: "16:9" | "9:16";
  title?: string;
  reason: "unsupported" | "no-embed";
  inline?: boolean;
}) {
  let host = "the original app";
  try {
    host = new URL(url).hostname.replace("www.", "");
  } catch {
    /* keep default */
  }
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-parchment to-cream-deep p-6 text-center shadow-soft dark:from-obsidian-card dark:to-obsidian",
        !inline && (aspect === "9:16" ? "aspect-[9/16]" : "aspect-video")
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
        <PlayCircle className="h-6 w-6 text-primary" />
      </span>
      <div>
        <p className="font-serif text-lg">{title ?? "This video lives on its original app"}</p>
        <p className="mt-1 text-xs text-ink-soft dark:text-slate-400">
          {reason === "unsupported"
            ? "We don't host video — open the original post for this link."
            : `The creator or ${host} restricted embedding. Watch it there instead:`}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
      >
        Watch on original app ↗
      </a>
    </div>
  );
}

export { PLATFORM_LABEL, PLATFORM_BADGE };
