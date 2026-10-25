"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mic, MicOff, Play, Pause, Repeat, SkipForward, Timer as TimerIcon, BellRing, Volume2,
} from "lucide-react";
import { VideoEmbed } from "@/components/video-embed";
import { useLang } from "@/components/providers";
import { tr, pick } from "@/lib/i18n";
import { fmtClock, cn } from "@/lib/utils";

export interface CookingStep {
  order: number;
  text: string;
  textBn?: string | null;
  tip?: string | null;
  tipBn?: string | null;
  timerSeconds?: number | null;
  videoStart?: number | null;
  videoEnd?: number | null;
}

interface Props {
  slug: string;
  title: string;
  steps: CookingStep[];
  primaryVideoUrl: string | null;
  onClose: () => void;
}

/* ---------------- YouTube IFrame API (step-synced playback) ---------------- */

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: { onReady?: (e: { target: YTPlayer }) => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
  interface YTPlayer {
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    getCurrentTime: () => number;
    destroy: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYtApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return ytApiPromise;
}

/* ------------------------------- Chime ------------------------------------ */

function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1108.7, 1318.5]; // A5, C#6, E6 — bright finishing triad
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02 + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7 + i * 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + 1 + i * 0.16);
    });
    setTimeout(() => ctx.close(), 2200);
  } catch {
    /* audio blocked until user gesture — timers start from a click, so fine */
  }
}

/* ---------------------------- Cooking mode -------------------------------- */

