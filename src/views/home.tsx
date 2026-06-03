import { dateLocationMock } from "@/data/mocks/date-location";
import { dresscodeMock } from "@/data/mocks/dresscode";
import { heroMock } from "@/data/mocks/hero";
import { preferencesMock } from "@/data/mocks/preferences";
import { scheduleMock } from "@/data/mocks/schedule";
import { DateLocationSection } from "@/views/wedding/date-location-section";
import { DresscodeSection } from "@/views/wedding/dresscode-section";
import { HeroSection } from "@/views/wedding/hero-section";
import { PreferencesSection } from "@/views/wedding/preferences-section";
import { ScheduleSection } from "@/views/wedding/schedule-section";

export const HomeView = () => {
  return (
    <main className="relative bg-w-ink">
      <HeroSection data={heroMock} />
      {/*
        Parallax handoff: the post-hero content is pulled up over the hero's exit
        tail (`-mt-[100vh]`) and stacked above it (`z-20`), so it slides out from
        underneath the hero — the marquet.nyc effect. The hero stage drifts up at
        0.5× while this rises at 1× (constant differential); the overlap is sized so
        this panel *fully* covers the viewport exactly at the hero's pin-end, so the
        parallax never degrades into same-speed motion. A soft top shadow reads as a
        sheet sliding over. No `overflow`/`transform` here on purpose: either would
        break the `position: sticky` pins inside the sections below.
      */}
      <div className="relative z-20 -mt-[100vh] bg-w-ink shadow-[0_-2.5rem_5rem_rgba(8,6,5,0.6)]">
        <DateLocationSection data={dateLocationMock} />
        {/*
          Schedule applies its own -mt-[100vh] internally (same zero-gap pattern as
          the location pin inside DateLocationSection): schedule pin starts the moment
          the location pin ends, no dead scroll between them.

          Dresscode pulls up over schedule's exit tail (-mt-[50vh]).
          Math: schedule h-[600vh] (N=5), active=500vh; mt = 600−(0.9×500+100) = 50vh.
        */}
        {/*
          Schedule + Dresscode both apply their own -mt-[100vh] internally
          (zero-gap pattern — each pin starts the moment the previous ends).

          Preferences pulls up over the dresscode exit tail (-mt-[72vh]).
          Math: dresscode h-[700vh], active=600vh;
          mt = 700 − (0.88×600 + 100) = 700 − 628 = 72vh.
        */}
        <ScheduleSection data={scheduleMock} />
        <DresscodeSection data={dresscodeMock} />
        {/*
          -mt-[100vh]: standard zero-gap parallax handoff.
          Dresscode drifts at 0.5× while preferences rises at 1× — same differential
          as hero→content (ADR-0015). Preferences fully covers the viewport at pin-end.
        */}
        <div className="-mt-[100vh] bg-w-ink shadow-[0_-2.5rem_5rem_rgba(8,6,5,0.6)]">
          <PreferencesSection content={preferencesMock} />
        </div>
      </div>
    </main>
  );
};
