# Design Tokens — Version B · Forest & Brass

Everything your Claude Code agent needs to reproduce the look of version B exactly.

---

## 1 · Google Fonts — load order matters

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Unbounded:wght@400;600;800&family=Onest:wght@400;500;600;700;800&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

| Role | Family | Used for |
|---|---|---|
| `--f-display` | Playfair Display | Section/venue headings, calendar month (italic) |
| `--f-punch` | Unbounded 800 | Hero headline "МЫ ЖЕНИМСЯ!" — the loud shout |
| `--f-sans` | Onest | Body copy, labels, calendar days, buttons |
| `--f-hand` | Caveat | Hand-written notes, kicker text, address, marker annotations |

### Font usage rules
- **Hero headline** — `Unbounded`, weight `800`, size `44px`, tracking `-.02em`, `line-height: .84`, `text-transform: uppercase`
- **Display headings** (venue name, calendar month) — `Playfair Display`, weight `700`, optionally italic
- **Eyebrow labels** — `Onest`, weight `600`, size `12px`, tracking `.32em`, `text-transform: uppercase`
- **Script accents** — `Caveat`, weight `600–700`, slightly rotated (`rotate(-2deg)` to `rotate(-6deg)`) for handmade feel

---

## 2 · Color Palette

```css
:root {
  /* Backgrounds */
  --bg:      #eef0e3;   /* cool oat-green — main page bg */
  --bg2:     #e6e9d8;   /* slightly deeper — alternate section wash */
  --paper:   #f3f4ea;   /* card / calendar surface */

  /* Text */
  --ink:     #22342a;   /* deep forest green — all primary text */
  --soft:    #5f6f5c;   /* secondary / muted text */
  --faint:   #94a08c;   /* captions, calendar day-of-week labels */

  /* Accents */
  --accent:  #b0833f;   /* brass / antique gold — primary accent, CTAs, highlights */
  --accent2: #2f4a39;   /* deep forest green — quiet secondary accent */

  /* Utility */
  --line:    rgba(34, 52, 42, .16);   /* dividers, card borders */
  --mark:    rgba(176, 131, 63, .95); /* hand-drawn SVG strokes (ellipses, arrows) */
  --pin:     #b0833f;                 /* map pin fill */
}
```

