export const metadata = { title: "Offline — RecipeHub" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
      <span className="text-5xl">📡</span>
      <h1 className="mt-3 font-serif-title text-2xl">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-ink-soft">
        RecipeHub is installed on your device, so pages you&apos;ve already visited stay available.
        Reconnect to load fresh recipes and videos.
      </p>
    </div>
  );
}
