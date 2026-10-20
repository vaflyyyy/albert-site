import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { BookingPayload } from "@/lib/booking";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { getDb, transaction, type Exec } from "../db";
import type { BookingAction, BookingRecord, TransitionResult } from "./types";

export class SlotTakenError extends Error {
  constructor() {
    super("slot_taken");
  }
}

// ---------- токены и идентификаторы ----------

const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // без похожих символов 0/O, 1/I/L

export function newBookingId(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += ID_ALPHABET[b % ID_ALPHABET.length];
  return `AE-${out}`;
}

/** 32 случайных байта → 43 символа base64url. В БД хранится только SHA-256 токена. */
export function newPublicToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ---------- маппинг ----------

type Row = Record<string, unknown>;

function toRecord(r: Row): BookingRecord {
  const status = isBookingStatus(r.status) ? r.status : "pending";
  return {
    id: String(r.id),
    name: String(r.customer_name),
    phone: String(r.customer_phone),
    service: String(r.service_id),
    preferred_date: String(r.requested_date),
    time_slot: String(r.requested_time),
    comment: String(r.comment ?? ""),
    contact_channel: String(r.contact_channel) as BookingPayload["contact_channel"],
    status,
    ownerNote: r.owner_note == null ? null : String(r.owner_note),
    telegramChatId: r.telegram_chat_id == null ? null : String(r.telegram_chat_id),
    telegramMessageId: r.telegram_message_id == null ? null : Number(r.telegram_message_id),
    promptMessageId: r.prompt_message_id == null ? null : Number(r.prompt_message_id),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

const now = () => new Date().toISOString();

function isUniqueViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : "";
  const code = String((e as { code?: unknown } | null)?.code ?? "");
  return /UNIQUE constraint failed/i.test(msg) || code === "SQLITE_CONSTRAINT_UNIQUE";
}

// ---------- чтение ----------

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const db = await getDb();
  const r = await db.get("SELECT * FROM bookings WHERE id = ?", [id]);
  return r ? toRecord(r) : null;
}

export async function getBookingByToken(token: string): Promise<BookingRecord | null> {
  const db = await getDb();
  const r = await db.get("SELECT * FROM bookings WHERE public_status_token_hash = ?", [hashToken(token)]);
  return r ? toRecord(r) : null;
}

export async function getBookingByPromptMessage(chatId: string, messageId: number): Promise<BookingRecord | null> {
  const db = await getDb();
  const r = await db.get("SELECT * FROM bookings WHERE prompt_message_id = ? AND telegram_chat_id = ?", [messageId, chatId]);
  return r ? toRecord(r) : null;
}

/** Слоты, занятые ПОДТВЕРЖДЁННЫМИ записями на дату (без персональных данных). */
export async function takenSlots(date: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.all("SELECT requested_time FROM bookings WHERE requested_date = ? AND status = 'confirmed'", [date]);
  return rows.map((r) => String(r.requested_time));
}

// ---------- запись ----------

async function slotHasConfirmed(db: Exec, date: string, slot: string, excludeId?: string): Promise<boolean> {
  const r = await db.get(
    "SELECT 1 AS x FROM bookings WHERE requested_date = ? AND requested_time = ? AND status = 'confirmed' AND id <> ? LIMIT 1",
    [date, slot, excludeId ?? ""],
  );
  return Boolean(r);
}

