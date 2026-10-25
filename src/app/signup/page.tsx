"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign up failed");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    router.push("/");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-2xl bg-parchment px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-primary/40 dark:bg-white/5 dark:text-slate-100";

  return (
    <div className="mx-auto max-w-md">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl bg-white p-7 shadow-soft dark:bg-obsidian-card"
      >
        <div className="text-center">
          <p className="font-script text-3xl text-primary">RecipeHub</p>
          <h1 className="mt-2 font-serif-title text-2xl">Join the kitchen</h1>
        </div>
        {error && <p className="rounded-2xl bg-coral/10 px-4 py-2.5 text-sm font-semibold text-coral" role="alert">{error}</p>}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft" htmlFor="name">Name</label>
          <input id="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft" htmlFor="password">Password (8+ chars)</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-primary to-coral py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary-deep hover:underline dark:text-primary">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
