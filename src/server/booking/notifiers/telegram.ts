import "server-only";
import { editMessage, sendMessage } from "@/server/telegram/api";
import { getTelegramConfig } from "@/server/telegram/config";
import { ownerKeyboard, renderOwnerMessage } from "@/server/telegram/messages";
import type { BookingRecord } from "../types";

/** Telegram настроен полностью (токен, чат, администраторы). */
export function isTelegramConfigured(): boolean {
  return getTelegramConfig() !== null;
}

/** Отправляет владельцу новую заявку с inline-кнопками. Возвращает id сообщения для последующего редактирования. */
export async function sendBookingToOwner(booking: BookingRecord): Promise<{ chatId: string; messageId: number }> {
  const cfg = getTelegramConfig();
  if (!cfg) throw new Error("telegram_not_configured");
  const msg = await sendMessage(cfg, renderOwnerMessage(booking), ownerKeyboard(booking));
  return { chatId: String(msg.chat.id), messageId: msg.message_id };
}

/** Клиент отменил запись на сайте — обновляем сообщение владельца и шлём короткое уведомление. */
export async function notifyOwnerCancelled(booking: BookingRecord): Promise<void> {
  const cfg = getTelegramConfig();
  if (!cfg) return;
  if (booking.telegramChatId && booking.telegramMessageId) {
    await editMessage(cfg, booking.telegramChatId, booking.telegramMessageId, renderOwnerMessage(booking, "Клиент отменил запись на сайте."), ownerKeyboard(booking));
  }
  await sendMessage(cfg, `🚫 Клиент отменил запись № ${booking.id}.`);
}
