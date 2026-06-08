"use client";

import { useCallback, useMemo, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { SectionHeading } from "@/views/wedding/section-heading";
import { useRevealOnEnter } from "@/hooks/use-reveal-on-enter";
import { useWindowWidth } from "@/hooks/use-window-size";
import type { ScheduleData } from "@/data/mocks/schedule";

export interface ScheduleSectionProps {
  data: ScheduleData;
}

const CAROUSEL_START = 0.06; // brief lead-in so the heading reads before sliding
const CAROUSEL_END = 0.9; // last item centred — then a readable dwell to pin release
const TRAVEL_FRAC = 0.4; // fraction of each item's p-range used for lateral travel
const REVEAL_DUR = 0.05; // p-range over which each item's text fades in
const OVERLAP_VH = 20; // dresscode overlaps the schedule exit by this (-mt-[20vh])
const EXIT_VH = 24; // content rise over the overlap → ~1.2× the incoming dresscode

interface CarouselConfig {
  trackPValues: number[];
  trackXValues: number[];
  itemRevealStart: (i: number) => number;
  pinHeightVh: number;
}

function buildCarouselConfig(
  n: number,
  viewportWidthPx: number,
  slotWidthPx: number,
): CarouselConfig {
  const centerX = (i: number) => viewportWidthPx / 2 - slotWidthPx * (i + 0.5);

  // The carousel slides across [CAROUSEL_START, CAROUSEL_END]: item 0 stays
  // centred through the lead-in, the last item lands centred at CAROUSEL_END and
  // then *dwells* (read time, like every other item) until the pin releases at
  // p = 1 — no dead scroll beyond the pin, no exit whoosh.
  const span = CAROUSEL_END - CAROUSEL_START;
  const step = n > 1 ? span / (n - 1) : span; // p-distance between item centres
  const travel = step * TRAVEL_FRAC; // lateral-travel window per item
  const centerP = (i: number) => CAROUSEL_START + step * i;

  const trackPValues: number[] = [0, centerP(0)];
  const trackXValues: number[] = [centerX(0), centerX(0)];

  for (let i = 1; i < n; i++) {
    trackPValues.push(centerP(i) - travel, centerP(i));
    trackXValues.push(centerX(i - 1), centerX(i));
  }
  // Hold the last item centred through its dwell, up to pin release.
  trackPValues.push(1);
  trackXValues.push(centerX(n - 1));

  const itemRevealStart = (i: number) => centerP(i) - travel;

  return {
    trackPValues,
    trackXValues,
    itemRevealStart,
    pinHeightVh: n * 80 + 60,
  };
}

// Mobile (< 768 px): 78 vw — neighbours peek. Desktop: min(40 vw, 560 px).
function computeSlotWidth(w: number): number {
  const width = w || 375;
  return width >= 768
    ? Math.round(Math.min(width * 0.4, 560))
    : Math.round(width * 0.78);
}

export const ScheduleSection = ({ data }: ScheduleSectionProps) => {
  const { entries } = data;
  const windowWidth = useWindowWidth();
  const slotWidthPx = computeSlotWidth(windowWidth);
  const viewportW = windowWidth || 375;

  const sectionRef = useRef<HTMLElement>(null);

  const cfg = useMemo(
    () => buildCarouselConfig(entries.length, viewportW, slotWidthPx),
    [entries.length, viewportW, slotWidthPx],
  );

  // Reveal on the shared trigger line (heading crosses ~80vh from top) — same
  // timing as every other section. Drives the heading and the timeline fade.
  const headingRef = useRef<HTMLDivElement>(null);
  const revealed = useRevealOnEnter(headingRef);

  // Timeline container fades in shortly after the heading — inview, not scroll.
  const timelineReveal = useSpring({
    opacity: revealed ? 1 : 0,
    delay: revealed ? 700 : 0,
    config: { tension: 200, friction: 26 },
  });

  const [{ p }, api] = useSpring(() => ({
    p: 0,
    config: { tension: 300, friction: 40 },
  }));

  const handleProgress = useCallback(
    ({ progress }: { progress: number }) => {
      api.start({ p: progress });
    },
    [api],
  );

  // Track horizontal position (pixels) — the only scroll-driven motion left.
  const trackX = p.to(cfg.trackPValues, cfg.trackXValues);

  // Exit parallax — "old exits faster than new enters", matched to date→location.
  // The stage is *pinned* for the whole progress, so the only window where the
  // dresscode (−mt-[20vh]) coexists with the schedule is the final overlap
  // (last 20vh of scroll). During it the pinned content contributes 0× of its
  // own, so ALL of the "faster" must come from parallax: we rise EXIT_VH over
  // exactly that overlap window → ~1.2× the 1× incoming dresscode, the same
  // old-faster ratio the flowing date/location panels get. See ADR-0032.
  const overlapStart = 1 - OVERLAP_VH / (cfg.pinHeightVh - 100);
  const exitY = p.to([0, overlapStart, 1], [0, 0, -EXIT_VH]);

  // Gold fill: width = distance from first-bullet centre to active-bullet centre.
  const goldFillWidth = p.to(
    cfg.trackPValues,
    cfg.trackXValues.map((tx) => viewportW / 2 - tx - slotWidthPx / 2),
  );

  return (
    <ProgressTrigger
      ref={sectionRef}
      tag="section"
      id="schedule"
      aria-label="Программа дня"
      start="top top"
      end="bottom bottom"
      onChange={handleProgress}
      style={{ height: `${cfg.pinHeightVh}vh` }}
      className="relative -mt-[20vh] w-full"
    >
      <div className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden">
        <animated.div
          style={{ transform: exitY.to((v) => `translateY(${v}vh)`) }}
          className="flex w-full flex-col items-center will-change-transform"
        >
        {/* Section heading — reveals on the shared trigger line */}
        <div
          ref={headingRef}
          className="flex flex-col items-center gap-3 px-8 text-center"
        >
          <SectionHeading
            eyebrow={data.eyebrow}
            heading={data.heading}
            enabled={revealed}
            headingDelayIn={450}
          />
        </div>

        {/* Horizontal carousel — fades in on inview, then scroll drives progress */}
        <animated.div
          style={{ opacity: timelineReveal.opacity }}
          className="relative mt-[5vh] w-full overflow-hidden"
        >
          <animated.ol
            style={{ transform: trackX.to((x) => `translateX(${x}px)`) }}
            className="relative flex flex-row will-change-transform"
          >
            {/* Faint base line — first bullet centre to last bullet centre */}
            <span
              style={{
                left: slotWidthPx / 2,
                width: (entries.length - 1) * slotWidthPx,
              }}
              className="pointer-events-none absolute top-[0.375rem] h-px bg-w-bone/12"
              aria-hidden="true"
            />
            {/* Gold fill — grows left to right as carousel advances */}
            <animated.span
              style={{
                left: slotWidthPx / 2,
                width: goldFillWidth.to((w) => `${Math.max(0, w)}px`),
              }}
              className="pointer-events-none absolute top-[0.375rem] h-px bg-w-gold/70"
              aria-hidden="true"
            />

            {entries.map((entry, i) => {
              const rs = cfg.itemRevealStart(i);
              // Item 0 is centred through the lead-in — show it with the timeline
              // (constant 1, avoiding a malformed p-range with a duplicate/negative
              // leading breakpoint). Later items fade in as they reach centre.
              const textOpacity =
                i === 0
                  ? 1
                  : p.to([0, rs, rs + REVEAL_DUR, 1], [0, 0, 1, 1]);
              return (
                <animated.li
                  key={entry.title}
                  style={{ width: slotWidthPx, flexShrink: 0 }}
                  className="flex flex-col items-center px-6 text-center"
                >
                  <span
                    className="relative z-10 block size-3 rounded-full bg-w-gold"
                    aria-hidden="true"
                  />
                  <animated.div
                    style={{ opacity: textOpacity }}
                    className="mt-5 text-center"
                  >
                    <time className="block font-hand text-3xl italic text-w-gold md:text-4xl">
                      {entry.time}
                    </time>
                    <h3 className="mt-2 font-sans text-sm font-semibold uppercase tracking-wide text-w-bone md:text-base">
                      {entry.title}
                    </h3>
                    <p className="mt-2 font-body text-xs font-light leading-snug tracking-wide text-w-muted md:text-sm">
                      {entry.note}
                    </p>
                  </animated.div>
                </animated.li>
              );
            })}
          </animated.ol>
        </animated.div>
        </animated.div>
      </div>
    </ProgressTrigger>
  );
};