export function CookingMode({ slug, title, steps, primaryVideoUrl, onClose }: Props) {
  const lang = useLang();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceHeard, setVoiceHeard] = useState("");
  const [timer, setTimer] = useState<{ total: number; remaining: number; running: boolean } | null>(null);
  const [flash, setFlash] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const ytHostId = useMemo(() => `yt-cooking-${slug}`, [slug]);
  const isYt = !!primaryVideoUrl && /youtube\.com|youtu\.be/.test(primaryVideoUrl);
  const ytVideoId = isYt ? primaryVideoUrl!.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null : null;
  const step = steps[idx];

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), steps.length - 1);
      setIdx(next);
      const t = steps[next].timerSeconds ?? null;
      setTimer(t ? { total: t, remaining: t, running: true } : null);
      setDone(false);
    },
    [steps]
  );

  const nextStep = useCallback(() => {
    if (idx >= steps.length - 1) {
      setDone(true);
      playChime();
    } else {
      goTo(idx + 1);
    }
  }, [idx, steps.length, goTo]);

  const repeatStep = useCallback(() => {
    if (step?.timerSeconds) setTimer({ total: step.timerSeconds, remaining: step.timerSeconds, running: true });
    const start = step?.videoStart ?? null;
    if (playerRef.current && start != null) playerRef.current.seekTo(start, true);
  }, [step]);

  const setManualTimer = useCallback((minutes: number) => {
    const total = Math.max(1, Math.round(minutes * 60));
    setTimer({ total, remaining: total, running: true });
  }, []);

  /* Timer engine */
  useEffect(() => {
    if (!timer?.running) return;
    const iv = setInterval(() => {
      setTimer((t) => {
        if (!t || !t.running) return t;
        const remaining = t.remaining - 1;
        if (remaining <= 0) {
          playChime();
          setFlash(true);
          setTimeout(() => setFlash(false), 1600);
          if (autoAdvance && idx < steps.length - 1) {
            setTimeout(() => goTo(idx + 1), 1400);
          }
          return { ...t, remaining: 0, running: false };
        }
        return { ...t, remaining };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timer?.running, autoAdvance, idx, steps.length, goTo]);

  /* YouTube step-synced player */
  useEffect(() => {
    if (!isYt || !ytVideoId) return;
    let destroyed = false;
    loadYtApi().then(() => {
      if (destroyed || !window.YT) return;
      const el = document.getElementById(ytHostId);
      if (!el) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(el, {
        videoId: ytVideoId,
        playerVars: { playsinline: 1, rel: 0, controls: 1 },
        events: {
          onReady: (e) => {
            const start = step?.videoStart;
            if (start != null) {
              e.target.seekTo(start, true);
              e.target.playVideo();
            }
          },
        },
      });
    });
    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytVideoId, ytHostId]);

  /* Keep playback inside the step's segment */
  useEffect(() => {
    if (!isYt || !playerRef.current) return;
    const start = step?.videoStart ?? null;
    const end = step?.videoEnd ?? null;
    if (start == null) return;
    playerRef.current.seekTo(start, true);
    playerRef.current.playVideo();
    const iv = setInterval(() => {
      const p = playerRef.current;
      if (!p || end == null) return;
      try {
        if (p.getCurrentTime() >= end) p.seekTo(start, true);
      } catch {
        /* player not ready */
      }
    }, 500);
    return () => clearInterval(iv);
  }, [idx, isYt, step?.videoStart, step?.videoEnd]);

  /* Voice control — Web Speech API, hands-free for messy hands */
  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    if (!SR || !voiceOn) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = lang === "bn" ? "bn-BD" : "en-US";
    rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const last = e.results[e.results.length - 1];
      const transcript = (last?.[0]?.transcript ?? "").toLowerCase();
      setVoiceHeard(transcript);
      setTimeout(() => setVoiceHeard(""), 2500);
      const saysNext = /(next|go (to )?forward|পরবর্তী|পরের|এগোও)/.test(transcript);
      const saysRepeat = /(repeat|again|আবার)/.test(transcript);
      const saysDone = /(done|finish|শেষ)/.test(transcript);
      const timerMatch = transcript.match(/(?:timer|টাইমার)\s*(\d{1,3})/) ?? transcript.match(/(\d{1,3})\s*(?:minute|min|মিনিট)/);
      if (timerMatch) setManualTimer(parseInt(timerMatch[1], 10));
      else if (saysNext || saysDone) nextStep();
      else if (saysRepeat) repeatStep();
    };
    rec.onend = () => {
      if (voiceOn) {
        try { rec.start(); } catch { /* already started */ }
      }
    };
    try { rec.start(); } catch { /* start race */ }
    recognitionRef.current = rec;
    return () => {
      voiceOn && rec.stop?.();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn, lang]);

  /* Escape closes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const pct = timer ? 1 - timer.remaining / timer.total : 0;
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-cream/95 backdrop-blur-xl dark:bg-obsidian/95"
        role="dialog"
        aria-modal="true"
        aria-label={`Cooking mode: ${title}`}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-orange-100/60 px-4 py-3 dark:border-white/10">
          <button
            onClick={onClose}
            aria-label="Exit cooking mode"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <p className="font-script text-lg leading-none text-primary">RecipeHub</p>
            <p className="truncate text-xs font-semibold text-ink-soft dark:text-slate-400">{title}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="hidden items-center gap-1.5 text-xs font-medium text-ink-soft sm:flex dark:text-slate-400">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#ED7D2B]"
              />
              Auto-advance
            </label>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              aria-pressed={voiceOn}
              title={voiceSupported ? tr("voice.listen", lang) : tr("voice.unsupported", lang)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all",
                voiceOn ? "bg-herb text-white shadow-glow" : "bg-white shadow-soft dark:bg-obsidian-card",
                !voiceSupported && "opacity-50"
              )}
            >
              {voiceOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span className="hidden sm:inline">{voiceOn ? "Listening" : "Voice"}</span>
            </button>
          </div>
        </div>

        {voiceHeard && (
          <p className="bg-herb/10 px-4 py-1.5 text-center text-xs font-semibold text-herb-deep dark:text-herb">
            🎙️ “{voiceHeard}”
          </p>
        )}

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <motion.span
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-herb/15 text-5xl"
            >
              🍽️
            </motion.span>
            <h2 className="font-serif-title text-3xl">Dish complete!</h2>
            <p className="text-sm text-ink-soft dark:text-slate-400">সব ধাপ শেষ — Enjoy your {title}!</p>
            <button
              onClick={onClose}
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105"
            >
              Back to recipe
            </button>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-5 overflow-y-auto p-4 md:grid-cols-[1fr_1.2fr] md:content-center">
            {/* Step-synced video */}
            <div>
              {isYt && ytVideoId ? (
                <div className="aspect-video w-full overflow-hidden rounded-3xl shadow-soft">
                  <div id={ytHostId} className="h-full w-full" />
                </div>
              ) : primaryVideoUrl ? (
                <VideoEmbed url={primaryVideoUrl} title={title} compactAttribution />
              ) : null}
              {step?.videoStart != null && (
                <button
                  onClick={repeatStep}
                  className="mt-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
                >
                  <Repeat className="h-3.5 w-3.5 text-primary" /> {tr("voice.repeat", lang)} clip
                  {step.videoEnd ? ` (${fmtClock(step.videoStart)} → ${fmtClock(step.videoEnd)})` : ""}
                </button>
              )}
            </div>

            {/* Step card */}
            <div className="relative rounded-3xl bg-white p-6 shadow-lift dark:bg-obsidian-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-5xl font-bold text-primary/25">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400">
                      {tr("step.of", lang)} {idx + 1}/{steps.length}
                    </p>
                  </div>
                  <p className="mt-3 font-serif-title text-xl leading-snug md:text-2xl">
                    {pick(lang, step?.text, step?.textBn)}
                  </p>
                  {step?.tip && (
                    <div className="mt-4 rounded-2xl border-l-4 border-primary bg-parchment p-3.5 dark:bg-white/5">
                      <p className="text-sm italic leading-relaxed text-ink/80 dark:text-slate-300">
                        <span className="font-bold not-italic text-primary-deep dark:text-primary">Tip: </span>
                        {pick(lang, step.tip, step.tipBn)}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Timer ring */}
              <div className="mt-5 flex items-center gap-4">
                {timer ? (
                  <div className="relative h-28 w-28 shrink-0" role="timer" aria-label={fmtClock(timer.remaining)}>
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-cream-deep dark:stroke-white/10" />
                      <circle
                        cx="60" cy="60" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
                        className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", timer.remaining === 0 ? "stroke-herb" : "stroke-primary")}
                        strokeDasharray={C}
                        strokeDashoffset={C * (1 - pct)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("font-mono text-xl font-bold", timer.remaining === 0 && "text-herb")}>
                        {fmtClock(timer.remaining)}
                      </span>
                      <span className="text-[10px] font-medium text-ink-soft">
                        {timer.remaining === 0 ? tr("timer.done", lang) : timer.running ? "cooking…" : "paused"}
                      </span>
                    </div>
                    {flash && <BellRing className="absolute -right-1 -top-1 h-6 w-6 animate-bounce text-coral" />}
                  </div>
                ) : (
                  <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-parchment dark:bg-white/5">
                    <TimerIcon className="h-6 w-6 text-ink-soft" />
                    <span className="text-[10px] text-ink-soft">no timer</span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {timer && (
                      <button
                        onClick={() => setTimer((t) => (t ? { ...t, running: !t.running } : t))}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow transition-transform hover:scale-105"
                      >
                        {timer.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        {timer.running ? "Pause" : "Resume"}
                      </button>
                    )}
                    <button
                      onClick={() => setManualTimer(5)}
                      className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold shadow-soft transition-transform hover:scale-105 dark:bg-obsidian-card"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-herb" /> 5 min
                    </button>
                  </div>
                  <button
                    onClick={nextStep}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    {idx >= steps.length - 1 ? "Finish 🍽️" : tr("voice.next", lang)}
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Step dots */}
              <div className="mt-5 flex gap-1.5" role="tablist" aria-label="Cooking steps">
                {steps.map((s, i) => (
                  <button
                    key={s.order}
                    role="tab"
                    aria-selected={i === idx}
                    aria-label={`Step ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-all",
                      i === idx ? "bg-primary" : i < idx ? "bg-herb/60" : "bg-cream-deep dark:bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
}
