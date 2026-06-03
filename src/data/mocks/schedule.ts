export interface ScheduleEntry {
  /** Display time, e.g. "16:00". */
  time: string;
  title: string;
  note: string;
}

export interface ScheduleData {
  eyebrow: string;
  heading: string;
  entries: ScheduleEntry[];
}

export const scheduleMock: ScheduleData = {
  eyebrow: "Программа",
  heading: "Расписание дня",
  entries: [
    {
      time: "15:30",
      title: "Сбор гостей",
      note: "встречаем самых близких с бокалом игристого",
    },
    {
      time: "16:00",
      title: "Фуршет",
      note: "лёгкие закуски и время для тёплых разговоров",
    },
    {
      time: "17:00",
      title: "Церемония",
      note: "момент, ради которого мы все собрались",
    },
    {
      time: "18:30",
      title: "Ужин",
      note: "праздничный банкет и поздравления",
    },
    {
      time: "21:00",
      title: "Вечеринка",
      note: "первый танец и музыка до самой ночи",
    },
  ],
};
