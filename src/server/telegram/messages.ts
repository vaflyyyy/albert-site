import "server-only";
import { CONTACT_CHANNELS, describe } from "@/lib/booking";
import { STATUS_INFO, type BookingStatus } from "@/lib/booking-status";
import type { BookingRecord } from "../booking/types";
import type { InlineKeyboard } from "./api";

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STATUS_EMOJI: Record<BookingStatus, string> = {
  pending: "⏳",
  confirmed: "✅",
  rejected: "❌",
  reschedule_requested: "🕐",
  cancelled: "🚫",
};

/** Текст сообщения владельцу. Отражает актуальный статус. */
export function renderOwnerMessage(b: BookingRecord, extraLine?: string): string {
  const d = describe(b);
  const channel = CONTACT_CHANNELS.find((c) => c.id === b.contact_channel)?.label ?? b.contact_channel;
  return [
    `☕ <b>Запись № ${esc(b.id)}</b>`,
    "",
    `<b>Услуга:</b> ${esc(d.service)}`,
    `<b>Дата и время:</b> ${esc(d.date)}, ${esc(d.slot)}`,
    `<b>Имя:</b> ${esc(b.name)}`,
    `<b>Телефон:</b> ${esc(b.phone)}`,
    `<b>Связь:</b> ${esc(channel)}`,
    b.comment ? `<b>Комментарий:</b> ${esc(b.comment)}` : "",
    b.ownerNote ? `<b>Ваше предложение клиенту:</b> ${esc(b.ownerNote)}` : "",
    "",
    `${STATUS_EMOJI[b.status]} <b>Статус:</b> ${esc(STATUS_INFO[b.status].label)}`,
    extraLine ? esc(extraLine) : "",
  ]
    .filter((line, i, arr) => line !== "" || (arr[i - 1] !== "" && i !== arr.length - 1))
    .join("\n");
}

export const CB_PREFIX = "bk";
export type CbAction = "c" | "r" | "t";
export const cb = (action: CbAction, id: string) => `${CB_PREFIX}:${action}:${id}`;

export function parseCallback(data: string | undefined): { action: CbAction; id: string } | null {
  const m = /^bk:([crt]):(AE-[A-Z0-9]{8})$/.exec(data ?? "");
  return m ? { action: m[1] as CbAction, id: m[2] } : null;
}

/** Кнопки зависят от статуса. */
export function ownerKeyboard(b: BookingRecord): InlineKeyboard {
  switch (b.status) {
    case "pending":
      return [
        [
          { text: "✅ Подтвердить", callback_data: cb("c", b.id) },
          { text: "❌ Отклонить", callback_data: cb("r", b.id) },
        ],
        [{ text: "🕐 Предложить другое время", callback_data: cb("t", b.id) }],
      ];
    case "reschedule_requested":
      return [
        [
          { text: "✅ Подтвердить", callback_data: cb("c", b.id) },
          { text: "❌ Отклонить", callback_data: cb("r", b.id) },
        ],
        [{ text: "✏️ Изменить предложение", callback_data: cb("t", b.id) }],
      ];
    case "confirmed":
      return [[{ text: "❌ Отменить запись", callback_data: cb("r", b.id) }]];
    default:
      return [];
  }
}
