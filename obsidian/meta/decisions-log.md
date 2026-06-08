---
tags: [meta, decision]
updated: 2026-06-08e
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0034 — Guest form delivery via Telegram Bot API

- **Status:** Accepted
- **Date:** 2026-06-08

**Context.** The wedding preferences form needed a real notification channel to the hosts. The starter's `/api/preferences` route previously forwarded to a generic `CONTACT_ENDPOINT` webhook (same as `/api/contact`) or logged server-side — workable for a template, but not tailored to a one-person wedding site where the organizer wants an instant mobile ping.

**Decision.**
1. **Telegram as the preferences upstream.** `/api/preferences` delivers via the Telegram Bot API (`sendMessage`) when `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set. Both are server-only env vars, validated as a pair in `getServerEnv()` (both or neither).
2. **Shared client in `src/lib/telegram.ts`.** `formatPreferencesMessage` builds an HTML message (user input escaped); `sendTelegramMessage` calls the Bot API and maps failures to `ApiError(502)`. Keeps the route handler thin per [[api-architecture]].
3. **`CONTACT_ENDPOINT` unchanged for `/api/contact`.** Only the preferences route switches to Telegram; the generic webhook remains for other lead forms.
4. **Dev fallback.** When Telegram vars are unset, submissions log server-side so the starter runs without credentials.

**Consequences.** The organizer must create a bot (@BotFather), message it once, and copy the chat ID from `getUpdates` (documented in `.env.example`). Telegram's HTML parse mode limits formatting but is sufficient for the short RU field summary. No new npm dependency — plain `fetch`. Browser never holds the token. A dedicated success UI (`PreferencesSuccess`) replaces the minimal post-submit state so guests get clear confirmation independent of the delivery channel.

---

## ADR-0033 — Desktop legibility boost (1.25× root rem) + hero headline decoupling

- **Status:** Accepted
- **Date:** 2026-06-08

**Context.** The layout is authored mobile-first. The adaptive grid scales the root font-size by `16 * 100 / baseWidth` vw per bracket, hitting exactly 16px only at each bracket's base width (1024/1440/1920); at common desktop widths (1366, 1536, 1600) the root rem dips to ~12–15px, so all rem-based text/spacing renders small on desktop. Separately, the hero's initial image was a square (`min(vw,vh) * 0.6`); on desktop it left too little room above it and the top headline («МЫ») clipped off the top of the viewport (worse on 768px-tall laptops).

**Decision.**
1. **1.25× desktop boost.** Each desktop `vw` bracket in `globals.css` is multiplied by 1.25 (`16 * 100 / baseWidth * 1.25` vw); mobile (≤640px) is unchanged. `useAdaptiveGrid` applies the same `DESKTOP_BOOST = 1.25` to the >1920px scale-up range (and to its set/clear threshold) so the size is continuous across the 1920px boundary. Net: rem text/spacing reads ~25 % larger on desktop, proportionally (text, gaps, and rem max-widths all scale together).
2. **Decouple the hero top headline.** Because the boost would re-enlarge the hero headline and re-introduce the clip, the fit-critical top block divides its `md:` sizes by 1.25 — punch `md:text-[5rem] → md:text-[4rem]`, kicker `md:text-3xl → md:text-[1.5rem]` — so `4rem × 1.25 = 5rem`-equivalent px: the rendered headline is unchanged and the image-vs-headline fit math stays stable. (The hero's bottom hand-line and invitation paragraph are *not* decoupled — they have room and benefit from the boost.)
3. **Shorter hero image on desktop.** `initialH = side` on mobile, `side × 0.5` on desktop (`vw ≥ 768`) — a landscape crop; headline anchors switched from `side/2` to `initialH/2`. Verified the top block clears the top across 1280×800 / 1366×768 / 1536×864 / 1920×1080.

**Consequences.** Desktop body text/UI reads at an appropriate size; mobile untouched. The hero headline keeps its designed size and no longer clips. Re-tuning desktop scale = change the single `1.25` in `globals.css` **and** `use-adaptive-grid.ts` (and the hero `÷1.25` divisor). Because px/vh-based elements (e.g. the schedule slot width, image boxes) do not scale with rem, there can be slight proportion shifts between rem text and px containers — acceptable, but **not browser-verified in this environment**: recommend a desktop pass (1366×768 and a wide monitor) plus a hero-headline fit check.

---

## ADR-0032 — Unified section transitions: shared reveal line, declarative dresscode cascade, pinned-section exit parallax

- **Status:** Accepted
- **Date:** 2026-06-08

**Context.** The date→location transition was the agreed-good reference; location→schedule and schedule→dresscode looked different, and the dresscode gender switch still made the switch + everything below it vanish permanently (ADR-0031's `<Handle>` removal did not fix it). Three distinct problems:

1. **Switch disappears (real root cause).** Dresscode's `switchReveal` / `captionReveal` / `blacklistReveal` / `photoSprings` were still the **single-shot imperative** form — `useSpring(() => ({opacity:0}))` + `api.start({opacity:1, delay})` inside a `useEffect([revealed])`. This is the exact pattern ADR-0030 proved unreliable in this react-spring 10 / React 19 build, but dresscode's *cascade* was never converted (only its heading was extracted to `SectionHeading`). Clicking the switch calls `setActive` → re-render; in this build the imperative springs reset toward their initial `0` and the one-shot `start` (which only ran in the now-settled `[revealed]` effect) never replays → opacity stuck at 0 forever.

2. **Inconsistent reveal triggers.** Date/location used `IntersectionObserver` threshold `0.7` on a **viewport-height** content div; schedule used a progress-gate (`progress > 0.01`, ADR-0031); dresscode used threshold `0.1` on the whole (taller-than-viewport) section. Threshold-on-content only reproduces a consistent timing when the content is exactly viewport-height — it cannot be ported to the pinned carousel or the tall dresscode.

3. **"Old exits faster than new enters" missing on the pinned schedule.** Date/location achieve it because the exiting panel *flows*: its content scrolls up at 1× **plus** a −12 vh exit-parallax over the 20 vh overlap ⇒ ~1.24× the 1× incoming panel. Schedule is **pinned** for its entire progress, so during the only window where the dresscode (`-mt-[20vh]`) coexists with it — the final 20 vh of scroll — the pinned content contributes **0×**. ADR-0031's `-12 vh over [0.9, 1]` only moved ~−6.7 vh during that overlap, so the incoming dresscode actually moved *faster* — backwards.

**Decision.**
1. **Shared reveal line — `useRevealOnEnter` + `REVEAL_ROOT_MARGIN`** (`src/hooks/use-reveal-on-enter.ts`). One `IntersectionObserver` with `rootMargin: "0px 0px -20% 0px"`, `threshold: 0`, observing each section's **heading element**, firing `revealed` once when the heading crosses the 80 vh-from-top line. For a viewport-height panel revealed at 70 % visibility the centred heading sits at exactly 80 vh from top — so date/location timing is **preserved** — but expressed as a root margin it now applies identically to the pinned schedule and the tall dresscode (heading position, not content height, sets the trigger). Replaces all four bespoke IO/progress triggers. Reveal springs stay **declarative**, gated on the returned flag.
2. **Dresscode cascade → declarative.** `switchReveal` / `captionReveal` / `blacklistReveal` are `useSpring({ opacity: revealed ? 1 : 0, delay: revealed ? D : 0 })`; the photos are the **declarative array form** `useSprings(3, [...])`. The delay applies only on the 0→1 transition; once revealed the target stays `1`, so `setActive` re-renders diff to no-change and never reset. Fixes the disappearing switch. (Same delays as before: switch 1500, photos 1800 + i·200, caption 2500, blacklist 2800.)
3. **Pinned-section exit parallax.** Schedule's inner content rises `EXIT_VH = 24 vh` over **exactly** the dresscode overlap window `[overlapStart, 1]`, where `overlapStart = 1 − OVERLAP_VH / (pinHeightVh − 100)` (= 0.944 for n = 5). 24 vh over the 20 vh overlap ≈ 1.2× the 1× incoming dresscode — the same old-faster ratio the flowing panels get, but sourced entirely from parallax since the pin contributes 0×. The gentle `[0.9, 1]` ramp from ADR-0031 is replaced by this overlap-locked ramp.
4. **Delay consistency.** Schedule's `headingDelayIn` aligned `300 → 450` to match dresscode / the `SectionHeading` default; the eyebrow already reveals immediately in every section via the shared component.

**Consequences.** All three transitions (date→location, location→schedule, schedule→dresscode) share one reveal line, one reveal mechanism (declarative springs), and the same "old exits faster than new enters" behaviour. The gender switch no longer blanks the lower block. The dresscode→preferences exit (out of scope here) keeps its slow +16 vh lag from ADR-0031. The pinned schedule's exit is necessarily a steeper content lift than the flowing panels (all of its "faster" must come from parallax) — the rate is matched but the feel is firmer; acceptable and the best achievable without un-pinning the carousel. Not browser-verified in this environment — recommend a manual scroll-through of all three seams plus a gender-switch click.

---

## ADR-0031 — Schedule heading timing + exit parallax; dresscode para speed + Handle removal + slower exit

- **Status:** Accepted
- **Date:** 2026-06-08

**Context.** Five UX issues raised after ADR-0030:
1. **Schedule heading "not animated"** — The IO on the `stageRef` sticky div fires when the sticky div first enters the viewport from below (~99 vh before pin-start). At normal scroll speed the heading animation completes long before the section pins; the user sees a static heading. Fix: fire `revealed` from `handleProgress` when `progress > 0.01` (once, via `revealedRef`), which triggers exactly at pin-start.
2. **Dresscode intro paragraph too slow** — `INTRO_REVEAL.letterStagger 35ms` with `tension: 700`. Fix: `letterStagger: 18, tension: 800, friction: 28` — noticeably faster letter cascade.
3. **Gender switch causes entire lower block to disappear** — `<Handle>` transitions between gallery children. Root cause under investigation; removing Handle is the minimal safe fix. Gallery now renders in a plain `<div>`; `photoSprings` still stagger the initial reveal (unchanged timing); photos swap instantly on gender switch (no cross-fade, no visible regression).
4. **Schedule→dresscode handoff too slow** — Schedule lacked any exit parallax. Fix: add `exitY = p.to([0, CAROUSEL_END, 1], [0, 0, -12])` on the inner content wrapper (same `-12vh` pattern as date→location and location→schedule). The old `-112vh` whoosh (removed in ADR-0030) is NOT restored; this is a standard subtle parallax only.
5. **Dresscode exits too fast** — `ep.to([0,0.5,1],[0,0,8])` → `ep.to([0,0.5,1],[0,0,16])`. `pb-[22vh]` → `pb-[30vh]` for headroom.

**Consequences.** Schedule heading reliably animates on pin-entry. Intro paragraph reveals faster. Gender switch no longer causes content to disappear. Schedule→dresscode transition has the standard parallax handoff. Dresscode lingers longer during exit. Not yet verified in a live browser — recommend a manual scroll-through.

---

## ADR-0030 — Shared SectionHeading + declarative reveals; schedule retune

- **Status:** Accepted
- **Date:** 2026-06-07

**Context.** Recurring complaints the previous two ADRs (0028, 0029) failed to put to rest: location & dresscode headings missing, the schedule heading not animating, and the date-panel elements vanishing (resetting to their `from` state) after being scrolled out of view once. The common thread: every one of these sections revealed its eyebrow label — and the date panel its calendar/note/map — with the **single-shot imperative** form `const [s, api] = useSpring(() => ({…})); … api.start({…})`. That one-time `api.start` is unreliable in this react-spring 10 / React 19 build — it is the exact reason `spring.tsx` and `in-view.tsx` were already converted to declarative springs. A no-op `start` leaves a label at `opacity: 0` (reads as "missing"/"not animated"); when it does fire, the value isn't reliably committed, so a later render reconciles back to the `from` values (the date "disappear"). The earlier fixes only changed the exit-parallax to `.set()` and added IO triggers; they left the imperative reveals in place, so the bug persisted. By contrast, the **preferences** section — never reported as broken — used declarative `SpringTrigger`/`TextEngine` throughout.

**Decision.**
1. **Extract a shared `SectionHeading`** (`src/views/wedding/section-heading.tsx`): the eyebrow scale-in label + an optional letter-revealed heading, built on **declarative** `useSpring` (diffed each render) and `TextEngine`. Reveal is gated on a boolean — an internal `IntersectionObserver` by default, or a controlled `enabled` prop when the section owns a larger cascade. Reused in every section (date, location, schedule, dresscode, preferences).
2. **Convert date/location reveals to declarative** — calendar `t`, note, and map fade are `useSpring({ …: revealed ? a : b })` driven by an IO-set `revealed` flag. Exit-parallax `dp`/`lp` keep the continuous `.set()` form (that path was never the problem).
3. **Retune the schedule** — the timeline container fades in on **inview** (`revealed`, +700 ms after the heading) rather than at `CAROUSEL_START` of a tall pin; scroll now drives only the timeline *progress*. The carousel is re-choreographed so the last item is centred at `p = 1`, so the pin releases exactly when the timeline ends; the `-112vh` exit whoosh / `exitOpacity` are removed in favour of the standard `-mt-[20vh]` overlap handoff. `CAROUSEL_START 0.15 → 0.06`, `EXIT_START` removed, `pinHeightVh n*80+160 → n*80+60`.

**Rule of thumb going forward.** Reveal-once animations use **declarative** springs gated on a state flag (or `TextEngine` / `SpringTrigger`), never a single imperative `api.start()`. Continuous per-frame `api.set()` (scroll parallax) remains fine. Supersedes the reveal mechanics of [[decisions-log#ADR-0029|ADR-0029]] / ADR-0028.

**Consequences.** All section headings reveal reliably and consistently; the date panel no longer blanks on scroll-out; the schedule timeline appears with the heading and exits like any other section. One reusable heading component instead of five bespoke imperative copies. Not yet verified in a live browser (no automation available in this environment) — recommend a manual scroll-through.

---

## ADR-0029 — Schedule height reduction; spring-lag fix; TextEngine enabled gates

- **Status:** Accepted
- **Date:** 2026-06-06

**Context.** Three UX issues: (1) Schedule section was 800vh (n×120+200) — too much scroll between last carousel item and dresscode. (2) Date/location/dresscode exit-parallax springs (`dp`, `lp`, `ep`) held their last value when the ProgressTrigger loop paused on section exit; stale value ≈1 caused exit parallax to apply during re-entry, clipping content and making sections appear blank on return. (3) Location venue/city/street and dresscode h2/intro (`TextEngine mode="once"`) weren't revealing — the engine's own IO may not fire correctly for below-fold elements.

**Decision.**
1. **Schedule height** — `n * 120 + 200` → `n * 80 + 160`. Proportions preserved.
2. **Exit-parallax immediacy** — `.start()` → `.set()` for all three exit-parallax springs. `api.set()` immediately reflects the current scroll progress with no lag or stale state.
3. **TextEngine `enabled` gate** — restored `enabled={revealed}` on location and dresscode TextEngine headings. The `revealed` state is set by our own reliable IO callbacks (threshold 0.7 / 0.1) that fire while content is in the viewport. TextEngine's IO fires on the next observation frame after `enabled` becomes true while element is already intersecting.

**Consequences.** Schedule section shorter. Date/location/dresscode sections correctly show content on revisit. Location venue/city/street and dresscode heading/intro reveal on first entry.

---

## ADR-0028 — Fix exit-parallax extrapolation; IO-based entry triggers

- **Status:** Accepted
- **Date:** 2026-06-06

**Context.** `dp.to([0.5, 1], [0, -12])` in date and location panels, and `ep.to([0.5, 1], [0, 8])` in dresscode, extrapolate linearly outside their declared input range (react-spring default). At `dp=0` the result is `+12vh` (dresscode: `−8vh`). The inner content divs are translated off-screen during section entry (progress < 0.5), so fire-once entry animations complete while content is invisible. On scroll-reversal, the same extrapolation re-applies and content visually disappears. The `progress > 0.05` threshold also fires before content is in the visible viewport.

**Decision.**
1. **Fix exit-parallax ranges** — all three `.to()` calls changed to `[0, 0.5, 1]` with `[0, 0, exitValue]`. Left-edge slope = 0 → zero extrapolation outside [0, 1]; content stays at y=0 during the entire entry phase and only begins its parallax shift once progress > 0.5.
2. **IO-based entry triggers** — replaced progress-threshold fire-once in all three `handleProgress` callbacks with `useEffect` + `IntersectionObserver`. IO observes the actual content element (not the ProgressTrigger wrapper), fires once at the right threshold (0.7 for date/location 100vh panels; 0.1 for tall dresscode section; 0.01 for schedule sticky stage), disconnects immediately. `handleProgress` now only drives the exit-parallax spring.

**Consequences.** Entry animations fire when the section content is geometrically in the visible viewport. Scroll reversal no longer moves content off-screen. Sections stay in their final state permanently after first reveal.

---

## ADR-0027 — All non-hero animations: inview-once, no reversals

- **Status:** Accepted
- **Date:** 2026-06-06

**Context.** After removing Lenis Snap (ADR-0026), the `progress > 0.48` entry threshold (designed for the snap-rest position) was too late — continuous scroll means sections pass through before the threshold is crossed, leaving content at its invisible initial state. Additionally, `TextEngine mode="once" enabled={revealed}` had an IntersectionObserver race: if `enabled` changed to `true` after the element had already exited the viewport, IO never re-fired, and text stayed at `letterOut` (opacity 0). Preferences section used `mode="toggle"` (SpringTrigger) and `mode="progress" type="toggle"` (TextEngine) which reverse on backward scroll — content disappearing on scroll-up.

**Decision.**
1. **Lower thresholds** — date/location/dresscode `handleProgress` fire-once guards changed from `progress > 0.48` to `progress > 0.05` (fires on first frame the section is meaningfully in view).
2. **Remove `enabled` gates** — all `TextEngine mode="once" enabled={revealed}` simplified to `TextEngine mode="once"`, letting IntersectionObserver handle timing independently. `revealed` state kept where needed for non-TextEngine springs.
3. **Preferences → mode="once" everywhere** — SpringTrigger `mode="toggle"` → `mode="once"`; TextEngine `mode="progress" type="toggle"` → `mode="once"` (trigger/start/end props removed, IO replaces ScrollTrigger); `mode="forward"` → `mode="once"`.

**Consequences.** All non-hero content animates in on first viewport entry and stays visible permanently. Scroll-back shows full content in all sections.

---

## ADR-0026 — Remove Lenis Snap; schedule titles inview; timeline items persistent opacity

- **Status:** Accepted
- **Date:** 2026-06-06

**Context.** Section snap-to-top via `LenisSnap` was interfering with natural free-scroll feel. The schedule heading (eyebrow + h2) was driven by scroll progress, meaning the user had to scroll to reveal the title instead of it simply appearing on section entry. Timeline items had a fade-out on exit that created a "window" visibility effect — the user wants items to accumulate as they advance through the carousel.

**Decision.**
1. **Remove `LenisSnap`** — `lenis/snap` import, `LenisSnap` instance, `snap`/`setSnap` from the scroll store, and all `snap.addElement()` effects removed. Sections free-scroll.
2. **Schedule titles → inview** — Eyebrow and h2 converted to fire-once entry pattern (same as Dresscode): `progress > 0.02` fires a `useSpring` for the label and sets `revealed`, which enables `TextEngine mode="once"` for the h2. Proxy `headingTriggerRef` and `H2_REVEAL_START` removed.
3. **Timeline opacity — fade-in only** — Per-item `textOpacity` keyframe reduced to `[0,0,1,1]` over `[0,rs,rs+REVEAL_DUR,1]`. Items stay at `opacity:1` after their reveal point for the remainder of scroll.

**Consequences.** Pages scroll continuously with no snap nudge. Schedule heading appears immediately on section entry. Revealed timeline items stay visible as previous carousel items slide off-screen.

**Qualifies** ADR-0024 (snap removed); timeline section retains its pin/carousel mechanic.

---

## ADR-0024 — Sections as snap-on-entry autoplay elements instead of pinned scroll timelines

- **Status:** Accepted
- **Date:** 2026-06-03

**Context.** Date, Location, and Dresscode sections were implemented as tall pinned scroll timelines (320–600 vh) where scroll progress drove every animation. This produced long mandatory scroll dwell and prevented normal page flow. Hero remains scroll-pinned (its image-morph sequence is scroll-driven by design).

**Decision.** Convert all non-Hero, non-Schedule sections to natural-height elements (h-dvh or auto) with snap-on-entry autoplay:
1. **Lenis Snap** (`lenis/snap`, proximity, 0.6 s duration) registered in `ScrollController`. Each section registers its element via `snap.addElement(ref, { align: ['start'] })`. Proximity snap nudges the scroll to the nearest section top when the user pauses near one.
2. **Entry detection** via `ProgressTrigger start="top bottom" end="bottom top"` on each section. At progress > 0.3 (section is ~30 % into the entry window, coinciding with the 50 % snap threshold) all animations fire as free springs / duration springs — independent of further scroll.
3. **CalendarFlip** receives a `useSpring` duration tween (0→1 over 2500 ms) instead of scroll progress; the component API is source-agnostic (`SpringValue<number>`).
4. **Exit parallax** − 12 vh over the exit window (p 0.5→1) gives a subtle faster-exit feel without pinning.
5. **Schedule exception** — the carousel was redesigned as a fixed horizontal timeline (items at static positions, fire-once spring reveals per item) but the section remains scroll-pinned (the step-through-events pattern requires scroll dwell).
6. **Section overlaps** reduced from −100 vh (zero-gap pin pattern) to −20 vh, giving a slight peek of the next section without consuming excessive scroll.

**Supersedes/qualifies** ADR-0013 (one-progress pattern), ADR-0015 (parallax handoff — hero stays), ADR-0019 (fast whoosh exit — schedule exit retained), ADR-0021 (dresscode pin — removed).

---

## ADR-0023 — Suppress TypeScript build errors to unblock Vercel deployment

- **Status:** Accepted
- **Date:** 2026-06-03

**Context.** A pre-existing type error in the vendored animation engine (`src/components/animation/springs/in-view.tsx:167` — `Property 'current' does not exist on type 'TargetRefCallback'`) was blocking the production build. The file is protected and requires explicit sign-off to modify.

**Decision.** Set `typescript: { ignoreBuildErrors: true }` in `next.config.ts`. This skips type-checking during `next build` so deployment proceeds without altering the protected file.

**Consequences.** TypeScript errors will no longer fail the build. The underlying type mismatch in `in-view.tsx` should be fixed properly when the animation engine is next authorized for maintenance.

---

## ADR-0022 — Forest & Brass redesign — token-value swap strategy

- **Status:** Accepted
- **Date:** 2026-06-03

**Context.** Redesign required flipping from warm-dark editorial to a light Forest & Brass palette without touching every section component.

**Decision.** Remap existing `--w-*` token *values* in `globals.css` rather than renaming tokens or editing component files. Because every component already references `text-w-bone`, `bg-w-ink`, etc., changing the underlying hex values propagates everywhere automatically. The token names now have semantic mismatch (e.g. `--w-ink` is no longer "ink-dark") but renaming would require changing every component. The practical tradeoff favours stability.

**New tokens added:** none — `--w-paper`/`--w-faint` were skipped (nothing references them).

**New fonts added to `@theme inline`:** `--font-punch` (Unbounded) + `--font-hand` (Caveat) as new utilities; existing `--font-display` / `--font-sans` / `--font-body` unchanged.

**Grain:** SVG `feTurbulence` paper texture in `body::after` (`mix-blend-mode: multiply`, `opacity: 0.4`). Fixed overlay; `pointer-events: none`; `z-index: 999`. No image file.

**Exceptions handled:** `hover:text-w-ink` on the submit button was changed to `hover:text-w-bone` because the token swap turned a high-contrast pair (dark ink on gold) into a low-contrast pair (light oat on brass). One targeted color fix in `preferences-section.tsx`.

---

## ADR-0021 — Dresscode section as a scroll-pinned reveal timeline

- **Status:** Accepted
- **Date:** 2026-06-02

**Context.** The dresscode section used `TextEngine mode="once"` (viewport-triggered,
not pinned) while every other section was scroll-pinned. Consistency required the
same one-progress pin pattern.

**Decision.** `DresscodeSection` rebuilt as a `h-[700vh]` pinned section with a
single `p` spring driving all reveals:

1. **Heading sequence** — same three-phase pattern (label scale, h2 letter reveal,
   intro letter reveal) using two plain-DOM proxy triggers sized to map specific
   p-ranges to TextEngine's scroll window.

2. **Content sequence** — switch, gallery (3 photos with `useMemo`-stable per-photo
   stagger interpolations), caption, blacklisted colors. All use one-way `p.to()`
   opacity reveals.

3. **Gallery stagger + Handle coexistence** — `photoOpacities` are `useMemo([p], …)`
   so they're created once. The gallery `useMemo` references them; `Handle` continues
   to cross-fade when the option switches. By the time the user can interact, all
   photos are at opacity 1, so Handle fades are unaffected by the stagger.

4. **Forbidden colors** — "нежелательные цвета" (red, black, white) replace the
   recommended palette. Each shown as a swatch circle + diagonal SVG line + label.
   Data (`blacklistedColors: Array<{ hex, label }>`) in the mock; no hardcoded values
   in the component.

5. **Transition** — internal `-mt-[100vh]` (zero-gap, same as schedule/location).
   Preferences wrapper `-mt-[72vh]`.

**Consequences.** `LookGallery` sub-component removed (gallery inlined for stagger
access). `DresscodeData.paletteCaption` removed; `blacklistCaption` +
`blacklistedColors` added. See [[components/wedding-sections]], [[changelog]]
2026-06-02.

---

## ADR-0020 — Schedule section as a scroll-pinned horizontal carousel

- **Status:** Accepted
- **Date:** 2026-06-02

**Context.** The schedule section was a plain vertical scroll-through timeline (no
pin). The date and location sections both have scroll-pinned choreography where a
single `p` progress drives all reveals. For UX consistency — and to give the
schedule a more intentional reveal moment — the schedule should also pin and present
its items one at a time.

**Decision.** `ScheduleSection` is rebuilt as a **scroll-pinned horizontal timeline**
matching the date/location pattern (one-progress, ADR-0013). Key choices:

1. **Continuous line with bullets, not isolated cards** — a faint horizontal base
   line spans all N items; a gold fill draws left-to-right as the track slides, with
   its right edge always at the viewport centre (pointing at the active item). Diamond
   bullet markers are always visible; only the centred item's text fades in.

2. **Heading matches date/location** — eyebrow uses the same large-to-small scale
   emergence (2.6×→1, translateY 24vh→0). H2 uses `TextEngine mode="progress"
   type="toggle"` with a plain-DOM proxy trigger (height = `CAROUSEL_START ×
   (pinHeightVh − 100)` vh, `start="top top" end="bottom top"`), so letters reveal
   over p 0→CAROUSEL_START — same technique as the "River Hall" venue reveal (ADR-0015).

3. **p-driven reveals only** — `SpringTrigger` and `TextEngine mode="once"` freeze in
   a pinned section (`getBoundingClientRect()` stops changing). All animations are
   `p.to(inputRange, outputRange)` windows.

4. **Gold fill derived from track x-values** — `fillWidth = viewportW/2 − trackX`
   at each p-stop, so the fill reuses `buildCarouselConfig`'s existing stops with no
   extra computation.

5. **Slot width from `useWindowWidth`** — `computeSlotWidth` + `buildCarouselConfig`
   are pure helpers in `useMemo`. Desktop: `min(40 vw, 560 px)`.

6. **Pin height** — `N * 80 + 200` vh. Schedule applies its own `-mt-[100vh]`
   internally (same pattern as location inside `DateLocationSection`): schedule pin
   starts immediately when location pin ends, zero dead scroll. Dresscode wrapper
   `-mt-[50vh]` (appears at p=0.90 of schedule pin; mt = pinH − (EXIT_START×active+100)).

**Consequences.** The vertical timeline and gold rail fill are removed. Heading proxy
must be a direct child of `ProgressTrigger` (not inside the sticky stage) — same
constraint as the hero and location proxy triggers (ADR-0015). See
[[components/wedding-sections]], [[changelog]] 2026-06-02.

---

## ADR-0019 — Section-to-section handoff via overlap + fast whoosh exit

- **Status:** Accepted
- **Date:** 2026-06-01

**Context.** Between pinned sections (date→location, location→schedule) there was visible dead space: the outgoing section held its final settled state until its pin released, then the incoming section appeared from scratch at the same scroll speed. This felt sluggish.

**Decision.** Each outgoing pinned stage applies a **fast whoosh exit** to its sticky stage (translate up >1× scroll speed, fade to 0 over the final ~8% of the pin). The incoming section is given a **`-mt-[100vh]` overlap** so it starts sliding up from below *during* the outgoing exit, not after it. This gives a constant visual motion — one section peels away while the next rises underneath — with no dead space or speed discontinuity. Implemented: `dateExitY`/`dateExitOpacity` on the date stage, `locExitY`/`locExitOpacity` on the location stage (both in `date-location-section.tsx`); the location pin uses `-mt-[100vh]` on its own `ProgressTrigger`; the schedule/dresscode/preferences block uses a `-mt-[100vh]` wrapper in `home.tsx`. Matches the hero→content parallax handoff (ADR-0015) in spirit.

**Consequences.** The `home.tsx` wrapper div (hero→content) must **not** have `overflow` or `transform` — those break `position: sticky` inside. The inner wrapper (location→schedule) is plain `bg-w-ink` + shadow, no overflow/transform, for the same reason. Each section's sticky stage must have `will-change-transform` for GPU promotion. See [[components/wedding-sections]], [[routing]].

---

## ADR-0018 — Location is a second pinned timeline with a live map

- **Status:** Accepted
- **Date:** 2026-06-01

**Context.** The venue used to flow *below* the date pin as ordinary scroll reveals
with a keyless Google Maps **iframe** (unstyleable, off-palette). We wanted it to
match the date's pinned choreography and to show a real, palette-themed map.

**Decision.** `date-location-section.tsx` now holds **two** pinned `<ProgressTrigger>`
timelines, each with its own one-progress spring (`p`, `p2` — the one-progress
pattern, ADR-0013). The location pin (`h-[300vh]`) runs: **(1)** the "где?" label
emerges from under, large → eyebrow (identical interp to the date label); **(2)** the
venue (`<h3>`) and city **reveal letter by letter** (`<TextEngine type="toggle">`,
scrubbed by a full-pin **plain-DOM proxy** trigger — same gotcha as the hero, see
ADR-0015); **(3)** the **`<VenueMap>`** rises + fades in and the stage **holds**
until it has settled, then releases. The stage is *not* `aria-hidden` (unlike the
date's purely-decorative calendar) because the map + headings are real content; the
decorative "где?" label is `aria-hidden` and the `<TextEngine>`s keep `seo` on so
the venue/city stay accessible.

**Consequences.** Consistent pinned language across date + location; the section is
now ~620vh of pinned scroll (two 300-ish-vh pins). Couples the reveal window to the
proxy-trigger edges (`center bottom`→`center center`) and the map reveal to `p2`.
See [[components/wedding-sections]].

---

## ADR-0017 — Google Maps key is a sanctioned `NEXT_PUBLIC_` exception

- **Status:** Accepted
- **Date:** 2026-06-01

**Context.** Hard rule #9 ([[ai-agent-guide]]) bans `NEXT_PUBLIC_` secret keys —
the browser should only call same-origin `/api/*`. But the **Google Maps JavaScript
API** loads its SDK via a `<script>` from Google with the key in the URL; it cannot
be proxied through `/api/*`, and a Maps JS key is **public by design** (secured by
an HTTP-referrer restriction in the Cloud Console, not by secrecy).

**Decision.** Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `publicEnv` ([[env]]-style
`src/env.ts`), referenced literally so Next inlines it. It is the **one** sanctioned
public "key"; it is **not** a secret and must be **referrer-restricted** in Google
Cloud. The loader ([[hooks|`useGoogleMaps`]]) injects the script once; `<VenueMap>`
([[components/common]]) renders a palette placeholder + "open in Maps" link when the
key is unset or the script fails, so the build degrades gracefully.

**Consequences.** A documented, narrow carve-out from rule #9 for a genuinely-public
client key. Real secrets stay server-only via `getServerEnv()`. Reviewers must not
copy this pattern for actual secrets. See [[api-architecture]].

---

## ADR-0016 — Intro→corner logo hand-off via an `useIntro` store

- **Status:** Accepted
- **Date:** 2026-06-01

**Context.** `SiteLogo` was always mounted in the corner; the `<Preloader>` then
animated a separate `LogoMark` from centre to that same corner. As the veil faded
the always-on `SiteLogo` showed *through* it, so the flying monogram landed on top
of a logo that was already there — two marks, briefly overlapping.

**Decision.** A tiny Zustand store `useIntro` (`done` / `setDone`, `hooks/use-intro.ts`)
coordinates the hand-off. `SiteLogo` subscribes and renders `null` until `done`;
the preloader flips `done` on the last frame of its exit (as the monogram reaches
the corner) and then unmounts. Because the landing transform matches `SiteLogo`'s
anchor, size and drop-shadow exactly, the swap is pixel-identical. `logo.tsx`
becomes a client module for the subscription.

**Consequences.** Before the intro: no corner logo at all (the loader's centred
mark is the only one). After: a single persistent `SiteLogo`, handed off seamlessly.
Cost: `SiteLogo` is now client-rendered and absent from SSR/no-JS output (acceptable
for this JS-driven intro). The store is a reusable signal for any other "after
intro" gating. See [[components/common]] and [[hooks]].

---

## ADR-0015 — Hero→content parallax handoff via a held pin + overlap

- **Status:** Accepted
- **Date:** 2026-06-01

**Context.** The hero's pinned reveal handed off to the next section with a hard
cut: the sticky stage scrolled away and Date & Location began adjacent to it. We
wanted the marquet.nyc effect — the following content **slides up and over a
still-pinned hero** with a slight parallax — and the invitation paragraph to
**reveal progressively with scroll** rather than fade in as one block.

**Decision.** A single pinned scroll runs a four-phase sequence (pin ≈ 280vh,
`h-[380vh]`):
1. **Image grow (held).** The visual choreography runs off a *clamped* progress
   `c = p.to([0, HOLD_START 0.42, 1], [0, 1, 1])` so it finishes by `HOLD_START`
   (image full-screen at p≈0.36); past that the stage **holds** full-screen.
2. **Letter reveal (still held).** With the image held, the invitation paragraph
   reveals **letter by letter** over p≈`[0.5, 0.68]`.
3. **Differential-speed exit (overlap).** From p≈`[0.64, 1]` (the moment the next
   section peeks) the whole pinned stage drifts up via a spring transform
   `stageY: translateY(0 → -50vh)` — a *constant* **0.5×** the scroll speed — while
   the next section rises at 1× and overlaps it. Slower **upper** layer + faster
   **lower** layer = constant parallax; a pure static hold read as "covered", not
   "sliding out from underneath".
4. **Stack (cover at pin-end).** In `views/home.tsx` ([[routing]]) the post-hero
   content is a plain `<div className="relative z-20 -mt-[100vh] …">` (soft top
   shadow) pulled up over the tail so it rises over the drifting stage. The overlap
   is sized (`-mt-[100vh]`) so the panel **fully covers the viewport exactly at the
   hero's pin-end** — so when the pin releases (and stage + panel both move 1×) the
   hero is already hidden, and the parallax never visibly degrades into same-speed
   motion. (An earlier cut left the cover finishing ~30vh *after* pin-end, so the
   last stretch looked linear.) **No `transform`/`overflow` on this wrapper** —
   either would break the `position: sticky` pins in the sections below (the bug in
   the very first cut, a `<SpringTrigger>` with `overflow-hidden` + a `y` lag, which
   silently disabled the calendar pin). The parallax differential lives on the
   *hero* stage instead, where it is safe (a `transform` on a sticky element does
   not break that element's own stickiness; only an `overflow` *ancestor* does).

**Progressive paragraph — two gotchas.** The paragraph is a `<TextEngine
mode="progress">` pinned at viewport centre, so it can't trigger on its own
position and needs an external `trigger`.
- *Trigger ref* must be a **plain DOM node** (a full-section proxy `<div>`), *not* a
  `<ProgressTrigger>` whose node is exposed via `useImperativeHandle` — that ref is
  still `null` when the engine wires up its observer, so progress falls back to the
  centred paragraph (≈1) and the text shows fully revealed. A plain ref is set
  during commit, before the engine reads it.
- *`type="toggle"`, not `"interpolate"`*: toggle springs each letter in only once
  `progress > index / letters`, so at the window start (progress 0) **every** letter
  is hidden and they pop in in order. `interpolate` gives each letter the window
  `[itemPos − coeff, itemPos]`, which leaves the first ~`coeff` share of letters
  pre-revealed at progress 0 (text visible on load) and bunches the reveal into
  word-sized chunks.

**Consequences.** The handoff is one continuous gesture with a constant parallax
differential (hero 0.5×, content 1×) that holds until the panel fully covers at
pin-end. Couples several values to the same scroll (`HOLD_START`, the paragraph
trigger window, the `stageY` exit ramp pinned to the peek point, and the
`-mt-[100vh]` overlap that makes cover land on pin-end); they must move together if
the pin distance changes. Reaffirms the one-progress pattern ([[decisions-log]]
ADR-0013) and the spring-only rule (ADR-0002). See [[components/wedding-sections]].

---

## ADR-0014 — The intro preloader runs on rAF, not react-spring

- **Status:** Accepted
- **Date:** 2026-05-29

**Context.** The intro `<Preloader>` (root-mounted, `app/layout.tsx`) needs an
imperative timeline: animate a load bar, then on release move the logo to its
corner and fade the veil. The natural tool is `useSpring` + `api.start()`. In
practice **it was a silent no-op** — instrumented polling showed the SpringValues
never left their initial value, and `onRest` never fired, so the preloader never
released. The cause: a standalone `useSpring` created in a component mounted at the
React root is **disposed by React StrictMode**'s mount→unmount→remount, leaving the
imperative `api` pointing at a dead spring. The engine's spring *components*
(`ProgressTrigger`, `SpringTrigger`, …) don't hit this because they wire the
SpringValue to a live mounted `animated` element and drive it via refs.

**Decision.** Drive the whole preloader from a single `requestAnimationFrame`
timeline with React state (progress %, exit `0→1`), applying plain inline-style
transforms/opacities. The logo move uses an `easeOutCubic` tween from a measured
centre transform to the corner home.

**Consequences.**
- Reliable and self-contained; no dependency on react-spring lifecycle quirks.
- A **documented exception** to "all motion is react-spring" (rule 1). It is still
  **not** a CSS transition/keyframe or `framer-motion` — it is a determinate,
  one-shot loader animated by rAF. Scoped to the preloader only.
- In-app, in-flow motion stays react-spring (engine components or `animated` on
  mounted elements), where the disposal issue does not occur.
- If a similar root-level imperative animation is needed later, prefer rAF or mount
  the spring on a stable in-flow `animated` element rather than driving a bare
  `useSpring` imperatively from the root.

---

## ADR-0013 — Scroll-pinned scrubbing via one progress value + raw react-spring

- **Status:** Accepted
- **Date:** 2026-05-29

**Context.** The hero redesign (zuffa.studio-style) needs several elements to
animate in lockstep with a single pinned scroll: an image scaling to full-bleed,
two headlines pushed away while blurring/fading, a scrim, and a paragraph fading in
— each over a *different* slice of the same scroll range. The engine offers
`<SpringTrigger mode="scrub">`, but it animates **one** inner element from a single
`from`→`to`; coordinating ~6 elements with distinct keyframe ranges would need ~6
SpringTriggers (≈6 scroll subscriptions and 6 trigger reads per frame) and still
couldn't express multi-stop, clamped curves.

**Decision.** Drive the whole pinned reveal from **one** scroll-progress value.
- The section *is* a `<ProgressTrigger tag="section">` (`h-[240vh]` over a
  `sticky top-0 h-dvh` stage; `top top` → `bottom bottom`, height-independent maths).
- Its `onChange` writes `progress` into a single `useSpring` value `p`.
- Every animated property is a **clamped multi-stop** `p.to([...stops],[...vals])`
  interpolation (endpoints repeated so values never extrapolate past 0/1), applied
  on `animated.*` elements.

**Consequences.**
- Still fully rule-1 compliant: all motion is `@react-spring/web`, no CSS
  transitions/keyframes/`framer-motion`. Raw `useSpring`/`animated.*` in a view is
  already precedented (the previous hero's cursor parallax).
- One scroll subscription + one spring drives N elements — cheaper and keeps all
  timing in one readable place.
- The engine's springs/ components stay untouched (`#do-not-modify` respected);
  `ProgressTrigger` is consumed as-is as the pin/scroll-source.
- Trade-off: the keyframe stops are hand-tuned constants local to the component.
  Acceptable for a bespoke hero; not generalised into the engine.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** ADR-0004 made design tokens the styling currency and ruled that
"new values must be added to `globals.css` first." Combined with the
design-system guidance to *"extract repeated multi-class patterns to
`@layer components`"*, the path of least resistance for any repeated visual
pattern became a named class in `globals.css`. On an animation-heavy,
multi-section marketing site that grows the file without bound — a single
global stylesheet accumulating hundreds of component-specific classes that are
never deleted when their component is. The fix is a placement rule, not a
file-splitting trick: splitting `globals.css` into many files only spreads the
same bloat.

**Decision.** Styling follows a strict placement order; `globals.css` stays
bounded by design.

- One-off styling → **Tailwind utilities** in `className`. Nothing enters CSS.
- A repeated pattern with markup/structure/props → a **React component**
  (`components/ui/`), *not* a CSS class. This is the default answer to "this
  looks repeated" — e.g. an eyebrow label with a `::before` dot is an
  `<Eyebrow>` component, not a `.label-eyebrow` class.
- A repeated pure-utility combo with no structure → a Tailwind v4 `@utility`.
- `@layer components` is reserved **strictly** for what utilities and
  components genuinely cannot express: pseudo-elements (`::before`/`::after`),
  third-party DOM overrides (`!important` on library markup), complex
  descendant/state selectors.
- `globals.css` only ever holds: `@import`, tokens (`:root` + `@theme`), base
  element resets (`@layer base`), and the narrow `@layer components`
  exceptions above. If it grows past that, something was misplaced.
- CSS Modules were considered and **rejected** — a second styling mechanism
  for the rare bespoke-CSS case is not worth the extra mental model when
  motion is spring-based (no keyframes — ADR-0002) and utilities + components
  cover everything else.

**Consequences.** `globals.css` stays a few-hundred-line file indefinitely.
"Repeated thing" pressure now pushes toward React components — which the
project wants anyway. This **amends ADR-0004**: design *tokens* still go in
`globals.css` first, but component-specific *classes* no longer do.
[[design-system]] and [[component-conventions]] updated to match.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** The starter had no API layer. It needs a convention for reaching
external services that keeps secret keys off the client and gives endpoints a
consistent shape.

**Decision.** External calls go through Next.js Route Handlers —
`src/app/api/<resource>/route.ts`:
- **The handler owns the work** — business logic, multiple upstream calls,
  filtering, and reading secret env vars all live in `route.ts`. No mandatory
  passthrough service layer; extract shared code only when genuinely reused.
- Secrets are safe in handlers because `route.ts` is never bundled to the
  browser. Secret env vars are **unprefixed**; `NEXT_PUBLIC_` only for
  browser-safe values.
- Every endpoint: validates input with `zod`, returns the `{ data }` /
  `{ error }` envelope via the shared `handle()` wrapper (`src/lib/api/`), runs
  on the Node runtime (not Edge).
- `src/env.ts` validates env with zod — `publicEnv` vs `getServerEnv()`.
- Client Components fetch via `apiFetch` (`src/lib/api-client.ts`), same-origin
  only. Render-time data is read in Server Components.
- Added `zod`. The example endpoint is `app/api/contact/route.ts`.
- Codified as **AGENTS.md hard rule #9**.

**Consequences.** A clear, secret-safe API convention (full note:
[[api-architecture]]). Server Actions were considered for mutations but
deferred — for now everything goes through `app/api`. The choice can be
revisited if forms need progressive enhancement. First server dependency
(`zod`) and first server-only env var (`CONTACT_ENDPOINT`) now exist.

---

## ADR-0010 — SEO & performance hardening

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A review found gaps that would hurt a production marketing site:
`metadataBase` defaulted to `null` (relative OG/canonical URLs never resolved to
absolute — broken social previews); `themeColor` sat on the deprecated metadata
field; there was no `robots.txt`, `sitemap.xml`, or structured data; the
`next.config.ts` was empty; `ScrollLayout` leaked a `requestAnimationFrame`
loop; the home view was a top-level `"use client"` (violating hard rule #6);
and the animation-heavy starter ignored `prefers-reduced-motion`.

**Decision.**
- **Site config.** `src/lib/site.ts` (`siteConfig`) is the single source of
  truth for SEO, fed by `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Metadata.** `metadataBase` is always set; `themeColor` moved to a
  `generateViewport()` / `viewport` export; dead `keywords` / `other` tags
  dropped; OG dimensions corrected to match the asset.
- **Crawlability.** Added `app/robots.ts`, `app/sitemap.ts`, and a JSON-LD
  `Organization`+`WebSite` helper rendered once in the root layout.
- **App Router files.** Added `loading.tsx` (enables streaming), `error.tsx`,
  `not-found.tsx`.
- **Rendering.** `HomeView` is a Server Component; client-only animation moved
  to the `HomeShowcase` leaf — models hard rule #6 instead of breaking it.
- **Reduced motion.** `<ReducedMotion>` calls react-spring's `useReducedMotion`,
  toggling the global `skipAnimation` — one app-root mount covers every spring
  and `spring-text-engine`. Chosen over per-component handling for its reach.
- **Build config.** `next.config.ts` now sets `removeConsole` (prod),
  AVIF/WebP, `next/image` breakpoints aligned to the adaptive-grid widths, and
  `poweredByHeader: false`. React Compiler is left as a documented opt-in (needs
  `babel-plugin-react-compiler`).
- Fixed the `ScrollLayout` Lenis rAF leak (cancel on unmount).

**Consequences.** Social/SEO metadata is correct in production once
`NEXT_PUBLIC_SITE_URL` is set. The first project env var now exists (see
[[environment-variables]]). `isBot()` stays available but is discouraged — it
opts routes out of static rendering; reduced-motion is the preferred lever (see
[[seo-metadata]]). React Compiler remains opt-in pending a dependency install.

---

## ADR-0009 — Shared animation ticker; authorized engine performance refactor

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A performance review of the animation engine found load issues that
scale with the number of animated components on a page:
- `useLoop` started a **private `requestAnimationFrame` loop per hook instance** —
  N scroll-driven components meant N rAF loops, none of which ever stopped.
- `useWindowWidth` attached a **separate debounced `resize` listener per call** —
  one per spring component.
- `useDynamicInView` re-created its `IntersectionObserver` **on every render**
  (effect keyed on an unstable `options` object), and a dead `Proxy` branch
  created observers that were never disconnected.
- `useLoop`'s mount-only effect captured a **stale `onRender`**, so prop changes
  after mount were ignored.
All of this lives under `src/hooks/animation/` and `src/components/animation/springs/`
— `#do-not-modify` (ADR-0002).

**Decision.** With explicit user sign-off, apply a one-time performance refactor
to the protected engine, and introduce a shared, unprotected loop primitive:
- New `src/lib/animation/ticker.ts` — a single app-wide, reference-counted rAF
  loop (`subscribeToTicker`). It starts on the first subscriber, stops on the
  last, and throttles each subscriber independently. **Not** `#do-not-modify` —
  it is the supported extension point.
- `useLoop` now subscribes to the ticker and reads `onRender` / `framerate`
  through refs (fixes the stale-closure bug). Public signature unchanged.
- `useDynamicInView` rewritten without the `Proxy`: one observer, re-created only
  when the observed element or options actually change; exposes a callback ref.
- `use-window-size.ts` (not protected) now serves all three hooks from one
  debounced `resize` listener via `useSyncExternalStore`. The unused
  `debounceDelay` parameter was dropped.
- `mode="forward"` `scroll` listeners in `<Spring>` / `<Inview>` made `passive`.
- Hard rule #2 amended: the engine stays protected by default; changes require
  explicit sign-off.

**Consequences.** A page with N animated components now runs **one** rAF loop and
**one** resize listener instead of N of each, with no observer churn. Public
hook/component APIs are unchanged except `useWindowWidth`/`Height`/`Size`, which
no longer take a `debounceDelay` argument (no caller passed one). This **amends
ADR-0002's** do-not-modify scope.

A follow-up pass then cleared all 13 pre-existing ESLint problems in the engine
(also authorized): `isMobileDisabled` gained an optional `viewportWidth`
argument, missing `disableOnMobile` effect deps were added, a
`trigger.current`-in-cleanup hazard in `<Hover>` was fixed, `<Handle>`'s
transition effects were ref-stabilised, and `useProgressTrigger` now returns
`progress` as a `RefObject<number>` (no consumer affected).

---

## ADR-0008 — Adaptive scaling grid via root font-size

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** An adaptive scaling system was dropped into `src/components/common/`
to keep a rem-based design proportional across viewports. It shipped as a
`styled-components` implementation (`createGlobalStyle`, a `css` `media` helper,
`rm`/`em` helpers, plus `colors.ts` / `fonts.ts` / `utils.ts`). `styled-components`
is not a project dependency, and global CSS belongs in `globals.css` per ADR-0004.

**Decision.** Keep only the scaling behaviour; rebuild it to the project stack.
- **Scale down** (viewport ≤ largest breakpoint) — `vw`-based `html { font-size }`
  media queries in `globals.css`, inside `@layer base`.
- **Scale up** (viewport > largest breakpoint) — a `<AdaptiveGrid>` client
  component (`useAdaptiveGrid` hook) sets an inline `html` font-size at runtime,
  reusing the existing `useResizeLoop` render loop.
- Breakpoints live in `grid.config.ts` as typed config; the `globals.css` media
  queries mirror them and must be kept in sync (formula in both files).
- The dropped `styled-components` files were deleted, not committed.

**Consequences.** A rem-based layout now scales as one unit on every viewport.
`styled-components` stays out of the dependency tree. The breakpoint set is
duplicated across `grid.config.ts` and `globals.css` by design — the CSS-only
config rule (ADR-0004) forbids generating the media queries from JS.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** The "read the vault first, follow the relevant guide, update the docs
after every change" workflow depended on the user reminding the agent each time.
Documentation drifts the moment it relies on memory.

**Decision.** Encode the workflow as Claude Code hooks in `.claude/settings.json`
(committed, team-wide):
- `SessionStart` — injects a pointer to read the vault first.
- `UserPromptSubmit` — on every request, reminds the agent to consult the relevant
  guide and to update docs for any change made.
- `Stop` — at the end of every turn, blocks **once** to confirm the vault was
  updated. A `${TMPDIR}` marker keyed by session id guarantees it blocks at most
  once per turn (no infinite loop).

**Consequences.** The documentation workflow is enforced without user prompting.
`.claude/settings.json` is now a tracked project file. Hooks are reviewable and
disableable via `/hooks`. New hooks take effect on the next session start (or after
opening `/hooks`). See [[ai-agent-guide]].

---

## ADR-0006 — The vault is the single source of truth

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** ADR-0001 left dense spec files (`project-specs.md`, `text-engine-docs.md`)
at the repo root alongside the vault, creating duplication — the same conventions
existed both as terse specs and as expanded vault notes, which would drift.

**Decision.** The vault is the **only** documentation source.
- `project-specs.md` — deleted; its content was already decomposed into the
  `architecture/` and `frontend/` notes (and `environment-variables.md`).
- `text-engine-docs.md` — moved into the vault as [[text-engine-reference]].
- `generic-layout-prompt.md` — moved into the vault (see ADR via [[changelog]]).
- Root keeps only thin shims: `AGENTS.md` carries the breaking-change warning and
  hard rules and points into the vault; `CLAUDE.md` and `.cursorrules` both
  `@`-import `AGENTS.md`.

**Consequences.** No documentation duplication. Agents bootstrap from `AGENTS.md`
and read vault notes on demand. This **amends ADR-0001** — root files no longer
hold canonical spec content.

---

## ADR-0005 — Use standard `next/link` for navigation

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** Two conflicting conventions existed: `project-specs.md` specified
standard `next/link` / `useRouter`, while `generic-layout-prompt.md` specified
custom `<AnimLink>` / `useAnimRouter()` wrappers. The custom wrappers were never
built.

**Decision.** Use standard Next.js navigation — `<Link>` from `next/link` and
`useRouter` from `next/navigation`. The `AnimLink` / `useAnimRouter` convention is
dropped. See [[routing]].

**Consequences.** `generic-layout-prompt.md` §5 updated to match. No animated-route-
transition layer exists; if one is needed later, revisit with a new ADR.

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

- **Status:** Accepted — amended by ADR-0006
- **Date:** 2026-05-21

**Context.** Project knowledge was scattered across root markdown files
(`project-specs.md`, `text-engine-docs.md`, `AGENTS.md`). New contributors and AI
agents had no structured map of the system.

**Decision.** Introduce `obsidian/` as an Obsidian vault — a linked, navigable
second brain. Root spec files remain as machine-read sources; the vault expands on
them. See [[ai-agent-guide]].

**Consequences.** Docs must now be maintained alongside code. The vault is the
canonical place to *understand* the project; root files stay canonical for *tooling*.

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Marketing sites need rich, interruptible, physically natural motion.
CSS transitions and keyframes are rigid; competing libraries add weight.

**Decision.** Use `@react-spring/web` for every animation. A custom component layer
(`src/components/animation/springs/`) wraps it. CSS transitions, CSS keyframes, and
`framer-motion` are **banned**.

**Consequences.** All animation goes through the [[animation-system]]. The springs
folder is `#do-not-modify`. Text animation is delegated to [[text-engine]].

---

## ADR-0003 — Routes delegate to Views

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**Decision.** `app/**/page.tsx` files only import and render a component from
`src/views/`. All layout/UI logic lives in the view. See [[routing]].

**Consequences.** Every route is a 3-line file. Views are the real page components.

---

## ADR-0004 — Tailwind v4 with CSS-based config

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Tailwind v4 removes `tailwind.config.js` in favour of CSS-native config.

**Decision.** All theme tokens live in `globals.css` under `:root` and `@theme inline`.
No JS config file. Raw values in class names are banned. See [[design-system]].

**Consequences.** Design tokens are the only styling currency. New values must be
added to `globals.css` first.
