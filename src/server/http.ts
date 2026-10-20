import "server-only";
import { createHash } from "node:crypto";

/** Обезличенный ключ клиента для лимитов: SHA-256(IP + соль). Сырой IP не сохраняется. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${process.env.RATE_LIMIT_SALT ?? "albert"}:${ip}`).digest("hex").slice(0, 32);
}

export const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
