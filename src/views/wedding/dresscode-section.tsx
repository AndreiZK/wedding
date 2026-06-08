"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { animated, easings, useSpring, useSprings } from "@react-spring/web";
import Image from "next/image";
import TextEngine from "spring-text-engine";

import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { SectionHeading } from "@/views/wedding/section-heading";
import { useRevealOnEnter } from "@/hooks/use-reveal-on-enter";
import { Lightbox } from "@/components/common/lightbox";
import type {
  DresscodeData,
  DresscodeOptionId,
} from "@/data/mocks/dresscode";

export interface DresscodeSectionProps {
  data: DresscodeData;
}

const LOOK_FILTER = "h-full w-full object-cover";

const INTRO_REVEAL = {
  mode: "once",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 800, friction: 28 },
  letterStagger: 18,
} as const;

/**
 * Dresscode — natural-height section (no pin). Reveals on the shared
 * `useRevealOnEnter` line (heading at 80vh from top), then a declarative
 * cascade fires (switch → photos → caption → blacklist) — declarative so a
 * gender-switch re-render never resets them. Exit parallax LAGS at +16 vh so
 * the preferences form rushes up underneath (the dresscode→preferences seam is
 * intentionally *not* an "old-faster" handoff). See ADR-0031, ADR-0032.
 */
