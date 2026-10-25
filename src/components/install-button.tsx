"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Shows an "Install app" chip once the browser fires beforeinstallprompt (Android Chrome/Edge). */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setDeferred(null));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || standalone) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setDeferred(null);
      }}
      className="hidden h-9 items-center gap-1.5 rounded-full bg-herb/15 px-3 text-xs font-semibold text-herb-deep transition-transform hover:scale-105 sm:flex dark:text-herb"
      aria-label="Install RecipeHub app on this device"
    >
      <Download className="h-3.5 w-3.5" />
      Install app
    </button>
  );
}
