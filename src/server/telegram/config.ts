import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export interface TelegramConfig {
  token: string;
  /** Чат, куда приходят заявки */
  chatId: string;
  /** Telegram user id, которым разрешено менять статусы */
  adminIds: ReadonlySet<string>;
  /** Секрет вебхука (заголовок X-Telegram-Bot-Api-Secret-Token) */
  webhookSecret: string | null;
}

function parseIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{3,20}$/.test(s));
}

/**
 * Возвращает null, если Telegram не настроен полностью.
 * Администраторы: TELEGRAM_ADMIN_IDS (через запятую). Если не задано, а TELEGRAM_CHAT_ID —
 * личный чат (положительное число), то админ = владелец этого чата.
 * Для группового чата (отрицательный id) TELEGRAM_ADMIN_IDS обязателен.
 */
export function getTelegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;

  let admins = parseIds(process.env.TELEGRAM_ADMIN_IDS);
  if (admins.length === 0 && /^\d+$/.test(chatId)) admins = [chatId];
  if (admins.length === 0) return null;

  return {
    token,
    chatId,
    adminIds: new Set(admins),
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null,
  };
}

/** Сравнение секретов за постоянное время. */
export function secretsEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
