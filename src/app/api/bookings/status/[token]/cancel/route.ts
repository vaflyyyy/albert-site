import { NextResponse } from "next/server";
import { TOKEN_PATTERN } from "@/lib/booking-status";
import { clientKey, NO_STORE } from "@/server/http";
import { cancelByToken } from "@/server/booking/service";
import { isRateLimited } from "@/server/booking/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!TOKEN_PATTERN.test(token)) return NextResponse.json({ ok: false, code: "not_found" }, { status: 404, headers: NO_STORE });

  try {
    if (await isRateLimited(`cancel:${clientKey(req)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: NO_STORE });
    }
    const res = await cancelByToken(token);
    if (!res.ok) {
      return NextResponse.json({ ok: false, code: res.code }, { status: res.code === "not_found" ? 404 : 409, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, booking: res.status }, { headers: NO_STORE });
  } catch {
    console.error("[booking] cancel failed");
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500, headers: NO_STORE });
  }
}