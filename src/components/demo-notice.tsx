import Link from "next/link";

/** Shown on server-backed feature pages inside the static demo build. */
export function DemoNotice({ title, emoji, children, action }: { title: string; emoji: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft dark:bg-obsidian-card">
      <span className="text-5xl">{emoji}</span>
      <h1 className="mt-3 font-serif-title text-2xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-400">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block rounded-full bg-herb/15 px-5 py-2.5 text-sm font-bold text-herb-deep transition-transform hover:scale-105 dark:text-herb"
        >
          {action.label}
        </Link>
      )}
      <div className="mt-3">
        <Link
          href="/"
          className="text-sm font-bold text-primary-deep hover:underline dark:text-primary"
        >
          ← Back to recipes
        </Link>
      </div>
    </div>
  );
}
