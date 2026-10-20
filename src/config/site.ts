/**
 * Business configuration. Edit freely.
 * Contact details (WhatsApp / Telegram / phone) are NOT stored here — they come from
 * environment variables, see src/lib/contacts.ts and .env.example.
 */
export const siteConfig = {
  name: "Albert Ermekov",
  role: "Профессиональный бариста и кофейный консультант",
  title: "Albert Ermekov — бариста и кофейный консультант",
  description:
    "Альберт Ермеков — профессиональный бариста с 4-летним опытом. Обучение бариста, каппинг, латте-арт, открытие кофейных баров под ключ и индивидуальные консультации.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ru_RU",
  experienceYears: 4,
  workplaces: ["INvictus", "Кофе Бум", "Мастер Кофе", "Дискавери"],
} as const;

/**
 * Booking schedule. SAMPLE VALUES — replace with Albert's real availability.
 * Weekdays: 0 = Sunday ... 6 = Saturday.
 */
export const scheduleConfig = {
  timezone: process.env.NEXT_PUBLIC_TIMEZONE ?? "Asia/Almaty",
  workingWeekdays: [1, 2, 3, 4, 5, 6] as number[],
  /** Earliest bookable date = today + leadDays */
  leadDays: 1,
  /** Latest bookable date = today + maxAdvanceDays */
  maxAdvanceDays: 90,
  /** Specific dates (YYYY-MM-DD) that are closed */
  closedDates: [] as string[],
  timeSlots: [
    { id: "10:00-12:00", label: "10:00–12:00" },
    { id: "12:00-14:00", label: "12:00–14:00" },
    { id: "14:00-16:00", label: "14:00–16:00" },
    { id: "16:00-18:00", label: "16:00–18:00" },
  ],
};

export const WEEKDAY_SHORT_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
