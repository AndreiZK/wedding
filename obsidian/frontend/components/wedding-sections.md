---
tags: [frontend, feature, wedding]
updated: 2026-06-08f
---

# Wedding — Page Sections

Feature-specific components for the wedding invitation page. Section views live in
`src/views/wedding/`; their content lives in `src/data/mocks/`. All sections
share the warm-dark editorial system: `--w-*` palette, Onest + Unbounded + Caveat
fonts, the `eyebrow` utility, and seamless `bg-w-ink` flow between them.

**Section order:** Hero → Date & Location → Schedule → Dresscode → Preferences form.

## Shared transition system (date · location · schedule · dresscode)

All four content sections share **one** reveal trigger and **one** exit-handoff so
every seam reads the same (ADR-0032):

- **Reveal line** — each section observes its **heading** through
  [[hooks#`useRevealOnEnter`|`useRevealOnEnter`]] with the exported
  `REVEAL_ROOT_MARGIN = "0px 0px -20% 0px"` (top 80vh of the viewport). `revealed`
  fires once when the heading crosses the 80vh-from-top line — identical timing in
  a dvh panel, the pinned carousel, or the tall dresscode. The eyebrow then springs
  in immediately (shared `SectionHeading`); the heading letters follow at
  `headingDelayIn={450}` everywhere.
- **Declarative reveals** — every reveal spring is `useSpring({ …: revealed ? a : b })`
  (or the declarative `useSprings(n, [...])` array), never a one-shot `api.start()`.
  They reach *and hold* their end state, so unrelated re-renders (e.g. the dresscode
  gender switch) never reset them to 0.
- **Old exits faster than new enters** — the next section overlaps the current one by
  `-mt-[20vh]` and the **exiting** content gets an upward exit-parallax tuned to ~1.2×
  the 1× incoming section over that 20vh overlap. Flowing dvh panels add `-12vh` on top
  of their 1× scroll; the pinned schedule, which contributes 0× while pinned, sources
  the whole lift from parallax (`24vh` over the overlap window). Driven by `.set()`.

The dresscode→preferences seam is **not** part of this group — dresscode deliberately
*lags* out (+16vh) so the form rushes up underneath it (ADR-0031).

## Hero

Files: `src/views/wedding/hero-section.tsx`, `src/data/mocks/hero.ts`.

**Look & feel** (scroll-pinned reveal, current design — inspired by
zuffa.studio) — over a **warm palette gradient** (a `--w-clay` glow on a top-lit
`--w-ink-2`→`--w-ink` wash) one **small square image** sits in the middle with a
headline above (**`МЫ ЖЕНИМСЯ!`** in `--w-bone`) and below (**`ПРИХОДИТЕ
ПОСМОТРЕТЬ`** in `--w-gold`). As the user scrolls, the section **pins** and a
single scroll-progress value (0→1) drives everything: the image **grows from the
square to fill the viewport** (its aspect morphs to the screen's shape — on mobile
square → portrait), the two headlines are **pushed away** (top slides up, bottom
slides down) while they **blur and fade out**, and an **invitation
paragraph reveals letter-by-letter with the scroll** (over a `--w-ink` scrim
ramped in for legibility once the image is **held** full-screen). Once it is fully
visible the held stage **drifts up slowly** while the **next section slides up over
it faster** — a parallax overlap — the **next section sliding out from underneath**
(parallax handoff, marquet.nyc-style — see [[routing]] / [[decisions-log]] ADR-0015).
Replaces the earlier split-screen groom/bride lockup (see [[changelog]] 2026-05-29).

### Component — `hero-section.tsx`

Client leaf. Key implementation notes:

- **Pin mechanism** — the outer element is a **`<ProgressTrigger tag="section">`**
  (`h-[380vh]`, pin ≈ 280vh, `start="top top"` → `end="bottom bottom"`) wrapping a
  sticky **`animated.div`** stage (`sticky top-0 h-dvh overflow-hidden`). The tall
  height gives a relaxed scrub distance **plus a held tail + a slow exit**; the
  trigger maths are section-height-independent (progress 0 at pin-start, 1 at
  pin-end).
- **One progress → many interpolations (with a hold)** — `onChange` writes
  `progress` into a single `useSpring` value `p`; the choreography runs off a
  *clamped* `c = p.to([0, HOLD_START 0.42, 1], [0, 1, 1])` so every visual property
  (`c.to([...stops], [...])`, clamped at both ends) **finishes by `HOLD_START`**
  (image full-screen at p≈0.36), then the stage **holds** full-screen while the
  paragraph reveals (below). No CSS transitions/keyframes — all motion is
  react-spring (rule 1).
- **Exit parallax (constant)** — from the moment the next section peeks (p≈0.64),
  `stageY = p.to([0,0.643,1],[0,0,-50])` translates the whole sticky stage up
  `-50vh` over the overlap at a *constant* **0.5×** scroll speed, while the next
  section rises at 1× (via `-mt-[100vh]` in [[routing]]): slower upper layer, faster
  lower layer. The overlap is sized so the section **fully covers the viewport at
  pin-end**, so the differential never decays into same-speed motion once the pin
  releases. The transform sits on the sticky stage itself, which is safe (`overflow`
  on an *ancestor* breaks sticky; a `transform` on the element does not). See
  ADR-0015.
- **Backdrop** — a full-bleed `span` (z-0) with an inline `backgroundImage` of two
  stacked radial gradients built from the `--w-*` tokens via `color-mix` (no raw
  hex). Only visible around the small square; covered once the image fills.
- **Image (initial crop → screen morph)** — `next/image` `fill object-cover` in an
  `animated.div` positioned with inline `top: calc(50% - contentOffsetVh vh)`,
  `left: 50%`, `transform: translate(-50%,-50%)` — `CONTENT_OFFSET_VH = 4` on
  desktop (`vw ≥ 768`) shifts the composition 4 vh above true centre; mobile uses
  `MOBILE_CONTENT_OFFSET_VH = 1.5` so the image + headlines sit a touch lower
  (scroll affordance at `bottom-[5vh]` is independent). `width` animates from `side`
  (`min(vw,vh) * SQUARE_FRAC 0.6`) to `vw`; `height` animates from `initialH` to
  `vh + 2·offsetPx` over `c [0,0.85]`. **`initialH`** is `side` on mobile (the
  original 1:1 square) but **`side × DESKTOP_HEIGHT_FRAC 0.5`** on desktop
  (`vw ≥ 768`) — a landscape crop, ~half the height — so the top headline block
  clears the top of the viewport (a full square cramped/clipped «МЫ» on desktop;
  fixed 2026-06-08, ADR-0033). Height overshoots by `2×offsetPx` so the bottom edge
  still lands exactly at `vh`; the top bleeds above the stage and is clipped by
  `overflow-hidden`. `borderRadius 28px → 0`. The headline anchors use `initialH / 2`
  (not `side / 2`) so they track the actual image edges. **No spacer span** — see
  headline positioning below.
- **Headlines** — both headline groups are `position: absolute` with inline `bottom`/
  `top` anchored to the image's true position:
  - *Top group* (`bottom: calc(50% + contentOffsetVh vh + initialH/2 px + GAP_VH vh)`):
    kicker `<p font-hand -rotate-2>`, `TextEngine font-punch text-w-bone` (first
    word of `topText`), `TextEngine font-punch text-w-gold` (remaining words). Both
    TextEngine lines use `LINE_REVEAL` + `PUNCH_CLASS`.
  - *Bottom group* (`top: calc(50% − contentOffsetVh vh + initialH/2 px + GAP_VH vh)`):
    `TextEngine HAND_REVEAL font-hand text-3xl text-w-gold` for `bottomText`.
    `HAND_REVEAL` is a word-fade config (no `overflow:true`) — Caveat's glyphs
    overhang their advance boxes and a `wrapLine overflow:hidden` clips the last
    letter; word-fade avoids the mask entirely while suiting the softer aesthetic.
  Both groups share `topY`/`bottomY`, `headlineOpacity`, `headlineBlur` animated
  containers. `GAP_VH = 4` is the spacing between each headline group and the
  nearest image edge.
- **Scrim & paragraph** — an `animated.span` `bg-w-ink` scrim fades to `0.5` over
  `c [0.5,0.92]`; the paragraph is a **`<TextEngine mode="progress"
  type="toggle">`** (`font-hand italic`) whose **letters pop in one by one** with the
  scroll (`letterOut {opacity:0, y:"0.4em"}` → `letterIn {opacity:1, y:"0em"}`,
  `letterConfig` spring) over the held window. Two gotchas (both in ADR-0015):
  - **`trigger` must be a plain-DOM proxy.** Because the paragraph is pinned at
    viewport centre it can't trigger on its own position, so its `trigger` is a
    full-section proxy `<div ref … className="absolute inset-0 -z-10">` rendered as
    the section's first child. ⚠️ It must be a *plain* node, **not** the
    `<ProgressTrigger>` via `useImperativeHandle` — that ref is `null` when the
    engine wires up, so progress falls back to the centred paragraph and the text
    shows fully revealed from the top.
  - **`type="toggle"`, not `"interpolate"`.** Toggle springs each letter in only
    once `progress > index/letters`, so at progress 0 *all* letters are hidden.
    Interpolate pre-reveals the first ~`coefficient` of letters at progress 0
    (visible on load) and bunches the reveal into word-sized chunks.

  The `start="center center"`/`end="center top"` window opens once the image is full
  and closes just before the exit. Unlike the decorative headlines it keeps `seo` on
  (default) — it's real content (the engine renders a clipped plain copy +
  `aria-hidden`s the split letters).
- **Scroll affordance** — a small `eyebrow` "листайте" + hairline that shares the
  headlines' `opacity` so it disappears as the reveal progresses.

**Semantics** — one real `<h1 class="sr-only">` from `data.heading`; the visible
headlines are decorative (`aria-hidden` wrapper, `TextEngine seo={false}`) to avoid
duplicate announcement. Overlay layers are `pointer-events-none`.

### Mock data — `hero.ts`

```ts
export interface HeroImage { src: string; alt: string; width: number; height: number; }
export interface HeroData {
  image: HeroImage;   // the centre image that grows to full-bleed
  topText: string;    // headline above ("МЫ ЖЕНИМСЯ!")
  bottomText: string; // headline below ("ПРИХОДИТЕ ПОСМОТРЕТЬ")
  heading: string;    // real, visually-hidden <h1>
  paragraph: string;  // invitation copy that fades in at the end
}
```

**Image asset** — `public/assets/hero/hero-main.webp` (real portrait photo,
4284×5712). The old split-screen `{groom,bride}.jpg` are no longer referenced.

## Date & Location

Files: `src/views/wedding/date-location-section.tsx`,
`src/views/wedding/calendar-flip.tsx`, `src/data/mocks/date-location.ts`.

**Date:** **16 июля 2026** (четверг). **Location:** **River Hall, Гродно**.

**Look & feel** — **two natural-height (h-dvh) panels**. **Date:** `когда?` label springs in; the
calendar **flips through months automatically** (time-driven, ~2.5 s) and draws
the gold ring; then the note fades in. **Location:** `где?` label fires; venue +
city + street reveal letter by letter; map fades in. Sections overlap by −20 vh so
the next panel peeks during the exit. Exit: inner content translates −12 vh over
the exit window (slightly faster than the section itself). See ADR-0024.

### Component — `date-location-section.tsx` (two snap panels)

Client leaf. The `<section>` holds the real `<h2 class="sr-only">` + `<time>`.
Each panel is a `<ProgressTrigger tag="div" start="top bottom" end="bottom top"
className="h-dvh overflow-hidden">`. The **date** panel carries `bg-w-ink`; the
**location** panel does not — it inherits the same oat ground from the `home.tsx`
wrapper (`bg-w-ink` on the `z-20` content shell), so the date→location overlap
does not stack a second opaque layer during the handoff.

**Entry trigger:** each panel's heading is observed via the shared [[hooks#`useRevealOnEnter`|`useRevealOnEnter`]] (`REVEAL_ROOT_MARGIN`, 80vh-from-top line) — for a dvh panel that's the same point as the old `threshold 0.7` on content, now the project-wide reveal line (ADR-0032). Exit parallax: `dp.to([0,0.5,1],[0,0,-12])`, driven via `dpApi.set()` (immediate, no spring lag — prevents stale value on re-entry). See [[#Shared transition system]], ADR-0028/0029/0032.

**Date panel** (`h-dvh`, `aria-hidden` inner div — purely decorative):

| Event | What happens |
|-------|--------------|
| heading crosses reveal line | `когда?` label spring fires: `y 24→0, scale 2.6→1, opacity 0→1` (shared `useRevealOnEnter`) |
| same frame | `t` spring runs 0→1 over 2500 ms — drives `CalendarFlip` |
| t 0.08→0.16 | calendar fades in |
| t 0.18→0.56 | calendar flips April → July |
| t 0.58→0.70 | gold ring draws on the 16th |
| delay 2200 ms | gathering-time note fades / rises in |

**Location panel** (`h-dvh`, `−mt-[20vh]`, no `bg-w-ink` on the panel):

| Event | What happens |
|-------|--------------|
| heading crosses reveal line | `где?` label spring fires; `revealed` set (shared `useRevealOnEnter`) |
| revealed + 500 ms | venue `<h3>` cascades in (`TextEngine mode="once" delayIn={500}`) |
| revealed + 1000 ms | city `<p>` cascades in |
| revealed + 1450 ms | street `<p>` cascades in |
| revealed + 1950 ms | `<VenueMap>` fades + scales in |

**Exit parallax (both panels):** `dp.to([0.5, 1], [0, -12])` → `translateY(-12vh)` on the inner content over the exit window. Progress 0.5 = section top at viewport top (snapped); progress 1 = section top at viewport bottom (fully exited). Gives a subtle >1× exit speed.

**No snap** — snap removed; panels free-scroll (ADR-0026).

**Label pattern (shared):** the eyebrow is the shared `<SectionHeading eyebrow enabled={revealed}>` (declarative, `LABEL_CONFIG` tension 200 friction 28). Calendar `t`, note, and map fade are declarative `useSpring({ …: revealed ? a : b })` gated on the `revealed` flag from `useRevealOnEnter` — they reach *and hold* their end state, fixing the old "elements disappear on scroll-out" bug. Exit-parallax `dp`/`lp` keep continuous `.set()`. See ADR-0030, ADR-0032.

### Component — `calendar-flip.tsx` (`CalendarFlip`)

Client leaf; takes the `p` progress `SpringValue` + `iso`. Builds `count` (4)
Monday-first 6-row month grids ending on the target month (`buildMonth` →
`(getDay()+6)%7` first weekday, padded to 42 cells). Each month is an **opaque,
absolutely-stacked card** (`bg-w-ink-2`, earlier months higher `z`); as `p`
advances each card flips like a **real wall-calendar page** bound at the top: its
bottom edge lifts **toward the viewer** and arcs **over the top** (`rotateX 0 →
+100°`, `transformOrigin: top`, container `perspective`, `backfaceVisibility:
hidden`), retiring just past vertical to reveal the next month beneath. The
**positive** rotation is what makes it read as a page turning toward you; a
negative angle (the earlier version) swung the bottom *away* into the screen — a
flat, unrealistic "fall back". Opaque + backface-hidden give a clean turn with no
ghosting (the back of the page is never shown, keeping the over-the-top arc within
the stage's `overflow-hidden`). The last card's
day overlays a slightly-rotated `<svg>` ring (`<animated.path>`, **`pathLength={1}`
+ `strokeDasharray={1}`**, `strokeDashoffset 1 → 0`, stroke `var(--w-gold)`) keyed
to the `0.58–0.70` window. RU month names are derived in-component.

**Semantics** — real `<h2 class="sr-only">` (full date) + `<time dateTime>` for the
machine date; the venue is a real `<h3>` and the city a `<p>`, both `<TextEngine>`
with `seo` on (the engine renders a hidden plain copy + `aria-hidden`s the animated
letters, so they stay accessible). The date pin's calendar is `aria-hidden`; the
location stage is **not** (its map is interactive), only its `где?` label is.

### Mock data — `date-location.ts`

`DateLocationData` = `{ date, location }`. `date` holds `eyebrow ("когда?") /
weekday / day / month (genitive) / year / note / iso`; `location` holds `eyebrow
("где?") / venue ("River Hall") / address ("Гродно") / lat / lng / zoom / mapTitle`.
RU month names for the calendar are derived in `CalendarFlip` from `iso`. `lat`/`lng`
center the `<VenueMap>` and place its pin — the Grodno coordinates are **approximate**;
set River Hall's exact point.

## Schedule

Files: `src/views/wedding/schedule-section.tsx`, `src/data/mocks/schedule.ts`.

**Look & feel** — a **scroll-pinned horizontal sliding carousel**. As the user
scrolls through the pinned section, items slide from the first (centred) to the
last (centred). The heading (shared `SectionHeading`) and the **timeline both
reveal on inview** as the section enters — the timeline fades in ~700 ms after the
heading, no extra scrolling required. *Scroll then drives only the timeline
progress* (track position, gold fill, per-item text). Each item's text fades **in**
as it reaches the centre and **stays visible** as it leaves. The last item lands
centred exactly at `p = 1`, so the pin releases the moment the timeline ends (no
dead scroll) and the section hands off like any other via the dresscode
`-mt-[20vh]` overlap — no fast exit whoosh. See ADR-0030 (supersedes the
heading-gate/exit mechanics of ADR-0029, ADR-0024, ADR-0026).

### Component — `schedule-section.tsx`

Client leaf. All scroll animation off one `useSpring` value `p`.

- **Pin** — `<ProgressTrigger tag="section" start="top top" end="bottom bottom">`,
  `style={{ height: "${pinHeightVh}vh" }}` (`n × 80 + 60` vh; 460 vh for n=5).
  Plain sticky `div` stage with `overflow-hidden`.

- **Slot sizing** — `computeSlotWidth(vw)`: mobile `< 768 px` → `78 vw`;
  desktop → `min(40 vw, 560 px)`. Uses `useWindowWidth()`.

- **Carousel config** — `buildCarouselConfig(n, vw, slotW)` produces
  `trackPValues / trackXValues` keyframes. Each item has a `TRAVEL_FRAC = 0.40`
  lateral travel window; items centre on `vw/2`. Config memoised with
  `useMemo([n, vw, slotW])`. `pinHeightVh = n × 80 + 60` (460 vh for n=5). See ADR-0029/0030.

- **Heading + reveal trigger** — shared [[hooks#`useRevealOnEnter`|`useRevealOnEnter`]] on the heading wrapper (`headingRef`): `revealed` fires when the heading crosses the 80vh-from-top reveal line, same as every other section (replaces ADR-0031's `progress > 0.01` gate). `revealed` drives `<SectionHeading eyebrow heading enabled={revealed} headingDelayIn={450}>` *and* the timeline fade. See [[#Shared transition system]], ADR-0032.

- **Timeline reveal (inview)** — `timelineReveal = useSpring({ opacity: revealed ? 1 : 0, delay: revealed ? 700 : 0 })` on the carousel container. Appears with the heading, **not** on scroll.

- **Track** — `<animated.ol style={{ transform: trackX.to(x => 'translateX('+x+'px)') }}>`.
  Each `<animated.li style={{ width: slotWidthPx, flexShrink: 0 }}>`.

- **Timeline lines** — absolute within the `<ol>`, `left: slotW/2`, `width: (n-1)×slotW`.
  Gold fill width: `p.to(trackPValues, trackXValues.map(tx => vw/2 − tx − slotW/2))` in px.

- **Per-item text opacity** — `p.to([0,rs,rs+REVEAL_DUR,1],[0,0,1,1])` where
  `rs = itemRevealStart(i)`. Items fade **in** when centred and **stay visible**
  as the carousel advances — no fade-out on exit. This (plus `trackX`/gold fill) is
  the **only** scroll-driven motion left.

- **Exit parallax (pinned-section variant)** — inner content wrapper translates `exitY = p.to([0, overlapStart, 1], [0, 0, -EXIT_VH])`, `EXIT_VH = 24`, `overlapStart = 1 − OVERLAP_VH/(pinHeightVh − 100)` (`OVERLAP_VH = 20`; ⇒ 0.944 for n=5). The rise is locked to **exactly** the dresscode `-mt-[20vh]` overlap window: 24vh over 20vh of scroll ≈ 1.2× the 1× incoming dresscode. Because the stage is pinned (0× of its own) the entire "faster" must come from parallax — hence the larger 24vh vs the flowing panels' −12vh. This is the "old exits faster than new enters" handoff for a pinned section (ADR-0032, supersedes ADR-0031's `-12 over [0.9,1]` which let the incoming dresscode win). The `-112vh` whoosh is gone (ADR-0030).

- **No snap** — snap removed; section free-scrolls (ADR-0026).

**Choreography constants:**
| Constant | Value | Meaning |
|----------|-------|---------|
| `CAROUSEL_START` | `0.06` | brief lead-in so the heading reads before the track slides |
| `CAROUSEL_END` | `0.9` | last item centred, then dwells to pin release at `p = 1` |
| `TRAVEL_FRAC` | `0.40` | fraction of item p-range used for lateral travel |
| `REVEAL_DUR` | `0.05` | p-range over which each item text fades in |
| `OVERLAP_VH` | `20` | dresscode overlaps the schedule exit by this (`-mt-[20vh]`) |
| `EXIT_VH` | `24` | content rise over the overlap → ~1.2× the incoming dresscode |

(`EXIT_START` removed — the carousel spans `[CAROUSEL_START, 1]`, last item centred at `p = 1`.)

**Semantics** — `<section id="schedule" aria-label="Программа дня">`, real `<ol>`/
`<li>`, `<time>`, `<h3>`. Eyebrow `aria-hidden`; h2 real content. Bullets + lines
`aria-hidden`.

### Mock data — `schedule.ts`

`ScheduleData` = `{ eyebrow, heading, entries }`; each `ScheduleEntry` is
`{ time, title, note }`. Times/titles/notes are placeholder content — adjust per
the real running order.

## Dresscode

Files: `src/views/wedding/dresscode-section.tsx`, `src/data/mocks/dresscode.ts`.

**Look & feel** — **natural-height section** (no pin). "Дресс-код" label springs in
on entry, h2 + intro reveal letter by letter, then switch / gallery / caption /
blacklist cascade in. Reveals on the shared 80vh reveal line; the cascade springs are declarative (survive gender switches). Section exits with a slow **+16 vh lag** so the preferences form rushes up underneath it. See ADR-0024, ADR-0031, ADR-0032.

Replaced scroll-pinned version (ADR-0021).

### Component — `dresscode-section.tsx`

Client leaf. No scroll-driven `p` for stage animation — only entry detection.

- **Section** — `<ProgressTrigger tag="section" start="top bottom" end="bottom top"
  className="relative -mt-[20vh] w-full bg-w-ink">`. Natural height (`py-[12vh]`
  inner padding instead of sticky stage).

- **Entry** — shared [[hooks#`useRevealOnEnter`|`useRevealOnEnter`]] on the content container (`contentRef`, whose top edge = the heading): `revealed` fires when the heading crosses the 80vh-from-top reveal line, same as every other section (replaces the old `threshold 0.1` IO). Eyebrow + h2 are the shared `<SectionHeading eyebrow heading enabled={revealed} headingDelayIn={450}>`; the intro uses `TextEngine mode="once" enabled={revealed}`. Exit parallax: `ep.to([0,0.5,1],[0,0,16])` via `epApi.set()`. See [[#Shared transition system]], ADR-0032.

- **Reveal cascade is declarative** — `switchReveal` / `captionReveal` / `blacklistReveal` are `useSpring({ opacity: revealed ? 1 : 0, delay: revealed ? D : 0 })` and the photos are the declarative array `useSprings(3, [...])`. Once revealed they hold opacity 1, so clicking the gender switch (`setActive` → re-render) diffs to no-change and **never** blanks them. This — not the `<Handle>` removal — is the actual fix for the "switch + everything below disappears on switch" bug. The previous imperative `api.start()`-in-`useEffect` form reset to 0 on every switch and never replayed. See ADR-0032.

- **Exit parallax** — `ep.to([0, 0.5, 1], [0, 0, +16])` → `translateY(+16vh)` on inner
  content over the exit window. Positive offset makes content lag behind the scroll
  so the dresscode lingers longer than the form section rises in from below (increased
  from +8vh, ADR-0031). `overflow-hidden` on the ProgressTrigger clips any downward bleed;
  `pb-[30vh]` (was `pb-[22vh]`) provides headroom for the +16 vh shift.

- **Gallery** — `<Handle>` wrapper removed; gallery renders inside a plain `<div>` (ADR-0031). `photoSprings` still stagger the initial reveal (delay 1800+i×200); on gender switch the photos update immediately (no transition delay). Caption and lightbox both follow `activeOption` directly. Images render in **full colour** — `LOOK_FILTER` is just `object-cover` (the old `grayscale/sepia/brightness` desaturation was removed 2026-06-08) and the resting tint overlay is transparent (`bg-transparent`, only a faint `bg-w-ink/20` on hover behind the zoom icon) so the look colours read clearly.

- **Heading** — the eyebrow `useSpring` + `labelTransform`/`labelOpacity` `useMemo`
  are gone; the shared `SectionHeading` owns the eyebrow + h2 reveal.

- **Sequential delays:**
  - Eyebrow + h2: `SectionHeading enabled={revealed} headingDelayIn={450}`
  - Intro: `TextEngine mode="once" enabled={revealed} delayIn={1050}` (`letterStagger: 18`, `tension: 800/friction: 28` — faster than the heading; ADR-0031)
  - Switch: `delay: 1500`
  - Photos: `delay: 1800+i×200`
  - Caption: `delay: 2500`
  - Blacklist: `delay: 2800`

- **Switch, gallery `useMemo`, Lightbox** — unchanged.
- **No snap** — snap removed; section free-scrolls (ADR-0026).

**Semantics** — `<section id="dresscode" aria-label="Дресс-код">`. Eyebrow `aria-hidden`; h2 + intro real content. Switch `role="group"`, buttons `aria-pressed`. Lightbox `role="dialog" aria-modal`.

### Mock data — `dresscode.ts`

`DresscodeData` = `{ eyebrow, heading, intro, switchLabel, blacklistCaption,
blacklistedColors, options }`. `blacklistedColors: Array<{ hex, label }>` —
red `#c0392b`, black `#0a0a0a`, white `#f0efec`. `paletteCaption` removed.
Each `DresscodeOption` is `{ id, label, caption, looks: DresscodeLook[] }` —
**male first = default**. Assets in `public/assets/dresscode/{male,female}-{1,2,3}.jpg`.

## Preferences (form)

Files: `src/views/wedding/preferences-section.tsx`,
`src/views/wedding/preferences-success.tsx`, `src/data/mocks/preferences.ts`,
`src/hooks/use-submit-preferences.ts`, `src/app/api/preferences/route.ts`,
`src/lib/telegram.ts`.

**Look & feel** — an **optional** guest form (every field optional). Eyebrow +
italic h2 + intro, then underline-style fields on the dark ground: name input, an
"alcohol" checkbox (sharp gold box with an ink check), allergies input, a
preferences textarea, a gold outline submit button. On success the form swaps to
`<PreferencesSuccess>` — a card panel (`bg-w-ink-2`, border, shadow matching
calendar/map) with `eyebrow` "принято", letter-revealed `font-hand` heading,
and centred word-fade body (`aria-live="polite"`).
Below the form: an organizer-contact block (note text +
phone number) and a closing line "Будем рады вас видеть!" in `font-hand italic
text-2xl text-w-gold`.

### Component — `preferences-section.tsx`

Client leaf with controlled field state. Submission goes through the
`useSubmitPreferences` hook (network logic stays out of the component — see
[[hooks]]); the button reflects `submitting` / `error` (retry label) states and
errors render in `text-w-clay` with `role="alert"`.

- **Checkbox** — a real `<input type="checkbox" class="peer sr-only">` + a styled
  `<span>` using `peer-checked:` (gold fill) and `peer-focus-visible:` (ring). The
  check `<svg>` is always `--w-ink`-coloured, so it's invisible on the transparent
  box and shows only against the gold checked fill — no `peer` on a nested node.
- **Success** — conditional render swaps the form for `<PreferencesSuccess>` (not
  `<Handle>`, to avoid re-running transitions on each keystroke). Card +
  `TextEngine` cascade on mount; plain `sr-only` copy for screen readers.
- **Eyebrow + h2** — the shared `<SectionHeading eyebrow heading headingDelayIn={200}>` (uncontrolled — its own IntersectionObserver fires once on entry). Replaces the former `SpringTrigger` eyebrow + standalone `TextEngine` h2. See ADR-0030 (was ADR-0027).
- **Intro** — `<TextEngine mode="once">` `delayIn={380}`; its own IO handles timing (section is at ~1400 vh DOM position).
- **Form fields** — each wrapped in `<SpringTrigger mode="once" trigger={sectionRef} start="top bottom" end="center bottom" from={{ opacity:0, y:20 }} to={{ opacity:1, y:0 }}>` with staggered `delayIn` (600 / 700 / 800 / 900 / 1000 ms). `trigger={sectionRef}` prevents the infinite rAF loop that `y: 20` would cause when each element uses its own bbox as trigger.
- **Organizer contact block** — note text uses `<TextEngine mode="once" wordIn/wordOut wordStagger={20}>`, phone uses `<a><TextEngine tag="span" mode="once" letterIn/letterOut delayIn={280}>`.
- **Closing line** — `<TextEngine tag="p" mode="once" wordIn/wordOut wordStagger={80}>`, `font-hand text-2xl italic text-w-gold` (`content.closing`).
- Preferences is the **last section** — no exit animation or pin needed.
- ⚠️ `useSpringTrigger` only accepts the 9 exact `TriggerPos` string values — no `+=`/`-=` offset syntax; offsets produce `undefined` → NaN → infinite rAF loop every frame.

**Semantics** — `<form noValidate>`, every control has a `<label htmlFor>`, the
name input uses `autoComplete="name"`, section `aria-label`.

### Component — `preferences-success.tsx` (`PreferencesSuccess`)

Client leaf; rendered once when `useSubmitPreferences` reports `status === "success"`.
Replaces the form in-place (not `<Handle>`).

- **Card** — `max-w-[26rem]`, `bg-w-ink-2`, `border-w-bone/15`, shadow matching
  `CalendarFlip` / `<VenueMap>` panels.
- **Copy** — `eyebrow` label (`content.success.eyebrow`, default "принято");
  `TextEngine` letter-reveal for `font-hand` heading (`justify-center`); centred
  word-fade body (`flex flex-wrap justify-center` — see TextEngine centring gotcha).
- **A11y** — outer wrapper `aria-live="polite"`; decorative animated copy
  `aria-hidden`; plain `sr-only` paragraph with heading + body for screen readers.

### API — `app/api/preferences/route.ts`

Follows the [[api-architecture]] convention: a `zod` schema (all fields optional,
trimmed, length-capped), the `handle()` wrapper / `{ data }` envelope, secrets
server-side. Delivers to Telegram via `src/lib/telegram.ts` when
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set (pair-validated in `getServerEnv()`),
otherwise logs server-side. Setup documented in `.env.example`. See ADR-0034.

### Mock data — `preferences.ts`

`PreferencesContent` includes `success: { eyebrow, heading, body }` for the
post-submit card (eyebrow default "принято").

## Shared system

### Section heading — `section-heading.tsx` (`SectionHeading`)

The one heading treatment shared by every section: a gold tracked **eyebrow** that
scales/rises in (`y 24→0 vh, scale 2.6→1, opacity 0→1`, `LABEL_CONFIG` tension 200
friction 28) plus an **optional** letter-revealed heading (`TextEngine mode="once"`).

Built entirely on **declarative** primitives — the eyebrow is a `useSpring`
diffed against a `revealed` boolean each render, the heading a `TextEngine`
`enabled={revealed}`. This is deliberate: the old per-section eyebrows used the
**single-shot imperative** `useSpring(() => ({…})).api.start({…})` form, which is
unreliable in this react-spring build (same reason `spring.tsx`/`in-view.tsx` are
declarative) — it left some headings stuck at `opacity:0` and let the date panel
reset to its `from` state on scroll-out. See [[decisions-log]] ADR-0030.

| Prop | Meaning |
|------|---------|
| `eyebrow` | small decorative label (always `aria-hidden`) |
| `heading` / `headingTag` | optional real heading text + level (`h2`/`h3`) |
| `enabled` | **controlled** reveal — when given, animates as it turns true; lets a section drive a larger cascade off one trigger |
| `threshold` | IntersectionObserver threshold for the **uncontrolled** internal trigger (default 0.3) |
| `headingDelayIn` / `headingStagger` / `headingClassName` | heading timing + typography overrides |

Renders a fragment (eyebrow `<p>` + heading) so it drops straight into a section's
flex column. Used by date (eyebrow only, `enabled`), location (eyebrow only,
`enabled`), schedule (eyebrow + h2, `enabled`), dresscode (eyebrow + h2,
`enabled`), preferences (eyebrow + h2, uncontrolled IO).

> [!warning] Reveal-once = declarative, never single `api.start`
> One-shot reveals must use a declarative spring gated on a state flag (or
> `TextEngine`/`SpringTrigger`), **not** a single imperative `api.start()` call —
> it does not reliably commit in this build. Continuous per-frame `api.set()`
> (scroll parallax) is fine. See ADR-0030.

> [!warning] Inview gotcha — use `Spring` / `TextEngine`, not `<Inview>`
> `<Inview>` has a pre-existing engine bug (`inViewRef.current = node` should be
> `inViewRef(node)`) — its IntersectionObserver never attaches, so it stays at
> `opacity: 0`. For reveals use `<Spring mode="once">` (above the fold, plays on
> mount), `<TextEngine mode="once">` (scroll-triggered, for text), or
> `<SpringTrigger mode="scrub">` (scroll-linked, for non-text). Engine is
> `#do-not-modify`. See [[changelog]] 2026-05-28.

> [!warning] TextEngine centring gotcha — use `justify-center`, not `text-center`
> A `<TextEngine>`'s root renders as **`display: flex`**, and its words are
> `line-word` flex items packed at `flex-start`. So `text-center` on it does
> **nothing** for horizontal centring (it only affects wrapping within a line). To
> centre, put **`flex flex-wrap justify-center`** on the `TextEngine` `className`
> (the hero headlines). Centring it via a flex **parent's** `items-center` also
> works (the date column), but only while the engine's content is narrower than the
> column. See [[changelog]] 2026-05-29.

### Palette (warm-dark editorial)

| Token | Value | Tailwind utility |
|-------|-------|-----------------|
| `--w-ink` | `#181310` | `bg-w-ink` (section ground) |
| `--w-ink-2` | `#221a15` | layering / overlays |
| `--w-bone` | `#ece3d4` | `text-w-bone` (primary text) |
| `--w-gold` | `#c2a14e` | `text-w-gold`, `bg-w-gold` (accent) |
| `--w-clay` | `#b3795a` | terracotta secondary accent |
| `--w-muted` | `#9a8b76` | `text-w-muted` (secondary text) |

No border-radius token — photos and bands are flush-cropped rectangles.

### Fonts

| Variable | Font | Subsets | Usage |
|----------|------|---------|-------|
| `--font-unbounded` | Unbounded | latin, cyrillic | `font-punch` — section h2/h3 headings, logo letters |
| `--font-caveat` | Caveat | latin, cyrillic | `font-hand` — captions, times, invitation paragraph, closing |
| `--font-sans` / `--font-body` (`--font-onest`) | Onest | latin, cyrillic | names, dates, labels, body |

### `eyebrow` utility

`@utility eyebrow` in `globals.css` — the small gold tracked all-caps label,
shared across sections (hero + both date/location labels). A pure-utility combo
applied to text rendered by animation components, so it is a Tailwind `@utility`,
not a React component (ADR-0012). See [[design-system]].

## Related

[[animation-system]] · [[design-system]] · [[text-engine]] · [[new-page]] · [[changelog]]
