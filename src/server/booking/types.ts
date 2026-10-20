import type { BookingPayload } from "@/lib/booking";
import type { BookingStatus } from "@/lib/booking-status";

/** Запись из БД. Поля заявки (name, phone, service, ...) — как в BookingPayload. */
export interface BookingRecord extends BookingPayload {
  id: string;
  status: BookingStatus;
  ownerNote: string | null;
  telegramChatId: string | null;
  telegramMessageId: number | null;
  promptMessageId: number | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingAction = "confirm" | "reject" | "reschedule" | "cancel";

export type TransitionResult =
  | { ok: true; booking: BookingRecord; unchanged: boolean }
  | { ok: false; reason: "not_found" | "invalid_state" | "slot_taken"; booking?: BookingRecord };

/** Дополнительный канал уведомления владельца (например, WhatsApp Cloud API). Без кнопок. */
export interface Notifier {
  name: string;
  notify(booking: BookingRecord): Promise<void>;
}
