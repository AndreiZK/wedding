// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import { useEffect, useRef } from "react";

import { useGoogleMaps } from "@/hooks/use-google-maps";

export interface VenueMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  /** Accessible name + fallback caption. */
  title: string;
}

/** Frame shared by the live map and the fallback so the reveal looks identical. */
const FRAME =
  "h-[clamp(14rem,38vh,22rem)] w-full overflow-hidden rounded-[1.25rem] border border-w-bone/15 bg-w-ink-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)]";

interface Palette {
  ink: string;
  ink2: string;
  bone: string;
  gold: string;
  muted: string;
}

/** Read the warm palette from the `--w-*` design tokens (single source of truth). */
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;
  return {
    ink: tok("--w-ink", "#181310"),
    ink2: tok("--w-ink-2", "#221a15"),
    bone: tok("--w-bone", "#ece3d4"),
    gold: tok("--w-gold", "#c2a14e"),
    muted: tok("--w-muted", "#9a8b76"),
  };
}

/** A dark, warm map theme derived from the site palette. */
function mapStyles(p: Palette): google.maps.MapTypeStyle[] {
  return [
    { elementType: "geometry", stylers: [{ color: p.ink2 }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: p.muted }] },
    { elementType: "labels.text.stroke", stylers: [{ color: p.ink }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: p.bone }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b1610" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2218" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: p.ink }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: p.muted }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a2c1d" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: p.ink }] },
  ];
}

/**
 * Venue map via the **Google Maps JavaScript API**, themed to the warm palette
 * (styles built from the `--w-*` tokens) with a gold pin on the venue. The script
 * loads through [[use-google-maps]]; when no key is configured (or the script
 * fails) it falls back to an on-palette placeholder with an "open in Maps" link, so
 * the section never shows a broken/blank map. See ADR-0017 for the public-key note.
 */
export const VenueMap = ({ lat, lng, zoom = 15, title }: VenueMapProps) => {
  const status = useGoogleMaps();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (status !== "ready" || !ref.current || mapRef.current) return;
    const g = window.google;
    if (!g?.maps) return;

    const palette = readPalette();
    const map = new g.maps.Map(ref.current, {
      center: { lat, lng },
      zoom,
      disableDefaultUI: true,
      clickableIcons: false,
      keyboardShortcuts: false,
      // "greedy" — drag pans and wheel/pinch zoom directly on the map (no
      // ctrl-scroll requirement). The container carries `data-lenis-prevent` so
      // Lenis does not also smooth-scroll the page while the pointer is over it.
      gestureHandling: "greedy",
      backgroundColor: palette.ink,
      styles: mapStyles(palette),
    });
    new g.maps.Marker({
      position: { lat, lng },
      map,
      title,
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: palette.gold,
        fillOpacity: 1,
        strokeColor: palette.bone,
        strokeWeight: 2,
      },
    });
    mapRef.current = map;
  }, [status, lat, lng, zoom, title]);

  if (status === "no-key" || status === "error") {
    const href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${FRAME}`}>
        <span className="eyebrow">{title}</span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-body text-sm tracking-wide text-w-gold underline-offset-4 hover:underline"
        >
          Открыть в Google Maps →
        </a>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label={title}
      className={FRAME}
      data-lenis-prevent
    />
  );
};
