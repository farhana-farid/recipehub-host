import { Suspense } from "react";
import { SearchClient } from "./search-client";

export const metadata = { title: "Search — RecipeHub" };

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-ink-soft">Loading search…</p>}>
      <SearchClient />
    </Suspense>
  );
}
