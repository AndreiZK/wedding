"use client";

import { useCallback, useRef } from "react";
import { animated, easings, useSpring } from "@react-spring/web";
import Image from "next/image";
import TextEngine from "spring-text-engine";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { useWindowSize } from "@/hooks/use-window-size";
import type { HeroData } from "@/data/mocks/hero";

export interface HeroSectionProps {
  data: HeroData;
}

/** Width of the initial image as a fraction of the viewport's short edge. */
const SQUARE_FRAC = 0.6;

/**
 * On desktop the initial image is a **landscape** crop — its height is this
 * fraction of its width — so the headline block clears the top of the viewport
 * (a full square left too little room above; see the headline anchors below).
 * Mobile keeps the 1:1 square (it was never cramped).
 */
const DESKTOP_HEIGHT_FRAC = 0.5;

/**
 * Vertical offset (in vh) that shifts the entire hero composition upward.
 * The image position moves up by this amount; its full-screen height is expanded
 * by 2× the offset in pixels so the bottom edge still lands exactly at the viewport
 * floor (top edge bleeds above the stage and is clipped by overflow-hidden).
 */
const CONTENT_OFFSET_VH = 4;

/** Gap between the image edge and the nearest headline, in vh. */
const GAP_VH = 4;

/**
 * Scroll fraction at which the visual choreography finishes. After this point the
 * pinned stage simply **holds** full-screen, leaving a tail of scroll over which
 * the next section slides up and over it (the parallax handoff in `home.tsx`).
 */
const HOLD_START = 0.42;

/** Subtle warm-brass glow centred just below the midpoint — adds depth to the oat bg. */
const STAGE_BG =
  "radial-gradient(60% 50% at 50% 58%, color-mix(in srgb, var(--w-gold) 10%, transparent), transparent 80%)";

/** Clipped line-reveal for the punch headlines on mount. */
const LINE_REVEAL = {
  seo: false,
  mode: "once",
  overflow: true,
  lineIn: { y: "0%" },
  lineOut: { y: "110%" },
  lineConfig: { duration: 1000, easing: easings.easeOutCubic },
} as const;

/**
 * Word-fade reveal for the handwriting bottom line. No overflow mask — Caveat's
 * glyphs slightly overhang their advance boxes and a wrapLine overflow:hidden
 * would clip the last letter. A staggered word-fade suits the softer aesthetic.
 */
const HAND_REVEAL = {
  seo: false,
  mode: "once",
  wordIn: { opacity: 1, y: "0%" },
  wordOut: { opacity: 0, y: "30%" },
  wordStagger: 120,
  wordConfig: { tension: 180, friction: 28 },
} as const;

/**
 * Shared classes for the two-line Unbounded punch headline.
 *
 * The `md:` size is `4rem` (not `5rem`): the desktop root font-size is scaled up
 * ~1.25× by the adaptive grid (globals.css) so body text reads at a desktop size,
 * and `4rem × 1.25 = 5rem`-equivalent px keeps the hero headline at its designed
 * size — the fit math (image height vs. headline block) stays stable. Mobile is
 * untouched. See [[design-system]] / ADR-0033.
 */
const PUNCH_CLASS =
  "flex flex-wrap font-punch text-[2.25rem] font-extrabold leading-[0.9] tracking-tight uppercase py-[0.06em] md:text-[4rem]";

/**
 * Invitation paragraph — letters reveal **one by one**, scrubbed by the hero's own
 * scroll. The scroll reference is a full-section **proxy element** (the paragraph
 * itself is pinned at viewport centre, so it can't trigger on its own position;
 * the proxy is a plain DOM node so its ref is set before the engine wires up — a
 * `useImperativeHandle` ref like `<ProgressTrigger>`'s is still null at that point).
 *
 * `type="toggle"` (not `"interpolate"`): each letter springs in only once scroll
 * progress passes its index threshold (`progress > index / letters`), so at the
 * window start (progress 0) **every** letter is hidden and they then pop in in
 * order. `interpolate` instead pre-reveals the first ~`coefficient` share of
 * letters at progress 0 (window `[itemPos − coeff, itemPos]`), which left the text
 * visible on load and bunched the reveal into word-sized chunks.
 *
 * The window (`center center` → `center top`) opens once the image is full-screen
 * and closes just before the next section slides over the held stage.
 */
const PARA_REVEAL = {
  mode: "progress",
  type: "toggle",
  start: "center center",
  end: "center top",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
} as const;

