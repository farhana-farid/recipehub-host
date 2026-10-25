/**
 * extractRecipeFromLink — turns a pasted video URL (YouTube / Shorts / TikTok /
 * Instagram / Facebook) into a structured recipe.
 *
 * Pipeline:
 *  1. parseVideoSource() identifies the platform + video id.
 *  2. Metadata: native CapacitorHttp fetch (no CORS limits, used inside the
 *     Android app) or the CORS-friendly noembed proxy in the browser build.
 *  3. Recipe structure, best-effort in order:
 *     a. Gemini API (gemini-1.5-flash, auto-falling back to newer flash
 *        models) when the user supplied an API key — the video title +
 *        description are passed to the model which returns strict JSON.
 *     b. Open-metadata heuristic parser over the video description
 *        (ingredient/step line patterns — many cooking videos embed the
 *        recipe in their description).
 *     c. Metadata-only result (title, creator, player) with a hint that the
 *        Gemini key enables full extraction. Media is never downloaded or
 *        re-hosted — the player always uses the platform's official embed or
 *        a deep link, per the compliance rules in video-parser.ts.
 */
import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from "@capacitor/core";
import { parseVideoSource, watchOnAppUrl, type ParsedVideo } from "@/lib/video-parser";

export interface ExtractedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  optional?: boolean;
}

export interface ExtractedStep {
  text: string;
  timerMinutes?: number;
}

export interface ExtractedRecipe {
  title: string;
  titleBn?: string | null;
  creator?: string;
  cuisine?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  calories?: number;
  ingredients: ExtractedIngredient[];
  steps: ExtractedStep[];
  source: "gemini" | "description" | "metadata";
  note?: string;
}

export interface ExtractionResult {
  video: ParsedVideo;
  watchUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  recipe: ExtractedRecipe;
  usedKey: boolean;
}

/* ------------------------------------------------------------------ */
/* Network helpers                                                     */
/* ------------------------------------------------------------------ */

