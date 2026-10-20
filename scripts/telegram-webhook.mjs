// Управление вебхуком Telegram: npm run telegram:webhook -- set|info|delete
// Читает TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL из .env.local. Токен не выводится.
const [, , cmd = "info"] = process.argv;
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

if (!token) {
  console.error("✗ Заполните TELEGRAM_BOT_TOKEN в .env.local");
  process.exit(1);
}

async function call(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  return res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
}

if (cmd === "set") {
  if (!secret || secret.length < 16) {
    console.error("✗ Задайте TELEGRAM_WEBHOOK_SECRET (16+ символов: буквы, цифры, _ и -). Например: openssl rand -hex 24");
    process.exit(1);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(secret)) {
    console.error("✗ TELEGRAM_WEBHOOK_SECRET может содержать только A-Z a-z 0-9 _ -");
    process.exit(1);
  }
  if (!site || !site.startsWith("https://")) {
    console.error("✗ NEXT_PUBLIC_SITE_URL должен быть публичным адресом с https:// (Telegram не принимает http и localhost).");
    console.error("  Для локальной проверки используйте: npm run telegram:poll");
    process.exit(1);
  }
  const r = await call("setWebhook", {
    url: `${site}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["callback_query", "message"],
    drop_pending_updates: true,
  });
  console.log(r.ok ? `✓ Вебхук установлен: ${site}/api/telegram/webhook` : `✗ ${r.description}`);
  process.exit(r.ok ? 0 : 1);
} else if (cmd === "delete") {
  const r = await call("deleteWebhook", { drop_pending_updates: false });
  console.log(r.ok ? "✓ Вебхук удалён" : `✗ ${r.description}`);
} else {
  const r = await call("getWebhookInfo");
  if (!r.ok) {
    console.error(`✗ ${r.description}`);
    process.exit(1);
  }
  const i = r.result;
  console.log(`URL: ${i.url || "(не установлен)"}`);
  console.log(`Ожидают доставки: ${i.pending_update_count}`);
  if (i.last_error_message) console.log(`Последняя ошибка: ${i.last_error_message}`);
}
