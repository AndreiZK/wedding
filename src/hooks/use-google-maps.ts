"use client";

import { useEffect, useState } from "react";

import { publicEnv } from "@/env";

export type GoogleMapsStatus = "no-key" | "loading" | "ready" | "error";

/** Module-level singleton so the Maps script is injected at most once per page. */
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    window.__onGoogleMapsReady = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      callback: "__onGoogleMapsReady",
      loading: "async",
      v: "weekly",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Loads the Google Maps JavaScript API once and reports its status. Returns
 * `"no-key"` when {@link publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} is unset so
 * callers can render a fallback instead of an empty map. See [[components/common]].
 */
export function useGoogleMaps(): GoogleMapsStatus {
  const key = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [status, setStatus] = useState<GoogleMapsStatus>(
    key ? "loading" : "no-key",
  );

  useEffect(() => {
    if (!key) {
      setStatus("no-key");
      return;
    }
    let active = true;
    loadGoogleMaps(key)
      .then(() => active && setStatus("ready"))
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [key]);

  return status;
}
