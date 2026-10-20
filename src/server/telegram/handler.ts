import "server-only";
import { getBookingById, getBookingByPromptMessage, setOwnerNote, setPromptMessage, transition } from "../booking/store";
import type { BookingRecord } from "../booking/types";
import { answerCallback, editMessage, sendMessage, tgCall } from "./api";
import { getTelegramConfig, type TelegramConfig } from "./config";
import { parseCallback, ownerKeyboard, renderOwnerMessage } from "./messages";

interface TgUser {
  id: number;
}
interface TgMessage {
  message_id: number;
  chat: { id: number };
  from?: TgUser;
  text?: string;
  reply_to_message?: { message_id: number };
}
export interface TgUpdate {
  update_id: number;
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage };
  message?: TgMessage;
}

const NOTE_MAX = 300;

function isAdmin(cfg: TelegramConfig, user: TgUser | undefined): boolean {
  return Boolean(user && cfg.adminIds.has(String(user.id)));
}

/** В логи — только числовые id и коды, без персональных данных клиентов. */
function logWarn(msg: string): void {
  console.warn(`[telegram] ${msg}`);
}

export async function handleUpdate(update: TgUpdate): Promise<void> {
  const cfg = getTelegramConfig();
  if (!cfg) return;
  if (update.callback_query) return handleCallback(cfg, update.callback_query);
  if (update.message) return handleMessage(cfg, update.message);
}

async function refreshOwnerMessage(cfg: TelegramConfig, b: BookingRecord, extra?: string): Promise<void> {
  if (!b.telegramChatId || !b.telegramMessageId) return;
  await editMessage(cfg, b.telegramChatId, b.telegramMessageId, renderOwnerMessage(b, extra), ownerKeyboard(b));
}

async function handleCallback(cfg: TelegramConfig, q: NonNullable<TgUpdate["callback_query"]>): Promise<void> {
  // 1) Авторизация: только админы И только из настроенного чата.
  const chatOk = q.message ? String(q.message.chat.id) === cfg.chatId : false;
  if (!isAdmin(cfg, q.from) || !chatOk) {
    logWarn(`отклонено нажатие кнопки от неавторизованного пользователя id=${q.from.id}`);
    await answerCallback(cfg, q.id, "⛔ У вас нет прав управлять записями.", true).catch(() => undefined);
    return;
  }

  const parsed = parseCallback(q.data);
  if (!parsed) {
    await answerCallback(cfg, q.id, "Неизвестная команда.").catch(() => undefined);
    return;
  }

  const actor = `tg:${q.from.id}`;

  try {
    if (parsed.action === "t") {
      const current = await getBookingById(parsed.id);
      if (!current) {
        await answerCallback(cfg, q.id, "Запись не найдена.", true);
        return;
      }
      const res = await transition(parsed.id, "reschedule", actor);
      if (!res.ok) {
        await answerCallback(cfg, q.id, res.reason === "invalid_state" ? "Для этой записи уже нельзя предложить время." : "Запись не найдена.", true);
        return;
      }
      // Просим владельца ответить текстом — он увидит его на странице статуса клиента.
      const prompt = await sendMessage(
        cfg,
        `🕐 Заявка <b>${res.booking.id}</b>: ответьте на это сообщение и напишите, какое время вы предлагаете клиенту (до ${NOTE_MAX} символов). Текст появится на странице статуса клиента.`,
        undefined,
        { reply_markup: { force_reply: true, selective: true, input_field_placeholder: "Например: могу в четверг в 15:00" } },
      );
      await setPromptMessage(parsed.id, prompt.message_id);
      await answerCallback(cfg, q.id, "Статус обновлён. Ответьте на сообщение ниже с вашим предложением.");
      const fresh = await getBookingById(parsed.id);
      await refreshOwnerMessage(cfg, fresh ?? res.booking);
      return;
    }

    const action = parsed.action === "c" ? "confirm" : "reject";
    const res = await transition(parsed.id, action, actor);

    if (!res.ok) {
      const text =
        res.reason === "slot_taken"
          ? "⚠️ Это время уже занято другой подтверждённой записью. Отклоните заявку или предложите другое время."
          : res.reason === "not_found"
            ? "Запись не найдена."
            : "Эта запись уже обработана, действие недоступно.";
      await answerCallback(cfg, q.id, text, true);
      if (res.booking) await refreshOwnerMessage(cfg, res.booking).catch(() => undefined);
      return;
    }

    await answerCallback(cfg, q.id, action === "confirm" ? "✅ Запись подтверждена. Клиент увидит статус на странице записи." : "❌ Запись отклонена.");
    await refreshOwnerMessage(cfg, res.booking);
  } catch (e) {
    console.error("[telegram] callback error:", e instanceof Error ? e.message : "unknown");
    await answerCallback(cfg, q.id, "Не удалось обработать нажатие. Попробуйте ещё раз.", true).catch(() => undefined);
  }
}

async function handleMessage(cfg: TelegramConfig, m: TgMessage): Promise<void> {
  const text = m.text?.trim() ?? "";

  // /id безопасна для любого пользователя: бот лишь называет его собственный id (нужен для TELEGRAM_ADMIN_IDS).
  if (/^\/id(@\w+)?$/i.test(text)) {
    await tgCall(cfg, "sendMessage", { chat_id: m.chat.id, text: `Ваш Telegram ID: ${m.from?.id ?? "?"}\nID этого чата: ${m.chat.id}` }).catch(() => undefined);
    return;
  }

  if (!isAdmin(cfg, m.from) || String(m.chat.id) !== cfg.chatId) return; // чужие сообщения молча игнорируем

  if (/^\/start(@\w+)?$/i.test(text)) {
    await sendMessage(cfg, "Бот записей Albert Ermekov подключён. Новые заявки будут приходить сюда с кнопками «Подтвердить», «Отклонить» и «Предложить другое время».");
    return;
  }

  // Ответ на запрос «предложить другое время»
  const replyTo = m.reply_to_message?.message_id;
  if (!replyTo || !text) return;
  const booking = await getBookingByPromptMessage(String(m.chat.id), replyTo);
  if (!booking) return;
  if (booking.status !== "reschedule_requested") {
    await sendMessage(cfg, "Статус этой записи уже изменился, предложение не сохранено.");
    return;
  }

  const note = text.slice(0, NOTE_MAX);
  const updated = await setOwnerNote(booking.id, note);
  if (updated) {
    await refreshOwnerMessage(cfg, updated).catch(() => undefined);
    await sendMessage(cfg, `✅ Предложение для заявки ${updated.id} сохранено — клиент увидит его на странице статуса.`);
  }
}