"use client";

/**
 * Adaptive scaling grid hook.
 *
 * Scales the root (`<html>`) font-size up while the viewport is wider than
 * `baseWidth`, so a rem-based layout keeps growing proportionally on large
 * displays. At or below `baseWidth` the inline font-size is cleared and the
 * `vw` media queries in `globals.css` take over.
 *
 * 📖 Docs: obsidian/frontend/hooks.md
 */

import { useCallback, useEffect } from "react";

import { useResizeLoop } from "@/hooks/animation/user-resize-loop";

/** Root font-size (px) the design is measured against. */
const FONT_BASE = 16;

/**
 * Desktop legibility boost — must match the 1.25× factor baked into the `vw`
 * media queries in `globals.css`. Applied to the scale-UP range (> baseWidth)
 * so the root font-size is continuous across the baseWidth boundary instead of
 * snapping back to the un-boosted size on very large monitors. See ADR-0033.
 */
const DESKTOP_BOOST = 1.25;

export interface UseAdaptiveGridOptions {
  /** Viewport width (px) above which the root font-size scales up. */
  baseWidth: number;
  /** Damping factor (0–1) for the scale-up; 1 = fully proportional. */
  coef?: number;
}

/**
 * Interpolates a font-size for `windowWidth` relative to `baseWidth`. `coef`
 * damps the effect: at 1 the size tracks the viewport 1:1, at 0 it stays flat.
 */
export const interpolateFontSize = (
  baseFontSize: number,
  baseWidth: number,
  windowWidth: number,
  coef = 0.5,
): number => {
  const widthReduction = ((baseWidth - windowWidth) / baseWidth) * 100;
  const fontReduction = widthReduction * coef;
  return baseFontSize - (baseFontSize * fontReduction) / 100;
};

export const useAdaptiveGrid = ({
  baseWidth,
  coef = 0.6666,
}: UseAdaptiveGridOptions): void => {
  const apply = useCallback(() => {
    const root = document.documentElement;
    const size =
      interpolateFontSize(FONT_BASE, baseWidth, window.innerWidth, coef) *
      DESKTOP_BOOST;
    const floor = FONT_BASE * DESKTOP_BOOST;

    if (size > floor) {
      root.style.setProperty("font-size", `${size}px`);
    } else {
      // At/below the base width, let the `vw` media queries in globals.css drive
      // (they already carry the same DESKTOP_BOOST, so the size is continuous).
      root.style.removeProperty("font-size");
    }
  }, [baseWidth, coef]);

  useEffect(() => {
    apply();
  }, [apply]);

  useResizeLoop(apply);
};
