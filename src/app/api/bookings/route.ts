import { NextResponse } from "next/server";
import { validateBooking } from "@/lib/booking";
import { clientKey, NO_STORE } from "@/server/http";
import { BookingServiceError, submitBooking } from "@/server/booking/service";
import { isRateLimited } from "@/server/booking/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 10_000) {
    return NextResponse.json({ ok: false, code: "payload_too_large" }, { status: 413, headers: NO_STORE });
  }

  try {
    if (await isRateLimited(`book:${clientKey(req)}`, MAX_REQUESTS, WINDOW_MS)) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: NO_STORE });
    }
  } catch {
    console.error("[booking] rate limit store error");
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400, headers: NO_STORE });
  }

  // Honeypot: настоящие пользователи это скрытое поле не заполняют.
  const trap = (body as Record<string, unknown> | null)?.company_website;
  if (typeof trap === "string" && trap.length > 0) return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });

  const result = validateBooking(body);
  if (!result.ok) return NextResponse.json({ ok: false, code: "validation", errors: result.errors }, { status: 400, headers: NO_STORE });

  try {
    const { id, token, status } = await submitBooking(result.data);
    return NextResponse.json({ ok: true, id, status, statusUrl: `/booking/${token}`, token }, { status: 201, headers: NO_STORE });
  } catch (err) {
    if (err instanceof BookingServiceError) {
      const map = { not_configured: 501, slot_unavailable: 409, delivery_failed: 502 } as const;
      return NextResponse.json({ ok: false, code: err.code }, { status: map[err.code], headers: NO_STORE });
    }
    console.error("[booking] unexpected error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500, headers: NO_STORE });
  }
}