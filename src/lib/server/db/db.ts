import { env } from '$lib/server/env';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

const client = createClient({ url: env.DB_FILENAME });

const _db = drizzle(client, { schema, casing: 'snake_case' });

export type DatabaseClient = Omit<typeof _db, '$client' | 'batch'>;
export const db = _db as DatabaseClient;
