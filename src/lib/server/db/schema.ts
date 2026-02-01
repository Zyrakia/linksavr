import { sql } from 'drizzle-orm';
import { sqliteTable, integer, customType, text, index } from 'drizzle-orm/sqlite-core';
import { sqlizeVector } from '../utils/sql-vectors';
import { LinkStatusValues } from '../../schemas/link';

const now = sql`(unixepoch())`;

export const float32Array = customType<{
	data: number[];
	config: { dimensions: number };
	configRequired: true;
	driverData: Buffer;
}>({
	dataType(config) {
		return `F32_BLOB(${config.dimensions})`;
	},

	fromDriver(value: Buffer) {
		return Array.from(new Float32Array(value.buffer, value.byteOffset, value.byteLength / 4));
	},

	toDriver(value: number[]) {
		return sqlizeVector(value);
	},
});

export const LinksTable = sqliteTable(
	'links',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		href: text().notNull().unique(),
		title: text().notNull(),
		faviconUrl: text(),
		imgUrl: text(),
		// 1024 for Mistral
		embedding: float32Array({ dimensions: 1024 }),
		content: text(),
		contentHash: text(),
		status: text({ enum: LinkStatusValues }).notNull().default('pending_fetch'),
		statusText: text(),
		retryCount: integer().notNull().default(0),
		maxRetries: integer().notNull().default(3),
		createdAt: integer({ mode: 'timestamp' }).notNull().default(now),
		embeddedAt: integer({ mode: 'timestamp' }),
		fetchedAt: integer({ mode: 'timestamp' }),
	},
	(table) => [
		index('link_embedding_vector_idx').on(sql`libsql_vector_idx(${table.embedding})`),
		index('link_hash_idx').on(table.contentHash),
		index('link_title_idx').on(table.title),
		index('link_status_idx').on(table.status, table.retryCount, table.createdAt),
	],
);
