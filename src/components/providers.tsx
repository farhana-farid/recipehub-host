"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

interface UiState {
  theme: "light" | "dark";
  lang: Lang;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "light",
      lang: "en",
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        document.documentElement.classList.toggle("dark", next === "dark");
      },
      setLang: (lang) => set({ lang }),
    }),
    { name: "rh-theme" }
  )
);

/** Convenience hook for localized UI strings. */
export function useLang(): Lang {
  return useUi((s) => s.lang);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })
  );

  // Keep the DOM class in sync with the persisted theme after hydration.
  const theme = useUi((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
