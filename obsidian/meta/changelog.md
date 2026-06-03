---
tags: [meta, changelog]
updated: 2026-06-01
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`.

## 2026-06-03 (Typography — Playfair Display removed)

Playfair Display fully removed from the project. All `font-display` usages migrated:

- **→ `font-punch` (Unbounded):** all section h2/h3 headings (schedule, dresscode, preferences), venue name (date-location), logo "A" & "U" letters. `italic` removed where present (Unbounded carries no italic variant). `font-medium` on logo → `font-semibold`.
- **→ `font-hand` (Caveat):** invitation paragraph (hero), schedule `<time>` entries, calendar month names, dresscode option-switch labels, preferences success heading, preferences closing line.

`Playfair_Display` import removed from `layout.tsx`; `playfair.variable` removed from `<body>` className; `--font-display` CSS variable removed from `globals.css`.

## 2026-06-03 (Hero layout fix — image alignment & content offset)

- **Image alignment** — replaced the flex-column-with-spacer headline layout with two `position: absolute` headline groups anchored via CSS `calc` to the image's true centre. The old spacer approach shifted the gap off-centre when `H_top ≠ H_bottom`, causing the image to overlap the top headlines.
- **Content moved up** — `CONTENT_OFFSET_VH = 4`: image sits 4 vh above viewport centre; full-screen height expands by `2×offsetPx` so the bottom edge still lands at exactly `vh` (top bleeds above the stage, clipped). Both headline anchors carry the same offset.
- **Bottom text glyph fix** — `LINE_REVEAL` (`overflow:true`) replaced with `HAND_REVEAL` (word-fade, no overflow mask) for `bottomText`. Caveat's script glyphs overhang their advance boxes and `wrapLine overflow:hidden` was clipping the last letter.

## 2026-06-03 (Hero & logo visual corrections)

- **Logo ampersand** — `font-display italic` → `font-hand` (Caveat), spacing nudged to `px-[0.06em]`. Color stays `text-w-gold` (brass).
- **Kicker "наконец-то..."** — color `text-w-gold` → `text-w-muted` (gray-green).
- **Punch headline size** — reduced from `text-[3.5rem] md:text-[6rem]` to `text-[2.25rem] md:text-[5rem]` to fit on mobile.
- **Bottom text "приходите посмотреть"** — mock updated to lowercase; color `text-w-muted` → `text-w-gold` (brass); moved closer to image with `-mt-[2vh]`.
- **Scroll affordance** — "листайте" switched from `eyebrow` utility (brass) to manual classes with `text-w-muted`; straight line replaced with a hand-drawn SVG arrow (slightly wobbly shaft + asymmetric arrowhead, `currentColor`).

## 2026-06-03 (Design system — Forest & Brass redesign)

Complete aesthetic redesign from warm-dark editorial to **Forest & Brass (Version B)** — light oat-green ground, deep forest text, brass accent. Fonts, colors, background texture all updated; behavior and animation unchanged.

**Tokens** (`globals.css`):
- Palette flipped light: `--w-ink #eef0e3` (oat bg), `--w-ink-2 #e6e9d8`, `--w-bone #22342a` (dark text), `--w-gold #b0833f` (brass), `--w-clay #2f4a39` (deep forest), `--w-muted #5f6f5c`.
- `--grain-url` SVG feTurbulence paper texture added; applied as `body::after` fixed overlay (`mix-blend-mode: multiply`, `opacity: 0.4`, `z-index: 999`).
- `@theme inline` extended: `--font-punch: var(--font-unbounded)`, `--font-hand: var(--font-caveat)` → Tailwind utilities `font-punch` / `font-hand`.
- `eyebrow` utility: weight 500→600, tracking 0.42em→0.32em (matches guideline).

**Fonts** (`layout.tsx`):
- Added `Unbounded` (variable `--font-unbounded`, weights 400/600/800, cyrillic) — hero punch headline.
- Added `Caveat` (variable `--font-caveat`, weights 400–700, cyrillic) — handwritten accents.

**Hero section** (`hero-section.tsx`, `hero.ts`):
- `STAGE_BG` simplified to a single subtle brass glow (no ink-wash gradient).
- Top headline split: "МЫ" in `font-punch text-w-bone` + "ЖЕНИМСЯ!" in `font-punch text-w-gold`; both `font-extrabold leading-[0.9] tracking-tight` Unbounded 800.
- `kicker: "наконец-то..."` added to `HeroData` + mock; rendered as `font-hand -rotate-2 text-w-gold` above the headline, inside the topY animated container.
- Bottom text changed to `font-hand text-w-muted` (handwritten, softer).

**Preferences button** (`preferences-section.tsx`):
- `hover:text-w-ink` → `hover:text-w-bone` — dark forest on brass = readable contrast (was: light oat on brass after palette swap, too low contrast).

> [!note] Visuals unverified
> Lint passes but font rendering, grain intensity (0.4), punch headline size (`text-[3.5rem]/[6rem]`), and leading-[0.9] clip behaviour on TextEngine need browser verification. Section headings (Playfair `font-normal` → guideline says 700) were intentionally NOT bumped to avoid touching all section files — raise if weight update is desired.

## 2026-06-03 (Preloader redesign + logo enter animation)

- **Preloader** — stripped the `LogoMark` monogram and progress bar. Now shows `/assets/loader/savka.webp` (80×80) spinning continuously at 480°/s, DOM-direct rotation (no React state per frame). Veil fades out over 600ms on release. `setIntroDone(true)` is called at exit start so the logo enter animation is synchronised with the fade.
- **Logo (`SiteLogo`)** — removed the static conditional render; replaced with `<Spring mode="once" from={{ opacity:0, y:-10 }} to={{ opacity:1, y:0 }} config={{ tension:140, friction:22 }}>`. Logo slides in as the veil fades. Still gated on `useIntro.done` so it only mounts when the preloader releases. `LogoMark` no longer shared with the preloader (monogram removed from loader).

## 2026-06-03 (Dresscode — banned colors simplified)

- **Blacklisted colors** — removed diagonal SVG lines and text captions from the banned-color swatches. Now plain colored circles only (`size-6 rounded-full`, `ring-1 ring-inset ring-w-bone/25`). `aria-label` retained on each swatch span for accessibility.

