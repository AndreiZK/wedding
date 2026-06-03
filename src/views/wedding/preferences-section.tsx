"use client";

import { useRef, useState } from "react";
import { easings } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import { Spring } from "@/components/animation/springs/spring";
import { SpringTrigger } from "@/components/animation/springs/spring-trigger";
import type { PreferencesContent } from "@/data/mocks/preferences";
import { useSubmitPreferences } from "@/hooks/use-submit-preferences";

export interface PreferencesSectionProps {
  content: PreferencesContent;
}

const FIELD_INPUT =
  "w-full bg-transparent border-b border-w-bone/20 py-3 font-body text-w-bone placeholder:text-w-muted/50 focus:border-w-gold focus:outline-none";
const FIELD_LABEL =
  "font-sans text-xs uppercase tracking-[0.18em] text-w-muted";

// All section-triggered animations use start="top bottom" / end="center bottom"
// so they fire when section centre hits viewport bottom ≈ 40–50 % visible.
// sectionRef is stable (no transform on it) → no getBoundingClientRect feedback loop.
const TRIGGER_START = "top bottom" as const;
const TRIGGER_END = "center bottom" as const;

export const PreferencesSection = ({ content }: PreferencesSectionProps) => {
  const { fields } = content;
  const { status, error, submit } = useSubmitPreferences();
  const sectionRef = useRef<HTMLElement>(null);

  const [name, setName] = useState("");
  const [drinking, setDrinking] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [preferences, setPreferences] = useState("");

  const submitting = status === "submitting";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({
      name: name.trim() || undefined,
      drinking,
      allergies: allergies.trim() || undefined,
      preferences: preferences.trim() || undefined,
    });
  };

  return (
    <section
      ref={sectionRef}
      id="preferences"
      aria-label="Анкета гостя"
      className="relative w-full overflow-hidden bg-w-ink"
    >
      <div className="mx-auto flex max-w-[34rem] flex-col items-center gap-5 px-8 pt-[5.5rem] pb-[5rem] text-center">
        {/*
          Eyebrow uses its own position as trigger (standard section-entry pattern).
          H2 + intro switch to trigger={sectionRef} mode="progress" to avoid the
          IntersectionObserver early-fire caused by -mt-[100vh] on the wrapper in
          home.tsx (section is in the DOM viewport before it is visually revealed).
        */}
        <SpringTrigger
          tag="p"
          mode="toggle"
          start={TRIGGER_START}
          end={TRIGGER_END}
          from={{ scale: 2.6, opacity: 0 }}
          to={{ scale: 1, opacity: 1 }}
          config={{ tension: 200, friction: 28 }}
          className="eyebrow"
        >
          {content.eyebrow}
        </SpringTrigger>

        <TextEngine
          tag="h2"
          mode="progress"
          type="toggle"
          trigger={sectionRef}
          start={TRIGGER_START}
          end={TRIGGER_END}
          letterOut={{ opacity: 0, y: "0.4em" }}
          letterIn={{ opacity: 1, y: "0em" }}
          letterConfig={{ tension: 700, friction: 34 }}
          delayIn={200}
          className="flex flex-wrap justify-center font-punch text-4xl font-normal text-w-bone md:text-5xl"
        >
          {content.heading}
        </TextEngine>

        <TextEngine
          tag="p"
          mode="progress"
          type="toggle"
          trigger={sectionRef}
          start={TRIGGER_START}
          end={TRIGGER_END}
          wordIn={{ y: 0, opacity: 1 }}
          wordOut={{ y: 14, opacity: 0 }}
          wordStagger={26}
          wordConfig={{ duration: 720, easing: easings.easeOutQuart }}
          delayIn={380}
          className="max-w-[30rem] font-body text-base font-light leading-relaxed tracking-wide text-w-muted"
        >
          {content.intro}
        </TextEngine>

        {status === "success" ? (
          <Spring
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
            config={{ tension: 90, friction: 20 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <span className="font-hand text-3xl italic text-w-gold">
              {content.success.heading}
            </span>
            <p className="max-w-[24rem] font-body text-sm font-light text-w-muted">
              {content.success.body}
            </p>
          </Spring>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 flex w-full flex-col gap-7 text-left"
          >
            <SpringTrigger
              tag="div"
              mode="toggle"
              trigger={sectionRef}
              start={TRIGGER_START}
              end={TRIGGER_END}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              config={{ tension: 200, friction: 28 }}
              delayIn={600}
              className="flex flex-col gap-2"
            >
              <label htmlFor="pref-name" className={FIELD_LABEL}>
                {fields.nameLabel}
              </label>
              <input
                id="pref-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fields.namePlaceholder}
                className={FIELD_INPUT}
              />
            </SpringTrigger>

            <SpringTrigger
              tag="div"
              mode="toggle"
              trigger={sectionRef}
              start={TRIGGER_START}
              end={TRIGGER_END}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              config={{ tension: 200, friction: 28 }}
              delayIn={700}
            >
              <label className="flex cursor-pointer select-none items-center gap-3">
                <input
                  type="checkbox"
                  name="drinking"
                  checked={drinking}
                  onChange={(e) => setDrinking(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center border border-w-bone/30 peer-checked:border-w-gold peer-checked:bg-w-gold peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-w-gold"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.5l2.5 2.5 4.5-5"
                      stroke="var(--w-ink)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="font-body text-sm text-w-bone">
                  {fields.drinkingLabel}
                </span>
              </label>
            </SpringTrigger>

            <SpringTrigger
              tag="div"
              mode="toggle"
              trigger={sectionRef}
              start={TRIGGER_START}
              end={TRIGGER_END}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              config={{ tension: 200, friction: 28 }}
              delayIn={800}
              className="flex flex-col gap-2"
            >
              <label htmlFor="pref-allergies" className={FIELD_LABEL}>
                {fields.allergiesLabel}
              </label>
              <input
                id="pref-allergies"
                name="allergies"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={fields.allergiesPlaceholder}
                className={FIELD_INPUT}
              />
            </SpringTrigger>

            <SpringTrigger
              tag="div"
              mode="toggle"
              trigger={sectionRef}
              start={TRIGGER_START}
              end={TRIGGER_END}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              config={{ tension: 200, friction: 28 }}
              delayIn={900}
              className="flex flex-col gap-2"
            >
              <label htmlFor="pref-notes" className={FIELD_LABEL}>
                {fields.preferencesLabel}
              </label>
              <textarea
                id="pref-notes"
                name="preferences"
                rows={4}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder={fields.preferencesPlaceholder}
                className={`${FIELD_INPUT} resize-none`}
              />
            </SpringTrigger>

            {error ? (
              <p role="alert" className="font-body text-sm text-w-clay">
                {error}
              </p>
            ) : null}

            <SpringTrigger
              tag="div"
              mode="toggle"
              trigger={sectionRef}
              start={TRIGGER_START}
              end={TRIGGER_END}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              config={{ tension: 200, friction: 28 }}
              delayIn={1000}
              className="mt-1 flex flex-col items-center"
            >
              <button
                type="submit"
                disabled={submitting}
                className="border border-w-gold px-9 py-3 font-sans text-xs uppercase tracking-[0.22em] text-w-gold hover:bg-w-gold hover:text-w-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-w-gold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? content.submittingLabel
                  : status === "error"
                    ? content.errorRetryLabel
                    : content.submitLabel}
              </button>
            </SpringTrigger>
          </form>
        )}

        {/* Organizer contact — mode="forward" so each element fires when the user
            actually scrolls to it, not off-screen via the section trigger */}
        <div className="mt-4 flex w-full flex-col items-center gap-3 text-center">
          <TextEngine
            tag="p"
            mode="forward"
            wordIn={{ y: 0, opacity: 1 }}
            wordOut={{ y: 8, opacity: 0 }}
            wordStagger={20}
            wordConfig={{ duration: 600, easing: easings.easeOutQuart }}
            className="flex flex-wrap justify-center max-w-[28rem] font-body text-sm font-light leading-relaxed text-w-muted"
          >
            {content.organizerNote}
          </TextEngine>
          <a
            href={`tel:${content.organizerPhone.replace(/\D/g, "")}`}
            className="font-sans text-sm tracking-[0.18em] text-w-bone hover:text-w-gold"
          >
            <TextEngine
              tag="span"
              mode="forward"
              letterIn={{ opacity: 1, y: "0em" }}
              letterOut={{ opacity: 0, y: "0.3em" }}
              letterConfig={{ tension: 600, friction: 32 }}
              delayIn={280}
            >
              {content.organizerPhone}
            </TextEngine>
          </a>
        </div>

        {/* Closing line */}
        <TextEngine
          tag="p"
          mode="forward"
          wordIn={{ y: 0, opacity: 1 }}
          wordOut={{ y: 14, opacity: 0 }}
          wordStagger={80}
          wordConfig={{ duration: 800, easing: easings.easeOutQuart }}
          className="font-hand text-2xl italic text-w-gold"
        >
          {content.closing}
        </TextEngine>
      </div>
    </section>
  );
};
