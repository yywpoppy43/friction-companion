import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

export type Db = LibSQLDatabase<typeof schema>;

const g = globalThis as unknown as { __counterRollDb?: Promise<Db> };

/** One database per process. Migrations run once, on first use, and are idempotent. */
export function getDb(): Promise<Db> {
  if (!g.__counterRollDb) g.__counterRollDb = init().catch((e) => { g.__counterRollDb = undefined; throw e; });
  return g.__counterRollDb;
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim() || 'file:./data/local.db';
  if (url.startsWith('file:')) {
    const file = url.slice('file:'.length);
    if (file && file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  return db;
}