### Palette at a glance
| Swatch | Hex | Role |
|---|---|---|
| ![bg](https://placehold.co/14x14/eef0e3/eef0e3) | `#eef0e3` | Page background |
| ![bg2](https://placehold.co/14x14/e6e9d8/e6e9d8) | `#e6e9d8` | Alt section background |
| ![paper](https://placehold.co/14x14/f3f4ea/f3f4ea) | `#f3f4ea` | Card / calendar surface |
| ![ink](https://placehold.co/14x14/22342a/22342a) | `#22342a` | Primary text |
| ![soft](https://placehold.co/14x14/5f6f5c/5f6f5c) | `#5f6f5c` | Secondary text |
| ![faint](https://placehold.co/14x14/94a08c/94a08c) | `#94a08c` | Captions |
| ![accent](https://placehold.co/14x14/b0833f/b0833f) | `#b0833f` | Brass accent |
| ![accent2](https://placehold.co/14x14/2f4a39/2f4a39) | `#2f4a39` | Deep green accent |

---

## 3 · Paper Grain Overlay

The grain is a pure-CSS SVG feTurbulence texture. **No image file needed.**

```css
/* 1. Set the grain as a CSS variable (or inline it directly) */
:root {
  --grain-url: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}

/* 2. Add a full-coverage pseudo-element (or real div) on every section */
.section::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 40;                      /* sits above content visually but pointer-events off */
  mix-blend-mode: multiply;         /* critical — blends with bg color, not flat grey */
  opacity: 0.5;                     /* 0.4–0.6 is the sweet spot */
  background-image: var(--grain-url);
  background-size: 240px 240px;     /* tile at 240×240 for natural repeat */
}
```

**Key properties:**
| Property | Value | Why |
|---|---|---|
| `mix-blend-mode` | `multiply` | Makes grain invisible on white, visible on colour |
| `opacity` | `0.5` | Subtle but noticeable; reduce to `0.35` on dark sections |
| `background-size` | `240px 240px` | Tile size — smaller = finer grain |
| `baseFrequency` | `0.8` | Controls grain coarseness; higher = finer |
| `numOctaves` | `2` | Detail layers; 2 is enough for paper feel |
| `type` | `fractalNoise` | Softer/organic vs `turbulence` which is harsher |
| `pointer-events` | `none` | Never block clicks |

---

## 4 · Hand-drawn SVG Marks

All strokes use `var(--mark)` so they re-tint automatically.

### Rough ellipse (circles key words / photo frame)
Uses `stroke-dasharray` + `stroke-dashoffset` animation to "draw in" on scroll.

```html
<svg viewBox="0 0 200 110" preserveAspectRatio="none"
     fill="none" stroke="var(--mark)" stroke-width="2.4" stroke-linecap="round"
     style="--len:560; stroke-dasharray:560; stroke-dashoffset:560;
            animation: drawIn 1.1s ease .35s forwards;">
  <path d="M58 16 C24 20 10 50 24 78 C40 108 120 110 162 92
           C198 76 200 34 168 18 C140 5 96 7 64 14 C58 15.2 53 16 49 17" />
</svg>

<style>
@keyframes drawIn { to { stroke-dashoffset: 0; } }
</style>
```

### Wavy underline
```html
<svg viewBox="0 0 200 16" preserveAspectRatio="none"
     fill="none" stroke="var(--mark)" stroke-width="2.6" stroke-linecap="round"
     style="stroke-dasharray:230; stroke-dashoffset:230;
            animation: drawIn 1s ease .2s forwards;">
  <path d="M4 10 C30 3 48 14 76 8 C102 2.5 126 14 154 8 C176 3.4 192 11 196 8" />
</svg>
```

### Curved annotation arrow
```html
<svg width="58" height="48" viewBox="0 0 58 48"
     fill="none" stroke="var(--mark)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M52 6 C44 4 22 6 12 24 C9 30 8 36 9 42" />
  <path d="M3 33 L9 44 L18 39" />
</svg>
```

---

## 5 · Scroll-reveal Animation

Simple CSS-only reveal — works reliably inside nested scroll containers (no IntersectionObserver needed).

```css
/* Entrance: elements animate in automatically when they mount */
@keyframes rvIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}

.reveal {
  animation: rvIn .85s cubic-bezier(.2, .7, .2, 1) both;
}

/* Stagger children by index */
.reveal:nth-child(1) { animation-delay: 0s;    }
.reveal:nth-child(2) { animation-delay: .12s;  }
.reveal:nth-child(3) { animation-delay: .22s;  }
.reveal:nth-child(4) { animation-delay: .32s;  }

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none; opacity: 1; transform: none; }
}
```

---

## 6 · Typography Scale

```css
/* Eyebrow label */
.eyebrow {
  font-family: 'Onest', system-ui, sans-serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: .32em;
  text-transform: uppercase;
  color: var(--accent);
}

/* Hero headline */
.hero-headline {
  font-family: 'Unbounded', sans-serif;
  font-weight: 800;
  font-size: 44px;
  line-height: .84;
  letter-spacing: -.02em;
  text-transform: uppercase;
  color: var(--ink);
}

/* Display / section heading */
.display-heading {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-size: 54px;
  line-height: .94;
  color: var(--ink);
}

/* Italic serif accent (e.g. calendar month) */
.italic-accent {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 34px;
  color: var(--accent);
}

/* Body / label */
.body {
  font-family: 'Onest', system-ui, sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: var(--soft);
}

/* Handwritten note */
.handwritten {
  font-family: 'Caveat', cursive;
  font-weight: 600;
  font-size: 28px;
  color: var(--accent);
  transform: rotate(-2deg);   /* slight tilt = handmade feel */
}
```
