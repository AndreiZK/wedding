export interface DateLocationData {
  date: {
    eyebrow: string;
    weekday: string;
    /** Day-of-month. */
    day: string;
    /** Month name (genitive case) — for the written-out date / SEO heading. */
    month: string;
    year: string;
    /** Supporting line, e.g. gathering time. */
    note: string;
    /** Machine-readable ISO date for `<time dateTime>` and the calendar grid. */
    iso: string;
  };
  location: {
    eyebrow: string;
    venue: string;
    /** City line, revealed after the venue. */
    city: string;
    /** Street line, revealed after the city. */
    street: string;
    /** Venue coordinates for the Google Maps JS API marker + centre. */
    lat: number;
    lng: number;
    /** Initial map zoom. */
    zoom: number;
    /** Accessible name for the map. */
    mapTitle: string;
  };
}

export const dateLocationMock: DateLocationData = {
  date: {
    eyebrow: "когда?",
    weekday: "четверг",
    day: "16",
    month: "июля",
    year: "2026",
    note: "сбор гостей в 15:30",
    iso: "2026-07-16T15:30",
  },
  location: {
    eyebrow: "где?",
    venue: "River Hall",
    city: "Гродно",
    street: "Подольная, 23",
    // Approximate Grodno coordinates — replace lat/lng with River Hall's exact
    // location when confirmed.
    lat: 53.6715078842098,
    lng: 23.83334850835446,
    zoom: 15,
    mapTitle: "Карта — River Hall, Гродно",
  },
};
