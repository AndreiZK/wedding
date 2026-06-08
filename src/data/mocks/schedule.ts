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
      note: "Игристое, легкие закуски и тёплые разговоры",
    },
    {
      time: "16:00",
      title: "Свадебная церемония",
      note: "Момент, ради которого мы все собрались",
    },
    {
      time: "17:00",
      title: "Праздничный ужин",
      note: "Вкусная еда, ненавязчивые активности и поздравления",
    },
    {
      time: "21:00",
      title: "Вечеринка",
      note: "Музыка, танцы и разговоры до самой ночи",
    },
  ],
};
