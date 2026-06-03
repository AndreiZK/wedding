---
tags: [frontend, stable]
updated: 2026-05-21
---

# Routing

Next.js 16 App Router. The defining convention: **routes delegate to views**.

> [!warning]
> Per `AGENTS.md`, this version of Next.js may differ from older knowledge. Heed
> deprecation notices before writing routing code.

## Route → View delegation

`app/**/page.tsx` files contain **no UI logic**. They import a component from
`src/views/` and render it. ADR: [[decisions-log]] ADR-0003.

```tsx
// src/app/page.tsx
import { HomeView } from "@/views/home";

export default function Home() {
  return <HomeView />;
}
```

All layout and UI logic lives in `src/views/home.tsx` (`HomeView`). The view is
a **Server Component**; client-only animation is isolated in a leaf
(`views/home-showcase.tsx`) — see [[component-conventions]] hard rule #6.

`HomeView` composes the wedding sections (Hero → Date & Location → Schedule →
Dresscode → Preferences). The post-hero sections are stacked in a **plain
`relative z-20 -mt-[100vh]` panel** (soft top shadow) pulled up over the hero's tail
so they **slide out from underneath the hero** — the marquet.nyc-style handoff. The
parallax is a *constant speed differential*: the hero stage drifts up slowly (its
own `stageY` transform, 0.5×) while this panel rises at 1×; the `-mt-[100vh]` is
sized so the panel fully covers the viewport exactly at the hero's pin-end (no
linear tail). The wrapper deliberately has **no `transform` or `overflow`** — either
breaks the `position: sticky` calendar pin in Date & Location, so the differential
lives on the hero stage instead (a `transform` on a sticky element is safe). See
[[components/wedding-sections]] and [[decisions-log]] ADR-0015.

**Schedule** is a direct sibling of `DateLocationSection` (same level, no extra
wrapper). The schedule section applies its own `-mt-[100vh]` internally — same
zero-gap pattern as the location pin inside `DateLocationSection`. The schedule pin
starts exactly when the location pin ends (no dead scroll between them).

**Dresscode** applies its own `-mt-[100vh]` internally (pin starts when schedule pin
ends). Dresscode exits via slow 0.5× parallax drift (not a fast whoosh), so
**Preferences** uses `-mt-[100vh]` — the standard zero-gap parallax handoff (same as
hero→content, ADR-0015). At dresscode pin-end, preferences fully covers the viewport.
See [[decisions-log]] ADR-0019, ADR-0020, ADR-0021.

## Current routes

| Route | File | View |
|-------|------|------|
| `/` | `src/app/page.tsx` | `views/home.tsx` → `HomeView` |

## Special files

`src/app/` carries the App Router special files:

| File | Role |
|------|------|
| `layout.tsx` | Root layout — provider tree, font, `metadata` + `viewport`, JSON-LD |
| `loading.tsx` | Suspense fallback — its presence enables streaming |
| `error.tsx` | Route-segment error boundary (Client Component) |
| `not-found.tsx` | 404 page — served with a 404 status |
| `robots.ts` / `sitemap.ts` | Generate `/robots.txt` and `/sitemap.xml` — see [[seo-metadata]] |
| `api/<resource>/route.ts` | API endpoints (Route Handlers) — see [[api-architecture]] |

## Adding a route

1. Create `src/app/<route>/page.tsx` — keep it ~3 lines, delegate to a view.
2. Create `src/views/<route>.tsx` — the actual page component.
3. Use route groups `app/(feature)/` to scope feature pages without affecting the URL.
4. Follow the [[new-page]] playbook.

## Layouts

- `src/app/layout.tsx` — the **root layout**. Holds the provider tree
  (`ScrollLayout` → `AdaptiveGrid` / `ReducedMotion` / `Cookie` → children),
  loads the Onest font and `globals.css`, exports `metadata` + `viewport`, and
  renders the JSON-LD script. See [[data-flow]].
- Reusable layout *wrappers* (not route layouts) live in `src/layouts/` —
  e.g. [[smooth-scroll|ScrollLayout]].

## Navigation

Use **standard Next.js navigation** — `<Link>` from `next/link` and `useRouter`
from `next/navigation`. ADR: [[decisions-log]] ADR-0005.

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
```

> [!note]
> Earlier drafts of `generic-layout-prompt.md` referenced `<AnimLink>` /
> `useAnimRouter()`. Those were never built and the convention is dropped — use
> `next/link` directly.

## SEO per route

Each route exports `metadata` via the shared generator — see [[seo-metadata]].

## Related

[[system-overview]] · [[component-conventions]] · [[new-page]]
