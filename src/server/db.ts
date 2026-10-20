import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Client, InValue, ResultSet, Transaction } from "@libsql/client";

/**
 * Хранилище: Turso (SQLite в облаке) — работает на Netlify.
 * Если TURSO_DATABASE_URL не задан, локально используется файл DATABASE_PATH (по умолчанию data/bookings.sqlite).
 */
export type Row = Record<string, unknown>;

export interface Exec {
  get(sql: string, args?: InValue[]): Promise<Row | undefined>;
  all(sql: string, args?: InValue[]): Promise<Row[]>;
  run(sql: string, args?: InValue[]): Promise<void>;
}

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS bookings (
    id                       TEXT PRIMARY KEY,
    public_status_token_hash TEXT NOT NULL UNIQUE,
    customer_name            TEXT NOT NULL,
    customer_phone           TEXT NOT NULL,
    service_id               TEXT NOT NULL,
    requested_date           TEXT NOT NULL,
    requested_time           TEXT NOT NULL,
    comment                  TEXT NOT NULL DEFAULT '',
    contact_channel          TEXT NOT NULL,
    status                   TEXT NOT NULL
      CHECK (status IN ('pending','confirmed','rejected','reschedule_requested','cancelled')),
    owner_note               TEXT,
    telegram_chat_id         TEXT,
    telegram_message_id      INTEGER,
    prompt_message_id        INTEGER,
    created_at               TEXT NOT NULL,
    updated_at               TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_confirmed_slot
    ON bookings (requested_date, requested_time) WHERE status = 'confirmed'`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_slot ON bookings (requested_date, requested_time)`,
  `CREATE INDEX IF NOT EXISTS ix_bookings_prompt ON bookings (prompt_message_id)`,
  `CREATE TABLE IF NOT EXISTS booking_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    action     TEXT NOT NULL,
    actor      TEXT NOT NULL,
    at         TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ix_events_booking ON booking_events (booking_id)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT NOT NULL,
    at     INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ix_rate_limits ON rate_limits (bucket, at)`,
];

async function createDbClient(): Promise<Client> {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (url) {
    // web-версия клиента — чистый JS по HTTPS, без нативных модулей (подходит для Netlify)
    const { createClient } = await import("@libsql/client/web");
    return createClient({
      url: url.replace(/^libsql:\/\//, "https://"),
      authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
    });
  }
  if (process.env.NETLIFY || process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL не задан: на Netlify/Vercel нужна облачная база Turso.");
  }
  // Локальная разработка: файл на диске
  const { createClient } = await import("@libsql/client");
  const file = path.resolve(process.cwd(), process.env.DATABASE_PATH?.trim() || "data/bookings.sqlite");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: `file:${file}` });
}

function wrap(ex: Client | Transaction): Exec {
  const toObj = (rs: ResultSet, i: number): Row =>
    Object.fromEntries(rs.columns.map((c, idx) => [c, rs.rows[i][idx]]));
  return {
    async get(sql, args = []) {
      const rs = await ex.execute({ sql, args });
      return rs.rows.length ? toObj(rs, 0) : undefined;
    },
    async all(sql, args = []) {
      const rs = await ex.execute({ sql, args });
      return rs.rows.map((_, i) => toObj(rs, i));
    },
    async run(sql, args = []) {
      await ex.execute({ sql, args });
    },
  };
}

interface Ready {
  client: Client;
  exec: Exec;
}
type GlobalWithDb = typeof globalThis & { __albertDb?: Promise<Ready> };

async function init(): Promise<Ready> {
  const client = await createDbClient();
  await client.batch(SCHEMA, "write");
  return { client, exec: wrap(client) };
}

function ready(): Promise<Ready> {
  const g = globalThis as GlobalWithDb;
  if (!g.__albertDb) {
    g.__albertDb = init().catch((e) => {
      g.__albertDb = undefined; // чтобы следующий запрос попробовал снова
      throw e;
    });
  }
  return g.__albertDb;
}

export async function getDb(): Promise<Exec> {
  return (await ready()).exec;
}

/** Выполняет fn в транзакции (записи сериализуются). При ошибке — откат. */
export async function transaction<T>(fn: (db: Exec) => Promise<T>): Promise<T> {
  const { client } = await ready();
  const tx = await client.transaction("write");
  try {
    const result = await fn(wrap(tx));
    await tx.commit();
    return result;
  } catch (e) {
    try {
      await tx.rollback();
    } catch {
      /* транзакция уже закрыта */
    }
    throw e;
  } finally {
    tx.close();
  }
}