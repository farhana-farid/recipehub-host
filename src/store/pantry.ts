"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PantryState {
  items: string[]; // normalized ingredient names
  add: (name: string) => void;
  remove: (name: string) => void;
  toggle: (name: string) => void;
  clear: () => void;
  has: (name: string) => boolean;
}

export const usePantry = create<PantryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (name) => set((s) => (s.items.includes(name) ? s : { items: [...s.items, name] })),
      remove: (name) => set((s) => ({ items: s.items.filter((i) => i !== name) })),
      toggle: (name) => (get().items.includes(name) ? get().remove(name) : get().add(name)),
      clear: () => set({ items: [] }),
      has: (name) => get().items.includes(name),
    }),
    { name: "rh-pantry" }
  )
);

/** Checked-off ingredients while cooking, keyed per recipe slug. */
interface ChecklistState {
  checked: Record<string, string[]>;
  toggle: (slug: string, name: string) => void;
  setAll: (slug: string, names: string[], on: boolean) => void;
  clear: (slug: string) => void;
}

export const useChecklist = create<ChecklistState>()(
  persist(
    (set, get) => ({
      checked: {},
      toggle: (slug, name) =>
        set((s) => {
          const list = s.checked[slug] ?? [];
          const next = list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
          return { checked: { ...s.checked, [slug]: next } };
        }),
      setAll: (slug, names, on) =>
        set((s) => ({ checked: { ...s.checked, [slug]: on ? names : [] } })),
      clear: (slug) => set((s) => ({ checked: { ...s.checked, [slug]: [] } })),
    }),
    { name: "rh-checklist" }
  )
);
