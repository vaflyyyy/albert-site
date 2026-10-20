import { scheduleConfig } from "@/config/site";
import { content } from "@/content";

export const CONTACT_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "phone", label: "Звонок" },
] as const;

export type ContactChannel = (typeof CONTACT_CHANNELS)[number]["id"];

/** Wire format of POST /api/bookings (snake_case on purpose — matches the booking spec). */
export interface BookingPayload {
  name: string;
  phone: string;
  service: string;
  preferred_date: string; // YYYY-MM-DD
  time_slot: string;
  comment: string;
  contact_channel: ContactChannel;
}

export type BookingField = keyof BookingPayload;
export type BookingErrors = Partial<Record<BookingField, string>>;
export const BOOKING_FIELD_ORDER: BookingField[] = [
  "name",
  "phone",
  "service",
  "preferred_date",
  "time_slot",
  "contact_channel",
  "comment",
];

// ---------- dates (calendar-date arithmetic in the configured timezone) ----------

export function todayInTimezone(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: scheduleConfig.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function isRealDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && addDays(dateStr, 0) === dateStr;
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function bookingDateRange(now: Date = new Date()): { min: string; max: string } {
  const today = todayInTimezone(now);
  return {
    min: addDays(today, scheduleConfig.leadDays),
    max: addDays(today, scheduleConfig.maxAdvanceDays),
  };
}

// ---------- validation (shared by the form and the API route) ----------

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return digits ? `+${digits}` : "";
}

export function validateBooking(
  input: unknown,
  now: Date = new Date(),
): { ok: true; data: BookingPayload } | { ok: false; errors: BookingErrors } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const errors: BookingErrors = {};

  const name = str("name");
  if (name.length < 2) errors.name = "Укажите имя (минимум 2 символа)";
  else if (name.length > 80) errors.name = "Имя слишком длинное";

  const phone = normalizePhone(str("phone"));
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = "Введите номер телефона с кодом страны, например +7 …";
  }

  const service = str("service");
  if (!content.services.some((s) => s.id === service)) errors.service = "Выберите услугу";

  const preferred_date = str("preferred_date");
  const range = bookingDateRange(now);
  if (!isRealDate(preferred_date)) {
    errors.preferred_date = "Выберите дату";
  } else if (preferred_date < range.min || preferred_date > range.max) {
    errors.preferred_date = "Эта дата недоступна для записи";
  } else if (
    !scheduleConfig.workingWeekdays.includes(weekdayOf(preferred_date)) ||
    scheduleConfig.closedDates.includes(preferred_date)
  ) {
    errors.preferred_date = "В этот день приёма нет — выберите другой";
  }

  const time_slot = str("time_slot");
  if (!scheduleConfig.timeSlots.some((s) => s.id === time_slot)) errors.time_slot = "Выберите время";

  const comment = str("comment");
  if (comment.length > 500) errors.comment = "Комментарий не должен превышать 500 символов";

  const channel = str("contact_channel");
  const contact_channel = CONTACT_CHANNELS.find((c) => c.id === channel)?.id;
  if (!contact_channel) errors.contact_channel = "Выберите способ связи";

  if (Object.keys(errors).length > 0 || !contact_channel) return { ok: false, errors };
  return {
    ok: true,
    data: { name, phone, service, preferred_date, time_slot, comment, contact_channel },
  };
}

// ---------- message formatting ----------

export function formatDateRu(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function describe(data: BookingPayload) {
  const service = content.services.find((s) => s.id === data.service)?.title ?? data.service;
  const slot = scheduleConfig.timeSlots.find((s) => s.id === data.time_slot)?.label ?? data.time_slot;
  const channel = CONTACT_CHANNELS.find((c) => c.id === data.contact_channel)?.label ?? data.contact_channel;
  return { service, slot, channel, date: formatDateRu(data.preferred_date) };
}

/** Text of the prefilled WhatsApp message the client sends to Albert. */
export function buildWhatsappMessage(data: BookingPayload): string {
  const d = describe(data);
  return [
    "Здравствуйте, Альберт! Хочу записаться.",
    `Услуга: ${d.service}`,
    `Желаемая дата: ${d.date}`,
    `Время: ${d.slot}`,
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Удобный способ связи: ${d.channel}`,
    data.comment ? `Комментарий: ${data.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Plain-text notification for the owner (Telegram / WhatsApp Cloud API). */
export function buildOwnerNotification(data: BookingPayload, id: string): string {
  const d = describe(data);
  return [
    `Новая заявка с сайта (№ ${id})`,
    `Услуга: ${d.service}`,
    `Желаемая дата: ${d.date}, ${d.slot}`,
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Связаться через: ${d.channel}`,
    data.comment ? `Комментарий: ${data.comment}` : "",
    "Статус: ожидает подтверждения",
  ]
    .filter(Boolean)
    .join("\n");
}