/** Создаёт запись со статусом pending. Бросает SlotTakenError, если слот уже подтверждён за другим клиентом. */
export async function createBooking(data: BookingPayload): Promise<{ booking: BookingRecord; token: string }> {
  const token = newPublicToken();
  const ts = now();
  return transaction(async (db) => {
    if (await slotHasConfirmed(db, data.preferred_date, data.time_slot)) throw new SlotTakenError();
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = newBookingId();
      try {
        await db.run(
          `INSERT INTO bookings (id, public_status_token_hash, customer_name, customer_phone, service_id,
             requested_date, requested_time, comment, contact_channel, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
          [id, hashToken(token), data.name, data.phone, data.service, data.preferred_date, data.time_slot, data.comment, data.contact_channel, ts, ts],
        );
        await db.run("INSERT INTO booking_events (booking_id, action, actor, at) VALUES (?, 'created', 'customer', ?)", [id, ts]);
        const row = await db.get("SELECT * FROM bookings WHERE id = ?", [id]);
        return { booking: toRecord(row as Row), token };
      } catch (e) {
        if (isUniqueViolation(e) && attempt < 4) continue; // коллизия id — пробуем другой
        throw e;
      }
    }
    throw new Error("id_generation_failed");
  });
}

export async function deleteBooking(id: string): Promise<void> {
  await transaction(async (db) => {
    await db.run("DELETE FROM bookings WHERE id = ?", [id]);
    await db.run("DELETE FROM booking_events WHERE booking_id = ?", [id]);
  });
}

export async function setTelegramMessage(id: string, chatId: string, messageId: number): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE bookings SET telegram_chat_id = ?, telegram_message_id = ? WHERE id = ?", [chatId, messageId, id]);
}

export async function setPromptMessage(id: string, messageId: number): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE bookings SET prompt_message_id = ?, updated_at = ? WHERE id = ?", [messageId, now(), id]);
}

export async function setOwnerNote(id: string, note: string): Promise<BookingRecord | null> {
  const ts = now();
  return transaction(async (db) => {
    await db.run("UPDATE bookings SET owner_note = ?, prompt_message_id = NULL, updated_at = ? WHERE id = ?", [note, ts, id]);
    await db.run("INSERT INTO booking_events (booking_id, action, actor, at) VALUES (?, 'note', 'owner', ?)", [id, ts]);
    const r = await db.get("SELECT * FROM bookings WHERE id = ?", [id]);
    return r ? toRecord(r) : null;
  });
}

const TRANSITIONS: Record<BookingAction, { to: BookingStatus; from: BookingStatus[] }> = {
  confirm: { to: "confirmed", from: ["pending", "reschedule_requested"] },
  reject: { to: "rejected", from: ["pending", "reschedule_requested", "confirmed"] },
  reschedule: { to: "reschedule_requested", from: ["pending", "reschedule_requested"] },
  cancel: { to: "cancelled", from: ["pending", "confirmed", "reschedule_requested"] },
};

/**
 * Атомарная смена статуса (в транзакции).
 * Повторное нажатие той же кнопки идемпотентно (unchanged: true).
 * Подтверждение невозможно, если слот уже занят другой подтверждённой записью.
 */
export async function transition(id: string, action: BookingAction, actor: string): Promise<TransitionResult> {
  const rule = TRANSITIONS[action];
  const ts = now();
  try {
    return await transaction(async (db): Promise<TransitionResult> => {
      const row = await db.get("SELECT * FROM bookings WHERE id = ?", [id]);
      if (!row) return { ok: false, reason: "not_found" };
      const current = toRecord(row);

      if (current.status === rule.to && action !== "reschedule") return { ok: true, booking: current, unchanged: true };
      if (!rule.from.includes(current.status)) return { ok: false, reason: "invalid_state", booking: current };

      if (action === "confirm" && (await slotHasConfirmed(db, current.preferred_date, current.time_slot, id))) {
        return { ok: false, reason: "slot_taken", booking: current };
      }

      await db.run("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?", [rule.to, ts, id]);
      await db.run("INSERT INTO booking_events (booking_id, action, actor, at) VALUES (?, ?, ?, ?)", [id, action, actor, ts]);
      const updated = await db.get("SELECT * FROM bookings WHERE id = ?", [id]);
      return { ok: true, booking: toRecord(updated as Row), unchanged: false };
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, reason: "slot_taken" }; // страховка: сработал уникальный индекс
    throw e;
  }
}

// ---------- лимиты запросов (в БД: переживают перезапуск) ----------

/** true, если лимит превышен. Ключ — уже обезличенный (хеш). */
export async function isRateLimited(bucket: string, max: number, windowMs: number): Promise<boolean> {
  const nowMs = Date.now();
  return transaction(async (db) => {
    await db.run("DELETE FROM rate_limits WHERE at < ?", [nowMs - 60 * 60 * 1000]);
    const row = await db.get("SELECT COUNT(*) AS c FROM rate_limits WHERE bucket = ? AND at >= ?", [bucket, nowMs - windowMs]);
    const count = Number(row?.c ?? 0);
    if (count >= max) return true;
    await db.run("INSERT INTO rate_limits (bucket, at) VALUES (?, ?)", [bucket, nowMs]);
    return false;
  });
}