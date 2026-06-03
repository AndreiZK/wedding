"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { animated, easings, to, useSpring } from "@react-spring/web";
import Image from "next/image";
import TextEngine from "spring-text-engine";

import { Handle } from "@/components/animation/springs/handle";
import { ProgressTrigger } from "@/components/animation/springs/progress-trigger";
import { Lightbox } from "@/components/common/lightbox";
import type {
  DresscodeData,
  DresscodeOption,
  DresscodeOptionId,
} from "@/data/mocks/dresscode";

export interface DresscodeSectionProps {
  data: DresscodeData;
}

/** Shared warm-monochrome treatment — matches the hero photos. */
const LOOK_FILTER =
  "h-full w-full object-cover grayscale-[0.6] sepia-[0.2] contrast-[1.05] brightness-[0.9]";

// --- Choreography constants ---
const PIN_HEIGHT_VH = 700; // active scroll range = 600 vh
const ACTIVE_RANGE = PIN_HEIGHT_VH - 100; // 600
const H2_REVEAL_START = 0.08;
const H2_REVEAL_END = 0.18;
const INTRO_REVEAL_START = 0.16;
const INTRO_REVEAL_END = 0.26;
const CONTENT_START = 0.28;
const PHOTOS_START = 0.33;
const PHOTO_STAGGER = 0.05;
const CAPTION_REVEAL = 0.52;
const BLACKLIST_REVEAL = 0.60;

const LETTER_REVEAL = {
  mode: "progress",
  type: "toggle",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
} as const;