export const DresscodeSection = ({ data }: DresscodeSectionProps) => {
  const [active, setActive] = useState<DresscodeOptionId>(data.options[0].id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeIndex = data.options.findIndex((o) => o.id === active);
  const activeOption = data.options[activeIndex];

  const underline = useSpring({
    x: `${activeIndex * 100}%`,
    config: { tension: 260, friction: 30, easing: easings.easeOutCubic },
  });

  const openAt = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const sectionRef = useRef<HTMLElement>(null);

  // Exit parallax spring (0 = entry, 0.5 = section top at viewport top, 1 = exited).
  const [{ ep }, epApi] = useSpring(() => ({
    ep: 0,
    config: { tension: 300, friction: 40 },
  }));
  // Positive offset during exit: content lags behind scroll so dresscode
  // lingers in view longer than the form section below rushes in.
  const exitY = ep.to([0, 0.5, 1], [0, 0, 16]);

  // Reveal on the shared trigger line (heading crosses ~80vh from top) — the
  // content container's top edge coincides with the heading. Same timing as
  // every other section.
  const contentRef = useRef<HTMLDivElement>(null);
  const revealed = useRevealOnEnter(contentRef);

  const handleProgress = useCallback(
    ({ progress }: { progress: number }) => {
      epApi.set({ ep: progress });
    },
    [epApi],
  );

  // Sequential reveal cascade — **declarative** springs gated on `revealed` (the
  // delay only applies on the 0→1 transition). Once revealed they hold opacity 1
  // permanently: a later re-render (e.g. clicking the gender switch, which calls
  // setActive) diffs to the same target and never resets to 0. The previous
  // imperative `api.start()` form reset these to 0 on every switch and the
  // one-shot start never replayed — the "switch and everything below disappears"
  // bug. See ADR-0032.
  const switchReveal = useSpring({
    opacity: revealed ? 1 : 0,
    delay: revealed ? 1500 : 0,
    config: { tension: 200, friction: 26 },
  });
  const captionReveal = useSpring({
    opacity: revealed ? 1 : 0,
    delay: revealed ? 2500 : 0,
    config: { tension: 200, friction: 26 },
  });
  const blacklistReveal = useSpring({
    opacity: revealed ? 1 : 0,
    delay: revealed ? 2800 : 0,
    config: { tension: 200, friction: 26 },
  });
  const photoSprings = useSprings(
    3,
    [0, 1, 2].map((i) => ({
      opacity: revealed ? 1 : 0,
      delay: revealed ? 1800 + i * 200 : 0,
      config: { tension: 200, friction: 26 },
    })),
  );

  const gallery = useMemo(
    () => (
      <ul className="grid w-full grid-cols-3 gap-2 md:gap-3">
        {activeOption.looks.map((look, i) => (
          <animated.li key={look.src} style={{ opacity: photoSprings[i].opacity }}>
            <button
              type="button"
              onClick={() => openAt(i)}
              aria-label={`Открыть на весь экран: ${look.alt}`}
              className="group relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden ring-1 ring-inset ring-w-bone/12 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-w-gold"
            >
              <Image
                src={look.src}
                alt={look.alt}
                width={look.width}
                height={look.height}
                className={LOOK_FILTER}
                sizes="(max-width: 768px) 33vw, 16vw"
              />
              <span
                className="absolute inset-0 bg-transparent group-hover:bg-w-ink/20"
                aria-hidden="true"
              />
              <span
                className="absolute inset-0 hidden items-center justify-center text-w-bone group-hover:flex"
                aria-hidden="true"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M16 16l4 4M11 8v6M8 11h6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>
          </animated.li>
        ))}
      </ul>
    ),
    [activeOption, openAt, photoSprings],
  );

  return (
    <ProgressTrigger
      ref={sectionRef}
      tag="section"
      id="dresscode"
      aria-label="Дресс-код"
      start="top bottom"
      end="bottom top"
      onChange={handleProgress}
      className="relative -mt-[20vh] w-full overflow-hidden bg-w-ink"
    >
      <animated.div
        style={{ transform: exitY.to((v) => `translateY(${v}vh)`) }}
        className="flex w-full flex-col items-center justify-center pt-[12vh] pb-[30vh] will-change-transform"
      >
        <div
          ref={contentRef}
          className="flex w-full max-w-[24rem] flex-col items-center gap-[1.5vh] px-6 text-center md:max-w-[30rem]"
        >
          <SectionHeading
            eyebrow={data.eyebrow}
            heading={data.heading}
            enabled={revealed}
            headingDelayIn={450}
          />

          <TextEngine
            tag="p"
            {...INTRO_REVEAL}
            enabled={revealed}
            delayIn={1050}
            className="flex flex-wrap justify-center font-body text-base font-light leading-relaxed tracking-wide text-w-muted"
          >
            {data.intro}
          </TextEngine>

          <animated.div
            style={{ opacity: switchReveal.opacity }}
            className="mt-[1vh] flex flex-col items-center gap-3"
          >
            <span className="font-sans text-[0.6rem] uppercase tracking-[0.32em] text-w-muted">
              {data.switchLabel}
            </span>
            <div
              role="group"
              aria-label={data.switchLabel}
              className="relative inline-grid grid-cols-2"
            >
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-w-bone/15"
              />
              {data.options.map((option) => {
                const isActive = option.id === active;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      setActive(option.id);
                      (e.currentTarget as HTMLButtonElement).blur();
                    }}
                    aria-pressed={isActive}
                    className={`relative z-10 whitespace-nowrap px-7 pb-3 pt-1 font-hand text-xl italic md:px-10 md:text-2xl ${
                      isActive
                        ? "text-w-bone"
                        : "text-w-muted/70 hover:text-w-bone/80"
                    } focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-w-gold`}
                  >
                    {option.label}
                  </button>
                );
              })}
              <animated.span
                style={underline}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 flex w-1/2 justify-center"
              >
                <span className="block h-px w-10 bg-w-gold" />
              </animated.span>
            </div>
          </animated.div>

          <div className="mt-[1vh] w-full">
            {gallery}
          </div>

          <animated.p
            style={{ opacity: captionReveal.opacity }}
            className="font-body text-sm font-light tracking-wide text-w-muted"
          >
            {activeOption.caption}
          </animated.p>

          <animated.div
            style={{ opacity: blacklistReveal.opacity }}
            className="mt-[1vh] flex flex-col items-center gap-2"
          >
            <p className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-w-muted">
              {data.blacklistCaption}
            </p>
            <ul className="flex gap-4" aria-label={data.blacklistCaption}>
              {data.blacklistedColors.map(({ hex, label }) => (
                <li key={hex}>
                  <span
                    className="block size-6 rounded-full ring-1 ring-inset ring-w-bone/25"
                    style={{ background: hex }}
                    aria-label={label}
                  />
                </li>
              ))}
            </ul>
          </animated.div>
        </div>
      </animated.div>

      <Lightbox
        images={activeOption.looks}
        index={lightboxIndex}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </ProgressTrigger>
  );
};
