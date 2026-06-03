"use client";

import { animated, type SpringValue } from "@react-spring/web";

export interface CalendarFlipProps {
  /** Scroll progress (0→1) for the whole pinned date timeline. */
  p: SpringValue<number>;
  /** ISO date — drives the month range, grids, and the highlighted day. */
  iso: string;
  /** How many months to flip through (ending on the target month). */
  count?: number;
}

const RU_MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
] as const;
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

// Timeline windows within the section's progress.
const FLIP_START = 0.18;
const FLIP_END = 0.56;
const DRAW_START = 0.58;
const DRAW_END = 0.7;

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

interface MonthView {
  name: string;
  year: number;
  cells: (number | null)[];
}

/** Monday-first 6-row (42-cell) grid for a given month. */
function monthCells(year: number, month: number): (number | null)[] {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/**
 * A calendar that **flips through months** (e.g. April → July) as the pinned date
 * section is scrolled, then **draws a gold ring** around the target day. Each month
 * is a stacked card that flips like a real wall-calendar page bound at the top —
 * its bottom edge lifts toward the viewer and arcs over the top axis (`rotateX 0 →
 * +100°`, top `transformOrigin`, container `perspective`, `backfaceVisibility:
 * hidden`) to reveal the next; the last card's ring is an SVG loop with
 * `pathLength={1}` whose `strokeDashoffset` animates `1 → 0`. Driven entirely by
 * the `p` progress value.
 */
export const CalendarFlip = ({ p, iso, count = 4 }: CalendarFlipProps) => {
  const target = new Date(iso);
  const year = target.getFullYear();
  const targetMonth = target.getMonth();
  const highlight = target.getDate();
  const steps = count - 1;

  const months: MonthView[] = [];
  for (let k = 0; k < count; k += 1) {
    const d = new Date(year, targetMonth - steps + k, 1);
    months.push({
      name: cap(RU_MONTHS[d.getMonth()]),
      year: d.getFullYear(),
      cells: monthCells(d.getFullYear(), d.getMonth()),
    });
  }

  const wrapOpacity = p.to([0, 0.08, 0.16], [0, 0, 1]);
  const ringOffset = p.to(
    (v) => 1 - clamp((v - DRAW_START) / (DRAW_END - DRAW_START), 0, 1),
  );

  return (
    <animated.div
      style={{ opacity: wrapOpacity, perspective: "1000px" }}
      className="relative h-[22rem] w-full max-w-[20rem]"
    >
      {months.map((mv, i) => {
        const flipped = (v: number) =>
          clamp((v - FLIP_START) / (FLIP_END - FLIP_START), 0, 1) * steps - i;
        // Real wall-calendar page turn (bound at the top): the bottom edge lifts
        // **toward the viewer** (positive rotateX about the top axis) and arcs up
        // and **over the top**, past vertical, where backface-hidden retires it to
        // reveal the next month beneath. (A negative rotateX would push the bottom
        // away from the viewer — the old, unrealistic "fall back" motion.)
        // ~100°: the page sweeps from flat → toward-viewer → just over vertical
        // (where backface-hidden retires it). Past ~90° is invisible anyway, so a
        // larger angle would only add dead scroll before the next page starts.
        const rotateX = p.to((v) => {
          const local = flipped(v);
          return local <= 0 ? 0 : Math.min(local, 1) * 100;
        });
        const isTarget = i === count - 1;

        return (
          <animated.div
            key={mv.name}
            style={{
              rotateX,
              zIndex: count - i,
              transformOrigin: "top center",
              backfaceVisibility: "hidden",
            }}
            className="absolute inset-0 flex flex-col border border-w-bone/15 bg-w-ink-2 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="mb-3 flex items-baseline justify-between border-b border-w-bone/10 pb-2">
              <span className="font-hand text-2xl italic text-w-gold">{mv.name}</span>
              <span className="font-sans text-sm tracking-[0.2em] text-w-muted">{mv.year}</span>
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((wd) => (
                <span
                  key={wd}
                  className="font-sans text-[0.62rem] uppercase tracking-[0.1em] text-w-muted/70"
                >
                  {wd}
                </span>
              ))}
            </div>

            <div className="grid flex-1 grid-cols-7 content-start">
              {mv.cells.map((day, ci) =>
                day === null ? (
                  <span key={`b-${ci}`} aria-hidden="true" className="h-9" />
                ) : isTarget && day === highlight ? (
                  <span
                    key={day}
                    className="relative flex h-9 items-center justify-center font-sans text-base font-semibold text-w-bone"
                  >
                    {day}
                    <svg
                      viewBox="0 0 100 100"
                      fill="none"
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[175%] -translate-x-1/2 -translate-y-1/2 -rotate-[8deg] overflow-visible"
                    >
                      <animated.path
                        d="M16,52 C16,33 38,25 54,26 C74,27 86,38 84,52 C82,67 60,76 44,74 C26,72 17,60 20,46"
                        stroke="var(--w-gold)"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={ringOffset}
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    key={day}
                    className="flex h-9 items-center justify-center font-sans text-base text-w-muted"
                  >
                    {day}
                  </span>
                ),
              )}
            </div>
          </animated.div>
        );
      })}
    </animated.div>
  );
};
