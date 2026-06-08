---
tags: [frontend, stable]
updated: 2026-06-08
---

# Catalog — Common Components

Files in `src/components/common/` — shared infrastructure that may depend on
providers. Conventions: [[component-conventions]].

## Cookie — `Cookie/`

Self-contained cookie consent system — a bottom-right **banner** plus a full
category **preferences modal**. No third-party library (the old
`react-cookie-consent` dependency was removed). Lives in `src/components/common/Cookie/`.

| File | Role |
|------|------|
| `Cookie.tsx` | Mount component — hydrates the store, renders banner + modal |
| `LazyCookie.tsx` | `next/dynamic` `ssr:false` wrapper — keeps cookie JS out of first-load |
| `CookieBanner.tsx` | Bottom-right consent banner |
| `CookiePreferencesModal.tsx` | Category preferences dialog with per-category toggles |
| `CookieButton.tsx` | Local button primitive — `primary` / `secondary` variants |
| `cookieStore.ts` | Zustand store + `localStorage` persistence |
| `index.ts` | Barrel exports — `Cookie`, `LazyCookie`, `useCookieStore`, `CookieConsent` |

**Mounting** — the root layout renders `<LazyCookie />` inside `ScrollLayout`:
```tsx
import { LazyCookie } from "@/components/common/Cookie";
```

**State** — `useCookieStore` (Zustand). `consent` is `null` until the user decides;
the banner shows only after hydration confirms `consent === null`. Persisted to
`localStorage` under key `cookie-consent-v1`. Three categories: `necessary`
(always on), `analytics`, `marketing`.

**Styling & motion** — ported to the project stack: Tailwind v4 with the
`background` / `foreground` design tokens (dark-mode adaptive, no hardcoded hex),
and `@react-spring/web` for all motion — `useTransition` drives the banner and
modal mount/unmount, `useSpring` drives the toggle knob. No CSS transitions.
The modal locks scroll through the Lenis [[smooth-scroll|scroll store]]
(`useScroll.stop()`), not `body` overflow.

> [!note] `#todo`
> The privacy-policy link points to `/privacy-policy` — that route does not exist
> yet. Placeholder consent copy should be reviewed before launch.

## Grid — adaptive scaling (`grid/`)

The **adaptive scaling grid** keeps a rem-based layout proportional across every
viewport by scaling the root (`<html>`) font-size. Design in `rem` once, and the
whole UI scales as one unit. Lives in `src/components/common/grid/`.

| File | Role |
|------|------|
| `grid.config.ts` | Breakpoints + `FONT_BASE` — the single source of truth for the grid |
| `adaptive-grid.tsx` | `<AdaptiveGrid>` client component — drives the scale-up, renders `null` |
| `index.ts` | Barrel exports — `AdaptiveGrid`, `GRID_BREAKPOINTS`, … |

**How it works** — two halves cover the whole viewport range:

- **Scale down** (viewport ≤ 1920px) — `vw`-based `html { font-size }` media
  queries in `globals.css`. At each breakpoint's design base width the root
  font-size resolves to 16px; between breakpoints it tracks the viewport.
- **Scale up** (viewport > 1920px) — the `<AdaptiveGrid>` component sets an
  inline `html` font-size at runtime via [[hooks|`useAdaptiveGrid`]], so the
  design keeps growing (damped by `coef`) on large displays.

The `globals.css` media queries and `grid.config.ts` describe the same
breakpoints — **keep them in sync** (formula: `font-size = 16 * 100 / baseWidth vw`).

**Mounting** — the root layout renders `<AdaptiveGrid />` inside `ScrollLayout`:
```tsx
import { AdaptiveGrid } from "@/components/common/grid";
```
Mount it once. Props: `baseWidth` (defaults to the largest breakpoint) and
`coef` (0–1 scale-up damping, default `0.6666`).

> [!note]
> This replaced a `styled-components`-based scaling system that was dropped into
> `common/` — see [[decisions-log]] ADR-0008. `styled-components` is **not** a
> project dependency; the scale-down CSS lives in `globals.css` per [[design-system]].

## Logo — `logo.tsx`

The **"A&U" monogram**. "A" and "U" in Unbounded (`font-punch font-semibold`); ampersand in Caveat (`font-hand`) italic gold.

- `LogoMark` — presentational mark (`aria-hidden`); used by `SiteLogo`.
- `SiteLogo` — fixed top-left (`left-[1.75rem] top-[1.5rem]`, `z-40`), a `next/link`
  to `/`, drop-shadow for legibility over photos. Waits for the preloader to begin its
  exit (`useIntro.done`), then mounts and plays a `<Spring mode="once">` enter
  (`opacity 0→1`, `y -10→0`, tension 140 / friction 22) so the logo slides in
  synchronised with the veil fade. Mounted once in the root layout.

## Preloader — `preloader.tsx`

