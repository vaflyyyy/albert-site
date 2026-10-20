import { NextResponse } from "next/server";
import { getTelegramConfig, secretsEqual } from "@/server/telegram/config";
import { handleUpdate, type TgUpdate } from "@/server/telegram/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Вебхук Telegram (кнопки «Подтвердить / Отклонить / Предложить другое время»).
 * 1) Запрос должен нести секрет из setWebhook (TELEGRAM_WEBHOOK_SECRET) — иначе 401.
 * 2) Менять статусы могут только пользователи из TELEGRAM_ADMIN_IDS (проверка в handler).
 * Telegram повторяет доставку при не-2xx, поэтому после проверки секрета всегда отвечаем 200.
 */
export async function POST(req: Request) {
  const cfg = getTelegramConfig();
  if (!cfg || !cfg.webhookSecret) {
    // Без секрета вебхук не принимает ничего — иначе любой смог бы подделать нажатие кнопки.
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const provided = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!provided || !secretsEqual(provided, cfg.webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > 100_000) return NextResponse.json({ ok: true });

  let update: TgUpdate | null = null;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleUpdate(update);
  } catch (e) {
    console.error("[telegram] update failed:", e instanceof Error ? e.message : "unknown");
  }
  return NextResponse.json({ ok: true });
}
