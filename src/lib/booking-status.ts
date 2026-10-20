/** Статусы записи и тексты для клиента. Общий модуль (клиент + сервер). */
export const BOOKING_STATUSES = ["pending", "confirmed", "rejected", "reschedule_requested", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === "string" && (BOOKING_STATUSES as readonly string[]).includes(v);
}

export interface StatusInfo {
  label: string;
  headline: string;
  nextSteps: string;
  tone: "waiting" | "ok" | "bad" | "info" | "muted";
}

export const STATUS_INFO: Record<BookingStatus, StatusInfo> = {
  pending: {
    label: "Ожидает подтверждения",
    headline: "Заявка получена",
    nextSteps: "Альберт получил уведомление и скоро подтвердит запись. Эта страница обновится сама — её можно не закрывать или вернуться позже по этой же ссылке.",
    tone: "waiting",
  },
  confirmed: {
    label: "Запись подтверждена",
    headline: "Вас ждут!",
    nextSteps: "Дата и время закреплены за вами. Если планы изменятся, отмените запись ниже или напишите Альберту.",
    tone: "ok",
  },
  rejected: {
    label: "Запись отклонена",
    headline: "Это время не подошло",
    nextSteps: "К сожалению, Альберт не сможет принять вас в выбранное время. Оставьте новую заявку на другую дату или напишите ему напрямую.",
    tone: "bad",
  },
  reschedule_requested: {
    label: "Предложено другое время",
    headline: "Альберт предлагает другое время",
    nextSteps: "Свяжитесь с Альбертом, чтобы согласовать новое время, или оставьте новую заявку на удобную дату. Запись подтверждается только после его ответа.",
    tone: "info",
  },
  cancelled: {
    label: "Запись отменена",
    headline: "Запись отменена",
    nextSteps: "Если захотите записаться снова — оставьте новую заявку.",
    tone: "muted",
  },
};

/** Что отдаёт публичный endpoint статуса. Никаких телефонов и комментариев. */
export interface PublicBookingStatus {
  reference: string;
  status: BookingStatus;
  serviceTitle: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTimeLabel: string;
  ownerNote: string | null;
  updatedAt: string;
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
