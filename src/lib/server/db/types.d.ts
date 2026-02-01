import type { LinksTable, LinkEmbeddingChunksTable } from './schema';

export type DatabaseLink = typeof LinksTable.$inferSelect;
export type DatabaseLinkInsert = typeof LinksTable.$inferInsert;

export type DatabaseEmbeddingChunk = typeof LinkEmbeddingChunksTable.$inferSelect;
export type DatabaseEmbeddingChunkInsert = typeof LinkEmbeddingChunksTable.$inferInsert;

/** The shape returned by list/paginate queries (excludes heavy fields). */
export type LinkListItem = Omit<DatabaseLink, 'content' | 'contentHash'>;
