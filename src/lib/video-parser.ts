/**
 * parseVideoSource — auto-detects the platform of a video/reel/short URL and
 * builds embed parameters WITHOUT ever scraping or re-hosting media.
 *
 * Compliance model:
 *  - We only store the original post URL, the platform video id and
 *    creator attribution (see prisma/schema.prisma `Video`).
 *  - Playback happens exclusively through each platform's OFFICIAL embed
 *    player (youtube-nocookie iframe, TikTok embed v2 iframe, Instagram
 *    embed iframe, Facebook video plugin iframe).
 *  - When an embed is unavailable (deleted, private, region-locked, or the
 *    platform refuses framing), the UI falls back to a card that deep-links
 *    out to the original post ("Watch on <platform>").
 */

export const VIDEO_PLATFORMS = [
  "youtube",
  "youtube_shorts",
  "instagram_reel",
  "tiktok",
  "facebook_reel",
] as const;

export type VideoPlatform = (typeof VIDEO_PLATFORMS)[number];

export interface ParsedVideo {
  /** Detected platform; null when the URL is not a supported video post. */
  platform: VideoPlatform | null;
  /** Platform video id when it can be extracted from the URL; null for short links. */
  videoId: string | null;
  /** The original post URL (always normalized back to canonical form). */
  originalUrl: string;
  /** Official embed URL, or null when the platform has no keyless iframe embed. */
  embedUrl: string | null;
  /** Poster thumbnail for cards (YouTube only guarantees a stable CDN URL). */
  thumbnailUrl: string | null;
  /** Vertical formats get a 9:16 stage, everything else 16:9. */
  aspect: "16:9" | "9:16";
  /** Human platform label, e.g. "YouTube Shorts". */
  label: string;
}

const YT_ID = "[A-Za-z0-9_-]{11}";

