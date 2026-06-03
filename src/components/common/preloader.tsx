// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import NextImage from "next/image";

import { useIntro } from "@/hooks/use-intro";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";

export interface PreloaderProps {
  /** Hero image to warm before the intro releases. */
  image: string;
  /** Minimum on-screen time (ms). */
  minMs?: number;
  /** Veil fade-out duration (ms). */
  exitMs?: number;
}

/** Warm palette backdrop, matching the hero stage. */
const VEIL_BG =
  "radial-gradient(48% 40% at 50% 46%, color-mix(in srgb, var(--w-clay) 22%, transparent), transparent 72%)," +
  "radial-gradient(130% 100% at 50% 24%, var(--w-ink-2), var(--w-ink) 72%)";

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Spinner rotation speed in degrees per second. */
const SPIN_DEG_PER_SEC = 480;

/**
 * Intro preloader. Holds a full-screen veil with a spinning image while the hero
 * preloads; stays up at least `minMs`. On release the veil fades out via rAF
 * (same reason as before: standalone react-spring is disposed by StrictMode —
 * see [[decisions-log]] ADR-0014). Spinner rotation is applied directly to the
 * DOM ref to avoid per-frame React re-renders.
 */
export const Preloader = ({ image, minMs = 2400, exitMs = 600 }: PreloaderProps) => {
  const [start, stop] = useScroll(useShallow((s) => [s.start, s.stop]));
  const setIntroDone = useIntro((s) => s.setDone);

  const [done, setDone] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const imgLoaded = useRef(false);
  const minDone = useRef(false);
  const released = useRef(false);

  const runExit = useCallback(() => {
    // Signal logo to start its own enter animation while the veil fades.
    setIntroDone(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const e = Math.min((now - t0) / exitMs, 1);
      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = String(1 - easeOutCubic(e));
      }
      if (e >= 1) {
        setDone(true);
        start();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [exitMs, start, setIntroDone]);

  const tryRelease = useCallback(() => {
    if (released.current || !imgLoaded.current || !minDone.current) return;
    released.current = true;
    runExit();
  }, [runExit]);

  // Lock scroll while the intro is up.
  useEffect(() => {
    stop();
    return () => start();
  }, [start, stop]);

  // Preload the hero image (don't hang on error).
  useEffect(() => {
    const img = new Image();
    const finish = () => {
      imgLoaded.current = true;
      tryRelease();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = image;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [image, tryRelease]);

  // Min-time gate + spinner rotation — single rAF loop, DOM-direct for perf.
  useEffect(() => {
    const t0 = performance.now();
    let lastTime = t0;
    let angle = 0;
    let minFired = false;
    let raf = 0;

    const tick = (now: number) => {
      angle += SPIN_DEG_PER_SEC * ((now - lastTime) / 1000);
      lastTime = now;
      if (spinnerRef.current) {
        spinnerRef.current.style.transform = `rotate(${angle}deg)`;
      }
      if (!minFired && now - t0 >= minMs) {
        minFired = true;
        minDone.current = true;
        tryRelease();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [minMs, tryRelease]);

  if (done) return null;

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-100"
      role="status"
      aria-live="polite"
      aria-label="Загрузка"
    >
      <div
        style={{ backgroundImage: VEIL_BG }}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={spinnerRef} className="size-20">
          <NextImage
            src="/assets/loader/savka.png"
            alt=""
            width={80}
            height={80}
            priority
            aria-hidden="true"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};