## 2026-06-03 (Dresscode switch bug — chained interpolations fix)

- **Root cause found and fixed**: two chained interpolation calls were still created inline in the JSX on every render even after the first `useMemo` pass — `to([labelY, labelScale], (y, s) => ...)` on the eyebrow `<animated.p>` and `stageY.to((v) => ...)` on the stage `<animated.div>`. Because these produced new objects on each render, `animated` elements would detach from the old interpolations and reattach to the new ones; since `p` hadn't emitted a new value (no scroll), they showed undefined/0 until the next scroll tick. Fix: `labelY_` / `labelScale_` become locals inside `useMemo`; the memo now exports `labelTransform` (via `to([labelY_, labelScale_], …)`) and `stageTransform` (via `p.to(…).to(…)`). JSX updated to use these stable references. Rule documented in vault: ALL derived interpolations — including `derivedInterp.to(fn)` and `to([a, b], fn)` — must live inside `useMemo` even when their inputs are already memoized.

## 2026-06-03 (Dresscode switch bug fix + preferences text centering)

- **Dresscode section — switch flash bug fixed**: all `p.to()` interpolations (`labelY/Scale/Opacity`, `switchOpacity`, `captionOpacity`, `blacklistOpacity`, `photoOpacities`, `stageY`, `stageOpacity`) consolidated into a single `useMemo([p], …)`. Re-renders caused by option-switch state changes were creating new interpolation objects; `animated` elements briefly showed 0 while re-subscribing because `p` hadn't emitted a new value. `p` is a stable `SpringValue` so the memo runs once.
- **Preferences organizer note**: added `flex flex-wrap justify-center` to `TextEngine` className so the note text centres correctly (TextEngine centring gotcha — `text-center` has no effect on its flex root).

## 2026-06-03 (Preferences section — spacing tweak)

- **Bottom padding reduced** `pb-[7rem]` → `pb-[5rem]` on the content container, balancing it against the `pt-[5.5rem]` top padding.

## 2026-06-03 (Preferences section — footer animation fix + border removed)

- **Organizer block + closing line** — switched from `SpringTrigger trigger={sectionRef} delayIn={1200/1400}` to `TextEngine mode="forward"`. Root cause: elements are at the physical bottom of the section; the section-trigger fires when the section is 40–50% visible but the footer elements are still off-screen, so the delayed spring played out of sight. `mode="forward"` fires each element's own IntersectionObserver exactly when the user scrolls to it.
- **Removed border-t** between form button and organizer block.
- Organizer note: word-by-word `wordStagger={20}`; phone: letter-by-letter `letterConfig tension:600` with `delayIn={280}`; closing: word-by-word `wordStagger={80}`.

## 2026-06-03 (Preferences section — h2/intro fix + footer content)

- **H2 + intro animation fixed** — switched from `TextEngine mode="once"` to `mode="progress" type="toggle" trigger={sectionRef}`. Root cause: the section is inside `-mt-[100vh]` in `home.tsx`, placing it in the DOM viewport before it is visually revealed; IntersectionObserver-based `mode="once"` fired immediately on mount. Now both use the same `sectionRef` scroll trigger as the form fields.
- **Animation cascade restaggered** — all section-triggered elements (h2, intro, form fields, footer) use `start="top bottom" end="center bottom"` with `sectionRef`; delays: h2 200ms → intro 380ms → fields 600–1000ms → footer 1200–1400ms.
- **Organizer contact block added** — below the form, separated by a hairline, with note text and `<a href="tel:...">` phone link (`content.organizerPhone`).
- **Closing line added** — `font-display text-2xl italic text-w-gold` after the organizer block (`content.closing`).
- **`PreferencesContent` extended** — added `organizerNote`, `organizerPhone`, `closing` fields; mock values populated.

## 2026-06-02 (Preferences form field animations)

- **Preferences form fields** — all five field groups share a `sectionRef` (outer `<section>`) as the `trigger` for their `SpringTrigger mode="toggle" start="top bottom" end="center bottom"` wrappers (`opacity 0→1, y 20→0`). Toggle fires when section centre hits viewport bottom ≈ section 40–50% visible; stagger 0–400 ms cascades all fields before section fills screen. Using a shared external trigger fixes two bugs: (a) elements at the form's bottom could never scroll to `"top center"` on their own so they never revealed; (b) `y: 20` shifts each element's own `getBoundingClientRect()` which causes an infinite rAF loop when each element is its own trigger.
- **Removed** the "Все поля необязательны" optional-note span from the submit button area.

## 2026-06-02 (Multi-section timing + transition corrections)

- **Location pin extended** `h-[300vh]` → `h-[500vh]` (400vh active range). Exit
  timing pushed to p2=0.96 (was 0.92). Map now dwells ~32vh before exit (was ~8vh).
  Schedule's internal `-mt-[100vh]` auto-adjusts — no other changes.
- **Schedule item dwell** increased: pin formula `N*80+200` → `N*120+200`. For N=5:
  800vh (700vh active). Per-item dwell: 63vh (was 45vh, +40%).
- **Dresscode switch blur fix**: switch buttons now call `.blur()` after click to
  prevent browser scroll-to-focus from shifting `p` and replaying heading animations.
- **Dresscode→preferences parallax handoff**: replaced fast whoosh exit with slow
  0.5× parallax drift (`stageY: p.to([0, 0.80, 1], [0, 0, -60])` + gentle fade).
  Matches hero→content pattern (ADR-0015). Preferences wrapper changed from
  `-mt-[72vh]` to `-mt-[100vh]` (standard zero-gap parallax handoff).
- **Preferences heading**: eyebrow now uses `SpringTrigger mode="toggle"` (scale 2.6→1
  on viewport entry); h2 uses `TextEngine mode="once" type="toggle"` (letter-by-letter
  reveal on viewport entry). Matches visual pattern of all other sections.

## 2026-06-02 (Dresscode section redesigned as pinned scroll reveal)

