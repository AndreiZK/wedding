---
tags: [frontend, design-system, stable]
updated: 2026-05-22
---

# Design System — Tailwind v4

Styling uses **Tailwind CSS v4**, configured entirely in CSS. There is **no
`tailwind.config.js`**. ADR: [[decisions-log]] ADR-0004.

## Where config lives

`src/app/globals.css` is the single config file:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-onest);
}
```

Extra CSS layers can be split into `src/style/index.css` and imported.

## Design tokens

All colours, spacing, font sizes, radii, and shadows are **tokens** declared under
`:root` (raw values) and `@theme inline` (Tailwind bindings).

Once a token is in `@theme`, it becomes a utility automatically:

| Token | Generated utilities |
|-------|--------------------|
| `--color-brand` | `bg-brand`, `text-brand`, `border-brand` |
| `--radius-card` | `rounded-card` |
| `--spacing-section` | `pt-section`, `mt-section`, … |

> [!important] The token rule
> **Never** hardcode hex values, pixel spacing, or named colours in `className` or
> inline styles. If a value doesn't exist as a token, **add it to `globals.css`
> first** — with a comment noting where it came from (e.g. a Figma frame).

## CSS layers

Every custom style goes inside a layer — never outside one:

```css
@layer base {        /* element resets & defaults: h1, p, a … */ }
@layer components {  /* pseudo-elements & 3rd-party overrides only — see below */ }
@layer utilities {   /* single-purpose helpers: .scrollbar-none … */ }
```

## Where a style goes (ADR-0012)

`globals.css` is **not** a place to park component styles — it holds tokens and
base resets and stays a few hundred lines forever. Follow this order; the first
match wins:

| Situation | Goes where |
|-----------|-----------|
| One-off styling | Tailwind utilities in `className` — nothing in CSS |
| Repeated pattern with markup / structure / props | a **React component** in `components/ui/` |
| Repeated *pure-utility* combo, no structure | a Tailwind v4 `@utility` |
| Pseudo-elements, 3rd-party DOM overrides, complex selectors | `@layer components` — the genuine exceptions |
| A new colour / spacing / radius value | a **token** in `:root` + `@theme` |

> [!important] The default answer to "this looks repeated" is a **React
> component**, not a CSS class. An eyebrow label with a `::before` dot is an
> `<Eyebrow>` component — not a `.label-eyebrow` global class. `@layer
> components` is for what utilities and components genuinely *cannot* express.

There are **no CSS Modules** in this project — utilities + components cover
every case (motion is spring-based, so there are no keyframes to co-locate).

## Current theme state

The starter theme has been extended with a **warm-dark editorial wedding
palette**:

| Token | Value | Purpose |
|-------|-------|---------|
| `--w-ink` | `#181310` | Section ground (warm near-black) |
| `--w-ink-2` | `#221a15` | Layering / overlays |
| `--w-bone` | `#ece3d4` | Primary text (warm ivory) |
| `--w-gold` | `#c2a14e` | Accent / monogram (antique gold) |
| `--w-clay` | `#b3795a` | Secondary accent (terracotta) |
| `--w-muted` | `#9a8b76` | Secondary text (taupe) |

Base `background` / `foreground` and dark-mode override remain unchanged.
`@layer base/components/utilities` blocks are empty — fill them per project.

One project `@utility` exists: **`eyebrow`** — the small gold tracked all-caps
label shared across the wedding sections (a pure-utility combo applied to text
rendered by animation components, so a `@utility` per ADR-0012, not a component).
See [[components/wedding-sections]].

## Typography

Three fonts loaded in `src/app/layout.tsx`, all via `next/font/google`:

| CSS var | Font | Subsets | Tailwind class | Role |
|---------|------|---------|---------------|------|
| `--font-onest` | Onest | latin, cyrillic | `font-sans`, `font-body` | UI, body, wedding names |
| `--font-unbounded` | Unbounded | latin, cyrillic | `font-punch` | Headings & accents — section h2s, logo letters |
| `--font-caveat` | Caveat | latin, cyrillic | `font-hand` | Handwritten accents — captions, times, paragraph, closing |

Playfair Display was removed (2026-06-03). `--font-display` CSS variable has been
dropped; all former `font-display` usages are replaced by `font-punch` (headings)
or `font-hand` (captions). `html lang="ru"` is set — all fonts carry a `cyrillic` subset.

## Styling rules

- Use utilities in JSX `className`; keep class strings short and readable.
- Extract a repeated pattern to a **React component** — not a `@layer
  components` class. See *Where a style goes* above (ADR-0012).
- Mobile-first responsive: `sm:` / `md:` / `lg:` / `xl:` prefixes.
- Dark mode: `dark:` prefix or token overrides in a `prefers-color-scheme` block.
- No inline `style` except for dynamic values (e.g. spring-animated values).

## Related

[[component-conventions]] · [[animation-system]] · [[new-page]]
