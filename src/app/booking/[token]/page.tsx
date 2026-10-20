import { notFound } from "next/navigation";
import { BookingStatusView } from "@/components/BookingStatusView";
import { TOKEN_PATTERN } from "@/lib/booking-status";
import { toPublicStatus } from "@/server/booking/service";
import { getBookingByToken } from "@/server/booking/store";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Статус записи",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function BookingStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_PATTERN.test(token)) notFound();
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  return (
    <div className="container-page max-w-3xl py-14 sm:py-20">
      <BookingStatusView token={token} initial={toPublicStatus(booking)} />
    </div>
  );
}