`<Preloader image={...} />` — the one-shot **intro**. A full-screen warm-palette veil
with a **spinning image** (`/assets/loader/savka.webp`, 80×80, 480°/s) centred on
screen; holds while the hero image preloads and for at least `minMs` (default
**2400ms**), then fades the veil out over `exitMs` (default **600ms**). Spinner
rotation is applied DOM-direct (no React state per frame). On exit start it sets
`useIntro.done = true` so the corner logo begins its enter animation in sync.
Locks scroll via the [[smooth-scroll|scroll store]] until done. Mounted in the root
layout (outside `ScrollLayout`, `z-[100]`).

> [!warning] Why rAF, not react-spring
> The whole intro runs on **`requestAnimationFrame`** — not react-spring. A
> standalone, root-mounted SpringValue is disposed by React StrictMode, so its
> imperative `.start()` is a **silent no-op**. The engine spring components avoid this
> internally; raw `useSpring` at the app root does not. This is the one sanctioned
> non-spring motion; it uses no CSS transitions/keyframes. See [[decisions-log]] ADR-0014.

## ReducedMotion — `reduced-motion.tsx`

`<ReducedMotion>` — a client leaf that calls react-spring's `useReducedMotion()`.
It watches the `prefers-reduced-motion` media query and toggles react-spring's
global `skipAnimation`, so every spring — and `spring-text-engine` — jumps to its
end state instead of animating. Renders `null`; mounted once in the root layout.
See [[animation-system]] and [[seo-metadata]].

## Lightbox — `lightbox.tsx`

`<Lightbox>` — a reusable full-screen image viewer. Generic (takes any image
list), used first by the wedding [[components/wedding-sections|Dresscode section]].

| Prop | Meaning |
|------|---------|
| `images` | `{ src, alt, width, height }[]` |
| `index` | active image index, or `null` when closed |
| `onClose` / `onIndexChange` | dismiss / page to another image |

- **Intuitive dismissal** — backdrop **tap** (`onClick`, so a swipe doesn't close), a
  top-right `×`, and `Esc` all close.
- **Paging** — **swipe** left/right (touch) or the `←`/`→` keys; a `i / n` counter;
  wraps around. There are **no on-screen chevrons** (removed 2026-06-08) — paging is
  swipe/keyboard only. The counter hides when there's only one image. Swipe = a
  mostly-horizontal drag past ~45px (tracked via `onTouchStart`/`onTouchEnd` on the
  dialog).
- **Scroll lock + focus** — stops Lenis via the [[smooth-scroll|scroll store]]
  (`useScroll.stop()`) while open, focuses the close button on open, restores
  focus to the opener on close. `role="dialog"` + `aria-modal`.
- **Motion** — `useTransition` fades/scales the overlay (open/leave); a keyed
  `<Spring>` fades each image on navigation. The last image is cached through the
  leave transition (index goes `null` on close).
- **Rendered through `createPortal` to `document.body`** so a section's
  `overflow-hidden` never clips it. Depends on the scroll provider → lives in
  `common/`, not `ui/`.

## VenueMap — `venue-map.tsx`

`<VenueMap lat lng zoom title />` — the wedding **venue map** via the **Google Maps
JavaScript API**, used by the location pin ([[components/wedding-sections]]).

- **Themed to the palette** — a dark, warm `styles` array built **from the `--w-*`
  tokens** read at runtime (`getComputedStyle`), so the map matches the site (land
  `--w-ink-2`, water `--w-ink`, labels `--w-muted`/`--w-bone`, a few warm-brown road
  shades). The venue marker is a **gold `CIRCLE` symbol** (`--w-gold` fill, `--w-bone`
  stroke). UI chrome is disabled; `gestureHandling: "greedy"` — a single-finger drag
  pans and pinch zooms directly, so the map is fully interactive on touch devices (the
  former `"cooperative"` required two fingers / ctrl-scroll).
- **Loads once** via [[hooks|`useGoogleMaps`]] (singleton script inject, keyed on
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). The map is created in a `useEffect` once the
  loader is `ready`.
- **Graceful fallback** — when the key is unset (`"no-key"`) or the script fails
  (`"error"`), it renders an on-palette placeholder in the same frame with an "open
  in Google Maps" link, so the section never shows a blank/broken map. See
  [[decisions-log]] ADR-0017 for why the key is a sanctioned `NEXT_PUBLIC_`.
- Types: a minimal hand-rolled `google.maps` ambient declaration
  (`src/types/google-maps.d.ts`) — no `@types/google.maps` dependency.

## Skeleton loaders

Three skeleton components for `loading` states of async-data components — every
async component must mirror its final layout with one of these
(see [[component-conventions]]).

| Component | File | For |
|-----------|------|-----|
| `<SkeletonImage>` | `skeleton-image.tsx` | image placeholders |
| `<SkeletonLoader>` | `skeleton-loader.tsx` | generic block placeholders |
| `<SkeletonVideo>` | `skeleton-video.tsx` | video placeholders |

> [!note]
> `components/ui/` (design-system primitives) does not exist yet — create it when
> the first primitive is added. See [[folder-structure]].

## Related

[[component-conventions]] · [[components/animation-springs]]
