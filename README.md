# RecipeHub 🍳

**Cook smarter. Eat better.** A video-first recipe discovery platform that pairs written recipes with
step-synced cooking videos from **YouTube, YouTube Shorts, TikTok, Instagram Reels and Facebook** —
wrapped in an installable PWA for Android/desktop.

![stack](https://img.shields.io/badge/Next.js-16-black) ![db](https://img.shields.io/badge/PostgreSQL-16-blue) ![orm](https://img.shields.io/badge/Prisma-6-darkgreen) ![pwa](https://img.shields.io/badge/PWA-installable-10B981)

## Feature map

| Area | What you get |
|---|---|
| **Multi-platform video engine** | `parseVideoSource(url)` auto-detects platform + video id and builds official embed URLs (youtube-nocookie, TikTok embed v2, Instagram embed, Facebook video plugin). No scraping, no re-hosting — every player ships creator attribution and a **"Watch on original app"** fallback card for restricted posts. |
| **Step-synced cooking mode** | Each `CookingStep` stores optional `videoStart`/`videoEnd`; the YouTube IFrame API seeks to the step's clip and loops it while you cook. "Repeat Step clip" replays the segment. |
| **Hands-free voice** | Web Speech API listens for **"next step" / "repeat" / "timer 5 minutes"** and their Bengali equivalents (**"পরবর্তী ধাপ" / "আবার" / "টাইমার ৫ মিনিট"**). Toggle the Voice chip inside cooking mode (Chrome/Edge). |
| **Smart ingredient checklist** | Tap to strike off items (animated checkmarks + progress bar), "Add all" to your pantry, serving scaler (½-fractions render nicely: 875 g, 2½, ⅝ cup) with live quantity re-computation. |
| **Ingredient substitutions** | Curated substitute dataset shown inline ("Substitute: greek yogurt, sour cream…"), exposed via `/api/substitutions` — LLM-provider-ready interface. |
| **Pantry matcher** | Pick what you have → recipes ranked by `match_percentage = matched / total × 100` with badges ("100% Match" / "Missing N") and substitute hints on missing items. |
| **Omni-search** | Debounced search across titles, descriptions, cuisine, tags and ingredients — **English and বাংলা** — plus diet, allergen-exclusion and max-cook-time filters. |
| **Community** | Favorites, custom collections ("Ramadan Meals", "Quick 15-min Dinners"), star reviews with moderation flagging, recipe submission with image upload preview → `PENDING_REVIEW` workflow. |
| **Bilingual UI** | One-tap EN ⇄ বাংলা toggle; recipes carry `titleBn`/`descriptionBn`/`textBn`/`nameBn` fields with graceful English fallback. |
| **Installable PWA** | Web manifest + service worker (offline shell) — installs as an app on Android/Chrome. |

## Quick start

```bash
# 1. Postgres (Docker)
docker compose up -d          # postgres:16 on localhost:5433

# 2. Install deps + schema + demo data
npm install
npx prisma db push
npx prisma db seed

# 3. Run
npm run dev                   # http://localhost:3000
# or: npm run build && npm run start
```

**Demo accounts** (seeded): `chef@recipehub.app / cook1234` · admin `admin@recipehub.app / admin1234`.

### Install on your phone (Android)
1. Open `http://<your-lan-ip>:3000` (e.g. `http://192.168.x.x:3000`) in Chrome — run the server with `next dev -H 0.0.0.0` or `next start -H 0.0.0.0`.
2. Tap the **"Install app"** chip in the header (or Chrome menu ▸ *Add to Home screen*).
3. RecipeHub launches fullscreen from its own icon, with the bottom tab bar, and serves already-visited pages from the offline shell.

## Project layout

```
prisma/schema.prisma        User · Session · Recipe · Ingredient · RecipeIngredient
                            CookingStep (videoStart/End, timers) · Video · Collection · Review
prisma/seed.ts              12 recipes, 64 ingredients, 52 steps, 16 real videos, reviews, collections
src/lib/video-parser.ts     parseVideoSource(): platform/id/embed/thumbnail/aspect per URL
src/lib/match.ts            pantry set-intersection ranking
src/lib/i18n.ts             EN/বাংলা UI dictionary + diet/allergen vocab
src/components/             VideoEmbed, ReelCarousel, RecipeCard, IngredientChecklist,
                            NutritionPills, Reviews, CollectionPicker, CookingMode (video sync +
                            timers + voice), Header/BottomNav, InstallButton
src/app/api/                auth · recipes · search · pantry-match · ingredients · substitutions
                            favorites · collections · reviews · submit · upload
public/                     manifest.webmanifest · sw.js · icons (generated PNGs)
```

## Compliance notes

- Video playback happens **only through official platform embeds**; original post URLs, creator names
  and handles are stored in the `Video` table, never media files.
- Deleted/private/region-locked embeds degrade to the fallback card with a deep link — verified in-app.
- Thumbnails for YouTube use the official `i.ytimg.com` CDN; other platforms intentionally show
  designed gradient placeholders rather than hot-linking restricted CDNs.

## Verification performed

- `next build` clean (24 routes) · zero console errors across `/`, recipe, pantry, search, favorites,
  login, offline pages
- Embeds confirmed live: YouTube (long-form + Shorts), Instagram Reel, Facebook video; TikTok fallback
  card verified (region-gated embed → "Watch on TikTok")
- Serving scaler math (×5/4: 700 g → 875 g, ½-cup → ⅝ cup), checklist persistence, timer ring + chime,
  step→video seek (player jumped to 1:33 for the 1:30–4:00 clip)
- Dark mode contrast, 390 px mobile layout with bottom nav, PWA manifest/SW/icons served (200)
