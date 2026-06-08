"use client";

import { useEffect, useRef, useState } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import TextEngine from "spring-text-engine";

// Shared label spring — the gold tracked eyebrow scales/rises in on entry.
const LABEL_CONFIG = { tension: 200, friction: 28 };

// Shared letter-reveal config for the heading (same cascade across sections).
const LETTER_REVEAL = {
  mode: "once",
  letterOut: { opacity: 0, y: "0.4em" },
  letterIn: { opacity: 1, y: "0em" },
  letterConfig: { tension: 700, friction: 34 },
} as const;

const DEFAULT_HEADING_CLASS =
  "flex flex-wrap justify-center font-punch text-4xl font-normal text-w-bone md:text-5xl";

export interface SectionHeadingProps {
  /** Small gold tracked label that scales in (decorative). */
  eyebrow: string;
  /** Optional real heading revealed letter-by-letter. */
  heading?: string;
  /** Semantic level for the heading — defaults to `h2`. */
  headingTag?: "h2" | "h3";
  /**
   * Controlled reveal. When provided, the heading animates as soon as it turns
   * `true`. When omitted, an internal IntersectionObserver fires it once on
   * entry (the section drives the timing for richer cascades).
   */
  enabled?: boolean;
  /** IntersectionObserver threshold for the internal (uncontrolled) trigger. */
  threshold?: number;
  /** Delay (ms) before the heading letters begin, after the eyebrow. */
  headingDelayIn?: number;
  /** Per-letter stagger (ms) for the heading reveal. */
  headingStagger?: number;
  /** Override the heading typography (e.g. larger venue title). */
  headingClassName?: string;
}

/**
 * The shared section heading treatment — a scaling gold eyebrow label plus an
 * optional letter-by-letter heading. Built on **declarative** springs and
 * `TextEngine`: the values are diffed each render so they reliably reach (and
 * hold) the revealed state. The previous per-section imperative
 * `useSpring(() => …).api.start()` reveals were single-shot and unreliable in
 * this react-spring build (see `spring.tsx` / `in-view.tsx`), which left some
 * headings missing or un-animated and let the date panel reset to its initial
 * state on scroll-out.
 */
export const SectionHeading = ({
  eyebrow,
  heading,
  headingTag = "h2",
  enabled,
  threshold = 0.3,
  headingDelayIn = 450,
  headingStagger = 40,
  headingClassName = DEFAULT_HEADING_CLASS,
}: SectionHeadingProps) => {
  const controlled = enabled !== undefined;
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (controlled) return;
    const el = eyebrowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controlled, threshold]);

  const revealed = controlled ? enabled : inView;

  const label = useSpring({
    y: revealed ? 0 : 24,
    scale: revealed ? 1 : 2.6,
    opacity: revealed ? 1 : 0,
    config: LABEL_CONFIG,
  });

  return (
    <>
      <animated.p
        ref={eyebrowRef}
        style={{
          opacity: label.opacity,
          transform: to(
            [label.y, label.scale],
            (y, s) => `translateY(${y}vh) scale(${s})`,
          ),
        }}
        className="eyebrow"
        aria-hidden="true"
      >
        {eyebrow}
      </animated.p>

      {heading ? (
        <TextEngine
          tag={headingTag}
          {...LETTER_REVEAL}
          letterStagger={headingStagger}
          enabled={revealed}
          delayIn={headingDelayIn}
          className={headingClassName}
        >
          {heading}
        </TextEngine>
      ) : null}
    </>
  );
};
