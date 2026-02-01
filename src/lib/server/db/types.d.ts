import type { LinksTable } from './schema';

export type DatabaseLink = typeof LinksTable.$inferSelect;
export type DatabaseLinkInsert = typeof LinksTable.$inferInsert;

/** The shape returned by list/paginate queries (excludes heavy fields). */
export type LinkListItem = Omit<DatabaseLink, 'content' | 'contentHash' | 'embedding'>;
