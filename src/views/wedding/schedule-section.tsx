"use client";

import { useCallback, useMemo, useRef } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { useWindowWidth } from "@/hooks/use-window-size";
import type { ScheduleData } from "@/data/mocks/schedule";

export interface ScheduleSectionProps {
  data: ScheduleData;
}

const CAROUSEL_START = 0.15; // heading done, carousel begins
const EXIT_START = 0.90; // last item done, exit begins
const H2_REVEAL_START = 0.08; // h2 starts once label has faded in (label runs p 0→0.12)
const TRAVEL_FRAC = 0.40; // fraction of each item's p-range used for lateral travel
const REVEAL_DUR = 0.05; // p-range over which each item's text fades in/out

const LETTER_REVEAL = {
  mode: "progress",
  type: "toggle",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
} as const;

interface CarouselConfig {
  trackPValues: number[];
  trackXValues: number[];
  itemRevealStart: (i: number) => number;
  itemDwellEnd: (i: number) => number;
  pinHeightVh: number;
}

function buildCarouselConfig(
  n: number,
  viewportWidthPx: number,
  slotWidthPx: number,
): CarouselConfig {
  const carouselRange = EXIT_START - CAROUSEL_START;
  const itemRange = carouselRange / n;
  const travel = itemRange * TRAVEL_FRAC;

  const centerX = (i: number) => viewportWidthPx / 2 - slotWidthPx * (i + 0.5);

  const trackPValues: number[] = [0];
  const trackXValues: number[] = [centerX(0)];

  for (let i = 1; i < n; i++) {
    const travelStart = CAROUSEL_START + i * itemRange;
    const travelEnd = travelStart + travel;
    trackPValues.push(travelStart, travelEnd);
    trackXValues.push(centerX(i - 1), centerX(i));
  }

  trackPValues.push(1.0);
  trackXValues.push(centerX(n - 1));

  const itemRevealStart = (i: number) =>
    i === 0 ? CAROUSEL_START : CAROUSEL_START + i * itemRange + travel;

  const itemDwellEnd = (i: number) =>
    i === n - 1 ? EXIT_START : CAROUSEL_START + (i + 1) * itemRange;

  return {
    trackPValues,
    trackXValues,
    itemRevealStart,
    itemDwellEnd,
    pinHeightVh: n * 120 + 200,
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

  const cfg = useMemo(
    () => buildCarouselConfig(entries.length, viewportW, slotWidthPx),
    [entries.length, viewportW, slotWidthPx],
  );

  // Plain-DOM proxy for the h2 TextEngine.
  // Offset from section top so "top top" fires at p=H2_REVEAL_START (after label).
  // Height sized so "bottom top" fires at p=CAROUSEL_START.
  const headingTriggerRef = useRef<HTMLDivElement>(null);

  const [{ p }, api] = useSpring(() => ({
    p: 0,
    config: { tension: 300, friction: 40 },
  }));

  const handleProgress = useCallback(
    ({ progress }: { progress: number; interpolatedProgress: number }) => {
      api.start({ p: progress });
    },
    [api],
  );

  // Label — same large-to-small emergence as "когда?" / "где?" (date-location-section.tsx:57–60).
  const labelY = p.to([0, 0.12, 1], [24, 0, 0]);
  const labelScale = p.to([0, 0.12, 1], [2.6, 1, 1]);
  const labelOpacity = p.to([0, 0.03, 0.12, 1], [0, 1, 1, 1]);

  // Track horizontal position (pixels).
  const trackX = p.to(cfg.trackPValues, cfg.trackXValues);

  // Gold fill: left edge at first bullet centre, right edge at active bullet centre.
  // fill_width = (viewportW/2 − trackX) − slotW/2
  const goldFillWidth = p.to(
    cfg.trackPValues,
    cfg.trackXValues.map((tx) => viewportW / 2 - tx - slotWidthPx / 2),
  );

  // Timeline fades in at CAROUSEL_START so heading phase and scroll-in are clean.
  const timelineOpacity = p.to(
    [0, CAROUSEL_START - 0.02, CAROUSEL_START + 0.03, 1],
    [0, 0, 1, 1],
  );

  // Fast exit (ADR-0019).
  const exitY = p.to([0, EXIT_START, 1], [0, 0, -112]);
  const exitOpacity = p.to([0, EXIT_START + 0.01, 1], [1, 1, 0]);

  const activeScrollRange = cfg.pinHeightVh - 100;

  return (
    <ProgressTrigger
      tag="section"
      id="schedule"
      aria-label="Программа дня"
      start="top top"
      end="bottom bottom"
      onChange={handleProgress}
      style={{ height: `${cfg.pinHeightVh}vh` }}
      // -mt-[100vh]: schedule pin starts immediately when location pin ends —
      // same zero-gap pattern as the location pin inside DateLocationSection.
      // bg-w-ink is intentionally omitted here; the parent wrapper provides it.
      className="relative w-full -mt-[100vh]"
    >
      {/*
        Proxy for h2 TextEngine. Offset by H2_REVEAL_START so "top top" fires at
        p=0.08 (label already fading in); sized so "bottom top" fires at CAROUSEL_START.
      */}
      <div
        ref={headingTriggerRef}
        style={{
          top: `${H2_REVEAL_START * activeScrollRange}vh`,
          height: `${(CAROUSEL_START - H2_REVEAL_START) * activeScrollRange}vh`,
        }}
        className="pointer-events-none absolute inset-x-0 -z-10"
        aria-hidden="true"
      />

      <animated.div
        style={{
          transform: exitY.to((v) => `translateY(${v}vh)`),
          opacity: exitOpacity,
        }}
        className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden will-change-transform"
      >
        {/* Section heading */}
        <div className="flex flex-col items-center gap-3 px-8 text-center">
          <animated.p
            style={{
              opacity: labelOpacity,
              transform: to(
                [labelY, labelScale],
                (y, s) => `translateY(${y}vh) scale(${s})`,
              ),
            }}
            className="eyebrow"
            aria-hidden="true"
          >
            {data.eyebrow}
          </animated.p>

          {/* flex flex-wrap justify-center — required for TextEngine horizontal centring */}
          <TextEngine
            tag="h2"
            trigger={headingTriggerRef}
            {...LETTER_REVEAL}
            start="top top"
            end="bottom top"
            className="flex flex-wrap justify-center font-punch text-4xl font-normal text-w-bone md:text-5xl"
          >
            {data.heading}
          </TextEngine>
        </div>

        {/* Horizontal timeline — hidden until carousel begins so heading phase stays clean */}
        <animated.div
          style={{ opacity: timelineOpacity }}
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
            {/* Gold fill — grows from first bullet to the active bullet */}
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
              const re = cfg.itemDwellEnd(i);
              const textOpacity = p.to(
                [0, rs, rs + REVEAL_DUR, re - REVEAL_DUR, re, 1],
                [0, 0, 1, 1, 0, 0],
              );
              return (
                <animated.li
                  key={entry.title}
                  style={{ width: slotWidthPx, flexShrink: 0 }}
                  className="flex flex-col items-center px-6 text-center"
                >
                  {/* Circle bullet — sits on top of the line (z-10) */}
                  <span
                    className="relative z-10 block size-3 rounded-full bg-w-gold"
                    aria-hidden="true"
                  />
                  {/* Content — visible only during this item's dwell */}
                  <animated.div
                    style={{ opacity: textOpacity }}
                    className="mt-5 text-center"
                  >
                    <time className="block font-hand text-3xl italic text-w-gold md:text-4xl">
                      {entry.time}
                    </time>
                    <h3 className="mt-2 font-sans text-lg font-semibold tracking-tight text-w-bone md:text-xl">
                      {entry.title}
                    </h3>
                    <p className="mt-2 font-body text-sm font-light tracking-wide text-w-muted">
                      {entry.note}
                    </p>
                  </animated.div>
                </animated.li>
              );
            })}
          </animated.ol>
        </animated.div>
      </animated.div>
    </ProgressTrigger>
  );
};
