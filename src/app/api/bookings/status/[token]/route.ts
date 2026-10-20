import { NextResponse } from "next/server";
import { TOKEN_PATTERN } from "@/lib/booking-status";
import { clientKey, NO_STORE } from "@/server/http";
import { toPublicStatus } from "@/server/booking/service";
import { getBookingByToken, isRateLimited } from "@/server/booking/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Публичный статус по неугадываемому токену. Телефон и комментарий НЕ отдаются. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!TOKEN_PATTERN.test(token)) return NextResponse.json({ ok: false, code: "not_found" }, { status: 404, headers: NO_STORE });

  try {
    // Опрос раз в ~5 с = ~120 запросов за 10 минут; лимит с запасом, но защищает от перебора токенов.
    if (await isRateLimited(`status:${clientKey(req)}`, 600, 10 * 60 * 1000)) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: { ...NO_STORE, "Retry-After": "30" } });
    }
    const booking = await getBookingByToken(token);
    if (!booking) return NextResponse.json({ ok: false, code: "not_found" }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ ok: true, booking: toPublicStatus(booking) }, { headers: NO_STORE });
  } catch {
    console.error("[booking] status lookup failed");
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500, headers: NO_STORE });
  }
}