const PATTERNS: Array<{
  platform: VideoPlatform;
  label: string;
  aspect: "16:9" | "9:16";
  re: RegExp;
  build: (m: RegExpMatchArray, url: string) => Pick<ParsedVideo, "videoId" | "embedUrl" | "thumbnailUrl"> & { originalUrl?: string };
}> = [
  {
    platform: "youtube_shorts",
    label: "YouTube Shorts",
    aspect: "9:16",
    re: new RegExp(`youtube\\.com/shorts/(${YT_ID})`),
    build: (m) => ({
      videoId: m[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${m[1]}?playsinline=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
    }),
  },
  {
    platform: "youtube",
    label: "YouTube",
    aspect: "16:9",
    re: new RegExp(
      `(?:youtube\\.com/(?:watch\\?(?:.*&)?v=|embed/|v/|live/)|youtu\\.be/)(${YT_ID})`
    ),
    build: (m) => ({
      videoId: m[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${m[1]}?playsinline=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
    }),
  },
  {
    platform: "tiktok",
    label: "TikTok",
    aspect: "9:16",
    // Full links carry the numeric video id; vm./t/ short links cannot be
    // resolved client-side without an oEmbed fetch, so they fall through
    // with videoId null and render the deep-link fallback card.
    re: /tiktok\.com\/(?:@[\w.\-]+)\/video\/(\d+)/,
    build: (m) => ({
      videoId: m[1],
      embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`,
      thumbnailUrl: null,
    }),
  },
  {
    platform: "instagram_reel",
    label: "Instagram Reel",
    aspect: "9:16",
    re: /instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/,
    build: (m) => ({
      videoId: m[1],
      embedUrl: `https://www.instagram.com/reel/${m[1]}/embed/captioned/`,
      thumbnailUrl: null,
    }),
  },
  {
    platform: "instagram_reel",
    label: "Instagram Post",
    aspect: "9:16",
    re: /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    build: (m) => ({
      videoId: m[1],
      embedUrl: `https://www.instagram.com/p/${m[1]}/embed/captioned/`,
      thumbnailUrl: null,
    }),
  },
  {
    platform: "facebook_reel",
    label: "Facebook Reel",
    aspect: "9:16",
    re: /facebook\.com\/reel\/(\d+)/,
    build: (m, url) => ({
      videoId: m[1],
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&playsinline=true`,
      thumbnailUrl: null,
    }),
  },
  {
    platform: "facebook_reel",
    label: "Facebook Video",
    aspect: "16:9",
    re: /facebook\.com\/(?:watch\/?\?v=|[^/]+\/videos\/(?:[\w-]+\/)?)(\d+)/,
    build: (m, url) => ({
      videoId: m[1],
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&playsinline=true`,
      thumbnailUrl: null,
    }),
  },
];

export function parseVideoSource(rawUrl: string): ParsedVideo {
  const fallback: ParsedVideo = {
    platform: null,
    videoId: null,
    originalUrl: rawUrl,
    embedUrl: null,
    thumbnailUrl: null,
    aspect: "16:9",
    label: "Video",
  };

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return fallback;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

  const href = url.toString();

  for (const p of PATTERNS) {
    const m = href.match(p.re);
    if (m) {
      const built = p.build(m, href);
      return {
        platform: p.platform,
        label: p.label,
        aspect: p.aspect,
        videoId: built.videoId,
        embedUrl: built.embedUrl,
        thumbnailUrl: built.thumbnailUrl,
        originalUrl: href,
      };
    }
  }

  // Known short-link hosts: platform is identifiable even when the id is not.
  if (/(^|\.)youtu\.be$/.test(url.hostname)) {
    const id = url.pathname.slice(1).match(new RegExp(`^(${YT_ID})`))?.[1];
    if (id) {
      return {
        platform: "youtube",
        label: "YouTube",
        aspect: "16:9",
        videoId: id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        originalUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    }
  }
  if (/(^|\.)(vm\.)?tiktok\.com$/.test(url.hostname) || /fb\.watch$/.test(url.hostname)) {
    return {
      ...fallback,
      originalUrl: href,
      aspect: /tiktok\.com/.test(url.hostname) ? "9:16" : "16:9",
      platform: /tiktok\.com/.test(url.hostname) ? "tiktok" : "facebook_reel",
      label: /tiktok\.com/.test(url.hostname) ? "TikTok" : "Facebook Video",
    };
  }

  return fallback;
}

/** Deep-link intent for the "Watch on <platform>" fallback button. */
export function watchOnAppUrl(video: { platform: VideoPlatform | null; videoId: string | null; originalUrl: string }): string {
  if (video.platform === "youtube" && video.videoId) return `https://www.youtube.com/watch?v=${video.videoId}`;
  if (video.platform === "youtube_shorts" && video.videoId) return `https://www.youtube.com/shorts/${video.videoId}`;
  if (video.platform === "tiktok" && video.videoId) return `https://www.tiktok.com/embed/v2/${video.videoId}`.replace("/embed/v2/", "/@-/video/");
  return video.originalUrl;
}

/** Build an embed URL with YouTube seek parameters for step-synced playback. */
export function embedUrlForRange(
  video: { platform: VideoPlatform | null; videoId: string | null; originalUrl: string },
  opts: { start?: number; end?: number; autoplay?: boolean; loop?: boolean; mute?: boolean } = {}
): string | null {
  const parsed = parseVideoSource(video.originalUrl);
  if (!parsed.embedUrl || !parsed.videoId) return null;
  const u = new URL(parsed.embedUrl);
  if (parsed.platform === "youtube" || parsed.platform === "youtube_shorts") {
    u.searchParams.set("enablejsapi", "1");
    u.searchParams.set("playsinline", "1");
    if (opts.start != null) u.searchParams.set("start", String(Math.max(0, Math.floor(opts.start))));
    if (opts.end != null && opts.end > (opts.start ?? 0)) u.searchParams.set("end", String(Math.floor(opts.end)));
    if (opts.autoplay) u.searchParams.set("autoplay", "1");
    if (opts.loop) {
      u.searchParams.set("loop", "1");
      // YouTube requires playlist=<id> for looping a single video.
      u.searchParams.set("playlist", parsed.videoId);
    }
    if (opts.mute) u.searchParams.set("mute", "1");
  }
  return u.toString();
}
