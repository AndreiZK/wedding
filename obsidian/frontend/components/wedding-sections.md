---
tags: [frontend, feature, wedding]
updated: 2026-06-01
---

# Wedding — Page Sections

Feature-specific components for the wedding invitation page. Section views live in
`src/views/wedding/`; their content lives in `src/data/mocks/`. All sections
share the warm-dark editorial system: `--w-*` palette, Onest + Unbounded + Caveat
fonts, the `eyebrow` utility, and seamless `bg-w-ink` flow between them.

**Section order:** Hero → Date & Location → Schedule → Dresscode → Preferences form.

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
- **Image (square → screen morph)** — `next/image` `fill object-cover` in an
  `animated.div` positioned with inline `top: calc(50% - CONTENT_OFFSET_VH vh)`,
  `left: 50%`, `transform: translate(-50%,-50%)` — `CONTENT_OFFSET_VH = 4` shifts
  the composition 4 vh above true centre. `width` and `height` animate independently
  from `side` (`min(vw,vh) * SQUARE_FRAC 0.6`) to `vw × (vh + 2·offsetPx)` over
  `c [0,0.85]` (height overshoots by `2×offsetPx` so the bottom edge still lands
  exactly at `vh` despite the upward shift; the top bleeds above the stage and is
  clipped by `overflow-hidden`). `borderRadius 28px → 0`. Even corners (no scale
  distortion) and a true square→viewport-shape morph. **No spacer span** — see
  headline positioning below.
- **Headlines** — both headline groups are `position: absolute` with inline `bottom`/
  `top` anchored to the image's true position:
  - *Top group* (`bottom: calc(50% + CONTENT_OFFSET_VH vh + side/2 px + GAP_VH vh)`):
    kicker `<p font-hand -rotate-2>`, `TextEngine font-punch text-w-bone` (first
    word of `topText`), `TextEngine font-punch text-w-gold` (remaining words). Both
    TextEngine lines use `LINE_REVEAL` + `PUNCH_CLASS`.
  - *Bottom group* (`top: calc(50% − CONTENT_OFFSET_VH vh + side/2 px + GAP_VH vh)`):
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

**Look & feel** — **two pinned scroll timelines**, one after the other. **Date:** a
big **`когда?`** label slides out from under the hero (large → eyebrow size); a
calendar **flips through months — April → July — like turning calendar pages**, and
on reaching July a **gold ring draws around `16`**; then the gathering-time note
fades in. **Location:** a **`где?`** label emerges the same way, the venue + city
**reveal letter by letter**, and a **palette-themed Google map** (gold pin) rises in
— the stage staying pinned until everything has settled.

### Component — `date-location-section.tsx` (two pins)

Client leaf. The `<section>` holds the real date `<h2 class="sr-only">` + `<time>`.
**Two** `<ProgressTrigger tag="div">` pins, each feeding **one** `useSpring` value
(`p`, `p2` — one-progress pattern, [[decisions-log]] ADR-0013).

**Date pin** (`h-[320vh]`, stage `aria-hidden` — purely decorative):

| `p` window | What happens |
|------------|--------------|
| `0 → 0.22` | `когда?` label: `translateY 24vh→0`, `scale 2.6→1`, fades in |
| `0.18 → 0.56` | calendar flips April → July (`CalendarFlip`) |
| `0.58 → 0.70` | gold ring draws on the 16th (earlier + quick) |
| `0.78 → 0.92` | gathering-time note fades / rises in |

**Location pin** (`h-[300vh]`, stage **not** `aria-hidden` — the map + headings are
real content; only the decorative `где?` label is `aria-hidden`):

| `p2` window | What happens |
|-------------|--------------|
| `0 → 0.22` | `где?` label: `translateY 24vh→0`, `scale 2.6→1`, fades in |
| `0.25 → 0.5` | venue `<h3>` + city **reveal letter by letter** (`<TextEngine type="toggle">`, scrubbed by a full-pin **plain-DOM proxy** `trigger`, `center bottom`→`center center`) |
| `0.52 → 0.78` | `<VenueMap>` fades + scales (`0.94→1`) + rises in, then **holds** to `1` |

