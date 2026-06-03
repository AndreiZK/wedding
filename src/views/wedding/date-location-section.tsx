"use client";

import { useCallback, useRef } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { VenueMap } from "@/components/common/venue-map";
import { CalendarFlip } from "@/views/wedding/calendar-flip";
import type { DateLocationData } from "@/data/mocks/date-location";

export interface DateLocationSectionProps {
  data: DateLocationData;
}

/**
 * Letter-by-letter reveal scrubbed by a pin's scroll. `type="toggle"` keeps every
 * letter hidden at progress 0, then pops them in in order (same primitive as the
 * hero paragraph). `start`/`end` are supplied per use to place the window.
 */
const LETTER_REVEAL = {
  mode: "progress",
  type: "toggle",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
} as const;

/**
 * Date & Location — **two pinned scroll timelines**, one progress value each
 * (ADR-0013). **Date:** the "когда?" label slides out from under the hero (large →
 * eyebrow), a calendar **flips through months** (April → July) and **rings** the
 * 16th, then the gathering time fades in. **Location:** the "где?" label emerges the
 * same way, the venue → city → street **reveal in sequence, letter by letter**, and
 * the palette-themed **Google map** rises in (ADR-0018).
 *
 * **Snappy hand-offs (ADR-0019):** when a pin's content has settled it **whooshes up
 * faster than scroll** (`*ExitY` / `*ExitOpacity`) and the next pin/section is pulled
 * up over the tail (`-mt`) so it starts immediately — killing the dead space between
 * sections. Date→location overlaps here; location→schedule overlaps in `home.tsx`.
 */