export const DresscodeSection = ({ data }: DresscodeSectionProps) => {
  const [active, setActive] = useState<DresscodeOptionId>(data.options[0].id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeIndex = data.options.findIndex((o) => o.id === active);
  const activeOption = data.options[activeIndex];

  // Gold underline sliding beneath the active switch label.
  const underline = useSpring({
    x: `${activeIndex * 100}%`,
    config: { tension: 260, friction: 30, easing: easings.easeOutCubic },
  });

  const openAt = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // --- Proxy triggers (direct children of ProgressTrigger, outside sticky stage) ---
  const headingTriggerRef = useRef<HTMLDivElement>(null);
  const introTriggerRef = useRef<HTMLDivElement>(null);

  // --- Progress spring ---
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

  // All p.to() interpolations are memoised so they produce stable object references
  // across re-renders (e.g. option-switch). Without useMemo, a re-render creates new
  // interpolation objects; animated elements detach + re-attach and briefly show 0
  // because p hasn't emitted a new value to drive the re-attached interpolation.
  // p is a stable SpringValue reference, so these memos effectively run once.
  // All p.to() interpolations — including chained .to() and multi-source to() —
  // are memoised here. Any inline .to() / to([...]) call in JSX creates a new
  // object on every render; animated elements detach+reattach and briefly show
  // their initial value because p hasn't emitted since the reattachment.
  const {
    labelTransform,
    labelOpacity,
    switchOpacity,
    captionOpacity,
    blacklistOpacity,
    photoOpacities,
    stageTransform,
    stageOpacity,
  } = useMemo(() => {
    const DRIFT_START = 0.80;
    const labelY_ = p.to([0, 0.12, 1], [24, 0, 0]);
    const labelScale_ = p.to([0, 0.12, 1], [2.6, 1, 1]);
    return {
      labelTransform: to(
        [labelY_, labelScale_],
        (y, s) => `translateY(${y}vh) scale(${s})`,
      ),
      labelOpacity: p.to([0, 0.03, 0.12, 1], [0, 1, 1, 1]),
      switchOpacity: p.to(
        [0, CONTENT_START, CONTENT_START + 0.04, 1],
        [0, 0, 1, 1],
      ),
      captionOpacity: p.to(
        [0, CAPTION_REVEAL, CAPTION_REVEAL + 0.04, 1],
        [0, 0, 1, 1],
      ),
      blacklistOpacity: p.to(
        [0, BLACKLIST_REVEAL, BLACKLIST_REVEAL + 0.05, 1],
        [0, 0, 1, 1],
      ),
      photoOpacities: [0, 1, 2].map((i) =>
        p.to(
          [
            0,
            PHOTOS_START + i * PHOTO_STAGGER,
            PHOTOS_START + i * PHOTO_STAGGER + 0.04,
            1,
          ],
          [0, 0, 1, 1],
        ),
      ),
      stageTransform: p
        .to([0, DRIFT_START, 1], [0, 0, -60])
        .to((v) => `translateY(${v}vh)`),
      stageOpacity: p.to([0, 0.85, 1], [1, 1, 0]),
    };
  }, [p]);

  // Gallery memoised so Handle only cross-fades when the active option changes.
  // photoOpacities are stable and embedded here for per-photo stagger.
  const gallery = useMemo(
    () => (
      <ul className="grid w-full grid-cols-3 gap-2 md:gap-3">
        {activeOption.looks.map((look, i) => (
          <animated.li key={look.src} style={{ opacity: photoOpacities[i] }}>
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
                className="absolute inset-0 bg-w-ink/30 group-hover:bg-w-ink/10"
                aria-hidden="true"
              />
              <span
                className="absolute inset-0 hidden items-center justify-center text-w-bone group-hover:flex"
                aria-hidden="true"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
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
    [activeOption, openAt, photoOpacities],
  );

  return (
    <ProgressTrigger
      tag="section"
      id="dresscode"
      aria-label="Дресс-код"
      start="top top"
      end="bottom bottom"
      onChange={handleProgress}
      style={{ height: `${PIN_HEIGHT_VH}vh` }}
      // -mt-[100vh]: dresscode pin starts the moment the schedule pin ends.
      // bg-w-ink is omitted — the parent wrapper provides the dark background.
      className="relative w-full -mt-[100vh]"
    >
      {/* H2 proxy: "top top"→"bottom top" maps to p 0.08→0.18 */}
      <div
        ref={headingTriggerRef}
        style={{
          top: `${H2_REVEAL_START * ACTIVE_RANGE}vh`,
          height: `${(H2_REVEAL_END - H2_REVEAL_START) * ACTIVE_RANGE}vh`,
        }}
        className="pointer-events-none absolute inset-x-0 -z-10"
        aria-hidden="true"
      />
      {/* Intro proxy: "top top"→"bottom top" maps to p 0.16→0.26 */}
      <div
        ref={introTriggerRef}
        style={{
          top: `${INTRO_REVEAL_START * ACTIVE_RANGE}vh`,
          height: `${(INTRO_REVEAL_END - INTRO_REVEAL_START) * ACTIVE_RANGE}vh`,
        }}
        className="pointer-events-none absolute inset-x-0 -z-10"
        aria-hidden="true"
      />

      <animated.div
        style={{
          transform: stageTransform,
          opacity: stageOpacity,
        }}
        className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden will-change-transform"
      >
        <div className="flex w-full max-w-[24rem] flex-col items-center gap-[1.5vh] px-6 text-center md:max-w-[30rem]">
          {/* Label — same large-to-small emergence as all other sections */}
          <animated.p
            style={{
              opacity: labelOpacity,
              transform: labelTransform,
            }}
            className="eyebrow"
            aria-hidden="true"
          >
            {data.eyebrow}
          </animated.p>

          {/* H2 — letter-by-letter, driven by headingTriggerRef */}
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

          {/* Intro — letter-by-letter, starts after h2 is done */}
          <TextEngine
            tag="p"
            trigger={introTriggerRef}
            {...LETTER_REVEAL}
            start="top top"
            end="bottom top"
            className="flex flex-wrap justify-center font-body text-base font-light leading-relaxed tracking-wide text-w-muted"
          >
            {data.intro}
          </TextEngine>

          {/* Switch */}
          <animated.div
            style={{ opacity: switchOpacity }}
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
                      // Blur immediately to prevent browser scroll-to-focus from
                      // changing the document scroll position (which would shift p
                      // and replay the heading animations).
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

          {/* Gallery — cross-fades on option switch; photos reveal with stagger */}
          <Handle
            className="mt-[1vh] w-full"
            from={{ opacity: 0, y: "0.75rem" }}
            to={{ opacity: 1, y: "0rem" }}
            config={{ tension: 180, friction: 26 }}
          >
            {gallery}
          </Handle>

          {/* Per-option caption — scroll-driven reveal, text swaps on switch */}
          <animated.p
            style={{ opacity: captionOpacity }}
            className="font-body text-sm font-light tracking-wide text-w-muted"
          >
            {activeOption.caption}
          </animated.p>

          {/* Blacklisted colors */}
          <animated.div
            style={{ opacity: blacklistOpacity }}
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

      {/* Lightbox renders via createPortal — safe inside overflow-hidden */}
      <Lightbox
        images={activeOption.looks}
        index={lightboxIndex}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </ProgressTrigger>
  );
};
