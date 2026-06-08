"use client";

import { useCallback, useRef } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { VenueMap } from "@/components/common/venue-map";
import { CalendarFlip } from "@/views/wedding/calendar-flip";
import { SectionHeading } from "@/views/wedding/section-heading";
import { useRevealOnEnter } from "@/hooks/use-reveal-on-enter";
import type { DateLocationData } from "@/data/mocks/date-location";

export interface DateLocationSectionProps {
  data: DateLocationData;
}

const LETTER_REVEAL = {
  mode: "once",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
  letterStagger: 35,
} as const;

/**
 * Date & Location — two natural-height panels that animate on viewport entry.
 * CalendarFlip receives a duration-based spring (0→1 over 2.5 s). Exit parallax
 * applies only during the exit window (p 0.5→1) so it never pushes content
 * off-screen during entry.
 *
 * All entry reveals are **declarative** springs gated on a `revealed` state set
 * by an IntersectionObserver — react-spring diffs the values each render, so
 * they reach and *hold* their end state. (The old single-shot imperative
 * `api.start()` reveals reset to their initial values on scroll-out in this
 * react-spring build — the "elements disappear" bug.)
 */
export const DateLocationSection = ({ data }: DateLocationSectionProps) => {
  const { date, location } = data;

  const datePanelRef = useRef<HTMLElement>(null);
  const locPanelRef = useRef<HTMLElement>(null);

  // Reveal triggers — observe each panel's heading via the shared root margin so
  // every section reveals at the same viewport line (see useRevealOnEnter).
  const dateHeadingRef = useRef<HTMLDivElement>(null);
  const locHeadingRef = useRef<HTMLDivElement>(null);

  // ─── Date panel ────────────────────────────────────────────────────────────

  const [{ dp }, dpApi] = useSpring(() => ({
    dp: 0,
    config: { tension: 300, friction: 40 },
  }));

  const dateRevealed = useRevealOnEnter(dateHeadingRef);

  // Calendar flip (0→1 over 2.5 s) + supporting note — declarative, driven by
  // `dateRevealed` so they hold once played.
  const { t } = useSpring({
    t: dateRevealed ? 1 : 0,
    config: { duration: 2500 },
  });
  const noteSpring = useSpring({
    opacity: dateRevealed ? 1 : 0,
    y: dateRevealed ? 0 : 14,
    delay: dateRevealed ? 2200 : 0,
    config: { tension: 260, friction: 32 },
  });

  // Exit parallax only: range starts at 0 so the interpolation never extrapolates
  // to positive values at low progress (which would push content off-screen).
  const handleDateProgress = useCallback(
    ({ progress }: { progress: number }) => {
      dpApi.set({ dp: progress });
    },
    [dpApi],
  );

  const dateExitY = dp.to([0, 0.5, 1], [0, 0, -12]);

  // ─── Location panel ────────────────────────────────────────────────────────

  const [{ lp }, lpApi] = useSpring(() => ({
    lp: 0,
    config: { tension: 300, friction: 40 },
  }));

  const revealed = useRevealOnEnter(locHeadingRef);

  const mapReveal = useSpring({
    opacity: revealed ? 1 : 0,
    scale: revealed ? 1 : 0.94,
    y: revealed ? 0 : 5,
    delay: revealed ? 1950 : 0,
    config: { tension: 220, friction: 26 },
  });

  const handleLocProgress = useCallback(
    ({ progress }: { progress: number }) => {
      lpApi.set({ lp: progress });
    },
    [lpApi],
  );

  const locExitY = lp.to([0, 0.5, 1], [0, 0, -12]);

  return (
    <section
      id="date-location"
      aria-label="Дата и место проведения"
      className="relative w-full"
    >
      <h2 className="sr-only">
        {`${date.day} ${date.month} ${date.year}, ${date.weekday}`}
      </h2>
      <time className="sr-only" dateTime={date.iso}>
        {`${date.weekday}, ${date.day} ${date.month} ${date.year}`}
      </time>

      {/* ── Date panel ── */}
      <ProgressTrigger
        ref={datePanelRef}
        tag="div"
        start="top bottom"
        end="bottom top"
        onChange={handleDateProgress}
        className="relative h-dvh overflow-hidden bg-w-ink"
      >
        <animated.div
          style={{ transform: dateExitY.to((v) => `translateY(${v}vh)`) }}
          className="flex h-full flex-col items-center justify-center gap-[3.5vh] px-6"
          aria-hidden="true"
        >
          <div ref={dateHeadingRef}>
            <SectionHeading eyebrow={date.eyebrow} enabled={dateRevealed} />
          </div>

          <CalendarFlip p={t} iso={date.iso} />

          <animated.p
            style={{
              opacity: noteSpring.opacity,
              transform: noteSpring.y.to((v) => `translateY(${v}px)`),
            }}
            className="font-body text-sm font-light tracking-wide text-w-muted"
          >
            {date.note}
          </animated.p>
        </animated.div>
      </ProgressTrigger>

      {/* ── Location panel — peeks 20 vh while date is still in view ── */}
      <ProgressTrigger
        ref={locPanelRef}
        tag="div"
        start="top bottom"
        end="bottom top"
        onChange={handleLocProgress}
        className="relative -mt-[20vh] h-dvh overflow-hidden"
      >
        <animated.div
          style={{ transform: locExitY.to((v) => `translateY(${v}vh)`) }}
          className="flex h-full flex-col items-center justify-center gap-[2vh] px-6"
        >
          <div ref={locHeadingRef}>
            <SectionHeading eyebrow={location.eyebrow} enabled={revealed} />
          </div>

          <TextEngine
            tag="h3"
            {...LETTER_REVEAL}
            enabled={revealed}
            delayIn={500}
            className="text-center font-punch text-4xl font-normal text-w-bone md:text-6xl"
          >
            {location.venue}
          </TextEngine>

          <TextEngine
            tag="p"
            {...LETTER_REVEAL}
            enabled={revealed}
            delayIn={1000}
            className="font-body text-base uppercase tracking-[0.18em] text-w-muted"
          >
            {location.city}
          </TextEngine>

          <TextEngine
            tag="p"
            {...LETTER_REVEAL}
            enabled={revealed}
            delayIn={1450}
            className="font-body text-sm tracking-[0.14em] text-w-muted/85"
          >
            {location.street}
          </TextEngine>

          <animated.div
            style={{
              opacity: mapReveal.opacity,
              transform: to(
                [mapReveal.y, mapReveal.scale],
                (y, s) => `translateY(${y}vh) scale(${s})`,
              ),
            }}
            className="mt-[1.5vh] w-[min(40rem,86vw)]"
          >
            <VenueMap
              lat={location.lat}
              lng={location.lng}
              zoom={location.zoom}
              title={location.mapTitle}
            />
          </animated.div>
        </animated.div>
      </ProgressTrigger>
    </section>
  );
};
