"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Trash2, UploadCloud, Clock } from "lucide-react";
import { useMe } from "@/components/header";
import { useLang } from "@/components/providers";
import { DIETS, ALLERGENS } from "@/lib/i18n";
import { VideoEmbed } from "@/components/video-embed";
import { parseVideoSource } from "@/lib/video-parser";
import { cn } from "@/lib/utils";

const CUISINES = ["Indian", "Italian", "American", "Bengali", "Nigerian", "Jamaican", "Mediterranean", "Healthy", "Universal", "Other"];

interface IngRow { name: string; quantity: string; unit: string; optional: boolean }
interface StepRow { text: string; timerMinutes: string }
interface VideoRow { url: string }

export default function SubmitPage() {
  const { data: me } = useMe();
  const lang = useLang();
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("Indian");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [baseServings, setBaseServings] = useState(2);
  const [prepMinutes, setPrepMinutes] = useState(10);
  const [cookMinutes, setCookMinutes] = useState(25);
  const [calories, setCalories] = useState(400);
  const [protein, setProtein] = useState(15);
  const [carbs, setCarbs] = useState(40);
  const [fat, setFat] = useState(14);
  const [tags, setTags] = useState("");
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingredients, setIngredients] = useState<IngRow[]>([
    { name: "", quantity: "1", unit: "cup", optional: false },
    { name: "", quantity: "2", unit: "tbsp", optional: false },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([
    { text: "", timerMinutes: "" },
    { text: "", timerMinutes: "" },
  ]);
  const [videos, setVideos] = useState<VideoRow[]>([{ url: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ slug: string } | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const body = {
        title, description, cuisine, difficulty,
        baseServings, prepMinutes, cookMinutes,
        calories, protein, carbs, fat,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        dietTags, allergens,
        image: image ?? "",
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({ name: i.name.trim(), quantity: parseFloat(i.quantity) || null, unit: i.unit.trim() || null, optional: i.optional })),
        steps: steps
          .filter((s) => s.text.trim())
          .map((s) => ({ text: s.text.trim(), timerSeconds: s.timerMinutes ? Math.round(parseFloat(s.timerMinutes) * 60) : null })),
        videos: videos.filter((v) => v.url.trim()).map((v) => ({ url: v.url.trim() })),
      };
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "Invalid input" ? "Please fill in all required fields correctly." : data.error);
      return data as { slug: string; status: string };
    },
    onSuccess: (data) => {
      setSuccess(data);
      qc.invalidateQueries({ queryKey: ["my-recipes"] });
    },
    onError: (e: Error) => setError(e.message === "unauthorized" ? "Please sign in first." : e.message),
  });

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImage(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
        <UploadCloud className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 font-serif-title text-2xl">Share your recipe</h1>
        <p className="mt-2 text-sm text-ink-soft">Sign in to submit a recipe — our moderators review every submission.</p>
        <button onClick={() => router.push("/login")} className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105">
          Sign in
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
        <span className="text-5xl">🎉</span>
        <h1 className="mt-3 font-serif-title text-2xl">Submitted for review!</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your recipe is now <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">PENDING_REVIEW</span>.
          A moderator will publish it shortly.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={() => router.push("/profile")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow">
            View my submissions
          </button>
          <button onClick={() => { setSuccess(null); setTitle(""); setDescription(""); }} className="rounded-full bg-parchment px-5 py-2.5 text-sm font-bold dark:bg-white/10">
            Submit another
          </button>
        </div>
      </motion.div>
    );
  }

  const inputCls = "w-full rounded-2xl bg-parchment px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-primary/40 dark:bg-white/5 dark:text-slate-100";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft dark:text-slate-400";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif-title text-3xl">Share your recipe</h1>
        <p className="mt-1 text-sm text-ink-soft">Submissions enter the PENDING_REVIEW queue before going live.</p>
      </div>

      {error && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert">{error}</p>}

      {/* Media + basics */}
      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
        <div>
          <label className={labelCls} htmlFor="title">Recipe title *</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Nani's Chicken Tehari" maxLength={120} />
        </div>
        <div>
          <label className={labelCls} htmlFor="description">Description *</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} placeholder="What makes it special? (min 10 chars)" />
        </div>

        {/* Image upload preview */}
        <div>
          <span className={labelCls}>Photo *</span>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-primary/40 bg-parchment/50 p-6 text-center transition-colors hover:bg-parchment dark:bg-white/5">
            {image ? (
              <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-2xl">
                <Image src={image} alt="Upload preview" fill sizes="400px" className="object-cover" />
              </div>
            ) : (
              <>
                <UploadCloud className={cn("h-9 w-9 text-primary", uploading && "animate-bounce")} />
                <span className="text-sm font-semibold">{uploading ? "Uploading…" : "Click to upload a photo"}</span>
                <span className="text-[11px] text-ink-soft">JPEG / PNG / WebP · up to 6 MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="cuisine">Cuisine</label>
            <select id="cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={inputCls}>
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className={inputCls}>
              <option>EASY</option><option>MEDIUM</option><option>HARD</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="servings">Servings</label>
            <input id="servings" type="number" min={1} max={24} value={baseServings} onChange={(e) => setBaseServings(parseInt(e.target.value) || 1)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tags">Tags (comma sep.)</label>
            <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="dinner, spicy" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="prep">Prep (min)</label>
            <input id="prep" type="number" min={0} value={prepMinutes} onChange={(e) => setPrepMinutes(parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="cook">Cook (min)</label>
            <input id="cook" type="number" min={1} value={cookMinutes} onChange={(e) => setCookMinutes(parseInt(e.target.value) || 1)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="cal">Calories</label>
            <input id="cal" type="number" min={0} value={calories} onChange={(e) => setCalories(parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls} htmlFor="protein">Protein (g)</label>
            <input id="protein" type="number" min={0} value={protein} onChange={(e) => setProtein(parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="carbs">Carbs (g)</label>
            <input id="carbs" type="number" min={0} value={carbs} onChange={(e) => setCarbs(parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="fat">Fat (g)</label>
            <input id="fat" type="number" min={0} value={fat} onChange={(e) => setFat(parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className={labelCls}>Dietary markers</span>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDietTags((xs) => (xs.includes(d.key) ? xs.filter((x) => x !== d.key) : [...xs, d.key]))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    dietTags.includes(d.key) ? "bg-herb text-white" : "bg-parchment text-ink dark:bg-white/10 dark:text-slate-200"
                  )}
                >
                  {lang === "bn" ? d.bn : d.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Allergens</span>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAllergens((xs) => (xs.includes(a.key) ? xs.filter((x) => x !== a.key) : [...xs, a.key]))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    allergens.includes(a.key) ? "bg-coral text-white" : "bg-parchment text-ink dark:bg-white/10 dark:text-slate-200"
                  )}
                >
                  {lang === "bn" ? a.bn : a.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-3 rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
        <h2 className="font-serif-title text-xl">Ingredients</h2>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input value={ing.name} onChange={(e) => setIngredients((xs) => xs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={`Ingredient ${i + 1} *`} aria-label={`Ingredient ${i + 1} name`} className={cn(inputCls, "min-w-36 flex-1")} />
            <input value={ing.quantity} onChange={(e) => setIngredients((xs) => xs.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} placeholder="Qty" aria-label={`Ingredient ${i + 1} quantity`} className={cn(inputCls, "w-20")} />
            <input value={ing.unit} onChange={(e) => setIngredients((xs) => xs.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} placeholder="unit" aria-label={`Ingredient ${i + 1} unit`} className={cn(inputCls, "w-24")} />
            <button
              type="button"
              onClick={() => setIngredients((xs) => xs.map((x, j) => (j === i ? { ...x, optional: !x.optional } : x)))}
              className={cn("rounded-full px-3 py-2 text-xs font-bold", ing.optional ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-parchment text-ink-soft dark:bg-white/10")}
            >
              optional
            </button>
            {ingredients.length > 2 && (
              <button type="button" onClick={() => setIngredients((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove ingredient ${i + 1}`} className="rounded-full p-2 text-ink-soft hover:bg-coral/10 hover:text-coral">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setIngredients((xs) => [...xs, { name: "", quantity: "", unit: "", optional: false }])} className="flex items-center gap-1.5 text-xs font-bold text-primary-deep hover:underline dark:text-primary">
          <Plus className="h-3.5 w-3.5" /> Add ingredient
        </button>
      </section>

      {/* Steps */}
      <section className="space-y-3 rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
        <h2 className="font-serif-title text-xl">Cooking steps</h2>
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="pt-3 font-serif text-2xl font-bold text-primary/30">{String(i + 1).padStart(2, "0")}</span>
            <textarea
              value={s.text}
              onChange={(e) => setSteps((xs) => xs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              placeholder={`Step ${i + 1} *`}
              aria-label={`Step ${i + 1} text`}
              rows={2}
              className={cn(inputCls, "flex-1 resize-none")}
            />
            <div className="flex w-24 shrink-0 items-center gap-1 rounded-2xl bg-parchment px-2 dark:bg-white/5">
              <Clock className="h-3.5 w-3.5 text-ink-soft" />
              <input
                value={s.timerMinutes}
                onChange={(e) => setSteps((xs) => xs.map((x, j) => (j === i ? { ...x, timerMinutes: e.target.value } : x)))}
                placeholder="min"
                aria-label={`Step ${i + 1} timer in minutes`}
                className="w-full bg-transparent py-2.5 text-xs outline-none dark:text-slate-100"
              />
            </div>
            {steps.length > 2 && (
              <button type="button" onClick={() => setSteps((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove step ${i + 1}`} className="rounded-full p-2 text-ink-soft hover:bg-coral/10 hover:text-coral">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSteps((xs) => [...xs, { text: "", timerMinutes: "" }])} className="flex items-center gap-1.5 text-xs font-bold text-primary-deep hover:underline dark:text-primary">
          <Plus className="h-3.5 w-3.5" /> Add step
        </button>
      </section>

      {/* Videos */}
      <section className="space-y-3 rounded-3xl bg-white p-5 shadow-soft dark:bg-obsidian-card">
        <h2 className="font-serif-title text-xl">Video links</h2>
        <p className="text-xs text-ink-soft">
          Paste YouTube, Shorts, TikTok, Instagram Reel or Facebook video URLs — we embed officially and always credit the creator.
        </p>
        {videos.map((v, i) => {
          const parsed = v.url ? parseVideoSource(v.url) : null;
          return (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={v.url}
                  onChange={(e) => setVideos((xs) => xs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  placeholder="https://www.youtube.com/watch?v=…"
                  aria-label={`Video URL ${i + 1}`}
                  className={inputCls}
                />
                {videos.length > 1 && (
                  <button type="button" onClick={() => setVideos((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove video ${i + 1}`} className="rounded-full p-2 text-ink-soft hover:bg-coral/10 hover:text-coral">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {parsed && (
                <p className={cn("text-xs font-bold", parsed.platform ? "text-herb-deep dark:text-herb" : "text-coral")}>
                  {parsed.platform ? `✓ Detected: ${parsed.label}` : "⚠ Platform not recognized — it will be linked, not embedded"}
                </p>
              )}
              {parsed?.platform && (
                <div className="mx-auto max-w-xs">
                  <VideoEmbed url={v.url} aspect="9:16" title="Preview" compactAttribution />
                </div>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => setVideos((xs) => [...xs, { url: "" }])} className="flex items-center gap-1.5 text-xs font-bold text-primary-deep hover:underline dark:text-primary">
          <Plus className="h-3.5 w-3.5" /> Add video
        </button>
      </section>

      <button
        onClick={() => { setError(null); submit.mutate(); }}
        disabled={submit.isPending}
        className="w-full rounded-full bg-gradient-to-r from-primary to-coral py-4 text-base font-extrabold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
      >
        {submit.isPending ? "Submitting…" : "Submit recipe for review"}
      </button>
    </div>
  );
}
