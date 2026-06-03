// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import Link from "next/link";

import { Spring } from "@/components/animation/springs/spring";
import { useIntro } from "@/hooks/use-intro";

export interface LogoMarkProps {
  className?: string;
}

/**
 * The "A&U" monogram — Unbounded for the letters, Caveat for the ampersand.
 * Presentational only (decorative `aria-hidden`); wrap it in a labelled element.
 */
export const LogoMark = ({ className }: LogoMarkProps) => (
  <span
    aria-hidden="true"
    className={`font-punch font-semibold leading-none ${className ?? ""}`}
  >
    <span className="text-w-bone">A</span>
    <span className="px-[0.06em] font-hand text-w-gold">&amp;</span>
    <span className="text-w-bone">U</span>
  </span>
);

/**
 * Corner logo fixed in the top-left; links back to the top. Waits for the intro
 * preloader to begin its exit (`useIntro.done`), then slides in with a spring so
 * its entrance is synchronised with the veil fade-out.
 */
export const SiteLogo = () => {
  const introDone = useIntro((s) => s.done);
  if (!introDone) return null;

  return (
    <Spring
      tag="div"
      mode="once"
      from={{ opacity: 0, y: -10 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 140, friction: 22 }}
      className="fixed left-[1.75rem] top-[1.5rem] z-40"
    >
      <Link
        href="/"
        aria-label="Андрей и Ульяна — наверх"
        className="block text-2xl drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]"
      >
        <LogoMark />
      </Link>
    </Spring>
  );
};