- **`DresscodeSection`** rebuilt as a scroll-pinned section (ADR-0021). Heading
  sequence: label scale emergence (2.6×→1) → h2 letter reveal → intro letter reveal
  (each on its own plain-DOM proxy trigger, same pattern as schedule/location). Then
  content reveals sequentially: switch, 3 gallery photos with stagger, caption, and
  the new "нежелательные цвета" row. Section exits with fast whoosh.
- **`LookGallery` sub-component removed** — gallery inlined in `useMemo` so
  per-photo `animated.li` opacity interpolations can be threaded in.
- **"нежелательные цвета"** replaces the recommended palette swatches. Three
  forbidden colors (red, black, white) shown as circles with diagonal lines.
- **`DresscodeData`** updated: `paletteCaption` → `blacklistCaption` +
  `blacklistedColors: Array<{ hex, label }>`.
- **`home.tsx` transition** updated: dresscode now applies its own `-mt-[100vh]`
  internally (zero-gap, dresscode pin starts when schedule pin ends). Preferences
  gets `-mt-[72vh]` (mt = 700 − (0.88×600+100)).

## 2026-06-02 (Schedule section round-2 corrections)

- **Bullets** changed from diamonds (`rotate-45`) to circles (`rounded-full`)
- **Line geometry** corrected: base line and gold fill now span first-to-last bullet
  only (`left: slotW/2, width: (N−1)*slotW`). Gold fill formula updated to
  `viewportW/2 − trackX − slotW/2` so its left edge anchors at the first bullet.
- **Label-before-h2 ordering** fixed: added `H2_REVEAL_START = 0.08` constant +
  offset the heading proxy `top: 40vh` (for N=5) so h2 letters don't start until
  the eyebrow label is already fading in. Added `flex flex-wrap justify-center` to
  TextEngine className (centring gotcha). Wrapped timeline in `animated.div` with
  `timelineOpacity` so bullets/line stay hidden during heading phase.
- **Dead scroll eliminated**: schedule section now applies its own `-mt-[100vh]`
  (same zero-gap pattern as location pin inside DateLocationSection). Schedule pin
  starts immediately when location pin ends.
- **Structural placement**: `<ScheduleSection>` moved to same level as
  `<DateLocationSection>` in `home.tsx` (no more inner wrapper). The schedule
  section is now a direct sibling of DateLocationSection inside the `z-20` wrapper.

## 2026-06-02 (Schedule section corrections — timeline, heading animations, transition timing)

- **Eyebrow** updated to the "где?"/"когда?" large-to-small scale animation (scale
  2.6→1, translateY 24vh→0 over p 0→0.12). Previous implementation used a simple
  opacity/translateY.
- **H2** changed from `animated.h2` line-slide to `<TextEngine mode="progress"
  type="toggle">` with plain-DOM proxy trigger — letter-by-letter reveal like "River
  Hall". Proxy height = `CAROUSEL_START × (pinHeightVh − 100)` vh, placed outside the
  sticky stage with `start="top top" end="bottom top"`.
- **Carousel redesigned** from card-based centering to a **continuous horizontal
  timeline**: a faint base line + gold fill connects N bullet (diamond) markers; only
  the centred item's text is visible (fades in/out per dwell window). Gold fill width
  = `viewportW/2 − track_translateX` so its right edge always points at the active
  item.
- **Transition timing fixed** in `home.tsx`: schedule wrapper restored to `-mt-[16vh]`
  (schedule appears at viewport bottom at p2=0.92 of the location pin, after the map
  is fully visible). Dresscode wrapper corrected to `-mt-[50vh]` (appears when schedule
  exit starts at p=0.90 of the schedule pin, N=5). Previous `-mt-[100vh]` values caused
  both sections to intrude too early.

## 2026-06-02 (Schedule section redesigned as pinned horizontal carousel)

- **`ScheduleSection` is now a scroll-pinned horizontal carousel** — replaces the
  vertical toggle-reveal timeline. The section pins (`h-[N*80+200]vh`), heading
  eyebrow + h2 emerge first (p-driven), then each event card slides to centre
  one-by-one as the user scrolls. Each card fades + scales in while centred. A thin
  gold progress bar tracks the carousel. Once the last item is revealed the stage
  whooshes up (ADR-0019) and dresscode slides in underneath. All animation is driven
  off a single `useSpring` value `p` — `SpringTrigger` / `TextEngine mode="once"`
  removed because position-based triggers freeze in a pinned section. See
  [[decisions-log]] ADR-0020, [[components/wedding-sections]].
- **`home.tsx` handoff updated** — the inner wrapper around schedule/dresscode/
  preferences changed from `-mt-[16vh]` to `-mt-[100vh]` (schedule now has a
  100vh exit tail to overlap), and dresscode + preferences got their own
  `-mt-[100vh]` wrapper to pull up over the schedule exit.

## 2026-06-01 (Location→Schedule overlap timing fix)

- **Schedule overlap corrected from `-mt-[100vh]` to `-mt-[16vh]`** in `home.tsx`. The original 100vh caused the schedule to appear at the viewport bottom from p2=0.5 — mid-reveal, before the map was even visible. 16vh is the exact overlap so the schedule first appears at the viewport bottom precisely when the location exit begins (p2=0.92), after all animations have settled (map visible at p2≈0.88). See [[routing]], [[decisions-log]] ADR-0019.

## 2026-06-01 (Location→Schedule parallax handoff)

- **Schedule section now slides up over the location exit** — mirroring the date→location overlap inside `DateLocationSection`. A `-mt-[100vh]` wrapper in `home.tsx` wraps `<ScheduleSection>` + `<DresscodeSection>` + `<PreferencesSection>` with the same top shadow as the hero→content wrapper. The location stage already had `locExitY`/`locExitOpacity` (fast whoosh exit), so the handoff is now symmetric: location whooshes up, schedule rises underneath it at the same time. See [[routing]].

## 2026-06-01 (Hero parallax handoff + progressive paragraph + calendar flip + location pin)

