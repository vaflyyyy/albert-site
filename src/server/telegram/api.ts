import "server-only";
import type { TelegramConfig } from "./config";

export interface InlineButton {
  text: string;
  callback_data: string;
}
export type InlineKeyboard = InlineButton[][];

interface TgResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

/** Вызов Bot API. Токен не попадает ни в ошибки, ни в логи. */
export async function tgCall<T = unknown>(cfg: TelegramConfig, method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => null)) as TgResponse<T> | null;
  if (!res.ok || !json?.ok) {
    throw new TelegramApiError(method, json?.error_code ?? res.status, json?.description ?? "");
  }
  return json.result as T;
}

export class TelegramApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly code: number,
    public readonly description: string,
  ) {
    super(`telegram_${method}_${code}`);
  }
}

export function sendMessage(cfg: TelegramConfig, text: string, keyboard?: InlineKeyboard, extra: Record<string, unknown> = {}) {
  return tgCall<{ message_id: number; chat: { id: number } }>(cfg, "sendMessage", {
    chat_id: cfg.chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    ...extra,
  });
}

export async function editMessage(cfg: TelegramConfig, chatId: string, messageId: number, text: string, keyboard: InlineKeyboard) {
  try {
    await tgCall(cfg, "editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (e) {
    // «message is not modified» — не ошибка (повторное нажатие)
    if (e instanceof TelegramApiError && /not modified/i.test(e.description)) return;
    throw e;
  }
}

export function answerCallback(cfg: TelegramConfig, callbackQueryId: string, text: string, showAlert = false) {
  return tgCall(cfg, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text.slice(0, 190),
    show_alert: showAlert,
  });
}
