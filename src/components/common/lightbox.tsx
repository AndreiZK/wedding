// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animated, useTransition } from "@react-spring/web";
import Image from "next/image";

import { Spring } from "@/components/animation/springs/spring";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";

export interface LightboxImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface LightboxProps {
  images: LightboxImage[];
  /** Active image index, or `null` when closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-screen image viewer. Backdrop / Esc / close button all dismiss; arrows and
 * on-screen chevrons page through `images`. Locks Lenis scroll while open and
 * restores focus to the opener on close. Rendered through a portal so the section's
 * `overflow-hidden` never clips it.
 */
export const Lightbox = ({
  images,
  index,
  onClose,
  onIndexChange,
}: LightboxProps) => {
  const open = index !== null;
  const count = images.length;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep the last shown image rendered through the leave animation (index goes
  // null on close, so we can't read it during the exit transition).
  const [shown, setShown] = useState<{ image: LightboxImage; num: number } | null>(
    null,
  );
  useEffect(() => {
    if (index !== null) setShown({ image: images[index], num: index });
  }, [index, images]);

  const stopScroll = useScroll((s) => s.stop);
  const startScroll = useScroll((s) => s.start);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  const goPrev = useCallback(() => {
    if (index !== null) onIndexChange((index - 1 + count) % count);
  }, [index, count, onIndexChange]);
  const goNext = useCallback(() => {
    if (index !== null) onIndexChange((index + 1) % count);
  }, [index, count, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    stopScroll();
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      startScroll();
      const t = triggerRef.current as HTMLElement | null;
      if (t && typeof t.focus === "function") t.focus();
    };
  }, [open, onClose, goPrev, goNext, stopScroll, startScroll]);

  const transitions = useTransition(open, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { tension: 300, friction: 32 },
  });

  if (!mounted) return null;

  return createPortal(
    transitions((style, isOpen) =>
      isOpen && shown ? (
        <animated.div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
          style={{ opacity: style.opacity }}
          className="fixed inset-0 z-[120] flex items-center justify-center"
        >
          <div
            aria-hidden
            onMouseDown={onClose}
            className="absolute inset-0 cursor-zoom-out bg-w-ink/95 backdrop-blur-sm"
          />

          <animated.div
            style={{
              transform: style.opacity.to((o) => `scale(${0.96 + o * 0.04})`),
            }}
            className="relative z-10 flex max-h-[88vh] max-w-[92vw] items-center justify-center"
          >
            <Spring
              key={shown.num}
              mode="once"
              from={{ opacity: 0 }}
              to={{ opacity: 1 }}
              config={{ tension: 220, friction: 26 }}
            >
              <Image
                src={shown.image.src}
                alt={shown.image.alt}
                width={shown.image.width}
                height={shown.image.height}
                className="h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain ring-1 ring-w-bone/15"
                priority
              />
            </Spring>
          </animated.div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть просмотр"
            className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center text-w-bone hover:text-w-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-w-gold"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Предыдущее фото"
                className="absolute left-1 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center text-w-bone hover:text-w-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-w-gold md:left-4"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 5l-7 7 7 7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Следующее фото"
                className="absolute right-1 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center text-w-bone hover:text-w-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-w-gold md:right-4"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <p className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-sans text-xs tracking-[0.3em] text-w-bone/70">
                {shown.num + 1} / {count}
              </p>
            </>
          )}
        </animated.div>
      ) : null,
    ),
    document.body,
  );
};
