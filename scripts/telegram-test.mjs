// Проверка связи с Telegram: npm run telegram:test
// Читает TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID из .env.local (через --env-file) и шлёт тестовое сообщение.
// Токен нигде не выводится.
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

if (!token || !chatId) {
  console.error("✗ Заполните TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в файле .env.local");
  process.exit(1);
}

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

try {
  const me = await call("getMe");
  if (!me.json.ok) {
    console.error(`✗ Токен не принят Telegram (HTTP ${me.status}). Проверьте TELEGRAM_BOT_TOKEN.`);
    process.exit(1);
  }
  console.log(`✓ Бот найден: @${me.json.result.username}`);

  const sent = await call("sendMessage", { chat_id: chatId, text: "✅ Тест: уведомления с сайта Albert Ermekov подключены." });
  if (!sent.json.ok) {
    console.error(`✗ Сообщение не отправлено (HTTP ${sent.status}): ${sent.json.description ?? "неизвестная ошибка"}`);
    console.error("  Частая причина: вы ещё не написали боту /start — откройте бота в Telegram и нажмите «Start».");
    process.exit(1);
  }
  console.log("✓ Тестовое сообщение отправлено. Проверьте Telegram.");
} catch {
  console.error("✗ Нет соединения с api.telegram.org. Проверьте интернет.");
  process.exit(1);
}
