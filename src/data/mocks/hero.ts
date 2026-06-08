export interface HeroImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface HeroData {
  /** Centre image — starts small, grows to fill the screen as the user scrolls. */
  image: HeroImage;
  /** Handwritten kicker note shown above the main headline. */
  kicker: string;
  /** Headline above the image; first word = dark, rest = brass. Slides up & blurs as image grows. */
  topText: string;
  /** Headline below the image; slides down & blurs out as the image grows. */
  bottomText: string;
  /** Real, visually-hidden page heading (the visible headlines are decorative). */
  heading: string;
  /** Invitation paragraph that fades in over the full-screen image near the end. */
  paragraph: string;
}

export const heroMock: HeroData = {
  image: {
    src: "/assets/hero/hero-main.webp",
    alt: "Андрей и Ульяна",
    width: 4284,
    height: 5712,
  },
  kicker: "наконец-то...",
  topText: "МЫ ЖЕНИМСЯ!",
  bottomText: "приходите посмотреть",
  heading: "Андрей и Ульяна — мы женимся! Приходите посмотреть",
  paragraph:
    "Мы собираем самых близких людей, чтобы отметить день рождения нашей семьи. Будем счастливы видеть вас рядом.",
};
