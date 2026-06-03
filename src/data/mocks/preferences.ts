export interface PreferencesContent {
  eyebrow: string;
  heading: string;
  intro: string;
  /** Reinforces that the whole form is optional. */
  optionalNote: string;
  fields: {
    nameLabel: string;
    namePlaceholder: string;
    drinkingLabel: string;
    allergiesLabel: string;
    allergiesPlaceholder: string;
    preferencesLabel: string;
    preferencesPlaceholder: string;
  };
  submitLabel: string;
  submittingLabel: string;
  errorRetryLabel: string;
  success: {
    heading: string;
    body: string;
  };
  organizerNote: string;
  organizerPhone: string;
  closing: string;
}

export const preferencesMock: PreferencesContent = {
  eyebrow: "Анкета гостя",
  heading: "Несколько деталей",
  intro:
    "Заполнение по желанию — это поможет нам сделать вечер уютнее именно для вас.",
  optionalNote: "Все поля необязательны.",
  fields: {
    nameLabel: "Как вас зовут?",
    namePlaceholder: "Имя и фамилия",
    drinkingLabel: "Планирую употреблять алкоголь",
    allergiesLabel: "Аллергии и ограничения в еде",
    allergiesPlaceholder: "Например: орехи, лактоза…",
    preferencesLabel: "Пожелания",
    preferencesPlaceholder:
      "Музыка, рассадка, что угодно — поделитесь с нами",
  },
  submitLabel: "Отправить",
  submittingLabel: "Отправляем…",
  errorRetryLabel: "Отправить ещё раз",
  success: {
    heading: "Спасибо!",
    body: "Мы получили ваши пожелания и обязательно их учтём.",
  },
  organizerNote:
    "Если вдруг хотите сделать какой-то сюрприз, и нужно встроить это в программу, вот контакт организатора:",
  organizerPhone: "+7 (029) 000-00-00",
  closing: "Будем рады вас видеть!",
};
