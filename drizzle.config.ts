import { defineConfig } from 'drizzle-kit';

import './src/lib/server/env-config';
import { env } from './src/lib/server/env';

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	casing: 'snake_case',
	dbCredentials: {
		url: env.DB_FILENAME,
	},
});
