/**
 * Contact details come from NEXT_PUBLIC_* env vars (they are public by nature).
 * Anything missing or placeholder-looking resolves to `null`, and the UI hides that channel,
 * so unconfigured details are never rendered or linked.
 * NOTE: process.env.NEXT_PUBLIC_* must be referenced literally so Next.js can inline them.
 */
export interface Contacts {
  whatsappPhone: string | null;
  telegramUsername: string | null;
  phone: string | null;
  instagramUrl: string | null;
}

function digitsOnly(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function isPlausiblePhone(d: string): boolean {
  return d.length >= 10 && d.length <= 15 && !/^(\d)\1+$/.test(d) && !/0{8,}/.test(d);
}

export function getContacts(): Contacts {
  const wa = digitsOnly(process.env.NEXT_PUBLIC_WHATSAPP_PHONE);
  const phone = digitsOnly(process.env.NEXT_PUBLIC_PHONE);
  const tg = (process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "").trim().replace(/^@/, "");
  const ig = (process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "").trim();
  return {
    whatsappPhone: isPlausiblePhone(wa) ? wa : null,
    telegramUsername: /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg) ? tg : null,
    phone: isPlausiblePhone(phone) ? phone : null,
    instagramUrl: /^https:\/\/(www\.)?instagram\.com\//i.test(ig) ? ig : null,
  };
}

export const whatsappUrl = (phoneDigits: string, text?: string): string =>
  `https://wa.me/${phoneDigits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const telegramUrl = (username: string): string => `https://t.me/${username}`;

export const telHref = (phoneDigits: string): string => `tel:+${phoneDigits}`;

export const displayPhone = (phoneDigits: string): string => `+${phoneDigits}`;
