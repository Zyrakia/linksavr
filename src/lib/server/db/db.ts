import { env } from '$lib/server/env';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

const client = createClient({ url: env.DB_FILENAME });
export const db = drizzle(client, { schema, casing: 'snake_case' });