async function httpGetText(url: string): Promise<string | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.get({ url, headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36" }, readTimeout: 15000, connectTimeout: 10000 });
      if (res.status >= 200 && res.status < 400) return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      return null;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface OEmbedMeta {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

async function fetchOEmbed(url: string): Promise<OEmbedMeta | null> {
  // noembed.com proxies oEmbed with CORS enabled; CapacitorHttp needs no proxy.
  const target = Capacitor.isNativePlatform()
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    : `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  const text = await httpGetText(target);
  if (!text) return null;
  try {
    const j = JSON.parse(text);
    if (j.error) return null;
    return { title: j.title, author_name: j.author_name, thumbnail_url: j.thumbnail_url, provider_name: j.provider_name };
  } catch {
    return null;
  }
}

/** YouTube watch-page scrape for the full description (native builds only). */
async function fetchYoutubeDescription(videoId: string): Promise<{ description: string; keywords: string[] } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const html = await httpGetText(`https://www.youtube.com/watch?v=${videoId}`);
  if (!html) return null;
  let description = "";
  const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (m) {
    try {
      description = JSON.parse(`"${m[1]}"`);
    } catch {
      description = m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }
  const kw = html.match(/"keywords":\[(.*?)\]/)?.[1] ?? "";
  const keywords = kw.match(/"(.*?)"/g)?.map((k) => k.slice(1, -1)) ?? [];
  return description ? { description, keywords } : null;
}

/* ------------------------------------------------------------------ */
/* Heuristic description parser (open metadata, no key needed)         */
/* ------------------------------------------------------------------ */

const INGREDIENT_UNIT =
  /(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|grams?|g\b|kg\b|ml\b|litres?|liters?|l\b|oz\b|ounces?|lbs?|pounds?|cloves?|pinch(?:es)?|handfuls?|sticks?|slices?|packets?|tins?|cans?|bunch(?:es)?|sprigs?|pieces?|large|medium|small|quarts?|pints?|inch)/i;

function looksLikeIngredient(line: string): boolean {
  const l = line.trim();
  if (l.length < 3 || l.length > 90) return false;
  if (/^(https?:|www\.|subscribe|follow|watch|#|for more|business|email:|instagram|facebook|tiktok|youtube)/i.test(l)) return false;
  const hasUnit = INGREDIENT_UNIT.test(l);
  const startsWithAmount = /^\d|^¼|^½|^¾|^⅓|^⅔|^⅛|^[-•*–]\s*\d|^[-•*–]\s*[¼½¾⅓⅔⅛]/.test(l);
  return (hasUnit && startsWithAmount) || (startsWithAmount && l.split(/\s+/).length <= 8);
}

function looksLikeStep(line: string): boolean {
  const l = line.trim();
  if (l.length < 12 || l.length > 320) return false;
  if (/^(https?:|www\.|subscribe|follow|#|for more|business|email:)/i.test(l)) return false;
  return /^\d+[.)]\s+\S/.test(l) || /^step\s*\d+/i.test(l) || /^(heat|add|mix|stir|cook|fry|bake|boil|simmer|whisk|combine|season|pour|serve|place|remove|preheat|marinate|chop|slice|sauté|saute|cover|garnish|drizzle|knead|roll|flip|blend|rest|transfer)\b/i.test(l);
}

function parseMinutes(text: string, kind: "prep" | "cook"): number | undefined {
  const m = text.match(new RegExp(`${kind}[^.:\\n]{0,20}?(\\d{1,3})\\s*(?:min|minutes?|m\\b)`, "i"))
    ?? text.match(new RegExp(`(\\d{1,3})\\s*(?:min|minutes?)\\s*${kind}`, "i"));
  return m ? parseInt(m[1], 10) : undefined;
}

export function parseDescriptionRecipe(title: string, description: string, creator?: string): ExtractedRecipe | null {
  const lines = description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const ingredients: ExtractedIngredient[] = [];
  const steps: ExtractedStep[] = [];

  let inIngredients = false;
  let inSteps = false;
  for (const line of lines) {
    if (/^(ingredients?|what you need|আমাদের উপকরণ|উপকরণ)\s*:?\s*$/i.test(line)) {
      inIngredients = true;
      inSteps = false;
      continue;
    }
    if (/^(instructions?|directions?|method|steps?|preparation|রান্নার ধাপ|প্রস্তুতি)\s*:?\s*$/i.test(line)) {
      inSteps = true;
      inIngredients = false;
      continue;
    }
    if (/^(for the |watch|subscribe|follow|connect|social|hashtags|business|thank)/i.test(line)) {
      inIngredients = false;
      inSteps = false;
    }
    const clean = line.replace(/^[-•*–]\s*/, "");
    if (inIngredients && looksLikeIngredient(clean)) {
      const m = clean.match(/^([\d¼½¾⅓⅔⅛\d./\s]+)\s+([a-zA-Z]+)\s+(.+)$/);
      ingredients.push(
        m && INGREDIENT_UNIT.test(m[2])
          ? { quantity: m[1].trim(), unit: m[2], name: m[3].trim() }
          : { name: clean }
      );
    } else if ((inSteps || !inIngredients) && looksLikeStep(clean)) {
      const timer = clean.match(/(\d{1,3})\s*(?:min|minutes?)/i);
      steps.push({ text: clean.replace(/^step\s*\d+\s*[:.)-]?\s*/i, "").replace(/^\d+[.)]\s*/, ""), timerMinutes: timer ? parseInt(timer[1], 10) : undefined });
    } else if (!inIngredients && !inSteps && looksLikeIngredient(clean)) {
      ingredients.push({ name: clean.replace(/^[-•*–]\s*/, "") });
    }
  }

  if (ingredients.length < 3 || steps.length < 2) return null;
  return {
    title,
    creator,
    prepMinutes: parseMinutes(description, "prep"),
    cookMinutes: parseMinutes(description, "cook") ?? steps.reduce((a, s) => a + (s.timerMinutes ?? 0), 0) || undefined,
    servings: description.match(/serves?\s*:?\s*(\d{1,2})/i)?.[1] ? parseInt(description.match(/serves?\s*:?\s*(\d{1,2})/i)![1], 10) : undefined,
    ingredients,
    steps,
    source: "description",
    note: "Auto-detected from the video's description — please double-check before cooking.",
  };
}

/* ------------------------------------------------------------------ */
/* Gemini provider                                                     */
/* ------------------------------------------------------------------ */

const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

export function getGeminiKey(): string {
  try {
    return localStorage.getItem("rh-gemini-key") ?? "";
  } catch {
    return "";
  }
}

export function setGeminiKey(key: string) {
  try {
    if (key) localStorage.setItem("rh-gemini-key", key);
    else localStorage.removeItem("rh-gemini-key");
  } catch {
    /* private mode */
  }
}

async function geminiExtract(prompt: string, key: string): Promise<ExtractedRecipe | null> {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
          }),
        }
      );
      if (res.status === 404 || res.status === 400) continue; // model unavailable for this key → try next
      if (!res.ok) {
        if (res.status === 403 || res.status === 429) throw new Error("bad_key");
        continue;
      }
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text);
      if (parsed?.error === "not_enough_info") return null;
      if (Array.isArray(parsed?.ingredients)) {
        return {
          title: String(parsed.title ?? "Extracted recipe"),
          titleBn: parsed.titleBn ?? null,
          cuisine: parsed.cuisine ?? undefined,
          prepMinutes: parsed.prepMinutes ?? undefined,
          cookMinutes: parsed.cookMinutes ?? undefined,
          servings: parsed.servings ?? undefined,
          calories: parsed.calories ?? undefined,
          ingredients: parsed.ingredients.slice(0, 40).map((i: Record<string, unknown>) => ({
            name: String(i.name ?? "").trim(),
            quantity: i.quantity ? String(i.quantity) : undefined,
            unit: i.unit ? String(i.unit) : undefined,
            optional: !!i.optional,
          })).filter((i: ExtractedIngredient) => i.name),
          steps: (parsed.steps ?? []).slice(0, 30).map((s: Record<string, unknown>) => ({
            text: String(s.text ?? "").trim(),
            timerMinutes: typeof s.timerMinutes === "number" ? s.timerMinutes : undefined,
          })).filter((s: ExtractedStep) => s.text),
          source: "gemini",
        };
      }
    } catch (e) {
      if ((e as Error).message === "bad_key") throw e;
      continue;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

export async function extractRecipeFromLink(rawUrl: string, opts: { geminiKey?: string } = {}): Promise<ExtractionResult> {
  const video = parseVideoSource(rawUrl);
  const watchUrl = watchOnAppUrl({ platform: video.platform as never, videoId: video.videoId, originalUrl: video.originalUrl });

  const meta = await fetchOEmbed(video.platform ? watchUrl : rawUrl);
  let description: string | null = null;
  let keywords: string[] = [];
  if (video.platform === "youtube" && video.videoId) {
    const yt = await fetchYoutubeDescription(video.videoId);
    description = yt?.description ?? null;
    keywords = yt?.keywords ?? [];
  }

  const title = meta?.title ?? video.label ?? "Video recipe";
  const creator = meta?.author_name ?? undefined;

  let recipe: ExtractedRecipe | null = null;
  let usedKey = false;

  const key = opts.geminiKey?.trim() || getGeminiKey();
  if (key && video.platform) {
    const prompt = [
      "You are a recipe extraction engine. From the cooking video metadata below, extract the recipe as strict JSON:",
      `{"title": string, "titleBn": string|null, "cuisine": string, "prepMinutes": number|null, "cookMinutes": number|null, "servings": number|null, "calories": number|null,`,
      ` "ingredients": [{"name": string, "quantity": string|null, "unit": string|null, "optional": boolean}],`,
      ` "steps": [{"text": string, "timerMinutes": number|null}]}`,
      "If the metadata does not contain enough cooking information, respond with {\"error\": \"not_enough_info\"}.",
      "Use the description's ingredient/step lines when present; otherwise infer the standard version of the dish named in the title.",
      "",
      `Platform: ${video.label}`,
      `Video title: ${title}`,
      creator ? `Channel/creator: ${creator}` : "",
      keywords.length ? `Keywords: ${keywords.join(", ")}` : "",
      description ? `Description:\n${description.slice(0, 6000)}` : "Description: (unavailable)",
    ].filter(Boolean).join("\n");
    try {
      recipe = await geminiExtract(prompt, key);
      usedKey = !!recipe;
    } catch (e) {
      if ((e as Error).message === "bad_key") {
        recipe = parseDescriptionRecipe(title, description ?? "", creator);
        if (recipe) recipe.note = "Gemini key was rejected — used open metadata instead.";
      }
    }
  }

  if (!recipe && description) {
    recipe = parseDescriptionRecipe(title, description, creator);
  }

  if (!recipe) {
    recipe = {
      title,
      creator,
      ingredients: [],
      steps: [],
      source: "metadata",
      note:
        video.platform
          ? "Only the video details could be fetched. Add a Gemini API key below (or paste a video whose description contains the recipe) for full ingredient/step extraction."
          : "This link isn't a recognized video post — you can still open it with the button below.",
    };
  }

  return {
    video,
    watchUrl,
    embedUrl: video.embedUrl,
    thumbnailUrl: meta?.thumbnail_url ?? video.thumbnailUrl,
    recipe,
    usedKey,
  };
}
