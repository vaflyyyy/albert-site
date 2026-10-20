"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { content } from "@/content";
import { scheduleConfig, WEEKDAY_SHORT_RU } from "@/config/site";
import {
  BOOKING_FIELD_ORDER,
  CONTACT_CHANNELS,
  bookingDateRange,
  buildWhatsappMessage,
  validateBooking,
  type BookingErrors,
  type BookingField,
  type ContactChannel,
} from "@/lib/booking";
import { getContacts, telegramUrl, whatsappUrl } from "@/lib/contacts";
import { cn } from "@/lib/cn";
import { getPrice } from "@/lib/pricing";
import { CheckIcon, TelegramIcon, WhatsAppIcon } from "./icons";

type Values = {
  name: string;
  phone: string;
  service: string;
  preferred_date: string;
  time_slot: string;
  comment: string;
  contact_channel: ContactChannel;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string; statusUrl: string }
  | { kind: "whatsapp_opened" }
  | { kind: "not_configured" }
  | { kind: "error"; message: string };

type Availability = { date: string; taken: string[] } | "loading" | "error" | null;

const chip =
  "inline-block rounded-full border px-4 py-2.5 text-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-caramel-300";

export function BookingForm({ defaultService }: { defaultService?: string }) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const contacts = getContacts();

  const [values, setValues] = useState<Values>({
    name: "",
    phone: "",
    service: content.services.some((s) => s.id === defaultService) ? (defaultService as string) : "",
    preferred_date: "",
    time_slot: "",
    comment: "",
    contact_channel: "whatsapp",
  });
  const [errors, setErrors] = useState<BookingErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const [range, setRange] = useState<{ min: string; max: string } | null>(null);
  const [availability, setAvailability] = useState<Availability>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setRange(bookingDateRange()), []);

  // Занятые (подтверждённые) слоты выбранной даты
  useEffect(() => {
    const date = values.preferred_date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setAvailability(null);
      return;
    }
    const ctrl = new AbortController();
    setAvailability("loading");
    fetch(`/api/bookings/availability?date=${date}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json().catch(() => null)) as { ok?: boolean; taken?: string[] } | null;
        if (!r.ok || !json?.ok || !Array.isArray(json.taken)) throw new Error("availability");
        setAvailability({ date, taken: json.taken });
        setValues((v) => (v.time_slot && json.taken!.includes(v.time_slot) ? { ...v, time_slot: "" } : v));
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setAvailability("error");
      });
    return () => ctrl.abort();
  }, [values.preferred_date]);

  const taken = availability && typeof availability === "object" ? availability.taken : [];
  const allTaken = scheduleConfig.timeSlots.every((s) => taken.includes(s.id));

  const id = (f: string) => `${uid}-${f}`;
  const busy = status.kind === "submitting";
  const price = values.service ? getPrice(values.service) : null;

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (status.kind !== "idle" && status.kind !== "submitting" && status.kind !== "success") setStatus({ kind: "idle" });
  }

  function focusFirstError(errs: BookingErrors) {
    const first = BOOKING_FIELD_ORDER.find((f) => errs[f]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  function check() {
    const result = validateBooking(values);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return null;
    }
    setErrors({});
    return result.data;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = check();
    if (!data) return;

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, company_website: honeypot }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; statusUrl?: string; errors?: BookingErrors } | null;

      if (res.status === 201 && json?.ok && json.id && json.statusUrl) {
        setStatus({ kind: "success", id: json.id, statusUrl: json.statusUrl });
        setValues((v) => ({ ...v, comment: "", time_slot: "", preferred_date: "" }));
      } else if (res.status === 501) {
        setStatus({ kind: "not_configured" });
      } else if (res.status === 400 && json?.errors) {
        setErrors(json.errors);
        focusFirstError(json.errors);
        setStatus({ kind: "error", message: "Проверьте выделенные поля и попробуйте снова." });
      } else if (res.status === 409) {
        setAvailability(null);
        setValues((v) => ({ ...v, time_slot: "" }));
        setStatus({ kind: "error", message: "Это время только что заняли. Пожалуйста, выберите другое." });
      } else if (res.status === 429) {
        setStatus({ kind: "error", message: "Слишком много попыток. Подождите немного и повторите." });
      } else {
        setStatus({ kind: "error", message: "Не удалось отправить заявку. Попробуйте ещё раз или напишите в мессенджер." });
      }
    } catch {
      setStatus({ kind: "error", message: "Нет соединения с сервером. Проверьте интернет и попробуйте снова." });
    }
  }

  function openWhatsApp() {
    if (!contacts.whatsappPhone) return;
    const data = check();
    if (!data) return;
    window.open(whatsappUrl(contacts.whatsappPhone, buildWhatsappMessage(data)), "_blank", "noopener,noreferrer");
    setStatus({ kind: "whatsapp_opened" });
  }

  async function copyLink(path: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен — ссылка видна на экране */
    }
  }

  const err = (f: BookingField) =>
    errors[f] ? (
      <p id={id(`${f}-err`)} className="field-error">
        {errors[f]}
      </p>
    ) : null;
  const a11y = (f: BookingField) => ({
    "aria-invalid": errors[f] ? (true as const) : undefined,
    "aria-describedby": errors[f] ? id(`${f}-err`) : undefined,
    "data-field": f,
  });

  // ---------- успех: номер записи и приватная ссылка на статус ----------
  if (status.kind === "success") {
    return (
      <div role="status" className="panel p-6 sm:p-9">
        <div className="flex gap-3 text-caramel-300">
          <CheckIcon className="mt-1 shrink-0" />
          <h3 className="text-3xl leading-tight">Заявка отправлена</h3>
        </div>
        <p className="mt-4 leading-relaxed text-mist">
          Альберт получил уведомление. Запись станет подтверждённой только после его ответа — статус появится на вашей личной странице.
        </p>
        <dl className="mt-6 space-y-4 border-y border-line py-5 text-sm">
          <div>
            <dt className="eyebrow mb-1">Номер записи</dt>
            <dd className="font-display text-3xl tracking-wide">{status.id}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">Личная ссылка на статус</dt>
            <dd className="break-all text-cream/90">{typeof window !== "undefined" ? `${window.location.origin}${status.statusUrl}` : status.statusUrl}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-mist">Сохраните ссылку: она никому не видна, кроме вас, и позволяет вернуться к статусу записи позже.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={status.statusUrl} className="btn btn-primary">Открыть статус записи</Link>
          <button type="button" onClick={() => copyLink(status.statusUrl)} className="btn btn-secondary">
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
          <button type="button" onClick={() => setStatus({ kind: "idle" })} className="btn btn-secondary">Новая заявка</button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="panel space-y-6 p-6 sm:p-9">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="field-label">Имя</label>
          <input id={id("name")} name="name" type="text" autoComplete="name" required maxLength={80} className="field-input" value={values.name} onChange={(e) => update("name", e.target.value)} {...a11y("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={id("phone")} className="field-label">Телефон</label>
          <input id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+7 …" className="field-input" value={values.phone} onChange={(e) => update("phone", e.target.value)} {...a11y("phone")} />
          {err("phone")}
        </div>
      </div>

      <div>
        <label htmlFor={id("service")} className="field-label">Услуга</label>
        <select id={id("service")} name="service" required className="field-input" value={values.service} onChange={(e) => update("service", e.target.value)} {...a11y("service")}>
          <option value="">Выберите услугу</option>
          {content.services.map((s) => (
            <option key={s.id} value={s.id}>{s.title} — {getPrice(s.id).text}</option>
          ))}
        </select>
        {price ? <p className="mt-1.5 text-xs text-mist">Стоимость: {price.text}</p> : null}
        {err("service")}
      </div>

      <div>
        <label htmlFor={id("preferred_date")} className="field-label">Желаемая дата</label>
        <input id={id("preferred_date")} name="preferred_date" type="date" required min={range?.min} max={range?.max} className="field-input sm:max-w-xs" value={values.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} {...a11y("preferred_date")} />
        <p className="mt-1.5 text-xs text-mist">Приём в дни: {scheduleConfig.workingWeekdays.map((d) => WEEKDAY_SHORT_RU[d]).join(", ")}</p>
        {err("preferred_date")}
      </div>

      <fieldset aria-describedby={errors.time_slot ? id("time_slot-err") : undefined}>
        <legend className="field-label">Время</legend>
        <div className="flex flex-wrap gap-2">
          {scheduleConfig.timeSlots.map((slot, i) => {
            const isTaken = taken.includes(slot.id);
            return (
              <label key={slot.id} className={cn(isTaken ? "cursor-not-allowed" : "cursor-pointer")}>
                <input
                  type="radio"
                  name="time_slot"
                  value={slot.id}
                  checked={values.time_slot === slot.id}
                  disabled={isTaken}
                  onChange={() => update("time_slot", slot.id)}
                  className="peer sr-only"
                  data-field={i === 0 ? "time_slot" : undefined}
                  aria-invalid={errors.time_slot ? true : undefined}
                />
                <span className={cn(chip, "border-line text-mist hover:border-caramel hover:text-cream peer-checked:border-caramel peer-checked:bg-caramel-600 peer-checked:text-cream-50 peer-disabled:border-line/60 peer-disabled:text-mist/40 peer-disabled:line-through peer-disabled:hover:border-line/60 peer-disabled:hover:text-mist/40")}>
                  {slot.label}
                  {isTaken ? <span className="sr-only"> (занято)</span> : null}
                </span>
              </label>
            );
          })}
        </div>
        <p aria-live="polite" className="mt-2 text-xs text-mist">
          {availability === "loading" ? "Проверяем свободное время…" : null}
          {availability === "error" ? "Не удалось проверить занятость — окончательная проверка будет при отправке." : null}
          {allTaken ? "На эту дату всё занято — выберите другой день." : null}
          {!allTaken && taken.length > 0 ? "Зачёркнутое время уже подтверждено за другим клиентом." : null}
        </p>
        {err("time_slot")}
      </fieldset>

      <fieldset aria-describedby={errors.contact_channel ? id("contact_channel-err") : undefined}>
        <legend className="field-label">Как с вами связаться</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_CHANNELS.map((ch, i) => (
            <label key={ch.id} className="cursor-pointer">
              <input type="radio" name="contact_channel" value={ch.id} checked={values.contact_channel === ch.id} onChange={() => update("contact_channel", ch.id)} className="peer sr-only" data-field={i === 0 ? "contact_channel" : undefined} />
              <span className={cn(chip, "border-line text-mist hover:border-caramel hover:text-cream peer-checked:border-caramel peer-checked:bg-caramel-600 peer-checked:text-cream-50")}>{ch.label}</span>
            </label>
          ))}
        </div>
        {err("contact_channel")}
      </fieldset>

      <div>
        <label htmlFor={id("comment")} className="field-label">Комментарий <span className="font-normal text-mist">(необязательно)</span></label>
        <textarea id={id("comment")} name="comment" rows={4} maxLength={500} className="field-input resize-y" value={values.comment} onChange={(e) => update("comment", e.target.value)} placeholder="Опыт, пожелания, вопросы…" {...a11y("comment")} />
        {err("comment")}
      </div>

      {/* Honeypot — скрыто от людей и скринридеров */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Сайт компании
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-cream-50/40 border-t-cream-50" />
              Отправляем…
            </>
          ) : (
            "Отправить заявку"
          )}
        </button>
        {contacts.whatsappPhone ? (
          <button type="button" onClick={openWhatsApp} disabled={busy} className="btn btn-secondary">
            <WhatsAppIcon /> Написать в WhatsApp
          </button>
        ) : null}
        {contacts.telegramUsername ? (
          <a href={telegramUrl(contacts.telegramUsername)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <TelegramIcon /> Telegram
          </a>
        ) : null}
      </div>

      <div aria-live="polite" className="min-h-0">
        {status.kind === "whatsapp_opened" ? (
          <div role="status" className="border border-caramel/40 bg-caramel/10 p-4 text-cream">
            WhatsApp открыт с готовым сообщением. Отправьте его — запись будет подтверждена только после ответа Альберта. (Через WhatsApp статус на сайте не отслеживается: для этого используйте кнопку «Отправить заявку».)
          </div>
        ) : null}
        {status.kind === "not_configured" ? (
          <div role="alert" className="border border-line bg-surface-2 p-4 text-cream">
            Онлайн-отправка заявок пока не подключена, поэтому заявка не отправлена. Свяжитесь с Альбертом через мессенджер или оставьте заявку позже.
          </div>
        ) : null}
        {status.kind === "error" ? <div role="alert" className="border border-red-400/40 bg-red-950/40 p-4 text-red-200">{status.message}</div> : null}
      </div>

      <p className="text-xs leading-relaxed text-mist">{content.booking.confirmationNote}</p>
    </form>
  );
}
