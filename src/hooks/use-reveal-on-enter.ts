"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Shared reveal trigger line for every page section.
 *
 * `-20%` shrinks the IntersectionObserver root's bottom edge up by 20vh, so the
 * effective root is the top 80vh of the viewport. The observed element (each
 * section's heading) therefore fires `revealed` the moment its top crosses the
 * 80vh-from-top line — i.e. when the heading sits ~20vh above the fold. This is
 * the exact point the date→location panels used to reveal at (70 %-visible of a
 * viewport-height panel ⇒ centred heading at 80vh from top), now expressed as a
 * single root margin so it applies identically regardless of a section's height
 * (pinned carousel, tall dresscode, or a plain dvh panel). One trigger, one
 * timing, every section.
 */
export const REVEAL_ROOT_MARGIN = "0px 0px -20% 0px";

/**
 * Fires once when `ref`'s element rises past the shared reveal line, then
 * disconnects. Returns a boolean to gate **declarative** reveal springs (the
 * reliable pattern — single-shot `api.start()` reveals reset on re-render in
 * this react-spring build; see ADR-0030/0032).
 */
export function useRevealOnEnter<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin: string = REVEAL_ROOT_MARGIN,
): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return revealed;
}