export const DateLocationSection = ({ data }: DateLocationSectionProps) => {
  const { date, location } = data;

  // --- Date pin ---
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

  // Label "когда?" — emerges from under the hero, large, settling to eyebrow size.
  const labelY = p.to([0, 0.22, 1], [24, 0, 0]);
  const labelScale = p.to([0, 0.22, 1], [2.6, 1, 1]);
  const labelOpacity = p.to([0, 0.05, 0.22, 1], [0, 1, 1, 1]);

  // Time note — appears only after the calendar finishes ringing the date.
  const timeOpacity = p.to([0, 0.78, 0.92, 1], [0, 0, 1, 1]);
  const timeY = p.to([0, 0.78, 0.92, 1], [14, 14, 0, 0]);

  // Fast exit — once settled (p≈0.9) the whole date stage whooshes up & fades.
  const dateExitY = p.to([0, 0.9, 1], [0, 0, -112]);
  const dateExitOpacity = p.to([0, 0.92, 1], [1, 1, 0]);

  // --- Location pin ---
  const [{ p2 }, api2] = useSpring(() => ({
    p2: 0,
    config: { tension: 300, friction: 40 },
  }));
  const handleProgress2 = useCallback(
    ({ progress }: { progress: number; interpolatedProgress: number }) => {
      api2.start({ p2: progress });
    },
    [api2],
  );
  // Plain-DOM proxies = scroll references for the pinned letter reveals (which
  // can't trigger on their own centred position; see [[hero-section]]). Two proxies
  // of different geometry place the windows in sequence: `venueTriggerRef` spans the
  // whole pin (venue `center bottom`→`center center` ≈ p2 .25–.5; city `center
  // center`→`center top` ≈ .5–.75); `streetTriggerRef` sits lower so the *same*
  // `center center`→`center top` lands later (≈ .62–.88) — street after city.
  const venueTriggerRef = useRef<HTMLDivElement>(null);
  const streetTriggerRef = useRef<HTMLDivElement>(null);

  // Label "где?" — emerges exactly like the date label.
  const label2Y = p2.to([0, 0.22, 1], [24, 0, 0]);
  const label2Scale = p2.to([0, 0.22, 1], [2.6, 1, 1]);
  const label2Opacity = p2.to([0, 0.05, 0.22, 1], [0, 1, 1, 1]);

  // Map — rises / fades in after the address text (street settles ≈0.77), holds.
  const mapOpacity = p2.to([0, 0.78, 0.88, 1], [0, 0, 1, 1]);
  const mapScale = p2.to([0, 0.78, 0.88, 1], [0.94, 0.94, 1, 1]);
  const mapY = p2.to([0, 0.78, 0.88, 1], [5, 5, 0, 0]);

  // Fast exit — pushed to p2=0.96 so the map is visible for ~32vh before exiting.
  const locExitY = p2.to([0, 0.96, 1], [0, 0, -112]);
  const locExitOpacity = p2.to([0, 0.97, 1], [1, 1, 0]);

  return (
    <section
      id="date-location"
      aria-label="Дата и место проведения"
      className="relative w-full bg-w-ink"
    >
      {/* Real heading + machine-readable date; the pinned calendar is decorative */}
      <h2 className="sr-only">
        {`${date.day} ${date.month} ${date.year}, ${date.weekday}`}
      </h2>
      <time className="sr-only" dateTime={date.iso}>
        {`${date.weekday}, ${date.day} ${date.month} ${date.year}`}
      </time>

      {/* Pinned date choreography */}
      <ProgressTrigger
        tag="div"
        start="top top"
        end="bottom bottom"
        onChange={handleProgress}
        className="relative h-[320vh]"
      >
        <animated.div
          style={{
            transform: dateExitY.to((v) => `translateY(${v}vh)`),
            opacity: dateExitOpacity,
          }}
          className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center gap-[3.5vh] overflow-hidden px-6 will-change-transform"
          aria-hidden="true"
        >
          <animated.p
            style={{
              opacity: labelOpacity,
              transform: to(
                [labelY, labelScale],
                (y, s) => `translateY(${y}vh) scale(${s})`,
              ),
            }}
            className="eyebrow"
          >
            {date.eyebrow}
          </animated.p>

          <CalendarFlip p={p} iso={date.iso} />

          <animated.p
            style={{
              opacity: timeOpacity,
              transform: timeY.to((v) => `translateY(${v}px)`),
            }}
            className="font-body text-sm font-light tracking-wide text-w-muted"
          >
            {date.note}
          </animated.p>
        </animated.div>
      </ProgressTrigger>

      {/* Pinned location choreography: label → venue → city → street → map.
          Pulled up over the date pin's exit tail so it starts immediately. */}
      <ProgressTrigger
        tag="div"
        start="top top"
        end="bottom bottom"
        onChange={handleProgress2}
        className="relative -mt-[100vh] h-[500vh]"
      >
        {/* Scroll references for the pinned letter reveals (full pin + lower band) */}
        <div
          ref={venueTriggerRef}
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        />
        <div
          ref={streetTriggerRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[50vh] -z-10"
          aria-hidden="true"
        />

        <animated.div
          style={{
            transform: locExitY.to((v) => `translateY(${v}vh)`),
            opacity: locExitOpacity,
          }}
          className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center gap-[2vh] overflow-hidden px-6 will-change-transform"
        >
          <animated.p
            style={{
              opacity: label2Opacity,
              transform: to(
                [label2Y, label2Scale],
                (y, s) => `translateY(${y}vh) scale(${s})`,
              ),
            }}
            className="eyebrow"
            aria-hidden="true"
          >
            {location.eyebrow}
          </animated.p>

          {/* Venue first… */}
          <TextEngine
            tag="h3"
            trigger={venueTriggerRef}
            {...LETTER_REVEAL}
            start="center bottom"
            end="center center"
            className="text-center font-punch text-4xl font-normal text-w-bone md:text-6xl"
          >
            {location.venue}
          </TextEngine>

          {/* …then the address (city above street), in the next window. */}
          <TextEngine
            tag="p"
            trigger={venueTriggerRef}
            {...LETTER_REVEAL}
            start="center center"
            end="center top"
            className="font-body text-base uppercase tracking-[0.18em] text-w-muted"
          >
            {location.city}
          </TextEngine>

          <TextEngine
            tag="p"
            trigger={streetTriggerRef}
            {...LETTER_REVEAL}
            start="center center"
            end="center top"
            className="font-body text-sm tracking-[0.14em] text-w-muted/85"
          >
            {location.street}
          </TextEngine>

          <animated.div
            style={{
              opacity: mapOpacity,
              transform: to(
                [mapY, mapScale],
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
