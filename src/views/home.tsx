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
        Parallax handoff: content is pulled up 100 vh over the hero's exit tail
        so it slides out from underneath the hero — the marquet effect. A soft
        shadow reads as a sheet sliding over. No overflow/transform here:
        either would break position:sticky inside HeroSection and ScheduleSection.
      */}
      <div className="relative z-20 -mt-[100vh] bg-w-ink shadow-[0_-2.5rem_5rem_rgba(8,6,5,0.6)]">
        {/*
          Date & Location: two natural-height (h-dvh) panels. The location panel
          uses -mt-[20vh] internally so it peeks over the date panel's exit.
          The schedule uses -mt-[20vh] at the section level below.
        */}
        <DateLocationSection data={dateLocationMock} />
        {/*
          Schedule: scroll-pinned (n×80+60 vh for n=5 = 460 vh). Uses its own
          -mt-[20vh] internally. Dresscode overlaps the schedule exit with -mt-[20vh];
          the schedule's exit parallax is locked to that 20vh overlap (see ADR-0032).
        */}
        <ScheduleSection data={scheduleMock} />
        {/*
          Dresscode: natural height, -mt-[20vh] is applied inside DresscodeSection.
          PreferencesSection gets the same -mt-[20vh] overlap.
        */}
        <DresscodeSection data={dresscodeMock} />
        <div className="-mt-[20vh] bg-w-ink shadow-[0_-2.5rem_5rem_rgba(8,6,5,0.6)]">
          <PreferencesSection content={preferencesMock} />
        </div>
      </div>
    </main>
  );
};
