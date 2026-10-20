import Link from "next/link";
import { getContacts, displayPhone, telHref, telegramUrl, whatsappUrl } from "@/lib/contacts";
import { cn } from "@/lib/cn";
import { InstagramIcon, PhoneIcon, TelegramIcon, WhatsAppIcon } from "./icons";

/**
 * Показывает только каналы, настроенные через env. Из пустых или шаблонных значений ссылки не строятся.
 */
export function ContactButtons({ layout = "row", className }: { layout?: "row" | "stack"; className?: string }) {
  const c = getContacts();
  const hasAny = Boolean(c.whatsappPhone || c.telegramUsername || c.phone || c.instagramUrl);

  if (!hasAny) {
    return (
      <div className={cn("text-sm text-mist", className)}>
        <p>Прямые контакты скоро появятся. Пока оставьте заявку в форме — Альберт свяжется с вами.</p>
        <Link href="/contact#booking" className="mt-3 inline-block text-caramel-300 underline underline-offset-4">
          Перейти к форме записи
        </Link>
        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-3 border border-line bg-surface p-3 text-xs">
            DEV: задайте NEXT_PUBLIC_WHATSAPP_PHONE и NEXT_PUBLIC_TELEGRAM_USERNAME в .env.local (см. .env.example).
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", layout === "stack" ? "flex-col items-stretch" : "flex-wrap", className)}>
      {c.whatsappPhone ? (
        <a className="btn btn-primary" href={whatsappUrl(c.whatsappPhone, "Здравствуйте, Альберт! Хочу задать вопрос.")} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /> WhatsApp
        </a>
      ) : null}
      {c.telegramUsername ? (
        <a className="btn btn-secondary" href={telegramUrl(c.telegramUsername)} target="_blank" rel="noopener noreferrer">
          <TelegramIcon /> Telegram
        </a>
      ) : null}
      {c.phone ? (
        <a className="btn btn-secondary" href={telHref(c.phone)}>
          <PhoneIcon /> {displayPhone(c.phone)}
        </a>
      ) : null}
      {c.instagramUrl ? (
        <a className="btn btn-secondary" href={c.instagramUrl} target="_blank" rel="noopener noreferrer">
          <InstagramIcon /> Instagram
        </a>
      ) : null}
    </div>
  );
}