- **Location is now a pinned timeline with a live map** — the venue moved from
  scroll-reveals-below-the-date to its **own pinned `<ProgressTrigger>`** matching
  the date pin: the **"где?"** label emerges large → eyebrow, the venue (**River
  Hall**) + city (**Гродно**) **reveal letter by letter** (`<TextEngine
  type="toggle">`, full-pin proxy trigger), then a **palette-themed Google map**
  rises in while the stage holds until settled. Replaces the keyless, unstyleable
  iframe. New `<VenueMap>` (Google Maps **JavaScript API**, dark theme built from
  the `--w-*` tokens, gold pin) + `useGoogleMaps` loader hook + minimal
  `google.maps` types. The location data now carries `lat`/`lng`/`zoom` (Grodno
  coords are **approximate** — set River Hall's exact point). See [[decisions-log]]
  ADR-0018, [[components/wedding-sections]], [[components/common]].
- **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** — new public env var (`src/env.ts`,
  `.env.example`). Public by design (referrer-restricted), the one sanctioned
  `NEXT_PUBLIC_` "key"; unset → the map shows a styled placeholder + link. See
  [[decisions-log]] ADR-0017, [[api-architecture]].

- **Realistic calendar page-flip** — `CalendarFlip` months now turn like a real
  wall calendar bound at the top: the bottom edge lifts **toward the viewer** and
  arcs **over the top** (`rotateX 0 → +100°`), instead of swinging the bottom *away*
  into the screen (`0 → -108°`). Just a sign flip on the rotation about the same
  top axis; backface-hidden still retires the page just past vertical to reveal the
  next month. See [[components/wedding-sections]].


- **Progressive invitation paragraph** — the hero paragraph reveals **letter by
  letter** with the scroll (`<TextEngine mode="progress" type="toggle">`), hidden
  until the image is full-screen, then popping in letter-by-letter over a held
  window. Two gotchas fixed: (1) the scroll reference must be a **plain-DOM
  full-section proxy `<div>`** — a `<ProgressTrigger>` node via `useImperativeHandle`
  is `null` when the engine wires up, so progress fell back to the centred paragraph
  (text fully revealed); (2) `type` had to be **`toggle`**, not `interpolate` —
  interpolate pre-reveals the first ~`coefficient` of letters at progress 0 (visible
  on load) and bunches them into word-sized chunks. See [[decisions-log]] ADR-0015.
- **Hero→content overlap handoff** — the following content **slides up over the
  hero** (marquet.nyc-style) with a **constant** parallax *differential*: from the
  moment the next section peeks (p≈0.64) the whole pinned stage drifts up at a
  steady **0.5×** scroll speed (`stageY: translateY → -50vh`) while the section
  rises at 1×. The overlap (`-mt-[100vh]`) is sized so the panel **fully covers at
  the hero's pin-end** — earlier the cover finished ~30vh *after* pin-end, so the
  tail went same-speed/linear. The hero pin grew (`h-[340vh]` → `h-[380vh]`,
  `HOLD_START 0.5` → `0.42`); the differential lives on the **hero stage** (a
  `transform` on a sticky element is safe); the wrapper has **no
  `transform`/`overflow`** (either breaks the sticky calendar pin below). See
  [[decisions-log]] ADR-0015 and [[components/wedding-sections]].
- **Intro→corner logo hand-off** — the corner `SiteLogo` is no longer always-on; it
  now stays hidden until the `<Preloader>` finishes and lands its monogram in the
  corner, then takes over seamlessly (new `useIntro` store; `logo.tsx` → client).
  Before, the always-on logo sat *under* the flying loader mark. See
  [[decisions-log]] ADR-0016, [[components/common]].

## 2026-05-29 (Logo + preloader + calendar page-turn)

- **A&U logo** — new `src/components/common/logo.tsx`: `LogoMark` (Playfair, italic
  gold ampersand) + `SiteLogo`, fixed top-left and **always visible** (`next/link`
  to `/`). Mounted in the root layout.
- **Intro preloader** — new `src/components/common/preloader.tsx`: a full-screen
  veil with the centred monogram + a progress bar that holds while the hero image
  preloads and for **≥ 2.4s**, then **flies the monogram to its corner home** (lands
  on `SiteLogo`) as the veil fades; locks scroll until done. **Driven by rAF, not
  react-spring** — root-mounted standalone springs are disposed by StrictMode so
  `.start()` is a no-op; see [[decisions-log]] ADR-0014.
- **Date section reworked into a pinned timeline** (`date-location-section.tsx` +
  new `calendar-flip.tsx`, replacing `calendar-date.tsx`):
  - Label **`когда?`** (was "Дата") slides out from under the hero, large →
    eyebrow size (`p [0,0.22]`).
  - Calendar **flips through months April → July** like turning pages — opaque
    stacked cards `rotateX 0→-108°` (perspective + `backfaceVisibility:hidden`) for
    a clean page turn.
  - The **gold ring draws on the 16th** later + quicker (`p [0.58,0.70]`).
  - The **gathering time** fades in only after the ring completes (`p [0.78,0.92]`).
  - `date-location.ts`: `eyebrow` → "когда?"; dropped `monthName` (RU month names
    derived in `CalendarFlip` from `iso`).
- **Layout** — `app/layout.tsx` now mounts `<SiteLogo/>` and `<Preloader image=…/>`.

## 2026-05-29 (Hero polish + calendar date)

- **Hero — square → screen morph.** The image now starts as a **square**
  (`side = min(vw,vh) * 0.6` from `useWindowSize`) and grows by animating **`width`
  & `height` independently** (not a uniform `scale`) to `vw`×`vh`, so its aspect
  ratio morphs to the viewport's shape (square → portrait on mobile). Even corners
  (`borderRadius 28px → 0`); the headline-framing spacer is now `side`px tall.
- **Hero — palette gradient backdrop.** Replaced the flat `bg-w-ink` stage with a
  full-bleed gradient `span` (z-0): a `--w-clay` glow over a `--w-ink-2`→`--w-ink`
  wash, built from tokens via `color-mix` (no raw hex).
- **Hero — headline centring fixed.** `<TextEngine>` renders as `display:flex`, so
  `text-center` didn't centre it; the words packed left. Fixed with `flex flex-wrap
  justify-center` on the `TextEngine` className. Documented as the *TextEngine
  centring gotcha* in [[components/wedding-sections]].
- **Date — now a calendar fragment.** New **`CalendarDate`**
  (`src/views/wedding/calendar-date.tsx`) renders the date as a calendar page
  (`Июль 2026`, Monday-first grid) with the day **`16` ringed in `--w-gold`** by an
  SVG loop that **draws on scroll** (`pathLength={1}` + animated `strokeDashoffset`,
  driven by a `<ProgressTrigger>` `top bottom`→`center center`; same
  one-progress-value pattern as the hero, ADR-0013). Replaces the written-out
  `<h2>` date; the real date is now an `sr-only` `<h2>` + `<time>`, calendar is
  `aria-hidden`.
- **Date changed to 16 июля 2026** (четверг). `date-location.ts` mock updated
  (`day/month/weekday/iso`) and gained **`monthName`** (nominative "Июль") for the
  calendar caption.

## 2026-05-29 (Hero redesign — scroll-pinned reveal)

- **Hero fully redesigned** (at the user's request, inspired by zuffa.studio).
  Replaced the split-screen groom/bride lockup with a **scroll-pinned reveal**: one
  centred image starts small (headlines **`МЫ ЖЕНИМСЯ!`** above, **`ПРИХОДИТЕ
  ПОСМОТРЕТЬ`** below) and, as the section pins, **grows to fill the screen** while
  the headlines slide away (up/down), blur and fade out, and an **invitation
  paragraph fades in** over the full image.
- **Implementation** — the section is a `<ProgressTrigger tag="section">`
  (`h-[240vh]`, `top top` → `bottom bottom`) over a `sticky top-0 h-dvh` stage. Its
  `onChange` feeds **one** `useSpring` progress value `p`; every property is a
  clamped `p.to(...)` interpolation (image `scale`/`borderRadius`, headline
  `translateY`/`opacity`/`blur`, scrim `opacity`, paragraph `opacity`/`blur`/`y`).
  All motion is react-spring — no CSS transitions/keyframes. See
  [[decisions-log]] ADR-0013.
- **`hero.ts` mock restructured** — `HeroData` is now
  `{ image, topText, bottomText, heading, paragraph }` (dropped
  `couple`/`groom`/`bride`). Uses the real `public/assets/hero/hero-main.webp`
  (4284×5712 portrait); the split `{groom,bride}.jpg` are no longer referenced.
- **Semantics** — one `sr-only` `<h1>` from `data.heading`; visible headlines stay
  decorative (`aria-hidden`, `TextEngine seo={false}`); overlay layers are
  `pointer-events-none`.

## 2026-05-29 (Hero split-screen — refinements)

- **Names moved to the seam** — each name now hugs the section centre (a per-half
  `alignClass`: bottom/top on mobile, right/left on desktop) forming a tight
  `Андрей & Ульяна` central lockup, instead of being centred in each half.
- **`&` is now split-colour, not blended** — replaced `mix-blend-difference` with
  a hard 50/50 clipped gradient (`from-w-bone from-50% to-w-gold to-50%
  bg-clip-text text-transparent`): top half = groom's bone, bottom = bride's gold.
  Dropped the section's `isolate` (no longer needed without the blend).

## 2026-05-29 (Hero redesign — split-screen experiment)

- **Hero reworked into a two-half split** — at the user's request, replaced the
  scattered four-photo monogram with **two equal halves** (groom + bride photos):
  stacked on mobile (groom top / bride bottom), side-by-side on desktop (groom
  left / bride right). Each name sits centred on its half — `Андрей` in `--w-bone`,
  `Ульяна` in `--w-gold` — and the **`&` sits at the seam** in white with
  `mix-blend-difference` (inverts against whichever photo it overlaps). Eyebrow and
  tagline removed (names only). An in-progress experiment for the user to evaluate.
- **`hero.ts` mock restructured** — `HeroData` is now `{ couple, groom, bride }`
  (dropped `photos[]` / `eyebrow` / `tagline`). Assets: added
  `public/assets/hero/{groom,bride}.jpg`, removed `photo-{1..4}.jpg`.
- **Layout gotcha noted** — halves use **`flex-1`**, not `h-1/2`; a percentage
  height collapses against the section's `min-h-dvh` (computed height stays
  `auto`). `section` carries `isolate` so the blend is scoped to the hero.
- **Semantics** — one `sr-only` `<h1>` with the full names; the visible split
  names are decorative (`aria-hidden`, `TextEngine seo={false}`).

## 2026-05-29 (Preferences form — page complete)

- **Preferences form section added** — `src/views/wedding/preferences-section.tsx`
  + `src/data/mocks/preferences.ts`, wired into `HomeView` as the final section.
  An **optional** guest form: name, an alcohol checkbox (sharp gold box + ink
  check via `peer-checked:`), allergies, and a preferences textarea, all in the
  warm-dark editorial style. Submit shows submitting/error states; on success the
  form swaps to a `Спасибо!` panel (`<Spring>` fade-in, conditional render — not
  `<Handle>`, to avoid per-keystroke transitions).
- **`app/api/preferences/route.ts`** — new endpoint following [[api-architecture]]:
  all-optional `zod` schema, `handle()` envelope, forwards to `CONTACT_ENDPOINT`
  when set (`kind: "wedding_preferences"`) else logs. No new env var. Verified:
  valid → `{ data: { received: true } }`, over-long input → `400` envelope.
- **`useSubmitPreferences` hook** — `src/hooks/use-submit-preferences.ts`, wraps
  `apiFetch` and tracks `idle/submitting/success/error`. Keeps network logic out
  of the form per component-conventions. Catalogued in [[hooks]].
- **The wedding page is now complete** — Hero → Date & Location → Schedule →
  Dresscode → Preferences, all on the shared warm-dark editorial system.

## 2026-05-29 (Dresscode switch + Lightbox)

- **Dresscode switch refined** — replaced the basic bordered pill with an
  editorial toggle: a `Выберите образ` caption over two **Playfair-italic** labels
  split by a hairline divider, with a **sliding gold underline** (`useSpring`).
  Labels are `whitespace-nowrap` (no wrap on mobile); inactive brightens on hover.
- **Full-screen Lightbox added** — new reusable `src/components/common/lightbox.tsx`.
  Gallery looks are now `<button>`s (cursor `zoom-in`, hover magnifier) that open a
  portal'd full-screen viewer: backdrop / `×` / `Esc` to close, on-screen chevrons
  + `←`/`→` to page, an `i / n` counter, Lenis scroll-lock + focus management,
  `role="dialog"`/`aria-modal`. Animated with `useTransition` (overlay) + keyed
  `<Spring>` (image). Documented in [[components/common]].

## 2026-05-29 (Dresscode section)

- **Dresscode section added** — `src/views/wedding/dresscode-section.tsx` +
  `src/data/mocks/dresscode.ts`, wired into `HomeView` after Schedule. A
  two-option **switch** (`Для него` default · `Для неё`) with a sliding gold
  indicator (`useSpring`) swaps a **triptych gallery** of looks via `<Handle>`
  (cross-fade on content change; the gallery is `useMemo`-d per option so it only
  transitions on switch). Per-option caption + a decorative recommended-tones
  swatch row (`--w-*`). Placeholder images in `public/assets/dresscode/`.
- **Semantics** — `role="group"` + `aria-pressed` buttons for the switch,
  `<ul>`/`<li>` gallery with informative `alt`, section `aria-label`.
  Documented in [[components/wedding-sections]].

## 2026-05-29 (Schedule section)

- **Schedule section added** — `src/views/wedding/schedule-section.tsx` +
  `src/data/mocks/schedule.ts`, wired into `HomeView` after Date & Location. A
  vertical timeline (Сбор гостей · Фуршет · Церемония · Ужин · Вечеринка) with a
  faint base rail + a **gold rail that fills on scroll** (`SpringTrigger` scrub
  `scaleY`), **sharp gold diamond markers** (rotated squares), italic-gold
  Playfair times, bold Onest titles, muted notes. Semantic `<ol>`/`<li>`,
  `<h3>` per entry, `<time>` per slot.
- **Entry reveal uses `toggle`, not `scrub`** — each entry + diamond snaps in
  one-by-one (start `top bottom` → end `center bottom`) and stays. `scrub` keyed
  to "centre" never completes for the last section's lower items (nothing below
  to scroll them up); `toggle` fires on a reachable threshold, so every entry
  reveals regardless of position. Noted in [[components/wedding-sections]].

## 2026-05-29

- **Date & Location section added** — `src/views/wedding/date-location-section.tsx`
  + `src/data/mocks/date-location.ts`, wired into `HomeView` after the hero.
  Minimalist date (`12` · italic-gold `сентября` · `2026`) over a full-width,
  short Google Maps band (keyless `?output=embed` URL — no API key; placeholder
  is Gorky Park, Moscow). Map height `clamp(16rem, 42vh, 28rem)`, light
  `grayscale-[0.35]` to match the dark theme. Semantic `<h2>`/`<h3>`,
  `<time dateTime>` (sr-only), `<address>`, iframe `title`.
- **Scroll-trigger pattern established for below-fold sections** — `TextEngine`
  `mode="once"` (the engine's own IntersectionObserver, which *does* work) for
  text reveals, and `SpringTrigger mode="scrub"` for non-text reveals + a gentle
  parallax drift on the text column. This sidesteps the broken `<Inview>`
  wrapper. Documented in [[components/wedding-sections]].
- **`eyebrow` Tailwind `@utility` added** — the gold tracked all-caps label is
  now used 3× (hero + two section labels), so it was extracted to
  `@utility eyebrow` in `globals.css` and the hero refactored to use it. Per
  ADR-0012 this is a pure-utility combo (markup comes from the animation
  component), so a `@utility` — not a React component — is correct.
- **Wedding catalog note broadened** — `components/wedding-hero.md` renamed to
  `components/wedding-sections.md` (now covers Hero + Date & Location + the
  shared palette/fonts/eyebrow system); README index updated.

## 2026-05-28 (third pass — full redesign)

Hero reworked end-to-end for a modern, sharp, editorial feel (the pastel +
Bodoni version read as amateur). Brief trajectory kept: couple names, invitation
copy, scattered images.

- **Palette overhaul — warm pastels → warm-dark editorial.** Replaced the
  `--wedding-*` tokens with a coherent dark set: `--w-ink` (#181310 warm
  near-black ground), `--w-ink-2`, `--w-bone` (#ece3d4 ivory text), `--w-gold`
  (#c2a14e antique gold accent/monogram), `--w-clay` (#b3795a terracotta),
  `--w-muted` (#9a8b76 taupe secondary). Tailwind utilities `bg-w-ink`,
  `text-w-bone`, `text-w-gold`, etc. Old `--wedding-*` / `--radius-photo` tokens
  removed (only the hero referenced them).
- **Font overhaul — Bodoni Moda → Playfair Display + Onest.** Names now set in
  **Onest** (already loaded) — bold, uppercase, tight tracking — for a sharp
  grotesque display; the ampersand is **Playfair Display** italic in gold as an
  elegant serif counterpoint. `--font-display` → `--font-playfair`,
  `--font-body` → `--font-onest`. Bodoni Moda and Nunito removed from
  `layout.tsx`.
- **Layout & composition.** Names stacked vertically (`Андрей` / `&` / `Ульяна`)
  as one `<h1>` with a clipped line-reveal per name and a scaling ampersand.
  Added a thin inset editorial frame border, a short vertical gold tick above
  the eyebrow, and the eyebrow set as widely-tracked gold caps.
- **Images — 4 now, unified treatment.** Added `photo-4.jpg`; all four spread to
  the corners (some bleeding off-edge) with no rotation/radius. A shared warm
  monochrome filter (`grayscale-[0.6] sepia-[0.2] contrast-[1.05]
  brightness-[0.9]`) + a `bg-w-ink/35` overlay + a `ring-w-bone/12` hairline make
  the random placeholders read as one intentional editorial set. Scroll + cursor
  spring parallax retained.

## 2026-05-28 (second pass)

- **Hero redesigned — sharper, more modern** — Photos repositioned flush to
  section corners (no margin offsets), rotation removed from all three,
  `rounded-photo` / shadow / border removed from frameClass for clean
  rectangular crops. Photo 2 uses `aspect-[2/3]` (taller crop) for visual
  variety. Scroll parallax values tightened to keep edge-anchored photos in frame.
- **Display font changed: Cormorant Garamond → Bodoni Moda** — `--font-bodoni`
  replaces `--font-cormorant`; `--font-display` now resolves to `--font-bodoni`.
  Non-italic (upright) applied to h1. High-contrast Bodoni strokes are more
  editorial and less generic than Cormorant at display sizes. Cyrillic ✓.
- **Eyebrow text styling** — changed from italic small-caps to
  `uppercase tracking-[0.35em]` — magazine/editorial style.

## 2026-05-28

- **Wedding hero section built** — `src/views/wedding/hero-section.tsx` (client
  leaf) and `src/data/mocks/hero.ts`. Three absolutely-positioned photos respond
  to both scroll (via `ProgressTrigger` + `useSprings`) and cursor movement
  (via `onMouseMove` → `api.start`); each photo has individual spring tension.
  Center content uses `TextEngine` (names h1, tagline p) and `Spring` for
  eyebrow and divider reveals. `HomeView` updated to render `HeroSection`.
- **Fonts added** — `Cormorant_Garamond` (display, Cyrillic) bound to
  `--font-display`; `Nunito` (body, Cyrillic) bound to `--font-body`. Both added
  to `layout.tsx` alongside existing Onest. HTML `lang` corrected to `"ru"`.
- **Wedding design tokens** — added to `globals.css`: 7 palette tokens
  (`--wedding-cream`, `--wedding-blush`, `--wedding-rose`, `--wedding-sage`,
  `--wedding-text`, `--wedding-muted`, `--wedding-gold`), font aliases
  (`--font-display`, `--font-body`), and border radius (`--radius-photo`).
  Body styles cleaned up (removed starter centering flex).
- **Placeholder hero photos** — `public/assets/hero/photo-{1,2,3}.jpg`
  downloaded as temporary placeholders (picsum.photos). Replace with real couple
  photos before launch.
- **`Inview` workaround** — discovered a pre-existing bug in `in-view.tsx`:
  `inViewRef.current = node` should be `inViewRef(node)` (TypeScript also flags
  this at lines 167 & 188). The IntersectionObserver is never set up, so `Inview`
  always stays at `opacity: 0`. Hero uses `Spring mode="once"` (plays on mount)
  instead of `Inview` as the reveal primitive. Bug left untouched — engine is
  `#do-not-modify`.

## 2026-05-23

- **README — setup + Vercel deploy steps added** — *Getting started* expanded
  into a four-step flow (clone the template → delete bundled `.git` →
  initialise your own GitHub repo → install & run), with a macOS hint for
  revealing the hidden `.git` folder (`⇧ + ⌘ + .`). Added a *🚀 Deploy to
  Vercel* section covering the CLI flow (`vercel` / `vercel --prod`) and the
  dashboard import path, plus an `env pull` pointer to
  [[environment-variables]].
- **README rewritten to lead with the AI workflow** — root `README.md`
  reorganised so the AI usage guide is the first section: how the three
  `.claude/settings.json` hooks (`SessionStart`, `UserPromptSubmit`, `Stop`)
  enforce the vault workflow automatically, how to write a good request
  against this convention layer, and a cost-expectations note recommending
  **Claude Max (5×)** as the minimum plan (the vault-fan-out + hook
  re-injection on every turn is token-intensive by design). Technical
  *Getting started* and the existing AI-agents entry-point pointer stay
  below.

## 2026-05-22

- **Styling-placement convention added** — to stop `globals.css` accumulating
  hundreds of component-specific classes, styling now follows a strict
  placement order: one-offs are Tailwind utilities, repeated patterns become
  **React components** (not `@layer components` classes), and `@layer
  components` is reserved strictly for pseudo-elements and third-party
  overrides. `globals.css` stays bounded — `@import`, tokens, base resets only.
  No CSS Modules. Codified in [[decisions-log]] ADR-0012; [[design-system]]
  (new *Where a style goes* section) and [[component-conventions]] updated.
- **Semantic-HTML / SEO-markup convention added** — new [[html-semantics]]
  rulebook: landmarks, one `<h1>` + heading outline, native elements over
  `div`s, forms/images/ARIA, JSON-LD over microdata, a `data-*` convention, and
  passing a semantic `tag` to animation components. Codified as AGENTS.md hard
  rule #10; cross-linked from [[component-conventions]] and [[new-page]]. Fixed
  the demo (`home-showcase.tsx`) to a single `<h1>` to follow it.
- **API layer added** — a convention for reaching external services.
  `app/api/<resource>/route.ts` Route Handlers own their logic and read secret
  env vars directly (safe — route files never reach the browser). New: `zod`
  dependency; `src/env.ts` (validated env, public/server split); `src/lib/api/`
  (`handle` wrapper + `ApiError` + `{ data }`/`{ error }` envelope);
  `src/lib/api-client.ts` (typed same-origin fetch); example
  `app/api/contact/route.ts`. Codified as AGENTS.md hard rule #9. See
  [[decisions-log]] ADR-0011 and [[api-architecture]].

## 2026-05-21

- **Asset convention added** — site content assets (images, videos) now live
  under `public/assets/<section>/`, one folder per section; meta/PWA/SEO assets
  stay at the `public/` root. Documented in [[folder-structure]],
  [[component-conventions]], and the [[new-page]] playbook; `public/assets/`
  created with a `.gitkeep`.
- **SEO & performance hardening** — a broad pass on the starter. **SEO:** new
  `src/lib/site.ts` config (single source of truth, fed by `NEXT_PUBLIC_SITE_URL`);
  `metadataBase` is now always set (relative OG/canonical URLs resolve);
  `themeColor` moved to a `viewport` export; added `app/robots.ts`,
  `app/sitemap.ts`, and an `Organization`+`WebSite` JSON-LD helper; OG image
  dimensions corrected to match the asset; dead `keywords`/`other` tags dropped.
  **Performance:** populated `next.config.ts` (`removeConsole` in prod,
  AVIF/WebP, `next/image` breakpoints aligned to the grid, `poweredByHeader:
  false`); fixed a `requestAnimationFrame` leak in `ScrollLayout` (Lenis loop
  never cancelled on unmount); `HomeView` is now a Server Component with the
  animation demo split into the `HomeShowcase` client leaf; added
  `<ReducedMotion>` (honours `prefers-reduced-motion` via react-spring's global
  `skipAnimation`); removed a per-frame `console.log` from the demo; added
  `app/loading.tsx` / `error.tsx` / `not-found.tsx`. See [[decisions-log]]
  ADR-0010, [[seo-metadata]], and [[environment-variables]].
- **Animation engine — lint pass** — cleared all 13 pre-existing ESLint problems
  in the engine (2 errors + 11 warnings), an authorized engine edit (ADR-0009).
  `isMobileDisabled` now takes an optional `viewportWidth` argument, so the
  `active` memos in `<Spring>` / `<Hover>` / `<Inview>` / the trigger hooks
  depend on it genuinely. Added missing `disableOnMobile` effect deps; fixed a
  `trigger.current`-in-cleanup hazard in `<Hover>`; ref-stabilised `<Handle>`'s
  transition effects. **API change:** `useProgressTrigger` now returns `progress`
  as a `RefObject<number>` (read `.current`) instead of a render-time ref read —
  no consumer was affected (`<ProgressTrigger>` discards the return).
- **Animation engine — performance refactor** — fixed load issues that scaled
  with the number of animated components. Added `src/lib/animation/ticker.ts`, a
  single reference-counted `requestAnimationFrame` loop; `useLoop` (and all loop
  hooks) now subscribe to it instead of each starting its own rAF. `useWindowWidth`
  / `Height` / `Size` now share one debounced `resize` listener via a
  `useSyncExternalStore` store (the `debounceDelay` param was dropped — unused).
  `useDynamicInView` rewritten without the per-render `Proxy`/observer churn.
  Fixed a stale-closure bug in `useLoop`. `mode="forward"` scroll listeners made
  `passive`. This was an **authorized edit to `#do-not-modify` engine files** —
  hard rule #2 amended. See [[decisions-log]] ADR-0009 and [[animation-system]].
- **`spring-text-engine` updated** — bumped `^0.1.3` → `^0.1.5` (latest). The
  public API, types, and dependencies are unchanged between these versions
  (verified) — an internal-only patch bump, no code changes required.
- **Adaptive scaling grid added** — a root-font-size scaling system landed in
  `src/components/common/grid/` (`<AdaptiveGrid>` + `useAdaptiveGrid` hook +
  `grid.config.ts`), with `vw` media queries in `globals.css` for scale-down.
  It was dropped into `common/` as a `styled-components` system; ported to the
  project stack — config-driven TS + CSS-only Tailwind, no `styled-components`.
  The unused dropped files (`colors.ts`, `fonts.ts`, `utils.ts`, `index.ts`,
  the `styled-components` `grid.tsx`) were removed. Mounted via `<AdaptiveGrid>`
  in the root layout. See [[components/common]] and [[decisions-log]] ADR-0008.
- **Vault created** — `obsidian/` Obsidian vault initialised as the project's
  second brain. Architecture, frontend, and workflow docs populated. See [[decisions-log]] ADR-0001.
- **Root README rewritten** — replaced `create-next-app` boilerplate with a real
  project README that points into this vault.
- **`generic-layout-prompt.md` moved** — relocated from repo root to
  `obsidian/workflows/` as [[generic-layout-prompt]].
- **Navigation convention resolved** — standard `next/link` confirmed; the unbuilt
  `<AnimLink>` / `useAnimRouter()` convention dropped. See [[decisions-log]] ADR-0005.
- **Docs consolidated into the vault** — `project-specs.md` deleted (decomposed into
  vault notes + new [[environment-variables]]); `text-engine-docs.md` moved in as
  [[text-engine-reference]]. `AGENTS.md` rewritten as a thin shim; `.cursorrules`
  repointed to `@AGENTS.md`. The vault is now the single source of truth.
  See [[decisions-log]] ADR-0006.
- **Vault renamed & restructured** — vault folder `getlayers.io/` → `obsidian/`;
  number prefixes dropped from section folders (`00-meta` → `meta`, etc.). Project
  name standardised to **`next16-claude-starter`** across docs and `package.json`.
- **Components linked to docs** — every file in `src/components/` now carries a
  `// 📖 Docs:` pointer comment to its catalog note, so agents can jump from code
  to docs and back.
- **Vault workflow automated** — added `.claude/settings.json` with `SessionStart`,
  `UserPromptSubmit`, and `Stop` hooks that make agents read the vault first,
  follow the relevant guide, and update docs after every change — with no manual
  reminder. See [[decisions-log]] ADR-0007 and [[ai-agent-guide]].
- **Cookie component replaced** — the `react-cookie-consent`-based `cookie.tsx`
  was replaced by an in-house `Cookie/` component (banner + category preferences
  modal + Zustand store). `react-cookie-consent` removed from dependencies. The
  component shipped using `styled-components` + an external design system; it was
  ported to the project stack — Tailwind v4 tokens and `@react-spring/web` motion.
  Mounted via `<LazyCookie>`. See [[components/common]].
- **Fixed TextEngine spring type mismatch** — the `mode="once"` heading in
  `views/home.tsx` mixed `lineIn={{ y: 0 }}` (number) with `lineOut={{ y: "100%" }}`
  (string), throwing *"Cannot animate between _AnimatedString and _AnimatedValue"*.
  Changed to `y: "0%"`. The buggy pattern in [[text-engine]] / [[text-engine-reference]]
  examples was corrected and a type-matching gotcha note added.

## Project baseline (git history)

| Commit | Description |
|--------|-------------|
| `94b0870` | feat: update starter |
| `5280ef2` | fix: linter errors & build |
| `b2b84e6` | initial — `next16-claude-starter` scaffold |

> [!note]
> The starter shipped with: Next.js 16.2, React 19.2, Tailwind v4, `@react-spring/web`,
> `spring-text-engine`, Lenis, and Zustand. See [[tech-stack]] for the current state.
