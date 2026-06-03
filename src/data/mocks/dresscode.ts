export type DresscodeOptionId = "male" | "female";

export interface DresscodeLook {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface DresscodeOption {
  id: DresscodeOptionId;
  /** Switch label, e.g. "Для него". */
  label: string;
  /** Short guidance shown with the gallery. */
  caption: string;
  looks: DresscodeLook[];
}

export interface BlacklistedColor {
  hex: string;
  label: string;
}

export interface DresscodeData {
  eyebrow: string;
  heading: string;
  intro: string;
  switchLabel: string;
  blacklistCaption: string;
  blacklistedColors: BlacklistedColor[];
  /** Male first — the default selection. */
  options: DresscodeOption[];
}

export const dresscodeMock: DresscodeData = {
  eyebrow: "Дресс-код",
  heading: "Образ вечера",
  intro:
    "Классический стиль без лишней строгости — чтобы вам было комфортно и уютно с нами весь вечер.",
  switchLabel: "Выберите образ",
  blacklistCaption: "нежелательные цвета",
  blacklistedColors: [
    { hex: "#c0392b", label: "красный" },
    { hex: "#0a0a0a", label: "чёрный" },
    { hex: "#f0efec", label: "белый" },
  ],
  options: [
    {
      id: "male",
      label: "Для него",
      caption: "Костюм в спокойных тонах. Галстук — по желанию.",
      looks: [
        {
          src: "/assets/dresscode/male-1.jpg",
          alt: "Образ для него — вариант 1",
          width: 700,
          height: 900,
        },
        {
          src: "/assets/dresscode/male-2.jpg",
          alt: "Образ для него — вариант 2",
          width: 700,
          height: 900,
        },
        {
          src: "/assets/dresscode/male-3.jpg",
          alt: "Образ для него — вариант 3",
          width: 700,
          height: 900,
        },
      ],
    },
    {
      id: "female",
      label: "Для неё",
      caption: "Платье или элегантный комплект в тёплой палитре.",
      looks: [
        {
          src: "/assets/dresscode/female-1.jpg",
          alt: "Образ для неё — вариант 1",
          width: 700,
          height: 900,
        },
        {
          src: "/assets/dresscode/female-2.jpg",
          alt: "Образ для неё — вариант 2",
          width: 700,
          height: 900,
        },
        {
          src: "/assets/dresscode/female-3.jpg",
          alt: "Образ для неё — вариант 3",
          width: 700,
          height: 900,
        },
      ],
    },
  ],
};