Location pin extended to `h-[500vh]` (400vh active). Exit pushed to p2=0.96 so
the map dwells ~32vh before the whoosh (was 8vh at h-[300vh]/exit 0.92).

The letter reveal reuses the hero's primitive (toggle + proxy trigger, ADR-0015);
the map appears only after the text and the pin holds until it has settled
(ADR-0018). See [[components/common]] for `<VenueMap>`.

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

**Look & feel** — a **scroll-pinned horizontal timeline** of the day's events (Сбор
гостей · Фуршет · Церемония · Ужин · Вечеринка). A heading emerges first (eyebrow
scales down from 2.6× like "где?"/"когда?"; h2 reveals letter by letter like "River
Hall"). Then a **continuous horizontal line** with gold diamond bullets connects all
items — the track slides left so each item centres in turn, a gold fill drawing
left-to-right along the line as the carousel progresses. Only the centred item's
text (time, title, note) is visible; all others are transparent. Once the last item
is revealed the stage **whooshes up** (fast exit, ADR-0019) and the dresscode slides in.

Replaces the earlier vertical toggle-reveal timeline (2026-06-02); corrected from an
initial card-based carousel (2026-06-02).

### Component — `schedule-section.tsx`

Client leaf. All animation is **p-driven** off one `useSpring` value (ADR-0013 +
ADR-0020). Key implementation details:

- **Pin** — `<ProgressTrigger tag="section" start="top top" end="bottom bottom">` with
  `style={{ height: \`${pinHeightVh}vh\` }}` (computed as `N*80+200` vh). A
  `sticky top-0 h-dvh` `animated.div` stage holds the heading + timeline.

- **Eyebrow** — `animated.p` with `labelY/labelScale/labelOpacity` (scale 2.6→1,
  translateY 24vh→0, over p 0→0.12). `aria-hidden` — real heading is the h2.

- **H2 letter reveal** — `<TextEngine trigger={headingTriggerRef} mode="progress"
  type="toggle" start="top top" end="bottom top" className="flex flex-wrap
  justify-center ...">`. Proxy is offset from the section top by
  `H2_REVEAL_START × (pinHeightVh − 100)` vh (= 40vh for N=5) so the reveal starts
  at p=H2_REVEAL_START (after the label has faded in), with height
  `(CAROUSEL_START − H2_REVEAL_START) × (pinHeightVh − 100)` vh (= 35vh). **Not
  inside the sticky stage** — must be a direct child of ProgressTrigger.
  `flex flex-wrap justify-center` is required (TextEngine centring gotcha).

- **Track** — `animated.ol` with `translateX` from `p.to(trackPValues, trackXValues)`.
  `buildCarouselConfig` computes p-stops for item-by-item travel (TRAVEL_FRAC=0.40
  of each item's range) and the corresponding viewport-centre x-positions per item.

- **Timeline line** — two `absolute` `span`s within the `ol`, both at `top: 0.375rem`
  (= half the `size-3` bullet height, so the line runs through bullet centres):
  - Faint base: `left = slotW/2`, `width = (N−1)*slotW` — spans exactly first→last bullet
  - Gold fill: `left = slotW/2`, `width = viewportW/2 − trackX − slotW/2`
    — left edge anchored at first bullet; right edge always at the active bullet centre

- **Per-item text opacity** — fades in at `itemRevealStart(i)`, fades out at
  `itemDwellEnd(i)` (when the next item's travel starts). Only the bullet is always
  visible; text is wrapped in `animated.div style={{ opacity }}`.

- **Slot width** — `computeSlotWidth(windowWidth)`: mobile → `78 vw`; desktop →
  `min(40 vw, 560 px)`. `useWindowWidth` + `useMemo` recompute `buildCarouselConfig`.

- **Fast exit** — `exitY/exitOpacity` on the sticky stage (ADR-0019).

**Choreography constants:**
| Constant | Value | Meaning |
|----------|-------|---------|
| `CAROUSEL_START` | `0.15` | heading done, carousel begins |
| `EXIT_START` | `0.90` | last item done, exit begins |
| `H2_REVEAL_START` | `0.08` | h2 letter reveal begins (after label has faded in) |
| `TRAVEL_FRAC` | `0.40` | fraction of each item's p-range for lateral travel |
| `REVEAL_DUR` | `0.05` | p-range for text fade in/out at dwell edges |

Pin height formula: `N*120+200` vh (was N*80+200). For N=5: 800vh / 700vh active.
Per-item dwell: ~63vh (was ~45vh). Proxy heights auto-recalculate from `cfg.pinHeightVh`.

**Semantics** — `<section id="schedule" aria-label="Программа дня">`, real `<ol>`/
`<li>`, `<time>` for each entry's time, `<h3>` for each title. Eyebrow is
`aria-hidden`; h2 is real content (`TextEngine` renders an accessible hidden copy).
Bullet markers and line are `aria-hidden`.

### Mock data — `schedule.ts`

`ScheduleData` = `{ eyebrow, heading, entries }`; each `ScheduleEntry` is
`{ time, title, note }`. Times/titles/notes are placeholder content — adjust per
the real running order.

## Dresscode

Files: `src/views/wedding/dresscode-section.tsx`, `src/data/mocks/dresscode.ts`.

**Look & feel** — **scroll-pinned reveal** (ADR-0021). A "Дресс-код" label scales
in large → eyebrow, the h2 "Образ вечера" and intro paragraph reveal letter by letter
in sequence. Then the **option switch** fades in, followed by a **triptych gallery**
of looks with per-photo stagger (3 photos pop in one by one). The per-option caption
appears next, then a row of **"нежелательные цвета"** — red, black, white swatches
each with a diagonal line. The section exits with the same fast whoosh as all others.

Replaces the earlier non-pinned viewport-triggered section (2026-06-02).

### Component — `dresscode-section.tsx`

Client leaf. All scroll-driven animation off one `useSpring` value `p` (ADR-0013 +
ADR-0021). Interactive state (`useState` for active option + lightbox) coexists with
scroll state — they're independent.

- **Pin** — `<ProgressTrigger tag="section" start="top top" end="bottom bottom">`,
  `h-[700vh]` (600vh active), internal `-mt-[100vh]` (same zero-gap pattern as
  schedule/location). `bg-w-ink` omitted from ProgressTrigger — parent provides it.

- **Heading sequence** — label `animated.p` (scale 2.6→1, p 0→0.12); h2 `TextEngine
  mode="progress" type="toggle"` via `headingTriggerRef` proxy (p 0.08→0.18); intro
  `TextEngine` via `introTriggerRef` proxy (p 0.16→0.26). Both proxies outside sticky
  stage. `flex flex-wrap justify-center` on TextEngine classNames (centring gotcha).

- **Two plain-DOM proxies:**
  - `headingTriggerRef`: `top: 48vh, height: 60vh`  (H2_REVEAL_START=0.08, ×600)
  - `introTriggerRef`: `top: 96vh, height: 60vh`    (INTRO_REVEAL_START=0.16, ×600)
  - Both use `start="top top" end="bottom top"` in TextEngine.

- **Content reveals** (one-way p.to, stay at 1 after reveal):
  - Switch: p 0.28→0.32
  - Photos: `photoOpacities[i]` — p `0.33+i×0.05 → 0.33+i×0.05+0.04` (i=0,1,2)
  - Caption: p 0.52→0.56
  - Blacklisted colors: p 0.60→0.65

- **All `p.to()` interpolations** — including final chained/combined values — are computed inside a single `useMemo([p], …)`. `p` is a stable `SpringValue` reference so the memo runs effectively once. The exported values are `labelTransform` (combines `labelY_` + `labelScale_` via `to([…], …)`), `labelOpacity`, `switchOpacity`, `captionOpacity`, `blacklistOpacity`, `photoOpacities`, `stageTransform` (chains `p.to(…).to(…)`), and `stageOpacity`. `labelY_` and `labelScale_` are locals inside the memo — they feed `labelTransform` but are not exported. Without this full memoisation, any re-render (e.g. option-switch → `setActive`) creates new interpolation objects; `animated` elements detach + re-attach and briefly show their initial value (undefined/0) because `p` hasn't emitted a new value to drive the freshly-attached interpolation — causing all scroll-driven elements to flash invisible until the next scroll tick. ⚠️ The same rule applies to chained calls like `derivedInterp.to(fn)` and `to([a, b], fn)` in JSX — even when `a`/`b` are memoized, the **output** interpolation is a new object on every render. Keep ALL derived interpolations inside `useMemo`.
  The gallery `ul` is inlined in a `useMemo([activeOption, openAt, photoOpacities], …)`
  so `Handle` cross-fades on option switch. `animated.li` per photo gets its
  `photoOpacities[i]` opacity. After scroll reveal (all photos at 1), switching
  options triggers `Handle`'s own fade → new photos appear at full opacity ✓.

- **Switch** — unchanged structure: `inline-grid grid-cols-2`, `role="group"`,
  `aria-pressed` buttons, sliding gold underline via `useSpring` + `animated.span`.

- **Blacklisted colors** — `animated.div` with `blacklistOpacity`; each color is a
  `size-6 rounded-full` swatch (`ring-1 ring-inset ring-w-bone/25`). No SVG lines,
  no text captions — plain circles only. `aria-label={label}` on each `<span>` for
  accessibility.

- **`Lightbox`** — unchanged; renders via `createPortal(…, document.body)` so it
  escapes the `overflow-hidden` sticky stage safely.

- **Parallax drift exit** — replaces fast whoosh. `stageY = p.to([0, 0.80, 1], [0, 0, -60])`
  (0.5× drift, same pattern as hero→content ADR-0015). `stageOpacity = p.to([0, 0.85, 1],
  [1, 1, 0])`. No `EXIT_START` constant; drift starts at `DRIFT_START = 0.80`.
- **Switch blur fix** — switch buttons call `.blur()` after click to prevent browser
  scroll-to-focus from shifting `p` and replaying heading animations.

**Choreography constants:**
| Constant | Value | Meaning |
|----------|-------|---------|
| `PIN_HEIGHT_VH` | `700` | section height; active range = 600vh |
| `H2_REVEAL_START` | `0.08` | h2 starts after label fades in |
| `H2_REVEAL_END` | `0.18` | h2 done |
| `INTRO_REVEAL_START` | `0.16` | intro starts (overlaps h2 tail) |
| `INTRO_REVEAL_END` | `0.26` | intro done |
| `CONTENT_START` | `0.28` | switch fades in |
| `PHOTOS_START` | `0.33` | first photo appears |
| `PHOTO_STAGGER` | `0.05` | per-photo p offset |
| `CAPTION_REVEAL` | `0.52` | caption appears |
| `BLACKLIST_REVEAL` | `0.60` | blacklisted colors appear |
| `EXIT_START` | `0.88` | fast exit begins |

**Semantics** — `<section id="dresscode" aria-label="Дресс-код">`. Eyebrow
`aria-hidden`; h2 + intro are real content. Switch `role="group"`, buttons
`aria-pressed`. Lightbox `role="dialog" aria-modal`. Blacklisted color swatches
`aria-hidden`; their `<ul>` has `aria-label={data.blacklistCaption}`.

### Mock data — `dresscode.ts`

`DresscodeData` = `{ eyebrow, heading, intro, switchLabel, blacklistCaption,
blacklistedColors, options }`. `blacklistedColors: Array<{ hex, label }>` —
red `#c0392b`, black `#0a0a0a`, white `#f0efec`. `paletteCaption` removed.
Each `DresscodeOption` is `{ id, label, caption, looks: DresscodeLook[] }` —
**male first = default**. Assets in `public/assets/dresscode/{male,female}-{1,2,3}.jpg`.

## Preferences (form)

Files: `src/views/wedding/preferences-section.tsx`,
`src/data/mocks/preferences.ts`, `src/hooks/use-submit-preferences.ts`,
`src/app/api/preferences/route.ts`.

**Look & feel** — an **optional** guest form (every field optional). Eyebrow +
italic h2 + intro, then underline-style fields on the dark ground: name input, an
"alcohol" checkbox (sharp gold box with an ink check), allergies input, a
preferences textarea, a gold outline submit button. On success the form swaps to
a `Спасибо!` panel. Below the form: an organizer-contact block (note text +
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
- **Success** — conditional render (not `<Handle>`, to avoid re-running its
  transition on each keystroke); the success panel fades in with `<Spring mode="once">`.
- **Eyebrow** — `<SpringTrigger mode="toggle" start="top bottom" end="center bottom">` uses its own position as trigger (fires as section just enters viewport).
- **H2 + intro** — `<TextEngine mode="progress" type="toggle" trigger={sectionRef} start="top bottom" end="center bottom">` with `delayIn={200}` / `{380}`. Using `trigger={sectionRef}` is required: the section sits inside `-mt-[100vh]` in `home.tsx`, placing it in the DOM viewport before it is visually revealed; `mode="once"` (IntersectionObserver) fires too early in that case.
- **Form fields** — each wrapped in `<SpringTrigger mode="toggle" trigger={sectionRef} start="top bottom" end="center bottom" from={{ opacity:0, y:20 }} to={{ opacity:1, y:0 }}>` with staggered `delayIn` (600 / 700 / 800 / 900 / 1000 ms) — starts after h2 + intro cascade. `trigger={sectionRef}` prevents the infinite rAF loop that `y: 20` would cause when each element uses its own bbox as trigger.
- **Organizer contact block** — plain `<div>` wrapper (no animation wrapper); note text uses `<TextEngine mode="forward" wordIn/wordOut wordStagger={20}>`, phone uses `<a><TextEngine tag="span" mode="forward" letterIn/letterOut delayIn={280}></a>`. `mode="forward"` fires each element independently as the user scrolls to it — these are at the physical bottom of the section so IntersectionObserver fires correctly (not affected by `-mt-[100vh]` early-fire issue). Using `trigger={sectionRef}` with a long `delayIn` fired the animation before these elements were in view.
- **Closing line** — `<TextEngine tag="p" mode="forward" wordIn/wordOut wordStagger={80}>`, `font-hand text-2xl italic text-w-gold` (`content.closing`).
- Preferences is the **last section** — no exit animation or pin needed.
- ⚠️ `useSpringTrigger` only accepts the 9 exact `TriggerPos` string values — no `+=`/`-=` offset syntax; offsets produce `undefined` → NaN → infinite rAF loop every frame.

**Semantics** — `<form noValidate>`, every control has a `<label htmlFor>`, the
name input uses `autoComplete="name"`, section `aria-label`.

### API — `app/api/preferences/route.ts`

Follows the [[api-architecture]] convention: a `zod` schema (all fields optional,
trimmed, length-capped), the `handle()` wrapper / `{ data }` envelope, secrets
server-side. Forwards to `CONTACT_ENDPOINT` when set (tagged
`kind: "wedding_preferences"`), otherwise logs server-side so it runs as-is. No
new env var.

## Shared system

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
