"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Moon, Sun, Languages, LogOut, UserRound, Heart, LayoutGrid, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useUi, useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { InstallButton } from "@/components/install-button";

export interface Me {
  id: string;
  name: string;
  email: string;
  avatarEmoji: string;
  role: string;
}

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
  });
}

export function Header() {
  const lang = useLang();
  const { theme, toggleTheme, setLang } = useUi();
  const { data: me } = useMe();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onSearchChange(v: string) {
    setQ(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if (v.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(v.trim())}`);
    }, 400);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.refresh();
    location.href = "/";
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-orange-100/60 dark:border-white/10">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-script text-[26px] leading-none text-primary">RecipeHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {[
            { href: "/", label: tr("nav.home", lang), icon: Sparkles },
            { href: "/pantry", label: tr("nav.pantry", lang), icon: LayoutGrid },
            { href: "/favorites", label: tr("nav.favorites", lang), icon: Heart },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-primary/10 hover:text-primary-deep dark:text-slate-300 dark:hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form
          className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-full bg-white px-4 py-2 shadow-soft ring-1 ring-orange-100 focus-within:ring-2 focus-within:ring-primary/50 md:flex dark:bg-obsidian-card dark:ring-white/10"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-ink-soft dark:text-slate-400" />
          <input
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tr("action.search", lang)}
            aria-label={tr("action.search", lang)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft dark:text-slate-100"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            aria-label="Toggle language English / বাংলা"
            className="flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-primary/10 hover:text-primary-deep dark:text-slate-300"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "EN" : "বাং"}
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-primary/10 hover:text-primary-deep dark:text-slate-300"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <InstallButton />

          {me ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white px-2 pr-3 shadow-soft ring-1 ring-orange-100 dark:bg-obsidian-card dark:ring-white/10"
              >
                <span className="text-lg leading-none">{me.avatarEmoji}</span>
                <span className="hidden text-sm font-semibold sm:inline">{me.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 w-44 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-orange-100 dark:bg-obsidian-card dark:ring-white/10"
                >
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/10 dark:text-slate-100"
                  >
                    <UserRound className="h-4 w-4" /> {tr("nav.profile", lang)}
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-coral hover:bg-primary/10"
                  >
                    <LogOut className="h-4 w-4" /> {tr("auth.logout", lang)}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
              )}
            >
              {tr("auth.login", lang)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
