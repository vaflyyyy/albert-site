import "server-only";
import { buildOwnerNotification } from "@/lib/booking";
import type { Notifier } from "../types";

/**
 * Official WhatsApp Business Platform Cloud API (optional).
 * Sends a notification to the OWNER's number. Free-form text is only delivered inside the
 * 24-hour customer-service window; outside it Meta requires an approved message template.
 * Configure a template and adapt `body` below before relying on this in production.
 */
export function whatsappCloudNotifier(): Notifier | null {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = (process.env.WHATSAPP_NOTIFY_TO ?? "").replace(/\D/g, "");
  if (!token || !phoneNumberId || !to) return null;

  return {
    name: "whatsapp-cloud",
    async notify(booking) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: buildOwnerNotification(booking, booking.id) },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`whatsapp_http_${res.status}`);
    },
  };
}
