import "server-only";
import type { BookingPayload } from "@/lib/booking";
import { content } from "@/content";
import { scheduleConfig } from "@/config/site";
import type { PublicBookingStatus } from "@/lib/booking-status";
import { createBooking, deleteBooking, setTelegramMessage, SlotTakenError, transition, getBookingByToken } from "./store";
import { isTelegramConfigured, notifyOwnerCancelled, sendBookingToOwner } from "./notifiers/telegram";
import { whatsappCloudNotifier } from "./notifiers/whatsapp-cloud";
import type { BookingRecord } from "./types";

export type BookingErrorCode = "not_configured" | "slot_unavailable" | "delivery_failed";

export class BookingServiceError extends Error {
  constructor(public readonly code: BookingErrorCode) {
    super(code);
  }
}

/**
 * Принимает заявку:
 *  1. Telegram должен быть настроен (иначе 501: интерфейс не изображает «успех»).
 *  2. Слот проверяется и запись сохраняется в одной транзакции БД.
 *  3. Владельцу уходит сообщение с кнопками. Если Telegram не принял его — запись удаляется
 *     и клиент получает ошибку (успех показывается только когда владелец реально уведомлён).
 */
export async function submitBooking(data: BookingPayload): Promise<{ id: string; token: string; status: "pending" }> {
  if (!isTelegramConfigured()) throw new BookingServiceError("not_configured");

  let created: { booking: BookingRecord; token: string };
  try {
    created = await createBooking(data);
  } catch (e) {
    if (e instanceof SlotTakenError) throw new BookingServiceError("slot_unavailable");
    throw e;
  }

  try {
    const { chatId, messageId } = await sendBookingToOwner(created.booking);
    await setTelegramMessage(created.booking.id, chatId, messageId);
  } catch (e) {
    await deleteBooking(created.booking.id).catch(() => undefined);
    console.error("[booking] telegram delivery failed:", e instanceof Error ? e.message : "unknown");
    throw new BookingServiceError("delivery_failed");
  }

  // Дополнительный канал (опционально) — best effort, не влияет на результат.
  const wa = whatsappCloudNotifier();
  if (wa) {
    wa.notify(created.booking).catch((e) => console.error("[booking] whatsapp-cloud failed:", e instanceof Error ? e.message : "unknown"));
  }

  return { id: created.booking.id, token: created.token, status: "pending" };
}

export function toPublicStatus(b: BookingRecord): PublicBookingStatus {
  const service = content.services.find((s) => s.id === b.service)?.title ?? "Услуга";
  const slot = scheduleConfig.timeSlots.find((s) => s.id === b.time_slot)?.label ?? b.time_slot;
  return {
    reference: b.id,
    status: b.status,
    serviceTitle: service,
    requestedDate: b.preferred_date,
    requestedTimeLabel: slot,
    ownerNote: b.status === "reschedule_requested" ? b.ownerNote : null,
    updatedAt: b.updatedAt,
  };
}

/** Клиент отменяет свою запись по приватной ссылке. */
export async function cancelByToken(token: string): Promise<{ ok: true; status: PublicBookingStatus } | { ok: false; code: "not_found" | "invalid_state" }> {
  const found = await getBookingByToken(token);
  if (!found) return { ok: false, code: "not_found" };
  const res = await transition(found.id, "cancel", "customer");
  if (!res.ok) return { ok: false, code: res.reason === "not_found" ? "not_found" : "invalid_state" };
  if (!res.unchanged) {
    notifyOwnerCancelled(res.booking).catch((e) => console.error("[booking] cancel notify failed:", e instanceof Error ? e.message : "unknown"));
  }
  return { ok: true, status: toPublicStatus(res.booking) };
}