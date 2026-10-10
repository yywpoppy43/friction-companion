import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { migrate as migrateProxy } from 'drizzle-orm/sqlite-proxy/migrator';
import * as schema from './schema';

/** Both ways of opening the database (a local file, or Turso over the network) speak the same SQLite dialect. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = BaseSQLiteDatabase<'async', any, typeof schema>;

const g = globalThis as unknown as { __counterRollDb?: Promise<Db> };

/** One database per process. Migrations run once, on first use, and are idempotent. */
export function getDb(): Promise<Db> {
  if (!g.__counterRollDb) g.__counterRollDb = init().catch((e) => { g.__counterRollDb = undefined; throw e; });
  return g.__counterRollDb;
}

const migrationsFolder = () => path.join(process.cwd(), 'drizzle');

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim() || 'file:./data/local.db';
  return url.startsWith('file:') ? openLocal(url.slice('file:'.length)) : openRemote(url);
}

/**
 * A local file, through the SQLite that ships inside Node.js. Nothing native to install, so it runs on
 * every computer Node runs on, including Windows on ARM where libsql has no build.
 */
async function openLocal(file: string): Promise<Db> {
  const sqliteModule = process.getBuiltinModule?.('node:sqlite');
  if (!sqliteModule) throw new Error('This version of Node.js has no built-in database. Install the current LTS version from https://nodejs.org and start the app again.');
  const target = file && file !== ':memory:' ? path.resolve(file) : ':memory:';
  if (target !== ':memory:') fs.mkdirSync(path.dirname(target), { recursive: true });
  const sqlite = new sqliteModule.DatabaseSync(target);

  type Method = 'run' | 'all' | 'values' | 'get';
  const db = drizzleProxy(async (query: string, params: unknown[], method: Method) => {
    const stmt = sqlite.prepare(query);
    const args = params.map((p) => (p === undefined ? null : p)) as (string | number | bigint | null | NodeJS.ArrayBufferView)[];
    if (method === 'run') { stmt.run(...args); return { rows: [] }; }
    stmt.setReturnArrays(true);
    if (method === 'get') return { rows: (stmt.get(...args) as unknown as unknown[] | undefined) ?? [] };
    // with setReturnArrays(true) every row is an array of values, which is what the proxy wants
    return { rows: stmt.all(...args) as unknown as unknown[][] };
  }, { schema });

  await migrateProxy(db, async (queries) => {
    sqlite.exec('BEGIN');
    try {
      for (const q of queries) sqlite.exec(q);
      sqlite.exec('COMMIT');
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  }, { migrationsFolder: migrationsFolder() });
  return db;
}

/** A hosted database (Turso), over the network. Loaded only when needed, so a machine without the libsql build never touches it. */
async function openRemote(url: string): Promise<Db> {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const { migrate } = await import('drizzle-orm/libsql/migrator');
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: migrationsFolder() });
  return db;
}