/**
 * Scroll-pinned hero. A tall section pins a full-screen stage; one scroll-progress
 * value drives a staged sequence: (1) a small **square** image grows until it fits
 * the viewport's shape, pushing the headlines away (up / down) as they blur and
 * fade; (2) with the image held full-screen, the invitation paragraph reveals
 * **letter by letter**; (3) once it is fully visible the stage keeps holding while
 * the next section slides up over it (handoff in `home.tsx`). All motion is
 * react-spring — the choreography (1) runs off a clamped `c`, the reveal (2) off
 * the same scroll via the paragraph's own progress trigger.
 */
export const HeroSection = ({ data }: HeroSectionProps) => {
  const { width: vw, height: vh } = useWindowSize();
  // Full-section proxy node used as the scroll reference for the pinned
  // paragraph's reveal. Plain DOM ref so it is set before the engine reads it.
  const paraTriggerRef = useRef<HTMLDivElement>(null);
  // Initial image dims; the box morphs from here to the full viewport, so its
  // aspect ratio interpolates from the initial crop to the screen's shape.
  const side = Math.min(vw, vh) * SQUARE_FRAC; // initial width (unchanged)
  // Initial height: shorter than the width on desktop, square on mobile.
  const initialH = vw >= 768 ? side * DESKTOP_HEIGHT_FRAC : side;
  // Pixel equivalent of CONTENT_OFFSET_VH — used to position the image above
  // the true viewport centre and to over-extend its full-screen height so the
  // bottom edge still lands exactly at the viewport floor.
  const offsetPx = (vh * CONTENT_OFFSET_VH) / 100;

  const [{ p }, api] = useSpring(() => ({
    p: 0,
    config: { tension: 320, friction: 42 },
  }));

  const handleProgress = useCallback(
    ({ progress }: { progress: number; interpolatedProgress: number }) => {
      api.start({ p: progress });
    },
    [api],
  );

  // Choreography progress: the visible motion plays out over `[0, HOLD_START]`,
  // then holds at 1 for the tail while the next section slides over the stage.
  const c = p.to([0, HOLD_START, 1], [0, 1, 1]);

  // Image: square → full viewport (width & height animate independently so the
  // shape morphs), corners sharpen as it fills.
  // Height overshoots by 2×offsetPx: with the image centred at (50%−offsetPx),
  // adding 2×offset to the target height ensures the bottom edge lands at exactly
  // vh (top bleeds above the stage and is clipped by overflow-hidden on the stage).
  const imageWidth = c.to([0, 0.85, 1], [side, vw, vw]).to((v) => `${v}px`);
  const imageHeight = c
    .to([0, 0.85, 1], [initialH, vh + 2 * offsetPx, vh + 2 * offsetPx])
    .to((v) => `${v}px`);
  const imageRadius = c.to([0, 0.85, 1], [28, 0, 0]).to((v) => `${v}px`);

  // Headlines: pushed away from centre, blurring and fading out early.
  const topY = c.to([0, 0.6, 1], [0, -38, -38]).to((v) => `translateY(${v}vh)`);
  const bottomY = c.to([0, 0.6, 1], [0, 38, 38]).to((v) => `translateY(${v}vh)`);
  const headlineOpacity = c.to([0, 0.42, 1], [1, 0, 0]);
  const headlineBlur = c.to([0, 0.5, 1], [0, 10, 10]).to((v) => `blur(${v}px)`);

  // Scrim: darkens the full image so the light paragraph stays legible.
  const scrimOpacity = c.to([0, 0.5, 0.92, 1], [0, 0, 0.5, 0.5]);

  // Exit parallax: once the next section starts overlapping (p≈0.64, when it peeks
  // via `-mt-[100vh]` in home.tsx), the whole pinned stage drifts up at a *constant*
  // 0.5× the scroll speed (−50vh over the 100vh overlap) while that section rises at
  // 1×. Slower upper layer + faster lower layer = constant parallax. The ramp runs
  // to pin-end, where the section has fully covered the viewport — so there is no
  // linear (same-speed) tail once the pin releases.
  const stageY = p
    .to([0, 0.643, 1], [0, 0, -50])
    .to((v) => `translateY(${v}vh)`);

  return (
    <ProgressTrigger
      tag="section"
      start="top top"
      end="bottom bottom"
      onChange={handleProgress}
      aria-label="Свадебное приглашение"
      className="relative h-[380vh] w-full bg-w-ink"
    >
      {/* Scroll reference for the paragraph reveal — spans the full pinned scroll */}
      <div
        ref={paraTriggerRef}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      {/* Pinned full-screen stage — drifts up slowly on exit for the overlap */}
      <animated.div
        style={{ transform: stageY }}
        className="sticky top-0 h-dvh w-full overflow-hidden bg-w-ink will-change-transform"
      >
        {/* Real heading for assistive tech & crawlers; visible headlines are decorative. */}
        <h1 className="sr-only">{data.heading}</h1>

        {/* Palette gradient backdrop */}
        <span
          style={{ backgroundImage: STAGE_BG }}
          className="absolute inset-0 z-0"
          aria-hidden="true"
        />

        {/* Image — square at rest, grows to fill the viewport.
            Positioned at (50% − CONTENT_OFFSET_VH vh) so the composition sits
            slightly above centre; translate(-50%,-50%) centres on that point. */}
        <animated.div
          style={{
            width: imageWidth,
            height: imageHeight,
            borderRadius: imageRadius,
            top: `calc(50% - ${CONTENT_OFFSET_VH}vh)`,
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          className="absolute z-10 overflow-hidden"
        >
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            sizes="100vw"
            className="object-cover brightness-[0.92]"
            priority
          />
        </animated.div>

        {/* Scrim — fades in with the paragraph for legibility */}
        <animated.span
          style={{ opacity: scrimOpacity }}
          className="absolute inset-0 z-20 bg-w-ink"
          aria-hidden="true"
        />

        {/* Top headlines — bottom edge anchored above the image square.
            bottom = 50% + offset + half-side + gap, so it tracks the image
            top edge exactly regardless of how tall the headline block is. */}
        <animated.div
          style={{
            transform: topY,
            opacity: headlineOpacity,
            filter: headlineBlur,
            bottom: `calc(50% + ${CONTENT_OFFSET_VH}vh + ${initialH / 2}px + ${GAP_VH}vh)`,
          }}
          className="absolute left-0 right-0 z-30 px-6"
          aria-hidden="true"
        >
          {/* Handwritten kicker — Caveat, slightly tilted, muted */}
          <p
            className="mb-1 inline-block -rotate-2 font-hand text-2xl text-w-muted md:text-[1.5rem]"
            aria-hidden="true"
          >
            {data.kicker}
          </p>
          {/* "МЫ" — bone (first word of topText) */}
          <TextEngine
            tag="div"
            {...LINE_REVEAL}
            delayIn={200}
            className={`${PUNCH_CLASS} text-w-bone`}
          >
            {data.topText.split(" ")[0]}
          </TextEngine>
          {/* "ЖЕНИМСЯ!" — gold (remaining words) */}
          <TextEngine
            tag="div"
            {...LINE_REVEAL}
            delayIn={360}
            className={`${PUNCH_CLASS} text-w-gold`}
          >
            {data.topText.split(" ").slice(1).join(" ")}
          </TextEngine>
        </animated.div>

        {/* Bottom headline — top edge anchored below the image square.
            top = 50% − offset + half-side + gap, tracking the image bottom edge. */}
        <animated.div
          style={{
            transform: bottomY,
            opacity: headlineOpacity,
            filter: headlineBlur,
            top: `calc(50% - ${CONTENT_OFFSET_VH}vh + ${initialH / 2}px + ${GAP_VH}vh)`,
          }}
          className="absolute left-0 right-0 z-30 px-6 text-center"
          aria-hidden="true"
        >
          <TextEngine
            tag="span"
            {...HAND_REVEAL}
            delayIn={500}
            className="flex w-full flex-wrap justify-center font-hand text-3xl text-w-gold md:text-4xl"
          >
            {data.bottomText}
          </TextEngine>
        </animated.div>

        {/* Scroll affordance — fades out with the headlines */}
        <animated.div
          style={{ opacity: headlineOpacity }}
          className="pointer-events-none absolute bottom-[5vh] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-w-muted">
            листайте
          </span>
          {/* Hand-drawn arrow — slightly wobbly shaft + asymmetric head */}
          <svg
            width="14"
            height="36"
            viewBox="0 0 14 36"
            fill="none"
            aria-hidden="true"
            className="text-w-muted"
          >
            <path
              d="M7 1 C6.4 5 7.8 11 6.9 18 C6.3 23 7.2 27 7 32"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M3.5 27 L7 33 L10.5 27"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </animated.div>

        {/* Invitation paragraph — letters reveal one by one with the scroll */}
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-8">
          <TextEngine
            tag="p"
            trigger={paraTriggerRef}
            {...PARA_REVEAL}
            className="max-w-[34rem] text-balance text-center font-hand text-2xl italic leading-relaxed text-w-bone md:text-3xl"
          >
            {data.paragraph}
          </TextEngine>
        </div>
      </animated.div>
    </ProgressTrigger>
  );
};
