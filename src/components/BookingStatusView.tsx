"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { STATUS_INFO, type PublicBookingStatus } from "@/lib/booking-status";
import { formatDateRu } from "@/lib/booking";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";

const POLL_MS = 5000;
const MAX_BACKOFF_MS = 60000;

/**
 * Страница статуса записи. Данные приходят с сервера и обновляются опросом /api/bookings/status/<token>
 * (раз в 5 секунд, пока вкладка видна; при ошибках интервал растёт). Телефон и комментарий сюда не попадают.
 */
export function BookingStatusView({ token, initial }: { token: string; initial: PublicBookingStatus }) {
  const [booking, setBooking] = useState<PublicBookingStatus>(initial);
  const [stale, setStale] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [cancelState, setCancelState] = useState<"idle" | "confirming" | "busy" | "error">("idle");
  const failures = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/status/${token}`, { cache: "no-store" });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok) throw new Error("http");
      const json = (await res.json()) as { ok: boolean; booking?: PublicBookingStatus };
      if (!json.ok || !json.booking) throw new Error("shape");
      setBooking(json.booking);
      setStale(false);
      setLastChecked(new Date());
      failures.current = 0;
    } catch {
      failures.current += 1;
      setStale(true);
    }
  }, [token]);

  useEffect(() => {
    setLastChecked(new Date());
    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      const delay = Math.min(POLL_MS * 2 ** failures.current, MAX_BACKOFF_MS);
      timer.current = setTimeout(async () => {
        if (!document.hidden) await refresh();
        schedule();
      }, delay);
    };
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    schedule();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function cancel() {
    setCancelState("busy");
    try {
      const res = await fetch(`/api/bookings/status/${token}/cancel`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; booking?: PublicBookingStatus } | null;
      if (res.ok && json?.ok && json.booking) {
        setBooking(json.booking);
        setCancelState("idle");
      } else if (res.status === 409) {
        await refresh();
        setCancelState("idle");
      } else {
        setCancelState("error");
      }
    } catch {
      setCancelState("error");
    }
  }

  const info = STATUS_INFO[booking.status];
  const canCancel = booking.status === "pending" || booking.status === "confirmed" || booking.status === "reschedule_requested";

  return (
    <div className="panel p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow">Запись № {booking.reference}</p>
        <StatusBadge status={booking.status} />
      </div>

      <h1 className="mt-6 text-4xl leading-tight sm:text-5xl" aria-live="polite">{info.headline}</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-mist">{info.nextSteps}</p>

      {booking.ownerNote ? (
        <blockquote className="mt-6 border-l-2 border-caramel bg-night px-5 py-4">
          <p className="eyebrow mb-2">Предложение Альберта</p>
          <p className="whitespace-pre-line text-cream">{booking.ownerNote}</p>
        </blockquote>
      ) : null}

      <dl className="mt-8 grid gap-6 border-y border-line py-6 sm:grid-cols-3">
        <div>
          <dt className="eyebrow mb-1.5">Услуга</dt>
          <dd className="font-display text-2xl leading-snug">{booking.serviceTitle}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1.5">Желаемая дата</dt>
          <dd className="font-display text-2xl">{formatDateRu(booking.requestedDate)}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1.5">Время</dt>
          <dd className="font-display text-2xl">{booking.requestedTimeLabel}</dd>
        </div>
      </dl>

      <p className={cn("mt-5 text-xs", stale ? "text-red-300" : "text-mist")} role="status">
        {stale
          ? "Не удалось обновить статус — повторяем попытку. Проверьте интернет."
          : `Статус обновляется автоматически${lastChecked ? ` · проверено ${lastChecked.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}`}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {booking.status === "rejected" || booking.status === "reschedule_requested" || booking.status === "cancelled" ? (
          <Link href="/contact#booking" className="btn btn-primary">Оставить новую заявку</Link>
        ) : null}
        <Link href="/" className="btn btn-secondary">На главную</Link>

        {canCancel && cancelState === "idle" ? (
          <button type="button" onClick={() => setCancelState("confirming")} className="ml-auto text-sm text-mist underline underline-offset-4 hover:text-cream">
            Отменить запись
          </button>
        ) : null}
      </div>

      {cancelState === "confirming" || cancelState === "busy" || cancelState === "error" ? (
        <div role="alertdialog" aria-label="Подтверждение отмены" className="mt-6 border border-line bg-night p-5">
          <p className="text-cream">Отменить запись? Это действие нельзя отменить.</p>
          {cancelState === "error" ? <p className="mt-2 text-sm text-red-300">Не удалось отменить запись. Попробуйте ещё раз.</p> : null}
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={cancel} disabled={cancelState === "busy"} className="btn btn-primary !py-2.5">
              {cancelState === "busy" ? "Отменяем…" : "Да, отменить"}
            </button>
            <button type="button" onClick={() => setCancelState("idle")} disabled={cancelState === "busy"} className="btn btn-secondary !py-2.5">Нет, оставить</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
