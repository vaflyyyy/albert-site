import { NextResponse } from "next/server";
import { addDays, bookingDateRange } from "@/lib/booking";
import { clientKey, NO_STORE } from "@/server/http";
import { isRateLimited, takenSlots } from "@/server/booking/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/bookings/availability?date=YYYY-MM-DD → { taken: ["10:00-12:00"] } (без персональных данных) */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const range = bookingDateRange();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || addDays(date, 0) !== date || date < range.min || date > range.max) {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400, headers: NO_STORE });
  }
  try {
    if (await isRateLimited(`avail:${clientKey(req)}`, 120, 10 * 60 * 1000)) {
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, date, taken: await takenSlots(date) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500, headers: NO_STORE });
  }
}