// Локальная разработка: получает обновления Telegram через long polling и пересылает их в ваш
// локальный сайт (POST /api/telegram/webhook с секретом). Так кнопки работают без публичного адреса.
//   1) npm run dev   2) в другом окне: npm run telegram:poll
// ВНИМАНИЕ: удаляет установленный вебхук (Telegram не позволяет использовать оба режима одновременно).
// После этого для продакшена снова выполните: npm run telegram:webhook -- set
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const local = (process.env.LOCAL_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

if (!token || !secret) {
  console.error("✗ Заполните TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET в .env.local");
  process.exit(1);
}

const api = (method, body = {}, timeout = 40000) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  }).then((r) => r.json());

await api("deleteWebhook", { drop_pending_updates: false }, 10000).catch(() => {});
console.log(`✓ Слушаю Telegram и пересылаю на ${local}/api/telegram/webhook (Ctrl+C — выход)`);

let offset = 0;
for (;;) {
  try {
    const r = await api("getUpdates", { offset, timeout: 25, allowed_updates: ["callback_query", "message"] });
    if (!r.ok) {
      console.error(`✗ ${r.description}`);
      await new Promise((res) => setTimeout(res, 5000));
      continue;
    }
    for (const update of r.result) {
      offset = update.update_id + 1;
      const res = await fetch(`${local}/api/telegram/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret },
        body: JSON.stringify(update),
      }).catch(() => null);
      console.log(`→ update ${update.update_id}: ${res ? `HTTP ${res.status}` : "сайт недоступен (запущен ли npm run dev?)"}`);
    }
  } catch {
    await new Promise((res) => setTimeout(res, 3000));
  }
}
