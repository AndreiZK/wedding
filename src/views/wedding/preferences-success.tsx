"use client";

import { easings } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import { Spring } from "@/components/animation/springs/spring";
import type { PreferencesContent } from "@/data/mocks/preferences";

export interface PreferencesSuccessProps {
  content: PreferencesContent["success"];
}

/**
 * Post-submit confirmation for the guest preferences form. Card treatment
 * matches the calendar / map panels; motion is spring-based on mount.
 */
export const PreferencesSuccess = ({ content }: PreferencesSuccessProps) => {
  return (
    <Spring
      tag="div"
      mode="once"
      from={{ opacity: 0, y: 20 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 120, friction: 22 }}
      className="mt-6 flex w-full flex-col items-center"
      aria-live="polite"
    >
      <div className="flex w-full max-w-[26rem] flex-col items-center gap-5 border border-w-bone/15 bg-w-ink-2 px-8 py-10 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]">
        <span className="eyebrow text-w-gold" aria-hidden="true">
          {content.eyebrow}
        </span>

        <TextEngine
          tag="p"
          mode="once"
          seo={false}
          letterIn={{ opacity: 1, y: "0em" }}
          letterOut={{ opacity: 0, y: "0.3em" }}
          letterConfig={{ tension: 600, friction: 32 }}
          letterStagger={42}
          delayIn={260}
          className="flex flex-wrap justify-center font-hand text-4xl italic text-w-gold"
          aria-hidden="true"
        >
          {content.heading}
        </TextEngine>

        <p className="sr-only">
          {content.heading}. {content.body}
        </p>

        <TextEngine
          tag="p"
          mode="once"
          wordIn={{ opacity: 1, y: 0 }}
          wordOut={{ opacity: 0, y: 10 }}
          wordStagger={38}
          wordConfig={{ duration: 680, easing: easings.easeOutQuart }}
          delayIn={480}
          className="flex max-w-[22rem] flex-wrap justify-center text-center font-body text-sm font-light leading-relaxed text-w-muted"
          aria-hidden="true"
        >
          {content.body}
        </TextEngine>
      </div>
    </Spring>
  );
};
