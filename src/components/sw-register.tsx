"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable + offline-capable. */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost" && window.location.port === "3000") {
      // Still register on localhost — Chrome requires it for the install prompt in dev.
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
