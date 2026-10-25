"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, LayoutGrid, PlusCircle, Heart } from "lucide-react";
import { useLang } from "@/components/providers";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const lang = useLang();
  const pathname = usePathname();

  const items = [
    { href: "/", label: tr("nav.home", lang), icon: Home },
    { href: "/search", label: tr("nav.recipes", lang), icon: BookOpen },
    { href: "/submit", label: tr("nav.add", lang), icon: PlusCircle, accent: true },
    { href: "/pantry", label: tr("nav.pantry", lang), icon: LayoutGrid },
    { href: "/favorites", label: tr("nav.favorites", lang), icon: Heart },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/60 pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/10"
    >
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-ink-soft dark:text-slate-400"
              )}
            >
              {accent ? (
                <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-glow">
                  <Icon className="h-5 w-5" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
